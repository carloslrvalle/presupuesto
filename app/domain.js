// Presupuesto: domain.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Helpers de datos ---------- */
const getCat = id => state.categories.find(c => c.id === id) || {id:null, name:'Sin categoría', icon:'svg:circle-help', color:'#94a3b8'};
const catsOf = type => state.categories.filter(c => c.type === type);
// Categorías activas (para elegir en formularios, presupuesto y sugerencias); las archivadas siguen en reportes si tienen datos
const isArch = (c, m) => !!(c && c.archived && (!m || m >= c.archived));
const catsActive = type => catsOf(type).filter(c => !c.archived);
// Programado = movimiento con fecha futura: se muestra, pero no cuenta como gastado/cobrado hasta su fecha
const isPlanned = t => t.date > todayISO();
// Índice de movimientos por mes: se arma una vez por tarea (o tras save) en lugar de recorrer todo en cada consulta
function txIndex(){
  const tx = state.transactions;
  if (_txIdx && _txIdx.src === tx && _txIdx.n === tx.length) return _txIdx;
  const all = new Map(), real = new Map(), today = todayISO();
  for (const t of tx){ const m = t.date.slice(0, 7); (all.get(m) || all.set(m, []).get(m)).push(t); if (!(t.date > today)) (real.get(m) || real.set(m, []).get(m)).push(t); }
  _txIdx = {src:tx, n:tx.length, all, real}; qMicro(() => { _txIdx = null; });
  return _txIdx;
}
const txOfMonthAll = m => (txIndex().all.get(m) || []).slice();
const txOfMonth = m => (txIndex().real.get(m) || []).slice();
const plannedOf = (m, type, catId) => sum(txOfMonthAll(m).filter(t => isPlanned(t) && (!type || t.type === type) && (!catId || t.catId === catId)));
const sum = arr => arr.reduce((a,t) => a + Number(t.amount||0), 0);
// Un ingreso con día de pago en ciertos meses o fechas exactas solo se espera en esos meses
const payActive = (c, m) => { if (!c || c.type !== 'income' || !c.pay) return true; const g = payCfg(c.pay);
  return g.mode === 'months' ? g.months.includes(Number(m.slice(5, 7))) : g.mode === 'dates' ? g.dates.some(d => d.slice(0, 7) === m) : true; };
