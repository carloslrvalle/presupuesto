// Presupuesto: ui.js — ver README.md del proyecto para responsabilidades y orden de carga.
const cycleCalendarMonths={},cycleSelectedMonths={};
if(cycleEnabled())currentMonth=cycleMonthForDate();
function syncPlanningNavigation(name){
 if(!cycleEnabled())return;
 const was=cycleView(),next=cycleView(name);
 if(was&&!next){cycleSelectedMonths[activeProfile]=currentMonth;currentMonth=cycleCalendarMonths[activeProfile]||thisMonth();}
 else if(!was&&next){cycleCalendarMonths[activeProfile]=currentMonth;currentMonth=cycleSelectedMonths[activeProfile]||cycleMonthForDate();}
 if(was!==next){monthInput.value=currentMonth;dirty=new Set(Object.keys(VIEWS));}
}
function planningHeader(){
 const bothCycles=bothMode&&bothUsesCycles();
 const cy=cycleView();$('#monthLabel').textContent=bothCycles?'Cierre · '+monthShort(currentMonth):cy?'Ciclo · '+monthShort(currentMonth):monthLong(currentMonth);
 $('#monthLabel').title=bothCycles?'Elegir mes de cierre de los períodos de ambos usuarios':cy?cycleLabel(currentMonth):'Elegir mes';
 $('#prevM').title=bothCycles?'Cierre anterior':cy?'Ciclo anterior':'Mes anterior';$('#nextM').title=bothCycles?'Cierre siguiente':cy?'Ciclo siguiente':'Mes siguiente';
 const labels=document.querySelectorAll('#tab-dashboard .kpi .label');
 [cy?'Ingresos del ciclo':'Ingresos del mes',cy?'Gastos del ciclo':'Gastos del mes','Saldo acumulado','Tasa de ahorro'].forEach((text,i)=>{if(!labels[i])return;for(const node of labels[i].childNodes)if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){node.textContent=text;break;}});
 $('#topExp').closest('.card').querySelector('h3').textContent=cy?'Top 5 gastos del ciclo':'Top 5 gastos del mes';
 $('#barsWrap').closest('.card').querySelector('h3').textContent='Evolución de ingresos y gastos';
 const copy=$('#btnCopyPrev span');if(copy)copy.textContent=cy?'Copiar ciclo anterior':'Copiar mes anterior';
}
function shortPeriodLabel(m){const p=cyclePeriod(m);return p.start.slice(0,4)!==p.end.slice(0,4)?cycleLabel(m):[p.start,p.end].map(d=>fmtDateLong(d).replace(/\s+\d{4}$/,'')).join(' – ');}
function renderPeriodControls(){
 const cy=cycleEnabled();
 document.querySelectorAll('[data-plan-controls]').forEach(el=>{
  el.innerHTML=`<button type="button" class="btn period-trigger" data-period-open aria-haspopup="dialog" aria-controls="periodDialog">${ic('calendar-days')}<span>${cy?'Ciclo · día '+cycleDay():'Mes calendario'}</span>${ic('chevron-down')}</button><span class="period-range" title="${cy?cycleLabel(currentMonth):monthLong(currentMonth)}">${cy?shortPeriodLabel(currentMonth):monthLong(currentMonth)}</span>${el.closest('#tab-dashboard')?'<button type="button" class="info-tip" aria-label="Ayuda del período" data-tip="El ciclo reúne compras de dos meses en un solo presupuesto. Cada movimiento conserva su fecha; el análisis mensual sigue por calendario.">'+ic('info')+'</button>':''}`;
 });
 const help=$('#tab-budget .toolbar>.info-tip');if(help)help.dataset.tip='Elige mes o ciclo con el calendario. Copiar trae el plan anterior; Usar como base lo aplica a períodos futuros sin plan propio. Tus movimientos conservan su fecha.';
 planningHeader();
}
let periodDraft=null;
function renderPeriodEditor(){
 const d=periodDraft;
 $('#periodBody').innerHTML=`<div class="seg period-mode" role="group" aria-label="Tipo de período"><button type="button" data-period-mode="calendar" aria-pressed="${!d.enabled}" class="${d.enabled?'':'active'}">Mes calendario</button><button type="button" data-period-mode="cycle" aria-pressed="${d.enabled}" class="${d.enabled?'active':''}">Ciclo de sueldo</button></div>${d.enabled?'<div class="period-day-head"><b>Empieza el día</b><span>Elegido: '+d.day+'</span></div><div class="period-day-grid" role="group" aria-label="Día de inicio del ciclo">'+Array.from({length:31},(_,i)=>'<button type="button" data-period-day="'+(i+1)+'" aria-pressed="'+(d.day===i+1)+'" class="'+(d.day===i+1?'selected':'')+'">'+(i+1)+'</button>').join('')+'</div><p class="small muted">Los días 29–31 se ajustan al último día cuando el mes es más corto.</p>':'<p class="small muted">Presupuesto del primer al último día de cada mes.</p>'}<p class="period-data-note">Las compras y los presupuestos guardados conservan sus datos.</p>`;
}
function openPeriodEditor(){periodDraft={enabled:cycleEnabled(),day:cycleDay()};renderPeriodEditor();$('#periodDialog').showModal();}
document.addEventListener('click',e=>{if(e.target.closest('[data-period-open]'))openPeriodEditor();});
document.addEventListener('click',e=>{
 if(!periodDraft||!e.target.closest('#periodDialog'))return;
 const mode=e.target.closest('[data-period-mode]'),day=e.target.closest('[data-period-day]');
 if(mode){periodDraft.enabled=mode.dataset.periodMode==='cycle';renderPeriodEditor();$('#periodDialog [data-period-mode="'+mode.dataset.periodMode+'"]').focus();}
 if(day){periodDraft.day=Number(day.dataset.periodDay);renderPeriodEditor();$('#periodDialog [data-period-day="'+periodDraft.day+'"]').focus();}
 if(e.target.closest('#periodApply')){const draft=periodDraft;$('#periodDialog').close();setPlanningMode(draft.enabled,draft.day);document.querySelector('.tab.active [data-period-open]')?.focus({preventScroll:true});}
});
function setPlanningMode(enabled,day=cycleDay()){
 const wasEnabled=cycleEnabled(),previousDay=cycleDay(),was=cycleView();if(was)cycleSelectedMonths[activeProfile]=currentMonth;else cycleCalendarMonths[activeProfile]=currentMonth;
 state.settings.budgetCycle={...cycleConfig(),enabled,day};
 if(wasEnabled!==enabled||day!==previousDay)state.settings.lastClose=enabled?cycleBudgetKey(cycleMonthForDate()):thisMonth();
 currentMonth=enabled?cycleMonthForDate():cycleCalendarMonths[activeProfile]||thisMonth();
 cycleSelectedMonths[activeProfile]=enabled?currentMonth:cycleSelectedMonths[activeProfile];monthInput.value=currentMonth;
 save();renderAll();toast(enabled?'Ciclo activo: '+cycleLabel(currentMonth):'Vista por mes calendario');
}
let planningToday=todayISO();
function refreshPlanningDate(){
 const today=todayISO();if(document.querySelector('dialog[open]')||localRecovery||localTabChanged)return;
 if(today!==planningToday){
  const previous=cycleView()?cycleMonthForDate(planningToday):planningToday.slice(0,7);
  planningToday=today;_txIdx=null;
  if(currentMonth===previous){currentMonth=cycleView()?cycleMonthForDate(today):thisMonth();monthInput.value=currentMonth;}
  renderAll();maybeMonthClose();
 }

}
window.addEventListener('focus',refreshPlanningDate);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPlanningDate();});
setInterval(refreshPlanningDate,60000);
document.addEventListener('click',e=>{const b=e.target.closest('[data-plan-mode]');if(b)setPlanningMode(b.dataset.planMode==='cycle');});
document.addEventListener('change',e=>{if(e.target.matches('[data-cycle-day]'))setPlanningMode(true,Number(e.target.value));});
function renderCycleInsight(m,inc,exp,budget){
 const box=$('#insight'),remaining=budget-exp;box.hidden=false;box.dataset.tone=remaining<-.005?'bad':'good';box.querySelector('.i-ic').innerHTML=ic(remaining<-.005?'triangle-alert':'calendar-days');
 $('#insightText').innerHTML=`${fmt(exp)} gastados${budget>0?` · <b>${fmt(Math.abs(remaining))}</b> ${remaining<0?'de exceso':'del presupuesto disponibles'}`:''}.`;
}
function renderCycleSaveCard(){
 const m=currentMonth,sv=cycleSavings(m),own=(state.settings.savePctM||{})[cycleBudgetKey(m)]!=null,mode=saveMode();
 $('#budSave').innerHTML=`<h3>${ic('piggy-bank')} Meta de ahorro del ciclo</h3><div class="sv-form"><label class="sv-l" for="svPct">Meta</label><div class="sv-c"><span class="sv-in"><input type="number" id="svPct" min="0" max="100" step="1" value="${sv.pct||''}" placeholder="20"><i>%</i></span></div><span class="sv-l">Aplica a</span><label class="check sv-c"><input type="checkbox" id="svAll"${own?'':' checked'}><span>Meta general${own?' · excepción en este ciclo':''}</span></label><span class="sv-l">Cuenta como ahorro</span><div class="seg sv-c"><button type="button" data-svmode="set" class="${mode==='set'?'active':''}">Lo que separo</button><button type="button" data-svmode="left" class="${mode==='left'?'active':''}">Lo que sobra</button></div></div><div class="sv-tip"><b>${fmt(sv.saved)}</b> ${sv.pct?'de '+fmt(sv.target):'ahorrados en el ciclo'}${sv.rate!=null?' · '+sv.rate.toFixed(1)+'%':''}</div>`;
}

