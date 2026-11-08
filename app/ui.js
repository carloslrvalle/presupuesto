// Presupuesto: ui.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
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
let planningToday=todayISO(),planningDateTask=null,dailyRecurringPending=false;
function refreshPlanningDate(){
 const today=todayISO();if(document.querySelector('dialog[open]')||localTabChanged)return;
 if(today!==planningToday){
  const previous=cycleView()?cycleMonthForDate(planningToday):planningToday.slice(0,7);
  planningToday=today;_txIdx=null;dailyRecurringPending=true;
  if(currentMonth===previous){currentMonth=cycleView()?cycleMonthForDate(today):thisMonth();monthInput.value=currentMonth;}
  renderAll();maybeMonthClose();
 }
 if(!dailyRecurringPending||bothMode||planningDateTask)return planningDateTask;
 const profile=activeProfile,connection=sync.url+'|'+sync.token;
 planningDateTask=(async()=>{
  const confirmed=!syncOn()||await startupSync();
  if(!confirmed||profile!==activeProfile||connection!==sync.url+'|'+sync.token||localTabChanged||syncConflict()||document.querySelector('dialog[open]'))return;
  dailyRecurringPending=false;if(runAutoRecurring())renderAll();
 })().catch(err=>{setBadge('err','No se pudo actualizar el día');updateSyncInfo(err.message);}).finally(()=>{planningDateTask=null;});
 return planningDateTask;
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
document.addEventListener('click', e => {
  const it = e.target.closest('.info-tip'); document.querySelectorAll('.info-tip.show').forEach(x => { if (x !== it) x.classList.remove('show'); }); if (it){ it.classList.toggle('show'); return; }
  const go = e.target.closest('[data-gotab]'); if (go){ e.preventDefault(); showTab(go.dataset.gotab); return; }
  const b = e.target.closest('[data-empty]'); if (!b) return;
  const a = b.dataset.empty;
  if (a === 'expense' || a === 'income') openTx(null, {type:a});
  else if (a === 'tx') openTx();
  else if (a === 'rec') openRec();
  else if (a === 'budget') showTab('budget');
});
const uiIc = e => ic(UI_MAP[e] || 'circle-help');
function applyUiIcons(){ document.querySelectorAll('.ui-ic').forEach(el => el.innerHTML = uiIc(el.dataset.e)); if (typeof moveTabInd === 'function') moveTabInd(); }
// Lectura de variables CSS con caché: se invalida si cambia el estilo/tema o al terminar la tarea actual
let _cv = null, _cvKey = '';
const cssVar = n => { const de = document.documentElement, k = [...de.attributes].map(x => x.name + '=' + x.value).join('|') + '|' + document.body.className;
  if (!_cv || k !== _cvKey){ _cv = new Map(); _cvKey = k; _cv.cs = getComputedStyle(de); qMicro(() => { _cv = null; }); }
  let v = _cv.get(n); if (v === undefined){ v = _cv.cs.getPropertyValue(n).trim(); _cv.set(n, v); } return v; };
const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
// Ritmos compartidos por interacción; los estados financieros no alteran el movimiento.
const MOTION={fast:160,move:240,panel:280,data:420,trace:1300,signal:800,dataEasing:'easeOutQuart',ease:'cubic-bezier(.2,.7,.2,1)'};
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
 if(current){current.animation.cancel();current.contentAnimation?.cancel();}
 details.style.overflow='hidden';details.open=true;
 const style=getComputedStyle(details);
 const to=open?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+parseFloat(style.borderTopWidth||0)+parseFloat(style.borderBottomWidth||0)+parseFloat(style.paddingTop||0)+parseFloat(style.paddingBottom||0);
 const finish=()=>{details.open=open;details.style.overflow='';details._disclosure=null;};
 if(!animate||reduceMotion()||Math.abs(from-to)<1){finish();return;}
 const distribution=details.matches('.expense-distribution-more'),duration=distribution?360:MOTION.panel;
 const frames=distribution?[{opacity:previousOpacity??(open?0:1)},{opacity:open?1:0}]:open?[{opacity:previousOpacity??0,transform:'translateY(-5px)'},{opacity:1,transform:'none'}]:[{opacity:previousOpacity??1},{opacity:0}];
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
function fitMetricValues(){document.querySelectorAll('.tab.active .kpi .value').forEach(el=>fitMetricValue(el));}
window.addEventListener('resize',()=>requestAnimationFrame(fitMetricValues));
if(document.fonts){document.fonts.ready.then(fitMetricValues);document.fonts.addEventListener('loadingdone',fitMetricValues);}
function countUp(el, to, kind = 'money', cls){
  if (!el) return; const key = el.id || el.dataset.k, entering = !(key in numMemo), from = entering ? 0 : (el._countValue ?? numMemo[key]); numMemo[key] = to; if (entering) el._countFresh = true;
  const f = v => kind === 'pct' ? v.toFixed(1) + '%' : fmt(v);
  if (cls !== undefined) el.className = cls;
  if(el._raf && el._countTarget===to && key in numMemo && from!==0)return;
  cancelAnimationFrame(el._raf);
  el._raf=0;el._countTarget=to;
  el._fitTexts=[f(from),f(to)];fitMetricValue(el);
  if (reduceMotion() || from === to){ el._countValue=to;rollDigits(el,f(to),0);el._fitTexts=[f(to)];fitMetricValue(el); return; }
  // Mayor recorrido numérico, más tiempo para leer la desaceleración final; los gráficos conservan su ritmo.
  const t0 = performance.now(), dur = Math.min(1900, 1100 + Math.log10(1 + Math.abs(to - from)) * 170);
  // Curva con velocidad y aceleración nulas en ambos extremos: evita el arranque brusco y el salto final.
  const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
  // Cada dígito gira en su columna hasta el valor final; una entrada nueva parte de la cifra anterior sin transición.
  if (!el._rollKeys || el._countFresh) rollDigits(el, f(from), 0);
  el._countFresh = false; void el.offsetWidth; rollDigits(el, f(to), dur);
  const step = now => { if(!el.isConnected){el._raf=0;return;}if(reduceMotion()){el._countValue=to;el._raf=0;rollDigits(el,f(to),0);return;}const k = Math.min(1, (now - t0) / dur); el._countValue=from + (to - from) * ease(k); if (k < 1) el._raf = requestAnimationFrame(step);else {el._raf=0;el._fitTexts=[f(to)];fitMetricValue(el);} };
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
  let i = 0;
  spans.forEach(sp => { sp.style.transition = ''; sp.style.transitionDelay = fresh.includes(sp) && !reduceMotion() ? Math.min(i++ * 20, 100) + 'ms' : '0ms'; sp.style.width = sp.dataset.w + '%'; });
}
const resetBars = sec => Object.keys(barMemo).forEach(k => { if (!sec || k.startsWith(sec + ':')) delete barMemo[k]; });
// Desvanece una fila antes de quitarla
const fadeOut = el => new Promise(res => { if (!el || reduceMotion()) return res(); el.classList.add('leaving'); setTimeout(res,MOTION.move); });

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B06}\u{2B07}\u{FE0F}\u{200D}]/gu;
function toast(msg, opt = {}){
  const t = $('#toast'), failed=localSaveFailed&&!/^⚠|no se pudo|no válid|inválid|^ingresa|^elige|^ponle|^primero|^la url|vacía|cancelada/i.test(String(msg)), raw = failed?'No se pudo guardar en este dispositivo. Mantén la app abierta y vuelve a intentar.':String(msg)+(/^Movimiento (registrado|actualizado)/.test(String(msg))?(syncOn()?(sync.pending?' · Guardado aquí; pendiente de Sheets.':' · Confirmado en Sheets.'):' · Guardado en este dispositivo.'):'') , err = /^⚠|no se pudo|no válid|inválid|^ingresa|^elige|^ponle|^primero|^la url|vacía|cancelada/i.test(raw);
  const text = raw.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
  if(failed)opt={};
  const dur = opt.action ? 5000 : Math.min(5000, 2200 + text.length * 25);
  t.querySelector('.t-msg').textContent = text;
  t.querySelector('.t-ic').innerHTML = ic(err ? 'circle-alert' : opt.icon || 'circle-check');
  const act = t.querySelector('.t-act'); act.hidden = !opt.action; act.textContent = opt.action || '';
  act.onclick = opt.action ? () => { clearTimeout(t._h); t.classList.remove('show', 'has-action'); opt.onAction && opt.onAction(); } : null;
  t.classList.toggle('err', err); t.classList.toggle('neutral', !err && !!opt.icon); t.classList.toggle('has-action', !!opt.action); t.style.setProperty('--t-dur', dur + 'ms');
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); // reinicia la animación si llegan varios seguidos
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show', 'has-action'), dur);
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
  cfDialog.showModal(); y.focus();
  return new Promise(r => cfResolve = r);
}
function cfDone(v){ if (cfResolve){ const r = cfResolve; cfResolve = null; r(v); } if (cfDialog.open) cfDialog.close(); }
$('#cfYes').onclick = () => cfDone(true);
$('#cfNo').onclick = () => cfDone(false);
cfDialog.addEventListener('close', () => cfDone(null));

