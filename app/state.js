// Presupuesto: state.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
const localData=BudgetStorage.create(()=>window.localStorage);
const STORE = 'budgetPlanner.v1';
// Usuarios: cada perfil guarda sus datos aparte (mismo link y misma clave)
const PROF_KEY = 'budgetPlanner.profiles', ACT_KEY = 'budgetPlanner.activeProfile';
let activeProfile = (() => { try { return localData.readText(ACT_KEY) === 'p2' ? 'p2' : 'p1'; } catch(e){ return 'p1'; } })();
let bothMode = false;
const storeKey = (id = activeProfile) => id === 'p1' ? STORE : STORE + '.' + id;
const PROF_DEFAULT = () => ({u:0, list:[{id:'p1', name:'Usuario 1', icon:'svg:user', color:'#5e81ac', photo:''}, {id:'p2', name:'Usuario 2', icon:'svg:user-round', color:'#b48ead', photo:''}]});
let profiles = (() => { try { const o = JSON.parse(localData.readText(PROF_KEY)); if (o && Array.isArray(o.list) && o.list.length === 2) return o; } catch(e){} return PROF_DEFAULT(); })();
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

// Limpia registros dañados para que un dato raro nunca impida abrir la app
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
  return st;
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