const hexLum = hex => { const h = String(hex || '').replace('#',''); if (h.length !== 6) return .4;
  const [r,g,b] = [0,2,4].map(i => parseInt(h.substr(i,2),16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  return .2126 * r + .7152 * g + .0722 * b; };
const mixHex = (hex, to, t) => { const a = hex.replace('#',''), b = to.replace('#','');
  return '#' + [0,2,4].map(i => Math.round(parseInt(a.substr(i,2),16) * (1 - t) + parseInt(b.substr(i,2),16) * t).toString(16).padStart(2,'0')).join(''); };

// Fondo suave del marco: los colores claros (pastel, blanco) llevan más opacidad para que se noten
const soft = hex => { const c = dc(hex), L = hexLum(c); return isDarkUI() ? (L < .12 ? toneHex(c, .7, 0) + '33' : c + (L > .4 ? '2e' : '33')) : c + (L > .45 ? '66' : '26'); };
// Trazo del ícono vectorial: los colores claros se oscurecen para tener contraste
// Cambia la luminosidad conservando el tono (para que un pastel dé un trazo del mismo color, no gris)
function toneHex(hex, light, minSat){
  let [r,g,b] = [1,3,5].map(i => parseInt(hex.substr(i,2),16) / 255);
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn; let h = 0, sat = 0;
  if (d){ sat = d / (1 - Math.abs(mx + mn - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  if (d) sat = Math.max(sat, minSat);
  const c = (1 - Math.abs(2 * light - 1)) * sat, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = light - c / 2;
  const [r1,g1,b1] = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return '#' + [r1,g1,b1].map(v => Math.round((v + m) * 255).toString(16).padStart(2,'0')).join('');
}
const strokeOn = hex => { if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 'currentColor';
  const L = hexLum(hex), dark = isDarkUI();
  if (!dark && L > .4) return toneHex(hex, .36, .45);   // pastel / claro → mismo tono, oscuro
  if (dark && L < .12) return toneHex(hex, .78, 0);      // negro / grafito / grises oscuros → claro en modo oscuro
  return hex; };
const isV = ic => typeof ic === 'string' && ic.startsWith('svg:');
const svgIcon = (name, stroke) => VICONS[name = VICONS[name] ? name : 'circle-help'] ? `<svg class="vi" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${VICONS[name]}</svg>` : '❔';
// Ícono de categoría/meta: emoji o vectorial. solidBg = color de fondo sólido (logo) para elegir trazo blanco u oscuro
function iconHTML(icon, color, solidBg){
  if (!icon) icon = 'svg:circle-help';
  if (!isV(icon)) return esc(icon);
  const stroke = solidBg ? (hexLum(solidBg) > .45 ? '#1b2232' : '#ffffff') : strokeOn(color);
  return svgIcon(icon.slice(4), stroke);
}
const iconText = c => isV(c.icon) ? c.name : c.icon + ' ' + c.name; // para <option> y leyendas de gráficos
// Íconos de la interfaz (pestañas, tarjetas): emoji o vectorial según Ajustes
const UI_MAP = {'👥':'users','🔤':'type','📊':'chart-pie','🧾':'receipt','🎯':'target','🔁':'repeat','🐷':'piggy-bank','📈':'chart-line','🏷️':'tags','⚙️':'settings','⬇️':'arrow-down','⬆️':'arrow-up','⚖️':'scale','🔮':'telescope','💸':'trending-down','💰':'wallet','💾':'save','☁️':'cloud','💳':'credit-card','🧹':'triangle-alert','🎨':'palette','📥':'download','❓':'circle-help','🗑️':'trash-2'};
const ic = n => svgIcon(n, 'currentColor');
const pctTxt = p => p > 999 ? '+999%' : Math.round(p) + '%';
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
// Estado vacío: ícono en el color del tema + texto + acción opcional. row=true para cuadros pequeños
function emptyBox(icon, text, act, label, row, cls){
  const b = act ? `<button class="btn sm" data-empty="${act}">${ic(act === 'budget' ? 'target' : 'plus')} ${label}</button>` : '';
  return row ? `<div class="es-row ${cls || ''}"><div class="empty-ic">${ic(icon)}</div><div class="es-t">${text}</div>${b}</div>`
             : `<div class="empty es ${cls || ''}"><div class="empty-ic">${ic(icon)}</div><div class="es-t">${text}</div>${b}</div>`;
}
const helpPanel = document.createElement('div');
helpPanel.className = 'help-panel';
helpPanel.setAttribute('aria-hidden', 'true');
helpPanel.hidden = true;
document.body.append(helpPanel);
let helpAnchor = null, helpPinned = false, helpTimer = 0, helpDescriptionId = 0;
function describeHelp(){
  for (const button of document.querySelectorAll('.info-tip[data-tip]')){
    let description = document.getElementById(button.getAttribute('aria-describedby'));
    if (!description){
      description = document.createElement('span');
      description.id = 'help-description-' + ++helpDescriptionId;
      description.hidden = true;
      button.after(description);
      button.setAttribute('aria-describedby', description.id);
    }
    description.textContent = button.dataset.tip;
  }
  if (helpAnchor) positionHelp();
}
function closeHelp(){
  clearTimeout(helpTimer);
  helpAnchor?.classList.remove('show');
  helpAnchor = null;
  helpPinned = false;
  helpPanel.hidden = true;
}
function positionHelp(){
  const anchor = helpAnchor.getBoundingClientRect(), viewport = window.visualViewport;
  const left = (viewport?.offsetLeft || 0) + 8, top = (viewport?.offsetTop || 0) + 8;
  const right = left + (viewport?.width || document.documentElement.clientWidth) - 16;
  const bottom = top + (viewport?.height || innerHeight) - 16;
  if (!anchor.width || anchor.bottom < top || anchor.top > bottom){ closeHelp(); return; }
  helpPanel.style.maxWidth = Math.min(324, Math.max(0, right - left)) + 'px';
  helpPanel.style.maxHeight = Math.max(0, bottom - top) + 'px';
  const {width, height} = helpPanel.getBoundingClientRect();
  const below = anchor.bottom + 8, above = anchor.top - height - 8;
  helpPanel.style.left = Math.max(left, Math.min(anchor.left, right - width)) + 'px';
  helpPanel.style.top = Math.max(top, Math.min(below + height <= bottom ? below : above >= top ? above : below, bottom - height)) + 'px';
}
function showHelp(button, pinned = false){
  clearTimeout(helpTimer);
  if (helpAnchor !== button) closeHelp();
  helpAnchor = button;
  helpPinned = pinned;
  helpPanel.textContent = button.dataset.tip;
  helpPanel.hidden = false;
  button.classList.add('show');
  positionHelp();
}
document.addEventListener('click', e => {
  const tip = e.target.closest('.info-tip');
  if (tip){
    if (helpAnchor === tip && helpPinned) closeHelp();
    else showHelp(tip, true);
    return;
  }
  if (!helpPanel.contains(e.target)) closeHelp();
  const go = e.target.closest('[data-gotab]'); if (go){ e.preventDefault(); showTab(go.dataset.gotab); return; }
  const b = e.target.closest('[data-empty]'); if (!b) return;
  const a = b.dataset.empty;
  if (a === 'expense' || a === 'income') openTx(null, {type:a});
  else if (a === 'tx') openTx();
  else if (a === 'calendar-tx') openTx(null, {date:calSel});
  else if (a === 'budget') showTab('budget');
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || e.defaultPrevented || !helpAnchor) return;
  e.preventDefault();
  closeHelp();
});
document.addEventListener('focusin', e => {
  const tip = e.target.closest('.info-tip');
  if (tip?.matches(':focus-visible')) showHelp(tip);
  else if (helpAnchor && !helpAnchor.contains(e.target)) closeHelp();
});
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const tip = e.target.closest('.info-tip');
  if (tip && !tip.contains(e.relatedTarget) && !helpPinned) showHelp(tip);
  if (helpPanel.contains(e.target)) clearTimeout(helpTimer);
});
document.addEventListener('pointerout', e => {
  if (e.pointerType !== 'mouse' || !helpAnchor || helpPinned || helpAnchor.matches(':focus-visible')) return;
  if (helpAnchor.contains(e.target) || helpPanel.contains(e.target)){
    clearTimeout(helpTimer);
    helpTimer = setTimeout(closeHelp, 120);
  }
});
function updateHelpPosition(){ if (helpAnchor) positionHelp(); }
document.addEventListener('scroll', updateHelpPosition, {capture:true, passive:true});
window.addEventListener('resize', updateHelpPosition);
window.visualViewport?.addEventListener('resize', updateHelpPosition);
const uiIc = e => ic(UI_MAP[e] || 'circle-help');
function applyUiIcons(){ document.querySelectorAll('.ui-ic').forEach(el => el.innerHTML = uiIc(el.dataset.e)); if (typeof moveTabInd === 'function') moveTabInd(); }
// Lectura de variables CSS con caché: se invalida si cambia el estilo/tema o al terminar la tarea actual
let _cv = null, _cvKey = '';
const cssVar = n => { const de = document.documentElement, k = [...de.attributes].map(x => x.name + '=' + x.value).join('|') + '|' + document.body.className;
  if (!_cv || k !== _cvKey){ _cv = new Map(); _cvKey = k; _cv.cs = getComputedStyle(de); qMicro(() => { _cv = null; }); }
  let v = _cv.get(n); if (v === undefined){ v = _cv.cs.getPropertyValue(n).trim(); _cv.set(n, v); } return v; };
// El teclado responde de inmediato; el puntero conserva las transiciones del componente.
document.addEventListener('keydown',event=>{
 if(['Shift','Control','Alt','Meta'].includes(event.key))return;
 document.documentElement.dataset.motionInput='keyboard';
},true);
document.addEventListener('pointerdown',()=>{
 const root=document.documentElement;
 if(root.dataset.motionInput !== 'keyboard')return;
 delete root.dataset.motionInput;
 // Al recuperar el puntero, las entradas ya vistas permanecen en su estado final.
 for(const animation of document.getAnimations()){
  if(animation instanceof CSSAnimation && animation.effect.getTiming().iterations !== Infinity)animation.finish();
 }
},true);
const reduceMotion = () => document.documentElement.dataset.motionInput === 'keyboard' || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// El cierre visual de Safari no retiene controles accesibles ni retrasa el cierre nativo.
if(!CSS.supports('overlay','auto')){
 document.addEventListener('close',e=>{if(e.target instanceof HTMLDialogElement&&!e.target.open)e.target.inert=true;},true);
 document.addEventListener('beforetoggle',e=>{
  const d=e.target;if(!(d instanceof HTMLDialogElement))return;
  if(e.newState==='open'){d._exit?.cancel();d._exit=null;d.inert=false;return;}
  const style=getComputedStyle(d),from={opacity:style.opacity,transform:style.transform,visibility:'visible'};
  qMicro(()=>{
   if(d.open||reduceMotion())return;
   d._exit?.cancel();d.getAnimations().filter(a=>a instanceof CSSTransition).forEach(a=>a.cancel());
   const end=getComputedStyle(d),to={opacity:end.opacity,transform:end.transform,visibility:'visible'};
   const animation=d.animate([from,to],{duration:MOTION.panel,easing:MOTION.ease});d._exit=animation;
   animation.onfinish=()=>{if(d._exit===animation)d._exit=null;};
  });
 },true);
}
// Ritmos compartidos por interacción; los estados financieros no alteran el movimiento.
const MOTION={fast:180,move:280,popup:200,tab:250,panel:320,data:420,trace:650,signal:800,dataEasing:'easeOutQuart',ease:'cubic-bezier(.22,1,.36,1)',enter:'cubic-bezier(.22,1,.36,1)'};
const motionDataEase=x=>1-Math.pow(1-x,4);
// Recorrer un trazado requiere tiempo para seguir su trayectoria, sin frenar los controles.
const motionTraceEase=x=>.5-.5*Math.cos(Math.PI*x);
function motionAnimate(el,frames,kind='move'){
 if(!el)return;
 if(el._motion){el._motion.cancel();el._motion=null;}
 if(reduceMotion())return;
 const animation=el.animate(frames,{duration:MOTION[kind],easing:MOTION.ease});el._motion=animation;
 animation.onfinish=()=>{if(el._motion===animation)el._motion=null;};return animation;
}
function motionResize(el,update){
 const from=el.getBoundingClientRect().height;el._resize?.cancel();el._resize=null;el.style.overflow='';update();const to=el.getBoundingClientRect().height;
 if(reduceMotion()||Math.abs(from-to)<1)return;
 el.style.overflow='hidden';const animation=el.animate([{height:from+'px'},{height:to+'px'}],{duration:MOTION.panel,easing:MOTION.ease});el._resize=animation;
 animation.onfinish=()=>{el.style.overflow='';el._resize=null;};
}
function toggleDisclosure(details,summary,wanted,animate=true){
 const current=details._disclosure,open=wanted??(current?!current.open:!details.open),from=details.getBoundingClientRect().height;
 const content=details.querySelector(':scope>.metric-expanded,:scope>.disclosure-body,:scope>.analysis-detail-body,:scope>.settings-disclosure-body,:scope>.goal-split,:scope.expense-distribution-more>div');
 const previousOpacity=current&&content?getComputedStyle(content).opacity:null;
 const previousTransform=current&&content?getComputedStyle(content).transform:null;
 if(current){current.animation.cancel();current.contentAnimation?.cancel();}
 details.style.overflow='hidden';details.open=true;
 const style=getComputedStyle(details);
 const to=open?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+parseFloat(style.borderTopWidth||0)+parseFloat(style.borderBottomWidth||0)+parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0);
 const finish=()=>{details.open=open;details.style.overflow='';details._disclosure=null;};
 if(!animate||reduceMotion()||Math.abs(from-to)<1){finish();return;}
 const distribution=details.matches('.expense-distribution-more'),duration=distribution?360:MOTION.panel;
 const frames=distribution?[{opacity:previousOpacity??(open?0:1)},{opacity:open?1:0}]:[{opacity:previousOpacity??(open?0:1),transform:previousTransform??(open?'translateY(-5px)':'none')},{opacity:open?1:0,transform:'none'}];
 const contentAnimation=content?.animate(frames,{duration:distribution?duration:open?MOTION.panel:MOTION.fast,easing:MOTION.ease});
 const animation=details.animate([{height:from+'px'},{height:to+'px'}],{duration,easing:MOTION.ease});
 details._disclosure={animation,contentAnimation,open};animation.onfinish=finish;
}
document.addEventListener('click',e=>{
 const summary=e.target.closest('summary');if(!summary)return;
 const details=summary.parentElement;
 if(details.tagName!=='DETAILS'||details.matches('.settings-disclosure,.analysis-month-picker,.rec-actions'))return;
 e.preventDefault();toggleDisclosure(details,summary);
});

// Números que cuentan hasta su valor
const numMemo = {};
function fitMetricValue(el,texts=el?._fitTexts||[el?.textContent||'']){
 if(!el?.matches('.kpi .value'))return;
 el.style.removeProperty('font-size');
 const available=el.clientWidth;if(!available)return;
 const style=getComputedStyle(el),size=parseFloat(style.fontSize),canvas=fitMetricValue.canvas||(fitMetricValue.canvas=document.createElement('canvas')),ctx=canvas.getContext('2d');
 ctx.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
 const spacing=parseFloat(style.letterSpacing)||0,width=Math.max(...texts.map(text=>ctx.measureText(text).width+Math.max(0,text.length-1)*spacing));
 if(width>available)el.style.fontSize=Math.max(12,size*(available-2)/width)+'px';
}
function updateTextScale(){
 const root=document.documentElement, large=parseFloat(getComputedStyle(root).fontSize)>20;
 if(root.hasAttribute('data-large-text')===large)return;
 root.toggleAttribute('data-large-text',large);
 requestAnimationFrame(()=>{fitMetricValues();moveTabInd();});
}
updateTextScale();
window.addEventListener('resize',updateTextScale);
new MutationObserver(updateTextScale).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
function fitMetricValues(){document.querySelectorAll('.tab.active .kpi .value').forEach(el=>fitMetricValue(el));}
window.addEventListener('resize',()=>requestAnimationFrame(fitMetricValues));
if(document.fonts){document.fonts.ready.then(fitMetricValues);document.fonts.addEventListener('loadingdone',fitMetricValues);}
function countUp(el, to, kind = 'money', cls){
  if (!el) return; const key = el.id || el.dataset.k, entering = !(key in numMemo), from = entering ? 0 : (el._countValue ?? numMemo[key]); numMemo[key] = to; if (entering) el._countFresh = true;
  const f = v => kind === 'pct' ? v.toFixed(1) + '%' : fmt(v);
  if (cls !== undefined) el.className = cls;
  if(el._raf && el._countTarget===to && key in numMemo && from!==0)return;
  const target = f(to);
  if (!entering && !el._raf && el._countTarget === to && el.textContent === target) return;
  cancelAnimationFrame(el._raf);
  el._raf=0;el._countTarget=to;
  if (reduceMotion() || entering || from === to){ el._countValue=to;rollDigits(el,target,0);el._fitTexts=[target];fitMetricValue(el); return; }
  el._fitTexts=[f(from),target];fitMetricValue(el);
  // Solo los cambios de valor recorren sus dígitos, con el ritmo de los datos.
  const t0 = performance.now(), dur = MOTION.data;
  // Curva con velocidad y aceleración nulas en ambos extremos: evita el arranque brusco y el salto final.
  const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
  // Cada dígito gira en su columna hasta el valor final; una entrada nueva parte de la cifra anterior sin transición.
  if (!el._rollKeys || el._countFresh) rollDigits(el, f(from), 0);
  el._countFresh = false; void el.offsetWidth; rollDigits(el, target, dur);
  const step = now => { if(!el.isConnected){el._raf=0;return;}if(reduceMotion()){el._countValue=to;el._raf=0;rollDigits(el,target,0);return;}const k = Math.min(1, (now - t0) / dur); el._countValue=from + (to - from) * ease(k); if (k < 1) el._raf = requestAnimationFrame(step);else {el._raf=0;el._fitTexts=[target];fitMetricValue(el);} };
  el._raf = requestAnimationFrame(step);
}
// Cifras con columnas de dígitos (estilo odómetro). El texto del elemento es siempre la cifra final:
// lectores de pantalla, pruebas y ajuste de tamaño leen el valor real; las columnas son decoración CSS.
function rollKeys(text){
  const first = text.search(/\d/), last = text.length - 1 - [...text].reverse().join('').search(/\d/);
  if (first < 0) return [...text].map((ch, i) => ['p' + i, ch]);
  const core = text.slice(first, last + 1), dot = core.indexOf('.'), int = dot < 0 ? core : core.slice(0, dot), out = [];
  [...text.slice(0, first)].forEach((ch, i) => out.push(['p' + i, ch]));
  [...int].forEach((ch, i) => out.push(['i' + (int.length - 1 - i), ch]));
  if (dot >= 0){ out.push(['dot', '.']); [...core.slice(dot + 1)].forEach((ch, i) => out.push(['f' + i, ch])); }
  [...text.slice(last + 1)].forEach((ch, i) => out.push(['s' + i, ch]));
  return out;
}
function rollDigits(el, text, dur){
  const keys = rollKeys(text), old = el._rollKeys && el.firstElementChild?.classList.contains('nf-c') && el.textContent === el._rollText ? el._rollMap : null, map = new Map(), frag = [];
  el.style.setProperty('--nf-dur', (dur || 0) + 'ms');
  for (const [key, ch] of keys){
    const digit = /\d/.test(ch); let span = old?.get(key);
    if (!span || span._digit !== digit || (!digit && span.textContent !== ch)){
      const fresh = !span; span = document.createElement('span'); span.className = digit ? 'nf-c nf-d' : 'nf-c'; span._digit = digit;
      if (digit) span.style.setProperty('--n', '0');
      if (fresh && old && dur) span.classList.add('nf-in');
    }
    if (digit){ const g = document.createElement('span'); g.className = 'nf-g'; g.textContent = ch; span.replaceChildren(g); } else span.textContent = ch;
    span._target = digit ? ch : null;
    map.set(key, span); frag.push(span);
  }
  el.replaceChildren(...frag);
  // Las columnas nuevas se pintan en 0 antes de girar hacia su dígito.
  if (dur) void el.offsetWidth;
  for (const span of frag) if (span._digit) span.style.setProperty('--n', span._target);
  el._rollKeys = keys; el._rollMap = map; el._rollText = el.textContent;
}
// Barras que crecen: desde cero al entrar a la pestaña o cambiar de mes; desde su valor anterior en el resto de cambios
let barMemo = {};
function animateBars(root){
  if (!root) return;
  const spans = [...root.querySelectorAll('.bar>span[data-w]')], fresh = [];
  spans.forEach(sp => { const k = sp.dataset.k, to = sp.dataset.w; const from = barMemo[k]; if (from === undefined) fresh.push(sp);
    sp.style.transition = 'none'; sp.style.width = (from ?? 0) + '%'; barMemo[k] = to; });
  if (!spans.length) return;
  void root.offsetWidth;
  // Primera aparición escalonada (máx. 6 pasos) con leve rebote; los cambios de valor no se escalonan.
  const step = innerWidth <= 700 ? 60 : 120, calm = reduceMotion(); let i = 0;
  spans.forEach(sp => { const enter = fresh.includes(sp) && !calm; sp.style.transition = ''; sp.style.transitionDelay = enter ? Math.min(i++, 6) * step + 'ms' : '0ms'; sp.style.transitionTimingFunction = enter ? MOTION.enter : ''; sp.style.width = sp.dataset.w + '%'; });
}
const resetBars = sec => Object.keys(barMemo).forEach(k => { if (!sec || k.startsWith(sec + ':')) delete barMemo[k]; });
// Desvanece una fila antes de quitarla
const fadeOut = el => {
 if(!el||reduceMotion())return Promise.resolve();
 if(el._leaving)return el._leaving;
 const style=getComputedStyle(el),from={opacity:1,transform:'none'},to={opacity:0,transform:'translateY(-3px)'};
 // Las filas de tabla conservan su geometría nativa; las demás cierran también el espacio ocupado.
 if(el.tagName!=='TR'){
  Object.assign(from,{height:el.getBoundingClientRect().height+'px',minHeight:style.minHeight,paddingTop:style.paddingTop,paddingBottom:style.paddingBottom,marginTop:style.marginTop,marginBottom:style.marginBottom,borderTopWidth:style.borderTopWidth,borderBottomWidth:style.borderBottomWidth});
  Object.assign(to,{height:'0px',minHeight:'0px',paddingTop:'0px',paddingBottom:'0px',marginTop:'0px',marginBottom:'0px',borderTopWidth:'0px',borderBottomWidth:'0px'});
 }
 el.classList.add('leaving');el.style.overflow='hidden';
 const animation=el.animate([from,to],{duration:MOTION.panel,easing:MOTION.ease,fill:'forwards'});
 el._leaving=animation.finished.catch(()=>{});return el._leaving;
};

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B06}\u{2B07}\u{FE0F}\u{200D}]/gu;
function toast(msg, opt = {}){
  const t = $('#toast'), failed=localSaveFailed&&!/^⚠|no se pudo|no válid|inválid|^ingresa|^elige|^ponle|^primero|^la url|vacía|cancelada/i.test(String(msg)), raw = failed?'No se pudo guardar en este dispositivo. Mantén la app abierta y vuelve a intentar.':String(msg)+(/^Movimiento (registrado|actualizado)/.test(String(msg))?(syncOn()?(sync.pending?' · Guardado aquí; pendiente de Sheets.':' · Confirmado en Sheets.'):' · Guardado en este dispositivo.'):'') , err = /^⚠|no se pudo|no válid|inválid|^ingresa|^elige|^ponle|^primero|^la url|vacía|cancelada/i.test(raw);
  const text = raw.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
  if(failed)opt={};
  const dur = opt.action ? 5000 : Math.min(5000, 2200 + text.length * 25);
  t.querySelector('.t-msg').textContent = text;
  t.querySelector('.t-ic').innerHTML = ic(err ? 'circle-alert' : opt.icon || 'circle-check');
  const act = t.querySelector('.t-act'); act.hidden = !opt.action; act.inert = !opt.action; act.textContent = opt.action || '';
  const dismiss = () => { t.classList.remove('show', 'has-action'); act.inert = true; };
  act.onclick = opt.action ? () => { clearTimeout(t._h); dismiss(); opt.onAction?.(); } : null;
  t.classList.toggle('err', err); t.classList.toggle('neutral', !err && !!opt.icon); t.classList.toggle('has-action', !!opt.action); t.style.setProperty('--t-dur', dur + 'ms');
  // Reinicia el progreso si llegan varios seguidos, conservando la posición del aviso.
  const progress=t.querySelector('.t-bar');progress.style.animation='none';void progress.offsetWidth;progress.style.animation='';t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(dismiss, dur);
}

