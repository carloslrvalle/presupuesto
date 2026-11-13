// Presupuesto: goals.js — ver README.md del proyecto para responsabilidades y orden de carga.
/* ---------- Metas de ahorro ---------- */
const goalOut = g => (g.out || []).reduce((a, w) => a + Number(w.a || 0), 0);
// Metas compartidas: la meta vive en los datos de quien la creó; ambos usuarios pueden aportar
const otherProfile = () => activeProfile === 'p1' ? 'p2' : 'p1';
let _oth = null;
function otherState(){
  if (_oth) return _oth.st;
  let st = null; try { const r = localData.readText(storeKey(otherProfile())); st = r ? cleanState(JSON.parse(r)) : null; } catch(e){}
  _oth = {st}; qMicro(() => { _oth = null; }); return st;
}
const foreignGoals = () => { const o = otherState(); return o ? (o.goals || []).filter(g => g.shared).map(g => Object.assign({}, g, {_foreign:true})) : []; };
const myGoals = () => state.goals.concat(foreignGoals());
const goalOwner = g => g._foreign ? otherProfile() : activeProfile;
// Aportes por persona (sin programados); el «ya ahorrado» inicial cuenta para quien creó la meta
function goalTxs(g){
  const mine = state.transactions.filter(t => t.goalId === g.id && !isPlanned(t)).map(t => ({t, who:activeProfile}));
  const o = g.shared ? otherState() : null;
  const theirs = o ? (o.transactions || []).filter(t => t.goalId === g.id && !(t.date > todayISO())).map(t => ({t, who:otherProfile()})) : [];
  return mine.concat(theirs);
}
function goalSplit(g){
  const by = {p1:0, p2:0}; goalTxs(g).forEach(x => by[x.who] += Number(x.t.amount) || 0);
  by[goalOwner(g)] += Number(g.initial || 0); return by;
}
const goalSaved = g => { const sp = goalSplit(g); return sp.p1 + sp.p2 - goalOut(g); };
const PRIO = {crit:{n:'Crítica', i:'flame', c:'var(--expense)', r:0, h:'Lo primero: fondo de emergencia, deudas o pagos que no pueden esperar.'},
  high:{n:'Alta', i:'flag', c:'#f59e0b', r:1, h:'Importante; aporta apenas cubras las críticas.'},
  norm:{n:'Normal', i:'target', c:'var(--muted)', r:2, h:'Avanza a su ritmo.'},
  low:{n:'Baja', i:'clock', c:'var(--muted)', r:3, h:'Un gusto o deseo; puede esperar.'}};
