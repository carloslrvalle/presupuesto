// Presupuesto: movements.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Movimientos ---------- */
function fillCatFilter(){
  const sel = $('#fltCat'), v = sel.value;
  sel.innerHTML = '<option value="">Todas las categorías</option>' +
    ['income','expense'].map(t => `<optgroup label="${t==='income'?'Ingresos':'Gastos'}">` + catsOf(t).filter(c => !c.archived || state.transactions.some(x => x.catId === c.id)).map(c => `<option value="${esc(c.id)}" data-icon="${esc(c.icon)}" data-color="${esc(c.color)}">${esc(iconText(c))}</option>`).join('') + '</optgroup>').join('');
  sel.value = v; if (sel.selectedIndex < 0) sel.value = '';
}
function fillMethodFilter(){
  const sel = $('#fltMethod'), v = sel.value;
  const ms = [...new Set([...(state.settings.methods || []), ...state.transactions.map(t => t.method).filter(Boolean)])];
  sel.innerHTML = '<option value="">Todos los métodos</option>' + ms.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  sel.value = v; if (sel.selectedIndex < 0) sel.value = '';
}
function movementHistory(list,dayLbl,filtered){
 if(!list.length)return filtered?emptyBox('search','Ningún movimiento coincide con tu búsqueda o filtros.'):emptyBox('receipt','Aún no hay movimientos en este período.','tx','Nuevo movimiento');
 const groups=new Map();for(const t of list){if(!groups.has(t.date))groups.set(t.date,[]);groups.get(t.date).push(t);}
 return [...groups].map(([day,items])=>{
  const [label,date]=dayLbl(day),expense=sum(items.filter(t=>t.type==='expense')),income=sum(items.filter(t=>t.type==='income')),planned=isPlanned(items[0]);
  const totals=[expense?`<span>− ${fmt(expense)}</span>`:'',income?`<span class="pos">+ ${fmt(income)}</span>`:''].filter(Boolean).join('');
  return `<section class="history-day" aria-labelledby="history-day-${day}"><header class="history-day-head"><div class="history-day-date"><h3 id="history-day-${day}">${label}</h3>${date?`<span>${date}</span>`:''}${planned?'<span class="plan-pill">Programado</span>':''}</div><div class="history-day-totals" aria-label="Totales del día">${totals}</div></header><ul class="history-items">${items.map(t=>{
   const c=getCat(t.catId),isI=t.type==='income';
   return `<li class="history-row${isPlanned(t)?' planned':''}${selSet.has(t.id)?' picked':''}" data-row="${esc(t.id)}"><button type="button" class="history-edit" data-edit="${esc(t.id)}" aria-label="Editar ${esc(c.name)}${t.desc?': '+esc(t.desc):''}"><span class="history-icon" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><span class="history-copy"><span class="history-primary"><span class="history-category" title="${esc(c.name)}">${esc(c.name)}</span></span>${t.desc||t.method?`<span class="history-secondary">${t.desc?`<span class="history-description">${esc(t.desc)}</span>`:''}${t.method?`<span class="history-detail">${esc(t.method)}</span>`:''}</span>`:''}</span><b class="history-amount ${isI?'pos':'xp'}">${isI?'+':'−'} ${fmt(t.amount)}</b></button><button type="button" class="iconbtn history-options" data-row-menu="${esc(t.id)}" aria-label="Opciones de ${esc(t.desc||c.name)}" aria-haspopup="menu" aria-expanded="false"><svg class="vi" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg></button></li>`;
  }).join('')}</ul></section>`;
 }).join('');
}
function toggleMovementFilters(){
 const el=$('#movExtraFilters'),old=el._filterState,open=old?!old.open:!el.classList.contains('expanded'),from=el.getBoundingClientRect().height;
 if(old)old.animation.cancel();el.classList.add('expanded');el.style.overflow='hidden';
 $('#movFilterToggle').setAttribute('aria-expanded',String(open));
 const to=open?el.getBoundingClientRect().height:0,finish=()=>{el.classList.toggle('expanded',open);el.style.overflow='';el._filterState=null;};
 if(reduceMotion()){finish();return;}
 const animation=el.animate([{height:from+'px',marginTop:from?'12px':'0px',opacity:from?1:0},{height:to+'px',marginTop:open?'12px':'0px',opacity:open?1:0}],{duration:MOTION.panel,easing:MOTION.ease});
 el._filterState={animation,open};animation.onfinish=finish;
}

function renderMovs(){
  closeMovActionMenu(false);
  fillCatFilter(); fillMethodFilter();
  const ft = $('#fltType').value, fc = $('#fltCat').value, fm = $('#fltMethod').value, scope = $('#fltScope').value, q = $('#fltText').value.trim().toLowerCase();
  const y = currentMonth.slice(0, 4);
  const base = scope === 'cycle' ? cycleTx(currentMonth,true) : scope === 'all' ? state.transactions : scope === 'year' ? state.transactions.filter(t => t.date.slice(0, 4) === y) : txOfMonthAll(currentMonth);
  const match = t => { if (!q) return true; const c = getCat(t.catId);
    return [(t.desc || ''), c.name, t.method || '', String(t.amount), fmt(t.amount)].some(x => x.toLowerCase().includes(q)); };
  const list = base.filter(t => (!ft || t.type === ft) && (!fc || t.catId === fc) && (!fm || t.method === fm) && match(t))
    .sort((a,b) => b.date.localeCompare(a.date) || (b.created||0) - (a.created||0));
  const pl = list.filter(isPlanned);
  const real = list.filter(t => !isPlanned(t)); // los programados se cuentan aparte, igual que en el Resumen
  const inc = sum(real.filter(t => t.type === 'income')), exp = sum(real.filter(t => t.type === 'expense'));
  $('#movSummary').innerHTML='<span class="mov-count">'+plural(list.length,'movimiento')+' '+(scope==='all'?'en total':'en '+(scope==='year'?y:scope==='cycle'?cycleLabel(currentMonth):monthLong(currentMonth)))+'</span><span class="mov-total"><span>Ingresos</span><b class="pos">'+fmt(inc)+'</b></span><span class="mov-total"><span>Gastos</span><b class="xp">'+fmt(exp)+'</b></span>'+(pl.length?'<span class="mov-planned-total">'+plural(pl.length,'programado')+' · '+fmt(sum(pl))+'</span>':'');
  const extraCount=Number(!!fc)+Number(!!fm)+Number(!!ft)+Number(scope!=='month');$('#movFilterToggle').textContent=(extraCount?'Filtros ('+extraCount+')':'Filtros');

  // Agrupados por día, con el total del día en el encabezado
  const dayLbl = iso => { const [Y, M, D] = iso.split('-').map(Number), d = new Date(Y, M - 1, D), t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const diff = Math.round((d - t0) / 864e5), wd = d.toLocaleDateString('es-PE', {weekday:'long'});
    const long = `${wd.charAt(0).toUpperCase() + wd.slice(1)} ${D} ${MONTHS_ES[M - 1].toLowerCase()}${Y !== t0.getFullYear() ? ' ' + Y : ''}`;
    return diff === 0 ? ['Hoy', long] : diff === -1 ? ['Ayer', long] : diff === 1 ? ['Mañana', long] : [long, '']; };
  $('#movBody').classList.toggle('selecting',selMode);
  $('#movBody').innerHTML=movementHistory(list,dayLbl,!!(q||ft||fc||fm));
}
['#fltType','#fltCat'].forEach(s => $(s).addEventListener('change', renderMovs));

