// Presupuesto: sync.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Google Sheets ---------- */
const SYNC_KEY = 'budgetPlanner.sync';
let sync = (() => { try { return JSON.parse(localData.readText(SYNC_KEY)) || {}; } catch(e){ return {}; } })();
if (sync.auto === undefined) sync.auto = true;
// Estado de sincronización del usuario activo (cada perfil lleva su propia revisión y pendientes)
if (sync.byProf && sync.byProf[activeProfile]) Object.assign(sync, sync.byProf[activeProfile]);
else if (sync.byProf && activeProfile !== 'p1') Object.assign(sync, {rev:0, pending:false, lastSync:0});
// Link de conexión (#conectar=…): configura la sincronización y luego se borra de la barra de direcciones
(function(){
  const m = /[#&]conectar=([\w-]+)/.exec(location.hash || ''); if (!m) return;
  try {
    const b = m[1].split('-').join('+').split('_').join('/'), o = JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
    if (!o || !/^https:[/][/]script\.google\.com[/]/.test(o.u) || !o.t) throw new Error('link');
    const changed = sync.url !== o.u || sync.token !== o.t;
    sync.url = o.u; sync.token = o.t; if (changed){ sync.rev = 0; sync.byProf = {}; }
    try { localData.writeText(SYNC_KEY, JSON.stringify(sync)); } catch(e){}
    window.__connFromLink = changed ? 'new' : 'same';
  } catch(e){ window.__connFromLink = 'bad'; }
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
})();
const saveSync = () => { sync.byProf = sync.byProf || {}; sync.byProf[activeProfile] = {rev:Number(sync.rev) || 0, pending:!!sync.pending, lastSync:sync.lastSync || 0}; try { localData.writeText(SYNC_KEY, JSON.stringify(sync)); } catch(e){localSaveFailed=true;return false;}return true; };
const syncOn = () => !!(sync.url && sync.token);
let pushTimer = null, pushing = false, pushTask = null, changeSeq = 0;
const SYNC_TIMEOUT_MS = 30000;
const SYNC_RETRY_DELAYS = [5000, 15000, 30000, 60000, 60000];
let syncRetryTimer = null, syncRetryAttempt = 0;
function resetSyncRecovery(){ clearTimeout(syncRetryTimer); syncRetryTimer = null; syncRetryAttempt = 0; }
function scheduleSyncRecovery(err){
  if (!err.retryable || !syncOn() || !sync.auto || syncRetryTimer || syncRetryAttempt >= SYNC_RETRY_DELAYS.length) return;
  const connection = sync.url + '|' + sync.token, profile = activeProfile;
  const delay = SYNC_RETRY_DELAYS[syncRetryAttempt++];
  syncRetryTimer = setTimeout(async () => {
    syncRetryTimer = null;
    if (!syncOn() || !sync.auto || navigator.onLine === false || profile !== activeProfile || connection !== sync.url + '|' + sync.token) return;
    // Primero concilia con Sheets: un envío interrumpido puede haberse guardado en el servidor.
    await startupSync(); await pushOtherPending();
  }, delay);
}

function syncConflict(profile=activeProfile){return readSyncCache('conflict',profile);}
function setBadge(kind='local',text='Guardado en este dispositivo'){
 const b=$('#syncBadge');if(!b)return;
 if(localSaveFailed){kind='err';text='No se pudo guardar aquí';}
 else if(syncConflict()){kind='err';text='Cambios por revisar';}
 else if(syncConflict(otherProfile())){kind='err';text='Cambios por revisar de '+profOf(otherProfile()).name;}
 else if(!syncOn()){kind='local';text='Guardado en este dispositivo';}
 else if(navigator.onLine===false){kind='pending';text=sync.pending?'Guardado aquí · Sin conexión':'Sin conexión';}
 else if(sync.pending&&kind!=='busy'&&kind!=='err'){kind='pending';text='Pendiente de sincronizar';}
 text=text.replace(/^(☁️|⚠️)\s*/,'');b.hidden=false;b.className='sync-badge '+kind;b.title=text;b.setAttribute('aria-label',text+'. Ver estado del guardado');b.innerHTML='<span class="sb-t">'+esc(text)+'</span>';
}
function updateSyncInfo(err){
 const status=localSaveFailed?'No se pudo guardar en este dispositivo. Mantén la app abierta.':syncConflict()?'Hay cambios de dos dispositivos que necesitan revisión. Tu copia local se conserva.':!syncOn()?'Guardado en este dispositivo. Sin conectar a Sheets.':sync.pending?'Guardado en este dispositivo. Pendiente de confirmación en Sheets.':sync.lastSync?'Datos confirmados con Sheets.':'Guardado en este dispositivo. Sin confirmación de Sheets.';
 $('#syncInfo').textContent=status+(err?' '+err:'')+(sync.lastSync?' Última confirmación: '+new Date(sync.lastSync).toLocaleString('es-PE'):'');
 const button=$('#syncReview');if(button){button.hidden=!syncConflict()&&!syncConflict(otherProfile());button.textContent=syncConflict()?'Revisar cambios entre dispositivos':'Revisar cambios de '+profOf(otherProfile()).name;}renderConnBox();
}
// Link personal que trae la URL y la clave (la parte después de # nunca sale del dispositivo)
function connLink(){
  const raw = btoa(unescape(encodeURIComponent(JSON.stringify({u:sync.url, t:sync.token}))));
  return location.origin + location.pathname + '#conectar=' + raw.split('+').join('-').split('/').join('_').replace(/=+$/, '');
}
function renderConnBox(){
  const box = $('#connBox'); if (!box) return;
  const can = syncOn() && typeof window.__SCRIPT_URL !== 'string' && /^https?:$/.test(location.protocol);
  box.hidden = !can; if (!can) return;
  $('#connIc').innerHTML = ic('link'); $('#connLink').value = connLink(); $('#btnConnShare').hidden = !navigator.share;
}
$('#btnConnCopy').onclick = async () => {
  const i = $('#connLink');
  try { await navigator.clipboard.writeText(i.value); toast('Link copiado: guárdalo en tus notas', {icon:'link'}); }
  catch(e){ i.focus(); i.select(); toast('Mantén presionado el link para copiarlo'); }
};
$('#btnConnShare').onclick = () => { navigator.share({title:'Presupuesto · link de conexión', text:'Mi link para conectar Presupuesto (no compartir)', url:$('#connLink').value}).catch(() => {}); };
// Pide al navegador que no borre por su cuenta los datos de este dispositivo
async function askPersist(){
  const el = $('#persistInfo'); if (!el || !navigator.storage || !navigator.storage.persist) return;
  try {
    let p = await navigator.storage.persisted(); if (!p) p = await navigator.storage.persist();
    el.hidden = false; el.classList.toggle('ok', p);
    el.innerHTML = p ? ic('shield-check') + '<span>Datos de este dispositivo protegidos: el navegador no los borrará por su cuenta.</span>'
                     : ic('shield') + '<span>El navegador aún no protege los datos de este dispositivo. Instalar la app suele activarlo.</span>';
  } catch(e){}
}
window.addEventListener('appinstalled', () => setTimeout(askPersist, 800));
async function callSheets(payload){
  const url = sync.url, token = sync.token, profile = activeProfile;
  const controller = new AbortController(); let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => {
    const err = new Error('Sheets tardó demasiado. Tus cambios siguen guardados en este dispositivo.');
    err.retryable = true; reject(err); controller.abort();
  }, SYNC_TIMEOUT_MS); });
  let j;
  try {
    j = await Promise.race([timeout, (async () => {
      let res;
      try { res = await fetch(url, {method:'POST', signal:controller.signal, headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({token,profile,profiles,protocol:2,...payload})}); }
      catch(e){ const err = new Error('Sin conexión a Sheets. Tus cambios siguen en este dispositivo.'); err.retryable = true; throw err; }
      if (!res.ok){ const err = new Error('HTTP ' + res.status); err.retryable = res.status === 408 || res.status === 429 || res.status >= 500; throw err; }
      try { return await res.json(); } catch(e){ throw new Error('Respuesta inválida. Revisa la URL y que la implementación sea "Cualquier persona".'); }
    })()]);
  } finally { clearTimeout(timer); }
  if (sync.url !== url || sync.token !== token || (!payload.profile && activeProfile !== profile)) throw new Error('La conexión o el usuario cambió durante la sincronización.');
  if (!j || typeof j !== 'object') throw new Error('Respuesta inválida de Sheets.');
  if (!j.ok){ const err = new Error(j.error || 'Error del script'); err.code=j.code;err.remote=j.data; err.retryable = /lock timeout|timed out|too many times|try again/i.test(err.message); throw err; }
  const connectionKey=sync.url+'|'+sync.token;
  if(settingsVerifiedConnection!==connectionKey){
    settingsVerifiedConnection=connectionKey;
    const config=$('#settingsConnectionConfig');if(config&&config.setExpanded)config.setExpanded(false);
    renderSettingsStatus();
  }
  if(j.data)validateStateData(j.data);
  if(j.profiles?.list?.length)validateProfilesData(j.profiles);
  if (j.profiles && Array.isArray(j.profiles.list) && j.profiles.list.length === 2 && (Number(j.profiles.u) || 0) > (Number(profiles.u) || 0)){ profiles = j.profiles; saveProfiles(); renderProfileUI(); }
  return j;
}
var syncCacheMemory=new Map();
function syncCacheKey(kind,profile=activeProfile){return 'budgetPlanner.sync.'+kind+'.'+profile;}
function readSyncCache(kind,profile=activeProfile){const key=syncCacheKey(kind,profile);try{const value=JSON.parse(localData.readText(key)||'null')||syncCacheMemory.get(key);return value?.url===sync.url?value:null;}catch(e){return syncCacheMemory.get(key)||null;}}
function writeSyncCache(kind,value,profile=activeProfile){const key=syncCacheKey(kind,profile),data={...value,url:sync.url};syncCacheMemory.set(key,data);try{localData.writeText(key,JSON.stringify(data));return true;}catch(e){localSaveFailed=true;setBadge('err','No se pudo guardar aquí');return false;}}
function rememberSyncBase(data,rev,profile=activeProfile){return writeSyncCache('base',{data:SyncCore.clone(data),rev:Number(rev)||0},profile);}
function clearSyncConflict(profile=activeProfile){syncCacheMemory.delete(syncCacheKey('conflict',profile));localData.remove(syncCacheKey('conflict',profile));}
function acceptSyncRemote(remote,profile=activeProfile){
 if(!remote||!Array.isArray(remote.categories)||!Array.isArray(remote.transactions))throw new Error('Sheets devolvió datos incompletos. Se conserva la copia local.');
 validateStateData(remote);
 const base=readSyncCache('base',profile),local=SyncCore.clone(snapshot()),rev=Number(remote.rev)||0;
 if(rev<Math.max(Number(sync.rev)||0,Number(base?.rev)||0)){setBadge(sync.pending?'pending':'ok',sync.pending?'Pendiente de sincronizar':'Sincronizado');updateSyncInfo();return false;}
 const empty=!remote.categories.length&&!remote.transactions.length&&!remote.goals?.length;
 const seedCats=seed().categories;
 const fresh=!base&&!local.transactions.length&&!local.goals.length&&!local.recurring.length&&!Object.keys(local.budgets||{}).length&&local.categories.length===seedCats.length&&local.categories.every(c=>!c.defaultBudget&&!c.archived&&!c.pay&&seedCats.some(s=>s.type===c.type&&s.name===c.name));
 const result=empty?{data:local,conflicts:[]}:fresh?{data:remote,conflicts:[]}:SyncCore.reconcile(base?.data||null,local,remote);
 if(result.conflicts.length){writeSyncCache('conflict',{remote:SyncCore.clone(remote),rev},profile);sync.pending=true;saveSync();setBadge('err','Cambios por revisar');updateSyncInfo();return false;}
 sync.rev=rev;sync.pending=!SyncCore.same(result.data,remote);result.data.rev=rev;
 if(!applyRemote(result.data,sync.pending)){sync.pending=true;saveSync();setBadge('err','No se pudo guardar aquí');return false;}
 rememberSyncBase(remote,rev,profile);return true;
}
const syncReview=document.createElement('button');syncReview.id='syncReview';syncReview.type='button';syncReview.className='btn';syncReview.textContent='Revisar cambios entre dispositivos';syncReview.hidden=true;$('#syncInfo').insertAdjacentElement('afterend',syncReview);
const syncConflictDialog=document.createElement('dialog');syncConflictDialog.id='syncConflictDialog';syncConflictDialog.setAttribute('aria-labelledby','syncConflictTitle');document.body.append(syncConflictDialog);
function syncConflictLabel(item,remote){
 const [collection,id,field]=item.path,names={categories:'Categoría',transactions:'Movimiento',recurring:'Recurrente',goals:'Meta',budgets:'Presupuesto',settings:'Ajuste',methods:'Métodos de pago',categoryOrder:'Orden de categorías'};
 const fields={amount:'Importe',method:'Método de pago',desc:'Descripción',date:'Fecha',catId:'Categoría',name:'Nombre',type:'Tipo',classification:'Tipo y categoría',day:'Día',auto:'Registro automático',target:'Objetivo',initial:'Ahorro inicial',savePct:'Meta de ahorro',saveMode:'Forma de ahorro',budgetCycle:'Período',font:'Tipografía',theme:'Tema'};
 const record=(state[collection]||[]).find?.(r=>r.id===id)||(remote[collection]||[]).find?.(r=>r.id===id);
 if(collection==='budgets')return 'Presupuesto · '+id+' · '+getCat(item.path[2]?.replace(/^cycle\d+:/,'')).name;
 return (names[collection]||'Dato')+(record?' · '+(record.desc||record.name||getCat(record.catId).name):'')+(fields[field||id]?' · '+fields[field||id]:'');
}
function syncConflictValue(value,path=[]){
 if(typeof value==='number'&&(path[0]==='budgets'||['amount','target','initial','defaultBudget'].includes(path.at(-1))))return fmt(value);
 if(typeof value==='string'&&path.at(-1)==='catId')return (state.categories.find(c=>c.id===value)||syncConflict()?.remote?.categories?.find(c=>c.id===value)||getCat(value)).name;
 if(typeof value==='string'&&path.at(-1)==='date')return fmtDateLong(value);
 if(path[0]==='categoryOrder'&&Array.isArray(value))return value.map(id=>getCat(id).name).join(' → ');
 if(path.at(-1)==='classification'&&value)return (value.type==='income'?'Ingreso':'Gasto')+' · '+(state.categories.find(c=>c.id===value.catId)||syncConflict()?.remote?.categories?.find(c=>c.id===value.catId)||getCat(value.catId)).name;
 if(value===undefined)return 'Eliminado';if(value===null||value==='')return 'Sin especificar';
 if(typeof value==='boolean')return value?'Activado':'Desactivado';if(Array.isArray(value))return value.map(v=>syncConflictValue(v)).join(' · ')||'Sin elementos';
 if(typeof value==='object'){if('enabled' in value)return value.enabled?'Ciclo desde el día '+value.day:'Mes calendario';return [value.name||value.desc,value.date,value.amount!=null?fmt(value.amount):''].filter(Boolean).join(' · ')||'Configuración modificada';}return String(value);
}
function openSyncConflicts(){
 const saved=syncConflict();if(!saved)return;const result=SyncCore.reconcile(readSyncCache('base')?.data||null,snapshot(),saved.remote);
 if(!result.conflicts.length){clearSyncConflict();acceptSyncRemote(saved.remote);if(sync.auto)pushNow();return;}
 syncConflictDialog.innerHTML='<form id="syncConflictForm"><div class="dlg-head"><h3 id="syncConflictTitle">Revisar cambios · '+esc(profOf(activeProfile).name)+'</h3><button type="button" class="iconbtn" data-sync-conflict-close aria-label="Cerrar">'+ic('x')+'</button></div><div class="dlg-body"><p>Dos dispositivos modificaron el mismo dato. Elige qué conservar. Los cambios compatibles se combinan automáticamente.</p><div class="sync-conflict-list">'+result.conflicts.map((item,i)=>'<fieldset><legend>'+esc(syncConflictLabel(item,saved.remote))+'</legend>'+['local','remote'].map(side=>'<label><input type="radio" required name="choice'+i+'" value="'+side+'"><span><small>'+(side==='local'?'En este dispositivo':'En Sheets')+'</small><b>'+esc(syncConflictValue(item[side],item.path))+'</b></span></label>').join('')+'</fieldset>').join('')+'</div></div><div class="dlg-actions dlg-foot"><button type="button" class="btn" data-sync-conflict-close>Revisar después</button><button type="submit" class="btn primary">Conservar selección</button></div></form>';
 syncConflictDialog.querySelectorAll('[data-sync-conflict-close]').forEach(b=>b.onclick=()=>syncConflictDialog.close());
 const profile=activeProfile,url=sync.url;
 syncConflictDialog.querySelector('form').onsubmit=e=>{e.preventDefault();if(profile!==activeProfile||url!==sync.url){syncConflictDialog.close();return;}
  const form=new FormData(e.target),choices={};result.conflicts.forEach((item,i)=>choices[item.key]=form.get('choice'+i));
  const latest=SyncCore.reconcile(readSyncCache('base')?.data||null,snapshot(),saved.remote,choices);if(latest.conflicts.length){openSyncConflicts();return;}
  sync.rev=saved.rev;sync.pending=true;latest.data.rev=saved.rev;if(!applyRemote(latest.data,true))return;rememberSyncBase(saved.remote,saved.rev);clearSyncConflict();syncConflictDialog.close();changeSeq++;saveSync();setBadge('pending','Selección guardada aquí · Pendiente');updateSyncInfo();if(sync.auto)pushNow();
 };
 if(!syncConflictDialog.open)syncConflictDialog.showModal();
}
syncReview.onclick=async()=>{if(!syncConflict()&&syncConflict(otherProfile()))await switchProfile(otherProfile());openSyncConflicts();};
$('#syncBadge').onclick=()=>{if(syncConflict()||syncConflict(otherProfile()))return syncReview.onclick();showTab('settings');openSettingsSection('data',true);updateSyncInfo();};