/* ---------- Tabs y mes ---------- */
function showTab(name){
  syncPlanningNavigation(name);
  if (typeof selMode !== 'undefined' && selMode) setSelMode(false);
  // Desde «Ambos» cualquier pestaña normal vuelve al usuario activo (Ajustes se puede abrir en ambos modos)
  if (bothMode && name !== 'both' && name !== 'settings'){ bothMode = false; document.body.classList.remove('both-on'); renderProfileUI(); dirty = new Set(Object.keys(VIEWS)); }
  const b = $(`#tabs button[data-tab="${name}"]`), prevTab = activeTab();
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b));
  $('#btnSettings').classList.toggle('active', name === 'settings');
  document.querySelectorAll('.tab').forEach(s => { s.classList.toggle('active', s.id === 'tab-' + name); s.classList.remove('m-next', 'm-prev', 'from-r', 'from-l'); });
  // La pestaña entra desde el lado hacia el que te mueves
  { const ord = ['dashboard', 'movs', 'budget', 'goals', 'analysis', 'cats', 'settings', 'both'], d = ord.indexOf(name) - ord.indexOf(prevTab), te = $('#tab-' + name);
    if (te && d && !reduceMotion()){ void te.offsetWidth; te.classList.add(d > 0 ? 'from-r' : 'from-l'); } }
  moveTabInd();
  // solo desplaza la fila de pestañas hacia los lados (no la página), y vuelve arriba sin animación para que no salte
  const bar = $('#tabs'); if (b && bar && bar.scrollWidth > bar.clientWidth){ const l = b.offsetLeft - (bar.clientWidth - b.offsetWidth) / 2; bar.scrollTo({left:Math.max(0, l), behavior:reduceMotion()?'instant':'smooth'}); }
  if (window.scrollY > 0) window.scrollTo({top:0, behavior:'instant'});
  const SEC = {dashboard:'dash', budget:'bud', goals:'goal'}[name];
  if (SEC) resetBars(SEC);
  // Cada entrada reinicia los indicadores; las actualizaciones dentro de la vista conservan su valor anterior.
  if (name === 'dashboard') ['kIncome','kExpense','kBalance','kSavings'].forEach(k => delete numMemo[k]);
  if (name === 'analysis') Object.keys(numMemo).filter(k => k.startsWith('an:')).forEach(k => delete numMemo[k]);
  if (name === 'dashboard' || name === 'analysis') dirty.add(name); // se redibujan siempre para que los gráficos tomen su tamaño
  planningHeader();
  renderView(name);
  if (name === 'budget') animateBars($('#tab-budget'));
  if (name === 'goals'){ animateBars($('#goalsGrid')); refreshOther(); }
  if (name === 'movs') moveViewInd();
  updateCreationControls();

}
// Entrada escalonada: las tarjetas visibles aparecen una tras otra
// Barra de pestañas: cada sección recuerda su desplazamiento; tocar la pestaña activa vuelve arriba.
const tabScroll = {};
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-tab]'); if (!b) return;
  const from = activeTab(), to = b.dataset.tab;
  if (from === to && !bothMode){ window.scrollTo({top:0, behavior:reduceMotion() ? 'instant' : 'smooth'}); return; }
  tabScroll[from] = window.scrollY;
  showTab(to);
  const y = tabScroll[to];
  if (y > 0) window.scrollTo({top:Math.min(y, document.documentElement.scrollHeight - innerHeight), behavior:'instant'});
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
  const phone = matchMedia('(max-width:700px)'); let drag = null;
  document.addEventListener('pointerdown', e => {
    if (!phone.matches || e.button > 0) return;
    const d = e.target.closest('dialog[open]'); if (!d || e.target.closest('button,input,select,textarea,a,label,[contenteditable]')) return;
    if (!e.target.closest('.dlg-head,.pp-h') && e.clientY - d.getBoundingClientRect().top > 28) return;
    drag = {d, id:e.pointerId, y:e.clientY, t:performance.now(), dy:0, on:false};
  });
  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = Math.max(0, e.clientY - drag.y);
    if (!drag.on){ if (dy < 6) return; drag.on = true; drag.d.classList.add('sheet-dragging'); }
    drag.dy = dy; drag.d.style.transform = `translateY(${dy}px)`;
  });
  const end = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const {d, dy, on, t} = drag; drag = null; if (!on) return;
    d.classList.remove('sheet-dragging'); void d.offsetWidth;
    const fast = dy / Math.max(1, performance.now() - t) > .6, away = dy > Math.min(140, d.offsetHeight * .3) || (fast && dy > 40);
    if (away && d.dispatchEvent(new Event('cancel', {cancelable:true}))){ d.style.transform = ''; d.close(); }
    else d.style.transform = '';
  };
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
$('#btnSettings').onclick = () => { showTab('settings'); openSettingsSection(null); };
const goTab = showTab;
function moveTabInd(){
  const b = $('#tabs button.active'), ind = $('#tabInd'); ind.style.opacity = b ? 1 : 0; if (!b) return;
  Object.assign(ind.style, {left:b.offsetLeft + 'px', width:b.offsetWidth + 'px'});
}
moveTabInd();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { moveTabInd(); requestAnimationFrame(() => $('#tabInd').classList.add('ready')); });
window.addEventListener('resize', moveTabInd);
// La línea y sombra del encabezado solo aparecen al hacer scroll
const topbar = $('.topbar');
let compactTop = false;
const onScroll = () => {
  const y = window.scrollY; topbar.classList.toggle('scrolled', y > 4);
  // Se achica al bajar (con margen para que no titile) solo si la página es lo bastante larga
  const room = document.documentElement.scrollHeight - innerHeight, want = room > 180 && (compactTop ? y > 24 : y > 72);
  if (want !== compactTop){ compactTop = want; topbar.classList.toggle('compact', want); }
};
window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
const monthInput = $('#month');
monthInput.value = currentMonth;
monthInput.addEventListener('change', () => { if (monthInput.value) { currentMonth = monthInput.value; renderAll(); } });
// Al cambiar de mes el contenido se desliza hacia el lado del mes elegido
function slideMonth(dir){ if (reduceMotion()) return; const t = document.querySelector('.tab.active'); if (!t) return; t.classList.remove('m-next', 'm-prev'); void t.offsetWidth; t.classList.add(dir > 0 ? 'm-next' : 'm-prev'); }
let chartMorph = false;
function goMonth(v){ if (!v || v === currentMonth) return; const dir = v > currentMonth ? 1 : -1; currentMonth = v; monthInput.value = v; chartMorph = true; try { renderAll(); } finally { chartMorph = false; } slideMonth(dir); }
$('#prevM').onclick = () => goMonth(shiftMonth(currentMonth, -1));
$('#nextM').onclick = () => goMonth(shiftMonth(currentMonth, 1));