/* ---------- Desplegables con el estilo de la app ---------- */
const CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
const CHECK = '<svg class="chk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
function optInner(o){
  const ic = o.dataset.icon, col = o.dataset.color;
  const name = ic && !isV(ic) && o.textContent.startsWith(ic + ' ') ? o.textContent.slice(ic.length + 1) : o.textContent;
  return (ic ? `<span class="ico" style="background:${soft(col)}">${iconHTML(ic, col)}</span>` : '') + `<span>${esc(name)}</span>`;
}
function enhanceSelect(sel){
  const w = document.createElement('div'); w.className = 'fsel';
  sel.parentNode.insertBefore(w, sel); w.appendChild(sel); sel.hidden = true;
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fsel-btn';btn.setAttribute('aria-label',sel.getAttribute('aria-label')||'Filtrar movimientos');
  const menu = document.createElement('div'); menu.className = 'fsel-menu'; menu.setAttribute('role','listbox');
  menu.id = sel.id + '-options';
  menu.setAttribute('aria-hidden','true');
  btn.setAttribute('role','combobox');
  btn.setAttribute('aria-haspopup','listbox');
  btn.setAttribute('aria-controls',menu.id);
  btn.setAttribute('aria-expanded','false');
  btn.setAttribute('aria-describedby',sel.id + '-value');
  menu.setAttribute('aria-label',btn.getAttribute('aria-label'));
  w.append(btn, menu);
  let hl = -1;
  const opts = () => [...sel.options];
  const sync = () => { const o = sel.options[sel.selectedIndex]; btn.innerHTML = `<span class="lbl" id="${sel.id}-value">${o ? optInner(o) : ''}</span>${CHEV}`; requestAnimationFrame(() => { const l = btn.firstElementChild; if (l) l.classList.toggle('ov', l.scrollWidth > l.clientWidth + 1); }); };
  const build = () => {
    let html = '';
    [...sel.children].forEach(n => {
      const one = o => `<div class="fsel-opt${o.selected ? ' sel' : ''}" id="${menu.id}-${o.index}" data-i="${o.index}" role="option" aria-selected="${o.selected}">${optInner(o)}${CHECK}</div>`;
      if (n.tagName === 'OPTGROUP') html += `<div class="fsel-grp">${esc(n.label)}</div>` + [...n.children].map(one).join('');
      else html += one(n);
    });
    menu.innerHTML = html;
  };
  const setHl = i => { hl = i; menu.querySelectorAll('.fsel-opt').forEach(el => el.classList.toggle('hl', +el.dataset.i === i));
    const el = menu.querySelector(`.fsel-opt[data-i="${i}"]`);
    if (!el) return;
    btn.setAttribute('aria-activedescendant',el.id);
    const top = el.offsetTop, bottom = top + el.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  };
  const open = () => { document.querySelectorAll('.fsel.open').forEach(x => x !== w && x._close()); build(); w.classList.add('open'); menu.removeAttribute('aria-hidden'); btn.setAttribute('aria-expanded','true'); setHl(sel.selectedIndex);
    const el = menu.querySelector('.sel'); if (el) menu.scrollTop = el.offsetTop - menu.clientHeight / 2 + el.offsetHeight / 2; };
  const close = () => {
    if (!w.classList.contains('open')) return;
    w.classList.remove('open');
    menu.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    btn.removeAttribute('aria-activedescendant');
  };
  w._close = close;
  const pick = i => { close(); btn.focus(); if (i !== sel.selectedIndex){ sel.selectedIndex = i; sync(); sel.dispatchEvent(new Event('change', {bubbles:true})); } };
  btn.addEventListener('click', () => w.classList.contains('open') ? close() : open());
  menu.addEventListener('click', e => { const o = e.target.closest('.fsel-opt'); if (o) pick(+o.dataset.i); });
  menu.addEventListener('mousemove', e => { const o = e.target.closest('.fsel-opt'); if (o && +o.dataset.i !== hl) setHl(+o.dataset.i); });
  btn.addEventListener('keydown', e => {
    const isOpen = w.classList.contains('open'), n = opts().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!isOpen) return open();
      setHl(Math.max(0, Math.min(n - 1, hl + (e.key === 'ArrowDown' ? 1 : -1)))); }
    else if (isOpen && ['Home','End'].includes(e.key)){ e.preventDefault(); setHl(e.key === 'Home' ? 0 : n - 1); }
    else if ((e.key === 'Enter' || e.key === ' ') && isOpen){ e.preventDefault(); if (hl >= 0) pick(hl); }
    else if (e.key === 'Escape' && isOpen){ e.preventDefault(); close(); }
    else if (e.key === 'Tab') close();
  });
  document.addEventListener('pointerdown', e => { if (!w.contains(e.target)) close(); });
  new MutationObserver(sync).observe(sel, {childList:true, subtree:true});
  sel.addEventListener('change', sync);
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(sel, 'value', {get(){ return desc.get.call(this); }, set(v){ desc.set.call(this, v); sync(); }});
  sync(); return w;
}
['#fltScope','#fltType','#fltCat','#fltMethod'].forEach(s => enhanceSelect($(s)));
['#fltScope','#fltMethod'].forEach(s => $(s).addEventListener('change', renderMovs));

