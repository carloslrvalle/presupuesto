// Presentación móvil: reutiliza navegación, perfiles y cálculos existentes.
const mobileLayout = matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
const mobileNav = document.createElement('nav');
mobileNav.id = 'mobileNav';
mobileNav.setAttribute('aria-label', 'Navegación móvil');
const mobileNavItem = (tab, label, icon) => `<button type="button" data-mobile-tab="${tab}" aria-label="${label}" title="${label}"><span class="mobile-nav-glyph">${ic(icon)}</span></button>`;
mobileNav.innerHTML = mobileNavItem('dashboard', 'Inicio', 'house')
  + mobileNavItem('movs', 'Movimientos', 'receipt-text')
  + `<button type="button" id="mobileNew" aria-label="Nuevo movimiento"><span class="mobile-nav-glyph">${ic('plus')}</span></button>`
  + mobileNavItem('budget', 'Presupuesto', 'wallet')
  + `<button type="button" id="mobileMoreButton" aria-label="Más opciones" title="Más opciones" aria-haspopup="dialog" aria-expanded="false" aria-controls="mobileMore"><span class="mobile-nav-glyph">${ic('list')}</span></button>`;
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
 const button=glyph.parentElement.getBoundingClientRect(),dock=mobileNav.getBoundingClientRect();
 const zoom=Number(getComputedStyle(document.documentElement).zoom)||1;
 const width=glyph.offsetWidth,height=glyph.offsetHeight;
 const geometry={
  left:((button.left-dock.left+button.width/2)/zoom-mobileNav.clientLeft-width/2)+'px',
  top:((button.top-dock.top+button.height/2)/zoom-mobileNav.clientTop-height/2)+'px',
  width:width+'px',height:height+'px'
 };
 mobileNavIndicator.style.opacity='1';
 // Las notificaciones de tamaño sin un nuevo destino no interrumpen el recorrido.
 if(mobileNavIndicator._placed && Object.entries(geometry).every(([key,value])=>Math.abs(parseFloat(mobileNavIndicator.style[key])-parseFloat(value))<.05))return;
 if(!animate||!mobileNavIndicator._placed||reduceMotion()){
  mobileNavIndicator._motion?.cancel();mobileNavIndicator._motion=null;Object.assign(mobileNavIndicator.style,geometry);
 }else{
  moveIndicator(mobileNavIndicator,geometry,undefined,MOTION.panel);
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
  if (current !== 'movs' && mobileMovementPanel) setMobileMovementPanel('');
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
  const add = $('#mobileNew');
  add.disabled = bothMode;
  add.title = bothMode ? 'Elige un perfil para registrar movimientos' : 'Nuevo movimiento';
  add.setAttribute('aria-label',add.title);
  moveMobileNavIndicator();
}