const snapshot = () => ({categories:state.categories, transactions:state.transactions, budgets:state.budgets,
  recurring:state.recurring, goals:state.goals, methods:state.settings.methods || [],
  settings:syncSettings(), meta:state.meta || {}, updatedAt:state.updatedAt || Date.now()});
/* MERGE:start — fusión de datos entre dispositivos (idéntica en la app y en Codigo.gs) */
/* a = una versión, b = la otra (gana en empates). Cada registro lleva u = fecha de su último cambio.
   meta.del = borrados {id: fecha}, meta.bu = fecha por presupuesto "mes|categoría",
   meta.su = fecha de los ajustes, meta.co = fecha del orden de categorías. */
function mergeData(a, b) {
  a = a || {}; b = b || {};
  var ma = a.meta || {}, mb = b.meta || {}, now = Date.now(), KEEP = 180 * 864e5;
  var num = function (v) { return Number(v) || 0; };
  var del = {};
  [ma.del || {}, mb.del || {}].forEach(function (d) {
    Object.keys(d).forEach(function (k) { var t = num(d[k]); if (now - t < KEEP && (!(k in del) || t > del[k])) del[k] = t; });
  });
  var coll = function (name) {
    var map = {}, order = [];
    (a[name] || []).forEach(function (r) { if (!r || r.id == null) return; var k = String(r.id); if (!(k in map)) order.push(k); map[k] = r; });
    (b[name] || []).forEach(function (r) {
      if (!r || r.id == null) return; var k = String(r.id), x = map[k];
      if (!x) { order.push(k); map[k] = r; } else if (num(r.u) >= num(x.u)) map[k] = r;
    });
    return order.map(function (k) { return map[k]; }).filter(function (r) { var t = del[String(r.id)]; return !(t != null && t >= num(r.u)); });
  };
  var cats = coll('categories');
  // Orden de categorías: el del lado que lo cambió más recientemente
  var first = num(mb.co) >= num(ma.co) ? (b.categories || []) : (a.categories || []), pos = {};
  first.forEach(function (c, i) { if (c && !(String(c.id) in pos)) pos[String(c.id)] = i; });
  cats = cats.map(function (c, i) { return {c: c, i: i}; }).sort(function (x, y) {
    var px = String(x.c.id) in pos ? pos[String(x.c.id)] : 1e6 + x.i, py = String(y.c.id) in pos ? pos[String(y.c.id)] : 1e6 + y.i; return px - py;
  }).map(function (x) { return x.c; });
  // Presupuestos por mes y categoría
  var flat = function (d) { var o = {}; Object.keys(d || {}).forEach(function (m) { Object.keys(d[m] || {}).forEach(function (c) { o[m + '|' + c] = d[m][c]; }); }); return o; };
  var fa = flat(a.budgets), fb = flat(b.budgets), ua = ma.bu || {}, ub = mb.bu || {}, budgets = {}, bu = {}, keys = {};
  [fa, fb, ua, ub].forEach(function (o) { Object.keys(o).forEach(function (k) { keys[k] = 1; }); });
  Object.keys(keys).forEach(function (k) {
    var ta = num(ua[k]), tb = num(ub[k]), v;
    if (tb >= ta) v = (k in fb) ? fb[k] : (tb > 0 ? undefined : fa[k]);
    else v = (k in fa) ? fa[k] : undefined;
    var t = Math.max(ta, tb), has = v !== undefined && v !== null && v !== '';
    if (t && (has || now - t < KEEP)) bu[k] = t;
    if (has) { var i = k.indexOf('|'), m = k.slice(0, i), c = k.slice(i + 1); (budgets[m] = budgets[m] || {})[c] = v; }
  });
  var sb = num(mb.su) >= num(ma.su) && b.settings ? b : a;
  return {
    categories: cats, transactions: coll('transactions'), recurring: coll('recurring'), goals: coll('goals'), budgets: budgets,
    methods: (Array.isArray(sb.methods) ? sb.methods : (Array.isArray(a.methods) ? a.methods : (Array.isArray(b.methods) ? b.methods : []))), settings: sb.settings || a.settings || b.settings || {},
    meta: {del: del, bu: bu, su: Math.max(num(ma.su), num(mb.su)), co: Math.max(num(ma.co), num(mb.co))},
    updatedAt: Math.max(num(a.updatedAt), num(b.updatedAt))
  };
}
/* MERGE:end */

