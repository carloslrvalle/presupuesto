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
 const box=glyph.getBoundingClientRect(),nav=mobileNav.getBoundingClientRect();
 const zoom=Number(getComputedStyle(document.documentElement).zoom)||1;
 const geometry={left:((box.left-nav.left)/zoom-mobileNav.clientLeft)+'px',top:((box.top-nav.top)/zoom-mobileNav.clientTop)+'px',width:glyph.offsetWidth+'px',height:glyph.offsetHeight+'px'};
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
  if (from === tab && !bothMode) {
    window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'});
    return;
  }
  tabScroll[from] = window.scrollY;
  if(tab==='movs' && movView==='list' && ['dashboard','budget'].includes(from)){
    openMovs({scope:cycleEnabled()?'cycle':'month',month:currentMonth});
    return;
  }
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
if(mobileLayout.matches&&cycleEnabled())$('#fltScope').value='cycle';
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
const mobileHomeMetrics=document.createElement('section');mobileHomeMetrics.id='mobileHomeMetrics';mobileHomeMetrics.className='mobile-only';mobileHomeMetrics.setAttribute('aria-label','Resultado del período');
const mobileHomeChart=document.createElement('section');mobileHomeChart.id='mobileHomeChart';mobileHomeChart.className='mobile-only';mobileHomeChart.setAttribute('aria-label','Evolución de los gastos del período');
$('#tab-dashboard .dashboard-kpis').before(mobileHomeMetrics);
$('#tab-dashboard .dashboard-kpis').after(mobileHomeChart);
const mobileHomeTop = document.createElement('section');
mobileHomeTop.id = 'mobileHomeTop';
mobileHomeTop.className = 'mobile-only';
mobileHomeTop.setAttribute('aria-labelledby', 'mobileHomeTopTitle');
mobileHomeTop.innerHTML = `<div class="mobile-section-heading"><h2 id="mobileHomeTopTitle">Gastos recientes</h2><button type="button" id="mobileRecentAll">Ver todos ${ic('chevron-right')}</button></div><div id="mobileHomeTopRows"></div>`;
mobileHomeChart.after(mobileHomeTop);
function renderMobileHome(data){
  const scope=cycleView()?'cycle':'month',content=document.createElement('div');
  content.innerHTML=mobileInsightsHTML({...data,scope});
  mobileHomeMetrics.replaceChildren(content.querySelector('.mobile-movement-net'));
  content.querySelector('.mobile-movement-totals').remove();
  content.querySelector('.mobile-spending-head>span').textContent=mobileMovementBins(data.real,scope).label;
  content.querySelector('.mobile-spending-head>span+span').remove();
  mobileHomeChart.replaceChildren(...content.childNodes);
  $('#mobileHomeTopRows').innerHTML = $('#topExp').innerHTML;
  mobileHomeMetrics.querySelectorAll('strong,b').forEach(el=>fitMetricValue(el));
}
$('#mobileRecentAll').onclick=()=>openMovs({type:'expense',scope:cycleView()?'cycle':'month',month:currentMonth});
mobileHomeChart.addEventListener('click',event=>{
  const button=event.target.closest('[data-mobile-filter-cat]');
  if(button)openMovs({type:'expense',cat:button.dataset.mobileFilterCat,scope:cycleView()?'cycle':'month',month:currentMonth});
});

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
  return {days,label:scope==='all'?'Gastos del rango':'Gastos semanales',bins:Array.from({length:Math.ceil(days/step)},(_,i)=>{
    const first=BudgetFinance.dateOffset(start,i*step), last=BudgetFinance.dateOffset(start,Math.min(days-1,(i+1)*step-1));
    return {label:first.slice(8,10)+'/'+first.slice(5,7),title:first===last?fmtDate(first):fmtDate(first)+' – '+fmtDate(last),amount:sum(expenses.filter(t=>t.date>=first&&t.date<=last))};
  })};
}
function mobileInsightsHTML({real,inc,exp,scope,selectedType=''}){
  const {days,label,bins}=mobileMovementBins(real,scope), max=Math.max(0,...bins.map(bin=>bin.amount));
  const isPeak=amount=>max>0&&Math.round(amount*100)===Math.round(max*100);
  const type=selectedType;
  const categories=new Map();
  real.filter(t=>t.type==='expense').forEach(t=>categories.set(t.catId,(categories.get(t.catId)||0)+t.amount));
  const ranked=[...categories].sort((a,b)=>b[1]-a[1]), shown=ranked.slice(0,3);
  if(ranked.length>3)shown.push([null,ranked.slice(3).reduce((total,row)=>total+row[1],0)]);
  return `<div class="mobile-movement-net"><div><span>Ingresos menos gastos</span><strong class="${inc-exp<0?'neg':''}">${fmt(inc-exp)}</strong></div><div><span>Gasto por día</span><b>${fmt(exp/days)}</b><small>Promedio · ${days} días</small></div></div><div class="mobile-movement-totals">${[['income','Ingresos',inc],['expense','Gastos',exp]].map(([kind,name,amount])=>`<button type="button" data-mobile-type="${kind}" aria-pressed="${type===kind}"><span class="mobile-type-icon ${kind}">${ic('arrow-up-right')}</span><span><small>${name}</small><b>${fmt(amount)}</b></span></button>`).join('')}</div><div class="mobile-spending-head"><span>${scope==='cycle'?esc(shortPeriodLabel(currentMonth)):scope==='all'?'Todos los movimientos':scope==='year'?currentMonth.slice(0,4):esc(monthLong(currentMonth))}</span><span class="${max>0?'mobile-peak-legend':''}">${max?`Máx. ${fmt(max)}`:'Sin gastos registrados'}</span></div><ol class="mobile-spending-chart" data-granularity="${scope==='year'?'month':'week'}" aria-label="${label}" style="--bar-count:${bins.length}">${bins.map((bin,i)=>`<li class="${isPeak(bin.amount)?'is-peak':''}" aria-label="${esc(bin.title)}: ${esc(fmt(bin.amount))}${isPeak(bin.amount)?' · Mayor gasto':''}"><span class="mobile-bar-space"><i style="height:${max?bin.amount/max*100:0}%" title="${esc(bin.title)}: ${esc(fmt(bin.amount))}"></i></span><span class="mobile-bar-label" aria-hidden="true">${bins.length<=12||i===0||i===bins.length-1||i%7===0?esc(bin.label):''}</span></li>`).join('')}</ol>${exp>0?`<div class="mobile-category-strip" aria-hidden="true">${shown.map(([id,amount])=>`<i style="width:${amount/exp*100}%;background:${id?esc(getCat(id).color):'var(--muted)'}"></i>`).join('')}</div><div class="mobile-category-legend">${shown.map(([id,amount])=>id?`<button type="button" data-mobile-filter-cat="${esc(id)}"><i style="background:${esc(getCat(id).color)}"></i><span>${esc(getCat(id).name)}</span><small>${Math.round(amount/exp*100)}%</small></button>`:`<span><i style="background:var(--muted)"></i>Otras <small>${Math.round(amount/exp*100)}%</small></span>`).join('')}</div>`:''}`;
}
function renderMobileMovements(data){
  const expanded=mobileMovements.querySelector('details')?.open||false;
  mobileMovements.innerHTML=`<div class="mobile-log-balance"><span>Resultado de la vista</span><strong class="${data.inc-data.exp<0?'neg':''}">${fmt(data.inc-data.exp)}</strong></div><div class="mobile-log-totals">${[['income','Ingresos',data.inc],['expense','Gastos',data.exp]].map(([kind,label,amount])=>`<button type="button" data-mobile-type="${kind}" aria-pressed="${$('#fltType').value===kind}"><span>${label}</span><b>${fmt(amount)}</b></button>`).join('')}</div><details class="mobile-log-stats"${expanded?' open':''}><summary aria-label="Estadísticas de esta vista" title="Estadísticas de esta vista">${ic('chart-column')}</summary><div class="mobile-log-stats-body">${mobileInsightsHTML({...data,selectedType:$('#fltType').value})}</div></details>`;
  mobileMovements.querySelectorAll('.mobile-log-balance strong,.mobile-log-totals b,.mobile-movement-net strong,.mobile-movement-net b,.mobile-movement-totals b').forEach(el=>fitMetricValue(el));
}
mobileMovements.addEventListener('click', event => {
  const type=event.target.closest('[data-mobile-type]'), category=event.target.closest('[data-mobile-filter-cat]');
  const fromStatistics=!!type?.closest('.mobile-log-stats-body');
  if(type){$('#fltType').value=$('#fltType').value===type.dataset.mobileType?'':type.dataset.mobileType;$('#fltCat').value='';}
  else if(category){$('#fltCat').value=category.dataset.mobileFilterCat;$('#fltType').value='expense';}
  else return;
  renderMovs(false);
  if(type) [...mobileMovements.querySelectorAll(fromStatistics?'.mobile-log-stats-body [data-mobile-type]':'.mobile-log-totals [data-mobile-type]')].find(button=>button.dataset.mobileType===type.dataset.mobileType)?.focus({preventScroll:true});
  if(category) [...mobileMovements.querySelectorAll('[data-mobile-filter-cat]')].find(button=>button.dataset.mobileFilterCat===category.dataset.mobileFilterCat)?.focus({preventScroll:true});
});
