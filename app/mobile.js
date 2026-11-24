// Presentación móvil: reutiliza navegación, perfiles y cálculos existentes.
const mobileLayout = matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
const mobileNav = document.createElement('nav');
mobileNav.id = 'mobileNav';
mobileNav.setAttribute('aria-label', 'Navegación móvil');
const mobileNavItem = (tab, label, icon) => `<button type="button" data-mobile-tab="${tab}" aria-label="${label}" title="${label}"><span class="mobile-nav-glyph">${ic(icon)}</span></button>`;
// Cinco áreas iguales con «+» exactamente al centro: dos destinos a cada lado.
mobileNav.innerHTML = mobileNavItem('dashboard', 'Resumen', 'house')
  + mobileNavItem('budget', 'Presupuesto', 'wallet')
  + `<button type="button" id="mobileNew" aria-label="Nuevo movimiento"><span class="mobile-nav-glyph">${ic('plus')}</span></button>`
  + mobileNavItem('goals', 'Metas', 'target')
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
const mobileDestinations = [['analysis','Análisis','chart-column'],['both','Ambos','users'],['cats','Categorías','tags'],['settings','Ajustes','settings']];
mobileMore.innerHTML = `<div class="dlg-head"><h2 id="mobileMoreTitle">Más opciones</h2><button type="button" class="iconbtn" aria-label="Cerrar opciones">${ic('x')}</button></div><div class="mobile-more-list">`
  + mobileDestinations.map(([tab,label,icon]) => `<button type="button" data-mobile-destination="${tab}">${ic(icon)}<span>${label}${tab==='both'?'<small>Resumen de los dos perfiles</small>':''}</span>${ic('chevron-right')}</button>`).join('') + '</div>';
document.body.append(mobileMore);