function applyRemote(d, keepSync){
  const previousCycleEnabled=cycleEnabled(),previousCycleDay=cycleDay();
  validateStateData(d);
  d = cleanState(d);
  state.meta = d.meta && typeof d.meta === 'object' ? d.meta : (state.meta || {});
  state.categories = d.categories; state.transactions = d.transactions || []; state.budgets = d.budgets || {};
  if (Array.isArray(d.methods)) state.settings.methods = d.methods;
  if (Array.isArray(d.recurring)) state.recurring = d.recurring;
  if (Array.isArray(d.goals)) state.goals = d.goals;
  if(d.settings&&typeof d.settings==='object')SYNC_SETTINGS.forEach(k=>{if(Object.prototype.hasOwnProperty.call(d.settings,k))state.settings[k]=d.settings[k];else delete state.settings[k];});
  if(['dashboard','budget'].includes(activeTab())&&(previousCycleEnabled!==cycleEnabled()||previousCycleDay!==cycleDay())){currentMonth=cycleEnabled()?cycleMonthForDate():thisMonth();monthInput.value=currentMonth;}
  state.updatedAt = d.updatedAt || Date.now();
  if (d.rev != null) sync.rev = Number(d.rev) || 0;
  if (!keepSync){sync.pending=false;sync.lastSync=Date.now();}
  saveSync();
  _snapRec = snapState(); _txIdx = null;
  if (migrateVec()) setTimeout(save, 0);
  const persisted=saveLocal();renderAll();updateSyncInfo();return persisted;
}
function pushNow(){
  if (pushTask) return pushTask;
  pushTask = performPush().finally(() => { pushTask = null; });
  return pushTask;
}
async function performPush(){
 if(!syncOn()||localTabChanged)return false;clearTimeout(pushTimer);const profile=activeProfile,connection=sync.url+'|'+sync.token;let succeeded=false;pushing=true;
 const valid=()=>profile===activeProfile&&connection===sync.url+'|'+sync.token;
 try{
  if(syncConflict()){setBadge('err','Cambios por revisar');updateSyncInfo();return false;}
  if(navigator.onLine===false){const err=new Error('Se enviará al recuperar la conexión.');err.retryable=true;throw err;}
  // Verifica siempre el servidor y su revisión antes de escribir, incluso al reintentar.
  const loaded=await callSheets({action:'load'});if(loaded.protocol!==2)throw new Error('Actualiza Codigo.gs y su implementación para activar la sincronización protegida.');
  if(!valid())return false;
  if(!acceptSyncRemote(loaded.data,profile))return false;
  if(!sync.pending){setBadge('ok','Sincronizado');updateSyncInfo();return true;}
  const sent=SyncCore.clone(snapshot()),seq=changeSeq,base=Number(sync.rev)||0;setBadge('busy','Enviando a Sheets…');
  const res=await callSheets({action:'save',data:sent,base});if(!valid())return false;
  if(res.protocol!==2||!Number.isInteger(res.rev)||res.rev<=base)throw new Error('Sheets no confirmó el guardado. Se conserva el pendiente.');
  if(res.rev<Number(sync.rev)){setBadge(sync.pending?'pending':'ok',sync.pending?'Pendiente de sincronizar':'Sincronizado');updateSyncInfo();return true;}
  rememberSyncBase(sent,res.rev,profile);sync.rev=res.rev;sync.lastSync=Date.now();
  sync.pending=seq!==changeSeq||!SyncCore.same(snapshot(),sent);saveSync();
  setBadge(sync.pending?'pending':'ok',sync.pending?'Guardado aquí · Pendiente de sincronizar':'Sincronizado');updateSyncInfo();resetSyncRecovery();succeeded=true;return true;
 }catch(err){
  if(!valid())return false;
  sync.pending=true;saveSync();
  if(err.code==='REV_CONFLICT'&&err.remote){acceptSyncRemote(err.remote,profile);if(!syncConflict()){err.retryable=true;succeeded=true;}}
  setBadge(syncConflict()?'err':err.retryable?'pending':'err',syncConflict()?'Cambios por revisar':err.retryable?'Guardado aquí · Pendiente de sincronizar':'Sin confirmar en Sheets');updateSyncInfo(err.code==='REV_CONFLICT'?null:err.message);scheduleSyncRecovery(err);return false;
 }finally{pushing=false;if(valid()&&succeeded&&sync.pending&&sync.auto&&!syncConflict()){clearTimeout(pushTimer);pushTimer=setTimeout(pushNow,1200);}}
}
function schedulePush(){
 changeSeq++;if(!syncOn()){setBadge();updateSyncInfo();return;}
 sync.pending=true;saveSync();setBadge('pending','Guardado aquí · Pendiente de sincronizar');updateSyncInfo();
 if(!sync.auto||syncConflict())return;clearTimeout(pushTimer);pushTimer=setTimeout(pushNow,1200);
}
const startupTasks=new Map();
async function startupSync(){
 if(!syncOn())return;const key=activeProfile+'|'+sync.url+'|'+sync.token;if(startupTasks.has(key))return startupTasks.get(key);
 const task=startupLoad().finally(()=>startupTasks.delete(key));startupTasks.set(key,task);return task;
}
async function startupLoad(){
 const profile=activeProfile,connection=sync.url+'|'+sync.token;
 try{
  if(syncConflict()){setBadge('err','Cambios por revisar');updateSyncInfo();return;}
  setBadge('busy','Consultando Sheets…');
  const j=await callSheets({action:'load'});if(j.protocol!==2)throw new Error('Actualiza Codigo.gs y su implementación para activar la sincronización protegida.');
  if(profile!==activeProfile||connection!==sync.url+'|'+sync.token)return;
  if(!acceptSyncRemote(j.data,profile))return;
  if(sync.pending){setBadge('pending','Guardado aquí · Pendiente de sincronizar');if(sync.auto&&!await pushNow())return false;}
  else setBadge('ok','Sincronizado');updateSyncInfo();return true;
 }catch(err){if(profile!==activeProfile||connection!==sync.url+'|'+sync.token)return;setBadge('err','Sin confirmar en Sheets');updateSyncInfo(err.message);scheduleSyncRecovery(err);}
}

