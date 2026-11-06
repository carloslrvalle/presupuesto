// Presupuesto: budget.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Presupuesto ---------- */
function budgetTable(type){
  const m = currentMonth, cats = catsOf(type).filter(c => !isArch(c, cycleView()?cyclePeriod(m).start.slice(0,7):m) || planReal(m, c.id)), isE = type === 'expense';
  let tb = 0, tr = 0;
  const body = cats.map(c => {
    const b = planBudget(m,c.id), r = planReal(m,c.id); tb += b; tr += r;
    const sav = isE && isSavingCat(c.id); // en la categoría de ahorro, pasarse del plan es bueno
    const diff = isE && !sav ? b - r : r - b, raw = b > 0 ? r / b * 100 : 0, pct = Math.min(raw, 100);
    const status=budgetStatus(r,b),alert=isE&&!sav?(status==='over'?'over':status==='near'?'warn':status==='complete'?'complete':''):'';
    const amountChars = Math.max(String(b || 0).length, fmt(r).length);
    return `<tr class="${alert}" style="--budget-amount-ch:${amountChars}">
      <td><div class="catcell"><div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div><span class="cname">${esc(c.name)}</span></div></td>
      <td class="num" data-mobile-label="Plan">${(cycleView() || payActive(c, m)) ? `<input type="number" inputmode="decimal" class="budget-input" min="0" step="10" data-bud="${esc(c.id)}" aria-label="${isE?'Presupuesto':'Ingreso esperado'} de ${esc(c.name)}" value="${b || ''}" placeholder="0">` : `<span class="off-month" title="Según su día de pago no llega en ${monthLong(m).split(' ')[0].toLowerCase()}">${ic('calendar-x')}${payLabel(c.pay)}</span>`}</td>
      <td class="num${r ? '' : ' muted'}" data-mobile-label="Real"><span class="budget-real">${fmt(r)}</span>${planPlanned(m, type, c.id) ? `<div class="plan-line">+ ${fmt(planPlanned(m, type, c.id))} prog.</div>` : ''}</td>
      <td class="num" data-mobile-label="${isE?(sav?(diff>=0?'Ahorro adicional':'Por ahorrar'):'Disponible'):(diff>0?'Ingreso adicional':'Por recibir')}">${!b && !r ? '<span class="muted">—</span>' : isE && !sav ? `<b class="${diff >= 0 ? 'pos' : 'neg'}">${fmt(diff)}</b>${b > 0 && diff >= 0 && diff - planPlanned(m, type, c.id) < -.005 ? `<div class="plan-line neg" title="Con lo programado (${fmt(planPlanned(m, type, c.id))}) te pasarías del presupuesto">→ ${fmt(diff - planPlanned(m, type, c.id))}</div>` : ''}` : diff >= 0 ? `<b class="pos">${diff > .005 ? '+' : ''}${fmt(diff)}</b>` : `<span class="muted">${fmt(-diff)}</span>`}</td>
      <td class="av"><span class="av-pct ${alert}${sav && raw >= 100 ? ' good' : ''}">${b > 0 ? pctTxt(raw) : '—'}</span><span class="budget-row-progress" aria-hidden="true"><i style="width:${pct}%;background:${barFill(c.color,alert)}"></i></span></td>
    </tr>`;
  }).join('');
  const td = isE ? tb - tr : tr - tb;
  const tdCell = isE ? `<td class="num ${td >= 0 ? 'pos' : 'neg'}">${fmt(td)}</td>` : `<td class="num ${td >= 0 ? 'pos' : 'muted'}">${td >= 0 ? (td > .005 ? '+' : '') + fmt(td) : fmt(-td)}</td>`;
  const wideValues = [tb,tr,td,...cats.map(c=>planBudget(m,c.id)),...cats.map(c=>planReal(m,c.id))].some(v=>Math.abs(v)>=100000);
  const mobileTotal = `<div class="budget-mobile-total${wideValues?' large-values':''}" aria-label="Totales de ${isE?'gastos':'ingresos'}"><strong>Total de ${isE?'gastos':'ingresos'}</strong><div><span>Plan</span><b data-budget-total="plan">${fmt(tb)}</b></div><div><span>Real</span><b data-budget-total="real">${fmt(tr)}</b></div><div><span>${isE?(td<0?'Excedido':'Disponible'):(td>0?'Ingreso adicional':'Por recibir')}</span><b data-budget-total="remaining" class="${isE?(td>=0?'pos':'neg'):(td>=0?'pos':'muted')}">${fmt(Math.abs(td))}</b></div><div><span>Avance</span><b>${tb ? pctTxt(tr / tb * 100) : '—'}</b></div></div>`;
  return mobileTotal + `<table class="bud-table${wideValues?' wide-values':''}">
    <thead><tr><th>Categoría</th><th class="num c-plan"><span class="hide-m">${isE ? 'Presupuesto' : 'Esperado'}</span><span class="show-m">Plan</span></th><th class="num c-real">Real</th><th class="num c-diff"><span class="hide-m">${isE ? 'Disponible' : 'Por recibir'}</span><span class="show-m">${isE ? 'Queda' : 'Falta'}</span></th><th class="num c-av" title="Avance">%</th></tr></thead>
    <tbody>${body}</tbody><tfoot><tr><td>Total</td><td class="num">${fmt(tb)}</td><td class="num">${fmt(tr)}</td>${tdCell}<td class="av"><span class="av-pct${isE && tr > tb ? ' over' : ''}">${tb ? pctTxt(tr / tb * 100) : '—'}</span></td></tr></tfoot></table>`;
}
function renderSaveCard(){
  if(cycleView())return renderCycleSaveCard();
  const m = currentMonth, sv = savingsOf(m), own = (state.settings.savePctM || {})[m] != null, mode = saveMode();
  const mes = monthLong(m).split(' ')[0].toLowerCase();
  let status = '';
  if (sv.pct){
    const miss = Math.max(0, sv.target - sv.saved), w = sv.target ? Math.min(100, sv.saved / sv.target * 100) : 0, done = sv.target > 0 && sv.saved >= sv.target;
    let tip;
    if (!sv.inc) tip = sv.base ? `Aún no registras ingresos en ${mes}; la meta se calcula sobre lo que esperas recibir.` : 'Registra tus ingresos o define cuánto esperas recibir para calcular la meta.';
    else if (done) tip = `<span class="pos">¡Meta cumplida!</span> ${m < thisMonth() ? 'Ahorraste' : 'Ahorras'} el ${sv.rate.toFixed(1)}% de tus ingresos.`;
    else if (m < thisMonth()) tip = mode === 'set' ? (sv.free >= miss ? `Faltaron ${fmt(miss)}. Te sobraron ${fmt(sv.free)} que no separaste como ahorro.` : `Faltaron ${fmt(miss)}; solo sobraron ${fmt(Math.max(0, sv.free))}.`)
      : `Faltaron ${fmt(miss)}: los gastos superaron lo que permitía la meta.`;
    else if (mode === 'set') tip = sv.free >= miss ? `Faltan ${fmt(miss)}. Tienes ${fmt(sv.free)} sin gastar: sepáralo en tu categoría de ahorro o en una meta.` : `Faltan ${fmt(miss)} y solo te quedan ${fmt(Math.max(0, sv.free))} sin gastar.`;
    else { const room = sv.inc - sv.target - sv.cons; tip = room >= 0 ? `Vas bien: puedes gastar hasta ${fmt(room)} más este mes y cumplir la meta.` : `Para cumplirla tendrías que gastar ${fmt(-room)} menos.`; }
    status = `<div class="sv-prog"><div class="sv-amt"><b class="${done ? 'pos' : ''}">${fmt(Math.max(0, sv.saved))}</b><span class="muted"> de ${fmt(sv.target)}</span><span class="sv-rate">${sv.rate != null ? sv.rate.toFixed(1) + '%' : '—'}</span></div>
      <div class="bar"><span style="width:${w}%;background:${barFill(cssVar('--primary'), done ? 'income' : '')}"></span></div>
      <div class="sv-tip">${tip}</div></div>`;
  } else status = '<div class="sv-tip">Escribe qué porcentaje de tus ingresos quieres ahorrar y te diremos si vas bien.</div>';
  $('#budSave').innerHTML = `<h3>${ic('piggy-bank')} Meta de ahorro</h3>
    <div class="sv-form">
      <span class="sv-l">Meta</span>
      <div class="sv-c"><span class="sv-in"><input type="number" id="svPct" min="0" max="100" step="1" inputmode="numeric" value="${sv.pct || ''}" placeholder="20"><i>%</i></span><span class="sv-hint">de tus ingresos</span></div>
      <span class="sv-l">Aplica a</span>
      <label class="check sv-c"><input type="checkbox" id="svAll" ${own ? '' : 'checked'}><span>Todos los meses${own ? ` <span class="muted">· ahora solo ${mes}</span>` : ''}</span></label>
      <span class="sv-l">Cuenta como ahorro</span>
      <div class="sv-c sv-seg"><div class="seg"><button type="button" data-svmode="set" class="${mode === 'set' ? 'active' : ''}">Lo que separo</button><button type="button" data-svmode="left" class="${mode === 'left' ? 'active' : ''}">Lo que sobra</button></div>
        <span class="sv-hint">${mode === 'set' ? 'Gastos en tu categoría de ahorro y aportes a metas.' : 'Ingresos menos gastos; lo que separas también cuenta.'}</span></div>
    </div>
    ${status}`;
}
document.addEventListener('change', e => {
  if (e.target.id === 'svPct' || e.target.id === 'svAll'){
    const v = Math.min(100, Math.max(0, Number($('#svPct').value) || 0)), all = $('#svAll').checked, m = cycleView()?cycleBudgetKey(currentMonth):currentMonth;
    state.settings.savePctM = {...(state.settings.savePctM || {})};
    if (all){ state.settings.savePct = v; delete state.settings.savePctM[m]; }
    else state.settings.savePctM[m] = v;
    save(); keepFocus(() => { renderSaveCard(); renderDashboard(); }); toast(v ? `Meta de ahorro: ${v}%${all ? '' : cycleView() ? ' en este ciclo' : ' en ' + monthLong(m)}` : 'Meta de ahorro quitada');
  }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-svmode]'); if (!b) return;
  state.settings.saveMode = b.dataset.svmode; save(); renderSaveCard(); renderDashboard(); if (activeTab() === 'analysis') renderAnalysis();
});
function renderBudget(){
  ensureCyclePlan(currentMonth);renderPeriodControls();
  renderSaveCard();
  const before = [...document.querySelectorAll('#tab-budget tfoot td')].map(t => t.textContent);
  $('#budExpense').innerHTML = budgetTable('expense');
  $('#budIncome').innerHTML = budgetTable('income');
  if (before.length) document.querySelectorAll('#tab-budget tfoot td').forEach((t, i) => { if (before[i] !== undefined && before[i] !== t.textContent && !reduceMotion()) motionAnimate(t,[{opacity:.55},{opacity:1}],'fast'); });
  animateBars($('#tab-budget'));
}
$('#tab-budget').addEventListener('change', e => {
  const inp = e.target.closest('[data-bud]'); if (!inp) return;
  const m = currentMonth;
  state.budgets[m] = state.budgets[m] || {};
  state.budgets[m][cycleView()?cycleBudgetKey(inp.dataset.bud):inp.dataset.bud] = Math.max(0, parseFloat(inp.value) || 0);
  save(); keepFocus(() => { renderBudget(); renderDashboard(); });
});
$('#tab-budget').addEventListener('input', e => {
  const inp = e.target.closest('.budget-input'); if (!inp) return;
  const row = inp.closest('tr'), real = row.querySelector('.budget-real');
  row.style.setProperty('--budget-amount-ch', Math.max((inp.value || '0').length, real?.textContent.length || 0));
});
$('#btnCopyPrev').onclick = () => {
  if(cycleView()){const m=currentMonth,p=shiftMonth(m,-1);state.budgets[m]=state.budgets[m]||{};state.categories.forEach(c=>state.budgets[m][cycleBudgetKey(c.id)]=cycleBudget(p,c.id));save();renderAll();return toast('Presupuesto copiado del ciclo anterior');}
  const prev = shiftMonth(currentMonth,-1), obj = {};
  // Un ingreso que no llega en uno de los dos meses (p. ej. gratificación) conserva su monto esperado.
  state.categories.forEach(c => { if (payActive(c, prev) && payActive(c, currentMonth) && !isArch(c, prev)) obj[c.id] = getBudget(prev, c.id); });
  state.budgets[currentMonth] = {...(state.budgets[currentMonth]||{}),...obj}; save(); renderAll(); toast('Presupuesto copiado de ' + monthLong(prev));
};
$('#btnSetDefault').onclick = () => {
  if(cycleView()){const config=cycleConfig(),defaults={...(config.defaults||{})};defaults[cycleDay()]=Object.fromEntries(state.categories.map(c=>[c.id,cycleBudget(currentMonth,c.id)]));state.settings.budgetCycle={...config,defaults};save();renderAll();return toast('Base guardada para los próximos ciclos');}
  state.categories.forEach(c => { if (payActive(c, currentMonth) && !isArch(c, currentMonth)) c.defaultBudget = getBudget(currentMonth, c.id); });
  save(); renderAll(); toast('Guardado como presupuesto base 📌');
};