function navigateMobile(tab) {
  const from = activeTab();
  if(tab==='movs'){
    const completeList = movView === 'list' && $('#fltScope').value === 'all' && !movFiltered;
    if(from===tab && completeList){
      window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'});
      return;
    }
    if(from!==tab)tabScroll[from]=window.scrollY;
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
const mobileTxViewport=document.createElement('div');mobileTxViewport.className='mobile-tx-panel-viewport';
txCategoryField.classList.add('tx-category-panel');txNoteField.classList.add('tx-note-field');
txCategoryField.id='mobileTxCategoryPanel';mobileTxCategory.setAttribute('aria-controls',txCategoryField.id);
const txMethodField=$('#fMethodChips').closest('.field');
const txNodes=[[$('#txSeg'),txHeader],[$('#fDateField'),mobileTxMeta],[txNoteField,txBody],[txMethodField,mobileTxExtras],[$('#fGoalField'),mobileTxExtras],[$('#txQuick'),mobileTxExtras],[$('#txDelete'),mobileTxExtras],[$('#txDup'),mobileTxExtras]].map(([node,parent])=>{
  const anchor=document.createComment('Posición del campo en escritorio');node.before(anchor);return {node,parent,anchor};
});
// Teclado del monto inspirado en Dime (github.com/rafsoh/dimeApp, NumberPad): 1–9, punto, 0 y ✓ para guardar.
// El importe se escribe sin el teclado del sistema; el campo sigue siendo #fAmount, así el guardado no cambia.
const mobileTxKeypad=document.createElement('div');
mobileTxKeypad.id='mobileTxKeypad';mobileTxKeypad.className='mobile-tx-keypad';
mobileTxKeypad.setAttribute('role','group');mobileTxKeypad.setAttribute('aria-label','Teclado del monto');
mobileTxKeypad.innerHTML=['1','2','3','4','5','6','7','8','9','.','0'].map(k=>`<button type="button" data-key="${k}"${k==='.'?' aria-label="Punto decimal"':''}>${k}</button>`).join('')
  +`<button type="submit" class="keypad-submit" aria-label="Guardar">${ic('check')}</button>`;
const mobileTxKeypadSlot=document.createElement('div');
mobileTxKeypadSlot.className='mobile-only mobile-tx-keypad-slot';
mobileTxKeypadSlot.append(mobileTxKeypad,mobileTxViewport);
txBody.append(mobileTxKeypadSlot);
const mobileTxBackspace=document.createElement('button');
mobileTxBackspace.type='button';mobileTxBackspace.id='mobileTxBackspace';mobileTxBackspace.className='mobile-only';
mobileTxBackspace.setAttribute('aria-label','Borrar último dígito');
mobileTxBackspace.innerHTML='<svg class="vi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 5H9l-7 7 7 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="m18 9-6 6"/><path d="m12 9 6 6"/></svg>';
$('#fAmount').closest('.tx-amount').append(mobileTxBackspace);
const TX_KEYPAD_MAX_INTEGER=8; // como Dime: hasta 99,999,999.99
function setKeypadAmount(value){
  const amount=$('#fAmount');amount.value=value;
  amount.dispatchEvent(new Event('input',{bubbles:true}));
}
function markTxInvalid(field){
  clearTimeout(field._invalidTimer);
  field.classList.add('tx-invalid');
  field._invalidTimer=setTimeout(()=>field.classList.remove('tx-invalid'),MOTION.signal);
}
function nudgeAmount(){markTxInvalid($('#fAmount').closest('.tx-amount'));}
function pressKeypad(key){
  let value=$('#fAmount').value;
  const [whole,decimals]=value.split('.');
  if(key==='.'){if(decimals!==undefined)return nudgeAmount();value=(whole||'0')+'.';}
  else if(decimals!==undefined){if(decimals.length>=2)return nudgeAmount();value+=key;}
  else{
    const next=whole==='0'?key:whole+key;
    if(next.length>TX_KEYPAD_MAX_INTEGER)return nudgeAmount();
    value=next;
  }
  if(navigator.userActivation?.isActive)navigator.vibrate?.(6);
  setKeypadAmount(value);
}
function eraseKeypad(){const value=$('#fAmount').value;if(!value)return nudgeAmount();setKeypadAmount(value.slice(0,-1));}
mobileTxKeypad.addEventListener('click',event=>{const key=event.target.closest('[data-key]');if(key)pressKeypad(key.dataset.key);});
mobileTxBackspace.onclick=eraseKeypad;
// Mantener pulsado borrar vacía el monto.
let txEraseHold=0;
mobileTxBackspace.addEventListener('pointerdown',()=>{clearTimeout(txEraseHold);txEraseHold=setTimeout(()=>{txEraseHold=-1;setKeypadAmount('');},550);});
for(const type of ['pointerup','pointerleave','pointercancel'])mobileTxBackspace.addEventListener(type,()=>{if(txEraseHold>0)clearTimeout(txEraseHold);});
mobileTxBackspace.addEventListener('click',event=>{if(txEraseHold===-1){txEraseHold=0;event.stopImmediatePropagation();}},true);
// Teclado físico o lector de pantalla: dígitos, punto/coma, retroceso y Enter.
txDialog.addEventListener('keydown',event=>{
  if(!txDialog.classList.contains('tx-mobile-simple')||event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.target.matches('input:not(#fAmount),textarea,select')||txDialog.matches('.category-open,.options-open'))return;
  if(/^[0-9]$/.test(event.key)){event.preventDefault();pressKeypad(event.key);}
  else if(event.key==='.'||event.key===','){event.preventDefault();pressKeypad('.');}
  else if(event.key==='Backspace'){event.preventDefault();eraseKeypad();}
});
// Señala el campo que falta y conserva el aviso del formulario.
$('#txForm').addEventListener('submit',()=>{
  if(!txDialog.classList.contains('tx-mobile-simple'))return;
  if(!(parseFloat($('#fAmount').value)>0))nudgeAmount();
  else if(!selCat)markTxInvalid(mobileTxCategory);
},true);
$('#fAmount').addEventListener('input',event=>event.target.closest('.tx-amount').classList.remove('tx-invalid'));
function positionMobileTx(){
  txDialog.classList.toggle('tx-mobile-simple',mobileLayout.matches);
  const amount=$('#fAmount'),value=amount.value;
  if(mobileLayout.matches){amount.type='text';amount.readOnly=true;amount.inputMode='none';amount.placeholder='0';}
  else{amount.type='number';amount.readOnly=false;amount.inputMode='decimal';amount.placeholder='0.00';amount.value=parseFloat(value)>0?String(parseFloat(value)):'';}
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
  if(selCat)mobileTxCategory.classList.remove('tx-invalid');
  const category=getCat(selCat),picking=txDialog.classList.contains('category-open');
  // Como en Dime: la píldora toma el color de la categoría y, con el selector abierto, se convierte en «Cerrar».
  mobileTxCategory.innerHTML=picking?'<span>Cerrar</span>':`${iconHTML(category.icon,category.color)}<span>${selCat?esc(category.name):'Categoría'}</span>`;
  mobileTxCategory.classList.toggle('closing',picking);
  mobileTxCategory.style.setProperty('--cat-bg',selCat&&!picking?soft(category.color):'');
  mobileTxCategory.setAttribute('aria-label',picking?'Cerrar categorías':'Categoría: '+(selCat?category.name:'Elegir'));
  txDialog.querySelector('.dlg-foot [type=submit]').textContent=editingId?'Guardar cambios':txType==='income'?'Guardar ingreso':'Guardar gasto';
  const amountField=$('#fAmount'),characters=Math.max(1,(amountField.value||'0').length),amountBox=amountField.closest('.tx-amount');
  amountField.style.setProperty('--amount-characters',String(characters));
  // El importe se reduce para caber en una línea, como el escalado mínimo de Dime.
  const room=Math.max(120,amountBox.clientWidth-130);
  amountField.style.fontSize=amountBox.clientWidth?Math.round(Math.max(26,Math.min(60,room/(characters*.62))))+'px':'';
  const date=$('#fDate').value;
  const shortDate=date?Number(date.slice(8,10))+' '+MONTHS_ES[Number(date.slice(5,7))-1].toLowerCase()+(date.slice(0,4)===todayISO().slice(0,4)?'':' '+date.slice(0,4)):'';
  const dateLabel=date===todayISO()?'Hoy, '+shortDate:shortDate,trigger=$('#fDateField .dp-trigger');
  if(trigger.querySelector('.dp-l')?.textContent!==dateLabel)trigger.innerHTML=ic('calendar')+`<span class="dp-l">${esc(dateLabel)}</span>`;
  mobileTxNote.hidden=txDialog.classList.contains('note-open');
}
function prepareMobileTxUI(){
  for(const field of txDialog.querySelectorAll('.tx-invalid'))field.classList.remove('tx-invalid');
  txDialog.classList.remove('category-open','options-open');
  txDialog.classList.toggle('note-open',!!$('#fDesc').value);
  mobileTxOptions.setAttribute('aria-expanded','false');mobileTxCategory.setAttribute('aria-expanded','false');
  txCategoryField.scrollTop=0;mobileTxExtras.scrollTop=0;
  setMobileTxPanel(txDialog.classList.contains('needs-saving-category')?'category':null,{focus:false});
  syncMobileTxUI();
}
function setMobileTxPanel(panel,{focus=true}={}){
  if(!mobileLayout.matches){positionMobileTx();return;}
  const amount=$('#fAmount');
  if(focus&&(!panel||document.activeElement.matches('input,textarea')&&document.activeElement!==amount))amount.focus({preventScroll:true});
  // El selector ocupa el lugar del teclado propio. Con el teclado del sistema abierto (búsqueda) usa todo el cuerpo y se cierra con Listo.
  txDialog.classList.toggle('category-open',panel==='category');
  txDialog.classList.toggle('options-open',panel==='options');
  // El panel comparte la caja del teclado y sigue sus cambios de tamaño.
  txCategoryField.inert=panel!=='category';mobileTxExtras.inert=panel!=='options';
  mobileTxCategory.setAttribute('aria-expanded',String(panel==='category'));
  mobileTxOptions.setAttribute('aria-expanded',String(panel==='options'));
  amount.tabIndex=panel?-1:0;
  mobileTxKeypad.inert=!!panel;
  // Como en Dime, el selector muestra todas las categorías en la cuadrícula.
  if(panel==='category'&&!txCategoryExpanded){txCategoryExpanded=true;renderTxChips();}
  syncMobileTxUI();
  txDialog.classList.toggle('tx-panel-instant',reduceMotion());
  dpClose();
  // El selector ocupa el cuerpo desde arriba; su capa recortada evita cambiar el ancho útil al aparecer o desaparecer.
  // El importe permanece montado y enfocado bajo el selector; tocar una categoría no cierra el teclado.
  if(focus&&panel&&reduceMotion())(panel==='category'&&!$('#txAllCategories').hidden?$('#txAllCategories'):mobileTxOptions).focus({preventScroll:true});
}
// Cancelar el foco automático del botón evita el ciclo de ocultar y abrir el teclado al tocar selectores.
const txKeepKeyboardButtons='#mobileTxKeypad button,#mobileTxBackspace,#mobileTxCategory,#mobileTxOptions,#mobileTxDone,#txAllCategories,#txNewCategory,#txCancelCategory,#txCreateCategory,#txSeg button,#fCatChips [data-cat],#fMethodChips [data-method],#fGoalChips [data-goal],#txQuick button';
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
$('#fAmount').addEventListener('focus',syncMobileTxUI); // ya abierta la hoja, se mide el ancho real del importe
window.addEventListener('resize',()=>{if(txDialog.open)syncMobileTxUI();});
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
  if (mobileMore.open) return;
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
const mobileHomeSpent = document.createElement('section');
mobileHomeSpent.id = 'mobileHomeSpent';
mobileHomeSpent.className = 'mobile-only mobile-spent';
mobileHomeSpent.setAttribute('aria-label', 'Gastado de tus ingresos');
$('#tab-dashboard .dashboard-kpis').after(mobileHomeSpent);
mobileHomeSpent.after(mobileHomeTop);
// Inicio móvil: cuánto de lo cobrado ya se gastó (sin contar ahorro) y una lista de recientes que llena la pantalla.
const MOBILE_RECENT_LIMIT = 12;
function renderMobileHome(txs = planTx(currentMonth), totals){
  const inc = totals ? totals.inc : sum(txs.filter(t => t.type === 'income')), exp = totals ? totals.exp : spendSum(txs);
  const pct = inc > 0 ? exp / inc * 100 : null;
  const card = $('#mobileHomeSpent');
  card.dataset.tone = pct > 100 ? 'over' : '';
  const share=pct==null?0:Math.max(0,Math.min(1,pct/100));
  const red=fitThemeColor(mixHex(cssVar('--expense'),cssVar('--surface'),.5*(1-share)),[cssVar('--surface'),cssVar('--surface-2')],3.1);
  card.style.setProperty('--spent-progress',red);
  const value = pct == null ? 'Sin ingresos' : pctTxt(pct);
  card.innerHTML = `<div class="mobile-spent-head"><span class="mobile-spent-label">Gastado de tus ingresos</span><b class="mobile-spent-pct">${value}</b></div>
    <div class="mobile-spent-bar" aria-hidden="true"><span style="width:${(share*100).toFixed(1)}%"></span></div>`;
  $('#mobileHomeTopRows').innerHTML = recentExpenseRows(txs, MOBILE_RECENT_LIMIT);
}
$('#mobileRecentAll').onclick=()=>openMovs({type:'expense',scope:cycleView()?'cycle':'month',month:currentMonth});

const mobileBudgetView = document.createElement('section');
mobileBudgetView.id = 'mobileBudgetView';
mobileBudgetView.className = 'mobile-only';
mobileBudgetView.setAttribute('aria-labelledby', 'mobileBudgetTitle');
mobileBudgetView.innerHTML = `<div class="mobile-section-heading"><h2 id="mobileBudgetTitle" aria-hidden="true">Presupuestos</h2><span id="mobileBudgetRange"></span></div><div id="mobileBudgetGauge"></div><div class="mobile-budget-categories" id="mobileBudgetCategories"></div>`;
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
  $('#mobileBudgetGauge').innerHTML = `<div class="mobile-budget-gauge"><svg viewBox="0 0 240 140" aria-hidden="true"><path class="gauge-track" d="M24 120 A96 96 0 0 1 216 120" pathLength="100"/><path class="gauge-fill${left<0?' over':''}" d="M24 120 A96 96 0 0 1 216 120" pathLength="100" stroke-dasharray="${Math.min(100,used)} 100"/></svg><div class="mobile-gauge-copy"><span>${budget>0?(left<0?'Exceso del presupuesto':'Disponible del presupuesto'):'Presupuesto de gastos'}</span><strong class="${budget>0&&left<0?'neg':''}">${budget>0?fmt(Math.abs(left)):'Sin definir'}</strong><small>${budget>0?`${pctTxt(used)} usado`:'Asigna un monto por categoría'}</small></div></div><p class="mobile-gauge-totals"><span>Gastado <b>${fmt(real)}</b></span><span>Plan <b>${fmt(budget)}</b></span></p>`;
  $('#mobileBudgetCategories').innerHTML = rows.length ? rows.map(({c,budget,real}) => {
    const saving = isSavingCat(c.id), left = budget-real, pct = budget>0?real/budget*100:0;
    const over = !saving && budget>0 && left<-.005;
    const caption = !budget ? (real?'Gastado sin presupuesto':'Toca para asignar') : saving ? (left>0?'Por ahorrar':'Ahorro adicional') : left<-.005?'Exceso':'Por gastar';
    return `<button type="button" class="mobile-budget-tile${over?' over':''}" data-mobile-budget-edit="${esc(c.id)}" aria-description="Editar presupuesto"><span class="mobile-budget-tile-name"><span class="ico" aria-hidden="true" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><b>${esc(c.name)}</b></span><span class="mobile-budget-tile-status">${budget?`${pctTxt(pct)} ${saving?'ahorrado':'usado'}`:'Sin presupuesto'}</span><strong>${budget?fmt(Math.abs(left)):real?fmt(real):'Sin definir'}</strong><span class="mobile-budget-tile-caption">${caption}</span><span class="mobile-budget-tile-track" aria-hidden="true"><i style="width:${Math.min(100,Math.max(0,pct))}%;background:${over?'var(--expense)':esc(c.color)}"></i></span><span class="mobile-budget-tile-plan">Plan ${fmt(budget)} ${ic('pencil')}</span></button>`;
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
  if (!saveBudgetAmount(draft.id,$('#mobileBudgetAmount').value,mobileBudgetEditor)) return;
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
$('#movementFilters').after(mobileWeeklySpending);
VICONS['sliders-horizontal'] = '<path d="M3 7h6m4 0h8M3 17h10m4 0h4M9 4v6m8 4v6"/>';
const mobileMovementTools = document.createElement('div');
mobileMovementTools.className = 'mobile-only mobile-movement-tools';
mobileMovementTools.setAttribute('role','group');
mobileMovementTools.setAttribute('aria-label','Opciones de la lista');
mobileMovementTools.innerHTML = [
  ['search','Buscar movimientos','movementSearch','search'],
  ['filters','Filtros','movExtraFilters','sliders-horizontal'],
  ['details','Resumen de movimientos','movSummary','info']
].map(([panel,label,controlled,icon]) => `<button type="button" class="iconbtn" data-movement-tool="${panel}" title="${label}" aria-label="${label}" aria-expanded="false" aria-controls="${controlled}">${ic(icon)}</button>`).join('');
$('#btnSelect').before(mobileMovementTools);
$('#movPages [data-mov-page="-1"] .mov-page-icon').innerHTML = ic('chevron-left');
$('#movPages [data-mov-page="1"] .mov-page-icon').innerHTML = ic('chevron-right');
let mobileMovementPanel = '';
const movementPanels = {search:$('#movementSearch'), filters:$('#movExtraFilters'), details:$('#movSummary')};
const movementFilters = $('#movementFilters');
const movementSummaryHome = movementPanels.details.parentElement;
const movementPanelRegion = document.createElement('div');
movementPanelRegion.id = 'mobileMovementPanels';

function setMobileMovementPanel(panel, animate = false){
  const compact = mobileLayout.matches;
  const smooth = compact && animate && !reduceMotion();
  const previousHeight = smooth ? movementPanelRegion.offsetHeight : 0;
  movementPanelRegion._motion?.cancel();
  movementPanelRegion._motion = null;
  const previous = movementPanels[mobileMovementPanel];
  if (previous?._motion){previous._motion.cancel();previous._motion=null;}
  mobileMovementPanel = panel;
  movementFilters.hidden = compact && !['search','filters'].includes(panel);
  movementFilters.dataset.panel = panel;
  movementPanels.search.hidden = compact && panel !== 'search';
  movementPanels.details.hidden = compact && panel !== 'details';
  setMovementFiltersOpen(panel === 'filters');
  mobileMovementTools.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-expanded',String(button.dataset.movementTool === panel));
  });
  if (smooth){
    const height = movementPanelRegion.offsetHeight;
    if (height !== previousHeight){
      // Solo esta región cambia de altura. La gráfica y las filas avanzan en el flujo.
      motionAnimate(movementPanelRegion, [
        {height:previousHeight+'px', overflow:'clip'},
        {height:height+'px', overflow:'clip'}
      ], 'popup');
    }
    if (panel) revealContent(movementPanels[panel], 'popup');
  }
}

function syncMobileMovementTools(){
  mobileMovementTools.hidden = movView !== 'list';
  if (mobileLayout.matches && movView !== 'list') setMobileMovementPanel('');
}
function positionMovementPanels(){
  if (mobileLayout.matches){
    movementFilters.before(movementPanelRegion);
    movementPanelRegion.append(movementFilters, movementPanels.details);
    $('#movBody').after($('#movPages'));
  }else{
    movementPanelRegion.before(movementFilters);
    movementPanelRegion.remove();
    movementSummaryHome.prepend(movementPanels.details);
    movementPanels.details.after($('#movPages'));
  }
  setMobileMovementPanel('');
  syncMobileMovementTools();
}
if (mobileLayout.matches) positionMovementPanels();
mobileLayout.addEventListener('change', positionMovementPanels);
mobileMovementTools.addEventListener('click', event => {
  const button = event.target.closest('[data-movement-tool]');
  if (!button) return;
  const panel = button.dataset.movementTool;
  setMobileMovementPanel(mobileMovementPanel === panel ? '' : panel, true);
  if (mobileMovementPanel === 'search') $('#fltText').focus();
  if (mobileMovementPanel === 'filters') $('#movExtraFilters .fsel-btn')?.focus();
});
$('#tab-movs').addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !mobileMovementPanel) return;
  const button = mobileMovementTools.querySelector('[aria-expanded=true]');
  event.preventDefault();
  setMobileMovementPanel('');
  button?.focus({preventScroll:true});
});
let mobileWeeks = [], mobileWeekIndex = 0, mobileWeekPeriod = '', mobileWeekData = '';
const weekDate = date => date.slice(8,10)+'/'+date.slice(5,7);
const weekRange = ({start,end}) => start === end ? weekDate(start) : weekDate(start)+'–'+weekDate(end);

