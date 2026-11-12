// Presupuesto: dashboard.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Dashboard ---------- */
let chDonut, chBars;
// La evolución toma la altura de la distribución cerrada, incluso al ampliar sus detalles.
const dashboardChartObserver = new ResizeObserver(() => {
  const left = $('#donutWrap').closest('.card'), right = $('#barsWrap').closest('.card');
  let height = left.getBoundingClientRect().height;
  if (!height) return;
  const expanded = left.querySelector('.expense-distribution-more[open]');
  if (expanded) {
    const style=getComputedStyle(expanded),closed=expanded.querySelector('summary').getBoundingClientRect().height+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom)+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth);
    height-=expanded.getBoundingClientRect().height-closed;
  }
  right.style.setProperty('--evolution-card-height',Math.max(390,height)+'px');
});
dashboardChartObserver.observe($('#donutWrap').closest('.card'));
function deltaTxt(cur, prev, type, prevM){
  if (!prev && !cur) return '';
  if (!prev) return `<span class="delta muted">nuevo vs ${monthAbbr(prevM)}</span>`;
  const p = (cur - prev) / prev * 100;
  if (Math.abs(p) < 1) return `<span class="delta muted">= ${monthAbbr(prevM)}</span>`;
  const up = p > 0, good = type === 'expense' ? !up : up;
  return `<span class="delta ${good ? 'pos' : 'neg'}">${up ? '↑' : '↓'} ${Math.abs(p).toFixed(0)}% vs ${monthAbbr(prevM)}</span>`;
}
// Relleno de las barras de avance: degradado del tono de la categoría; ámbar/rojo suaves en alerta
// Mismo brillo y saturación para todos los tonos → barras armónicas aunque las categorías tengan colores muy distintos
function hueOf(hex){ const [r,g,b] = [1,3,5].map(i => parseInt(hex.substr(i,2),16) / 255), mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn;
  if (!d) return {h:0, s:0}; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  return {h, s: d / (1 - Math.abs(mx + mn - 1))}; }
function hslHex(h, s, l){ const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r,g,b] = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return '#' + [r,g,b].map(v => Math.round((v + m) * 255).toString(16).padStart(2,'0')).join(''); }
const harmon = (hex, l) => { const hx = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : '#94a3b8', {h, s} = hueOf(hx), dark = isDarkUI(), k = dark ? .62 : 1;
  if (s < .12){ const o = hexLight(hx), d = l - (dark ? .45 : .76); return hslHex(h, 0, Math.min(.9, Math.max(.22, (dark ? .78 - .45 * o : .3 + .5 * o) + d))); } // grises: conservan su claridad para distinguirse
  return hslHex(h, (h >= 42 && h <= 80 ? .8 : .58) * k, l); }; // los amarillos necesitan más saturación para no verse caqui