const prioOf = g => PRIO[g.prio] ? g.prio : 'norm';
const goalsSorted = () => myGoals().map((g, i) => ({g, i})).sort((a, b) => (goalDone(a.g) - goalDone(b.g)) || (PRIO[prioOf(a.g)].r - PRIO[prioOf(b.g)].r) || a.i - b.i).map(x => x.g);
const prioBadge = g => { const p = prioOf(g); return p === 'norm' || goalDone(g) ? '' : `<span class="prio" style="--pc:${PRIO[p].c}">${ic(PRIO[p].i)}${PRIO[p].n}</span>`; };
function goalDone(g){ return Number(g.target)>0&&Math.round(goalSaved(g)*100)>=Math.round(Number(g.target)*100); }
const monthsBetween = (a, b) => { const [y1,m1] = a.split('-').map(Number), [y2,m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };
// Categoría de gasto de ahorro (por nombre o ícono): sus gastos pueden ir a una meta
function renderGoals(){
  const grid = $('#goalsGrid'), newGoal = $('#btnNewGoal');
  newGoal.hidden = true;
  if (!myGoals().length){
    grid.innerHTML = `<div class="card" style="grid-column:1/-1"><div class="empty" style="height:160px;gap:10px"><div class="empty-ic">${ic('piggy-bank')}</div><div>Crea tu primera meta: fondo de emergencia, viaje, laptop…</div><button class="btn primary" data-goal-new>${ic('plus')} Nueva meta</button></div></div>`;
    if (activeTab() === 'goals') updateCreationControls();
    return;
  }
  const tm = thisMonth(), sorted = goalsSorted(), doneOpen = grid.querySelector('.goal-done-group')?.open;
  const cards = sorted.map((g, index) => {
    const saved = goalSaved(g), target = Number(g.target) || 0, pct = target ? Math.min(saved / target * 100, 100) : 0, rem = Math.max(0, target - saved);
    const gx = goalTxs(g), monthAmt = sum(gx.filter(x => x.t.date.slice(0, 7) === tm).map(x => x.t));
    // Datos clave en tres bloques, en lugar de una frase larga
    const stat = (k, v, cls = '') => `<div class="gs"><span>${k}</span><b class="${cls}">${v}</b></div>`;
    let stats;
    if (goalDone(g)) stats = `<div class="goal-done">${ic('check')} Meta lograda</div>`;
    else {
      const expired=g.deadline&&g.deadline<todayISO(),ml=g.deadline&&!expired?monthsBetween(tm,g.deadline.slice(0,7))+1:0;
      // Ritmo: promedio de aportes de los últimos 3 meses (incluye este)
      const r3 = [0, 1, 2].map(k => shiftMonth(tm, -k)).map(mm => sum(gx.filter(x => x.t.date.slice(0, 7) === mm).map(x => x.t)));
      const pace = r3.reduce((a, v) => a + v, 0) / 3;
      let eta = '';
      if (pace > 0){
        const n = Math.ceil(rem / pace), when = shiftMonth(tm, n), w = monthLong(when).toLowerCase();
        const late = g.deadline && when > g.deadline.slice(0, 7) ? monthsBetween(g.deadline.slice(0, 7), when) : 0;
        eta = late ? `<div class="goal-eta warn">${ic('clock')} Si mantienes tu promedio, llegarías en ${w}, después de la fecha objetivo</div>`
                   : `<div class="goal-eta ok">${ic('trending-up')} Si mantienes tu promedio, llegarías en ${w}</div>`;
      } else eta = `<div class="goal-eta">${ic('clock')} Sin aportes en los últimos 3 meses</div>`;
      stats = eta + `<div class="goal-stats">${stat('Faltan', fmt(rem))}${g.deadline ? (ml > 0 ? stat('Ahorra al mes', fmt(rem / ml)) : stat('Plazo', 'Vencido', 'neg')) : stat('Plazo', 'Libre')}${stat('Este mes', fmt(monthAmt), monthAmt ? 'pos' : '')}</div>`;
    }
    // Compartida: quién la creó y cuánto aportó cada uno
    const owner = profOf(goalOwner(g)), other = profOf(goalOwner(g) === 'p1' ? 'p2' : 'p1'), sp = goalSplit(g), spT = sp.p1 + sp.p2;
    const share = g.shared ? `<div class="goal-split"><div class="gsp-leg">${profiles.list.map(pr => `<span>${avatarBox(pr, 'xs')}${esc(pr.name)} <b>${fmt(sp[pr.id])}</b>${spT > 0 ? ` <em>${Math.round(sp[pr.id] / spT * 100)}%</em>` : ''}</span>`).join('')}</div></div>` : '';
    const shareTag = g.shared ? `<span class="share-tag">${ic('users')}${g._foreign ? 'De ' + esc(owner.name) : 'Con ' + esc(other.name)}</span>` : '';
    const help = index === 0 && !goalDone(g) ? `<button type="button" class="info-tip" aria-label="Ayuda sobre aportes" data-tip="Aporta con «Aportar», o elige la meta al registrar un ingreso o un gasto en tu categoría de ahorro.">${ic('info')}</button>` : '';
    return `<div class="card goal-card${goalDone(g)?' completed':''}${goalDone(g) ? '' : ' p-' + prioOf(g)}${g.shared ? ' shared' : ''}">
      <div class="goal-head"><div class="ico" style="background:${soft(g.color)}">${iconHTML(g.icon, g.color)}</div>
        <div style="flex:1;min-width:0"><div class="goal-title"><div class="name">${esc(g.name)}</div>${help}</div><div class="small muted g-sub">${shareTag}${prioBadge(g)}${g.deadline ? 'Hasta el ' + fmtDateLong(g.deadline) + (goalDone(g) ? '' : (() => { const ml = monthsBetween(tm, g.deadline.slice(0,7)) + 1; return g.deadline >= todayISO() && ml > 0 ? ` · ${ml} ${ml === 1 ? 'mes' : 'meses'}` : ''; })()) : 'Sin fecha límite'}</div></div>
        ${g._foreign ? '' : `<button class="iconbtn" data-goal-edit="${esc(g.id)}" title="Editar">${ic('pencil')}</button>`}</div>
      <div class="goal-value"><div class="goal-amt"><b>${fmt(saved)}</b><span class="muted small">de ${fmt(target)}</span>${goalDone(g)?'':`<span class="goal-pct" style="color:var(--accent-ink,var(--primary))">${pct.toFixed(0)}%</span>`}</div>
      ${goalDone(g)?'':g.shared ? `<div class="bar big split" title="Aporte de cada uno sobre el objetivo">${profiles.list.map(pr => { const w = target ? Math.max(0, Math.min(100, sp[pr.id] / Math.max(target, spT) * 100)) : 0; return `<span data-k="goal:${esc(g.id)}:${esc(pr.id)}" data-w="${w.toFixed(2)}" style="width:${w}%;background:${pr.color}"></span>`; }).join('')}</div>`
        : `<div class="bar big"><span data-k="goal:${esc(g.id)}" data-w="${pct.toFixed(2)}" style="width:${pct}%;background:${barFill(g.color)}"></span></div>`}
      </div>
      <div class="goal-status">${stats}${goalOut(g)?`<div class="goal-out">${ic('hand-coins')} ${g._foreign?esc(owner.name)+' retiró':'Retiraste'} ${fmt(goalOut(g))} en total</div>`:''}</div>
      <div class="goal-sharing">${g.shared?`<details class="goal-contributions"><summary>Ver aportes</summary>${share}</details>`:share}</div>
      <div class="goal-btns">${goalDone(g) ? '' : `<button class="btn sm" data-goal-add="${esc(g.id)}">${ic('plus')} Aportar</button>`}${saved > 0 && !g._foreign ? `<button class="btn sm ghost" data-goal-out="${esc(g.id)}">${ic('hand-coins')} Retirar</button>` : ''}</div>
    </div>`;
  });
  const activeCount = sorted.findIndex(goalDone), split = activeCount < 0 ? sorted.length : activeCount;
  newGoal.hidden = split !== 0;
  if (activeTab() === 'goals') updateCreationControls();
  grid.innerHTML = cards.slice(0, split).join('') + (split < cards.length ? `<details class="goal-done-group"${doneOpen?' open':''}><summary>${ic('check')} ${split===0?'Todas tus metas están logradas':'Metas logradas'} <span>${cards.length-split}</span>${ic('chevron-down')}</summary><div class="goals-grid">${cards.slice(split).join('')}</div></details>` : '');
  animateBars(grid);
}
const goalDialog = $('#goalDialog'); let goalEdit = null, gIcon = 'svg:target', gColor = '#10b981', gPrio = 'norm';
function paintPrio(){ $('#gPrio').innerHTML = Object.entries(PRIO).map(([k, v]) => `<button type="button" data-prio="${k}" class="${k === gPrio ? 'active' : ''}" style="--pc:${v.c}">${ic(v.i)}${v.n}</button>`).join(''); $('#gPrioHint').textContent = PRIO[gPrio].h; }
$('#gPrio').addEventListener('click', e => { const b = e.target.closest('[data-prio]'); if (!b) return; gPrio = b.dataset.prio; paintPrio(); });
function paintGoalIcon(){ const b = $('#gIcon'); b.innerHTML = iconHTML(gIcon, gColor); b.style.background = soft(gColor); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
function openGoal(id){
  const g = id ? state.goals.find(x => x.id === id) : null; goalEdit = g ? g.id : null;
  gIcon = g ? g.icon : 'svg:target'; gColor = g ? g.color : PALETTE[(state.goals.length + 2) % PALETTE.length];
  $('#goalTitle').textContent = g ? 'Editar meta' : 'Nueva meta';
  $('#gName').value = g ? g.name : ''; $('#gTarget').value = g ? g.target : '';
  $('#gInitial').value = g && g.initial ? g.initial : ''; $('#gDeadline').value = (g && g.deadline) || '';
  $('#goalDelete').style.display = g ? '' : 'none';
  gPrio = g ? prioOf(g) : 'norm'; paintPrio();
  $('#gShared').checked = !!(g && g.shared); $('#gSharedLbl').textContent = 'Compartir con ' + profOf(otherProfile()).name;
  paintGoalIcon(); goalDialog.showModal(); setTimeout(() => $('#gName').focus(), 50);
}
$('#gIcon').onclick = () => openIcon(ic => { gIcon = ic; paintGoalIcon(); }, {color:gColor, soft:true, themeColor: curThemeColorGoal(goalEdit), onColor: col => { gColor = col; paintGoalIcon(); }}, gIcon);
$('#goalForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#gName').value.trim(), target = Math.round(parseFloat($('#gTarget').value) * 100) / 100;
  if (!name) return toast('Ponle un nombre a la meta');
  if (!(target > 0)) return toast('Ingresa el monto objetivo');
  const data = {name, target, initial: Math.max(0, parseFloat($('#gInitial').value) || 0), deadline: $('#gDeadline').value || '', icon:gIcon, color:gColor, prio:gPrio, shared:$('#gShared').checked || undefined};
  const previous = goalEdit && state.goals.find(g => g.id === goalEdit);
  if (goalEdit && !previous) return toast('⚠️ La meta ya no está disponible.');
  const otherContribution = previous?.shared && !data.shared ? goalSplit(previous)[otherProfile()] : 0;
  const otherName = profOf(otherProfile()).name;
  if (!saveChange(() => {
    if (previous) Object.assign(previous, data);
    else state.goals.push({id:uid(), created:Date.now(), ...data});
  }, goalDialog)) return;
  goalDialog.close(); renderAll(); toast(goalEdit ? 'Meta actualizada' : 'Meta creada 🎯');
  if (otherContribution > 0) setTimeout(() => toast(`Los aportes de ${otherName} (${fmt(otherContribution)}) dejan de sumarse a esta meta`, {icon:'users'}), 400);
});
$('#goalDelete').onclick = async () => {
  const g = state.goals.find(x => x.id === goalEdit), profile = activeProfile; if (!g) return;
  if (!(await ask({title:`¿Eliminar "${g.name}"?`, msg:'Los aportes registrados se mantienen como movimientos, pero ya no estarán asociados a la meta.', icon:g.icon, iconColor:g.color}))) return;
  if (activeProfile !== profile || !saveChange(() => {
    state.goals = state.goals.filter(x => x.id !== g.id);
    state.transactions.forEach(t => { if (t.goalId === g.id) delete t.goalId; });
  }, goalDialog)) return;
  goalDialog.close(); renderAll(); toast('Meta eliminada');
};
$('#btnNewGoal').onclick = () => openGoal();
$('#goalsGrid').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.hasAttribute('data-goal-new')) openGoal();
  if (b.dataset.goalEdit) openGoal(b.dataset.goalEdit);
  if (b.dataset.goalOut) openWithdraw(b.dataset.goalOut);
  if (b.dataset.goalAdd){
    const g = myGoals().find(x => x.id === b.dataset.goalAdd);
    if (g) openTx(null, {type:'expense', goalId:g.id, desc:'Aporte: ' + g.name, contribution:true});
  }
});