function renderMobileMovements(scope, filterCount){
  mobileMovementTools.querySelector('[data-movement-tool=search]').classList.toggle('has-value',Boolean($('#fltText').value.trim()));
  const filters = mobileMovementTools.querySelector('[data-movement-tool=filters]');
  filters.classList.toggle('has-value',filterCount > 0);
  filters.setAttribute('aria-label',filterCount ? `Filtros, ${plural(filterCount,'activo')}` : 'Filtros');
  const cycle = scope === 'cycle';
  const period = cycle ? cyclePeriod(currentMonth) : {start:dateFor(currentMonth,1),end:dateFor(currentMonth,daysIn(currentMonth))};
  const expenses = (cycle ? cycleTx(currentMonth) : txOfMonth(currentMonth)).filter(t => t.type === 'expense' && !isSavingTx(t));
  const today = todayISO();
  const lastDate = today < period.end ? today : period.end;
  const weeks = [];
  // Las semanas terminan en domingo. La parte futura del período no pertenece a la serie realizada.
  for (let start = period.start; start <= lastDate;){
    const weekday = new Date(start+'T00:00:00Z').getUTCDay();
    const sunday = dateOffset(start,(7-weekday)%7);
    const end = sunday < lastDate ? sunday : lastDate;
    weeks.push({start,end,amount:sum(expenses.filter(t=>t.date>=start&&t.date<=end))});
    start = dateOffset(end,1);
  }
  const periodKey = [activeProfile,period.start,period.end,cycle].join('|');
  const dataKey = JSON.stringify([periodKey,weeks]);
  if (dataKey === mobileWeekData) return;
  const newPeriod = periodKey !== mobileWeekPeriod;
  mobileWeekPeriod = periodKey;
  mobileWeekData = dataKey;
  const max = Math.max(0,...weeks.map(week => week.amount));
  const title = `<div class="mobile-weekly-head"><h2 id="mobileWeeklyTitle">Gastos por semana</h2>${cycle ? `<p>${esc(shortPeriodLabel(currentMonth))}</p>` : ''}</div>`;
  if (!max){
    mobileWeeks = [];
    mobileWeeklySpending.innerHTML = title + '<p class="mobile-weekly-empty">Sin gastos registrados en este período.</p>';
    return;
  }
  const focused = document.activeElement?.closest('[data-mobile-week]');
  const reselect = newPeriod || !mobileWeeks.length;
  const width = 360, height = 96;
  mobileWeeks = weeks.map((week,index) => ({
    ...week,
    x:(index+.5)*width/weeks.length,
    y:height-8-(height-20)*week.amount/max
  }));
  const line = mobileWeeks.map(({x,y},index) => {
    if (!index) return `M0 ${y} H${x}`;
    const prev = mobileWeeks[index-1], mid = (prev.x+x)/2;
    return `C${mid} ${prev.y} ${mid} ${y} ${x} ${y}`;
  }).join(' ') + ` H${width}`;
  const area = `${line} V${height} H0 Z`;
  mobileWeeklySpending.innerHTML = title + `
    <div class="mobile-weekly-readout" role="status"><strong></strong><span></span></div>
    <div class="mobile-weekly-chart" style="--week-count:${weeks.length}">
      <div class="mobile-weekly-plot" aria-hidden="true">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
          <defs><linearGradient id="mobileWeeklyFade" x1="0" x2="0" y1="0" y2="${height}" gradientUnits="userSpaceOnUse">
            <stop stop-color="currentColor" stop-opacity=".24"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient></defs>
          <path class="mobile-weekly-area" d="${area}" fill="url(#mobileWeeklyFade)"/>
          <path class="mobile-weekly-line" d="${line}" fill="none" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="mobile-weekly-cursor"><span></span></div>
      </div>
      <div class="mobile-weekly-weeks" role="group" aria-label="Gastos realizados por semana">${weeks.map((week,index) =>
        `<button type="button" data-mobile-week="${index}" aria-label="${weekRange(week)} · ${fmt(week.amount)}"><span><time datetime="${week.start}">${weekDate(week.start)}</time></span></button>`
      ).join('')}</div>
    </div>`;
  const index = reselect ? weeks.findLastIndex(week => week.amount > 0) : Math.min(mobileWeekIndex,weeks.length-1);
  selectMobileWeek(index,false);
  if (focused) mobileWeeklySpending.querySelector(`[data-mobile-week="${Math.min(Number(focused.dataset.mobileWeek),weeks.length-1)}"]`)?.focus({preventScroll:true});
}