const HARM_L = () => isDarkUI() ? [.3, .55] : [.84, .68];
function barFill(hex, alert){
  const [l1, l2] = HARM_L(), dark = isDarkUI(), k = dark ? .7 : 1;
  if (curTheme()){
    if (alert === 'over') return 'linear-gradient(90deg,color-mix(in srgb,var(--expense-chart) 75%,var(--surface)),var(--expense-chart))';
    if (alert === 'warn') return 'linear-gradient(90deg,color-mix(in srgb,var(--expense-chart) 35%,var(--surface)),color-mix(in srgb,var(--expense-chart) 75%,var(--surface)))';
    if (alert === 'income') return 'linear-gradient(90deg,color-mix(in srgb,var(--income-chart) 45%,var(--surface)),var(--income-chart))';
    const c = themeInk(dc(hex));
    return `linear-gradient(90deg,color-mix(in srgb,${c} 45%,var(--surface)),${c})`;
  }
  if (alert === 'over') return `linear-gradient(90deg,${hslHex(352, .72 * k, dark ? .34 : .74)},${hslHex(350, .78 * k, dark ? .56 : .56)})`;
  if (alert === 'warn') return `linear-gradient(90deg,${hslHex(6, .7 * k, l1)},${hslHex(356, .7 * k, dark ? .6 : .72)})`;
  if (alert === 'income') return `linear-gradient(90deg,${hslHex(150, .45 * k, l1)},${hslHex(152, .5 * k, l2)})`;
  return `linear-gradient(90deg,${harmon(hex, l1)},${harmon(hex, l2)})`;
}
function prowMeta(real, budget, type, saving){
  if (!(budget > 0)) return type === 'income' ? (real > 0 ? 'Ingreso no previsto' : 'Sin monto esperado') : 'Sin presupuesto';
  if (saving){ const d = budget - real; return d > .005 ? `Faltan ${fmt(d)} por separar` : d < -.005 ? `<span class="pos">${fmt(-d)} más de lo planeado</span>` : '<span class="pos">Completo</span>'; }
  const d = budget - real;
  if (type === 'income') return d > .005 ? `Por recibir: ${fmt(d)}` : d < -.005 ? `<span class="pos">${fmt(-d)} más de lo esperado</span>` : '<span class="pos">Ingreso completo</span>';
  return Math.round(real*100)===Math.round(budget*100) ? 'Presupuesto completo · sin excedente' : d > 0 ? `Disponible: ${fmt(d)}` : `<span class="neg">Exceso: ${fmt(-d)}</span>`;
}
function budgetStatus(real,budget){
 const r=Math.round((Number(real)||0)*100),b=Math.round((Number(budget)||0)*100);
 return b<=0?'none':r>b?'over':r===b?'complete':r>=b*.85?'near':'available';
}
function progressRow(c, real, budget, type, prev, prevM){
  const pct = budget > 0 ? real / budget * 100 : (real > 0 ? 100 : 0);
  const saving = type === 'expense' && isSavingCat(c.id);
  let color = dc(c.color);
  const status=budgetStatus(real,budget);
  color = barFill(c.color, type === 'income' || saving ? 'income' : status==='near'?'warn':'');
  let tag = '', alert = '';
  if (saving){ if (budget > 0 && pct >= 100) tag = `<span class="alert-pill good">${ic('check')}Cumplido</span>`; }
  else if (type === 'expense' && status==='over'){ alert = 'over'; tag = `<span class="alert-pill over">${ic('triangle-alert')}Superado</span>`; }
  else if (type === 'expense' && status==='complete'){ tag = '<span class="alert-pill complete">Completo</span>'; }
  else if (type === 'expense' && status==='near'){ alert = 'warn'; tag = ''; }
  else if(type==='income'&&budget>0&&real>=budget-.005){tag='<span class="alert-pill good">Ingreso recibido</span>';}
  const coveredWidth = alert === 'over' ? budget / real * 100 : Math.min(pct, 100);
  const excessWidth = 100 - coveredWidth;
  const barDescription = alert === 'over' ? `${pct.toFixed(1)}% del presupuesto. Presupuesto: ${fmt(budget)}. Exceso: ${fmt(real-budget)}.` : '';
  return `<div class="prow ${alert} link" data-go-cat="${c.id || ''}" data-go-type="${type}" title="Ver movimientos de ${esc(c.name)}">
    <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
    <div class="pr-main">
      <div class="pr-top"><span class="name">${esc(c.name)}</span>${tag}<span class="pr-amt"><b>${fmt(real)}</b>${budget > 0 ? `<span class="muted"> de ${fmt(budget)}</span>` : ''}</span></div>
      <div class="bar"${barDescription ? ` role="img" aria-label="${esc(barDescription)}" title="${esc(barDescription)}"` : ''}><span data-k="dash:${type}:${esc(c.id)}" data-w="${coveredWidth.toFixed(2)}" style="width:${coveredWidth}%;background:${color}"></span>${alert==='over'?`<i class="budget-overrun" aria-hidden="true" style="width:${excessWidth.toFixed(2)}%"></i><i class="budget-limit" aria-hidden="true" style="left:${coveredWidth.toFixed(2)}%"></i>`:''}</div>
      <div class="pr-meta"><span>${status==='complete'||(saving&&tag)?'':prowMeta(real, budget, type, saving)}</span>${prevM && prev && Math.abs(real - prev) / prev >= .01 ? deltaTxt(real, prev, type, prevM) : ''}</div>
    </div>
  </div>`;
}
const zeroGroup = (items, label) => items.length ? `<details class="zero-group"><summary>${CHEV_D}${items.length} ${label}</summary><div>${items.join('')}</div></details>` : '';
// Resumen del mes en una frase
function renderInsight(m, txs, inc, exp, bExp, pendN = 0){
  const box = $('#insight'), el = $('#insightText'), tm = thisMonth(), pm = shiftMonth(m, -1);
  const recLine = pendN ? `<div class="ins-rec">${ic('repeat')}<span>${pendN === 1 ? 'Tienes 1 recurrente' : `Tienes ${pendN} recurrentes`} por confirmar</span><button class="btn sm" data-ins-rec>Revisar</button></div>` : '';
  if (!txOfMonthAll(m).length){
    if (!recLine){ box.hidden = true; return; }
    el.innerHTML = recLine; box.querySelector('.i-ic').innerHTML = ic('repeat'); box.dataset.tone = 'good'; box.hidden = false; return; }
  const parts = [], b = x => `<b>${x}</b>`;
  // Mes que aún no empieza: solo el plan, nada de "cerraste"
  if (m > tm){
    const pE = plannedOf(m, 'expense'), pI = plannedOf(m, 'income'), mesF = monthLong(m).split(' ')[0];
    let t = `${mesF} aún no empieza${bExp > 0 ? `: tienes ${b(fmt(bExp))} presupuestado en gastos` : ''}`;
    if (pE) t += `${bExp > 0 ? ' y' : ':'} ${b(fmt(pE))} ya programado`;
    if (pI) t += `. Ingresos programados: ${b(fmt(pI))}`;
    el.innerHTML = t + '.' + recLine; box.querySelector('.i-ic').innerHTML = ic('calendar'); box.dataset.tone = 'good'; box.hidden = false; return;
  }
  // Presupuesto
  if (bExp > 0){
    const d = bExp - exp;
    parts.push(d >= 0 ? (Math.abs(d)<.005?`Presupuesto de gastos completo: ${b(fmt(exp))}`:m === tm ? `Llevas ${b(fmt(exp))} gastado de ${b(fmt(bExp))} presupuestado (${Math.round(exp / bExp * 100)}%)` : `Cerraste ${b('<span class="good">' + fmt(d) + '</span>')} por debajo del presupuesto de gastos`)
                      : `Te ${m === tm ? 'estás pasando' : 'pasaste'} ${b('<span class="bad">' + fmt(-d) + '</span>')} del presupuesto de gastos`);
  } else parts.push(`Llevas ${b(fmt(exp))} en gastos este mes`);
  // Comparación con el mes anterior (mismo día si es el mes en curso)
  const day = m === tm ? new Date().getDate() : 31;
  const prevExp = sum(txOfMonth(pm).filter(t => t.type === 'expense' && Number(t.date.slice(8,10)) <= day));
  if (prevExp > 0 && exp > 0){
    const p = (exp - prevExp) / prevExp * 100, mes = monthLong(pm).split(' ')[0].toLowerCase();
    if (Math.abs(p) < 2) parts.push(`${m === tm ? 'gastas' : 'gastaste'} casi lo mismo que en ${mes}`);
    else parts.push(`${m === tm ? 'gastas' : 'gastaste'} ${b('<span class="' + (p < 0 ? 'good' : 'bad') + '">' + Math.abs(p).toFixed(0) + '% ' + (p < 0 ? 'menos' : 'más') + '</span>')} que en ${mes}${m === tm ? ' a esta fecha' : ''}`);
  }
  let text = parts.join(' y ') + '.';
  // Categorías en alerta
  // Completo no es exceso: solo el gasto superior al presupuesto es una alerta roja.
  const st = catsOf('expense').filter(c => !isSavingCat(c.id)).map(c => { const bb = getBudget(m, c.id), r = realBy(m, c.id); return {c, bb, r, p: bb > 0 ? r / bb : 0}; }).filter(x => x.bb > 0);
  const over = st.filter(x => budgetStatus(x.r,x.bb)==='over'), full = st.filter(x => budgetStatus(x.r,x.bb)==='complete'), near = st.filter(x => budgetStatus(x.r,x.bb)==='near');
  const names = arr => { const n = arr.map(x => b(esc(x.c.name))); return n.length > 2 ? n.slice(0, 2).join(', ') + ` y ${n.length - 2} más` : n.join(' y '); };
  // Solo la alerta más importante, para que el resumen quepa en dos líneas
  const alerts = [], rest = n => n ? ` (${n} ${n===1?'categoría con poco presupuesto disponible':'categorías con poco presupuesto disponible'})` : '';
  if (over.length) alerts.push(`${names(over)} ${over.length === 1 ? `superó su presupuesto por ${b('<span class="bad">' + fmt(over[0].r - over[0].bb) + '</span>')}` : 'superaron su presupuesto'}${rest(near.length)}`);
  else if (full.length) alerts.push(`Presupuesto completo en ${names(full)}${rest(near.length)}`);
  else if (near.length) alerts.push(`${names(near)}: ${near.length===1?`quedan ${b(fmt(near[0].bb-near[0].r))} disponibles`:'queda menos del 15% del presupuesto disponible'}`);
  if (alerts.length) text += ' ' + alerts[0].replace(/^./, ch => ch.toUpperCase()) + '.';
  if (!alerts.length && inc > 0 && inc - exp > 0 && bExp > 0 && exp > 0) text += ' Sin excesos en las categorías con presupuesto.';
  const icon = over.length || (bExp > 0 && exp > bExp) ? 'triangle-alert' : near.length ? 'circle-alert' : full.length?'check':'sparkles';
  box.dataset.tone = over.length || (bExp > 0 && exp > bExp) ? 'bad' : near.length ? 'warn' : full.length?'neutral':'good';
  // Una sola conclusión; el desglose permanece en los indicadores y Presupuesto.
  text=bExp>0&&exp>bExp+.005?`Exceso de <b>${fmt(exp-bExp)}</b> en el presupuesto de gastos.`:over.length?`${over.length} ${over.length===1?'categoría supera':'categorías superan'} su presupuesto.`:near.length?`${near.length} ${near.length===1?'categoría tiene':'categorías tienen'} poco margen disponible.`:parts[0]+'.';
  text += recLine;
  if (el.innerHTML !== text){ el.innerHTML = text; box.querySelector('.i-ic').innerHTML = ic(icon); box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap'); }
  box.hidden = false;
}
// El saldo anterior es derivado: nunca crea ingresos ni cierres duplicados.
function renderDashboardKpis({m,inc,exp,bInc,bExp,pInc,pExp,pp,pace,cash,closing,closed,sv}){
 const row=(label,value,cls='')=>`<div class="metric-detail-row"><span>${label}</span><b class="${cls}">${value}</b></div>`;
 const incomeRemaining=Math.max(0,bInc-inc),expenseRemaining=bExp-exp;
 $('#kIncomePreview').textContent=inc?'Ingresos recibidos':'Aún sin ingresos';
 $('#kExpensePreview').textContent=!bExp?'Sin presupuesto':expenseRemaining<-.005?'Presupuesto superado':'Dentro del presupuesto';
 $('#kBalancePreview').textContent='Al cierre del período';
 $('#kSavingsPreview').textContent='Sobre tus ingresos';
 $('#kIncomeSub').innerHTML=row('Esperado',bInc?fmt(bInc):'Sin definir')+row(!bInc&&inc?'No previsto':inc>bInc&&bInc?'Adicional':'Por recibir',bInc?fmt(inc>bInc?inc-bInc:incomeRemaining):inc?fmt(inc):'—');
 const incomeFoot=$('#kIncomeFoot');
 incomeFoot.innerHTML=bInc?`${Math.round(inc/bInc*100)}% de lo esperado`:pInc?`${fmt(pInc)} programados`:'Sin expectativa de ingresos';
 incomeFoot.title=pp.length?pp.map(x=>`${x.c.name}: ${payRange(x.a,x.b,m)}`).join('\n'):pInc?`${fmt(pInc)} con fecha futura`:'';
 $('#kExpenseSub').innerHTML=row('Presupuesto',bExp?fmt(bExp):'Sin definir')+row(expenseRemaining<0&&bExp?'Exceso':'Disponible',bExp?fmt(Math.abs(expenseRemaining)):'—',expenseRemaining<0&&bExp?'neg':'')+(sv.sep>.005?row('Incluye ahorro',fmt(sv.sep)):'');
 const expenseFoot=$('#kExpenseFoot');expenseFoot.innerHTML=!bExp?'Define un presupuesto':budgetStatus(exp,bExp)==='complete'?'Presupuesto completo':expenseRemaining<0?'Presupuesto superado':pace||pExp?pace||`${fmt(pExp)} programados`:`${Math.round(exp/bExp*100)}% del presupuesto usado`;
 $('#balanceParts').innerHTML=row('Saldo anterior',fmt(cash.previous))+row(cycleView()?'Resultado del ciclo':'Resultado del mes',fmt(cash.result),cash.result<0?'neg':'');
 $('#balanceParts').title=cash.provisional?'Saldo previo registrado hasta hoy; el mes anterior aún puede cambiar.':'Calculado desde tus movimientos reales registrados. No incluye movimientos programados.';
 $('#kBalanceSub').innerHTML=closed?'Cierre registrado':cash.provisional?'Saldo previo provisional':`Cierre estimado: <b class="${closing<0?'neg':'pos'}">${fmt(closing)}</b>`;
 $('#kSavingsSub').innerHTML=row(saveMode()==='set'?'Separado':'Ahorro calculado',fmt(sv.saved))+row(sv.pct?`Objetivo (${sv.pct}%)`:'Objetivo',sv.pct?fmt(sv.target):'Sin definir');
 const savingsFoot=$('#kSavingsFoot');
 savingsFoot.innerHTML=!sv.pct?'Define tu meta en Presupuesto':sv.target<=0?'Se calcula con tus ingresos':sv.saved>=sv.target-.005?'<span class="pos">Meta de ahorro cumplida</span>':`${closed?'Faltaron':'Faltan'} ${fmt(Math.max(0,sv.target-sv.saved))} para la meta`;
}

function renderDashboard(){
  $('#firstMovement').hidden = state.transactions.length > 0 || syncOn();
  $('#firstConnect').hidden = syncOn();
  const cy=cycleView();ensureCyclePlan(currentMonth);renderPeriodControls();
  const m = currentMonth, txs = planTx(m);
  const inc = sum(txs.filter(t => t.type === 'income')), exp = sum(txs.filter(t => t.type === 'expense'));
  const bInc = planTotal(m,'income'), bExp = planTotal(m,'expense'), bal = inc - exp;
  countUp($('#kIncome'), inc);
  const pInc = planPlanned(m, 'income'), pExp = planPlanned(m, 'expense');
  const pp = cy ? [] : pendingPays(m);
  countUp($('#kExpense'), exp);
  // Cuánto puedes gastar por día hasta fin de mes (sin contar lo que es para ahorrar ni lo ya programado)
  // Gastos: lo que el presupuesto aún permite gastar (no es dinero disponible, es el plan)
  let pace = '';
  const pend = Math.max(0, bExp - exp);
  if (m === planCurrentMonth() && bExp > exp){
    const daysLeft = cy ? Math.max(1, Math.round((Date.parse(cyclePeriod(m).end)-Date.parse(todayISO()))/864e5)+1) : daysIn(m)-new Date().getDate()+1;
    const savLeft = catsOf('expense').filter(c => isSavingCat(c.id)).reduce((a, c) => a + Math.max(0, planBudget(m, c.id) - planReal(m, c.id)), 0);
    const free = bExp - exp - pExp - savLeft;
    const how = [`Gastos pendientes según tu presupuesto: ${fmt(bExp - exp)}`, pExp ? `− ${fmt(pExp)} ya programados` : '', savLeft ? `− ${fmt(savLeft)} reservados para ahorro` : '', `= ${fmt(free)} para el día a día ÷ ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} que quedan`, 'Es un tope para no pasarte del presupuesto, no dinero disponible en tu cuenta.'].filter(Boolean).join('\n');
    if (free > 0) pace = `<span class="per-day" title="${how}">Para no pasarte: máx. <b>${fmt(free / daysLeft)}</b>/día</span>`;
  }
  const cash=planBalance(m);
  countUp($('#kBalance'),cash.total,'money','value '+(cash.total>=0?'pos':'neg'));
  // Balance: cuánto quedaría libre al cierre (después del presupuesto, que ya incluye lo que separas para ahorro)
  // Mes cerrado: lo real. Mes en curso o futuro: la proyección (misma cifra que Análisis)
  const closed = m < planCurrentMonth(), prj = closed ? null : cy ? cycleProjection(m) : projection(m);
  const incEnd = closed ? inc : prj.projInc, expEnd = closed ? exp : prj.projExp, freeEnd = incEnd - expEnd;
  const closing=cash.previous+freeEnd;
  const sv = planSavings(m);
  if (sv.rate != null) countUp($('#kSavings'), sv.rate, 'pct', 'value' + (sv.pct ? (sv.saved >= sv.target ? ' pos' : '') : '')); else { $('#kSavings').textContent = '—'; $('#kSavings').className = 'value'; numMemo.kSavings = 0; }
  renderDashboardKpis({m,inc,exp,bInc,bExp,pInc,pExp,pp,pace,cash,closing,closed,sv});

  // Recurrentes pendientes
  const pendN = cy ? cyclePending(m).filter(r=>!r.auto&&r.date<=todayISO()).length : recPending(m).filter(r => !r.auto && recDue(r, m)).length;

  const pm = shiftMonth(m, -1);
  const rows = type => {
    const list = catsOf(type).map(c => ({c, real: planReal(m,c.id), budget: planBudget(m,c.id)})).filter(x => x.real || x.budget)
      .sort((a,b) => b.real - a.real || b.budget - a.budget);
    if (!list.length) return type === 'income' ? emptyBox('target', 'Aún no defines cuánto esperas recibir este período.', 'budget', 'Definir', true) : emptyBox('target', 'Define cuánto quieres gastar por categoría y aquí verás tu avance.', 'budget', 'Definir presupuesto');
    const act = list.filter(x => x.real || planPlanned(m, type, x.c.id)), zero = list.filter(x => !act.includes(x));
    const row = x => progressRow(x.c, x.real, x.budget, type, planReal(pm, x.c.id), pm);
    if (type === 'expense' && act.length){
      // Solo lo que necesita atención (pasadas o al límite) y, para completar, las de mayor gasto; el resto está en Presupuesto
      const need = x => !isSavingCat(x.c.id) && x.budget > 0 && x.real / x.budget >= .85;
      const hot = act.filter(need).sort((a, b) => b.real / b.budget - a.real / a.budget);
      const shown = hot.concat(act.filter(x => !hot.includes(x)).slice(0, Math.max(0, 4 - hot.length)));
      const more = list.length - shown.length;
      return (hot.length ? '' : `<div class="bva-ok">${ic('check')} Todas tus categorías van dentro del presupuesto</div>`) + shown.map(row).join('')
        + `<button type="button" class="bva-more" data-gotab="budget">${more > 0 ? `Ver las ${more} categorías restantes en Presupuesto` : 'Ver todo en Presupuesto'} ${ic('chevron-right')}</button>`;
    }
    return (act.map(row).join('') || emptyBox('receipt', type === 'income' ? 'Aún no registras ingresos este período.' : 'Aún no registras gastos este período.', type, 'Registrar', true))
      + zeroGroup(zero.map(row), `categoría${zero.length > 1 ? 's' : ''} sin movimientos aún · ${fmt(zero.reduce((a, x) => a + x.budget, 0))} ${type === 'income' ? 'esperado' : 'presupuestado'}`);
  };
  $('#bvaExpense').innerHTML = rows('expense');
  animateBars($('#tab-dashboard'));
  if(cy)renderCycleInsight(m,inc,exp,bExp);
  else renderInsight(m,txs,inc,exp,bExp,pendN);

  const top = txs.filter(t => t.type === 'expense').sort((a,b) => b.amount - a.amount).slice(0,5);
  $('#topExp').innerHTML = top.length ? top.map(t => { const c = getCat(t.catId); return `<div class="prow link" data-go-tx="${esc(t.id)}" title="Editar movimiento" style="grid-template-columns:34px 1fr auto">
    <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
    <div><div class="name">${esc(t.desc || c.name)}</div><div class="small muted">${t.desc ? esc(c.name) + ' · ' : ''}${t.method ? esc(t.method) + ' · ' : ''}${fmtDate(t.date)}</div></div>
    <div class="amt"><b class="xp">${fmt(t.amount)}</b></div></div>`; }).join('') : emptyBox('receipt', 'Aquí verás tus 5 gastos más grandes del período.', null, '', true);

  renderCharts();
}
// Mini tendencia (últimos 6 meses) dentro de las tarjetas de Ingresos, Gastos y Balance
const sparkMemo = {};
// Nombre de etiqueta armado por partes: Apps Script trata de forma especial esa etiqueta si aparece literal en el código
const TTL = 'ti' + 'tle';
function renderSparks(m){
  // En meses futuros la tendencia termina en el mes actual (un mes que no empieza no es una caída a cero)
  const end = m > thisMonth() ? thisMonth() : m;
  const ms = Array.from({length:6}, (_, i) => shiftMonth(end, i - 5));
  const inc = ms.map(x => sum(txOfMonth(x).filter(t => t.type === 'income')));
  const exp = ms.map(x => sum(txOfMonth(x).filter(t => t.type === 'expense')));
  const bal = ms.map(month=>balanceOfMonth(month).total);
  const show = ms.filter((_, i) => inc[i] || exp[i]).length >= 2;
  [['spIncome', inc, 'var(--income)'], ['spExpense', exp, 'var(--expense)'], ['spBalance', bal, 'var(--primary)']].forEach(([id, v, col]) => {
    const el = $('#' + id); if (!el) return;
    if (!show){ el.style.display = 'none'; el.innerHTML = ''; sparkMemo[id] = ''; return; }
    el.style.display = '';
    const lo = Math.min(0, ...v), hi = Math.max(...v), span = hi - lo || 1;
    const pts = v.map((y, i) => [i * 20, 28 - (y - lo) / span * 26]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1].toFixed(2)).join(' ');
    const zero = 28 - (0 - lo) / span * 26, gid = id + 'G';
    const key = v.join(',') + col;
    el.innerHTML = `<${TTL}>${ms.map((x, i) => monthShort(x) + ': ' + fmt(v[i])).join(' · ')}</${TTL}>
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      ${lo < 0 ? `<line class="sz" x1="0" x2="100" y1="${zero}" y2="${zero}"/>` : ''}
      <path d="${line} L100 30 L0 30 Z" fill="url(#${gid})"/>
      <path class="sl" d="${line}" style="stroke:${col}"/>`;
    if (sparkMemo[id] !== key){ el.classList.remove('draw'); void el.getBoundingClientRect(); el.classList.add('draw'); sparkMemo[id] = key; }
  });
}
// Pasar el mouse por la leyenda resalta la porción de la dona
document.addEventListener('pointerover', e => { const r = e.target.closest && e.target.closest('.dl-row'); if (!r || !chDonut) return; const i = Number(r.dataset.i); chDonut.setActiveElements([{datasetIndex:0, index:i}]); chDonut.update('none'); });
document.addEventListener('pointerout', e => { const r = e.target.closest && e.target.closest('.dl-row'); if (!r || !chDonut || (e.relatedTarget && r.contains(e.relatedTarget))) return; chDonut.setActiveElements([]); chDonut.update('none'); });
// Estilo común de los gráficos
function chartTheme(){
  Chart.defaults.font.family = cssVar('--font-body') || 'system-ui, sans-serif';
  Chart.defaults.color = cssVar('--muted');
  Chart.defaults.animation.duration=reduceMotion()?0:MOTION.data;
  Chart.defaults.animation.easing=MOTION.dataEasing;
  const tt = Chart.defaults.plugins.tooltip;
  const dk = isDarkUI();
  Object.assign(tt, {backgroundColor: dk ? '#16181d' : cssVar('--text'), titleColor: dk ? cssVar('--text') : cssVar('--bg'), bodyColor: dk ? cssVar('--muted') : cssVar('--bg'), borderColor: dk ? '#2a2e37' : 'transparent', borderWidth: dk ? 1 : 0, padding:10, cornerRadius:10, boxPadding:4, usePointStyle:true, titleFont:{weight:'700'}});
}
// Degradado vertical de un color (más intenso arriba)
const vGrad = (hex, a1 = 'ff', a2 = '55') => c => { const {ctx, chartArea:ar} = c.chart; if (!ar) return hex; const g = ctx.createLinearGradient(0, ar.bottom, 0, ar.top); g.addColorStop(0, hex + a2); g.addColorStop(1, hex + a1); return g; };
const stagger=()=>reduceMotion()?false:{duration:MOTION.data,easing:MOTION.dataEasing};
const compactS = v => { const a = Math.abs(v), r = x => (Math.round(x * 10) / 10).toString().replace(/\.0$/, ''); return (v < 0 ? '−' : '') + 'S/ ' + (a >= 1e6 ? r(a / 1e6) + 'M' : a >= 1000 ? r(a / 1000) + 'k' : Math.round(a)); };
// Quita la marca del borde del eje si queda pegada a la anterior (evita etiquetas encimadas como «S/ 440» sobre «S/ 400»)
function trimTicks(sc){ const t = sc.ticks; if (t.length < 4) return; const h = Math.floor(t.length / 2), step = t[h].value - t[h - 1].value;
  if (t[t.length - 1].value - t[t.length - 2].value < step * .6) t.pop();
  if (t[1].value - t[0].value < step * .6) t.shift(); }