// Retirar dinero de una meta: se descuenta de lo ahorrado (no cuenta como ingreso ni gasto del mes)
let wdGoalId = null;
function openWithdraw(id){
  const g = state.goals.find(x => x.id === id); if (!g) return; wdGoalId = id;
  $('#wdTitle').textContent = 'Retirar de «' + g.name + '»';
  $('#wdHint').textContent = `Tienes ${fmt(goalSaved(g))} ahorrados en esta meta. Lo que retires se descuenta de su avance.`;
  $('#wdAmount').value = ''; $('#wdAmount').max = goalSaved(g); $('#wdDate').max = todayISO(); $('#wdDate').value = todayISO(); $('#wdNote').value = '';
  $('#wdDialog').showModal(); setTimeout(() => $('#wdAmount').focus(), 50);
}
$('#wdForm').addEventListener('submit', e => {
  e.preventDefault();
  const g = state.goals.find(x => x.id === wdGoalId), profile = activeProfile;
  if (!g) return toast('⚠️ La meta ya no está disponible.');
  const date = $('#wdDate').value || todayISO();
  if (date > todayISO()) return toast('El retiro debe tener fecha de hoy o anterior');
  const a = Math.round(parseFloat($('#wdAmount').value) * 100) / 100, have = goalSaved(g);
  if (!(a > 0)) return toast('Ingresa un monto válido');
  if (a > have + .005) return toast(`Solo tienes ${fmt(have)} en esta meta`);
  const w = {id:uid(), d:date, a, n:$('#wdNote').value.trim()};
  if (!saveChange(() => { g.out = [...(g.out || []), w]; }, $('#wdDialog'))) return;
  $('#wdDialog').close(); renderAll();
  toast(`Retiraste ${fmt(a)} de «${g.name}»`, {icon:'hand-coins', action:'Deshacer', onAction: () => {
    if (activeProfile !== profile) return;
    const goal = state.goals.find(x => x.id === g.id);
    if (goal && saveChange(() => { goal.out = (goal.out || []).filter(x => x.id !== w.id); })) renderAll();
  }});
});

