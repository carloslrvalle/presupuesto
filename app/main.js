// Presupuesto: main.js — ver README.md del proyecto para responsabilidades y orden de carga.
/* ---------- Render ---------- */
let lastRenderMonth = null;
const VIEWS = {dashboard:() => renderDashboard(), movs:() => { if (movView === 'cal') renderCalendar(); else renderMovs(); },
  budget:() => renderBudget(), goals:() => renderGoals(), analysis:() => renderAnalysis(), cats:() => renderCats(), settings:() => renderProfEdit(), both:() => renderBoth()};
let dirty = new Set(Object.keys(VIEWS));
const activeTab = () => { const t = document.querySelector('.tab.active'); return t ? t.id.slice(4) : 'dashboard'; };
function enhanceAccessibility(){
  syncSelectionAccessibility();
  describeHelp();
  for(const [id,name] of [['budExpense','Presupuesto de gastos'],['budIncome','Presupuesto de ingresos']]){
    const region=document.getElementById(id);if(region){region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',name+'; desplaza horizontalmente si es necesario');}
  }
  document.querySelectorAll('dialog').forEach((d,i)=>{
    const title=d.querySelector('h2,h3');if(title){if(!title.id)title.id='dialog-title-'+i;d.setAttribute('aria-labelledby',title.id);}
    d.querySelectorAll('[data-close]').forEach(b=>{if(!b.textContent.trim()&&!b.getAttribute('aria-label'))b.setAttribute('aria-label','Cerrar');});
  });
  document.querySelectorAll('.field>label:not([for])').forEach(label=>{const control=label.parentElement.querySelector('input:not([type=checkbox]),select,textarea');if(control?.id&&!label.querySelector('input'))label.htmlFor=control.id;});
  const charts={chDonut:'Distribución de gastos por categoría. Los importes se detallan en la lista contigua.',chBars:'Ingresos y gastos de los últimos seis meses.',chYear:$('#analysisChartTitle').textContent+'.',chBoth:'Gastos de ambos usuarios durante los últimos seis meses.'};
  Object.entries(charts).forEach(([id,name])=>{const c=document.getElementById(id);if(c){
    const chart=typeof Chart!=='undefined'?Chart.getChart(c):null;
    const values=chart?(chart.data.labels||[]).map((label,i)=>String(label)+': '+chart.data.datasets.map(d=>(d.label?d.label+' ':'')+(d.data[i] == null ? 'sin datos' : d.unit==='pct'?analysisPercent(Number(d.data[i])):fmt(Number(d.data[i])||0))).join(', ')).join('; '):'';
    c.setAttribute('role','img');c.setAttribute('aria-label',name+(values?' '+values:''));
  }});
}
function syncSelectionAccessibility(){
  document.querySelectorAll('.seg button,.vseg button,.font-card,.theme-card').forEach(b=>b.setAttribute('aria-pressed',String(b.classList.contains('active'))));
}
document.addEventListener('click',()=>qMicro(syncSelectionAccessibility));
document.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const dialog=e.target.closest('dialog[open]');if(!dialog)return;
  const controls=[...dialog.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length>0);
  const first=controls[0],last=controls.at(-1);if(!first)return;
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
$('#tab-cats').addEventListener('keydown',e=>{
  const grip=e.target.closest('.grip');if(!grip||!['ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
  const id=grip.closest('.cat-row').dataset.id,c=state.categories.find(c=>c.id===id),list=catsActive(c.type),index=list.findIndex(c=>c.id===id),next=list[index+(e.key==='ArrowUp'?-1:1)];if(!next)return;
  const a=state.categories.indexOf(c),b=state.categories.indexOf(next);[state.categories[a],state.categories[b]]=[state.categories[b],state.categories[a]];const saved=save();renderCats();
  dirty=new Set(Object.keys(VIEWS));dirty.delete('cats');
  [...document.querySelectorAll('.cat-row')].find(r=>r.dataset.id===id)?.querySelector('.grip').focus();if(saved)toast('Categoría reordenada');
});
let chartScript = null, chartLoadFailed = false;
function loadChartFor(container){
  if (typeof Chart !== 'undefined') return true;
  if (!container.closest('.tab.active')) return false;
  container.innerHTML = chartLoadFailed
    ? '<div class="chart-status"><span>No se pudo cargar el gráfico.</span><button type="button" class="btn sm" data-retry-chart>Reintentar</button></div>'
    : '<div class="chart-status" role="status">Cargando gráfico…</div>';
  if (chartLoadFailed) return false;
  if (!chartScript){
    const script = document.createElement('script');
    chartScript = script;
    script.src = './vendor/chart.umd.js';
    script.dataset.optionalChart = '';
    function finish(){
      chartLoadFailed = typeof Chart === 'undefined';
      if (chartLoadFailed){ script.remove(); chartScript = null; }
      const current = activeTab(), chartViews = ['dashboard','analysis','both'];
      chartViews.forEach(view => dirty.add(view));
      if (chartViews.includes(current)) renderView(current);
    }
    script.addEventListener('load', finish, {once:true});
    script.addEventListener('error', finish, {once:true});
    document.head.append(script);
  }
  return false;
}
document.addEventListener('click', e => {
  if (!e.target.closest('[data-retry-chart]')) return;
  chartLoadFailed = false;
  const view = activeTab();
  dirty.add(view);
  renderView(view);
});
function renderView(n){ if (!dirty.has(n) || !VIEWS[n]) return; dirty.delete(n); VIEWS[n](); enhanceAccessibility(); requestAnimationFrame(fitMetricValues); }
function renderAll(){
  if (lastRenderMonth !== currentMonth){ resetBars(); lastRenderMonth = currentMonth; }
  planningHeader();
  applyBrand(); renderThemes(); renderFonts();
  methodsInput.value = (state.settings.methods||[]).join(', '); renderSettingsOverview();
  // Solo se dibuja la pestaña visible; las demás quedan marcadas y se dibujan al abrirlas
  dirty = new Set(Object.keys(VIEWS));
  renderProfileUI();
  renderView(activeTab());
  checkGoalCelebration();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAll);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>{
 if(reduceMotion())document.getAnimations().forEach(a=>{try{if(a.effect.getTiming().iterations===Infinity)a.cancel();else a.finish();}catch(e){a.cancel();}});
 if(typeof Chart!=='undefined')Object.values(Chart.instances).forEach(chart=>{chart.stop();chart.options.animation=reduceMotion()?false:{duration:MOTION.data,easing:'easeOutQuart'};chart.update('none');});
 renderAll();
});
setupSettings();
$('#firstConnect').onclick = () => {
  showTab('settings');
  openSettingsSection('data', true);
  const field = $(FROM_SCRIPT ? '#syncToken' : '#syncUrl');
  field.focus({preventScroll:true});
  field.scrollIntoView({block:'nearest'});
};
renderAll();
updateSyncInfo();
// App instalable (GitHub Pages u otro sitio https): funciona sin conexión y toma la versión nueva al abrir con internet
if ('serviceWorker' in navigator && !window.__BUDGET_PREVIEW && !FROM_SCRIPT && (location.protocol === 'https:' || (location.protocol === 'http:' && window.isSecureContext))) navigator.serviceWorker.register('sw.js').catch(() => {});
let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; $('#btnInstall').hidden = false; });
$('#btnInstall').onclick = async () => { if (!installEvt) return; installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; $('#btnInstall').hidden = true; };
askPersist();
if (window.__connFromLink === 'new') setTimeout(() => toast('Conectado con tu link: trayendo tus datos de Sheets', {icon:'link'}), 600);
else if (window.__connFromLink === 'bad') setTimeout(() => toast('⚠️ El link de conexión no es válido'), 600);
// Punto de partida del registro de cambios: desde aquí cada edición queda fechada para sincronizar
if (!_snapRec) _snapRec = snapState();
setBadge(sync.pending?'pending':sync.lastSync?'ok':'local',sync.pending?'Pendiente de sincronizar':sync.lastSync?'Sincronizado':'Guardado en este dispositivo');updateSyncInfo();
$('#appVer').textContent = `Versión ${window.__APP_VERSION} · ${fmtDateLong(window.__APP_DATE)}${FROM_SCRIPT ? ' · abierta desde Apps Script' : location.protocol === 'https:' ? ' · ' + location.host : ''}`;
{ const b = document.getElementById('boot'); if (b && !window.__bootErrs.length){
  const release=()=>{if(window.__bootErrs.length||!b.isConnected)return;delete document.documentElement.dataset.booting;b.classList.add('gone');b.setAttribute('aria-hidden','true');if(!reduceMotion()){document.body.classList.add('app-enter');setTimeout(()=>document.body.classList.remove('app-enter'),1200);}if(reduceMotion())b.remove();else{b.addEventListener('transitionend',()=>b.remove(),{once:true});setTimeout(()=>b.remove(),400);}};
  requestAnimationFrame(release);
} }
// Sincronización inicial del perfil activo
const startupProfile=activeProfile,startupConnection=sync.url+'|'+sync.token;
requestAnimationFrame(()=>setTimeout(()=>{
if(activeProfile!==startupProfile||sync.url+'|'+sync.token!==startupConnection)return;
(syncOn() ? startupSync() : Promise.resolve(true)).then(() => {
  if(activeProfile!==startupProfile||sync.url+'|'+sync.token!==startupConnection||localRecovery||localTabChanged||syncConflict())return;
  pushOtherPending(); setTimeout(migratePastel, 600);
  setTimeout(() => { if (document.querySelector('dialog[open]')) return;
    if (!state.settings.onboarded && state.transactions.length){ state.settings.onboarded = true; if (!state.settings.lastClose) state.settings.lastClose = thisMonth(); save(); }
    maybeMonthClose(); }, 900); });
},0));
// Paso único a colores pastel (categorías y metas), con opción de deshacer
function migratePastel(){
  if (state.settings.pastelDone) return;
  const prev = {cats: state.categories.map(c => [c.id, c.color]), goals: state.goals.map(g => [g.id, g.color])};
  let n = 0; const conv = o => { const p = TO_PASTEL[String(o.color || '').toLowerCase()]; if (p){ o.color = p; n++; } };
  state.categories.forEach(conv); state.goals.forEach(conv);
  state.settings.pastelDone = true; save();
  if (!n) return;
  renderAll();
  toast(`${n} color${n > 1 ? 'es' : ''} pasado${n > 1 ? 's' : ''} a pastel`, {icon:'palette', action:'Deshacer', onAction: () => {
    prev.cats.forEach(([id, col]) => { const c = state.categories.find(x => x.id === id); if (c) c.color = col; });
    prev.goals.forEach(([id, col]) => { const g = state.goals.find(x => x.id === id); if (g) g.color = col; });
    save(); renderAll(); toast('Colores restaurados', {icon:'undo-2'});
  }});
}