function updateMobileNavigation() {
  const current = activeTab();
  if (current !== 'dashboard' && mobileMovementPanel) setMobileMovementPanel('');
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
mobileTxNote.id='mobileTxNote';mobileTxNote.type='button';mobileTxNote.className='mobile-only btn';
mobileTxNote.innerHTML=ic('pencil')+'<span>Agregar nota</span>';txBody.append(mobileTxNote);
const mobileTxMeta=document.createElement('div');mobileTxMeta.className='mobile-only mobile-tx-meta';
const mobileTxCategory=document.createElement('button');mobileTxCategory.type='button';mobileTxCategory.id='mobileTxCategory';mobileTxCategory.className='btn';mobileTxCategory.setAttribute('aria-expanded','false');
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
// Lupa y «+» en la cabecera de Categoría: la búsqueda y el alta de categoría no ocupan espacio fijo.
const txCategoryHeadTools=document.createElement('span');txCategoryHeadTools.className='mobile-only tx-category-head-tools';
txCategoryHeadTools.innerHTML=`<button type="button" class="iconbtn" id="txCategorySearchToggle" aria-label="Buscar categoría" aria-expanded="false" aria-controls="txCategorySearchBox">${ic('search')}</button><button type="button" class="iconbtn" id="txCategoryAdd" aria-label="Nueva categoría" aria-controls="txCategoryEditor">${ic('plus')}</button>`;
txCategoryField.querySelector('.tx-field-head').append(txCategoryHeadTools);
$('#txCategorySearchToggle').onclick=()=>{
  txCategorySearchOpen=!txCategorySearchOpen;
  $('#txCategorySearchToggle').setAttribute('aria-expanded',String(txCategorySearchOpen));
  if(!txCategorySearchOpen)$('#txCategorySearch').value='';
  renderTxChips();
  if(txCategorySearchOpen)$('#txCategorySearch').focus();
};
$('#txCategoryAdd').onclick=()=>{openTxCategoryEditor();$('#txCategoryEditor').scrollIntoView({block:'nearest'});};
const txNodes=[[$('#txSeg'),txHeader],[$('#fDateField'),mobileTxMeta],[txNoteField,txBody],[txMethodField,mobileTxExtras],[$('#fGoalField'),mobileTxExtras],[$('#txQuick'),mobileTxExtras],[$('#txDelete'),mobileTxExtras],[$('#txDup'),mobileTxExtras]].map(([node,parent])=>{
  const anchor=document.createComment('Posición del campo en escritorio');node.before(anchor);return {node,parent,anchor};
});
// Teclado del monto inspirado en Dime (github.com/rafsoh/dimeApp, NumberPad): 1–9, punto, 0 y ✓ para guardar.
// El importe se escribe sin el teclado del sistema; el campo sigue siendo #fAmount, así el guardado no cambia.
const mobileTxKeypad=document.createElement('div');
mobileTxKeypad.id='mobileTxKeypad';mobileTxKeypad.className='mobile-tx-keypad';
mobileTxKeypad.setAttribute('role','group');mobileTxKeypad.setAttribute('aria-label','Teclado del monto');
mobileTxKeypad.innerHTML=['1','2','3','4','5','6','7','8','9','.','0'].map(k=>`<button type="button" data-key="${k}"${k==='.'?' aria-label="Punto decimal"':''}>${k}</button>`).join('')
  +`<button type="submit" class="keypad-submit btn primary" aria-label="Guardar">${ic('check')}</button>`;
const mobileTxKeypadSlot=document.createElement('div');
mobileTxKeypadSlot.className='mobile-only mobile-tx-keypad-slot';
mobileTxKeypadSlot.append(mobileTxKeypad,mobileTxViewport);
txBody.append(mobileTxKeypadSlot);
const mobileTxBackspace=document.createElement('button');
mobileTxBackspace.type='button';mobileTxBackspace.id='mobileTxBackspace';mobileTxBackspace.className='mobile-only iconbtn';
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
  mobileTxDone.inert=!panel;
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
const txKeepKeyboardButtons='#mobileTxKeypad button,#txCategoryAdd,#mobileTxBackspace,#mobileTxCategory,#mobileTxOptions,#mobileTxDone,#txAllCategories,#txNewCategory,#txCancelCategory,#txCreateCategory,#txSeg button,#fCatChips [data-cat],#fMethodChips [data-method],#fGoalChips [data-goal],#txQuick button';
txDialog.addEventListener('mousedown',event=>{
  if(!mobileLayout.matches||event.button>0||!event.target.closest(txKeepKeyboardButtons))return;
  if(txDialog.contains(document.activeElement)&&document.activeElement.matches('input:not([type=hidden]),textarea'))event.preventDefault();
});
mobileTxDone.onclick=()=>setMobileTxPanel(null);
txDialog.addEventListener('close',()=>{if(mobileLayout.matches)dpClose();});
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
if(mobileLayout.matches){$('#fltScope').value=defaultMovementScope();$('#fltType').value='expense';}
// El tipo es del selector de Resumen solo en móvil; en PC vuelve a «Todos».
mobileLayout.addEventListener('change',({matches})=>{$('#fltType').value=matches?'expense':'';});
$('#mobileNew').onclick = () => {
  if (!bothMode) openTx(null, movementsVisible() && movView==='cal' && calSel ? {date:calSel} : {});
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

const mobileHomeMetrics = $('#tab-dashboard .dashboard-kpis');
const mobileHomeSelector = document.createElement('div');
mobileHomeSelector.className = 'seg mobile-only mobile-home-selector';
mobileHomeSelector.setAttribute('role', 'group');
mobileHomeSelector.setAttribute('aria-label', 'Serie de la gráfica y de Movimientos');
// Ambos compara las dos curvas; Gastos e Ingresos además filtran la lista de abajo.
// Gastos primero; Ambos (icono) al lado de Ingresos. Un indicador se desliza entre opciones.
mobileHomeSelector.innerHTML = `<span class="home-seg-ind" aria-hidden="true"></span><button type="button" data-home-kind="expense" class="active" aria-pressed="true" aria-controls="mobileHomeChart movBody">Gastos</button>
  <button type="button" data-home-kind="income" aria-pressed="false" aria-controls="mobileHomeChart movBody">Ingresos</button>
  <button type="button" data-home-kind="both" aria-pressed="false" aria-controls="mobileHomeChart movBody" aria-label="Gastos e ingresos" title="Gastos e ingresos">${ic('arrow-down-up')}</button>`;
const homeSegIndicator = mobileHomeSelector.firstElementChild;
function moveHomeSegIndicator(animate = true, active = mobileHomeSelector.querySelector('button.active')){
  if (!active?.offsetWidth) return;
  const geometry = {left: active.offsetLeft+'px', width: active.offsetWidth+'px'};
  if (!animate || !homeSegIndicator.style.width){ homeSegIndicator._motion?.cancel(); Object.assign(homeSegIndicator.style, geometry); return; }
  moveIndicator(homeSegIndicator, geometry, undefined, MOTION.panel);
  // Al terminar, se ajusta al ancho final (la opción activa pasa a 600 y cambia de ancho).
  homeSegIndicator._motion?.finished.then(() => moveHomeSegIndicator(false), () => {});
}
new ResizeObserver(() => requestAnimationFrame(() => { if (!homeSegIndicator._motion) moveHomeSegIndicator(false); })).observe(mobileHomeSelector);
// Las cifras indican su alcance: «Del mes» o «Del ciclo».
for (const [card, icon] of [['.k-exp','arrow-down'],['.k-inc','arrow-up']]){
  const details = mobileHomeMetrics.querySelector(card);
  const summary = details.querySelector('summary');
  const value = summary.querySelector('.value');
  value.insertAdjacentHTML('afterend','<span class="home-scope mobile-only"></span>');
  // En Ambos, Gastos muestra qué parte de los ingresos del período se gastó (sin ahorro ni aportes).
  if (card === '.k-exp') summary.insertAdjacentHTML('beforeend','<span class="home-ratio mobile-only"></span>');
  // Cada cifra lleva el icono de su rol: ↑ entra (ingreso), ↓ sale (gasto).
  value.insertAdjacentHTML('beforebegin',`<span class="home-kind-ic mobile-only" aria-hidden="true">${ic(icon)}</span>`);
  const parts = [...summary.children].filter(part => !part.matches('.metric-chevron'));
  const mobileCard = document.createElement('div');
  mobileCard.className = `card kpi home-metric ${card.slice(1)}`;
  function placeHomeMetric(){
    // La cifra comparte los mismos nodos en móvil y PC, conservando sus IDs.
    if (mobileLayout.matches){
      if (mobileCard.isConnected) return;
      details.replaceWith(mobileCard);
      mobileCard.append(...parts, details);
    }else if (mobileCard.isConnected){
      summary.prepend(...parts);
      mobileCard.replaceWith(details);
    }
  }
  placeHomeMetric();
  mobileLayout.addEventListener('change', placeHomeMetric);
}
const mobileHomeChart = document.createElement('div');
mobileHomeChart.id = 'mobileHomeChart';
mobileHomeChart.className = 'mobile-only mobile-home-trend';
mobileHomeMetrics.dataset.homeKind = 'expense';
mobileHomeMetrics.append(mobileHomeSelector, mobileHomeChart);
$('#mobileHomeSync').onclick = () => $('#syncBadge').click();
$('#mobileHomeSync').innerHTML = ic('cloud'); // nube con punto de estado: se lee como «guardado», no como un punto suelto
const mobileHistory = $('#tab-movs');
const desktopHistoryAnchor = document.createComment('Posición de Movimientos en escritorio');
mobileHistory.before(desktopHistoryAnchor);
const mobileHistoryHeader = document.createElement('div');
mobileHistoryHeader.className = 'mobile-only mobile-history-header';
mobileHistoryHeader.innerHTML = '<h2 id="mobileHistoryHeading" class="section-title" tabindex="-1">Movimientos</h2><span class="small muted"></span>';
mobileHistory.prepend(mobileHistoryHeader);
const mobileHistoryHeading = mobileHistoryHeader.firstElementChild;
const mobileHistoryScope = mobileHistoryHeader.lastElementChild;
function positionMobileHistory(){
  const embedded = mobileLayout.matches;
  const wasActive = mobileHistory.classList.contains('active');
  mobileHistory.classList.toggle('tab', !embedded);
  if (embedded){
    mobileHistory.classList.remove('active');
    mobileHistory.setAttribute('aria-labelledby', mobileHistoryHeading.id);
    mobileHomeMetrics.after(mobileHistory);
    if (wasActive) showTab('movs');
  }else{
    mobileHistory.removeAttribute('aria-labelledby');
    desktopHistoryAnchor.after(mobileHistory);
  }
}
function focusMobileHistory(){
  mobileHistoryHeading.focus({preventScroll:true});
  const top = mobileHistory.getBoundingClientRect().top + window.scrollY - $('.topbar').getBoundingClientRect().height - 8;
  window.scrollTo({top, behavior:'instant'});
}
positionMobileHistory();
mobileLayout.addEventListener('change', positionMobileHistory);
// El foco nativo de WebKit puede quedar dentro de la reserva de la barra fija.
function keepMobileFocusAboveDock({target}){
  if (!mobileLayout.matches || !target.matches(':focus-visible')) return;
  const reserved = parseFloat(getComputedStyle(document.body, '::before').height);
  if (target.getBoundingClientRect().bottom > innerHeight - reserved) {
    target.scrollIntoView({block:'center', behavior:'instant'});
  }
}
mobileHistory.addEventListener('focusin', keepMobileFocusAboveDock);
$('#goalsGrid').addEventListener('focusin', keepMobileFocusAboveDock);
let mobileHomeSeriesKey = '';
const mobileHomePlots = new Map();
let mobileHomeWeeks = [];
function selectMobileHomeWeek(index){
  const week = mobileHomeWeeks[index];
  if (!week) return;
  markMobileChartWeek(mobileHomeChart, index);
  const readout = mobileHomeChart.querySelector('.mobile-home-readout');
  readout.querySelector('span').textContent = week.cumulative ? `Al ${weekDate(week.end)}` : weekRange(week);
  readout.querySelector('strong').innerHTML = week.values.length > 1
    ? `<span class="pos">+ ${fmt(week.values[1])}</span><span>− ${fmt(week.values[0])}</span>`
    : fmt(week.values[0]);
}
function revealMobileHomeChart(){
  motionAnimate(mobileHomeChart.querySelector('svg'), [{opacity:.65,clipPath:'inset(0 50% 0 0)'}, {opacity:1,clipPath:'inset(0)'}], 'data');
}
function renderMobileHomeChart(txs){
  if (!homeSegIndicator.style.width) requestAnimationFrame(() => moveHomeSegIndicator(false));
  const kind = mobileHomeMetrics.dataset.homeKind;
  const kinds = kind === 'both' ? ['expense','income'] : [kind];
  // Gastos excluye ahorro y aportes; en Ambos, gasto e ingreso comparten escala.
  const byKind = kinds.map(k => txs.filter(t => t.type === k && (k === 'income' || !isSavingTx(t))));
  const cycle = cycleView();
  const series = mobilePeriodWeeks(cycle).map(week => ({...week, values: byKind.map(list => weekTotal(list, week))}));
  // Ambos compara acumulados por día (como un saldo que crece): ingreso y gasto se cruzan si el mes se pasa.
  let days = [], daily = [];
  if (kind === 'both' && series.length){
    const totals = byKind.map(list => {
      const byDay = new Map();
      for (const tx of list) byDay.set(tx.date, (byDay.get(tx.date) || 0) + Number(tx.amount || 0));
      return byDay;
    });
    const accumulated = totals.map(() => 0);
    for (let d = series[0].start; d <= series.at(-1).end; d = dateOffset(d,1)) days.push(d);
    daily = days.map(day => totals.map((byDay,i) => accumulated[i] += byDay.get(day) || 0));
    for (const week of series){ week.values = daily[days.indexOf(week.end)]; week.cumulative = true; }
  }
  const width = 360, height = parseFloat(getComputedStyle(mobileHomeChart).getPropertyValue('--home-plot-height')) || 144, band = 10;
  const key = JSON.stringify([kind, height, cycle, series, daily]);
  if (mobileHomeSeriesKey === key) return;
  mobileHomeSeriesKey = key;
  mobileHomeWeeks = series;
  const focused = document.activeElement?.closest('[data-home-week]');
  const animate = mobileLayout.matches && activeTab() === 'dashboard' && !reduceMotion();
  const oldPlot = mobileHomeChart.querySelector('svg');
  oldPlot?._motion?.cancel();
  if (oldPlot) oldPlot._motion = null;
  const max = Math.max(0, ...series.flatMap(week => week.values));
  const noun = kind === 'both' ? 'movimientos' : kind === 'income' ? 'ingresos' : 'gastos';
  for (const el of mobileHomeMetrics.querySelectorAll('.home-scope')) el.textContent = cycle ? 'Del ciclo' : 'Del mes';
  if (kind === 'both'){
    const [periodSpend,periodIncome] = daily.at(-1) || [0,0];
    mobileHomeMetrics.querySelector('.home-ratio').textContent = periodIncome > 0 ? `${pctTxt(periodSpend / periodIncome * 100)} de tus ingresos` : 'Sin ingresos en el período';
  }
  if (!max){
    mobileHomeChart.innerHTML = `<p class="mobile-home-empty">Sin ${noun} registrados en este período.</p>`;
    if (focused) mobileHomeSelector.querySelector('.active').focus({preventScroll:true});
    return;
  }
  const cached = mobileHomePlots.get(kind);
  if (cached?.key === key){
    mobileHomeChart.replaceChildren(...cached.nodes);
  }else{
    const lines = kinds.map((k, s) => ({kind:k, points: series.map(({values}, i) => ({
      x: (i + .5) * width / series.length,
      y: height - 12 - (height - 18 - band) * values[s] / max
    }))}));
    const label = kind === 'both' ? 'Ingresos y gastos acumulados' : `${kind === 'income' ? 'Ingresos' : 'Gastos'} por semana`;
    const weekLabel = week => kind === 'both' ? `al ${weekDate(week.end)}, ingresos ${fmt(week.values[1])}, gastos ${fmt(week.values[0])}` : fmt(week.values[0]);
    const plot = kind === 'both' ? mobileCumulativeSvg(width, height, kinds, days, daily, series, max, label, band) : mobileTrendSvg(width, height, lines, label);
    mobileHomeChart.innerHTML = `<div class="mobile-home-plot">
      ${plot}
      <div class="mobile-home-weeks" role="group" aria-label="${label}" style="--week-count:${series.length}">
        ${series.map((week,i) => `<button type="button" data-home-week="${i}" aria-label="${weekRange(week)}: ${weekLabel(week)}"></button>`).join('')}
      </div>
    </div><div class="mobile-home-readout" role="status"><span></span><strong></strong></div>`;
    mobileHomePlots.set(kind, {key, nodes:[...mobileHomeChart.children]});
  }
  const selected = focused ? Math.min(Number(focused.dataset.homeWeek),series.length-1) : Math.max(0, series.findLastIndex(week => week.values.some(Boolean)));
  selectMobileHomeWeek(selected);
  if (focused) mobileHomeChart.querySelector(`[data-home-week="${selected}"]`).focus({preventScroll:true});
  if (animate) revealMobileHomeChart();
}
mobileHomeChart.addEventListener('click', event => {
  const button = event.target.closest('[data-home-week]');
  if (button) selectMobileHomeWeek(Number(button.dataset.homeWeek));
});
function markMobileChartWeek(chart, index){
  chart.querySelectorAll('.mobile-home-weeks button').forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === index));
  });
  chart.querySelectorAll('.mobile-home-plot [data-week]').forEach(mark => {
    mark.classList.toggle('active', Number(mark.dataset.week) === index);
  });
}
function stepMobileChartWeek(event, selectWeek){
  const group = event.target.closest('.mobile-home-weeks');
  const direction = {ArrowLeft:-1, ArrowRight:1}[event.key];
  if (!group || !direction) return;
  event.preventDefault();
  const buttons = [...group.querySelectorAll('button')];
  const index = Math.max(0, Math.min(buttons.length - 1, buttons.indexOf(event.target) + direction));
  selectWeek(index);
  buttons[index].focus();
}
mobileHomeChart.addEventListener('keydown', event => stepMobileChartWeek(event, selectMobileHomeWeek));
mobileHomeSelector.onclick = event => {
  const button = event.target.closest('[data-home-kind]');
  if (!button || button.classList.contains('active')) return;
  // El tipo de #fltType es la única fuente: renderMovs sincroniza selector y gráfica.
  const type = $('#fltType');
  type.value = button.dataset.homeKind === 'both' ? '' : button.dataset.homeKind;
  type.dispatchEvent(new Event('change', {bubbles:true}));
};