// ---------- Cierre de mes: al empezar un mes nuevo, cómo te fue en el anterior ----------
function maybeMonthClose(){
  const cy=cycleEnabled(),tm = cy?cycleMonthForDate():thisMonth(), pm = shiftMonth(tm, -1), dialog = $('#closeDialog'),closeKey=cy?cycleBudgetKey(tm):tm;
  if (bothMode || document.querySelector('dialog[open]') || state.settings.lastClose === closeKey || !state.settings.onboarded && !state.transactions.length) return;
  const txs = cy?cycleTx(pm):txOfMonth(pm); if (!txs.length){ state.settings.lastClose = closeKey; return save(); }
  const inc = sum(txs.filter(t => t.type === 'income')), exp = sum(txs.filter(t => t.type === 'expense')), bExp = cy?cycleTotal(pm,'expense'):totalBudget(pm, 'expense'), sv = cy?cycleSavings(pm):savingsOf(pm), cash = cy?cycleBalance(pm):balanceOfMonth(pm);
  const result = cash.result, positive = result > .005;
  $('#clTitle').textContent = cy?'Cierre del ciclo':'Cierre de ' + monthLong(pm).toLowerCase();
  const k = (l,v,cls='',tone='neutral') => `<div data-tone="${tone}"><span>${l}</span><b class="${cls}">${v}</b></div>`;
  $('#clBody').innerHTML = `<p class="cl-context">${esc(profOf(activeProfile).name)} · ${cy?cycleLabel(pm):"Movimientos registrados de "+monthLong(pm).toLowerCase()}</p>
    <div class="cl-hero" data-tone="${result < -.005 ? 'bad' : positive ? 'good' : 'neutral'}">${ic(result < -.005 ? 'triangle-alert' : positive ? 'check' : 'minus')}<div><span>Resultado ${cy?"del ciclo":"del mes"}</span><b>${fmt(result)}</b><span>${result < -.005 ? 'Los gastos superaron los ingresos del período.' : positive ? 'Ingresos menos gastos registrados.' : 'Ingresos y gastos en equilibrio.'}</span></div></div>
    <div class="cd-stats">${k('Ingresos',fmt(inc),'pos','income')}${k('Gastos',fmt(exp),'neg','expense')}${k(saveMode() === 'set' ? 'Ahorro separado' : 'Ahorro del mes',fmt(sv.saved),sv.saved < 0 ? 'neg' : '',sv.saved < 0 ? 'expense' : 'saving')}</div>
    <div class="cl-balances">${k('Saldo anterior',fmt(cash.previous),'','previous')}${k('Saldo al cierre',fmt(cash.total),cash.total < 0 ? 'neg' : '',cash.total < 0 ? 'expense' : 'saving')}</div>
    <ul class="cl-summary" aria-label="Balance del mes">
      <li><span>Presupuesto</span><b class="${bExp > 0 && exp > bExp + .005 ? 'neg' : ''}">${bExp <= 0 ? 'Sin definir' : Math.abs(exp-bExp)<.005 ? 'Completo' : exp > bExp ? fmt(exp-bExp) + ' de exceso' : fmt(bExp-exp) + ' disponibles'}</b></li>
      ${sv.pct ? `<li><span>Meta de ahorro · ${sv.pct}%</span><b>${sv.base <= 0 ? 'Sin ingresos' : sv.saved >= sv.target ? 'Cumplida' : 'Faltan ' + fmt(sv.target-sv.saved)}</b></li>` : ''}
    </ul>`;
  dialog.dataset.month = pm;dialog.dataset.cycle=String(cy);dialog.querySelector('[data-cl=an]').textContent=cy?'Ver presupuesto':'Ver análisis';
  dialog.showModal();
  state.settings.lastClose = closeKey; save();
}
$('#closeDialog').addEventListener('click', e => { if (e.target.closest('[data-cl=an]')){ const m = $('#closeDialog').dataset.month; $('#closeDialog').close(); showTab($('#closeDialog').dataset.cycle==='true'?'budget':'analysis'); goMonth(m); } });
// Si había otro formulario abierto al iniciar, mostrar el resumen cuando termine.
document.addEventListener('close', e => { if (e.target instanceof HTMLDialogElement && e.target.id !== 'closeDialog') setTimeout(maybeMonthClose, 250); }, true);