/* ---------- Categorías ---------- */
const GRIP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
// Ordenar categorías arrastrando el asa (puntero/táctil), con animación de los vecinos
let catDrag = null;
document.addEventListener('pointerdown', e => {
  const g = e.target.closest('#tab-cats .grip'); if (!g) return;
  const row = g.closest('.cat-row'); e.preventDefault();
  const r = row.getBoundingClientRect();
  catDrag = {row, list:row.parentElement, offY:e.clientY - r.top, t:0, id:e.pointerId};
  row.classList.add('dragging'); g.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove', e => {
  if (!catDrag || e.pointerId !== catDrag.id) return;
  const {row, list} = catDrag, natural = row.getBoundingClientRect().top - catDrag.t;
  const sibs = [...list.querySelectorAll('.cat-row:not(.dragging)')], y = e.clientY;
  const before = sibs.find(s => { const b = s.getBoundingClientRect(); return y < b.top + b.height / 2; });
  const target = before || null;
  if ((target && row.nextElementSibling !== target) || (!target && list.lastElementChild !== row)){
    const tops = new Map(sibs.map(s => [s, s.getBoundingClientRect().top]));
    list.insertBefore(row, target);
    if (!reduceMotion()) sibs.forEach(s => { const d = tops.get(s) - s.getBoundingClientRect().top; if (d) motionAnimate(s,[{transform:`translateY(${d}px)`},{transform:'none'}]); });
  }
  const nat2 = row.getBoundingClientRect().top - catDrag.t;
  catDrag.t = e.clientY - catDrag.offY - nat2; row.style.transform = `translateY(${catDrag.t}px) scale(1.02)`;
});
const endCatDrag = e => {
  if (!catDrag || e.pointerId !== catDrag.id) return;
  const {row, list} = catDrag; catDrag = null;
  row.style.transition = 'transform '+MOTION.move+'ms '+MOTION.ease; row.style.transform = '';
  setTimeout(() => { row.classList.remove('dragging'); row.style.transition = ''; }, MOTION.move);
  const ids = [...list.querySelectorAll('.cat-row')].map(r => r.dataset.id), type = list.id === 'catsIncome' ? 'income' : 'expense';
  const before = catsOf(type).map(c => c.id).join();
  if (ids.join() === before) return;
  state.categories = [...state.categories.filter(c => c.type !== type), ...ids.map(id => state.categories.find(c => c.id === id)).filter(Boolean)];
  save(); dirty = new Set(Object.keys(VIEWS)); dirty.delete('cats'); toast('Orden actualizado', {icon:'list'});
};
document.addEventListener('pointerup', endCatDrag); document.addEventListener('pointercancel', endCatDrag);
// ---- Selector visual de días de pago (categorías de ingreso) ----
const ppEl = document.createElement('div'); ppEl.id='payPicker'; ppEl.className = 'pp'; ppEl.setAttribute('role', 'dialog');ppEl.setAttribute('aria-labelledby','ppTitle');
if ('popover' in HTMLElement.prototype) ppEl.setAttribute('popover', 'manual');
document.body.appendChild(ppEl);
let ppS = null;
function openPayPicker(btn, id){
  if (ppS && ppS.id === id) return closePayPicker();
  closePayPicker();
  const c = state.categories.find(x => x.id === id); if (!c) return;
  ppS = {id, btn, c, ...payCfg(c.pay), pend: null, orig: c.pay || ''};
  btn.classList.add('open');btn.setAttribute('aria-expanded','true'); renderPayPicker();
  if (ppEl.showPopover){ try{ if (ppEl.matches(':popover-open')) ppEl.hidePopover(); ppEl.showPopover(); }catch(e){} }
  placePayPicker();
  requestAnimationFrame(() => {ppEl.classList.add('show');placePayPicker();ppEl.querySelector('.pp-d.in,.pp-seg button.active')?.focus({preventScroll:true});});
}
function placePayPicker(){
  if (!ppS) return;
  const r = ppS.btn.getBoundingClientRect(), w = ppEl.offsetWidth, h = ppEl.offsetHeight;
  const left = Math.max(12, Math.min(r.right - w, innerWidth - w - 12));
  let top = r.bottom + 8; if (top + h > innerHeight - 8) top = r.top - h - 8 > 8 ? r.top - h - 8 : Math.max(8, innerHeight - h - 8);
  ppEl.style.left = left + 'px'; ppEl.style.top = top + 'px';
}
function commitPayPending(S){
 if(S.pend==null)return;let x=S.pend,y=S.pend;S.pend=null;
 S.w=S.w.filter(([p,q])=>{if(q>=x-1&&p<=y+1){x=Math.min(x,p);y=Math.max(y,q);return false;}return true;});
 S.w.push([x,y]);S.w.sort((a,b)=>a[0]-b[0]);
}
function closePayPicker(keep = true,focusBack = true){
  if (!ppS) return;
  const S = ppS,restoreFocus=focusBack&&ppEl.contains(document.activeElement); if(keep)commitPayPending(S); ppS = null; S.btn.classList.remove('open');S.btn.setAttribute('aria-expanded','false'); ppEl.classList.remove('show'); if (typeof dpClose === 'function') dpClose();
  setTimeout(() => { if (!ppS){ if(ppEl.hidePopover){try{ppEl.hidePopover();}catch(e){}} if(restoreFocus)[...document.querySelectorAll('#catsIncome .cat-row')].find(r=>r.dataset.id===S.id)?.querySelector('.pay-btn')?.focus({preventScroll:true}); } }, reduceMotion()?0:MOTION.panel);
  const val = payEncode(S);
  if (keep && val !== S.orig){ S.c.pay = val; save(); renderAll(); toast(val ? `${S.c.name}: ${payHumanCfg(payCfg(val)).toLowerCase()}` : 'Día de pago quitado', {icon:'calendar-days'}); }
}
function renderPayPicker(){
  const S = ppS, focused=document.activeElement,restore=focused?.closest('.pp')?['data-pd','data-pm','data-ppmode','data-pp'].map(k=>focused.hasAttribute(k)?'['+k+'="'+focused.getAttribute(k)+'"]':null).find(Boolean):null, inW = d => S.w.find(([a, b]) => d >= a && d <= b);
  const cell = d => { const w = inW(d), cls = ['pp-d', d >= 31 ? 'fin' : ''];
    if (w){ cls.push('in'); if (d === w[0]) cls.push('start'); if (d === w[1]) cls.push('end'); }
    if (S.pend === d) cls.push('pend');
    return `<button type="button" class="${cls.join(' ')}" data-pd="${d}" aria-label="${d===31?'Fin de mes':'Día '+d}" aria-pressed="${!!w || S.pend===d}">${d >= 31 ? 'Fin de mes' : d}</button>`; };
  const days = `<div class="pp-g">${Array.from({length:31}, (_, i) => cell(i + 1)).join('')}</div>`;
  const help = {monthly: S.pend ? `Ahora toca el último día del rango, o el mismo ${S.pend >= 31 ? 'botón' : 'día'} si llega solo ese día.` : 'Toca un día. Si llega en un rango, toca el primero y luego el último. Toca un día marcado para quitarlo.',
    months: S.pend ? 'Ahora toca el último día del rango (o el mismo día).' : 'Marca los meses en que llega y, si quieres, el día o rango.',
    dates: 'Agrega una o más fechas exactas. Al pasar la fecha deja de mostrarse como pendiente.'}[S.mode];
  let body;
  if (S.mode === 'dates') body = `<div class="pp-dates">${S.dates.map(d => `<span class="pp-date">${ic('calendar-check')}${dateLong(d)}<button type="button" data-ppdel="${d}" aria-label="Quitar">${ic('x')}</button></span>`).join('') || '<span class="small muted">Aún no hay fechas.</span>'}</div>
      <button type="button" class="pp-add" data-pp="adddate">${ic('plus')} Agregar fecha</button>`;
  else body = (S.mode === 'months' ? `<div class="pp-sub">Meses</div><div class="pp-m">${MONTHS_ES.map((n, i) => `<button type="button" class="pp-mo${S.months.includes(i + 1) ? ' on' : ''}" data-pm="${i + 1}" aria-pressed="${S.months.includes(i+1)}">${n}</button>`).join('')}</div><div class="pp-sub">Día <span>(opcional)</span></div>` : '') + days;
  const sumTxt = S.pend ? `Desde el ${S.pend >= 31 ? 'fin de mes' : S.pend}…` : payHumanCfg(S);
  const none = S.mode === 'dates' ? !S.dates.length : S.mode === 'months' ? !S.months.length : !S.w.length && !S.pend;
  ppEl.innerHTML = `<div class="pp-h"><div class="ico" style="background:${soft(S.c.color)}">${iconHTML(S.c.icon, S.c.color)}</div><div><b id="ppTitle">Día de pago</b><span class="pp-category">${esc(S.c.name)}</span></div><button type="button" class="iconbtn" data-pp="cancel" aria-label="Cancelar selección">${ic('x')}</button></div>
    <div class="seg pp-seg">${[['monthly','Cada mes'],['months','Ciertos meses'],['dates','Fecha exacta']].map(([k, l]) => `<button type="button" aria-pressed="${S.mode===k}" data-ppmode="${k}" class="${S.mode === k ? 'active' : ''}">${l}</button>`).join('')}</div>
    <p class="pp-help">${help}</p>
    <div class="pp-body">${body}</div>
    <div class="pp-sum${none ? ' none' : ''}">${ic(none ? 'calendar' : 'calendar-check')}<span>${sumTxt}</span></div>
    <div class="pp-f"><button type="button" data-pp="clear">Quitar todo</button><button type="button" class="ok" data-pp="ok">Listo</button></div>`;
  if(restore)ppEl.querySelector(restore)?.focus({preventScroll:true});
  placePayPicker();
}
ppEl.addEventListener('click', e => {
  if (!ppS) return;
  const S = ppS, a = e.target.closest('[data-pp]');
  const md = e.target.closest('[data-ppmode]');
  if (md){ commitPayPending(S);S.mode = md.dataset.ppmode; S.pend = null; renderPayPicker(); placePayPicker(); ppEl.querySelector('.pp-body').classList.add('swap'); return; }
  const pm = e.target.closest('[data-pm]');
  if (pm){ const n = Number(pm.dataset.pm); S.months = S.months.includes(n) ? S.months.filter(x => x !== n) : [...S.months, n].sort((x, y) => x - y); renderPayPicker(); return; }
  const del = e.target.closest('[data-ppdel]');
  if (del){ S.dates = S.dates.filter(d => d !== del.dataset.ppdel); renderPayPicker(); placePayPicker(); return; }
  if (a){
    if (a.dataset.pp === 'clear'){ S.w = []; S.months = []; S.dates = []; S.pend = null; renderPayPicker(); placePayPicker(); }
    else if (a.dataset.pp === 'adddate'){ const base = S.dates.length ? S.dates[S.dates.length - 1] : todayISO();
      dpOpen(a, {mode:'date', value:'', align:'center', onPick: v => { if (v && ppS){ if (!ppS.dates.includes(v)) ppS.dates = [...ppS.dates, v].sort(); renderPayPicker(); placePayPicker(); } }}); if (dpS) { dpS.y = Number(base.slice(0, 4)); dpS.m = Number(base.slice(5, 7)); dpRender(); dpPlace(); } }
    else closePayPicker(a.dataset.pp !== 'cancel');
    return;
  }
  const b = e.target.closest('[data-pd]'); if (!b) return;
  const d = Number(b.dataset.pd);
  if (S.pend == null){
    const hit = S.w.findIndex(([x, y]) => d >= x && d <= y);
    if (hit >= 0) S.w.splice(hit, 1); else S.pend = d;
  } else {
    let x = Math.min(S.pend, d), y = Math.max(S.pend, d); S.pend = null;
    // une con rangos que se toquen o se crucen
    S.w = S.w.filter(([p, q]) => { if (q >= x - 1 && p <= y + 1){ x = Math.min(x, p); y = Math.max(y, q); return false; } return true; });
    S.w.push([x, y]); S.w.sort((p, q) => p[0] - q[0]);
  }
  renderPayPicker();
});
document.addEventListener('pointerdown', e => { if (ppS && !ppEl.contains(e.target) && !ppS.btn.contains(e.target) && !dpEl.contains(e.target)) closePayPicker(true,false); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ppS && !dpS){ e.preventDefault(); e.stopPropagation(); closePayPicker(false); } }, true);
addEventListener('resize', () => closePayPicker());
function renderCats(){
  ['income','expense'].forEach(type => {
    const arch = catsOf(type).filter(c => c.archived);
    $(type === 'income' ? '#catsIncome' : '#catsExpense').innerHTML = catsActive(type).map(c => `<div class="cat-row" data-id="${esc(c.id)}">
      <span class="grip" role="button" tabindex="0" title="Arrastra o usa las flechas para ordenar" aria-keyshortcuts="ArrowUp ArrowDown" aria-label="Ordenar ${esc(c.name)} con flecha arriba o abajo">${GRIP}</span>
      <button class="ico" data-act="icon" style="background:${soft(c.color)}" title="Personalizar ícono y color" aria-label="Personalizar ${esc(c.name)}">${iconHTML(c.icon, c.color)}</button>
      <input type="text" data-act="name" aria-label="Nombre de la categoría ${esc(c.name)}" value="${esc(c.name)}">
      ${type === 'income' ? `<button type="button" class="pay-btn${c.pay ? ' set' : ''}" data-act="pay" aria-haspopup="dialog" aria-expanded="false" aria-controls="payPicker" title="${c.pay ? esc(payHumanCfg(payCfg(c.pay))) : 'Día de pago'}">${ic('calendar-days')}<span>${c.pay ? payLabel(c.pay) : 'Día de pago'}</span></button>` : ''}
      <span class="row-acts"><button class="iconbtn" data-act="arch" title="Archivar: deja de aparecer, pero conserva su historial">${ic('archive')}</button><button class="iconbtn" data-act="del" title="Eliminar">${ic('trash-2')}</button></span>
    </div>`).join('') || '<div class="muted small" style="padding:10px 0">Sin categorías.</div>';
    if (arch.length) $(type === 'income' ? '#catsIncome' : '#catsExpense').insertAdjacentHTML('beforeend', `<details class="arch-group"><summary>${CHEV_D}${arch.length} ${arch.length === 1 ? 'categoría archivada' : 'categorías archivadas'}</summary>${arch.map(c => `<div class="arch-row" data-id="${esc(c.id)}"><div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div><span>${esc(c.name)}<small>desde ${monthLong(c.archived).toLowerCase()}</small></span><button class="btn sm" data-unarch="${esc(c.id)}">${ic('archive-restore')} Restaurar</button></div>`).join('')}</details>`);
  });
}
$('#tab-cats').addEventListener('change', e => {
  const row = e.target.closest('.cat-row'); if (!row) return;
  const c = state.categories.find(x => x.id === row.dataset.id), act = e.target.dataset.act;
  if (act === 'name') c.name = e.target.value.trim() || 'Sin nombre';
  save(); keepFocus(renderAll); toast('Categoría actualizada');
});
$('#tab-cats').addEventListener('click', async e => {
  const pb = e.target.closest('.pay-btn'); if (pb){ openPayPicker(pb, pb.closest('.cat-row').dataset.id); return; }
  const ua = e.target.closest('[data-unarch]');
  if (ua){ const c = state.categories.find(x => x.id === ua.dataset.unarch); if (c){ delete c.archived; save(); renderAll(); toast(`«${c.name}» restaurada`, {icon:'archive-restore'}); } return; }
  const ar = e.target.closest('[data-act="arch"]');
  if (ar){ const c = state.categories.find(x => x.id === ar.closest('.cat-row').dataset.id); if (!c) return;
    const row = ar.closest('.cat-row'); await fadeOut(row);
    c.archived = currentMonth < thisMonth() ? thisMonth() : currentMonth; save(); renderAll();
    toast(`«${c.name}» archivada: ya no aparece al registrar ni en el presupuesto`, {icon:'archive', action:'Deshacer', onAction: () => { delete c.archived; save(); renderAll(); }});
    return; }
  const add = e.target.closest('[data-addcat]');
  if (add){
    const type = add.dataset.addcat;
    const nc = {id:uid(), name:'Nueva categoría', icon:'svg:tag', type, color:PALETTE[state.categories.length % PALETTE.length], defaultBudget:0};
    state.categories.push(nc); if (curTheme()) nc.color = curThemeColorCat(nc);
    save(); renderAll();
    const inputs = document.querySelectorAll(`#${type==='income'?'catsIncome':'catsExpense'} input[data-act=name]`);
    const last = inputs[inputs.length-1]; if (last){ last.focus(); last.select(); }
    return;
  }
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const row = btn.closest('.cat-row'), c = state.categories.find(x => x.id === row.dataset.id);
  if (btn.dataset.act === 'icon') openIcon(icon => { c.icon = icon; save(); renderAll(); },
    {color:c.color, soft:true, themeColor: curThemeColorCat(c), onColor: col => { c.color = col; save(); }}, c.icon);
  if (btn.dataset.act === 'del'){
    const used = state.transactions.filter(t => t.catId === c.id).length;
    const msg = used ? `Tiene ${plural(used, 'movimiento')}; quedarán como "Sin categoría".` : 'También se quitará de tus presupuestos.';
    if (!(await ask({title:`¿Eliminar "${c.name}"?`, msg, icon:c.icon, iconColor:c.color}))) return;
    await fadeOut(row);
    state.categories = state.categories.filter(x => x.id !== c.id);
    Object.values(state.budgets).forEach(b => Object.keys(b).forEach(k => { if (k === c.id || k.endsWith(':' + c.id)) delete b[k]; }));
    Object.values(cycleConfig().defaults || {}).forEach(base => { if (base) delete base[c.id]; });
    save(); renderAll(); toast('Categoría eliminada');
  }
});