function placeMobileToolIndicator(indicator, button){
  const visible = indicator.style.opacity === '1';
  if (button?.offsetWidth){
    const bounds = indicator.parentElement.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    const zoom = Number(getComputedStyle(document.documentElement).zoom) || 1;
    const geometry = {left:(box.left-bounds.left)/zoom+'px', width:box.width/zoom+'px'};
    if (!visible) Object.assign(indicator.style,geometry);
    else if (indicator.style.left !== geometry.left || indicator.style.width !== geometry.width){
      moveIndicator(indicator,geometry);
    }
  }else if (visible){
    indicator._motion?.cancel();
    indicator._motion = null;
  }
  indicator.style.opacity = button?.offsetWidth ? '1' : '0';
}

const mobileBudgetView = document.createElement('section');
VICONS['sliders-horizontal'] = '<path d="M3 7h6m4 0h8M3 17h10m4 0h4M9 4v6m8 4v6"/>';
mobileBudgetView.id = 'mobileBudgetView';
mobileBudgetView.className = 'mobile-only';
mobileBudgetView.setAttribute('aria-labelledby', 'desktopSectionTitle');
mobileBudgetView.innerHTML = `<div id="mobileBudgetGauge"></div><div id="mobileBudgetChart" hidden></div>
 <h2 id="mobileBudgetTitle" class="section-title">Presupuestos</h2>
 <div class="mobile-list-tools mobile-budget-tools" role="group" aria-label="Opciones de presupuestos">
  <span class="mobile-tool-ind" aria-hidden="true"></span>
  <button type="button" data-budget-tool="list" aria-label="Listado de presupuestos" aria-pressed="true" title="Mostrar todos">${ic('list')}</button>
  <button type="button" data-budget-tool="search" aria-label="Buscar presupuestos" aria-expanded="false" aria-controls="mobileBudgetSearch" title="Buscar">${ic('search')}</button>
  <button type="button" data-budget-tool="filter" aria-label="Filtrar presupuestos" aria-expanded="false" aria-controls="mobileBudgetFilters" title="Filtrar">${ic('sliders-horizontal')}</button>
 </div>
 <div id="mobileBudgetSearch" class="search-box mobile-list-search" hidden>${ic('search')}<input type="search" placeholder="Buscar categoría" aria-label="Buscar categoría de presupuesto"></div>
 <div id="mobileBudgetFilters" hidden>
  <select id="mobileBudgetState" aria-label="Estado del presupuesto">
   <option value="all">Todas las categorías</option>
   <option value="over">Con exceso</option>
   <option value="unplanned">Sin plan</option>
  </select>
 </div>
 <div class="mobile-budget-categories" id="mobileBudgetCategories"></div>
 <p id="mobileBudgetEmpty" class="small muted" role="status" hidden></p>`;
