// Presupuesto: recurring.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Recurrentes ---------- */
const recDone = (r, m) => state.transactions.some(t => t.date.slice(0,7) === m && t.recId === r.id);
const recSkipped = (r, m) => (r.skipped || []).includes(m);
const recDue = (r, m) => m < thisMonth() || (m === thisMonth() && new Date().getDate() >= Math.min(r.day, daysIn(m)));
const recPending = m => state.recurring.filter(r => r.active !== false && (!r.start || r.start <= m) && !recDone(r, m) && !recSkipped(r, m));
// Id fijo por recurrente y mes: si dos dispositivos lo crean a la vez, al sincronizar quedan como uno solo
const recTxId = (r, m) => { const id = 'rec-' + r.id + '-' + m; return state.transactions.some(t => t.id === id) ? uid() : id; };
const recTx = (r, m, extra) => ({id:recTxId(r, m), created:Date.now(), type:r.type, amount:r.amount, catId:r.catId, date:dateFor(m, r.day), method:r.method, desc:r.desc || getCat(r.catId).name, recId:r.id, ...(extra || {})});
function runAutoRecurring(silent){
  const tm = thisMonth(); let n = 0;
  state.recurring.filter(r => r.active !== false && r.auto).forEach(r => {
    // Solo se concilian los últimos diez años; una regla antigua también alcanza el mes actual.
    let m = (r.start || tm) > shiftMonth(tm,-119) ? (r.start || tm) : shiftMonth(tm,-119), guard = 0;
    while (m <= tm && guard++ < 120){
      if (recDue(r, m) && !recDone(r, m) && !recSkipped(r, m)){ state.transactions.push(recTx(r, m)); n++; }
      m = shiftMonth(m, 1);
    }
  });
  if (n){ save(); if (!silent) toast(`${n} movimiento${n > 1 ? 's' : ''} recurrente${n > 1 ? 's' : ''} registrado${n > 1 ? 's' : ''} automáticamente 🔁`); }
  return n;
}
function recLabel(r){ return esc(r.desc || getCat(r.catId).name); }
// Categorías que parecen pagos fijos mensuales (suscripciones, servicios) y aún no tienen recurrente
function recSuggestions(){
  const hidden = state.settings.recSugHidden || [];
  return catsActive('expense').filter(c => ['fun','bills','tech'].includes(roleOf(c)) && Number(c.defaultBudget) > 0 && !hidden.includes(c.id) && !state.recurring.some(r => r.catId === c.id));
}
function renderSuggestions(){
  const el = $('#recSuggest'), list = recSuggestions(); el.hidden = !list.length; if (!list.length) return;
  const open = el.querySelector('details') ? el.querySelector('details').open : false;
  el.innerHTML = `<details class="sug"${open ? ' open' : ''}><summary>${ic('sparkles')}<span><b>${plural(list.length, 'sugerencia')}</b> de recurrentes · ${list.slice(0, 3).map(c => esc(c.name)).join(', ')}${list.length > 3 ? '…' : ''}</span>${CHEV_D}</summary>
    <p class="small muted" style="margin:10px 0 4px">Estas categorías parecen pagos fijos mensuales. Conviértelas en recurrentes para que se registren solas.</p>`
    + list.map(c => `<div class="sug-row"><div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div><div class="name" style="font-weight:600">${esc(c.name)}</div><div class="small muted">${fmt(c.defaultBudget)} al mes</div></div>
      <button class="btn sm primary" data-sug-make="${esc(c.id)}" title="Crear recurrente">${ic('repeat')}<span class="hide-m"> Crear recurrente</span></button>
      <button class="iconbtn" data-sug-hide="${esc(c.id)}" title="No sugerir">${ic('x')}</button></div>`).join('') + '</details>';
}
function renderRec(){
  renderUpcoming(); renderSuggestions();
  const m = currentMonth, pend = recPending(m);
  const skipped = state.recurring.filter(r => r.active !== false && recSkipped(r, m) && !recDone(r, m));
  $('#recPendingTitle').textContent = 'Pendientes por confirmar · ' + monthLong(m);
  const pendRow = r => {
    const c = getCat(r.catId), isI = r.type === 'income', due = recDue(r, m);
    const status = r.auto && !due ? `automático el ${Math.min(r.day, daysIn(m))}${r.day === 31 ? " (fin de mes)" : ""}` : due ? '<span class="neg">vencido</span>' : `vence el ${Math.min(r.day, daysIn(m))}${r.day === 31 ? " (fin de mes)" : ""}`;
    return `<div class="prow rec-row">
      <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div><div class="name">${recLabel(r)}</div><div class="small muted">${esc(c.name)} · ${status}</div></div>
      <div class="amt"><b class="${isI ? 'pos' : 'xp'}">${fmt(r.amount)}</b></div>
      <div class="row-actions"><button class="btn sm primary" data-rec-ok="${esc(r.id)}">${ic('check')} Registrar</button>
        <button class="iconbtn" data-rec-custom="${esc(r.id)}" title="Registrar con otro monto o fecha">${ic('pencil')}</button>
        <button class="iconbtn" data-rec-skip="${esc(r.id)}" title="Omitir este mes">${ic('skip-forward')}</button></div>
    </div>`;
  };
  const skipRow = r => { const c = getCat(r.catId); return `<div class="prow rec-row paused">
      <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div><div class="name">${recLabel(r)}</div><div class="small muted">Omitido este mes</div></div>
      <div class="amt">${fmt(r.amount)}</div>
      <div class="row-actions"><button class="btn sm" data-rec-unskip="${esc(r.id)}">${ic('undo-2')} Restaurar</button></div></div>`; };
  $('#recPending').innerHTML = (pend.length ? pend.sort((a,b) => a.day - b.day).map(pendRow).join('') : '<p class="rec-all-clear small muted">Todo al día en este mes.</p>')
    + skipped.map(skipRow).join('');

  ['expense','income'].forEach(type => {
    const list = state.recurring.filter(r => r.type === type).sort((a,b) => a.day - b.day);
    const total = list.filter(r => r.active !== false).reduce((a,r) => a + Number(r.amount || 0), 0);
    $(type === 'expense' ? '#recExpense' : '#recIncome').innerHTML = list.length ? list.map(r => {
      const c = getCat(r.catId), paused = r.active === false;
      return `<div class="prow rec-row${paused ? ' paused' : ''}">
        <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
        <div><div class="name">${recLabel(r)}</div><div class="small muted">${r.day === 31 ? "Fin de mes" : "Día " + r.day} · ${r.auto ? 'Automático' : 'Manual'}${r.method ? ' · ' + esc(r.method) : ''}${paused ? ' · En pausa' : ''}</div></div>
        <div class="amt"><b>${fmt(r.amount)}</b></div>
        <div class="row-actions"><details class="rec-actions"><summary aria-label="Opciones de ${recLabel(r)}">⋯</summary><div class="rec-action-list"><button class="iconbtn" data-rec-edit="${esc(r.id)}" title="Editar">${ic('pencil')} Editar</button>
          <button class="iconbtn" data-rec-toggle="${esc(r.id)}" title="${paused ? 'Reanudar' : 'Pausar'}">${ic(paused ? 'play' : 'pause')} ${paused?'Reanudar':'Pausar'}</button>
          <button class="iconbtn" data-rec-del="${esc(r.id)}" title="Eliminar">${ic('trash-2')} Eliminar</button></div></details></div>
      </div>`; }).join('') + `<div class="list-total"><span>Total mensual</span><span class="${type === 'income' ? 'pos' : 'xp'}">${fmt(total)}</span></div>`
      : emptyBox('repeat', `Aún no tienes ${type === 'income' ? 'ingresos' : 'gastos'} recurrentes.`, 'rec', 'Nuevo', true);
  });
}
$('#btnNewRec').onclick = () => openRec();
document.addEventListener('click', e => { if (e.target.closest('[data-ins-rec]')){ showTab('movs'); setMovView('rec'); } });
$('#view-rec').addEventListener('click', e => {
  const mk = e.target.closest('[data-sug-make]'), hd = e.target.closest('[data-sug-hide]');
  if (mk){ const c = state.categories.find(x => x.id === mk.dataset.sugMake); if (c) openRec(null, {catId:c.id, amount:c.defaultBudget, desc:c.name, type:'expense'}); }
  if (hd){ (state.settings.recSugHidden = state.settings.recSugHidden || []).push(hd.dataset.sugHide); save(); renderSuggestions(); }
});
$('#view-rec').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const id = b.dataset.recOk || b.dataset.recCustom || b.dataset.recSkip || b.dataset.recUnskip || b.dataset.recEdit || b.dataset.recToggle || b.dataset.recDel;
  const r = id && state.recurring.find(x => x.id === id); if (!r) return;
  const menu=b.closest('.rec-actions');if(menu)menu.open=false;
  const m = currentMonth;
  if (b.dataset.recOk){ state.transactions.push(recTx(r, m)); save(); renderAll(); toast('Registrado ✅'); }
  if (b.dataset.recCustom) openTx(null, {type:r.type, catId:r.catId, amount:r.amount, method:r.method, desc:r.desc, date:dateFor(m, r.day), recId:r.id});
  if (b.dataset.recSkip){ await fadeOut(b.closest('.prow')); (r.skipped = r.skipped || []).push(m); save(); renderAll(); toast('Omitido este mes'); }
  if (b.dataset.recUnskip){ r.skipped = (r.skipped || []).filter(x => x !== m); save(); runAutoRecurring(true); renderAll(); }
  if (b.dataset.recEdit) openRec(r.id);
  if (b.dataset.recToggle){ r.active = r.active === false; save(); if (r.active) runAutoRecurring(true); renderAll(); toast(r.active ? 'Reanudado' : 'En pausa'); }
  if (b.dataset.recDel && await ask({title:`¿Eliminar "${r.desc || getCat(r.catId).name}"?`, msg:'Los movimientos que ya registró se mantienen.'})){
    await fadeOut(b.closest('.prow')); state.recurring = state.recurring.filter(x => x.id !== r.id); save(); renderAll(); toast('Recurrente eliminado');
  }
});

document.addEventListener('pointerdown',e=>{document.querySelectorAll('.rec-actions[open]').forEach(d=>{if(!d.contains(e.target))d.open=false;});});
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const d=e.target.closest('.rec-actions[open]');if(d){e.preventDefault();d.open=false;d.querySelector('summary').focus();}});