/* ---------- Ir a Movimientos con filtros ---------- */
// Detalle de una categoría: últimos 6 meses, promedio y movimientos del mes
function openCatDetail(id){
  const c = state.categories.find(x => x.id === id); if (!c) return;
  const m = currentMonth, isI = c.type === 'income', ms = Array.from({length:6}, (_, i) => shiftMonth(m, i - 5));
  const vals = ms.map(mm => planReal(mm, id)), max = Math.max(1, ...vals), b = planBudget(m, id), withData = vals.filter(Boolean);
  const avg = withData.length ? withData.reduce((a, v) => a + v, 0) / withData.length : 0, cur = vals[5];
  const txs = planTxAll(m).filter(t => t.catId === id).sort((a, z) => z.date.localeCompare(a.date));
  const col = themeInk(dc(c.color));
  $('#cdTitle').innerHTML = `<div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div><div><h3 id="catDetailTitle" style="margin:0">${esc(c.name)}</h3><div class="small muted">${planLabel(m)}</div></div>`;
  $('#cdBody').innerHTML = `
    <div class="cd-stats">
      <div><span>Este período</span><b>${fmt(cur)}</b></div>
      <div><span>${isI ? 'Esperado' : 'Presupuesto'}</span><b>${b ? fmt(b) : '—'}</b></div>
      <div><span>Promedio por período</span><b>${fmt(avg)}</b></div>
    </div>
    <p class="small muted cd-chart-caption">Últimos seis períodos · importes en soles</p><div class="cd-chart">${ms.map((mm, i) => `<div class="cd-col${i === 5 ? ' cur' : ''}" title="${monthShort(mm)}: ${fmt(vals[i])}"><div class="cd-bar"><span class="cd-v">${vals[i] ? calendarAmount(vals[i]) : ''}</span><i style="height:${Math.max(vals[i] ? 6 : 2, vals[i] / max * 100)}%;background:${col}"></i></div><span class="cd-m">${MONTHS_ES[Number(mm.slice(5, 7)) - 1]}</span></div>`).join('')}
</div>
    <details class="cd-exact"><summary>Ver importes exactos</summary><dl>${ms.map((mm,i)=>`<div><dt>${cycleView()?cycleLabel(mm):monthLong(mm)}</dt><dd>${fmt(vals[i])}</dd></div>`).join('')}</dl></details>
    <div class="cd-list"><div class="cd-lh">${plural(txs.length, 'movimiento')} ${cycleView()?'en este ciclo':'en '+monthLong(m).split(' ')[0].toLowerCase()}</div>
      ${txs.length ? txs.slice(0, 8).map(t => `<button type="button" class="cd-tx" data-cd-edit="${esc(t.id)}"><span class="cd-d">${fmtDate(t.date).slice(0, 5)}</span><span class="cd-n">${esc(t.desc || c.name)}${isPlanned(t) ? ' <span class="plan-pill">Programado</span>' : ''}<small>${esc(t.method || '')}</small></span><b class="${isI ? 'pos' : 'xp'}">${fmt(t.amount)}</b></button>`).join('') : '<div class="small muted" style="padding:8px 0">Sin movimientos este mes.</div>'}
      ${txs.length > 8 ? `<div class="small muted" style="padding:6px 0 0">y ${txs.length - 8} más…</div>` : ''}</div>
    <div class="cd-foot"><button type="button" class="btn" data-cd-all>${ic('list')} Ver en Movimientos</button><button type="button" class="btn primary" data-cd-add>${ic('plus')} Registrar</button></div>`;
  $('#catDialog').dataset.cat = id;
  $('#catDialog').dataset.cycleMonth = cycleView()?m:'';
  if (!$('#catDialog').open) $('#catDialog').showModal();
}
$('#catDialog').addEventListener('click', e => {
  const d = $('#catDialog'), id = d.dataset.cat, c = state.categories.find(x => x.id === id);
  if (e.target === d) return d.close();
  const ed = e.target.closest('[data-cd-edit]'); if (ed){ d.close(); return openTx(ed.dataset.cdEdit); }
  if (e.target.closest('[data-cd-all]')){ d.close(); return openMovs({type:c.type, cat:id,scope:d.dataset.cycleMonth?'cycle':'month',month:d.dataset.cycleMonth||null}); }
  if (e.target.closest('[data-cd-add]')){ d.close(); return openTx(null, {type:c.type, catId:id}); }
});
function openMovs({type = '', cat = '', scope = 'month', view = 'list',month=null} = {}){
  showTab('movs'); if(month){currentMonth=month;monthInput.value=month;planningHeader();} setMovView(view);
  if (view !== 'list') return;
  const set = (id, v) => { const el = $(id), changed = el.value !== v; el.value = v; if (changed){ const f = el.closest('.fsel'); f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash'); } };
  set('#fltScope', scope); set('#fltType', type); fillCatFilter(); set('#fltCat', cat); set('#fltMethod', ''); $('#fltText').value = '';
  renderMovs();
}
function goFromCard(go){
  if (go === 'analysis') return showTab('analysis');
  if (go === 'budget') return showTab('budget');
  if (go === 'cal') return openMovs({view:'cal'});
  if(cycleView()&&!go.startsWith('y-'))return openMovs({scope:'cycle',type:go==='all'?'':go,month:currentMonth});
  const [scope, type] = go.startsWith('y-') ? ['year', go.slice(2)] : ['month', go];
  openMovs({scope, type: type === 'all' ? '' : type});
}
document.addEventListener('click', e => {
  const metric=e.target.closest('[data-metric-go]');if(metric)return goFromCard(metric.dataset.metricGo);
  const k = e.target.closest('.kpi.link[data-go]'); if (k) return goFromCard(k.dataset.go);
  const r = e.target.closest('.prow.link[data-go-cat]'); if (r && r.dataset.goCat) return openCatDetail(r.dataset.goCat);
  const t = e.target.closest('.prow.link[data-go-tx]'); if (t) return openTx(t.dataset.goTx);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.kpi.link')){ e.preventDefault(); goFromCard(e.target.dataset.go); } });

/* ---------- Vistas de Movimientos: lista, calendario, recurrentes ---------- */
let movView = 'list';
function moveViewInd(){
  const b = $('#movView button.active'), ind = $('#movView .vseg-ind'); if (!b || !b.offsetWidth) return;
  moveIndicator(ind, {left:b.offsetLeft + 'px', width:b.offsetWidth + 'px'});
}
function setMovView(v){
  movView = v;
  document.querySelectorAll('#movView button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  document.querySelectorAll('#tab-movs .mview').forEach(el => el.hidden = el.id !== 'view-' + v);
  $('#btnNewTx').hidden = v === 'rec'; $('#btnNewRec').hidden = v !== 'rec';
  updateCreationControls();
  $('#btnSelect').hidden=v!=='list';
  moveViewInd();
  if (v === 'cal') renderCalendar();
}
$('#movView').addEventListener('click', e => { const b = e.target.closest('[data-view]'); if (b) setMovView(b.dataset.view); });
window.addEventListener('resize', moveViewInd);

/* ---------- Calendario ---------- */
let calSel = null;
function calendarAmount(n){
  let value=Math.abs(n),unit=0;const units=['','k','M'];
  while(value>=1000&&unit<units.length-1){value/=1000;unit++;}
  value=Number(value.toFixed(unit&&value<100?1:0));
  if(value>=1000&&unit<units.length-1){value/=1000;unit++;}
  return value>=1000?Math.abs(n).toExponential(0):String(value)+units[unit];
}
function renderCalendar(){
  const m = currentMonth, [y, mo] = m.split('-').map(Number), dim = daysIn(m), first = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
  const tm = thisMonth(), today = m === tm ? new Date().getDate() : 0, byDay = {};
  txOfMonthAll(m).forEach(t => { const d = Number(t.date.slice(8, 10)), o = byDay[d] = byDay[d] || {exp:0, inc:0, n:0, plan:0}; if (isPlanned(t)) o.plan++; o[t.type === 'income' ? 'inc' : 'exp'] += Number(t.amount) || 0; o.n++; });
  const exps = Object.values(byDay).map(o => o.exp).filter(Boolean), max = Math.max(1, ...exps);
  const srt = [...exps].sort((a, b) => a - b), med = srt.length ? srt[Math.floor(srt.length / 2)] : 0; // mediana: un gasto 'muy alto' es >2.5× un día normal
  // Escala logarítmica: un día de alquiler no deja a los demás casi blancos
  const maxInc = Math.max(1, ...Object.values(byDay).map(o => o.inc));
  // Escala logarítmica en tonos pastel: un día de alquiler no deja a los demás casi blancos
  const lvlOf = (v, mx) => v ? 10 + 26 * Math.log1p(v) / Math.log1p(mx) : 0;
  const recBy = {}; recPending(m).forEach(r => { const d = Math.min(r.day, dim); (recBy[d] = recBy[d] || []).push(r); });
  if (!calSel || calSel.slice(0, 7) !== m){
    const firstWith = Object.keys(byDay).map(Number).sort((a, b) => b - a)[0];
    calSel = dateFor(m, today || firstWith || 1);
  }
  const daysPassed = m < tm ? dim : m === tm ? today : 0;
  const totExp = sum(txOfMonth(m).filter(t => t.type === 'expense'));
  // El promedio diario solo cuenta lo ya ocurrido (no los gastos con fecha futura)
  const pastExp = sum(txOfMonth(m).filter(t => t.type === 'expense')), avg = daysPassed ? pastExp / daysPassed : 0;
  let html = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d, i) => `<div class="cal-h${i > 4 ? ' we' : ''}">${d}</div>`).join('');
  let col = 0, week = 0, idx = 0, weekStart = 1;
  const weeks = [];
  const closeWeek = end => { weeks.push({start:weekStart,end,total:week});weekStart=end+1;week=0;col=0; };
  for (let i = 0; i < first; i++){ html += '<div class="cal-pad"></div>'; col++; }
  for (let d = 1; d <= dim; d++){
    const o = byDay[d], iso = dateFor(m, d), recs = recBy[d] || [], we = col > 4;
    if (o) week += o.exp;
    const hot = o && o.exp > med * 2.5 && exps.length > 3;
    const e = lvlOf(o && o.exp, max), g = lvlOf(o && o.inc, maxInc), kind = e && g ? ' both' : e ? ' has-exp' : g ? ' has-inc' : '';
    const dayLabel=`${fmtDateLong(iso)}. Ingresos: ${fmt(o?.inc||0)}. Gastos: ${fmt(o?.exp||0)}${recs.length?'. Recurrentes pendientes: '+recs.length:''}`;
    html += `<button type="button" class="cal-d${we ? ' we' : ''}${kind}${d === today ? ' today' : ''}${iso === calSel ? ' sel' : ''}${today && d > today ? ' future' : ''}${o && o.plan ? ' planned' : ''}" data-day="${iso}" style="--e1:${e.toFixed(0)}%;--e2:${(e * .35).toFixed(0)}%;--g1:${g.toFixed(0)}%;--g2:${(g * .35).toFixed(0)}%;--i:${idx++}" aria-label="${esc(dayLabel)}" title="${esc(dayLabel)}" aria-pressed="${iso===calSel}" tabindex="${iso===calSel?0:-1}">
      <span class="cd-n">${d}</span>${recs.length ? `<span class="cd-r" title="${recs.length} recurrente(s) pendiente(s)">${ic('repeat')}</span>` : ''}${hot ? '<span class="cd-hot" title="Gasto alto">●</span>' : ''}
      </button>`;
    if (++col === 7) closeWeek(d);
  }
  if (col){ while (col < 7){ html += '<div class="cal-pad"></div>'; col++; } closeWeek(dim); }
  $('#calGrid').innerHTML = html;
  $('#calSummaryMonth').textContent=monthLong(m);
  $('#calWeekTotals').innerHTML=weeks.map(w=>`<div><dt>${w.start===w.end?'Día '+w.start:'Días '+w.start+'–'+w.end}</dt><dd>${fmt(w.total)}</dd></div>`).join('');
  // Estadísticas del mes
  const top = Object.entries(byDay).sort((a, b) => b[1].exp - a[1].exp)[0];
  const zero = daysPassed ? Array.from({length:daysPassed}, (_, i) => i + 1).filter(d => !byDay[d] || !byDay[d].exp).length : 0;
  const wd = d => new Date(y, mo - 1, d).toLocaleDateString('es-PE', {weekday:'short'}).replace('.', '');
  const bExp = totalBudget(m, 'expense'), daily = bExp ? bExp / dim : 0;
  $('#calStats').innerHTML = [
    ['Promedio por día', daysPassed ? fmt(avg) : '—', daily ? (avg <= daily ? `<span class="pos">dentro de ${fmt(daily)}/día</span>` : `<span class="neg">sobre ${fmt(daily)}/día</span>`) : ''],
    ['Día de mayor gasto', top && top[1].exp ? fmt(top[1].exp) : '—', top && top[1].exp ? `${wd(Number(top[0]))} ${Number(top[0])}` : ''],
    ['Días sin gastos', daysPassed ? `${zero} de ${daysPassed}` : '—', daysPassed ? `${Math.round(zero / daysPassed * 100)}% del mes` : '']
  ].map(([l, v, sub]) => `<div class="card cs"><div class="small muted">${l}</div><b>${v}</b>${sub ? `<div class="small muted">${sub}</div>` : ''}</div>`).join('');
  calAvg = avg;
  renderCalDay();
}
let calAvg = 0;
function renderCalDay(){
  const iso = calSel, list = state.transactions.filter(t => t.date === iso).sort((a, b) => (b.created || 0) - (a.created || 0));
  const recs = recPending(iso.slice(0, 7)).filter(r => Math.min(r.day, daysIn(iso.slice(0, 7))) === Number(iso.slice(8, 10)));
  const exp = sum(list.filter(t => t.type === 'expense')), inc = sum(list.filter(t => t.type === 'income'));
  const vsAvg = calAvg && exp ? exp / calAvg : 0;
  const [y, mo, d] = iso.split('-').map(Number), label = new Date(y, mo - 1, d).toLocaleDateString('es-PE', {weekday:'long', day:'numeric', month:'long'});
  $('#calDay').innerHTML = `<div class="cal-day-head"><div><h3 id="calDayTitle"><time datetime="${iso}">${label[0].toUpperCase() + label.slice(1)}</time></h3>
      <div class="cal-day-summary"><span class="small muted">${list.length ? plural(list.length, 'movimiento') : 'Sin movimientos'}</span><div class="cal-day-totals">${list.length ? `<span><small>Gastos</small><b class="xp">${fmt(exp)}</b></span>` : ''}${inc ? `<span><small>Ingresos</small><b class="pos">+${fmt(inc)}</b></span>` : ''}</div></div>
      ${vsAvg ? `<div class="vs-avg ${vsAvg > 1.2 ? 'hi' : vsAvg < .8 ? 'lo' : ''}">${vsAvg >= 1 ? vsAvg.toFixed(1) + '× tu promedio diario' : Math.round(vsAvg * 100) + '% de tu promedio diario'}</div>` : ''}</div>
      </div>
    <div class="cal-day-scroll" tabindex="0" role="region" aria-labelledby="calDayTitle">
    ${list.map(t => { const c = getCat(t.catId), isI = t.type === 'income'; return `<div class="prow cal-transaction">
      <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div class="cal-copy"><div class="name" title="${esc(t.desc || c.name)}">${esc(t.desc || c.name)}${isPlanned(t) ? ' <span class="plan-pill">Programado</span>' : ''}</div><div class="small muted" title="${esc(c.name+(t.method?' · '+t.method:''))}">${esc(c.name)}${t.method ? ' · ' + esc(t.method) : ''}</div></div>
      <div class="amt"><b class="${isI ? 'pos' : 'xp'}">${isI ? '+' : '−'} ${fmt(t.amount)}</b></div>
      <div class="row-actions"><button class="iconbtn" data-edit="${esc(t.id)}" title="Editar">${ic('pencil')}</button><button class="iconbtn" data-del="${esc(t.id)}" title="Eliminar">${ic('trash-2')}</button></div></div>`; }).join('')}
    ${recs.map(r => { const c = getCat(r.catId); return `<div class="prow cal-recurring">
      <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div><div class="name">${recLabel(r)}</div><div class="small muted">Recurrente ${r.auto ? 'automático' : 'por confirmar'}</div></div>
      <div class="amt">${fmt(r.amount)}</div></div>`; }).join('')}
    ${!list.length && !recs.length ? emptyBox('calendar-days', 'Nada registrado este día.', 'calendar-tx', 'Registrar movimiento', false, 'es-sm') : ''}</div>`;
}
$('#calGrid').addEventListener('click', e => { const b = e.target.closest('[data-day]'); if (!b) return; calSel = b.dataset.day;
  document.querySelectorAll('#calGrid .cal-d').forEach(x => {
    const selected=x===b;
    x.classList.toggle('sel',selected);
    x.setAttribute('aria-pressed',String(selected));
    x.tabIndex=selected?0:-1;
  });
  renderCalDay(); $('#calDay').classList.remove('swap'); void $('#calDay').offsetWidth; $('#calDay').classList.add('swap');
  if(innerWidth<=700&&e.detail)requestAnimationFrame(()=>{const el=$('#calDay'),header=document.querySelector('.topbar'),gap=getComputedStyle(header).position==='sticky'?header.getBoundingClientRect().height:0;window.scrollTo({top:scrollY+el.getBoundingClientRect().top-gap-12,behavior:reduceMotion()?'instant':'smooth'});});
});
$('#calGrid').addEventListener('keydown', e => {
  const day=e.target.closest('[data-day]'), offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
  if(!day || (!offset && e.key!=='Home' && e.key!=='End'))return;
  e.preventDefault();
  const m=currentMonth, last=daysIn(m);
  const d=e.key==='Home'?1:e.key==='End'?last:Number(day.dataset.day.slice(8))+offset;
  if(d<1 || d>last)return;
  const next=$(`#calGrid [data-day="${dateFor(m,d)}"]`);
  next?.click();
  next?.focus();
});
$('#calDay').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
  if (ed) openTx(ed.dataset.edit);
  if (dl){ await fadeOut(dl.closest('.prow')); delTxUndo(dl.dataset.del); }
});

/* ---------- Próximos 7 días (recurrentes) ---------- */
function upcoming(days = 7){
  const base = new Date(); base.setHours(0, 0, 0, 0); const out = [];
  for (let i = 0; i < days; i++){
    const d = new Date(base); d.setDate(base.getDate() + i);
    const m = ym(d), day = d.getDate(), dim = daysIn(m);
    state.recurring.filter(r => r.active !== false && (!r.start || r.start <= m) && Math.min(r.day, dim) === day && !recDone(r, m) && !recSkipped(r, m))
      .forEach(r => out.push({r, d, m, i}));
    const iso = ym(d) + '-' + String(day).padStart(2, '0');
    state.transactions.filter(t => t.date === iso && isPlanned(t) && !t.recId).forEach(t => out.push({r:{type:t.type, amount:t.amount, catId:t.catId, desc:t.desc || getCat(t.catId).name, planned:true, tid:t.id}, d, m, i}));
  }
  return out;
}
function renderUpcoming(){
  const up = upcoming(7), el = $('#recUpcoming');
  const start = new Date();start.setHours(0,0,0,0);const end = new Date(start);end.setDate(start.getDate()+6);
  const short = d => d.toLocaleDateString('es-PE',{day:'numeric',month:'short'}).replace('.', '');
  $('#recUpcomingRange').textContent = (ym(start)===ym(end)?start.getDate()+'–'+short(end):short(start)+'–'+short(end))+' '+end.getFullYear();
  if (!up.length){ el.innerHTML = emptyBox('calendar-clock', 'No hay pagos ni cobros recurrentes o programados en los próximos 7 días.', null, '', true); return; }
  const when = x => x.i === 0 ? 'Hoy' : x.i === 1 ? 'Mañana' : x.d.toLocaleDateString('es-PE', {weekday:'short', day:'numeric', month:'short'}).replace('.', '');
  const exp = up.filter(x => x.r.type === 'expense').reduce((a, x) => a + Number(x.r.amount || 0), 0), inc = up.filter(x => x.r.type === 'income').reduce((a, x) => a + Number(x.r.amount || 0), 0);
  el.innerHTML = `<div class="up-line">${up.map(x => { const c = getCat(x.r.catId), isI = x.r.type === 'income'; return `<div class="up-item${x.i === 0 ? ' now' : ''}">
      <div class="up-when">${when(x)}</div>
      <div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</div>
      <div class="up-name">${recLabel(x.r)}</div>
      <div class="up-amt ${isI ? 'pos' : 'xp'}">${isI ? '+' : '−'} ${fmt(x.r.amount)}</div>
      <div class="small muted">${x.r.planned ? 'Programado' : x.r.auto ? 'Automático' : 'Manual'}</div></div>`; }).join('')}</div>
    <div class="list-total"><span>Total próximos 7 días</span><span>${exp ? `<span class="xp">− ${fmt(exp)}</span>` : ''}${exp && inc ? ' · ' : ''}${inc ? `<span class="pos">+ ${fmt(inc)}</span>` : ''}</span></div>`;
}
$('#fltText').addEventListener('input', renderMovs);
// Modo selección: tocar filas para marcarlas y borrarlas juntas (con deshacer)
let selMode = false; const selSet = new Set();
const selBar = document.createElement('div'); selBar.className = 'sel-bar'; selBar.hidden = true; document.body.appendChild(selBar);
function setSelMode(on){
  selMode = on; selSet.clear(); renderSelUI(); renderMovs();
}
function renderSelUI(){
  $('#btnSelect').setAttribute('aria-label',selMode?'Cancelar selección':'Seleccionar movimientos');
  $('#btnSelect').classList.toggle('on', selMode);
  $('#btnSelect .sel-ic').innerHTML = ic(selMode ? 'x' : 'list-checks'); $('#btnSelect .sel-t').textContent = selMode ? 'Cancelar' : 'Seleccionar';
  selBar.hidden = !selMode; document.body.classList.toggle('sel-on', selMode);
  const selTot = selSet.size ? ' · ' + fmt(sum(state.transactions.filter(t => selSet.has(t.id)))) : '';
  selBar.innerHTML = `<span><b>${selSet.size}</b> ${selSet.size === 1 ? 'seleccionado' : 'seleccionados'}${selTot}</span>` +
    `<button class="btn sm" data-sel="all" title="Seleccionar todos">${ic('check-check')}<span class="hide-m"> Todos</span></button><button class="btn sm danger" data-sel="del"${selSet.size ? '' : ' disabled'}>${ic('trash-2')} Borrar</button>`;
}
$('#btnSelect').onclick = () => setSelMode(!selMode);
selBar.addEventListener('click', async e => {
  const b = e.target.closest('[data-sel]'); if (!b) return;
  if (b.dataset.sel === 'all'){ const rows = [...document.querySelectorAll('#movBody [data-row]')].map(r => r.dataset.row); const all = rows.every(id => selSet.has(id)); rows.forEach(id => all ? selSet.delete(id) : selSet.add(id)); renderSelUI(); renderMovs(); return; }
  const ids = [...selSet]; if (!ids.length) return;
  if (!(await ask({title:`¿Borrar ${plural(ids.length, 'movimiento')}?`, msg:'Podrás deshacerlo desde el aviso de abajo.'}))) return;
  if(localTabChanged)return;
  const restore = removeTransactions(ids); if (!restore) return;
  save(); selMode = false; selSet.clear(); renderSelUI(); renderAll();
  toast(`${plural(ids.length, 'movimiento')} ${ids.length === 1 ? 'eliminado' : 'eliminados'}`, {icon:'trash-2', action:'Deshacer', onAction: () => {
    if (restore()){ save(); renderAll(); toast('Movimientos restaurados', {icon:'undo-2'}); }
  }});
});
$('#movBody').addEventListener('click', e => {
  if (!selMode) return; const tr = e.target.closest('[data-row]'); if (!tr) return;
  e.stopImmediatePropagation(); const id = tr.dataset.row;
  selSet.has(id) ? selSet.delete(id) : selSet.add(id); tr.classList.toggle('picked', selSet.has(id)); renderSelUI();
}, true);
$('#movBody').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
  if (ed) openTx(ed.dataset.edit);
  if (dl){ await fadeOut(dl.closest('[data-row]')); delTxUndo(dl.dataset.del); }
});