$('#btnSyncConnect').onclick=async()=>{
 const url=$('#syncUrl').value.trim(),token=$('#syncToken').value.trim();if(!/^https:\/\/script\.google\.com\/.+\/exec/.test(url))return toast('La URL debe ser de script.google.com y terminar en /exec');if(!token)return toast('Ingresa la clave');
 resetSyncRecovery();if(url!==sync.url||token!==sync.token){sync.rev=0;sync.lastSync=0;sync.byProf={};for(const pr of profiles.list){localData.remove(syncCacheKey('base',pr.id));localData.remove(syncCacheKey('conflict',pr.id));syncCacheMemory.delete(syncCacheKey('base',pr.id));syncCacheMemory.delete(syncCacheKey('conflict',pr.id));}}
 sync.url=url;sync.token=token;sync.auto=$('#syncAuto').checked;sync.pending=true;saveSync();await startupSync();
};
$('#btnSyncPush').onclick = async () => {
  if (!syncOn()) return toast('Primero conecta tu hoja');
  changeSeq++; sync.pending=true;saveSync();
  const ok=await pushNow();toast(ok&&!sync.pending?'Datos confirmados en Sheets':syncConflict()?'Revisa los cambios de ambos dispositivos':'Los cambios siguen pendientes de confirmación');
};
$('#btnSyncPull').onclick=async()=>{if(!syncOn())return toast('Primero conecta tu hoja');await startupSync();};
$('#syncAuto').addEventListener('change', e => { sync.auto = e.target.checked; saveSync(); resetSyncRecovery(); if (sync.auto && sync.pending) pushNow(); });
window.addEventListener('online', () => { resetSyncRecovery(); if (syncOn() && sync.auto) startupSync().then(pushOtherPending); });
window.addEventListener('pagehide',()=>{if(!localTabChanged){saveLocal();saveSync();}});
window.addEventListener('storage',e=>{if(e.key!==storeKey()||!e.newValue||localTabChanged)return;localTabChanged=true;
 const dialog=document.createElement('dialog');dialog.className='sync-tab-dialog';dialog.innerHTML='<h3>Hay cambios en otra pestaña</h3><p>Esta pestaña quedó desactualizada y dejará de guardar. Puedes descargar su copia antes de cargar los datos nuevos.</p><div class="dlg-actions"><button type="button" class="btn" data-tab-copy>Descargar esta copia</button><button type="button" class="btn primary" data-tab-reload>Cargar datos nuevos</button></div>';document.body.append(dialog);dialog.oncancel=e=>e.preventDefault();dialog.querySelector('[data-tab-copy]').onclick=()=>download('presupuesto-pestana-'+todayISO()+'.json',JSON.stringify(state,null,2),'application/json');dialog.querySelector('[data-tab-reload]').onclick=()=>location.reload();dialog.showModal();setBadge('err','Cambios en otra pestaña');
});
window.addEventListener('offline',()=>{setBadge('pending','Sin conexión');updateSyncInfo();});
// Abierta desde el enlace de Apps Script (celular): la URL de sincronización se completa sola
const FROM_SCRIPT = typeof window.__SCRIPT_URL === 'string' && /^https:[/][/]script\.google\.com[/]/.test(window.__SCRIPT_URL);
if (FROM_SCRIPT && !sync.url){ sync.url = window.__SCRIPT_URL; saveSync(); }
$('#syncUrl').value = sync.url || ''; $('#syncToken').value = sync.token || ''; $('#syncAuto').checked = sync.auto;
