// Presupuesto: profiles.js — ver README.md del proyecto para responsabilidades y orden de carga.
/* ---------- Usuarios: cambiar de perfil, editarlos y vista «Ambos» ---------- */
function avatarHTML(pr){ return /^data:image\//.test(pr.photo || '') ? `<img src="${esc(pr.photo)}" alt="">` : iconHTML(pr.icon || 'svg:user', pr.color); }
function avatarBox(pr, cls = ''){ return `<span class="prof-av ${cls}" style="background:${pr.photo ? 'transparent' : soft(pr.color)}">${avatarHTML(pr)}</span>`; }
function renderProfileUI(){
  const chip = $('#profChip'); if (!chip) return;
  if (bothMode){ $('#profAv').className = 'prof-av both'; $('#profAv').style.background = ''; $('#profAv').innerHTML = ic('users'); $('#profNm').textContent = 'Ambos'; }
  else { const pr = profOf(activeProfile); $('#profAv').className = 'prof-av'; $('#profAv').style.background = pr.photo ? 'transparent' : soft(pr.color); $('#profAv').innerHTML = avatarHTML(pr); $('#profNm').textContent = pr.name; }
  $('#profCv').innerHTML = ic('chevron-down'); chip.title = 'Usuario: ' + (bothMode ? 'Ambos' : profOf(activeProfile).name) + ' · tocar para cambiar';
  if ($('#tab-settings').classList.contains('active')) renderProfEdit();
}
const profMenu = document.createElement('div'); profMenu.className = 'prof-menu'; profMenu.hidden = true; profMenu.id = 'profileMenu'; profMenu.setAttribute('role', 'menu'); profMenu.setAttribute('aria-label', 'Cambiar de usuario'); document.body.appendChild(profMenu);
function renderProfMenu(){
  const on = id => !bothMode && id === activeProfile;
  profMenu.innerHTML = profiles.list.map(pr => `<button type="button" role="menuitem" data-prof="${esc(pr.id)}" class="${on(pr.id) ? 'on' : ''}">${avatarBox(pr)}<span>${esc(pr.name)}</span>${on(pr.id) ? ic('check') : ''}</button>`).join('')
    + `<button type="button" role="menuitem" data-prof="both" class="${bothMode ? 'on' : ''}"><span class="prof-av both">${ic('users')}</span><span>Ambos <small>· solo lectura</small></span>${bothMode ? ic('check') : ''}</button><hr>`
    + `<button type="button" role="menuitem" data-prof="edit"><span class="prof-av plain">${ic('pencil')}</span><span>Editar usuarios</span></button>`;
}
const profileTrigger = $('#profChip');
profileTrigger.setAttribute('aria-haspopup', 'menu');
profileTrigger.setAttribute('aria-controls', profMenu.id);
function closeProfMenu(restoreFocus = false){
  profMenu.hidden = true;
  profMenu.inert = true;
  profileTrigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) profileTrigger.focus({preventScroll:true});
}
function openProfMenu(last = false){
  renderProfMenu();
  profMenu.hidden = false;
  profMenu.inert = false;
  const r = profileTrigger.getBoundingClientRect(), w = profMenu.offsetWidth;
  const below = innerHeight - r.bottom - 16, above = r.top - 16;
  const openAbove = below < profMenu.scrollHeight && above > below;
  profMenu.style.maxHeight = Math.max(0, openAbove ? above : below) + 'px';
  profMenu.style.top = (openAbove ? r.top - profMenu.offsetHeight - 8 : r.bottom + 8) + 'px';
  const left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w));
  profMenu.style.left = left + 'px';
  profMenu.style.transformOrigin = Math.max(0,Math.min(w,r.left+r.width/2-left))+'px '+(openAbove?'bottom':'top');
  profileTrigger.setAttribute('aria-expanded', 'true');
  const items = profMenu.querySelectorAll('button');
  items[last ? items.length - 1 : 0]?.focus({preventScroll:true});
}
profileTrigger.onclick = e => {
  e.stopPropagation();
  if (profMenu.hidden) openProfMenu();
  else closeProfMenu(true);
};
$('#bothBody').addEventListener('click',e=>{
  if(!e.target.closest('[data-choose-profile]'))return;
  e.stopPropagation();
  profileTrigger.scrollIntoView({block:'nearest'});
  profileTrigger.click();
});
profileTrigger.addEventListener('keydown', e => {
  if (!['ArrowDown','ArrowUp'].includes(e.key)) return;
  e.preventDefault();
  openProfMenu(e.key === 'ArrowUp');
});
document.addEventListener('click', e => { if (!profMenu.hidden && !profMenu.contains(e.target)) closeProfMenu(); });
profMenu.addEventListener('keydown', e => {
  if (e.key === 'Tab'){ closeProfMenu(true); return; }
  if (e.key === 'Escape'){ e.preventDefault(); closeProfMenu(true); return; }
  if (!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return;
  e.preventDefault();
  const items = [...profMenu.querySelectorAll('button')], current = items.indexOf(document.activeElement);
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (current + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
  items[next]?.focus();
});
window.addEventListener('resize', () => { if (!profMenu.hidden) closeProfMenu(); });
profMenu.addEventListener('click', e => {
  const b = e.target.closest('[data-prof]'); if (!b) return; closeProfMenu(true);
  const id = b.dataset.prof;
  if (id === 'edit'){ showTab('settings'); openSettingsSection('users', true); return; }
  switchProfile(id);
});
function loadProfileState(){
  localRecovery=null;state = readState();
  if (!state.categories || !state.categories.length) state.categories = seed().categories;
  state.settings = state.settings || {methods:[]}; state.recurring = state.recurring || []; state.goals = state.goals || [];
  if (!state.updatedAt) saveLocal();
  _txIdx = null; _snapRec = snapState();
  if(localRecovery)setTimeout(showLocalRecovery,0);
}
let switching = false, otherPush = null;
// Si el otro usuario dejó cambios sin subir en este dispositivo (p. ej. se cambió de usuario sin internet), se suben en segundo plano
function pushOtherPending(){
 if(otherPush)return otherPush;const other=otherProfile(),bp=(sync.byProf||{})[other];if(!syncOn()||!sync.auto||!bp?.pending||syncConflict(other))return Promise.resolve(false);
 otherPush=(async()=>{try{
  const loaded=await callSheets({action:'load',profile:other});if(loaded.protocol!==2)throw new Error('Actualiza Apps Script para sincronizar de forma protegida.');
  const st=profileState(other);if(!st)return false;const snap=SyncCore.clone(withState(st,()=>snapshot())),base=readSyncCache('base',other),remote=loaded.data;
  if(!remote||!Array.isArray(remote.categories))throw new Error('Respuesta incompleta de Sheets');
  const result=!remote.categories.length?{data:snap,conflicts:[]}:SyncCore.reconcile(base?.data||null,snap,remote);
  if(result.conflicts.length){writeSyncCache('conflict',{remote,rev:remote.rev},other);return false;}
  const sent=result.data,res=await callSheets({action:'save',profile:other,data:sent,base:Number(remote.rev)||0});if(res.protocol!==2||!Number.isInteger(res.rev)||res.rev<=Number(remote.rev||0))throw new Error('Sin confirmación de Sheets');
  const latest=profileState(other),latestSnap=SyncCore.clone(withState(latest,()=>snapshot()));const rebased=SyncCore.reconcile(snap,latestSnap,sent);if(rebased.conflicts.length)throw new Error('El otro perfil cambió durante el envío');
  const d=rebased.data;['categories','transactions','recurring','goals','budgets','meta'].forEach(k=>latest[k]=d[k]);latest.settings={...latest.settings,...d.settings,methods:d.methods};localData.writeText(storeKey(other),JSON.stringify(latest));rememberSyncBase(sent,res.rev,other);
  sync.byProf[other]={rev:res.rev,pending:!SyncCore.same(d,sent),lastSync:Date.now()};saveSync();_oth=null;return true;
 }catch(err){if(err.code==='REV_CONFLICT'&&err.remote){/* La siguiente conciliación leerá la revisión nueva, sin escribir sobre ella. */}scheduleSyncRecovery({...err,retryable:err.retryable||err.code==='REV_CONFLICT'});return false;}})().finally(()=>{otherPush=null;if(!pushing)setBadge(sync.pending?'pending':sync.lastSync?'ok':'local',sync.pending?'Pendiente de sincronizar':sync.lastSync?'Sincronizado':'Guardado en este dispositivo');updateSyncInfo();});return otherPush;
}
async function switchProfile(id){
  if (switching) return;
  if (id === 'both'){ if (!bothMode) enterBoth(); return; }
  if (bothMode && id === activeProfile){ bothMode = false; document.body.classList.remove('both-on'); renderProfileUI(); showTab('dashboard'); renderAll(); return; }
  if (id === activeProfile) return;
  switching = true;
  try {
    if (otherPush) await otherPush;
    // Antes de cambiar, se suben los cambios pendientes del usuario actual
    if (syncOn() && (sync.pending || pushing)) { try { await pushNow(); } catch(e){} }
    if (document.querySelector('dialog[open]')) return;
    resetSyncRecovery(); clearTimeout(pushTimer);
    if(!saveLocal())return;saveSync();
    const wasCycle = cycleView();
    const calendarMonth = wasCycle ? cycleCalendarMonths[activeProfile] || thisMonth() : currentMonth;
    if (wasCycle) cycleSelectedMonths[activeProfile] = currentMonth;
    activeProfile = id; try { localData.writeText(ACT_KEY, id); } catch(e){}
    const bp = (sync.byProf || {})[id] || {}; sync.rev = Number(bp.rev) || 0; sync.pending = !!bp.pending; sync.lastSync = bp.lastSync || 0;
    loadProfileState(); _doneSet = null; _oth = null; otherAt = 0;
    $('#settingsMethods').resetEditor();
    if (selMode) setSelMode(false);
    cycleCalendarMonths[id] = calendarMonth;
    currentMonth = cycleView() ? cycleSelectedMonths[id] || cycleMonthForDate() : calendarMonth;
    monthInput.value = currentMonth;
    if (bothMode){ bothMode = false; document.body.classList.remove('both-on'); }
    Object.keys(numMemo).forEach(k => delete numMemo[k]); resetBars();
    renderProfileUI(); if (activeTab() === 'both') showTab('dashboard'); renderAll(); updateSyncInfo();
    { const mw = document.querySelector('main.wrap'); if (mw){ mw.classList.remove('prof-swap'); void mw.offsetWidth; mw.classList.add('prof-swap'); } }
    if (syncOn()) setBadge('busy', '☁️ Conectando…'); else {setBadge();updateSyncInfo();}
    toast(`Ahora ves: ${profOf(id).name}`, {icon:'user'});
  } finally { switching = false; }
  const connection = sync.url+'|'+sync.token;
  if (syncOn()) await startupSync();
  if (id !== activeProfile || connection !== sync.url+'|'+sync.token || localRecovery || localTabChanged) return;
  refreshOther();
}
// Edición de usuarios en Ajustes
let photoFor = null;
function renderProfEdit(){
  renderSettingsHome();
  const box = $('#profEdit'); if (!box) return;
  box.innerHTML = profiles.list.map(pr => `<div class="pe-row" data-pid="${esc(pr.id)}">
    <button type="button" class="prof-av lg" data-pe="icon" title="Cambiar ícono y color" style="background:${pr.photo ? 'transparent' : soft(pr.color)}">${avatarHTML(pr)}</button>
    <input type="text" class="pe-name" data-pe="name" maxlength="24" value="${esc(pr.name)}" aria-label="Nombre del usuario">
    <button type="button" class="btn sm" data-pe="photo" title="${pr.photo ? 'Cambiar foto' : 'Usar una foto'}">${ic('camera')}<span class="hide-m">${pr.photo ? 'Cambiar foto' : 'Foto'}</span></button>
    ${pr.photo ? `<button type="button" class="btn sm ghost" data-pe="nophoto" title="Quitar foto y usar ícono">${ic('x')}</button>` : ''}
    ${!bothMode && pr.id === activeProfile ? '<span class="pe-cur">En uso</span>' : ''}</div>`).join('');
}
function commitProfiles(){ saveProfiles(true); renderProfileUI(); renderProfEdit(); if (syncOn()) schedulePush(); }
$('#profEdit').addEventListener('click', e => {
  const b = e.target.closest('[data-pe]'), row = e.target.closest('[data-pid]'); if (!b || !row) return;
  const pr = profOf(row.dataset.pid);
  if (b.dataset.pe === 'icon') openIcon(icon => { pr.icon = icon; pr.photo = ''; commitProfiles(); }, {color:pr.color, soft:true, onColor: col => { pr.color = col; commitProfiles(); }}, pr.icon || 'svg:user');
  else if (b.dataset.pe === 'photo'){ photoFor = pr.id; $('#profPhoto').value = ''; $('#profPhoto').click(); }
  else if (b.dataset.pe === 'nophoto'){ pr.photo = ''; commitProfiles(); }
});
$('#profEdit').addEventListener('change', e => {
  const i = e.target.closest('[data-pe="name"]'); if (!i) return;
  const pr = profOf(i.closest('[data-pid]').dataset.pid), v = i.value.trim().slice(0, 24) || (pr.id === 'p1' ? 'Usuario 1' : 'Usuario 2');
  if (v !== pr.name){ pr.name = v; commitProfiles(); toast('Nombre actualizado', {icon:'user'}); }
});
// La foto se reduce a 160 × 160 px para que viaje liviana a Sheets
function readPhoto(file){ return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { const S = 160, c = document.createElement('canvas'); c.width = c.height = S; const k = Math.max(S / img.width, S / img.height), w = img.width * k, h = img.height * k;
    c.getContext('2d').drawImage(img, (S - w) / 2, (S - h) / 2, w, h); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82)); };
  img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); }; img.src = url; }); }