const movActionMenu=document.createElement('div');movActionMenu.className='mov-action-menu';movActionMenu.setAttribute('role','menu');movActionMenu.setAttribute('aria-label','Acciones del movimiento');movActionMenu.hidden=true;
if('popover' in HTMLElement.prototype)movActionMenu.setAttribute('popover','manual');
movActionMenu.innerHTML=`<button type="button" role="menuitem" data-mov-action="edit">${ic('pencil')}<span>Editar</span></button><button type="button" role="menuitem" data-mov-action="delete">${ic('trash-2')}<span>Eliminar</span></button>`;
document.body.append(movActionMenu);let movAction=null;
function closeMovActionMenu(focus=false){
 if(!movAction)return;const anchor=movAction.anchor;anchor.setAttribute('aria-expanded','false');
 movAction=null;movActionMenu.inert=true;movActionMenu.classList.add('menu-closing');
 // WebKit retira el popover de la capa superior de inmediato: conservarlo hasta terminar la salida.
 const finish=()=>{if(movAction)return;if(movActionMenu.hidePopover&&movActionMenu.matches(':popover-open'))movActionMenu.hidePopover();movActionMenu.hidden=true;};
 clearTimeout(movActionMenu._hideTimer);
 if(reduceMotion())finish();else movActionMenu._hideTimer=setTimeout(finish,MOTION.popup);
 if(focus&&anchor.isConnected)anchor.focus({preventScroll:true});
}
function openMovActionMenu(anchor){
 if(movAction?.anchor===anchor){closeMovActionMenu(true);return;}
 closeMovActionMenu();movAction={anchor,id:anchor.dataset.rowMenu};anchor.setAttribute('aria-expanded','true');movActionMenu.hidden=false;
 clearTimeout(movActionMenu._hideTimer);movActionMenu.inert=false;movActionMenu.classList.remove('menu-closing');
 if(movActionMenu.showPopover&&!movActionMenu.matches(':popover-open'))movActionMenu.showPopover();
 positionMovActionMenu();
 movActionMenu.querySelector('button').focus({preventScroll:true});
}
function positionMovActionMenu(){
 if(!movAction)return;const anchor=movAction.anchor,r=anchor.getBoundingClientRect();
 if(!anchor.isConnected||r.bottom<0||r.top>innerHeight){closeMovActionMenu();return;}
 const w=movActionMenu.offsetWidth,h=movActionMenu.offsetHeight;
 const left=Math.max(12,Math.min(innerWidth-w-12,r.right-w)),below=r.bottom+h+8<innerHeight;
 movActionMenu.style.left=left+'px';movActionMenu.style.top=Math.max(12,below?r.bottom+6:r.top-h-6)+'px';
 movActionMenu.style.transformOrigin=Math.max(0,Math.min(w,r.left+r.width/2-left))+'px '+(below?'top':'bottom');
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-row-menu]');if(b&&!selMode)openMovActionMenu(b);});
document.addEventListener('pointerdown',e=>{if(movAction&&!movActionMenu.contains(e.target)&&!movAction.anchor.contains(e.target))closeMovActionMenu();},true);
let movActionPositionFrame=null;
document.addEventListener('scroll',e=>{if(movAction&&!movActionMenu.contains(e.target)&&!movActionPositionFrame)movActionPositionFrame=requestAnimationFrame(()=>{movActionPositionFrame=null;positionMovActionMenu();});},true);
window.addEventListener('resize',()=>closeMovActionMenu());
movActionMenu.addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();closeMovActionMenu(true);return;}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const buttons=[...movActionMenu.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}
 if(e.key==='Tab')closeMovActionMenu();
});
movActionMenu.addEventListener('click',async e=>{
 const b=e.target.closest('[data-mov-action]');if(!b||!movAction)return;const id=movAction.id;closeMovActionMenu();
 if(b.dataset.movAction==='edit')openTx(id);else{await fadeOut(document.querySelector(`#movBody [data-row="${id}"]`));delTxUndo(id);}
});
$('#movFilterToggle').onclick=toggleMovementFilters;
/* ---------- Diálogo movimiento ---------- */
const txDialog = $('#txDialog');
let txType = 'expense', editingId = null, selCat = null, selMethod = null, txMethodExplicit = false, selGoal = null, txMode = 'tx', txRecId = null;
let txCategoryExpanded=false,txNewCategoryIcon='svg:tag';
function txCategoryOrder(cats){
 const count={};state.transactions.filter(t=>t.type===txType).forEach(t=>count[t.catId]=(count[t.catId]||0)+1);
 return cats.slice().sort((a,b)=>(count[b.id]||0)-(count[a.id]||0));
}
function txCategoryMarkup(cats){
 const q=($('#txCategorySearch')?.value||'').trim().toLocaleLowerCase();
 let list=txCategoryOrder(cats);
 if(txCategoryExpanded&&q)list=list.filter(c=>c.name.toLocaleLowerCase().includes(q));
 if(!txCategoryExpanded){list=list.slice(0,4);const selected=cats.find(c=>c.id===selCat);if(selected&&!list.some(c=>c.id===selected.id)){if(list.length===4)list.pop();list.push(selected);}}
 $('#txCategorySearchBox').hidden=!txCategoryExpanded;
 $('#txAllCategories').textContent=txCategoryExpanded?'Ver menos':`Ver todas (${cats.length})`;
 $('#txAllCategories').setAttribute('aria-expanded',String(txCategoryExpanded));
 return list.map(c=>`<button type="button" class="chip${c.id===selCat?' active':''}" data-cat="${esc(c.id)}" aria-pressed="${c.id===selCat}"><span class="cico" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><span class="cn">${esc(c.name)}</span></button>`).join('')||'<span class="small muted">No hay categorías que coincidan.</span>';
}
function resetTxCategoryUI(){
 txCategoryExpanded=false;$('#txCategorySearch').value='';$('#txCategoryEditor').hidden=true;$('#txNewCategory').setAttribute('aria-expanded','false');
}
function openTxCategoryEditor(){
 const box=$('#txCategoryEditor');box.hidden=false;$('#txNewCategory').setAttribute('aria-expanded','true');$('#txCategoryError').textContent='';
 $('#txCategoryName').value='';txNewCategoryIcon='svg:tag';$('#txCategoryColor').value=PALETTE[state.categories.length%PALETTE.length];paintTxCategoryIcon();
 motionAnimate(box,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}]);
 $('#txCategoryName').focus();
}
function paintTxCategoryIcon(){const color=$('#txCategoryColor').value,button=$('#txCategoryIcon');button.innerHTML=ic('palette')+'<span>Personalizar</span>';button.style.setProperty('--category-color',color);}
function createTxCategory(){
 const name=$('#txCategoryName').value.trim(),error=$('#txCategoryError');
 if(!name){error.textContent='Escribe un nombre para la categoría.';$('#txCategoryName').focus();return;}
 if(catsOf(txType).some(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase())){error.textContent='Ya existe una categoría con ese nombre, incluso si está archivada.';return;}
 const c={id:uid(),name,icon:txNewCategoryIcon,type:txType,color:$('#txCategoryColor').value,defaultBudget:0};
 state.categories.push(c);selCat=c.id;save();dirty=new Set(Object.keys(VIEWS));
 $('#txCategoryEditor').hidden=true;$('#txNewCategory').setAttribute('aria-expanded','false');$('#txCategorySearch').value='';txCategoryExpanded=false;renderTxChips();
 toast('Categoría creada y seleccionada',{icon:'check'});$('#fAmount').focus({preventScroll:true});
}
$('#txAllCategories').onclick=()=>{txCategoryExpanded=!txCategoryExpanded;$('#txCategorySearch').value='';motionResize($('#fCatChips'),renderTxChips);if(txCategoryExpanded&&!txPhone.matches)$('#txCategorySearch').focus();};
$('#txCategorySearch').addEventListener('input',renderTxChips);
$('#txNewCategory').onclick=openTxCategoryEditor;
$('#txCancelCategory').onclick=()=>{$('#txCategoryEditor').hidden=true;$('#txNewCategory').setAttribute('aria-expanded','false');$('#txNewCategory').focus();};
$('#txCreateCategory').onclick=createTxCategory;
$('#txCategoryName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();createTxCategory();}});
$('#txCategorySearch').addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
$('#txCategoryIcon').onclick=()=>openIcon(icon=>{txNewCategoryIcon=icon;paintTxCategoryIcon();},{color:$('#txCategoryColor').value,soft:true,onColor:color=>{$('#txCategoryColor').value=color;paintTxCategoryIcon();}},txNewCategoryIcon);
$('#txCategoryColor').addEventListener('input',paintTxCategoryIcon);

// La sugerencia se deriva de movimientos guardados del perfil: no del formulario cancelado.
function suggestedTxMethod(catId,type){
  const methods=state.settings.methods||[];
  const recent=state.transactions.filter(t=>t.type===type&&!isPlanned(t)&&(!t.method||methods.includes(t.method)))
    .slice().sort((a,b)=>(Number(b.created)||0)-(Number(a.created)||0)||b.date.localeCompare(a.date));
  const previous=recent.find(t=>t.catId===catId)||recent[0];
  return previous?(previous.method||''):(methods[0]||'');
}
function renderTxChips(){
  const gf = $('#fGoalField'), goals = myGoals().filter(g => !goalDone(g) || g.id === selGoal);
  gf.hidden = !(txMode === 'tx' && (txType === 'income' || isSavingCat(selCat) || (editingId && selGoal)) && goals.length);
  if (!gf.hidden) $('#fGoalChips').innerHTML = `<button type="button" class="chip${!selGoal ? ' active' : ''}" data-goal="">Ninguna</button>` +
    goalsSorted().map(g => `<button type="button" class="chip${g.id === selGoal ? ' active' : ''}" data-goal="${esc(g.id)}"><span class="cico" style="background:${soft(g.color)}">${iconHTML(g.icon, g.color)}</span>${esc(g.name)}</button>`).join('');
  const cats = catsOf(txType).filter(c => !c.archived || c.id === selCat);
  // Sin categoría elegida se marca la más usada: la primera visible, nunca una oculta.
  if (!cats.some(c => c.id === selCat)) selCat = txCategoryOrder(cats.filter(c => !c.archived))[0]?.id || null;
  $('#fCatChips').innerHTML = txCategoryMarkup(cats);
  if(selMethod==null)selMethod=suggestedTxMethod(selCat,txType);
  const ms=[...new Set([...(state.settings.methods||[]),...(selMethod?[selMethod]:[]),''])];
  $('#fMethodChips').innerHTML=ms.map(m=>`<button type="button" class="chip${m===selMethod?' active':''}" aria-pressed="${m===selMethod}" data-method="${esc(m)}">${esc(m||'Sin especificar')}</button>`).join('');
}
function setTxType(type){
  if(txType!==type){quickExpanded=false;resetTxCategoryUI();if(!txMethodExplicit)selMethod=null;}
  txType = type;
  document.querySelectorAll('#txSeg button').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  renderTxChips(); renderQuick();
}
$('#txSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTxType(b.dataset.type); });
$('#fCatChips').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b){ selCat = b.dataset.cat; if(!txMethodExplicit)selMethod=null; renderTxChips(); } });
$('#fMethodChips').addEventListener('click', e => {
  const button = e.target.closest('[data-method]');
  if (!button) return;
  const restoreFocus = button === document.activeElement || e.detail === 0;
  selMethod = button.dataset.method;
  txMethodExplicit = true;
  renderTxChips();
  if (restoreFocus) $('#fMethodChips .chip.active')?.focus();
});
$('#fGoalChips').addEventListener('click', e => { const b = e.target.closest('[data-goal]'); if (b){ selGoal = b.dataset.goal || null; renderTxChips(); } });
function setMode(){
  const rec = txMode === 'rec';
  $('#fDateField').hidden = rec; $('#fDayField').hidden = !rec; $('#fAutoField').hidden = !rec;
  txDialog.classList.toggle('rec-mode', rec);
  renderTxChips();
}
// preset: {type, catId, amount, method, desc, date, goalId, recId}
// Movimientos frecuentes de los últimos 4 meses (misma descripción, categoría y monto) para registrarlos con un toque
function quickPicks(type){
  const from = shiftMonth(thisMonth(), -3) + '-01', today = todayISO(), seen = new Map();
  const categories = new Set(catsActive(type).map(c => c.id));
  for (const t of state.transactions){
    if (t.type !== type || t.date < from || t.date > today || t.recId || t.goalId || !categories.has(t.catId)) continue;
    const key = JSON.stringify([t.catId, (t.desc || '').toLowerCase(), t.amount, t.method || '']);
    const entry = seen.get(key) || {t, n:0};
    if (t.date > entry.t.date) entry.t = t;
    entry.n++;
    seen.set(key, entry);
  }
  return [...seen.values()].filter(x => x.n >= 2).sort((a, b) => b.n - a.n || b.t.date.localeCompare(a.t.date)).slice(0, 6).map(x => x.t);
}
let quickOK = false, quickExpanded = false;
function renderQuick(){
  const el = $('#txQuick'); if (!el) return;
  const list = txMode === 'tx' && quickOK ? quickPicks(txType) : [];
  el.hidden = !list.length;
  el.innerHTML = list.length ? `<div class="quick-head"><span class="q-l">Frecuentes</span>${list.length>3?`<button type="button" class="quick-toggle" data-quick-toggle aria-controls="txQuickItems" aria-expanded="${quickExpanded}">${quickExpanded?'Ver menos':'Ver más'}</button>`:''}</div><div class="quick-items" id="txQuickItems">` + (quickExpanded?list:list.slice(0,3)).map(t => { const c = getCat(t.catId);
    return `<button type="button" class="q-chip" data-quick="${esc(t.id)}"><span class="cico" style="background:${soft(c.color)}">${iconHTML(c.icon, c.color)}</span><span class="q-copy">${esc(t.desc || c.name)}<small>${esc(t.method||'Sin especificar')}</small></span><b>${fmt(t.amount)}</b></button>`; }).join('')+'</div>' : '';
}
document.addEventListener('click',e=>{if(!e.target.closest('[data-quick-toggle]'))return;motionResize($('#txQuick'),()=>{quickExpanded=!quickExpanded;renderQuick();});$('#txQuick [data-quick-toggle]')?.focus({preventScroll:true});});

