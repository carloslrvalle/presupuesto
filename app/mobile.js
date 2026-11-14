// Presentación móvil: reutiliza navegación, perfiles y cálculos existentes.
const mobileLayout = matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
const mobileNav = document.createElement('nav');
mobileNav.id = 'mobileNav';
mobileNav.setAttribute('aria-label', 'Navegación móvil');
const mobileNavItem = (tab, label, icon) => `<button type="button" data-mobile-tab="${tab}"><span class="mobile-nav-glyph">${ic(icon)}</span><span class="mobile-nav-label">${label}</span></button>`;
mobileNav.innerHTML = mobileNavItem('dashboard', 'Inicio', 'house')
  + mobileNavItem('movs', 'Movimientos', 'receipt-text')
  + `<button type="button" id="mobileNew" aria-label="Nuevo movimiento"><span class="mobile-nav-glyph">${ic('plus')}</span><span class="mobile-nav-label">Nuevo</span></button>`
  + mobileNavItem('budget', 'Presupuesto', 'wallet')
  + `<button type="button" id="mobileMoreButton" aria-haspopup="dialog" aria-expanded="false" aria-controls="mobileMore"><span class="mobile-nav-glyph">${ic('list')}</span><span class="mobile-nav-label">Más</span></button>`;
document.body.append(mobileNav);

const mobileMore = document.createElement('dialog');
mobileMore.id = 'mobileMore';
mobileMore.className = 'mobile-more';
mobileMore.setAttribute('aria-labelledby', 'mobileMoreTitle');
const mobileDestinations = [['analysis','Análisis','chart-column'],['goals','Metas','target'],['both','Ambos','users'],['cats','Categorías','tags'],['settings','Ajustes','settings']];
mobileMore.innerHTML = `<div class="dlg-head"><h2 id="mobileMoreTitle">Más opciones</h2><button type="button" class="iconbtn" aria-label="Cerrar opciones">${ic('x')}</button></div><div class="mobile-more-list">`
  + mobileDestinations.map(([tab,label,icon]) => `<button type="button" data-mobile-destination="${tab}">${ic(icon)}<span>${label}${tab==='both'?'<small>Resumen de los dos perfiles</small>':''}</span>${ic('chevron-right')}</button>`).join('') + '</div>';
document.body.append(mobileMore);