$('#tab-budget .bud-grid').before(mobileBudgetView);
$('#tab-budget').addEventListener('focusin', keepMobileFocusAboveDock);
const mobileBudgetChart = $('#mobileBudgetChart');
function revealMobileBudgetBars(){
  for (const bar of mobileBudgetChart.querySelectorAll('.mobile-budget-bar-plot>span')){
    motionAnimate(bar,[{opacity:.65,transform:'scaleY(.25)'},{opacity:1,transform:'none'}],'data');
  }
}
const mobileBudgetSearch = $('#mobileBudgetSearch input');
const mobileBudgetFilters = $('#mobileBudgetFilters');
const mobileBudgetState = $('#mobileBudgetState');
const budgetStateControl = enhanceSelect(mobileBudgetState);
const budgetToolIndicator = $('.mobile-budget-tools .mobile-tool-ind');
let mobileBudgetPanel = '';
function updateBudgetToolIndicator(){
  placeMobileToolIndicator(budgetToolIndicator,$(`[data-budget-tool="${mobileBudgetPanel || 'list'}"]`));
}
new ResizeObserver(updateBudgetToolIndicator).observe(budgetToolIndicator.parentElement);

const budgetSearchText = text => text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('es');
function updateMobileBudgetList(){
  const query = budgetSearchText(mobileBudgetSearch.value.trim());
  const mobileBudgetFilter = mobileBudgetState.value;
  const rows = [...$('#mobileBudgetCategories').querySelectorAll('[data-mobile-budget-edit]')];
  for (const row of rows) {
    const name = row.querySelector('.mobile-budget-tile-copy>b').textContent;
    row.hidden = !budgetSearchText(name).includes(query) || (mobileBudgetFilter !== 'all' && row.dataset.budgetState !== mobileBudgetFilter);
  }
  const empty = $('#mobileBudgetEmpty');
  empty.hidden = rows.some(row => !row.hidden);
  if (!empty.hidden) empty.textContent = rows.length ? 'No hay presupuestos que coincidan.' : 'Crea categorías de gasto para distribuir tu presupuesto.';
  $('[data-budget-tool=search]').classList.toggle('has-value', Boolean(query));
  $('[data-budget-tool=filter]').classList.toggle('has-value', mobileBudgetFilter !== 'all');
}
function setMobileBudgetPanel(panel){
  mobileBudgetPanel = panel;
  $('#mobileBudgetSearch').hidden = panel !== 'search';
  mobileBudgetFilters.hidden = panel !== 'filter';
  $('[data-budget-tool=list]').setAttribute('aria-pressed', String(!panel));
  for (const tool of ['search','filter']) {
    $(`[data-budget-tool="${tool}"]`).setAttribute('aria-expanded', String(panel === tool));
  }
  if (panel !== 'filter') budgetStateControl._close();
  updateBudgetToolIndicator();
}
mobileBudgetSearch.addEventListener('input', updateMobileBudgetList);
mobileBudgetState.addEventListener('change', updateMobileBudgetList);
mobileBudgetView.addEventListener('click', event => {
  const tool = event.target.closest('[data-budget-tool]')?.dataset.budgetTool;
  if (!tool) return;
  if (tool === 'list') {
    mobileBudgetSearch.value = '';
    mobileBudgetState.value = 'all';
    updateMobileBudgetList();
  }
  setMobileBudgetPanel(tool === 'list' || tool === mobileBudgetPanel ? '' : tool);
  if (mobileBudgetPanel === 'search') mobileBudgetSearch.focus();
  if (mobileBudgetPanel === 'filter') budgetStateControl.querySelector('button').focus();
});
mobileBudgetView.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || !mobileBudgetPanel) return;
  const tool = $(`[data-budget-tool="${mobileBudgetPanel}"]`);
  event.preventDefault();
  setMobileBudgetPanel('');
  tool.focus({preventScroll:true});
});