// Separa la leyenda del gráfico y deja aire entre círculo y texto
const legendGap = {id:'legendGap', beforeInit(chart){ const lg = chart.legend; if (!lg) return; const fit = lg.fit; lg.fit = function(){ fit.call(this); this.height += 14; }; }};
const LEGEND = {position:'top', align:'center', labels:{usePointStyle:true, boxWidth:7, boxHeight:7, padding:20, font:{size:12, weight:'600'}}};
// Colores de la dona: si varias categorías comparten color (temas de un solo color), se escalonan en claridad
// Ajusta un color del tema para que se vea sobre el fondo actual (sin cambiar su carácter)
function themeInk(h){ return fitThemeColor(h,cssVar('--surface'),3); }
function sliceCols(data, bump){
  const seen={}, dark=isDarkUI();
  return data.map(x=>{const key=String(x.c.color).toLowerCase(), n=seen[key]=(seen[key]??-1)+1;
    const color=n ? toneHex(x.c.color,Math.max(.2,Math.min(.85,hexLight(x.c.color)+(n%2?-.09:.09)*Math.ceil(n/2))),0) : x.c.color;
    const ink=themeInk(color);return bump?mixHex(ink,dark?'#ffffff':'#111113',.1):ink;});
}

function renderCharts(){
  // Distribución horizontal: cada categoría se lee una vez, sin repetir el total del indicador.
  const m = currentMonth;
  let data = catsOf('expense').map(c => ({c, v: planReal(m,c.id)})).filter(x => x.v > 0).sort((a,b) => b.v - a.v);
  const orphan = sum(planTx(m).filter(t => t.type === 'expense' && !state.categories.some(c => c.id === t.catId)));
  if (orphan) data.push({c:getCat(null), v:orphan});
  data.sort((a,b)=>b.v-a.v);
  const dw = $('#donutWrap'), totalD = data.reduce((a,x)=>a+x.v,0);
  if(chDonut){chDonut.destroy();chDonut=null;}
  if(!data.length){delete dw.dataset.distributionSignature;dw.innerHTML=emptyBox('chart-bar','Aún no hay gastos en este período.','expense','Registrar gasto');}
  else {
    const rest=data.slice(5),shown=data.slice(0,5),cols=sliceCols(data,0);
    const row=(x,i)=>'<div class="expense-distribution-row"><div class="expense-distribution-label"><span>'+esc(x.c.name)+'</span><b>'+fmt(x.v)+'</b><small>'+(x.v/totalD*100).toFixed(0)+'%</small></div><div class="expense-distribution-track" aria-hidden="true"><span style="width:'+(x.v/totalD*100)+'%;background:'+cols[i]+'"></span></div></div>';
    const signature=JSON.stringify(data.map((x,i)=>[x.c.id,x.c.name,x.v,cols[i]]));
    if(dw.dataset.distributionSignature!==signature){dw.dataset.distributionSignature=signature;
    dw.innerHTML='<div class="expense-distribution">'+shown.map(row).join('')+(rest.length?'<details class="expense-distribution-more"><summary>Otras '+rest.length+' categorías <b>'+fmt(rest.reduce((n,x)=>n+x.v,0))+'</b><span>'+Math.round(rest.reduce((n,x)=>n+x.v,0)/totalD*100)+'% '+ic('chevron-down')+'</span></summary><div>'+rest.map((x,i)=>row(x,i+5)).join('')+'</div></details>':'')+'</div>';
    }
  }

  // Barras
  const availableMonths = Array.from({length:6}, (_,i) => shiftMonth(m, i-5));
  // Recortar solo el inicio sin registros; conservar huecos entre períodos con datos.
  const first = availableMonths.findIndex(mm => planTx(mm).some(t=>t.type==='income'||t.type==='expense'));
  const months = first<0 ? availableMonths : availableMonths.slice(first);
  const incs = months.map(x => sum(planTx(x).filter(t => t.type === 'income')));
  const exps = months.map(x => sum(planTx(x).filter(t => t.type === 'expense')));
  const bw = $('#barsWrap');
  $('#dashboardEvolutionPeriod').textContent=months.length===1?'Este '+(cycleView()?'ciclo':'mes'):'Últimos '+months.length+' '+(cycleView()?'ciclos':'meses');
  const labels=months.map(mm=>innerWidth<=700?monthAbbr(mm):cycleView()?'Cic. '+monthAbbr(mm):monthShort(mm));
  // La instancia reutilizada debe consultar el período vigente, no el cierre que la creó.
  if(chBars?.canvas?.isConnected){
    chBars.options.plugins.tooltip.callbacks.title=items=>items.length?(cycleView()?cycleLabel(months[items[0].dataIndex]):monthLong(months[items[0].dataIndex])):'';
    chBars.options.scales.x.ticks.color=c=>c.index===months.length-1?cssVar('--text'):cssVar('--muted');
    chBars.options.scales.x.ticks.font=c=>({size:11,weight:c.index===months.length-1?'700':'500'});
  }
  if(chBars?.canvas?.isConnected && JSON.stringify(chBars.data.labels)===JSON.stringify(labels) && JSON.stringify(chBars.data.datasets.map(d=>d.data))===JSON.stringify([incs.map((v,i)=>(incs[i]||exps[i])?v:null),exps.map((v,i)=>(incs[i]||exps[i])?v:null)])){chBars.update('none');return;}
  const morphB = chartMorph && chBars && chBars.canvas && chBars.canvas.isConnected && (incs.some(Boolean) || exps.some(Boolean));
  if (chBars && !morphB){ chBars.destroy(); chBars = null; }
  if (!incs.some(Boolean) && !exps.some(Boolean)){ bw.innerHTML = emptyBox('chart-column', 'Aún no hay movimientos en los últimos 6 meses.', 'tx', 'Nuevo movimiento'); return; }
  if (!loadChartFor(bw)) return;
  const grid = cssVar('--border'); chartTheme();
  if (!bw.querySelector('canvas')) bw.innerHTML = '<canvas id="chBars"></canvas>';
  const has = i => incs[i] || exps[i], net = months.map((mm, i) => has(i) ? planSavings(mm).saved : null), cur = months.length - 1, ink = cssVar('--k-violet');
  const nul = arr => arr.map((v, i) => has(i) ? v : null);
  const barBg = v => c => vGrad(cssVar(v), c.dataIndex === c.chart.data.labels.length-1 || c.active ? 'ff' : 'b3', c.dataIndex === c.chart.data.labels.length-1 || c.active ? '66' : '3a')(c);
  if (morphB){ chBars.data.labels = months.map(mm=>innerWidth<=700?monthAbbr(mm):cycleView()?'Cic. '+monthAbbr(mm):monthShort(mm)); chBars.data.datasets[0].data = nul(incs); chBars.data.datasets[1].data = nul(exps); chBars.update(reduceMotion()?'none':undefined); return; }
  chBars = new Chart($('#chBars'), {
    plugins:[legendGap],
    data:{labels:months.map(mm=>innerWidth<=700?monthAbbr(mm):cycleView()?'Cic. '+monthAbbr(mm):monthShort(mm)), datasets:[
      {type:'bar', label:'Ingresos', data:nul(incs), backgroundColor:barBg('--income-chart'), hoverBackgroundColor:barBg('--income-chart'), solid:'--income-chart', borderRadius:7, borderSkipped:false, maxBarThickness:28, categoryPercentage:.78, barPercentage:.86},
      {type:'bar', label:'Gastos', data:nul(exps), backgroundColor:barBg('--expense-chart'), hoverBackgroundColor:barBg('--expense-chart'), solid:'--expense-chart', borderRadius:7, borderSkipped:false, maxBarThickness:28, categoryPercentage:.78, barPercentage:.86}
]},
    options:{maintainAspectRatio:false, animation:reduceMotion()?false:{duration:650,easing:'easeInOutCubic',delay:c=>c.type==='data'&&!c.chart.$entered?c.dataIndex*(innerWidth<=700?40:80):0,onComplete:({chart})=>{chart.$entered=true;}}, interaction:{mode:'index', intersect:false}, layout:{padding:{top:2, right:6, left:2}},
      plugins:{legend:{...LEGEND, labels:{...LEGEND.labels, generateLabels: ch => ch.data.datasets.map((d, i) => ({text:d.label, fillStyle:cssVar(d.solid), strokeStyle:cssVar(d.solid), lineWidth:d.type === 'line'?2:0, pointStyle:d.type === 'line' ? 'line' : 'rectRounded', hidden:!ch.isDatasetVisible(i), datasetIndex:i, fontColor:cssVar('--muted')}))}},
        tooltip:{filter: i => i.raw != null, callbacks:{title:items=>items.length?(cycleView()?cycleLabel(months[items[0].dataIndex]):monthLong(months[items[0].dataIndex])):'',label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`, labelColor: ctx => ({backgroundColor:cssVar(ctx.dataset.solid), borderColor:cssVar(ctx.dataset.solid), borderRadius:5})}}},
      scales:{x:{grid:{display:false}, border:{display:false}, ticks:{maxRotation:0,autoSkip:false,color: c => c.index === cur ? cssVar('--text') : cssVar('--muted'), font: c => ({size:11,weight: c.index === cur ? '700' : '500'})}},
        y:{beginAtZero:true, grace:'10%', grid:{color: c => c.tick.value === 0 ? cssVar('--muted') + '55' : grid}, border:{display:false, dash:[4,4]}, ticks:{callback:compactS, maxTicksLimit:5, padding:8}}}}
  });
}