function updateMobileNavigation() {
  const current = activeTab();
  mobileNav.querySelectorAll('[data-mobile-tab]').forEach(button => {
    const active = button.dataset.mobileTab === current;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  const more = $('#mobileMoreButton');
  const secondary = mobileDestinations.some(([tab]) => tab === current);
  more.classList.toggle('active', secondary);
  if (secondary) more.setAttribute('aria-current', 'page');
  else more.removeAttribute('aria-current');
  mobileMore.querySelectorAll('[data-mobile-destination]').forEach(button => {
    if (button.dataset.mobileDestination === current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('#mobileNew').disabled = bothMode;
  $('#mobileNew').title = bothMode ? 'Elige un perfil para registrar movimientos' : 'Nuevo movimiento';
}

function navigateMobile(tab) {
  const from = activeTab();
  if (from === tab && !bothMode) {
    window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'});
    return;
  }
  tabScroll[from] = window.scrollY;
  if (tab === 'both') {
    if (bothMode) showTab('both', tabScroll.both || 0);
    else switchProfile('both');
  }
  else showTab(tab, tabScroll[tab] || 0);
}

mobileNav.addEventListener('click', event => {
  const button = event.target.closest('[data-mobile-tab]');
  if (button) navigateMobile(button.dataset.mobileTab);
});
$('#mobileNew').onclick = () => {
  if (!bothMode) openTx(null, activeTab()==='movs' && movView==='cal' && calSel ? {date:calSel} : {});
};
$('#mobileMoreButton').onclick = () => {
  updateMobileNavigation();
  mobileMore.showModal();
  $('#mobileMoreButton').setAttribute('aria-expanded', 'true');
};
mobileMore.querySelector('.dlg-head button').onclick = () => mobileMore.close();
mobileMore.addEventListener('click', event => {
  if (event.target === mobileMore) {
    const bounds = mobileMore.getBoundingClientRect();
    if (event.clientY < bounds.top || event.clientY > bounds.bottom || event.clientX < bounds.left || event.clientX > bounds.right) mobileMore.close();
  }
  const button = event.target.closest('[data-mobile-destination]');
  if (!button) return;
  mobileMore.close();
  navigateMobile(button.dataset.mobileDestination);
});
mobileMore.addEventListener('close', () => {
  $('#mobileMoreButton').setAttribute('aria-expanded', 'false');
  if (mobileLayout.matches) $('#mobileMoreButton').focus({preventScroll:true});
});
mobileLayout.addEventListener('change', () => {
  if (!mobileLayout.matches && mobileMore.open) mobileMore.close();
});

// El inicio móvil reutiliza el ranking del Resumen para mantener el mismo período y orden.
const mobileHomeTop = document.createElement('section');
mobileHomeTop.id = 'mobileHomeTop';
mobileHomeTop.className = 'mobile-only';
mobileHomeTop.setAttribute('aria-labelledby', 'mobileHomeTopTitle');
mobileHomeTop.innerHTML = `<div class="mobile-section-heading"><h2 id="mobileHomeTopTitle">Gastos más altos</h2><button type="button" data-gotab="movs">Ver todos ${ic('chevron-right')}</button></div><div id="mobileHomeTopRows"></div>`;
$('#tab-dashboard .dashboard-kpis').after(mobileHomeTop);
function renderMobileHome(){
  $('#mobileHomeTopRows').innerHTML = $('#topExp').innerHTML;
}

const mobileBudgetView = document.createElement('section');
mobileBudgetView.id = 'mobileBudgetView';
mobileBudgetView.className = 'mobile-only';
mobileBudgetView.setAttribute('aria-labelledby', 'mobileBudgetTitle');
mobileBudgetView.innerHTML = `<div class="mobile-section-heading"><h2 id="mobileBudgetTitle">Presupuestos</h2><span id="mobileBudgetRange"></span></div><div id="mobileBudgetGauge"></div><div class="mobile-budget-categories" id="mobileBudgetCategories"></div>`;
$('#tab-budget .bud-grid').before(mobileBudgetView);

// Las herramientas existentes se despliegan debajo de las tarjetas y vuelven a su sitio en escritorio.
const mobileBudgetOptions = document.createElement('details');
mobileBudgetOptions.id = 'mobileBudgetOptions';
mobileBudgetOptions.className = 'mobile-only mobile-budget-options';
mobileBudgetOptions.innerHTML = '<summary>Ingresos, ahorro y opciones</summary><div class="mobile-budget-options-body"></div>';
$('#tab-budget').append(mobileBudgetOptions);
const mobileBudgetTools = [$('#tab-budget .bud-side'), $('#tab-budget .budget-actions .btn-row')].map(node => {
  const anchor = document.createComment('Posición de las opciones de presupuesto en escritorio');
  node.before(anchor);
  return {node,anchor};
});
function positionMobileBudgetOptions(){
  for (const {node,anchor} of mobileBudgetTools){
    if (mobileLayout.matches) mobileBudgetOptions.lastElementChild.append(node);
    else anchor.after(node);
  }
}
mobileLayout.addEventListener('change', positionMobileBudgetOptions);
positionMobileBudgetOptions();

function renderMobileBudget(){
  const m = currentMonth;
  const rows = catsOf('expense').filter(c => !isArch(c,cycleView()?cyclePeriod(m).start.slice(0,7):m) || planReal(m,c.id))
    .map(c => ({c, budget:planBudget(m,c.id), real:planReal(m,c.id)}));
  const budget = rows.reduce((total,row) => total+row.budget,0), real = rows.reduce((total,row) => total+row.real,0);
  const left = budget-real, used = budget>0 ? Math.max(0,real/budget*100) : 0;
  $('#mobileBudgetRange').textContent = cycleView() ? 'Por ciclo de sueldo' : 'Por mes';
  $('#mobileBudgetGauge').innerHTML = `<div class="mobile-budget-gauge"><svg viewBox="0 0 240 140" aria-hidden="true"><path class="gauge-track" d="M24 120 A96 96 0 0 1 216 120" pathLength="100"/><path class="gauge-fill${left<0?' over':''}" d="M24 120 A96 96 0 0 1 216 120" pathLength="100" stroke-dasharray="${Math.min(100,used)} 100"/></svg><div class="mobile-gauge-copy"><span>${budget>0?(left<0?'Exceso del presupuesto':'Por gastar del presupuesto'):'Presupuesto de gastos'}</span><strong class="${budget>0&&left<0?'neg':''}">${budget>0?fmt(Math.abs(left)):'Sin definir'}</strong><small>${budget>0?`${pctTxt(used)} usado`:'Asigna un monto por categoría'}</small></div></div><p class="mobile-gauge-totals"><span>Gastado <b>${fmt(real)}</b></span><span>Plan <b>${fmt(budget)}</b></span></p>`;
  $('#mobileBudgetCategories').innerHTML = rows.length ? rows.map(({c,budget,real}) => {
    const saving = isSavingCat(c.id), left = budget-real, pct = budget>0?real/budget*100:0;
    const over = !saving && budget>0 && left<-.005;
    const caption = !budget ? (real?'Gastado sin presupuesto':'Toca para asignar') : saving ? (left>0?'Por ahorrar':'Ahorro adicional') : left<-.005?'Exceso':'Por gastar';
    return `<button type="button" class="mobile-budget-tile${over?' over':''}" data-mobile-budget-edit="${esc(c.id)}" aria-label="Editar presupuesto de ${esc(c.name)}"><span class="mobile-budget-tile-name"><span class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><b>${esc(c.name)}</b></span><span class="mobile-budget-tile-status">${budget?`${pctTxt(pct)} ${saving?'ahorrado':'usado'}`:'Sin presupuesto'}</span><strong>${budget?fmt(Math.abs(left)):real?fmt(real):'Sin definir'}</strong><span class="mobile-budget-tile-caption">${caption}</span><span class="mobile-budget-tile-track" aria-hidden="true"><i style="width:${Math.min(100,Math.max(0,pct))}%;background:${over?'var(--expense)':esc(c.color)}"></i></span><span class="mobile-budget-tile-plan">Plan ${fmt(budget)} ${ic('pencil')}</span></button>`;
  }).join('') : '<p class="small muted">Crea categorías de gasto para distribuir tu presupuesto.</p>';
}

const mobileBudgetEditor = document.createElement('dialog');
mobileBudgetEditor.id = 'mobileBudgetEditor';
mobileBudgetEditor.setAttribute('aria-labelledby','mobileBudgetEditorTitle');
mobileBudgetEditor.innerHTML = `<form><div class="dlg-head"><h3 id="mobileBudgetEditorTitle">Editar presupuesto</h3><button type="button" class="iconbtn" aria-label="Cerrar">${ic('x')}</button></div><div class="dlg-body"><p id="mobileBudgetEditorCategory"></p><div class="field"><label for="mobileBudgetAmount">Presupuesto en soles</label><input id="mobileBudgetAmount" type="number" inputmode="decimal" min="0" step="0.01" required></div><p class="small muted">Se aplica al período que estás viendo.</p></div><div class="dlg-foot"><button type="button" class="btn" data-mobile-budget-cancel>Cancelar</button><button type="submit" class="btn primary">Guardar</button></div></form>`;
document.body.append(mobileBudgetEditor);
let mobileBudgetDraft = null;
mobileBudgetView.addEventListener('click', event => {
  const button = event.target.closest('[data-mobile-budget-edit]');
  if (!button) return;
  const id = button.dataset.mobileBudgetEdit;
  mobileBudgetDraft = {id,profile:activeProfile,month:currentMonth,cycle:cycleView()?cycleDay():null};
  $('#mobileBudgetEditorCategory').textContent = getCat(id).name;
  $('#mobileBudgetAmount').value = planBudget(currentMonth,id);
  mobileBudgetEditor.showModal();
});
mobileBudgetEditor.querySelector('.dlg-head button').onclick = () => mobileBudgetEditor.close();
mobileBudgetEditor.querySelector('[data-mobile-budget-cancel]').onclick = () => mobileBudgetEditor.close();
mobileBudgetEditor.querySelector('form').onsubmit = event => {
  event.preventDefault();
  const draft = mobileBudgetDraft;
  if (!draft || draft.profile!==activeProfile || draft.month!==currentMonth || draft.cycle!==(cycleView()?cycleDay():null) || !state.categories.some(c=>c.id===draft.id)){
    mobileBudgetEditor.close();toast('El período o perfil cambió. Abre el presupuesto de nuevo.');return;
  }
  if (!saveBudgetAmount(draft.id,$('#mobileBudgetAmount').value)) return;
  mobileBudgetEditor.close();renderAll();
};
mobileBudgetEditor.addEventListener('close', () => {
  const id = mobileBudgetDraft?.id;
  if (id && mobileLayout.matches) [...mobileBudgetView.querySelectorAll('[data-mobile-budget-edit]')].find(button=>button.dataset.mobileBudgetEdit===id)?.focus({preventScroll:true});
  mobileBudgetDraft = null;
});

const mobileMovements = document.createElement('section');
mobileMovements.id = 'mobileMovementsOverview';
mobileMovements.className = 'mobile-only';
mobileMovements.setAttribute('aria-label','Resumen de los movimientos de esta vista');
$('#view-list .mov-filters').before(mobileMovements);

function mobileMovementBins(real,scope){
  let start = currentMonth+'-01', end = currentMonth+'-'+String(daysIn(currentMonth)).padStart(2,'0');
  if (scope==='cycle') ({start,end}=cyclePeriod(currentMonth));
  if (scope==='year') {start=currentMonth.slice(0,4)+'-01-01';end=currentMonth.slice(0,4)+'-12-31';}
  if (scope==='all' && real.length){const dates=real.map(t=>t.date).sort();start=dates[0];end=dates[dates.length-1];}
  const days=Math.max(1,Math.round((Date.parse(end)-Date.parse(start))/864e5)+1);
  const expenses=real.filter(t=>t.type==='expense');
  if(scope==='year') return {days,label:'Gastos por mes',bins:Array.from({length:12},(_,i)=>{
    const month=start.slice(0,4)+'-'+String(i+1).padStart(2,'0');
    return {label:MONTHS_ES[i].slice(0,3),title:monthLong(month),amount:sum(expenses.filter(t=>t.date.startsWith(month)))};
  })};
  const step=scope==='all'?Math.max(1,Math.ceil(days/7)):7;
  return {days,label:scope==='all'?'Gastos del rango':'Gastos por semana',bins:Array.from({length:Math.ceil(days/step)},(_,i)=>{
    const first=BudgetFinance.dateOffset(start,i*step), last=BudgetFinance.dateOffset(start,Math.min(days-1,(i+1)*step-1));
    return {label:first.slice(8,10)+'/'+first.slice(5,7),title:fmtDate(first)+' – '+fmtDate(last),amount:sum(expenses.filter(t=>t.date>=first&&t.date<=last))};
  })};
}
function renderMobileMovements({real,inc,exp,scope}){
  const {days,label,bins}=mobileMovementBins(real,scope), max=Math.max(0,...bins.map(bin=>bin.amount));
  const type=$('#fltType').value;
  const categories=new Map();
  real.filter(t=>t.type==='expense').forEach(t=>categories.set(t.catId,(categories.get(t.catId)||0)+t.amount));
  const ranked=[...categories].sort((a,b)=>b[1]-a[1]), shown=ranked.slice(0,3);
  if(ranked.length>3)shown.push([null,ranked.slice(3).reduce((total,row)=>total+row[1],0)]);
  mobileMovements.innerHTML = `<div class="mobile-movement-net"><div><span>Resultado de esta vista</span><strong class="${inc-exp<0?'neg':''}">${fmt(inc-exp)}</strong></div><div><span>Gasto por día</span><b>${fmt(exp/days)}</b><small>Promedio de ${days} días</small></div></div><div class="mobile-movement-totals">${[['income','Ingresos',inc],['expense','Gastos',exp]].map(([kind,name,amount])=>`<button type="button" data-mobile-type="${kind}" aria-pressed="${type===kind}"><span class="mobile-type-icon ${kind}">${ic('arrow-up-right')}</span><span><small>${name}</small><b>${fmt(amount)}</b></span></button>`).join('')}</div><div class="mobile-spending-head"><h3>${label}</h3><span>${max?`Máx. ${fmt(max)}`:'Sin gastos registrados'}</span></div><ol class="mobile-spending-chart" aria-label="${label}">${bins.map(bin=>`<li aria-label="${esc(bin.title)}: ${esc(fmt(bin.amount))}"><span class="mobile-bar-space"><i style="height:${max?bin.amount/max*100:0}%" title="${esc(bin.title)}: ${esc(fmt(bin.amount))}"></i></span><span class="mobile-bar-label" aria-hidden="true">${esc(bin.label)}</span></li>`).join('')}</ol>${exp>0?`<div class="mobile-category-strip" aria-hidden="true">${shown.map(([id,amount])=>`<i style="width:${amount/exp*100}%;background:${id?esc(getCat(id).color):'var(--muted)'}"></i>`).join('')}</div><div class="mobile-category-legend">${shown.map(([id,amount])=>id?`<button type="button" data-mobile-filter-cat="${esc(id)}"><i style="background:${esc(getCat(id).color)}"></i><span>${esc(getCat(id).name)}</span><small>${Math.round(amount/exp*100)}%</small></button>`:`<span><i style="background:var(--muted)"></i>Otras <small>${Math.round(amount/exp*100)}%</small></span>`).join('')}</div>`:''}`;
}
mobileMovements.addEventListener('click', event => {
  const type=event.target.closest('[data-mobile-type]'), category=event.target.closest('[data-mobile-filter-cat]');
  if(type){$('#fltType').value=$('#fltType').value===type.dataset.mobileType?'':type.dataset.mobileType;$('#fltCat').value='';}
  else if(category){$('#fltCat').value=category.dataset.mobileFilterCat;$('#fltType').value='expense';}
  else return;
  renderMovs(false);
  if(type) [...mobileMovements.querySelectorAll('[data-mobile-type]')].find(button=>button.dataset.mobileType===type.dataset.mobileType)?.focus({preventScroll:true});
  if(category) [...mobileMovements.querySelectorAll('[data-mobile-filter-cat]')].find(button=>button.dataset.mobileFilterCat===category.dataset.mobileFilterCat)?.focus({preventScroll:true});
});