document.addEventListener('click', e => {
  const q = e.target.closest('[data-quick]'); if (!q) return;
  const t = state.transactions.find(x => x.id === q.dataset.quick); if (!t) return;
  $('#fAmount').value = t.amount; selCat = t.catId; selMethod = t.method || ''; txMethodExplicit=true; $('#fDesc').value = t.desc || '';
  renderTxChips(); q.classList.add('picked'); setTimeout(() => q.classList.remove('picked'), 400);
  $('#txForm button[type=submit]').focus();
});
function openTx(id, preset){
  if(localTabChanged)return toast('⚠️ Hay cambios en otra pestaña. Recarga antes de editar.');
  resetTxCategoryUI();
  quickExpanded=false;txMode = 'tx'; editingId = id || null; quickOK = !id && (!preset || Object.keys(preset).every(k => k === 'date'));
  const t = id ? state.transactions.find(x => x.id === id) : null;
  const p = t || preset || {};
  txRecId = p.recId || null;
  selCat = p.catId || null; txMethodExplicit=!!t||Object.prototype.hasOwnProperty.call(p,'method'); selMethod=txMethodExplicit?(p.method||''):null; selGoal = p.goalId || null;
  txType = p.type || txType; setMode(); setTxType(txType);
  $('#txTitle').textContent = t ? 'Editar movimiento' : (preset && preset.recId) ? 'Registrar recurrente' : (preset && preset.goalId) ? 'Aporte a meta' : 'Nuevo movimiento';
  $('#fAmount').value = p.amount || '';
  $('#fDate').value = p.date || todayISO();
  $('#fDesc').value = p.desc || '';
  $('#txDelete').style.display = t ? '' : 'none'; $('#txDup').style.display = t ? '' : 'none';
  setTxDetails(false);
  showTxDialog();
}
// Fecha y descripción plegadas en teléfono: el resumen muestra lo que se guardará.
function txDetailsLabel(){
  const d = $('#fDate').value, desc = $('#fDesc').value.trim(), today = todayISO();
  const dateText = !d || d === today ? 'Hoy' : d === BudgetFinance.dateOffset(today, -1) ? 'Ayer' : fmtDateLong(d);
  const hintText = txDialog.classList.contains('details-open') ? 'Ocultar detalles' : desc || 'Fecha y descripción';
  // WebKit puede cancelar el click si el change del campo reemplaza el texto
  // del botón pulsado. Conserva sus nodos cuando la etiqueta no cambia.
  if($('#txMoreDate').textContent!==dateText)$('#txMoreDate').textContent=dateText;
  if($('#txMoreHint').textContent!==hintText)$('#txMoreHint').textContent=hintText;
  $('#txMore').classList.toggle('has-desc', !!desc);
}
function setTxDetails(open){
  txDialog.classList.toggle('details-open', open); $('#txMore').setAttribute('aria-expanded', String(open)); txDetailsLabel();
}
$('#txMore').onclick = () => {
  const open=!txDialog.classList.contains('details-open');
  setTxDetails(open);
  if(!open)return;
  const details=$('#txDetails'), body=txDialog.querySelector('.dlg-body');
  motionAnimate(details, [{opacity:.85, transform:'translateY(-4px)'}, {opacity:1, transform:'none'}], 'panel');
  $('#fDateField .dp-trigger').focus({preventScroll:true});
  keepTxFieldVisible(details.offsetHeight + 16 <= body.clientHeight ? details : document.activeElement);
};
for (const ev of ['input','change']){ $('#fDate').addEventListener(ev, txDetailsLabel); $('#fDesc').addEventListener(ev, txDetailsLabel); }
function openRec(id, preset){
  resetTxCategoryUI();
  txMode = 'rec'; editingId = id || null; txRecId = null; selGoal = null; quickOK = false; $('#txDup').style.display = 'none';
  const r = id ? state.recurring.find(x => x.id === id) : null, pz = preset || {};
  selCat = r ? r.catId : pz.catId || null; txMethodExplicit=!!r||Object.prototype.hasOwnProperty.call(pz,'method'); selMethod=txMethodExplicit?((r||pz).method||''):null;
  txType = r ? r.type : pz.type || txType; setMode(); setTxType(txType);
  $('#txTitle').textContent = r ? 'Editar recurrente' : 'Nuevo recurrente';
  $('#fAmount').value = r ? r.amount : pz.amount || '';
  $('#fDay').value = r ? r.day : preset ? '' : new Date().getDate();
  updateRecDate();
  $('#fDesc').value = r ? r.desc : pz.desc || '';
  $('#fAuto').checked = r ? !!r.auto : true;
  $('#txDelete').style.display = r ? '' : 'none';
  showTxDialog(preset ? $('#recFixed') : null);
  if (preset) toast('Elige el día del mes en que te cobran', {icon:'calendar'});
}
function updateRecDate(){
  const day = Number($('#fDay').value), end = day === 31;
  $('#recFixed').setAttribute('aria-pressed', String(!end));
  $('#recMonthEnd').setAttribute('aria-pressed', String(end));
  $('#fDay').disabled = end;
  $('#recDateHint').textContent = end ? 'Siempre el último día: 28, 29, 30 o 31, según el mes.' : 'Elige del 1 al 31. Si el mes no tiene ese día, se usa su último día.';
  const valid = Number.isInteger(day) && day >= 1 && day <= 31;
  $('#recDatePreview').textContent = valid ? 'Fechas: ' + [0,1,2].map(n => fmtDateLong(dateFor(shiftMonth(thisMonth(), n), day))).join(' · ') : 'Ingresa un día para ver las próximas fechas.';
}
$('#fDay').addEventListener('input', updateRecDate);
$('#recMonthEnd').onclick = () => { $('#fDay').value = 31; updateRecDate(); };
$('#recFixed').onclick = () => { if ($('#fDay').disabled) $('#fDay').value = Math.min(30, new Date().getDate()); updateRecDate(); $('#fDay').focus(); };
// Borra con opción de deshacer (sin pedir confirmación)
function delTxUndo(id){
  if (localTabChanged) return;
  const t = state.transactions.find(x => x.id === id);
  const restore = removeTransactions([id]); if (!restore) return;
  save(); renderAll();
  toast('Movimiento eliminado', {icon:'trash-2', action:'Deshacer', onAction: () => {
    if (!restore()) return;
    const month = cycleView() ? cycleMonthForDate(t.date) : t.date.slice(0,7);
    if (month !== currentMonth){ currentMonth = month; monthInput.value = month; }
    save(); renderAll(); flashRow(t.id); toast('Movimiento restaurado', {icon:'undo-2'});
  }});
}
// Resalta brevemente una fila de la tabla de movimientos
function highlightSaved(id){
  if (reduceMotion()) return;
  const el = document.querySelector(`#movBody [data-row="${id}"]`) || document.querySelector(`[data-go-tx="${id}"]`) || document.querySelector(`#calDay [data-edit="${id}"]`)?.closest('.prow');
  if (!el) return; el.classList.remove('just'); void el.offsetWidth; el.classList.add('just');
  if (el.getBoundingClientRect().top > innerHeight - 80) el.scrollIntoView({block:'center', behavior:reduceMotion()?'instant':'smooth'});
}
function flashRow(id){const tr=document.querySelector(`#movBody [data-row="${id}"]`);motionAnimate(tr,[{background:'var(--primary-soft)'},{background:'transparent'}],'signal');}
function removeTransactions(ids){
  const profile = activeProfile, selected = new Set(ids), removed = [], addedSkips = [];
  state.transactions = state.transactions.filter((transaction, index) => {
    if (!selected.has(transaction.id)) return true;
    removed.push({transaction, index});
    if (transaction.recId){ // evita que un recurrente automático se vuelva a crear ese mes
      const rule = state.recurring.find(r => r.id === transaction.recId), month = transaction.date.slice(0,7);
      if (rule && !recSkipped(rule, month)){
        (rule.skipped ??= []).push(month);
        addedSkips.push({id:rule.id, month});
      }
    }
    return false;
  });
  if (!removed.length) return null;
  return () => {
    if (profile !== activeProfile || localTabChanged || localRecovery) return false;
    const existing = new Set(state.transactions.map(t => t.id));
    for (const {transaction, index} of removed){
      if (!existing.has(transaction.id)) state.transactions.splice(Math.min(index, state.transactions.length), 0, transaction);
    }
    for (const {id, month} of addedSkips){
      const rule = state.recurring.find(r => r.id === id);
      if (rule?.skipped && recDone(rule, month)) rule.skipped = rule.skipped.filter(value => value !== month);
    }
    return true;
  };
}
// Mensajes de validación del monto en español, sin depender del idioma del navegador.
$('#fAmount').addEventListener('invalid', e => { const v = e.target.validity; e.target.setCustomValidity(v.valueMissing ? 'Ingresa el monto.' : v.badInput ? 'Ingresa un número válido.' : v.rangeUnderflow ? 'El monto debe ser mayor que 0.' : v.stepMismatch ? 'Usa como máximo 2 decimales.' : ''); });
// El mensaje propio se limpia antes de cada validación (clic o Enter sobre Guardar) para no bloquear un valor ya corregido.
$('#fAmount').addEventListener('input', e => e.target.setCustomValidity(''));
$('#txForm').addEventListener('click', e => { if (e.target.closest('[type=submit],button:not([type])')) $('#fAmount').setCustomValidity(''); }, true);
$('#txForm').addEventListener('submit', async e => {
  e.preventDefault();
  if(localTabChanged)return toast('⚠️ Recarga para incorporar los cambios de otra pestaña.');
  if(!$('#txCategoryEditor').hidden){$('#txCategoryName').focus();return toast('Crea la categoría o cancela su edición antes de guardar.');}
  const amount = Math.round(parseFloat($('#fAmount').value) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return toast('Ingresa un monto válido');
  if (!selCat) return toast('Elige una categoría');
  const desc = $('#fDesc').value.trim();
  if (txMode === 'rec'){
    const day = Number($('#fDay').value);
    if (!Number.isInteger(day) || day < 1 || day > 31) return toast('Ingresa un día entero del 1 al 31');
    const data = {type:txType, amount, catId:selCat, method:selMethod, desc, day, auto:$('#fAuto').checked};
    const isNew = !editingId, month = thisMonth();
    const r = isNew ? {id:uid(), active:true, start:month, skipped:[], ...data} : state.recurring.find(x => x.id === editingId);
    if (!r) return toast('⚠️ El recurrente ya no está disponible. Cierra y vuelve a abrir el formulario.');
    if (isNew && r.auto && new Date().getDate() >= Math.min(day, daysIn(thisMonth()))){
      const yes = await ask({title:'¿Registrar también el de este mes?', msg:`La fecha de este mes (${fmtDateLong(dateFor(month, day))}) ya llegó. Si ya lo anotaste a mano, elige "No".`, ok:'Sí, registrar', cancel:'No', danger:false, icon:'🔁'});
      if (!txDialog.open || localTabChanged) return;
      if (!yes) r.skipped.push(month);
    }
    if (isNew) state.recurring.push(r); else Object.assign(r, data);
    const saved = save();
    txDialog.close(); if (saved) runAutoRecurring(true); renderAll();
    if (saved) toast(isNew ? 'Recurrente creado 🔁' : 'Recurrente actualizado');
    return;
  }
  if (!BudgetFinance.validDate($('#fDate').value)) return toast('Elige una fecha válida');
  const data = {type:txType, amount, catId:selCat, date:$('#fDate').value, method:selMethod, desc,
    goalId: selGoal && !$('#fGoalField').hidden ? selGoal : undefined};
  if (txRecId) data.recId = txRecId;
  // ¿Coincide con un recurrente de ese mes que aún no está registrado? Ofrecer vincularlo para no contarlo dos veces
  const prevTx = editingId && state.transactions.find(t => t.id === editingId);
  if (!data.recId && !(prevTx && prevTx.recId)){
    const mm = data.date.slice(0, 7);
    const r = state.recurring.find(r => r.active !== false && (!r.start || r.start <= mm) && r.type === data.type && r.catId === data.catId && Math.abs(Number(r.amount) - amount) <= Math.max(1, Number(r.amount) * .05) && !recDone(r, mm));
    if (r){
      const yes = await ask({title:`¿Es el pago de «${r.desc || getCat(r.catId).name}»?`, msg:`Lo marco como el pago de ${monthLong(mm)} de ese recurrente, así no se registra dos veces.`, ok:'Sí, vincular', cancel:'No', danger:false, icon:'🔁'});
      if (!txDialog.open || localTabChanged) return;
      const rule = state.recurring.find(candidate => candidate.id === r.id);
      if (yes && rule && !recDone(rule, mm)){
        data.recId = rule.id;
        rule.skipped = (rule.skipped || []).filter(month => month !== mm);
      }
    }
  }
  if (editingId){
    const transaction = state.transactions.find(t => t.id === editingId);
    if (!transaction) return toast('⚠️ El movimiento ya no está disponible. Cierra y vuelve a abrir el formulario.');
    Object.assign(transaction, data);
  }
  else state.transactions.push({id:uid(), created:Date.now(), ...data});
  const savedId = editingId || state.transactions[state.transactions.length - 1].id;
  const saved = save(); txDialog.close();
  const mov = cycleView()?cycleMonthForDate(data.date):data.date.slice(0,7);
  if (mov !== currentMonth){ currentMonth = mov; monthInput.value = mov; }
  renderAll(); if (saved) toast(editingId ? 'Movimiento actualizado ✅' : 'Movimiento registrado ✅');
  requestAnimationFrame(() => highlightSaved(savedId));
});
// En el celular, Eliminar y Duplicar quedan como íconos para que quepan los cuatro botones
$('#txDelete').innerHTML = ic('trash-2') + '<span class="hide-m">Eliminar</span>'; $('#txDelete').setAttribute('aria-label', 'Eliminar'); $('#txDelete').title = 'Eliminar';
$('#txDup').innerHTML = ic('copy') + '<span class="hide-m">Duplicar</span>'; $('#txDup').setAttribute('aria-label', 'Duplicar');
$('#txDup').onclick = () => {
  const t = state.transactions.find(x => x.id === editingId); if (!t) return;
  txDialog.close();
  setTimeout(() => { openTx(null, {type:t.type, catId:t.catId, amount:t.amount, method:t.method, desc:t.desc, goalId:t.goalId, date:todayISO()}); $('#txTitle').textContent = 'Duplicar movimiento'; }, 120);
};
$('#txDelete').onclick = async () => {
  if (txMode === 'rec'){
    if (!(await ask({title:'¿Eliminar este recurrente?', msg:'Los movimientos que ya registró se mantienen.'}))) return;
    state.recurring = state.recurring.filter(r => r.id !== editingId);
    save(); txDialog.close(); renderAll(); return toast('Recurrente eliminado');
  }
  const id = editingId; txDialog.close(); delTxUndo(id);
};
$('#fab').onclick = () => activeTab()==='goals'?openGoal():(activeTab() === 'movs' && movView === 'rec' ? openRec() : openTx(null, activeTab()==='movs' && movView==='cal' && calSel ? {date:calSel} : {})); // el + respeta el día seleccionado en Calendario
$('#fab').insertAdjacentHTML('beforeend','<span class="fab-label">Nuevo</span>');
// En teléfono el botón se atenúa mientras se desplaza la página y vuelve 450 ms después; siempre recibe toques.
const fabDock=matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
let fabScrollTimer,fabTouchActive=false;
function showFloatingNew(){clearTimeout(fabScrollTimer);$('#fab').classList.remove('fab-scroll-hidden');}
function fadeFloatingNewOnScroll(){
  const button=$('#fab');if(!fabDock.matches||button.hidden||txDialog.open||button.matches(':focus-visible'))return;
  button.classList.add('fab-scroll-hidden');clearTimeout(fabScrollTimer);
  if(!fabTouchActive)fabScrollTimer=setTimeout(showFloatingNew,450);
}
document.addEventListener('touchstart',()=>{fabTouchActive=true;},{passive:true});
for(const type of ['touchend','touchcancel'])document.addEventListener(type,()=>{fabTouchActive=false;if($('#fab').classList.contains('fab-scroll-hidden')){clearTimeout(fabScrollTimer);fabScrollTimer=setTimeout(showFloatingNew,450);}},{passive:true});
window.addEventListener('scroll',fadeFloatingNewOnScroll,{passive:true});
fabDock.addEventListener('change',showFloatingNew);
const txPhone=matchMedia('(max-width:700px), (max-width:960px) and (max-height:500px) and (pointer:coarse)');
function showTxDialog(preferredFocus){
 resizeTxViewport();
 txDialog.showModal();
 const focus=txPhone.matches ? txDialog.querySelector('.dlg-head [data-close]') : preferredFocus||$('#fAmount');
 focus.focus({preventScroll:true});
 txDialog.querySelector('.dlg-body').scrollTop=0;
}
// En el celular el teclado tapa la parte baja de la pantalla: la hoja se apoya sobre él y el campo activo queda a la vista.
function keepTxFieldVisible(field=document.activeElement){
 const body=txDialog.querySelector('.dlg-body');if(!txDialog.open||!field||!body.contains(field))return;
 const b=body.getBoundingClientRect(),r=field.getBoundingClientRect();
 if(r.bottom>b.bottom-8)body.scrollTop+=r.bottom-b.bottom+8;else if(r.top<b.top+8)body.scrollTop-=b.top+8-r.top;
}
let txViewportRef={w:0,h:0},txViewportFrame=0;
function resizeTxViewport(){
 const root=document.documentElement,vv=window.visualViewport, useVisual=vv&&Math.abs(vv.scale-1)<.02;
 const h=useVisual?vv.height:innerHeight;
 const bottom=useVisual?Math.max(0,Math.ceil(innerHeight-h-vv.offsetTop)):0;
 const zoom=Number(getComputedStyle(root).zoom)||1;
 root.style.setProperty('--visible-bottom',bottom/zoom+'px');
 txDialog.style.setProperty('--tx-viewport',Math.max(0,Math.floor(h)-12)/zoom+'px');
 // Teclado abierto (o ventana visible muy baja): la hoja oculta lo secundario para que monto, categoría y Guardar sigan a la vista.
 // La referencia es la mayor altura vista con el mismo ancho (un giro de pantalla la reinicia).
 if(txViewportRef.w!==innerWidth)txViewportRef={w:innerWidth,h:0};txViewportRef.h=Math.max(txViewportRef.h,innerHeight,h);
 txDialog.classList.toggle('kb-open',txPhone.matches&&(bottom>100||h<txViewportRef.h*.75));
}
function scheduleTxViewport(){
 if(txViewportFrame)return;
 txViewportFrame=requestAnimationFrame(()=>{txViewportFrame=0;resizeTxViewport();keepTxFieldVisible();});
}
window.addEventListener('resize',scheduleTxViewport);
window.visualViewport?.addEventListener('resize',scheduleTxViewport);
window.visualViewport?.addEventListener('scroll',scheduleTxViewport);
// Solo los campos editables requieren compensar el teclado. Desplazar un botón
// entre pointerdown y click puede cancelar el toque en WebKit.
txDialog.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select'))requestAnimationFrame(()=>keepTxFieldVisible());});
resizeTxViewport();
$('#btnNewTx').onclick = () => openTx();
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => b.closest('dialog').close());