/* ---------- Confirmación con el estilo de la app ---------- */
// Devuelve true (Aceptar), false (Cancelar) o null (cerrado con Esc)
const cfDialog = $('#confirmDialog'); let cfResolve = null;
function ask({title, msg = '', ok = 'Eliminar', cancel = 'Cancelar', danger = true, icon, iconColor}){
  if (cfResolve){ const r = cfResolve; cfResolve = null; r(null); }
  $('#cfTitle').textContent = title; $('#cfMsg').textContent = msg;
  const ci = icon || (danger ? '🗑️' : '❓');
  $('#cfIco').innerHTML = UI_MAP[ci] ? ic(UI_MAP[ci]) : iconHTML(ci, iconColor);
  $('#cfIco').style.background = iconColor && !UI_MAP[ci] ? soft(iconColor) : danger ? 'var(--expense-soft)' : 'var(--primary-soft)';
  $('#cfIco').style.color = danger ? 'var(--expense)' : 'var(--primary)';
  const y = $('#cfYes'); y.textContent = ok; y.className = 'btn ' + (danger ? 'danger-solid' : 'primary');
  $('#cfNo').textContent = cancel;
  cfDialog.showModal(); (danger ? $('#cfNo') : y).focus();
  return new Promise(r => cfResolve = r);
}
function cfDone(v){ if (cfResolve){ const r = cfResolve; cfResolve = null; r(v); } if (cfDialog.open) cfDialog.close(); }
$('#cfYes').onclick = () => cfDone(true);
$('#cfNo').onclick = () => cfDone(false);
cfDialog.addEventListener('close', () => cfDone(null));