/* ---------- Selector de íconos ---------- */
// frame = {color, soft, onColor}: soft=true usa el tono suave (categorías), soft=false el color sólido (logo)
const iconDialog = $('#iconDialog'); let iconCb = null, frameCfg = null, previewIcon = '';
function frameBg(){ const col = frameCfg && frameCfg.color; return !frameCfg ? 'var(--surface-2)' : frameCfg.soft ? soft(col) : (col || '#4f46e5'); }
function iconFor(icon){ // dibuja el ícono como se verá en su marco
  if (!frameCfg) return iconHTML(icon);
  return frameCfg.soft ? iconHTML(icon, frameCfg.color) : iconHTML(icon, null, frameCfg.color || '#4f46e5');
}
function paintPreview(){
  const p = $('#iconPreview'); p.innerHTML = iconFor(previewIcon || '❔');
  p.style.background = frameBg();
  p.style.boxShadow = frameCfg && !frameCfg.soft ? 'inset 0 0 0 1px rgba(127,127,127,.25)' : '';
  p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
}
// Íconos por grupos plegables: solo se dibuja el grupo abierto (evita pintar 277 íconos de golpe)
const CHEV_D = `<svg class="vi chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${VICONS['chevron-down']}</svg>`;
const groupHTML = names => names.map(n => `<button type="button" data-icon="svg:${n}" title="${n}">${svgIcon(n, 'currentColor')}</button>`).join('');
function iconInk(){ return frameCfg && frameCfg.soft ? strokeOn(frameCfg.color) : ''; }
function renderIconGrid(){
  const g = $('#emojiGrid'), cur = isV(previewIcon) ? previewIcon.slice(4) : '';
  const openIdx = Math.max(0, VGROUPS.findIndex(([, names]) => names.includes(cur)));
  g.innerHTML = VGROUPS.map(([gname, names], i) => `<div class="ig${i === openIdx ? ' open' : ''}" data-g="${i}">
    <button type="button" class="ig-head"><span class="ig-prev">${names.slice(0, 4).map(n => svgIcon(n, 'currentColor')).join('')}</span><span class="ig-name">${gname}</span><span class="small muted">${names.length}</span>${CHEV_D}</button>
    <div class="acc-body"><div class="acc-in"><div class="emoji-grid">${i === openIdx ? groupHTML(names) : ''}</div></div></div></div>`).join('');
  g.style.color = iconInk();
  markSel();
  const sel = g.querySelector('.sel'); if (sel) requestAnimationFrame(() => sel.scrollIntoView({block:'nearest'}));
}
function markSel(){ document.querySelectorAll('#emojiGrid [data-icon]').forEach(b => b.classList.toggle('sel', b.dataset.icon === previewIcon)); }
const colorName = hex => (COLORS.find(([h]) => h.toLowerCase() === String(hex || '').toLowerCase()) || [, 'Personalizado'])[1];
const swatchRow = (list, cur) => list.map(([hex, name]) => `<button type="button" class="swatch${hex === cur ? ' active' : ''}" data-frame="${hex}" style="background:${hex}" title="${name}"></button>`).join('');
function renderFrameRow(){ $('#frameField').hidden=!frameCfg;if(frameCfg)paintFrameHead(); }
function openFrameColor(){
 if(!frameCfg)return;const frame=frameCfg;
 openColor(frame.color,color=>{frame.color=color;frame.onColor(color);iconDirty=true;paintFrameHead();paintPreview();$('#emojiGrid').style.color=iconInk();});
}
function paintFrameHead(){ $('#frameSw').style.background = frameCfg.color || '#4f46e5'; $('#frameName').textContent = !frameCfg.color ? 'Predeterminado' : frameCfg.themeColor && frameCfg.color.toLowerCase() === String(frameCfg.themeColor).toLowerCase() ? 'Color del tema ' + curTheme().name : colorName(frameCfg.color);
  const tc = frameCfg.themeColor, r = $('#frameReset'); r.hidden = !tc || String(tc).toLowerCase() === String(frameCfg.color || '').toLowerCase();
  if (!r.hidden) r.querySelector('span').innerHTML = `Usar color del tema <i style="display:inline-block;width:10px;height:10px;border-radius:3px;vertical-align:-1px;background:${tc}"></i>`; }
