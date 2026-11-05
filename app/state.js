// Presupuesto: state.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
const localData=BudgetStorage.create(()=>window.localStorage);
const STORE = 'budgetPlanner.v1';
// Usuarios: cada perfil guarda sus datos aparte (mismo link y misma clave)
const PROF_KEY = 'budgetPlanner.profiles', ACT_KEY = 'budgetPlanner.activeProfile';
let activeProfile = (() => { try { return localData.readText(ACT_KEY) === 'p2' ? 'p2' : 'p1'; } catch(e){ return 'p1'; } })();
let bothMode = false;
const storeKey = (id = activeProfile) => id === 'p1' ? STORE : STORE + '.' + id;
const PROF_DEFAULT = () => ({u:0, list:[{id:'p1', name:'Usuario 1', icon:'svg:user', color:'#5e81ac', photo:''}, {id:'p2', name:'Usuario 2', icon:'svg:user-round', color:'#b48ead', photo:''}]});
function validateProfilesData(o){
  if(!o||!Array.isArray(o.list)||o.list.length!==2||new Set(o.list.map(p=>p?.id)).size!==2||o.list.some(p=>!p||!['p1','p2'].includes(p.id)||typeof p.name!=='string'||p.icon!=null&&typeof p.icon!=='string'||p.photo!=null&&typeof p.photo!=='string'||p.color!=null&&!/^#[a-f\d]{6}$/i.test(p.color)))throw new Error('Perfiles inválidos');
  return o;
}
let profiles = (() => { try { return validateProfilesData(JSON.parse(localData.readText(PROF_KEY))); } catch(e){} return PROF_DEFAULT(); })();
function saveProfiles(touch){ if (touch) profiles.u = Date.now(); try { localData.writeText(PROF_KEY, JSON.stringify(profiles)); } catch(e){} }
const profOf = id => profiles.list.find(x => x.id === id) || profiles.list[0];
function seed(){
  const inc = [['Sueldo','svg:briefcase'],['Gratificación','svg:gift'],['CTS','svg:landmark'],['Bonos','svg:star'],['Otros ingresos','svg:plus']];
  const exp = [['Vivienda','svg:house'],['Alimentación','svg:shopping-cart'],['Transporte','svg:car'],['Servicios','svg:lightbulb'],['Salud','svg:stethoscope'],['Entretenimiento','svg:clapperboard'],['Ropa','svg:shirt'],['Educación','svg:book-open'],['Deudas / Tarjeta','svg:credit-card'],['Ahorro','svg:piggy-bank'],['Otros gastos','svg:package']];
  let i = 0;
  const mk = type => ([name,icon]) => ({id:uid()+i, name, icon, type, color:PALETTE[(i++)%PALETTE.length], defaultBudget:0});
  return {
    version:1,
    categories:[...inc.map(mk('income')), ...exp.map(mk('expense'))],
    budgets:{}, transactions:[],
    settings:{methods:['Efectivo','Débito','Tarjeta de crédito','Yape / Plin','Transferencia'], appIcon:'svg:coins', uiIcons:'vector', vecDone:true, pastelDone:true}
  };
}
function load(){ try{ const r = localData.readText(storeKey()); return r ? JSON.parse(r) : null; }catch(e){ return null; } }
var localSaveFailed=false,localTabChanged=false;
function saveLocal(){if(localTabChanged){localSaveFailed=true;return false;}try{localData.writeText(storeKey(),JSON.stringify(state));localSaveFailed=false;return true;}catch(e){localSaveFailed=true;toast('⚠️ No se pudo guardar en este dispositivo. Mantén la app abierta y libera espacio.');return false;}}
const qMicro = typeof queueMicrotask === 'function' ? f => queueMicrotask(f) : f => Promise.resolve().then(f);
let _txIdx = null;
/* Registro de cambios para sincronizar entre dispositivos: cada registro guarda cuándo cambió (u) y los borrados quedan anotados */
var _snapRec = null;
var SYNC_COLLS = ['categories', 'transactions', 'recurring', 'goals'];
var SYNC_SETTINGS = ['appName','appIcon','appColor','uiIcons','recSugHidden','vecDone','pastelDone','theme','monoColor','savePct','saveMode','savePctM','font','onboarded','lastClose','budgetCycle'];
function syncSettings(){ const o = {}; SYNC_SETTINGS.forEach(k => o[k] = state.settings[k]); return o; }
function recKey(r){ const o = Object.assign({}, r); delete o.u; return JSON.stringify(o); }
function snapState(){
  const m = new Map(), b = {};
  SYNC_COLLS.forEach(n => (state[n] || []).forEach(r => m.set(n + ':' + r.id, recKey(r))));
  Object.keys(state.budgets || {}).forEach(mm => Object.keys(state.budgets[mm] || {}).forEach(c => { b[mm + '|' + c] = state.budgets[mm][c]; }));
  return {m, b, s: JSON.stringify([syncSettings(), state.settings.methods || []]), o: (state.categories || []).map(c => c.id).join(',')};
}
function stampChanges(){
  if (!_snapRec){ _snapRec = snapState(); return; }
  const meta = state.meta = state.meta || {}; meta.del = meta.del || {}; meta.bu = meta.bu || {};
  const now = Date.now(), prev = _snapRec, cur = snapState(), seen = new Set();
  SYNC_COLLS.forEach(n => (state[n] || []).forEach(r => { const k = n + ':' + r.id; seen.add(k); if (prev.m.get(k) !== cur.m.get(k)) r.u = now; if (meta.del[r.id]) delete meta.del[r.id]; }));
  prev.m.forEach((v, k) => { if (!seen.has(k)) meta.del[k.slice(k.indexOf(':') + 1)] = now; });
  new Set([...Object.keys(prev.b), ...Object.keys(cur.b)]).forEach(k => { if (prev.b[k] !== cur.b[k]) meta.bu[k] = now; });
  if (prev.s !== cur.s) meta.su = now;
  if (prev.o !== cur.o) meta.co = now;
  _snapRec = cur;
}
function save(){ if(localTabChanged){toast('⚠️ Hay cambios en otra pestaña. Recarga antes de seguir editando.');return false;} _txIdx = null; stampChanges(); state.updatedAt = Date.now(); saveLocal(); schedulePush(); }

// Contrato común para respaldos y datos recibidos. Rechaza antes de cambiar la copia vigente.
function validateStateData(st){
  const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
  const fail=()=>{throw new Error('Datos inválidos: revisa registros, fechas y configuración');};
  const number=v=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));
  const id=v=>typeof v==='string'&&/^[\p{L}\p{N}_.:-]+$/u.test(v)&&!['__proto__','constructor','prototype'].includes(v);
  const month=v=>typeof v==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(v);
  const amount=(v,min=0)=>number(v)&&Number(v)>=min;
  const color=v=>typeof v==='string'&&/^#(?:[a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(v);
  function keys(value){if(!value||typeof value!=='object')return;for(const k of Object.keys(value)){if(['__proto__','constructor','prototype'].includes(k))fail();keys(value[k]);}}
  if(!object(st)||!Array.isArray(st.categories)||!Array.isArray(st.transactions))fail();
  keys(st);
  for(const name of ['categories','transactions','recurring','goals']){
    if(st[name]===undefined&&['recurring','goals'].includes(name))continue;
    if(!Array.isArray(st[name]))fail();const seen=new Set();
    for(const r of st[name]){
      if(!object(r)||!id(r.id)||seen.has(r.id))fail();seen.add(r.id);
      for(const k of ['name','icon','color','pay','archived','date','catId','method','desc','goalId','recId','start','deadline','prio'])if(r[k]!=null&&typeof r[k]!=='string')fail();
      for(const k of ['catId','goalId','recId'])if(r[k]&&!id(r[k]))fail();
      if(r.color&&!color(r.color))fail();
      if(r.archived&&!month(r.archived)||r.deadline&&!BudgetFinance.validDate(r.deadline)||r.start&&!month(r.start))fail();
      if(name==='categories'&&(typeof r.name!=='string'||!['income','expense'].includes(r.type)||r.defaultBudget!=null&&!amount(r.defaultBudget)))fail();
      if(name==='transactions'&&(!['income','expense'].includes(r.type)||!BudgetFinance.validDate(r.date)||!number(r.amount)||Number(r.amount)<=0))fail();
      if(name==='recurring'&&(!['income','expense'].includes(r.type)||!number(r.amount)||Number(r.amount)<=0||!Number.isInteger(Number(r.day))||Number(r.day)<1||Number(r.day)>31||r.skipped!=null&&(!Array.isArray(r.skipped)||r.skipped.some(m=>!month(m)))))fail();
      if(name==='recurring')for(const k of ['auto','active'])if(r[k]!=null&&typeof r[k]!=='boolean')fail();
      if(name==='goals'){
        if(['target','initial'].some(k=>r[k]!=null&&!amount(r[k]))||r.shared!=null&&typeof r.shared!=='boolean')fail();
        if(r.out!=null){if(!Array.isArray(r.out))fail();const withdrawals=new Set();for(const w of r.out){if(!object(w)||!number(w.a)||Number(w.a)<=0||!BudgetFinance.validDate(w.d)||w.n!=null&&typeof w.n!=='string'||w.id!=null&&(!id(w.id)||withdrawals.has(w.id)))fail();if(w.id)withdrawals.add(w.id);}}
      }
      if(name==='categories'&&r.pay?.startsWith('#')&&r.pay.slice(1).split(',').some(d=>!BudgetFinance.validDate(d)))fail();
    }
  }
  if(st.budgets!==undefined){if(!object(st.budgets))fail();for(const [m,values] of Object.entries(st.budgets)){if(!month(m)||!object(values))fail();for(const [k,v] of Object.entries(values))if(!id(k)||!amount(v))fail();}}
  if(st.settings!==undefined){
    const s=st.settings;if(!object(s))fail();
    for(const k of ['appName','appIcon','uiIcons','theme','font','saveMode','lastClose'])if(s[k]!=null&&typeof s[k]!=='string')fail();
    for(const k of ['appColor','monoColor'])if(s[k]&&!color(s[k]))fail();
    for(const k of ['onboarded','vecDone','pastelDone'])if(s[k]!=null&&typeof s[k]!=='boolean')fail();
    if(s.methods!=null&&(!Array.isArray(s.methods)||s.methods.some(m=>typeof m!=='string')))fail();
    if(s.recSugHidden!=null&&(!Array.isArray(s.recSugHidden)||s.recSugHidden.some(v=>!id(v))))fail();
    if(s.savePct!=null&&(!amount(s.savePct)||Number(s.savePct)>100))fail();
    if(s.savePctM!=null){if(!object(s.savePctM))fail();for(const [m,v] of Object.entries(s.savePctM))if(!/^(?:cycle(?:[1-9]|[12]\d|3[01]):)?\d{4}-(0[1-9]|1[0-2])$/.test(m)||!amount(v)||Number(v)>100)fail();}
    if(s.budgetCycle!=null){const c=s.budgetCycle;if(!object(c)||c.enabled!=null&&typeof c.enabled!=='boolean'||c.day!=null&&(!Number.isInteger(Number(c.day))||Number(c.day)<1||Number(c.day)>31))fail();if(c.defaults!=null){if(!object(c.defaults))fail();for(const [day,values] of Object.entries(c.defaults)){if(!/^(?:[1-9]|[12]\d|3[01])$/.test(day)||!object(values))fail();for(const [k,v] of Object.entries(values))if(!id(k)||!amount(v))fail();}}}
  }
  if(st.methods!=null&&(!Array.isArray(st.methods)||st.methods.some(m=>typeof m!=='string')))fail();
  if(st.meta!=null){if(!object(st.meta))fail();for(const k of ['del','bu'])if(st.meta[k]!=null&&!object(st.meta[k]))fail();}
  return st;
}
// Normaliza formatos locales antiguos; nunca convierte una fecha civil imposible en otra.
function cleanState(st){
  if (!st || typeof st !== 'object') return st;
  const arr = v => Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : [];
  st.categories = arr(st.categories); st.recurring = arr(st.recurring); st.goals = arr(st.goals);
  st.transactions = arr(st.transactions).map(t => {
    let d = t.date; if (typeof d !== 'string') d = d ? String(d) : '';
    if (!/^\d{4}-\d{2}-\d{2}/.test(d)){ const x = new Date(d); d = isNaN(x) ? '' : x.toISOString(); }
    t.date = d.slice(0, 10); t.amount = Number(t.amount) || 0; return t;
  }).filter(t => t.date);
  if (!st.budgets || typeof st.budgets !== 'object') st.budgets = {};
  validateStateData(st);return st;
}
let state = cleanState(load()) || seed();
if (!state.categories || !state.categories.length) state.categories = seed().categories;
state.settings = state.settings || {methods:[]}; state.recurring = state.recurring || []; state.goals = state.goals || [];
// Paso único a íconos vectoriales: convierte los emoji conocidos (categorías, metas y logo)
const EMOJI_V = {'💼':'briefcase','💰':'wallet','💵':'banknote','🎁':'gift','🏦':'landmark','⭐':'star','📈':'trending-up','🧾':'receipt','➕':'plus','🏠':'house','🛒':'shopping-cart','🍽':'utensils','☕':'coffee','🚗':'car','🚌':'bus','⛽':'fuel','🚕':'car-taxi-front','💡':'lightbulb','💧':'droplet','🔥':'flame','📱':'smartphone','🌐':'globe','📺':'tv','🩺':'stethoscope','💊':'pill','🏋':'dumbbell','🎬':'clapperboard','🎮':'gamepad-2','🎵':'music','✈':'plane','🏖':'umbrella','👕':'shirt','👟':'footprints','💇':'scissors','📚':'book-open','🎓':'graduation-cap','💻':'laptop','💳':'credit-card','🐷':'piggy-bank','🎯':'target','🐶':'dog','🐱':'cat','👶':'baby','❤':'heart','🎉':'party-popper','🛠':'wrench','🧹':'spray-can','🔧':'wrench','📦':'package','🏥':'hospital','🍔':'sandwich','🍺':'beer','🎟':'ticket','🧴':'spray-can','🎂':'cake','🏍':'motorbike','🅿':'square-parking','🚲':'bike','🧑‍💻':'laptop','📌':'pin','❔':'circle-help','🪙':'coins','✨':'sparkles','🏆':'trophy','📊':'chart-column','🍕':'pizza','🎮':'gamepad-2'};
const toVec = e => { if (!e || isVec(e)) return e; const k = String(e).replace(/\uFE0F/g, ''); return EMOJI_V[k] && VICONS[EMOJI_V[k]] ? 'svg:' + EMOJI_V[k] : e; };
function isVec(e){ return typeof e === 'string' && e.startsWith('svg:'); }
function migrateVec(){
  if (state.settings.vecDone) return false;
  state.categories.forEach(c => c.icon = toVec(c.icon));
  state.goals.forEach(g => g.icon = toVec(g.icon));
  state.settings.appIcon = toVec(state.settings.appIcon || 'svg:coins');
  state.settings.uiIcons = 'vector'; state.settings.vecDone = true;
  return true;
}
if (migrateVec()){ state.updatedAt = Date.now(); try{ localData.writeText(storeKey(), JSON.stringify(state)); }catch(e){} }


let currentMonth=ym(new Date());