/* ---------- Tabs y mes ---------- */
function showTab(name, scrollTop = 0){
  closeHelp();
  syncPlanningNavigation(name);
  if (typeof selMode !== 'undefined' && selMode) setSelMode(false);
  // Desde «Ambos» cualquier pestaña normal vuelve al usuario activo (Ajustes se puede abrir en ambos modos)
  if (bothMode && name !== 'both' && name !== 'settings'){ bothMode = false; document.body.classList.remove('both-on'); renderProfileUI(); dirty = new Set(Object.keys(VIEWS)); }
  const b = $(`#tabs button[data-tab="${name}"]`), prevTab = activeTab();
  for (const button of document.querySelectorAll('#tabs button[data-tab]')) {
    button.classList.toggle('active', button === b);
    if (button === b) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  $('#btnSettings').classList.toggle('active', name === 'settings');
  document.querySelectorAll('.tab').forEach(s => { s.classList.toggle('active', s.id === 'tab-' + name); s.classList.remove('m-next', 'm-prev', 'from-r', 'from-l'); });
  const SEC = {dashboard:'dash', budget:'bud', goals:'goal'}[name];
  if (SEC) resetBars(SEC);
  // Al volver a Resumen, cada indicador conserva el último valor dibujado.
  if (name === 'dashboard') dirty.add(name); // se redibuja para que los gráficos tomen su tamaño
  if (name === 'analysis' && currentMonth !== analysisSelectedMonth) dirty.add(name);
  const resumeAnalysis = name === 'analysis' && !dirty.has(name) && prevTab !== name;
  planningHeader();
  renderView(name);
  moveTabInd();
  if (b && !floatingTabs.matches && tabBar.scrollWidth > tabBar.clientWidth) {
    const left = b.offsetLeft - (tabBar.clientWidth - b.offsetWidth) / 2;
    tabBar.scrollTo({left:Math.max(0, left), behavior:reduceMotion() ? 'instant' : 'smooth'});
  }
  if (resumeAnalysis && chYear){ chYear.resize(); chYear.update('none'); }
  if (name === 'budget') animateBars($('#tab-budget'));
  if (name === 'goals'){ animateBars($('#goalsGrid')); refreshOther(); }
  if (name === 'movs') moveViewInd();
  updateCreationControls();
  if(window.scrollY !== scrollTop)window.scrollTo({top:scrollTop, behavior:'instant'});
  // La pestaña entra desde el lado hacia el que te mueves, con su contenido ya dibujado.
  const ord = Object.keys(VIEWS), d = ord.indexOf(name) - ord.indexOf(prevTab);
  if(d&&!reduceMotion())$('#tab-'+name)?.classList.add(d>0?'from-r':'from-l');
}
// Entrada escalonada: las tarjetas visibles aparecen una tras otra
// Barra de pestañas: cada sección recuerda su desplazamiento; tocar la pestaña activa vuelve arriba.
const tabScroll = {};
const tabBar = $('#tabs');
const floatingTabs = matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
let tabPress = null;

function endTabPress(event){
  if (!tabPress || (event && event.pointerId !== tabPress.id)) return;
  tabPress.button.classList.remove('is-pressed');
  tabPress = null;
}

tabBar.addEventListener('pointerdown', event => {
  const button = event.target.closest('button[data-tab]');
  if (!floatingTabs.matches || !button || !event.isPrimary || event.button !== 0) return;
  endTabPress();
  tabPress = {button, id:event.pointerId, x:event.clientX, y:event.clientY};
  button.classList.add('is-pressed');
});
document.addEventListener('pointermove', event => {
  if (tabPress?.id === event.pointerId && Math.hypot(event.clientX - tabPress.x, event.clientY - tabPress.y) > 10) {
    endTabPress(event);
  }
}, {passive:true});
document.addEventListener('pointerup', endTabPress, true);
document.addEventListener('pointercancel', endTabPress, true);
window.addEventListener('blur', () => endTabPress());
floatingTabs.addEventListener('change', () => endTabPress());

tabBar.addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]'); if (!b) return;
  const from = activeTab(), to = b.dataset.tab;
  if (from === to && !bothMode){ window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'}); return; }
  tabScroll[from] = window.scrollY;
  showTab(to, tabScroll[to] || 0);
});
// Cifras recalculadas en su sitio: el texto final se escribe de inmediato y solo cambia su aparición.
function tickChanges(root, selector, render){
  const key = (el, i) => (el.closest('table')?.id || '') + ':' + i;
  const before = new Map(); if (root) root.querySelectorAll(selector).forEach((el, i) => before.set(key(el, i), el.textContent));
  render();
  if (!root || reduceMotion()) return;
  root.querySelectorAll(selector).forEach((el, i) => { const b = before.get(key(el, i)); if (b !== undefined && b !== el.textContent){ el.classList.remove('value-tick'); void el.offsetWidth; el.classList.add('value-tick'); el.addEventListener('animationend', () => el.classList.remove('value-tick'), {once:true}); } });
}
// Hojas inferiores en teléfono: arrastrar el asa o la cabecera hacia abajo equivale a Esc (respeta diálogos que impiden cancelar).
(() => {
  const phone = matchMedia('(max-width:700px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
  let drag = null;
  function stopSheet(dialog, keepPosition = false){
    const motion = dialog._sheetMotion;
    if (motion) cancelAnimationFrame(motion.raf);
    delete dialog._sheetMotion;
    dialog.classList.remove('sheet-dragging','sheet-settling');
    if (!keepPosition) dialog.style.removeProperty('transform');
    return motion;
  }
  function springSheet(dialog, position, velocity, dismiss){
    stopSheet(dialog, true);
    if (!dialog.open) return stopSheet(dialog);
    if (reduceMotion()){
      stopSheet(dialog);
      if (dismiss) dialog.close();
      return;
    }
    const target = dismiss ? dialog.offsetHeight + 24 : 0;
    const damping = dismiss && velocity > 500 ? .8 : 1;
    const omega = 2 * Math.PI / .3;
    const motion = {position, velocity, target, raf:0, last:performance.now(), started:performance.now()};
    dialog._sheetMotion = motion;
    dialog.classList.add('sheet-settling');
    function frame(now){
      if (dialog._sheetMotion !== motion) return;
      if (!dialog.open){ stopSheet(dialog); return; }
      if (reduceMotion()){ stopSheet(dialog); if (dismiss) dialog.close(); return; }
      const dt = Math.min(.032, Math.max(0,(now-motion.last)/1000));
      motion.last = now;
      const x = motion.position-target, v = motion.velocity;
      const decay = Math.exp(-damping*omega*dt);
      if (damping === 1){
        const step = (v+omega*x)*dt;
        motion.position = target+(x+step)*decay;
        motion.velocity = (v-omega*step)*decay;
      } else {
        const frequency = omega*Math.sqrt(1-damping*damping);
        const sine = Math.sin(frequency*dt), cosine = Math.cos(frequency*dt);
        motion.position = target+decay*(x*cosine+(v+damping*omega*x)/frequency*sine);
        motion.velocity = decay*(v*cosine-(damping*omega*v+omega*omega*x)/frequency*sine);
      }
      dialog.style.transform = 'translateY('+motion.position+'px)';
      if ((Math.abs(motion.position-target)<.5 && Math.abs(motion.velocity)<5) || now-motion.started>1500){
        if (dismiss){
          dialog.classList.add('sheet-dismissed');
          stopSheet(dialog);
          dialog.close();
        } else stopSheet(dialog);
        return;
      }
      motion.raf = requestAnimationFrame(frame);
    }
    motion.raf = requestAnimationFrame(frame);
  }
  function recordPosition(event, position){
    const now = event.timeStamp;
    drag.samples.push({time:now, position});
    while (drag.samples.length>2 && drag.samples[1].time<now-80) drag.samples.shift();
  }
  document.addEventListener('pointerdown', event => {
    if (!phone.matches || event.button>0 || drag || (event.isTrusted && !event.isPrimary)) return;
    const dialog = event.target.closest('dialog[open]');
    if (!dialog || event.target.closest('button,input,select,textarea,a,label,[contenteditable]')) return;
    const handle = event.target.closest('.dlg-head,.pp-h') || (event.target === dialog ? dialog : null);
    if (!handle) return;
    const transform = getComputedStyle(dialog).transform;
    const position = dialog._sheetMotion?.position ?? (transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42);
    stopSheet(dialog, true);
    dialog.classList.add('sheet-dragging');
    dialog.style.transform = 'translateY('+position+'px)';
    drag = {dialog, handle, id:event.pointerId, startY:event.clientY, startX:event.clientX, startPosition:position, position, moved:false, samples:[{time:event.timeStamp,position}]};
    if (event.isTrusted) handle.setPointerCapture(event.pointerId);
  });
  document.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = event.clientY-drag.startY;
    if (!drag.moved && (Math.abs(distance)<8 || Math.abs(distance)<Math.abs(event.clientX-drag.startX))) return;
    drag.moved = true;
    const height = drag.dialog.offsetHeight;
    let position = drag.startPosition+distance;
    if (position<0) position = position*height*.55/(height+.55*Math.abs(position));
    else if (position>height){
      const excess = position-height;
      position = height+excess*height*.55/(height+.55*excess);
    }
    drag.position = position;
    recordPosition(event, position);
    drag.dialog.style.transform = 'translateY('+position+'px)';
  });
  function releaseSheet(event){
    if (!drag || event.pointerId !== drag.id) return;
    const current = drag;
    const cancelled = event.type !== 'pointerup';
    if (!cancelled) recordPosition(event,current.position);
    drag = null;
    if (current.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
    const first = current.samples[0], last = current.samples.at(-1);
    const startTime = Math.max(first.time,last.time-80);
    const second = current.samples[1] || first;
    const fraction = second.time>first.time ? Math.min(1,(startTime-first.time)/(second.time-first.time)) : 0;
    const startPosition = first.position+(second.position-first.position)*fraction;
    const elapsed = Math.max(1,last.time-startTime);
    const velocity = cancelled ? 0 : (last.position-startPosition)*1000/elapsed;
    const projected = current.position+(velocity/1000)*.998/(1-.998);
    const wantsClose = !cancelled && current.moved && current.position>10 && projected>current.dialog.offsetHeight*.5;
    const dismiss = wantsClose && current.dialog.dispatchEvent(new Event('cancel',{cancelable:true}));
    springSheet(current.dialog,current.position,velocity,dismiss);
  }
  document.addEventListener('pointerup',releaseSheet);
  document.addEventListener('pointercancel',releaseSheet);
  document.addEventListener('lostpointercapture',releaseSheet);
  document.addEventListener('close',event=>{
    if (!(event.target instanceof HTMLDialogElement)) return;
    if (drag?.dialog === event.target) drag = null;
    stopSheet(event.target);
  },true);
  document.addEventListener('beforetoggle',event=>{
    if (!(event.target instanceof HTMLDialogElement) || event.newState !== 'open') return;
    stopSheet(event.target);
    event.target.classList.remove('sheet-dismissed');
  },true);
  window.addEventListener('resize',()=>{
    if (drag){
      const current = drag; drag = null;
      if (current.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
      stopSheet(current.dialog);
    }
    document.querySelectorAll('dialog.sheet-settling').forEach(dialog=>stopSheet(dialog));
  });
})();
$('#btnSettings').onclick = () => { showTab('settings'); openSettingsSection(null); };
const goTab = showTab;
// Barras discretas en el calendario y el formulario; el espacio no cambia al ocultarlas.
const scrollThumbTimers = new WeakMap();
document.addEventListener('scroll', e => {
  const el = e.target;
  if (!(el instanceof Element) || !el.matches('.cal-day-scroll,#txDialog .dlg-body')) return;
  el.classList.add('scroll-active');
  clearTimeout(scrollThumbTimers.get(el));
  scrollThumbTimers.set(el, setTimeout(() => {
    el.classList.remove('scroll-active');
    scrollThumbTimers.delete(el);
  }, 800));
}, {capture:true, passive:true});
// Cambia la geometría una vez y anima únicamente su transformación visual.
function moveIndicator(indicator, geometry){
 const before=indicator.getBoundingClientRect();
 indicator._motion?.cancel();indicator._motion=null;
 Object.assign(indicator.style,geometry);
 const after=indicator.getBoundingClientRect();
 if(reduceMotion()||!before.width||!before.height||!after.width||!after.height)return;
 const x=before.left-after.left,y=before.top-after.top,sx=before.width/after.width,sy=before.height/after.height;
 if(Math.abs(x)<.5&&Math.abs(y)<.5&&Math.abs(sx-1)<.001&&Math.abs(sy-1)<.001)return;
 const animation=indicator.animate([{transform:'translate('+x+'px,'+y+'px) scale('+sx+','+sy+')'},{transform:'none'}],{duration:MOTION.tab,easing:cssVar('--motion-tab-ease')||MOTION.ease});
 indicator._motion=animation;
 animation.onfinish=()=>{if(indicator._motion===animation)indicator._motion=null;};
}
function moveTabInd(){
  const b = $('#tabs button.active'), ind = $('#tabInd'); ind.style.opacity = b ? 1 : 0; if (!b) return;
  // En el teléfono, el indicador abarca toda la pestaña, incluso al pasar a dos filas.
  const mobile = b.querySelector('.tb-i').offsetWidth > 0;
  const geometry = {
    left: b.offsetLeft + 'px',
    width: b.offsetWidth + 'px',
    top: mobile ? b.offsetTop + 'px' : '',
    height: mobile ? b.offsetHeight + 'px' : ''
  };
  if (Object.entries(geometry).some(([key, value]) => ind.style[key] !== value)) {
    moveIndicator(ind, geometry);
  }
}
moveTabInd();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { moveTabInd(); requestAnimationFrame(() => $('#tabInd').classList.add('ready')); });
window.addEventListener('resize', moveTabInd);
new ResizeObserver(() => requestAnimationFrame(moveTabInd)).observe($('#tabs'));
// La línea y sombra del encabezado solo aparecen al hacer scroll
const topbar = $('.topbar');
const onScroll = () => {
  const y = window.scrollY;
  topbar.classList.toggle('scrolled', y > 4);
  toTop.classList.toggle('show', y > 400);
};
// Volver arriba (solo escritorio, por CSS): devuelve el foco a la pestaña activa porque el botón se oculta.
const toTop = $('#toTop');
toTop.onclick = () => { ($('#tabs button.active') || $('#btnSettings')).focus({preventScroll:true}); window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'}); };
window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize',onScroll); onScroll();
const monthInput = $('#month');
monthInput.value = currentMonth;
monthInput.addEventListener('change', () => { if (monthInput.value) { currentMonth = monthInput.value; renderAll(); } });
// Al cambiar de mes el contenido se desliza hacia el lado del mes elegido
function slideMonth(dir){ if (reduceMotion()) return; const t = document.querySelector('.tab.active'); if (!t) return; t.classList.remove('m-next', 'm-prev'); void t.offsetWidth; t.classList.add(dir > 0 ? 'm-next' : 'm-prev'); }
let chartMorph = false;
function goMonth(v, animate = true){ if (!v || v === currentMonth) return; const dir = v > currentMonth ? 1 : -1; currentMonth = v; monthInput.value = v; chartMorph = true; try { renderAll(); } finally { chartMorph = false; } if (animate) slideMonth(dir); }
$('#prevM').onclick = () => goMonth(shiftMonth(currentMonth, -1));
$('#nextM').onclick = () => goMonth(shiftMonth(currentMonth, 1));