const getBudget = (m, catId) => { const cc = state.categories.find(x => x.id === catId); if (cc && (!payActive(cc, m) || isArch(cc, m))) return 0; const b = state.budgets[m]; if (b && b[catId] != null) return Number(b[catId]); return Number(getCat(catId).defaultBudget || 0); };
const realBy = (m, catId) => sum(txOfMonth(m).filter(t => t.catId === catId));
const totalBudget = (m, type) => catsOf(type).reduce((a,c) => a + getBudget(m, c.id), 0);
/* ---------- Planificación por ciclo de sueldo (sin cambiar las fechas reales) ---------- */
function cycleConfig(){ return state.settings.budgetCycle || {}; }
function cycleDay(){ const n=Number(cycleConfig().day); return Number.isInteger(n)&&n>=1&&n<=31?n:25; }
function cycleEnabled(){ return cycleConfig().enabled === true; }
function cycleView(name=activeTab()){ return !bothMode && cycleEnabled() && ['dashboard','budget'].includes(name); }
function dateOffset(iso,n){return BudgetFinance.dateOffset(iso,n);}
function cyclePeriod(m,day=cycleDay()){return BudgetFinance.cyclePeriod(m,day);}
function cycleMonthForDate(date=todayISO(),day=cycleDay()){return BudgetFinance.cycleMonthForDate(date,day);}
function cycleLabel(m){ const p=cyclePeriod(m);return fmtDateLong(p.start)+' – '+fmtDateLong(p.end); }
function cycleBudgetKey(id){ return 'cycle'+cycleDay()+':'+id; }
function cycleBudget(m,id){
  const key=cycleBudgetKey(id),budgets=state.budgets;
  if(Object.prototype.hasOwnProperty.call(budgets[m]||{},key))return Number(budgets[m][key])||0;
  const base=(cycleConfig().defaults||{})[cycleDay()];
  if(base&&Object.prototype.hasOwnProperty.call(base,id))return Number(base[id])||0;
  const previous=Object.keys(budgets).filter(x=>x<m&&Object.prototype.hasOwnProperty.call(budgets[x]||{},key)).sort().pop();
  return previous?Number(budgets[previous][key])||0:getBudget(cyclePeriod(m).start.slice(0,7),id);
}
function ensureCyclePlan(m){
  if(!cycleView())return;
  let changed=false;const out=state.budgets[m]||(state.budgets[m]={});
  state.categories.forEach(c=>{const key=cycleBudgetKey(c.id);if(!Object.prototype.hasOwnProperty.call(out,key)){out[key]=cycleBudget(m,c.id);changed=true;}});
  if(changed)save();
}
function cycleTx(m,all=false){const p=cyclePeriod(m);return BudgetFinance.transactions(state.transactions,p.start,p.end,todayISO(),all);}
function cycleReal(m,id){return sum(cycleTx(m).filter(t=>t.catId===id));}
function cycleTotal(m,type){return catsOf(type).filter(c=>!isArch(c,cyclePeriod(m).start.slice(0,7))||cycleReal(m,c.id)).reduce((s,c)=>s+cycleBudget(m,c.id),0);}
function cyclePlanned(m,type,id){return sum(cycleTx(m,true).filter(t=>isPlanned(t)&&(!type||t.type===type)&&(!id||t.catId===id)));}
function cycleSavings(m){const txs=cycleTx(m);return BudgetFinance.savings(txs,{savingIds:state.categories.filter(c=>isSavingCat(c.id)).map(c=>c.id),mode:saveMode(),pct:Number((state.settings.savePctM||{})[cycleBudgetKey(m)]??state.settings.savePct)||0,incomeBudget:sum(txs.filter(t=>t.type==='income'))>0?0:cycleTotal(m,'income')});}
function cycleBalance(m){const p=cyclePeriod(m);return BudgetFinance.balance(state.transactions,p.start,p.end,todayISO());}
function cyclePending(m){
 const p=cyclePeriod(m),out=[];
 for(let mm=p.start.slice(0,7);mm<=p.end.slice(0,7);mm=shiftMonth(mm,1)){
  recPending(mm).forEach(r=>{const date=dateFor(mm,r.day);if(date>=p.start&&date<=p.end)out.push({...r,month:mm,date});});
 }
 return out;
}
function cycleProjection(m){
 const pending=cyclePending(m),txs=cycleTx(m);
 const total=type=>{
  const known=catsOf(type).reduce((s,c)=>{const real=sum(txs.filter(t=>t.type===type&&t.catId===c.id)),plan=cyclePlanned(m,type,c.id),rec=sum(pending.filter(r=>r.type===type&&r.catId===c.id));return s+Math.max(real+plan+rec,cycleBudget(m,c.id));},0);
  return known+sum(txs.filter(t=>t.type===type&&!state.categories.some(c=>c.id===t.catId)))+sum(cycleTx(m,true).filter(t=>isPlanned(t)&&t.type===type&&!state.categories.some(c=>c.id===t.catId)));
 };
 return {projInc:total('income'),projExp:total('expense')};
}
function planTx(m){return cycleView()?cycleTx(m):txOfMonth(m);}
function planTxAll(m){return cycleView()?cycleTx(m,true):txOfMonthAll(m);}
function planReal(m,id){return cycleView()?cycleReal(m,id):realBy(m,id);}
function planBudget(m,id){return cycleView()?cycleBudget(m,id):getBudget(m,id);}
function planTotal(m,type){return cycleView()?cycleTotal(m,type):totalBudget(m,type);}
function planPlanned(m,type,id){return cycleView()?cyclePlanned(m,type,id):plannedOf(m,type,id);}
function planSavings(m){return cycleView()?cycleSavings(m):savingsOf(m);}
function planBalance(m){return cycleView()?cycleBalance(m):balanceOfMonth(m);}
function planCurrentMonth(){return cycleView()?cycleMonthForDate():thisMonth();}
function planLabel(m){return cycleView()?cycleLabel(m):monthLong(m);}