$('#profPhoto').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f || !photoFor) return;
  try { const pr = profOf(photoFor); pr.photo = await readPhoto(f); commitProfiles(); toast('Foto actualizada', {icon:'camera'}); }
  catch(err){ toast('⚠️ No se pudo leer esa imagen'); }
});
// Vista «Ambos»: resumen de solo lectura que suma a los dos usuarios
function profileState(id){ if (id === activeProfile) return state; try { const r = localData.readText(storeKey(id)); return r ? cleanState(JSON.parse(r)) : null; } catch(e){ return null; } }
function withState(st, fn){ const prev = state; state = st; _txIdx = null; try { return fn(); } finally { state = prev; _txIdx = null; } }
let chBoth = null, bothPeriodMode='profiles';
function bothUsesCycles(){return bothPeriodMode==='profiles'&&profiles.list.some(pr=>profileState(pr.id)?.settings?.budgetCycle?.enabled===true);}
function bothPeriod(m){
 const cycle=bothPeriodMode==='profiles'&&cycleEnabled();
 const period=cycle?cyclePeriod(m):{start:m+'-01',end:dateFor(m,31)};
 return {...period,cycle,label:cycle?'Ciclo · '+cycleLabel(m):'Mes calendario · '+monthLong(m)};
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-both-period]');if(!button)return;bothPeriodMode=button.dataset.bothPeriod;renderBoth();planningHeader();enhanceAccessibility();document.querySelector(`[data-both-period="${bothPeriodMode}"]`)?.focus({preventScroll:true});});
function bothProfileColors(){
  const base=cssVar('--primary'),surface=cssVar('--surface');
  const ratio=(a,b)=>(Math.max(hexLum(a),hexLum(b))+.05)/(Math.min(hexLum(a),hexLum(b))+.05);
  let second=base;for(let amount=.4;amount>=0;amount-=.05){second=mixHex(base,surface,amount);if(ratio(second,surface)>=3.1)break;}
  return [base,second];
}
function sharedGoalsCard(){
  const sts = {}; profiles.list.forEach(pr => sts[pr.id] = profileState(pr.id));
  const list = profiles.list.flatMap(pr => ((sts[pr.id] && sts[pr.id].goals) || []).filter(g => g.shared).map(g => ({g, owner:pr.id})));
  if (!list.length) return '';
  const today = todayISO();
  const colors=bothProfileColors();
  return `<div class="card both-goals"><h3>Metas compartidas · acumulado</h3>${list.map(({g, owner}) => {
    const sp = {p1:0, p2:0}; profiles.list.forEach(pr => { const st = sts[pr.id]; if (st) sp[pr.id] += sum((st.transactions || []).filter(t => t.goalId === g.id && !(t.date > today))); });
    sp[owner] += Number(g.initial || 0);
    const tot = sp.p1 + sp.p2, saved = tot - goalOut(g), tg = Number(g.target) || 0, pct = tg ? Math.min(100, saved / tg * 100) : 0;
    return `<div class="bg-row"><div class="ico" style="background:${soft(g.color)}">${iconHTML(g.icon, g.color)}</div><div style="min-width:0">
      <div class="bg-top"><b>${esc(g.name)}</b></div>
      <div class="both-goal-summary"><strong>${fmt(saved)}</strong><span class="muted">de ${fmt(tg)}</span><b>${pct.toFixed(0)}%</b></div>
      <div class="gsp-bar">${profiles.list.map((pr,i) => `<i style="width:${tg ? (sp[pr.id] / Math.max(tg, tot) * 100).toFixed(1) : 0}%;background:${colors[i]}"></i>`).join('')}</div>
      <div class="both-goal-contributions">${profiles.list.map((pr,i) => `<div><span><i style="background:${colors[i]}"></i>${esc(pr.name)}</span><b>${fmt(sp[pr.id])}</b><small>${tot>0?(sp[pr.id]/tot*100).toFixed(1)+'% del acumulado':'Sin aportes'}</small></div>`).join('')}</div>${goalOut(g)>0?`<div class="small muted">Retirado: ${fmt(goalOut(g))}</div>`:''}</div></div>`; }).join('')}</div>`;
}
async function enterBoth(){
  if(cycleView())cycleSelectedMonths[activeProfile]=currentMonth;
  bothMode = true; document.body.classList.add('both-on'); renderProfileUI(); showTab('both');
  { const mw = document.querySelector('main.wrap'); if (mw){ mw.classList.remove('prof-swap'); void mw.offsetWidth; mw.classList.add('prof-swap'); } }
  refreshOther(true);
}
// Sheets guarda los métodos fuera de settings: se rearma la copia local igual que applyRemote, sin perder métodos ni ajustes locales.
function otherStateFromRemote(id,data){
  validateStateData(data);
  const prev = profileState(id) || {}, d = cleanState(SyncCore.clone(data)), settings = {...(prev.settings || {})};
  if (d.settings && typeof d.settings === 'object') SYNC_SETTINGS.forEach(k => { if (Object.prototype.hasOwnProperty.call(d.settings, k)) settings[k] = d.settings[k]; else delete settings[k]; });
  if (Array.isArray(d.methods)) settings.methods = d.methods; else if (!Array.isArray(settings.methods)) settings.methods = [];
  const out = {...prev, categories:d.categories, transactions:d.transactions || [], budgets:d.budgets || {}, recurring:Array.isArray(d.recurring) ? d.recurring : (prev.recurring || []), goals:Array.isArray(d.goals) ? d.goals : (prev.goals || []), meta:d.meta && typeof d.meta === 'object' ? d.meta : (prev.meta || {}), settings, updatedAt:d.updatedAt || Date.now()};
  if (d.rev != null) out.rev = d.rev;
  delete out.methods; return out;
}
// Trae lo último del otro usuario desde Sheets (para «Ambos» y las metas compartidas), como máximo cada minuto
let otherAt = 0;
async function refreshOther(force){
  const other = otherProfile(), bp = (sync.byProf || {})[other] || {};
  if (!syncOn() || bp.pending || syncConflict(other) || (!force && Date.now() - otherAt < 60000)) return;
  try{if(localData.readText(storeKey(other))!==null&&!profileState(other))return;}catch(e){return;}
  otherAt = Date.now();
  try {
    const j = await callSheets({action:'load', profile:other});
    if (j.protocol===2 && j.data && Array.isArray(j.data.categories) && j.data.categories.length && other === otherProfile()){
      if(sync.byProf?.[other]?.pending||syncConflict(other)||Number(j.data.rev)<Number(sync.byProf?.[other]?.rev||0))return;
      try { localData.writeText(storeKey(other),JSON.stringify(otherStateFromRemote(other,j.data))); }catch(e){localSaveFailed=true;setBadge('err','No se pudo guardar aquí');updateSyncInfo();return;}
      rememberSyncBase(j.data,j.data.rev,other);
      sync.byProf = sync.byProf || {}; sync.byProf[other] = {rev:Number(j.data.rev) || 0, pending:false, lastSync:Date.now()}; saveSync();
      _oth = null; dirty.add('goals'); dirty.add('both');
      if (bothMode) renderBoth(); else if (activeTab() === 'goals') renderView('goals');
    }
  } catch(e){}
}
function renderBoth(){
  const m = currentMonth, box = $('#bothBody'); if (!box) return;
  const cycles=bothUsesCycles(),hasCycles=profiles.list.some(pr=>profileState(pr.id)?.settings?.budgetCycle?.enabled===true);
  planningHeader();
  const opened=new Set([...box.querySelectorAll('[data-both-metric][open]')].map(d=>d.dataset.bothMetric)),extraOpen=box.querySelector('#bothExtra')?.open,colors=bothProfileColors();
  const months = Array.from({length:6}, (_, i) => shiftMonth(m, i - 5));
  const rows = profiles.list.map(pr => {
    const st = profileState(pr.id);
    if (!st) return {pr, empty:true, inc:0, exp:0, saved:0, rate:null, series:months.map(() => 0), top:[]};
    return withState(st, () => {
      const period=bothPeriod(m),txs=period.cycle?cycleTx(m):txOfMonth(m),inc=sum(txs.filter(t=>t.type==='income')),exp=sum(txs.filter(t=>t.type==='expense')),sv=period.cycle?cycleSavings(m):savingsOf(m),balance=period.cycle?cycleBalance(m):balanceOfMonth(m);
      const periods=months.map(mm=>bothPeriod(mm)),series=months.map((mm,i)=>sum((periods[i].cycle?cycleTx(mm):txOfMonth(mm)).filter(t=>t.type==='expense')));
      const top = txs.filter(t => t.type === 'expense').map(t => { const c = getCat(t.catId); return {t, c:{name:c.name, icon:c.icon, color:c.color}}; });
      return {pr,period,periods,inc,exp,cash:balance.total,previous:balance.previous,saved:sv.saved||0,rate:sv.rate,series,top};
    });
  });
  const T = k => rows.reduce((a, r) => a + (r[k] || 0), 0), inc = T('inc'), exp = T('exp'), saved = T('saved'), bal = T('cash');
  const perProfile=(key,total,percentage=false)=>rows.map(r=>`<div class="metric-detail-row"><span>${esc(r.pr.name)}</span><b>${fmt(r[key]||0)}${percentage&&total>0?` <small>${((r[key]||0)/total*100).toFixed(1)}%</small>`:''}</b></div>`).join('');
  const kpi = (lbl, icon, val, sub, cls, style) => `<details class="card kpi metric-disclosure ${cls}" data-both-metric="${esc(lbl)}"${opened.has(lbl)?' open':''}><summary><div class="label"><span class="dot" style="${style}">${ic(icon)}</span>${lbl}</div><div class="value">${val}</div><span class="metric-chevron" aria-hidden="true">${ic('chevron-down')}</span></summary><div class="metric-expanded"><div class="metric-details">${sub}</div></div></details>`;
  const top = rows.flatMap(r => r.top.map(x => ({...x, pr:r.pr}))).sort((a, b) => b.t.amount - a.t.amount).slice(0, 5), shared = sharedGoalsCard();
  box.innerHTML = `<div class="both-head"><h2>Ambos · ${cycles?'cierre de ':''}${monthLong(m)}</h2><div class="both-access"><span class="small muted">Solo lectura</span><button type="button" class="btn sm" data-choose-profile>Elegir perfil</button></div></div>
    ${hasCycles?`<div class="both-period-controls"><div class="seg" role="group" aria-label="Períodos de Ambos"><button type="button" data-both-period="profiles" aria-pressed="${bothPeriodMode==='profiles'}" class="${bothPeriodMode==='profiles'?'active':''}">Según cada usuario</button><button type="button" data-both-period="calendar" aria-pressed="${bothPeriodMode==='calendar'}" class="${bothPeriodMode==='calendar'?'active':''}">Mes calendario</button></div><p class="small muted">${cycles?'Se suman los períodos indicados debajo de cada usuario; sus fechas pueden ser distintas.':'Ambos usuarios se comparan del primer al último día del mes.'} Solo cuentan movimientos realizados.</p></div>`:''}
    <div class="period-overview"><div><span>Resultado conjunto ${cycles?'de los períodos':'del mes'}</span><strong class="${inc-exp<0?'neg':''}">${fmt(inc-exp)}</strong><small>Ingresos menos gastos registrados</small></div></div>
    <div class="kpis dashboard-kpis both-kpis">
      ${kpi('Ingresos de ambos', 'arrow-down', fmt(inc), perProfile('inc',inc,true), 'k-inc', 'background:var(--income-soft);color:var(--income)')}
      ${kpi('Gastos de ambos', 'arrow-up', fmt(exp), perProfile('exp',exp,true), 'k-exp', 'background:var(--expense-soft);color:var(--expense)')}
      ${kpi('Saldo acumulado conjunto', 'scale', `<span class="${bal >= 0 ? 'pos' : 'neg'}">${fmt(bal)}</span>`,perProfile('cash',bal)+`<p class="small muted">${cycles?'Cada saldo se calcula hasta el final de su propio período.':'Saldos acumulados hasta el final del mes.'} Los movimientos futuros no se incluyen.</p><div class="metric-detail-row"><span>Saldo anterior</span><b>${fmt(T('previous'))}</b></div><div class="metric-detail-row"><span>Resultado ${cycles?'de los períodos':'del mes'}</span><b>${fmt(inc-exp)}</b></div>`, '', '--k:var(--k-blue)')}
      ${kpi('Ahorro conjunto', 'piggy-bank', fmt(saved),perProfile('saved',saved)+`<div class="small muted">${inc > 0 ? `${(saved / inc * 100).toFixed(1)}% de los ingresos de ambos` : 'Sin ingresos registrados'}</div>`, '', '--k:var(--k-violet)')}
    </div>
    <div class="grid2 top">
      <div class="card"><h3>Por usuario</h3><div class="both-users">${rows.map(r => `<div class="bu-row" data-both-profile="${esc(r.pr.id)}">${avatarBox(r.pr)}<div style="min-width:0"><div class="bu-name"><span>${esc(r.pr.name)}</span>${r.empty ? '<span class="small muted">sin datos aún</span>' : ''}</div><p class="both-user-period">${r.period?esc(r.period.label):'Sin datos disponibles'}</p>
        <div class="bu-stats"><div>Ingresos<b class="pos">${fmt(r.inc)}</b></div><div>Gastos<b>${fmt(r.exp)}</b></div><div>Balance<b class="${r.inc - r.exp >= 0 ? 'pos' : 'neg'}">${fmt(r.inc - r.exp)}</b></div><div>Ahorro<b>${r.rate != null ? r.rate.toFixed(1) + '%' : '—'}</b></div></div></div></div>`).join('')}
        <div class="small muted" style="margin-top:4px">Parte de los gastos seleccionados</div><div class="bu-share">${rows.map((r,i) => `<i style="width:${exp>0?(r.exp / exp * 100).toFixed(1):0}%;background:${colors[i]}"></i>`).join('')}</div><div class="both-share-legend">${rows.map((r,i)=>`<div><span><i style="background:${colors[i]}"></i>${esc(r.pr.name)}</span><b>${exp>0?(r.exp/exp*100).toFixed(1)+'%':'—'}</b></div>`).join('')}</div></div></div>
      <div class="card"><h3 id="bothChartTitle">Gastos de ambos · últimos 6 ${cycles?'cierres':'meses'}</h3>${cycles?'<p class="small muted">Cada serie respeta el período de su usuario.</p>':''}<div class="chart-wrap" id="bothWrap"><canvas id="chBoth"></canvas></div></div>
    </div>
    <details class="both-extra" id="bothExtra"${extraOpen?' open':''}><summary>Más detalle · ${shared?'Metas compartidas y ':''}Top 5 gastos ${ic('chevron-down')}</summary><div class="both-bottom">${shared}
    <div class="card both-top"><h3>Top 5 gastos ${cycles?'de los períodos':'del mes'} de ambos</h3>${top.length ? top.map((x,i) => `<div class="prow"><span class="both-rank">${i+1}</span>${avatarBox(x.pr)}<div class="pn"><b title="${esc(x.t.desc || x.c.name)}">${esc(x.t.desc || x.c.name)}</b><span title="${esc(x.pr.name+' · '+x.c.name)}">${esc(x.pr.name)} · ${esc(x.c.name)}</span><time datetime="${esc(x.t.date)}">${fmtDateLong(x.t.date)}</time></div><b class="both-top-amount">${fmt(x.t.amount)}</b></div>`).join('') : '<div class="small muted">Aún no hay gastos en los períodos seleccionados.</div>'}</div></div></details>`;
  requestAnimationFrame(fitMetricValues);
  if (chBoth){ chBoth.destroy(); chBoth = null; }
  if (!loadChartFor($('#bothWrap'))) return;
  chartTheme();
  chBoth = new Chart($('#chBoth'), {type:'bar', plugins:[legendGap],
    data:{labels:months.map(m=>innerWidth<=700?monthAbbr(m):monthShort(m)), datasets:rows.map((r,i) => ({label:r.pr.name, data:r.series, backgroundColor:colors[i], hoverBackgroundColor:colors[i], borderRadius:5, borderSkipped:'start', maxBarThickness:24, barPercentage:.85, categoryPercentage:.7, periods:r.periods}))},
    options:{maintainAspectRatio:false, animation:stagger(), interaction:{mode:'index', intersect:false},
      plugins:{legend:LEGEND, tooltip:{callbacks:{label: c => [` ${c.dataset.label}: ${fmt(c.parsed.y)}`,c.dataset.periods?.[c.dataIndex]?.label||'Sin datos disponibles'], footer: items => 'Total: ' + fmt(items.reduce((a, i) => a + i.parsed.y, 0))}}},
      scales:{x:{stacked:false, grid:{display:false}, border:{display:false}}, y:{stacked:false, beginAtZero:true, afterBuildTicks:trimTicks, grid:{color:cssVar('--border')}, border:{display:false}, ticks:{callback:compactS, maxTicksLimit:5, padding:8}}}}});
}
