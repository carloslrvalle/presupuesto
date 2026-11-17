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
const mobileNavIndicator=document.createElement('span');
mobileNavIndicator.id='mobileNavIndicator';mobileNavIndicator.className='mobile-nav-indicator';
mobileNavIndicator.setAttribute('aria-hidden','true');mobileNav.prepend(mobileNavIndicator);

function moveMobileNavIndicator(animate=true){
 const glyph=mobileNav.querySelector('button.active .mobile-nav-glyph');
 if(!mobileLayout.matches||!mobileNav.offsetWidth||!glyph){
  mobileNavIndicator._motion?.cancel();mobileNavIndicator._motion=null;
  mobileNavIndicator._placed=false;mobileNavIndicator.style.opacity='0';return;
 }
 // Mide la posición sin la escala del gesto de presión.
 const button=glyph.parentElement;
 const geometry={left:(button.offsetLeft+glyph.offsetLeft)+'px',top:(button.offsetTop+glyph.offsetTop)+'px',width:glyph.offsetWidth+'px',height:glyph.offsetHeight+'px'};
 mobileNavIndicator.style.opacity='1';
 if(animate===false||!mobileNavIndicator._placed||reduceMotion()){
  mobileNavIndicator._motion?.cancel();mobileNavIndicator._motion=null;Object.assign(mobileNavIndicator.style,geometry);
 }else if(Object.entries(geometry).some(([key,value])=>mobileNavIndicator.style[key]!==value)){
  moveIndicator(mobileNavIndicator,geometry,undefined,MOTION.popup);
 }
 mobileNavIndicator._placed=true;
}
window.addEventListener('resize',()=>moveMobileNavIndicator(false));
mobileLayout.addEventListener('change',()=>moveMobileNavIndicator(false));
new ResizeObserver(()=>requestAnimationFrame(()=>moveMobileNavIndicator(false))).observe(mobileNav);

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
  moveMobileNavIndicator();
}