// ---- Ahorro: meta (% de ingresos) y forma de medirlo ----
// 'set'  = lo que separo: gastos en la categoría de ahorro + aportes a metas
// 'left' = lo que sobra: ingresos − gastos de consumo (lo separado también cuenta como ahorro)
const saveMode = () => state.settings.saveMode === 'set' ? 'set' : 'left';
const savePctOf = m => { const o = (state.settings.savePctM || {})[m]; return Number(o != null ? o : state.settings.savePct) || 0; };
function savingsOf(m){const txs=txOfMonth(m);return BudgetFinance.savings(txs,{savingIds:state.categories.filter(c=>isSavingCat(c.id)).map(c=>c.id),mode:saveMode(),pct:savePctOf(m),incomeBudget:sum(txs.filter(t=>t.type==='income'))>0?0:totalBudget(m,'income')});}
// ---- Días de pago por categoría de ingreso: "25-fin", "15, 26-fin", "30" ----
const MES_L = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','setiembre','octubre','noviembre','diciembre'];
function payWindows(str){
  str = String(str || ''); if (str.startsWith('#')) return [];
  return str.split('@')[0].toLowerCase().split(/[,;]+/).map(x => x.trim()).filter(Boolean).map(x => {
    const [a, b] = x.split(/\s*(?:-|–)\s*/).map(v => /fin|ult|últ/.test(v) ? 31 : parseInt(v, 10));
    const from = Math.min(31, Math.max(1, a || 0)), to = Math.min(31, Math.max(from, b || from));
    return a ? [from, to] : null; }).filter(Boolean).sort((p, q) => p[0] - q[0]);
}
// Configuración completa del día de pago de una categoría
function payCfg(str){
  str = String(str || '');
  if (str.startsWith('#')) return {mode:'dates', w:[], months:[], dates: str.slice(1).split(',').filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()};
  const months = str.includes('@') ? str.split('@')[1].split(',').map(Number).filter(n => n >= 1 && n <= 12).sort((a, b) => a - b) : [];
  return {mode: months.length ? 'months' : 'monthly', w: payWindows(str), months, dates:[]};
}
function payEncode(cfg){
  if (cfg.mode === 'dates') return cfg.dates.length ? '#' + [...new Set(cfg.dates)].sort().join(',') : '';
  const d = payText(cfg.w);
  if (cfg.mode === 'months' && cfg.months.length) return (d ? d + ' ' : '') + '@' + cfg.months.join(',');
  return d;
}
const listY = arr => arr.length > 1 ? arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1] : arr[0] || '';
const dateLong = iso => { const [y, m, d] = iso.split('-').map(Number); return `${d} de ${MES_L[m - 1]}${y !== new Date().getFullYear() ? ' de ' + y : ''}`; };
const daysTxt = w => listY(w.map(([a, b]) => a === b ? (a >= 31 ? 'a fin de mes' : `el ${a}`) : b >= 31 ? (a === 1 ? 'durante el mes' : `del ${a} a fin de mes`) : `del ${a} al ${b}`));
const payShort = w => w.map(([a, b]) => a === b ? (a >= 31 ? (w.length > 1 ? 'fin' : 'Fin de mes') : (w.length > 1 ? String(a) : 'Día ' + a)) : `${a} – ${b >= 31 ? 'fin' : b}`).join(' · ');
function payLabel(str){ // texto corto del botón
  const c = payCfg(str);
  if (c.mode === 'dates') return c.dates.length === 1 ? (([y, m, d]) => `${d} ${MONTHS_ES[m - 1].toLowerCase()} ${String(y).slice(2)}`)(c.dates[0].split('-').map(Number)) : `${c.dates.length} fechas`;
  const ms = c.months.map(n => MONTHS_ES[n - 1].toLowerCase()).join(', ');
  if (c.mode === 'months') return (c.w.length && !(c.w.length === 1 && c.w[0][0] === 1 && c.w[0][1] >= 31) ? payShort(c.w) + ' · ' : '') + ms;
  return payShort(c.w);
}
function payHumanCfg(c){ // frase completa
  if (c.mode === 'dates') return c.dates.length ? 'Llega el ' + listY(c.dates.map(dateLong)) : 'Sin fechas elegidas';
  const full = c.w.length === 1 && c.w[0][0] === 1 && c.w[0][1] >= 31, d = c.w.length && !(full && c.mode === 'months') ? daysTxt(c.w) : '';
  if (c.mode === 'months') return c.months.length ? `Llega ${d ? d + ' ' : ''}en ${listY(c.months.map(n => MES_L[n - 1]))}` : 'Elige en qué meses llega';
  return d ? 'Llega ' + d + ', todos los meses' : 'Sin día de pago';
}
const payHuman = w => payHumanCfg({mode:'monthly', w, months:[], dates:[]});
const payText = w => w.map(([a, b]) => a === b ? String(a) : `${a}-${b >= 31 ? 'fin' : b}`).join(', ');
const payRange = (a, b, m) => { const dim = daysIn(m), B = Math.min(b, dim), A = Math.min(a, dim); return A === B ? `el ${A}` : A === 1 && B === dim ? 'este mes' : B === dim && b >= 28 ? `del ${A} a fin de mes` : `del ${A} al ${B}`; };
// Ingresos que aún deben llegar en el mes según su día de pago (si ya hay un ingreso de esa categoría en la ventana, cuenta como recibido)
function pendingPays(m){
  const out = [], today = m === thisMonth() ? new Date().getDate() : m < thisMonth() ? 99 : 0, dim = daysIn(m), mo = Number(m.slice(5, 7));
  const got = (c, A, B) => txOfMonthAll(m).some(t => t.type === 'income' && t.catId === c.id && Number(t.date.slice(8, 10)) >= A - 3 && Number(t.date.slice(8, 10)) <= B + 3);
  state.categories.filter(c => c.type === 'income' && c.pay).forEach(c => {
    const cfg = payCfg(c.pay);
    if (cfg.mode === 'dates'){ cfg.dates.filter(d => d.slice(0, 7) === m).forEach(d => { const D = Number(d.slice(8, 10)); if (D >= today && !got(c, D, D)) out.push({c, a:D, b:D}); }); return; }
    if (cfg.mode === 'months' && !cfg.months.includes(mo)) return;
    (cfg.w.length ? cfg.w : [[1, 31]]).forEach(([a, b]) => { const A = Math.min(a, dim), B = Math.min(b, dim); if (!got(c, A, B) && B >= today) out.push({c, a:A, b:B}); });
  });
  return out.sort((x, y) => x.a - y.a);
}
const isSavingCat = id => { const c = state.categories.find(x => x.id === id); return !!c && c.type === 'expense' && roleOf(c) === 'save'; };
const expSavingCat = () => (state.categories.find(c => c.type === 'expense' && roleOf(c) === 'save') || {}).id;
const savingsCat = () => (state.categories.find(c => c.type === 'income' && /ahorro|otro/i.test(c.name)) || catsOf('income')[0] || {}).id;