// Las herramientas existentes se despliegan debajo de las tarjetas y vuelven a su sitio en escritorio.
const mobileBudgetOptions = document.createElement('details');
mobileBudgetOptions.id = 'mobileBudgetOptions';
mobileBudgetOptions.className = 'mobile-only mobile-budget-options';
mobileBudgetOptions.innerHTML = '<summary>Ingresos, ahorro y opciones'+ic('chevron-down')+'</summary><div class="mobile-budget-options-body"></div>';
$('#tab-budget').append(mobileBudgetOptions);
const mobileBudgetTools = [$('#tab-budget .bud-side'), $('#tab-budget .budget-actions')].map(node => {
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
  const cycle = cycleView();
  const actuals = planTx(m);
  const startMonth = cycle ? cyclePeriod(m).start.slice(0,7) : m;
  const rows = catsOf('expense').map(c => {
    const saving = isSavingCat(c.id);
    const real = sum(actuals.filter(t => t.catId === c.id && (saving || !isSavingTx(t))));
    return {c, saving, budget:planBudget(m,c.id), real};
  }).filter(({c,real}) => !isArch(c,startMonth) || real);
  const spendRows = rows.filter(row => !row.saving);
  const budget = spendRows.reduce((total,row) => total+row.budget,0), real = spendRows.reduce((total,row) => total+row.real,0);
  const left = budget - real;
  $('#mobileBudgetGauge').innerHTML = `<div class="mobile-budget-summary"><span class="mbs-label">${budget>0?(left<0?'Exceso':'Disponible')+' del '+(cycle?'ciclo':'mes'):'Sin presupuesto de gastos'}</span><strong class="mbs-amount">${budget>0?fmt(Math.abs(left)):fmt(real)}</strong>${budget>0?'':`<p class="mbs-label">${real?'Gastado sin plan. ':''}Toca una categoría para asignar un monto.</p>`}</div>`;
  const spendIds = new Set(spendRows.map(({c}) => c.id));
  renderMobileBudgetChart(actuals.filter(t => spendIds.has(t.catId) && !isSavingTx(t)), budget, cycle);
  $('#mobileBudgetCategories').innerHTML = rows.map(({c,saving,budget,real}) => {
    const left = budget-real, pct = budget>0?real/budget*100:0;
    const over = !saving && budget>0 && left<-.005;
    const caption = !budget ? (real?'Gastado sin presupuesto':'Toca para asignar') : saving ? (left>0?'Por ahorrar':'Ahorro adicional') : left<-.005?'Exceso':left<=.005?'Completo':'Por gastar';
    const state = over ? ' over' : !saving && pct>=85 && left>.005 ? ' warn' : '';
    // Fila compacta: icono, nombre y plan a la izquierda; lo que queda y su estado a la derecha; barra al pie.
    return `<button type="button" class="mobile-budget-tile${over?' over':''}" data-mobile-budget-edit="${esc(c.id)}" data-budget-state="${over?'over':budget?'planned':'unplanned'}" aria-description="Editar presupuesto"><span class="ico" aria-hidden="true" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><span class="mobile-budget-tile-copy"><b>${esc(c.name)}</b><span class="mobile-budget-tile-meta">${budget?`Plan ${fmt(budget)} · ${pctTxt(pct)} ${saving?'ahorrado':'usado'}`:'Sin presupuesto'}</span></span><span class="mobile-budget-tile-amount"><strong>${budget?fmt(Math.abs(left)):real?fmt(real):'Sin definir'}</strong>${caption==='Por gastar'?'':`<span class="mobile-budget-tile-caption">${caption}</span>`}</span><span class="mobile-budget-tile-track${state}" aria-hidden="true"><i style="width:${Math.min(100,Math.max(0,pct))}%"></i></span></button>`;
  }).join('');
  updateMobileBudgetList();
}

let mobileBudgetChartKey = '', mobileBudgetPeriodKey = '';
function selectMobileBudgetWeek(index){
  markMobileChartWeek(mobileBudgetChart, index);
}

function renderMobileBudgetChart(txs, budget, cycle){
  let total = 0;
  const weeks = budget > 0 ? mobilePeriodWeeks(cycle).map(week => ({...week,total:total += weekTotal(txs, week)})) : [];
  const period = JSON.stringify([activeProfile,currentMonth,cycle ? cycleDay() : null]);
  const key = JSON.stringify([period,budget,weeks]);
  if (key === mobileBudgetChartKey) return;
  mobileBudgetChartKey = key;
  const focused = mobileBudgetChart.contains(document.activeElement);
  const previous = mobileBudgetChart.querySelector('[aria-pressed=true]');
  const selected = mobileBudgetPeriodKey === period && previous ? Math.min(Number(previous.dataset.budgetWeek),weeks.length-1) : weeks.length-1;
  mobileBudgetPeriodKey = period;
  mobileBudgetChart.hidden = !weeks.length;
  if (!weeks.length){
    mobileBudgetChart.replaceChildren();
    return;
  }
  const max = Math.max(budget, ...weeks.map(week => week.total));
  const barHeight = value => Math.max(0,value) / max * 84;
  mobileBudgetChart.innerHTML = `<p id="mobileBudgetChartLabel" class="mobile-budget-chart-label">Gasto acumulado por semana</p>
    <div class="mobile-budget-bars" style="--budget-plan-offset:${(100-barHeight(budget))/100}">
      <div class="mobile-home-weeks" role="group" aria-labelledby="mobileBudgetChartLabel" aria-description="Plan: ${fmt(budget)}" style="--week-count:${weeks.length}">
        ${weeks.map((week,i) => {
          const left = budget - week.total;
          return `<button type="button" data-budget-week="${i}" aria-label="Al ${weekDate(week.end)}, gastado ${fmt(week.total)}. ${left<0?'Exceso':'Disponible'} ${fmt(Math.abs(left))}" style="--budget-bar-height:${barHeight(week.total)}%">
          <span class="mobile-budget-bar-plot" aria-hidden="true"><span></span></span>
          <span class="mobile-budget-bar-date" aria-hidden="true">${weekDate(week.end).replace('/','/<wbr>')}</span>
        </button>`;
        }).join('')}
      </div>
      <div class="mobile-budget-plan-marker" aria-hidden="true"><span>Plan</span></div>
    </div>`;
  selectMobileBudgetWeek(selected);
  if (focused) mobileBudgetChart.querySelector('[aria-pressed=true]').focus({preventScroll:true});
}
mobileBudgetChart.addEventListener('click', event => {
  const button = event.target.closest('[data-budget-week]');
  if (button) selectMobileBudgetWeek(Number(button.dataset.budgetWeek));
});
mobileBudgetChart.addEventListener('keydown', event => stepMobileChartWeek(event, selectMobileBudgetWeek));

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
  if (id && mobileLayout.matches) {
    const row = [...mobileBudgetView.querySelectorAll('[data-mobile-budget-edit]:not([hidden])')].find(button=>button.dataset.mobileBudgetEdit===id);
    (row || $(`[data-budget-tool="${mobileBudgetPanel || 'list'}"]`)).focus({preventScroll:true});
  }
  mobileBudgetDraft = null;
});