/* Re-dibuja sin perder el campo al que el usuario pasó con Tab o clic */
function keepFocus(render){
  setTimeout(() => {
    const a = document.activeElement, key = a && (a.dataset.bud ? `[data-bud="${a.dataset.bud}"]`
      : a.dataset.act && a.closest('.cat-row') ? `.cat-row[data-id="${a.closest('.cat-row').dataset.id}"] [data-act="${a.dataset.act}"]` : null);
    const pos = key && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null;
    render();
    const el = key && document.querySelector(key);
    if (el){ el.focus({preventScroll:true}); try{ if (pos) el.setSelectionRange(...pos); else el.select && el.select(); }catch(e){} }
  }, 0);
}

// Una acción global, contextual y ausente en pantallas de configuración.
function updateCreationControls(){
 const button=$('#fab'),tab=activeTab(),rec=tab==='movs'&&movView==='rec';
 button.hidden=bothMode||['settings','cats'].includes(tab)||(tab==='goals'&&!$('#btnNewGoal').hidden);
 button.title=tab==='goals'?'Nueva meta':rec?'Nuevo recurrente':'Nuevo movimiento';button.setAttribute('aria-label',button.title);
 button.querySelector('.fab-label').textContent=button.title;
 $('#btnNewTx').hidden=true;$('#btnNewRec').hidden=true;
}