function moveMobileWeekCursor(week, animate){
  const plot = mobileWeeklySpending.querySelector('.mobile-weekly-plot');
  const cursor = plot.querySelector('.mobile-weekly-cursor');
  const line = plot.querySelector('.mobile-weekly-line');
  const {width,height} = line.ownerSVGElement.viewBox.baseVal;
  const transform = ({x,y}) => `translate(${x/width*100}%,${y/height*100}%)`;
  if (!animate || reduceMotion() || !plot.clientWidth){
    cursor._motion?.cancel();cursor._motion=null;
    cursor.style.transform = transform(week);
    return;
  }

  const matrix = new DOMMatrixReadOnly(getComputedStyle(cursor).transform);
  const startX = matrix.m41 / plot.clientWidth * width;
  const total = line.getTotalLength();
  // El trazo avanza en X. Busca los puntos de inicio y destino sobre la curva que ya se dibuja.
  const distanceAt = x => {
    let low = 0, high = total;
    for (let step = 0; step < 16; step++){
      const mid = (low+high)/2;
      if (line.getPointAtLength(mid).x < x) low = mid;
      else high = mid;
    }
    return (low+high)/2;
  };
  const start = distanceAt(startX), end = distanceAt(week.x);
  const frames = [{transform:`translate(${startX/width*100}%,${matrix.m42/plot.clientHeight*100}%)`}];
  for (let sample = 1; sample < 24; sample++){
    const point = line.getPointAtLength(start+(end-start)*sample/24);
    frames.push({transform:transform(point)});
  }
  cursor.style.transform = transform(week);
  frames.push({transform:cursor.style.transform});
  motionAnimate(cursor,frames,'popup');
}

function selectMobileWeek(index, animate = true){
  const week = mobileWeeks[index];
  if (!week) return;
  mobileWeekIndex = index;
  moveMobileWeekCursor(week,animate);
  const readout = mobileWeeklySpending.querySelector('.mobile-weekly-readout');
  readout.querySelector('strong').textContent = fmt(week.amount);
  readout.querySelector('span').textContent = weekRange(week);
  mobileWeeklySpending.querySelectorAll('[data-mobile-week]').forEach(button => {
    button.setAttribute('aria-pressed',String(Number(button.dataset.mobileWeek) === index));
  });
}
mobileWeeklySpending.addEventListener('click', event => {
  const button = event.target.closest('[data-mobile-week]');
  if (button && Number(button.dataset.mobileWeek) !== mobileWeekIndex) selectMobileWeek(Number(button.dataset.mobileWeek));
});