const mobileMovementTools = document.createElement('div');
mobileMovementTools.className = 'mobile-only mobile-movement-tools';
mobileMovementTools.setAttribute('role','group');
mobileMovementTools.setAttribute('aria-label','Opciones de la lista');
mobileMovementTools.innerHTML = [
  ['search','Buscar movimientos','movementSearch','search'],
  ['filters','Filtros y totales','movExtraFilters movSummary','sliders-horizontal']
].map(([panel,label,controlled,icon]) => `<button type="button" class="iconbtn" data-movement-tool="${panel}" title="${label}" aria-label="${label}" aria-expanded="false" aria-controls="${controlled}">${ic(icon)}</button>`).join('');
$('#btnSelect').before(mobileMovementTools);
const movementToolbar = $('#movementToolbar');
movementToolbar.classList.add('mobile-list-tools');
const movementToolIndicator = document.createElement('span');
movementToolIndicator.className = 'mobile-only mobile-tool-ind';
movementToolIndicator.setAttribute('aria-hidden','true');
movementToolbar.prepend(movementToolIndicator);
let mobileMovementPanel = '';
const movementPanels = {search:$('#movementSearch'), filters:$('#movExtraFilters'), details:$('#movSummary')};
movementPanels.search.classList.add('mobile-list-search');
const movementFilters = $('#movementFilters');
const movementSummaryHome = movementPanels.details.parentElement;
const movementPanelRegion = document.createElement('div');
movementPanelRegion.id = 'mobileMovementPanels';
function updateMovementToolIndicator(){
  const button = mobileMovementTools.querySelector('[aria-expanded=true]') ||
    movementToolbar.querySelector('#btnSelect[aria-pressed=true]');
  placeMobileToolIndicator(movementToolIndicator,mobileLayout.matches && button);
}
new ResizeObserver(updateMovementToolIndicator).observe(movementToolbar);
new MutationObserver(updateMovementToolIndicator).observe($('#btnSelect'),{attributes:true,attributeFilter:['aria-pressed','hidden']});

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
  // Los totales acompañan a los filtros: se ven juntos y la barra pierde un icono.
  movementPanels.details.hidden = compact && panel !== 'filters';
  setMovementFiltersOpen(panel === 'filters');
  mobileMovementTools.querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-expanded',String(button.dataset.movementTool === panel));
  });
  updateMovementToolIndicator();
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
    if (!movementPanelRegion.isConnected) movementFilters.before(movementPanelRegion);
    movementPanelRegion.append(movementFilters, movementPanels.details);
  }else{
    movementPanelRegion.before(movementFilters);
    movementPanelRegion.remove();
    movementSummaryHome.prepend(movementPanels.details);
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
const weekDate = date => date.slice(8,10)+'/'+date.slice(5,7);
const weekRange = ({start,end}) => start === end ? weekDate(start) : weekDate(start)+'–'+weekDate(end);
const weekTotal = (transactions, {start,end}) => sum(transactions.filter(t => t.date >= start && t.date <= end));

function mobilePeriodWeeks(cycle){
  const period = cycle ? cyclePeriod(currentMonth) : {start:dateFor(currentMonth,1),end:dateFor(currentMonth,daysIn(currentMonth))};
  const today = todayISO();
  const lastDate = today < period.end ? today : period.end;
  const weeks = [];
  // Las semanas terminan en domingo. La parte futura del período no pertenece a la serie realizada.
  for (let start = period.start; start <= lastDate;){
    const weekday = new Date(start+'T00:00:00Z').getUTCDay();
    const sunday = dateOffset(start,(7-weekday)%7);
    const end = sunday < lastDate ? sunday : lastDate;
    weeks.push({start,end});
    start = dateOffset(end,1);
  }
  return weeks;
}

function mobileTrendLine(points, end){
  return points.map(({x,y},index) => {
    if (!index) return `M0 ${y} H${x}`;
    const prev = points[index-1], mid = (prev.x+x)/2;
    return `C${mid} ${prev.y} ${mid} ${y} ${x} ${y}`;
  }).join(' ') + ` H${end}`;
}

function mobileCumulativeSvg(width, height, kinds, days, daily, weeks, max, label, band = 0){
  // Líneas rectas con área en degradado; la semana elegida usa la misma guía y el mismo anillo que Gastos e Ingresos.
  const pad = 16; // los puntos del borde no se recortan
  const x = i => days.length > 1 ? pad + i * (width - 2 * pad) / (days.length - 1) : width / 2;
  const y = v => height - 12 - (height - 18 - band) * v / max;
  const end = days.length - 1;
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    <defs>${kinds.map(kind => `<linearGradient id="mobileHomeFade-${kind}" x1="0" x2="0" y1="0" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop style="stop-color:var(--${kind}-chart)" stop-opacity=".14"/><stop offset="1" style="stop-color:var(--${kind}-chart)" stop-opacity="0"/>
    </linearGradient>`).join('')}</defs>
    ${weeks.map((week,i) => `<path class="mobile-home-guide" data-week="${i}" d="M${x(days.indexOf(week.end))} 0V${height}" vector-effect="non-scaling-stroke"/>`).join('')}
    ${kinds.map((kind, s) => { const line = daily.map((v,i) => `${i ? 'L' : 'M'}${x(i)} ${y(v[s])}`).join(''); return `<g class="mobile-home-series" data-kind="${kind}">
      <path class="mobile-weekly-area" d="${line}L${x(end)} ${height}L${x(0)} ${height}Z" fill="url(#mobileHomeFade-${kind})"/>
      <path class="mobile-weekly-line mobile-linear-line" d="${line}" fill="none" vector-effect="non-scaling-stroke"/>
      ${weeks.map((week,i) => { const d = days.indexOf(week.end), at = `M${x(d)} ${y(daily[d][s])}h.01`; return `<path class="mobile-home-point" data-week="${i}" d="${at}" vector-effect="non-scaling-stroke"/><path class="mobile-home-core" data-week="${i}" d="${at}" vector-effect="non-scaling-stroke"/>`; }).join('')}
    </g>`; }).join('')}
  </svg>`;
}
function mobileTrendSvg(width, height, lines, label){
  const gradientId = 'mobileHomeFade';
  // Cada serie lleva su color por clase; el degradado se define por serie porque currentColor no cruza al <defs>.
  // Estilo actual: sin puntos fijos; la semana elegida muestra guía vertical y un anillo.
  const fade = .2;
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    <defs>${lines.map(({kind}) => `<linearGradient id="${gradientId}-${kind}" x1="0" x2="0" y1="0" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop style="stop-color:var(--${kind}-chart)" stop-opacity="${fade}"/><stop offset="1" style="stop-color:var(--${kind}-chart)" stop-opacity="0"/>
    </linearGradient>`).join('')}</defs>
    ${lines.map(({kind, points}) => { const line = mobileTrendLine(points, width); return `<g class="mobile-home-series" data-kind="${kind}">
      <path class="mobile-weekly-area" d="${line} V${height} H0 Z" fill="url(#${gradientId}-${kind})"/>
      <path class="mobile-weekly-line" d="${line}" fill="none" vector-effect="non-scaling-stroke"/>
      ${points.map(({x,y},i) => `<path class="mobile-home-guide" data-week="${i}" d="M${x} ${y}V${height}" vector-effect="non-scaling-stroke"/><path class="mobile-home-point" data-week="${i}" d="M${x} ${y}h.01" vector-effect="non-scaling-stroke"/><path class="mobile-home-core" data-week="${i}" d="M${x} ${y}h.01" vector-effect="non-scaling-stroke"/>`).join('')}
    </g>`; }).join('')}
  </svg>`;
}

function syncMobileHomeKind(){
  const kind = $('#fltType').value || 'both';
  const previous = mobileHomeMetrics.dataset.homeKind;
  if (previous === kind) return false;
  moveHomeSegIndicator(true,mobileHomeSelector.querySelector(`button[data-home-kind="${kind}"]`));
  mobileHomeMetrics.dataset.homeKind = kind;
  for (const option of mobileHomeSelector.querySelectorAll('button')){
    const on = option.dataset.homeKind === kind;
    option.classList.toggle('active', on);
    option.setAttribute('aria-pressed', String(on));
  }
  // Sin esperar un fotograma: así ninguna cifra conserva el tamaño del modo anterior.
  fitMetricValues();
  // Solo gira la cifra que acaba de aparecer.
  if (previous !== 'both') spinValue($(previous === 'expense' ? '#kIncome' : '#kExpense'));
  renderMobileHomeChart(planTx(currentMonth));
  return true;
}
let pendingMovementReveal = null;
function revealMobileMovementList(list){
  if (!mobileLayout.matches || activeTab() !== 'dashboard' || $('#view-list').hidden || reduceMotion()) return;
  const opacity = list._motion ? Number(getComputedStyle(list).opacity) : .48;
  motionAnimate(list, [{opacity}, {opacity:1}], 'panel');
}
function renderMobileMovements(scope, filterCount, changedSeries){
  if (changedSeries){
    pendingMovementReveal?.disconnect();
    pendingMovementReveal = null;
    if (activeTab() === 'dashboard' && !$('#view-list').hidden && !reduceMotion()){
      const list = $('#movBody');
      const dockTop = mobileNav.getBoundingClientRect().top;
      const bounds = list.getBoundingClientRect();
      if (bounds.top < dockTop && bounds.bottom > 0){
        revealMobileMovementList(list);
      }else{
        // Si la gráfica llena la pantalla, reserva el fundido para cuando se vean las filas.
        const observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting || pendingMovementReveal !== observer) return;
          observer.disconnect();
          pendingMovementReveal = null;
          revealMobileMovementList(list);
        }, {rootMargin:`0px 0px -${Math.max(0,innerHeight-dockTop)}px`});
        pendingMovementReveal = observer;
        observer.observe(list);
      }
    }
  }
  requestAnimationFrame(moveViewInd); // coloca la píldora de Lista/Calendario al mostrarse Resumen
  mobileHistoryScope.textContent = scope === 'all' ? 'Todo el historial' : scope === 'cycle' ? 'Ciclo de sueldo' : scope === 'year' ? currentMonth.slice(0,4) : monthLong(currentMonth);
  mobileMovementTools.querySelector('[data-movement-tool=search]').classList.toggle('has-value',Boolean($('#fltText').value.trim()));
  const filters = mobileMovementTools.querySelector('[data-movement-tool=filters]');
  filters.classList.toggle('has-value',filterCount > 0);
  filters.setAttribute('aria-label',filterCount ? `Filtros y totales, ${plural(filterCount,'activo')}` : 'Filtros y totales');
}