function navigateMobile(tab) {
  const from = activeTab();
  if(tab==='movs'){
    const completeList = movView === 'list' && $('#fltScope').value === 'all' && $('#mobileMovementReset').hidden;
    if(from===tab && completeList){
      window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'});
      return;
    }
    if(from!==tab)tabScroll[from]=window.scrollY;
    setMobileMovementTools(false);
    if(completeList)showTab('movs',tabScroll.movs || 0);
    else openMovs({scope:'all'});
    return;
  }
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

// Prototipo de alta: los mismos campos y validaciones, con opciones secundarias plegadas.
const txHeader=txDialog.querySelector('.dlg-head'),txBody=txDialog.querySelector('.dlg-body');
const mobileTxOptions=document.createElement('button');
mobileTxOptions.type='button';mobileTxOptions.id='mobileTxOptions';mobileTxOptions.className='mobile-only iconbtn';
mobileTxOptions.setAttribute('aria-label','Más opciones del movimiento');mobileTxOptions.setAttribute('aria-expanded','false');
mobileTxOptions.setAttribute('aria-controls','mobileTxExtras');
mobileTxOptions.innerHTML=ic('settings');txHeader.append(mobileTxOptions);
const mobileTxNote=document.createElement('button');
mobileTxNote.id='mobileTxNote';mobileTxNote.type='button';mobileTxNote.className='mobile-only';
mobileTxNote.innerHTML=ic('pencil')+'<span>Agregar nota</span>';txBody.append(mobileTxNote);
const mobileTxMeta=document.createElement('div');mobileTxMeta.className='mobile-only mobile-tx-meta';
const mobileTxCategory=document.createElement('button');mobileTxCategory.type='button';mobileTxCategory.id='mobileTxCategory';mobileTxCategory.setAttribute('aria-expanded','false');
mobileTxMeta.append(mobileTxCategory);txBody.append(mobileTxMeta);
const mobileTxExtras=document.createElement('div');mobileTxExtras.id='mobileTxExtras';mobileTxExtras.className='mobile-only mobile-tx-extras';txBody.append(mobileTxExtras);
const mobileTxDone=document.createElement('button');mobileTxDone.type='button';mobileTxDone.id='mobileTxDone';mobileTxDone.className='mobile-only btn';mobileTxDone.textContent='Listo';
txDialog.querySelector('.dlg-foot').append(mobileTxDone);
const txCategoryField=$('#fCatChips').closest('.field'),txNoteField=$('#fDesc').closest('.field');
const txCategoryAnchor=document.createComment('Posición del selector de categorías en escritorio');txCategoryField.before(txCategoryAnchor);
const mobileTxViewport=document.createElement('div');mobileTxViewport.className='mobile-only mobile-tx-panel-viewport';txBody.append(mobileTxViewport);
txCategoryField.classList.add('tx-category-panel');txNoteField.classList.add('tx-note-field');
txCategoryField.id='mobileTxCategoryPanel';mobileTxCategory.setAttribute('aria-controls',txCategoryField.id);
const txMethodField=$('#fMethodChips').closest('.field');
const txNodes=[[$('#txSeg'),txHeader],[$('#fDateField'),mobileTxMeta],[txNoteField,txBody],[txMethodField,mobileTxExtras],[$('#fGoalField'),mobileTxExtras],[$('#txQuick'),mobileTxExtras],[$('#txDelete'),mobileTxExtras],[$('#txDup'),mobileTxExtras]].map(([node,parent])=>{
  const anchor=document.createComment('Posición del campo en escritorio');node.before(anchor);return {node,parent,anchor};
});
function positionMobileTx(){
  txDialog.classList.toggle('tx-mobile-simple',mobileLayout.matches);
  for(const {node,parent,anchor} of txNodes){if(mobileLayout.matches)parent.append(node);else anchor.after(node);}
  if(mobileLayout.matches)mobileTxViewport.append(txCategoryField,mobileTxExtras);else txCategoryAnchor.after(txCategoryField);
  if(!mobileLayout.matches){
    $('#fDate').value=$('#fDate').value;
    for(const node of [txCategoryField,mobileTxExtras,txNoteField,mobileTxNote,mobileTxMeta])node.inert=false;
    $('#fAmount').tabIndex=0;txDialog.classList.remove('category-open','options-open','tx-panel-instant');
  }
  syncMobileTxUI();
}
function syncMobileTxUI(){
  if(!mobileLayout.matches)return;
  const category=getCat(selCat);
  mobileTxCategory.innerHTML=`${iconHTML(category.icon,category.color)}<span>${selCat?esc(category.name):'Categoría'}</span>${ic('chevron-down')}`;
  mobileTxCategory.setAttribute('aria-label','Categoría: '+(selCat?category.name:'Elegir'));
  txDialog.querySelector('[type=submit]').textContent=editingId?'Guardar cambios':txType==='income'?'Guardar ingreso':'Guardar gasto';
  $('#fAmount').style.setProperty('--amount-characters',String(Math.max(4,($('#fAmount').value||'0.00').length)));
  const date=$('#fDate').value;
  const dateLabel=date===todayISO()?'Hoy':fmtDate(date),trigger=$('#fDateField .dp-trigger');
  if(trigger.querySelector('.dp-l')?.textContent!==dateLabel)trigger.innerHTML=ic('calendar')+`<span class="dp-l">${esc(dateLabel)}</span>`;
  mobileTxNote.hidden=txDialog.classList.contains('note-open');
}
function prepareMobileTxUI(){
  txDialog.classList.remove('category-open','options-open');
  txDialog.classList.toggle('note-open',!!$('#fDesc').value);
  mobileTxOptions.setAttribute('aria-expanded','false');mobileTxCategory.setAttribute('aria-expanded','false');
  txCategoryField.scrollTop=0;mobileTxExtras.scrollTop=0;
  setMobileTxPanel(txDialog.classList.contains('needs-saving-category')?'category':null,{focus:false});
  syncMobileTxUI();
}
function setMobileTxPanel(panel,{focus=true}={}){
  const amount=$('#fAmount');
  if(focus&&(!panel||document.activeElement.matches('input,textarea')&&document.activeElement!==amount))amount.focus({preventScroll:true});
  if(panel){mobileTxViewport.style.top=txBody.scrollTop+'px';mobileTxViewport.style.bottom=-txBody.scrollTop+'px';}
  txDialog.classList.toggle('category-open',panel==='category');
  txDialog.classList.toggle('options-open',panel==='options');
  txCategoryField.inert=panel!=='category';mobileTxExtras.inert=panel!=='options';
  mobileTxCategory.setAttribute('aria-expanded',String(panel==='category'));
  mobileTxOptions.setAttribute('aria-expanded',String(panel==='options'));
  amount.tabIndex=panel?-1:0;
  txNoteField.inert=!!panel;mobileTxNote.inert=!!panel;mobileTxMeta.inert=!!panel;
  txDialog.classList.toggle('tx-panel-instant',reduceMotion());
  dpClose();
  // El selector ocupa el cuerpo desde arriba; su capa recortada evita cambiar el ancho útil al aparecer o desaparecer.
  // El importe permanece montado y enfocado bajo el selector; tocar una categoría no cierra el teclado.
  if(focus&&panel&&reduceMotion())(panel==='category'&&!$('#txAllCategories').hidden?$('#txAllCategories'):mobileTxOptions).focus({preventScroll:true});
}
// Cancelar el foco automático del botón evita el ciclo de ocultar y abrir el teclado al tocar selectores.
const txKeepKeyboardButtons='#mobileTxCategory,#mobileTxOptions,#mobileTxDone,#txAllCategories,#txNewCategory,#txCancelCategory,#txCreateCategory,#txSeg button,#fCatChips [data-cat],#fMethodChips [data-method],#fGoalChips [data-goal],#txQuick button';
txDialog.addEventListener('mousedown',event=>{
  if(!mobileLayout.matches||event.button>0||!event.target.closest(txKeepKeyboardButtons))return;
  if(txDialog.contains(document.activeElement)&&document.activeElement.matches('input:not([type=hidden]),textarea'))event.preventDefault();
});
mobileTxDone.onclick=()=>setMobileTxPanel(null);
txDialog.addEventListener('close',()=>{if(mobileLayout.matches)setMobileTxPanel(null,{focus:false});});
mobileTxNote.onclick=()=>{txDialog.classList.add('note-open');syncMobileTxUI();$('#fDesc').focus({preventScroll:true});};
mobileTxOptions.onclick=()=>setMobileTxPanel(txDialog.classList.contains('options-open')?null:'options');
mobileTxCategory.onclick=()=>setMobileTxPanel(txDialog.classList.contains('category-open')?null:'category');
$('#fCatChips').addEventListener('click',event=>{
  if(!mobileLayout.matches||!event.target.closest('[data-cat]'))return;
  syncMobileTxUI();setMobileTxPanel(null);
});
$('#fAmount').addEventListener('input',syncMobileTxUI);
$('#fDate').addEventListener('change',syncMobileTxUI);
mobileLayout.addEventListener('change',positionMobileTx);
positionMobileTx();
if(mobileLayout.matches)$('#fltScope').value='all';
mobileLayout.addEventListener('change', ({matches}) => {
  const scope = $('#fltScope');
  if(scope.value === (matches ? 'month' : 'all')) scope.value = defaultMovementScope();
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
// El orden de Resumen es cronológico desde 1.10.127: los cinco gastos recientes del mes o ciclo.
const mobileHomeTop = document.createElement('section');
mobileHomeTop.id = 'mobileHomeTop';
mobileHomeTop.className = 'mobile-only';
mobileHomeTop.setAttribute('aria-labelledby', 'mobileHomeTopTitle');
mobileHomeTop.innerHTML = `<div class="mobile-section-heading"><h2 id="mobileHomeTopTitle">Gastos recientes</h2><button type="button" id="mobileRecentAll">Ver todos ${ic('chevron-right')}</button></div><div id="mobileHomeTopRows"></div>`;
$('#tab-dashboard .dashboard-kpis').after(mobileHomeTop);
function renderMobileHome(){
  $('#mobileHomeTopRows').innerHTML = $('#topExp').innerHTML;
}
$('#mobileRecentAll').onclick=()=>openMovs({type:'expense',scope:cycleView()?'cycle':'month',month:currentMonth});

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
  // El indicador mide solo gasto: las categorías de ahorro no lo empujan a «exceso».
  const spendRows = rows.filter(row => !isSavingCat(row.c.id));
  const budget = spendRows.reduce((total,row) => total+row.budget,0), real = spendRows.reduce((total,row) => total+row.real,0);
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

const mobileWeeklySpending = document.createElement('section');
mobileWeeklySpending.id = 'mobileWeeklySpending';
mobileWeeklySpending.className = 'mobile-only';
mobileWeeklySpending.setAttribute('aria-labelledby','mobileWeeklyTitle');
const mobileMovementHeader = document.createElement('header');
mobileMovementHeader.className = 'mobile-only mobile-movement-header';
mobileMovementHeader.innerHTML = `<h2>Movimientos</h2><button type="button" id="mobileMovementReset" class="btn sm" hidden>Ver todo</button><button type="button" id="mobileMovementTools" class="iconbtn" aria-label="Opciones de movimientos" aria-expanded="false" aria-controls="movementToolbar movementFilters">${ic('settings')}</button>`;
$('#tab-movs .toolbar').before(mobileWeeklySpending,mobileMovementHeader);

function setMobileMovementTools(open){
  $('#mobileMovementTools').setAttribute('aria-expanded',String(open));
}
$('#mobileMovementTools').onclick = event => setMobileMovementTools(event.currentTarget.getAttribute('aria-expanded') !== 'true');
$('#mobileMovementReset').onclick = () => {
  openMovs({scope:'all'});
  $('#mobileMovementTools').focus({preventScroll:true});
};

function renderMobileMovements(scope, filtered){
  $('#mobileMovementReset').hidden = !filtered;
  const cycle = scope === 'cycle';
  const period = cycle ? cyclePeriod(currentMonth) : {start:dateFor(currentMonth,1),end:dateFor(currentMonth,daysIn(currentMonth))};
  const expenses = (cycle ? cycleTx(currentMonth) : txOfMonth(currentMonth)).filter(t => t.type === 'expense' && !isSavingTx(t));
  const weeks = [];
  // Las semanas terminan en domingo y se recortan al período visible.
  for(let start=period.start;start<=period.end;){
    const weekday = new Date(start+'T00:00:00Z').getUTCDay();
    const sunday = dateOffset(start,(7-weekday)%7);
    const end = sunday < period.end ? sunday : period.end;
    weeks.push({start,end,amount:sum(expenses.filter(t=>t.date>=start&&t.date<=end))});
    start=dateOffset(end,1);
  }
  const max = Math.max(...weeks.map(week=>week.amount),0);
  const dateLabel = date => date.slice(8,10)+'/'+date.slice(5,7);
  mobileWeeklySpending.innerHTML = `<div class="mobile-weekly-head"><h2 id="mobileWeeklyTitle">Gastos por semana</h2><p>${esc(cycle ? shortPeriodLabel(currentMonth) : monthLong(currentMonth))}</p></div>${
    max ? `<dl class="mobile-weekly-chart">${weeks.map(({start,end,amount}) => `<div>
      <dt><time datetime="${start}">${dateLabel(start)}</time>${end!==start?`–<time datetime="${end}">${dateLabel(end)}</time>`:''}</dt>
      <dd><span class="mobile-weekly-track" aria-hidden="true"><i style="--weekly-share:${amount/max*100}%"></i></span><b>${fmt(amount)}</b></dd>
    </div>`).join('')}</dl>` : '<p class="mobile-weekly-empty">Sin gastos registrados en este período.</p>'
  }`;
}