$('#frameReset').onclick = () => { if (!frameCfg || !frameCfg.themeColor) return; frameCfg.color = frameCfg.themeColor; frameCfg.onColor(frameCfg.themeColor); iconDirty = true;
  paintFrameHead(); paintPreview(); $('#emojiGrid').style.color = iconInk(); };
let iconDirty = false;
function openIcon(cb, frame, current){
  iconCb = cb; frameCfg = frame || null; previewIcon = current || ''; iconDirty = false;
  paintPreview(); renderFrameRow(); renderIconGrid(); iconDialog.showModal();
}
$('#frameHead').onclick=openFrameColor;
$('#emojiGrid').addEventListener('click', e => {
  const h = e.target.closest('.ig-head'); if (!h) return;
  const ig = h.parentElement, open = !ig.classList.contains('open');
  document.querySelectorAll('#emojiGrid .ig.open').forEach(x => x !== ig && x.classList.remove('open'));
  if (open){ const grid = ig.querySelector('.emoji-grid'); if (!grid.children.length){ grid.innerHTML = groupHTML(VGROUPS[ig.dataset.g][1]); markSel(); } }
  ig.classList.toggle('open', open);
  if(open)setTimeout(()=>{if(ig.isConnected&&ig.classList.contains('open'))ig.scrollIntoView({block:'nearest',behavior:reduceMotion()?'instant':'smooth'});},reduceMotion()?0:MOTION.panel);
});
iconDialog.addEventListener('close', () => { if (iconDirty){ iconDirty = false; renderAll(); } });
$('#emojiGrid').addEventListener('click', e => { const b = e.target.closest('[data-icon]'); if (b){ iconDialog.close(); iconCb && iconCb(b.dataset.icon); } });