function balanceOfMonth(month,data=state,today=todayISO()){return BudgetFinance.balance(data.transactions||[],month+'-01',dateFor(month,31),today);}
/* ---------- Proyección del mes en curso ---------- */
// Proyección del cierre del mes en curso:
//  ya registrado + recurrentes que faltan + gasto variable estimado.
//  Solo se extrapolan categorías con 3+ gastos sueltos ya ocurridos (comida, transporte…);
//  pagos puntuales como el alquiler o gastos con fecha futura no se multiplican.
// Proyección del cierre de un mes en curso o futuro (la misma cifra para "Libre al cierre" y Análisis).
// Por categoría: lo registrado + recurrentes por venir + programados + ritmo diario (si es frecuente);
// si el presupuesto es mayor, se asume que lo usarás completo. Ingresos: lo recibido + por cobrar, o lo esperado si es mayor.
function projection(m){
  const tm = thisMonth(); if (m < tm) return null;
  const dim = daysIn(m), day = m === tm ? new Date().getDate() : 0, left = dim - day;
  const txs = txOfMonth(m), pend = recPending(m);
  const cats = catsOf('expense').map(c => {
    const all = txs.filter(t => t.type === 'expense' && t.catId === c.id), reg = sum(all);
    const loose = all.filter(t => !t.recId && Number(t.date.slice(8, 10)) <= day);
    const frequent = loose.length >= 3 && day > 0, perDay = frequent ? sum(loose) / day : 0, pace = perDay * left;
    const pendRec = pend.filter(r => r.type === 'expense' && r.catId === c.id).reduce((a, r) => a + Number(r.amount || 0), 0);
    const plan = plannedOf(m, 'expense', c.id), budget = getBudget(m, c.id), base = reg + pendRec + plan + pace;
    return {c, reg, pendRec, plan, pace, perDay, frequent, n: all.length, base, rest: Math.max(0, budget - base), proj: Math.max(base, budget), budget};
  });
  const orphan = sum(txs.filter(t => t.type === 'expense' && !state.categories.some(c => c.id === t.catId)));
  const S = k => cats.reduce((a, x) => a + x[k], 0);
  const spent = S('reg') + orphan, recLeft = S('pendRec'), paceTot = S('pace'), planTot = S('plan'), restTot = S('rest');
  const projExp = spent + recLeft + planTot + paceTot + restTot;
  const incs = catsOf('income').map(c => { const real = realBy(m, c.id), plan = plannedOf(m, 'income', c.id), rec = pend.filter(r => r.type === 'income' && r.catId === c.id).reduce((a, r) => a + Number(r.amount || 0), 0), exp = getBudget(m, c.id);
    // si la categoría tiene monto esperado, sus recurrentes ya están incluidos en él (evita contar el sueldo dos veces)
    return {c, real, plan, rec, exp, proj: exp > 0 ? Math.max(real + plan, exp) : real + plan + rec}; });
  const incOrphan = sum(txs.filter(t => t.type === 'income' && !state.categories.some(c => c.id === t.catId)));
  const incReg = incs.reduce((a, x) => a + x.real + x.plan, 0) + incOrphan, projInc = incs.reduce((a, x) => a + x.proj, 0) + incOrphan;
  return {day, dim, left, cats, projExp, projInc, spent, recLeft, paceTot, planTot, restTot, incReg, incRec: projInc - incReg};
}
