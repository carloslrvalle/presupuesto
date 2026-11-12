// Presupuesto: analysis.js — ver README.md del proyecto para responsabilidades y orden de carga.
/* ---------- Análisis ---------- */
let chYear, analysisData, analysisSelectedMonth='', analysisDetailPeriod='', analysisChartMode='month', analysisMetric='income';
const mobileAnalysis=()=>matchMedia('(max-width:700px)').matches;
const curIdxOf = (y, tm) => tm.slice(0, 4) === y ? Number(tm.slice(5, 7)) - 1 : -1;
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const fmt0 = n => n ? Math.round(n).toLocaleString('es-PE') : '–';
const alphaHex = a => Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
const ANALYSIS_METRICS={
  income:{label:'Ingresos',title:'Ingresos mes a mes',color:'--income-chart',help:'Ingresos registrados; no incluye cobros programados.'},
  expense:{label:'Gastos',title:'Gastos mes a mes',color:'--expense-chart',help:'Gastos registrados, incluido lo que separas en categorías de ahorro; no incluye pagos programados.'},
  savings:{label:'Ahorro',title:'Ahorro mes a mes',color:'--k-violet',help:'Ahorro de cada mes según la forma de ahorro que elegiste.'},
  rate:{label:'Tasa de ahorro',title:'Tasa de ahorro mes a mes',color:'--primary',help:'Ahorro sobre los ingresos del mes. Sin ingresos, no hay tasa.'}
};
const ANALYSIS_ACCUMULATED = {
  income:{title:'Ingresos acumulados',help:'Suma de los ingresos registrados desde enero hasta el mes seleccionado.'},
  expense:{title:'Gastos acumulados',help:'Suma de los gastos registrados desde enero hasta el mes seleccionado.'},
  savings:{title:'Ahorro acumulado',help:'Suma del ahorro desde enero hasta el mes seleccionado, según la forma de ahorro elegida.'},
  rate:{title:'Tasa de ahorro acumulada',help:'Ahorro acumulado dividido entre ingresos acumulados desde enero hasta el mes seleccionado. Sin ingresos acumulados, no hay tasa.'}
};
const analysisPercent=value=>value==null?'—':Number(value).toLocaleString('es-PE',{maximumFractionDigits:1,minimumFractionDigits:1})+'%';
const analysisFormat=value=>value==null?(analysisMetric==='rate'?'Sin ingresos':'Sin datos'):analysisMetric==='rate'?analysisPercent(value):fmt(value);
function analysisValues(){
  const data = analysisData;
  if (analysisChartMode === 'total') return data.cumulative[analysisMetric];
  if (analysisMetric === 'income') return data.tot.map(month => month.inc);
  if (analysisMetric === 'expense') return data.tot.map(month => month.exp);
  return analysisMetric === 'rate' ? data.rates : data.bal;
}
function analysisMonthlyValue(month){
  const d=analysisData,index=d?.months.indexOf(month)??-1;
  if(index>=0)return analysisMetric==='income'?d.tot[index].inc:analysisMetric==='expense'?d.tot[index].exp:analysisMetric==='rate'?d.rates[index]:d.bal[index];
  const tx=txOfMonth(month),income=sum(tx.filter(t=>t.type==='income'));
  return analysisMetric==='income'?income:analysisMetric==='expense'?sum(tx.filter(t=>t.type==='expense')):analysisMetric==='rate'?(income?savingsOf(month).saved/income*100:null):savingsOf(month).saved;
}
function analysisDisplayValue(month){
  if (analysisChartMode !== 'total') return analysisMonthlyValue(month);
  const index = analysisData.months.indexOf(month);
  if (index < 0) return analysisMetric === 'rate' ? null : 0;
  return analysisData.cumulative[analysisMetric][index];
}
function analysisPreviousLabel(month){
  if (analysisChartMode !== 'total') return monthLong(shiftMonth(month,-1));
  return month.endsWith('-01') ? 'Inicio de '+month.slice(0,4) : 'Hasta '+monthLong(shiftMonth(month,-1));
}
function analysisCumulativeSeries(totals, savings, available){
  let income = 0, expense = 0, saved = 0;
  const series = {income:[], expense:[], savings:[], rate:[]};
  totals.forEach((month, index) => {
    income += month.inc;
    expense += month.exp;
    saved += savings[index];
    const hasData = available[index] != null;
    series.income.push(hasData ? income : null);
    series.expense.push(hasData ? expense : null);
    series.savings.push(hasData ? saved : null);
    series.rate.push(hasData && income > 0 ? saved / income * 100 : null);
  });
  return series;
}
function analysisChange(current,previous){
  if(current==null||previous==null)return 'Sin base comparable';
  const difference=current-previous;if(Math.abs(difference)<.005)return 'Sin cambio';
  if(analysisMetric==='rate')return (difference>0?'+':'−')+Math.abs(difference).toFixed(1)+' pp';
  if(Math.abs(previous)<.005)return 'Sin base previa';
  return (difference>0?'+':'−')+(Math.abs(difference)/Math.abs(previous)*100).toFixed(1)+'%';
}
function analysisThrough(month,day){
  const end=dateFor(month,day), tx=txOfMonth(month).filter(t=>t.date<=end);
  if(analysisMetric==='income'||analysisMetric==='expense')return sum(tx.filter(t=>t.type===analysisMetric));
  const savings=BudgetFinance.savings(tx,{
    savingIds:state.categories.filter(c=>isSavingCat(c.id)).map(c=>c.id),
    mode:saveMode(),pct:savePctOf(month)
  });
  return analysisMetric==='rate'?savings.rate:savings.saved;
}
function renderYearReadout(){
  const el=$('#yearReadout'),data=analysisData;if(!data||data.first<0){el.innerHTML='';return;}
  const month=analysisSelectedMonth, previousMonth=shiftMonth(month,-1), inProgress=month===thisMonth();
  const matched=inProgress&&analysisChartMode==='month', day=matched?Math.min(Number(todayISO().slice(8)),daysIn(previousMonth)):null;
  const months=data.months.filter((value,j)=>value===month||data.cum[j]!=null);
  const current=matched?analysisThrough(month,day):analysisDisplayValue(month);
  const previous=matched?analysisThrough(previousMonth,day):analysisDisplayValue(previousMonth);
  const range=matched?`Del 1 al ${day} de cada mes`:inProgress?`Hasta el ${fmtDateLong(todayISO())}`:'';
  const change=analysisChange(current,previous),difference=current!=null&&previous!=null?current-previous:0,tone=Math.abs(difference)<.005?'neutral':((difference>0)===(analysisMetric==='expense')?'bad':'good');
  el.innerHTML=`<div class="year-readout-month"><div class="analysis-month-caption" id="analysisMonthCaption">Mes seleccionado${inProgress?'<span class="analysis-period-state">En curso</span>':''}</div><details class="analysis-month-picker"><summary id="analysisMonthTrigger" aria-labelledby="analysisMonthCaption analysisMonthName"><span class="analysis-month-icon" aria-hidden="true">${ic('calendar')}</span><span id="analysisMonthName">${esc(monthLong(analysisSelectedMonth))}</span>${CHEV}</summary><div class="analysis-month-menu"><div class="analysis-month-year">${analysisSelectedMonth.slice(0,4)}<span>Elegir mes</span></div><div class="analysis-month-options">${months.map(m=>`<button type="button" data-analysis-month="${m}" aria-pressed="${m===analysisSelectedMonth}"><span>${esc(monthLong(m).replace(/ \d{4}$/,''))}</span>${m===analysisSelectedMonth?CHECK:''}</button>`).join('')}</div></div></details><select id="yearReadoutMonth" hidden aria-hidden="true" tabindex="-1">${months.map(m=>`<option value="${m}"${m===analysisSelectedMonth?' selected':''}>${esc(monthLong(m))}</option>`).join('')}</select></div><dl><div><dt>${analysisChartMode==='total'?(analysisMetric==='rate'?'Tasa acumulada':'Acumulado'):ANALYSIS_METRICS[analysisMetric].label}</dt><dd data-analysis-value="current">${analysisFormat(current)}</dd></div><div><dt>${analysisPreviousLabel(analysisSelectedMonth)}</dt><dd data-analysis-value="previous">${analysisFormat(previous)}</dd></div></dl>${range?`<p class="analysis-range small muted">${range}</p>`:''}<span class="analysis-change" data-tone="${tone}" data-analysis-value="change" title="${analysisMetric==='rate'?'Diferencia en puntos porcentuales entre ambas tasas.':'Diferencia relativa respecto al período anterior.'}">${change}${change.startsWith('+')||change.startsWith('−')?(analysisChartMode==='total'?' vs. acumulado anterior':matched?' vs. mismo tramo anterior':' vs. mes anterior'):''}</span>${analysisChartMode==='total'?`<span class="analysis-accumulated">${ANALYSIS_METRICS[analysisMetric].label} del mes: <b>${analysisFormat(analysisMonthlyValue(analysisSelectedMonth))}</b></span>`:''}`;
}
function selectAnalysisMonth(month){
  if (!month) return;
  if (month !== currentMonth) goMonth(month, false);
  else { renderYearReadout(); renderAnalysisDetails(); }
}
function renderAnalysisChart(){
  const data=analysisData,phone=mobileAnalysis(),metric=ANALYSIS_METRICS[analysisMetric],cumulative=analysisChartMode==='total',percentage=analysisMetric==='rate',line=cumulative||percentage;
  const last=data.months.findLastIndex((_,i)=>data.cum[i]!=null),indices=data.months.map((_,i)=>i).slice(data.first,last+1);
  const values=analysisValues(),color=cssVar(metric.color),negative=cssVar('--expense-chart');
  const surface=cssVar('--surface'), textColor=cssVar('--text');
  const seriesKey=JSON.stringify([activeProfile,data.months[0],analysisMetric,analysisChartMode]);
  const chartKey=JSON.stringify([seriesKey,phone,reduceMotion(),indices,values,color,negative,curFont().id,isDarkUI(),...['--surface','--text','--muted','--bg','--border'].map(cssVar)]);
  if (chYear?.$analysisKey === chartKey){ chYear.resize(); chYear.update('none'); return; }
  const animate=!reduceMotion() && chYear?.$analysisSeries !== seriesKey;
  chYear?.destroy();
  chYear=null;
  if(values.every(v=>v==null)){$('#yearWrap').innerHTML=emptyBox('chart-line','Registra ingresos para calcular la tasa de ahorro.');return;}
  if(['income','expense'].includes(analysisMetric)&&values.every(v=>v===0)){$('#yearWrap').innerHTML=emptyBox('chart-column','No hay '+metric.label.toLowerCase()+' registrados en este año.');return;}
  if (!loadChartFor($('#yearWrap'))) return;
  chartTheme();
  const dataset={type:line?'line':'bar',label:cumulative?ANALYSIS_ACCUMULATED[analysisMetric].title:metric.label,unit:percentage?'pct':'money',data:indices.map(i=>values[i]),yAxisID:'y',borderColor:line?color:undefined,
    backgroundColor:ctx=>{const base=!line&&ctx.raw<0?negative:color;return !line&&data.months[indices[ctx.dataIndex]]!==analysisSelectedMonth?mixHex(base,surface,.40):base;},
    borderWidth:line?2:0,borderRadius:4,borderSkipped:false,maxBarThickness:phone?44:58,categoryPercentage:.64,barPercentage:.85,tension:0,fill:false,spanGaps:false,
    pointRadius:ctx=>data.months[indices[ctx.dataIndex]]===analysisSelectedMonth?5:2,pointHoverRadius:6,pointHitRadius:12,pointBackgroundColor:color,pointBorderColor:surface,pointBorderWidth:1.5};
  const valid=dataset.data.filter(v=>v!=null),lower=Math.min(0,...valid),upper=Math.max(0,...valid),span=upper-lower||1;
  const step=10**Math.floor(Math.log10(span));
  const domainMin=lower<0?(percentage?Math.floor((lower-span*.1)/step)*step:lower-span*.16):0,domainMax=upper>0?(percentage?Math.ceil((upper+span*.1)/step)*step:upper+span*.16):(lower<0?0:1);
  // Revela el trazo real y desplaza su punta sobre cada segmento, sin mover los datos.
  const trace={id:'analysisLineTrace',
    afterInit(chart){if(line)chart.$analysisTrace={progress:animate?0:1,start:null,raf:0,head:null};},
    beforeUpdate(chart,args){const t=chart.$analysisTrace;if(t&&args.mode==='none'){cancelAnimationFrame(t.raf);t.raf=0;t.progress=1;}},
    resize(chart){const t=chart.$analysisTrace;if(t&&t.start!=null){cancelAnimationFrame(t.raf);t.raf=0;t.progress=1;}},
    beforeDatasetDraw(chart,args){
      const t=chart.$analysisTrace;if(!t||t.progress>=1||args.index!==0)return;
      if(reduceMotion()){t.progress=1;return;}
      const points=chart.getDatasetMeta(0).data,valid=points.filter(p=>!p.skip),segments=[];
      let length=0;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(a.skip||b.skip)continue;const distance=Math.hypot(b.x-a.x,b.y-a.y);segments.push({a,b,distance});length+=distance;}
      if(!valid.length){t.progress=1;return;}
      let remaining=length*motionTraceEase(t.progress),head={x:valid[0].x,y:valid[0].y};
      for(const {a,b,distance} of segments){const fraction=distance?Math.min(1,remaining/distance):1;head={x:a.x+(b.x-a.x)*fraction,y:a.y+(b.y-a.y)*fraction};if(remaining<=distance)break;remaining-=distance;}
      t.head=head;chart.ctx.save();chart.ctx.beginPath();chart.ctx.rect(chart.chartArea.left-8,chart.chartArea.top-8,Math.max(0,head.x-chart.chartArea.left+8),chart.chartArea.height+16);chart.ctx.clip();t.clipped=true;
    },
    afterDatasetDraw(chart){const t=chart.$analysisTrace;if(!t?.clipped)return;chart.ctx.restore();t.clipped=false;const {ctx}=chart,{x,y}=t.head;ctx.save();ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=surface;ctx.stroke();ctx.restore();},
    afterDraw(chart){const t=chart.$analysisTrace;if(!t||t.progress>=1||t.raf)return;t.raf=requestAnimationFrame(now=>{t.raf=0;if(!chart.canvas)return;t.start??=now;t.progress=reduceMotion()?1:Math.max(0,Math.min(1,(now-t.start)/MOTION.trace));chart.draw();});},
    afterDestroy(chart){const t=chart.$analysisTrace;if(t)cancelAnimationFrame(t.raf);}
  };
  const valueLabels={id:'yearValueLabels',afterDatasetsDraw(chart){
    if(indices.length>3)return;
    const {ctx,chartArea:area}=chart,meta=chart.getDatasetMeta(0);ctx.save();ctx.font='600 12px '+curFont().body;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=textColor;
    meta.data.forEach((point,i)=>{const value=dataset.data[i];if(value==null||point.skip||(chart.$analysisTrace?.progress<1&&point.x>chart.$analysisTrace.head?.x))return;
      let text=analysisFormat(value),width=ctx.measureText(text).width;
      if(width>(area.width/indices.length)*.8){text=percentage?analysisPercent(value):compactS(value);width=ctx.measureText(text).width;}
      const x=Math.max(area.left+width/2,Math.min(area.right-width/2,point.x)),rawY=point.y+(value<0?16:-16),y=Math.max(area.top+8,Math.min(area.bottom-8,rawY));
      ctx.fillText(text,x,y);
    });ctx.restore();
  }};
  if(!$('#chYear'))$('#yearWrap').innerHTML='<canvas id="chYear"></canvas>';
  chYear=new Chart($('#chYear'),{
    type:line?'line':'bar',plugins:[trace,valueLabels],data:{labels:indices.map(i=>MONTHS_ES[i]),datasets:[dataset]},
    options:{maintainAspectRatio:false,
      // Las barras crecen desde cero; las líneas se revelan con su punto viajero.
      animation:!animate||line?false:{duration:MOTION.data,easing:MOTION.dataEasing},
      animations:line?false:{numbers:{duration:0},colors:{duration:0},y:{type:'number',properties:['y'],duration:MOTION.data,easing:MOTION.dataEasing,from:ctx=>ctx.chart.scales.y.getPixelForValue(0)}},
      transitions:{active:{animation:{duration:0}},resize:{animation:{duration:0}}},
      interaction:{mode:'index',intersect:false},layout:{padding:{top:indices.length<=3?24:8,right:12,bottom:8}},
      onClick:(event,items)=>{const item=items[0];if(item)selectAnalysisMonth(data.months[indices[item.index]]);},
      plugins:{legend:{display:false},tooltip:{enabled:!phone,callbacks:{title:items=>items.length?monthLong(data.months[indices[items[0].dataIndex]]):'',label:ctx=>' '+dataset.label+': '+analysisFormat(ctx.parsed.y)}}},
      scales:{x:{offset:true,grid:{display:false},border:{display:false},ticks:{maxRotation:0,autoSkip:false,maxTicksLimit:12,callback:function(value){const label=this.getLabelForValue(value);return phone&&innerWidth<=440?label.slice(0,1):label;},color:ctx=>data.months[indices[ctx.index]]===analysisSelectedMonth?cssVar('--text'):cssVar('--muted'),font:ctx=>({size:phone?10:12,weight:data.months[indices[ctx.index]]===analysisSelectedMonth?700:400}),padding:10}},
        y:{min:domainMin,max:domainMax,afterBuildTicks:trimTicks,grid:{color:ctx=>mixHex(cssVar(ctx.tick.value===0?'--muted':'--border'),cssVar('--surface'),ctx.tick.value===0?.42:.38),lineWidth:ctx=>ctx.tick.value===0?1.2:1},border:{display:false},ticks:{precision:2,callback:value=>percentage?Number(value).toLocaleString('es-PE',{maximumFractionDigits:1})+'%':value&&Math.abs(value)<1?fmt(value):compactS(value),maxTicksLimit:phone?4:5,font:{size:phone?11:12},padding:8}}}}
  });
  chYear.$analysisKey=chartKey;
  chYear.$analysisSeries=seriesKey;
}
function renderMobileYearDetail(){
  const d=analysisData,{grid,tot,months}=d,y=months[0].slice(0,4),el=$('#yearMobileDetail');
  if(d.first<0){el.innerHTML=emptyBox('list',`Aún no hay registros en ${y}.`,null,'',true);return;}
  if(analysisDetailPeriod!=='year'&&!months.includes(analysisDetailPeriod))analysisDetailPeriod=analysisSelectedMonth;
  const all=analysisDetailPeriod==='year',index=months.indexOf(analysisDetailPeriod),amount=values=>all?values.reduce((a,b)=>a+(b||0),0):values[index];
  const selector=`<label class="analysis-period-label" for="analysisDetailPeriod">Ver importes de</label><select id="analysisDetailPeriod"><option value="year"${all?' selected':''}>Todo ${y}</option>${months.map(m=>`<option value="${m}"${m===analysisDetailPeriod?' selected':''}>${esc(monthLong(m))}</option>`).join('')}</select>`;
  const type=analysisMetric,total=amount(tot.map(t=>type==='income'?t.inc:t.exp));
  const list=catsOf(type).map(c=>({c,values:grid[type+':'+c.id]})).concat([{c:getCat(null),values:grid[type+':_none']}]).filter(x=>x.values&&amount(x.values));
  el.innerHTML=selector+`<div class="mobile-year-section"><h4>${ANALYSIS_METRICS[type].label}<span data-year-detail="${type}">${fmt(total)}</span></h4>${list.sort((a,b)=>amount(b.values)-amount(a.values)).map(({c,values})=>`<div class="mobile-year-item${Math.abs(amount(values))>=100000?' large-value':''}"><span class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</span><span>${esc(c.name)}</span><b data-category-amount="${esc(c.id)}">${fmt(amount(values))}</b></div>`).join('')||'<p class="small muted">Sin movimientos registrados.</p>'}</div>`;
}
function renderAnalysisDetails(){
  const d=analysisData;if(!d)return;const {grid,tot,months}=d,y=months[0].slice(0,4),metric=ANALYSIS_METRICS[analysisMetric];
  const detail = $('#analysisCategoryDetail');
  detail.hidden = analysisMetric !== 'income' && analysisMetric !== 'expense';
  if (detail.hidden) return;
  $('#analysisDetailHint').textContent=metric.label+' · '+y;
  $('#analysisMovementsAction').innerHTML=`<button type="button" class="btn sm" data-analysis-movements="${analysisMetric}">${ic('list')} Ver movimientos del año</button>`;
  renderMobileYearDetail();
  const selectedIndex=months.indexOf(analysisSelectedMonth),head=`<thead><tr><th>Categoría</th>${MONTHS_ES.map((name,i)=>`<th class="num${i===selectedIndex?' cur':''}">${name}</th>`).join('')}<th class="num">Total</th></tr></thead>`;
  const sum=values=>values.reduce((a,v)=>a+(v||0),0),row=(label,values,total)=>`<tr><td>${label}</td>${values.map(v=>`<td class="num">${fmt0(v)}</td>`).join('')}<td class="num"><b>${fmt0(total)}</b></td></tr>`;
  const type=analysisMetric,keys=catsOf(type).map(c=>({c,values:grid[type+':'+c.id]})).concat([{c:getCat(null),values:grid[type+':_none']}]).filter(x=>x.values);
  let rows=keys.sort((a,b)=>sum(b.values)-sum(a.values)).map(({c,values})=>row(`<div class="catcell"><div class="ico" style="background:${soft(c.color)}">${iconHTML(c.icon,c.color)}</div><span class="yn">${esc(c.name)}</span></div>`,values,sum(values))).join('');
  const values=tot.map(t=>type==='income'?t.inc:t.exp);rows+=row('Total '+metric.label.toLowerCase(),values,sum(values));
  $('#yearTable').innerHTML=d.first<0?emptyBox('list',`Sin registros en ${y}.`,null,'',true):`<table class="year-table">${head}<tbody>${rows}</tbody></table>`;

}
$('#anKpis').addEventListener('click', e => {
  const button = e.target.closest('[data-analysis-metric]');
  if (!button || button.dataset.analysisMetric === analysisMetric) return;
  analysisMetric = button.dataset.analysisMetric;
  for (const metric of $('#anKpis').children){
    const selected = metric === button;
    metric.classList.toggle('selected', selected);
    metric.setAttribute('aria-pressed', String(selected));
    metric.querySelector('.metric-selection').innerHTML = ic(selected ? 'check' : 'chevron-down');
  }
  renderAnalysisSelection();
  enhanceAccessibility();
});
document.addEventListener('click',e=>{const link=e.target.closest('[data-analysis-movements]');if(link)openMovs({scope:'year',type:link.dataset.analysisMovements});});
$('#yearChartModes').addEventListener('click', e => {
  const button = e.target.closest('[data-year-mode]');
  if (!button || button.dataset.yearMode === analysisChartMode) return;
  analysisChartMode = button.dataset.yearMode;
  renderAnalysisSelection();
  enhanceAccessibility();
});
document.addEventListener('change',e=>{
  if(e.target.id==='yearReadoutMonth'){const focused=document.activeElement===e.target||!!document.activeElement?.closest('.analysis-month-picker');selectAnalysisMonth(e.target.value);if(focused)$('#analysisMonthTrigger').focus({preventScroll:true});return;}
  if(e.target.id==='analysisDetailPeriod'){
    const focused=document.activeElement===e.target;
    analysisDetailPeriod=e.target.value;
    if(analysisDetailPeriod==='year') renderAnalysisDetails();
    else selectAnalysisMonth(analysisDetailPeriod);
    if(focused)$('#analysisDetailPeriod').focus({preventScroll:true});
  }
});

// El menú se abre hacia el lado con espacio y conserva su desplazamiento interno.
document.addEventListener('toggle',e=>{
 const picker=e.target;if(!picker.matches?.('.analysis-month-picker')||!picker.open)return;
 const rect=picker.getBoundingClientRect(),header=document.querySelector('.topbar').getBoundingClientRect();
 const top=Math.max(12,header.bottom+12),bottom=innerHeight-(matchMedia('(max-width:700px)').matches?92:16);
 const above=rect.top-top,below=bottom-rect.bottom,up=below<340&&above>below;
 picker.classList.toggle('opens-up',up);
 picker.style.setProperty('--month-menu-space',Math.max(100,Math.min(280,(up?above:below)-68))+'px');
 const list=picker.querySelector('.analysis-month-options'),selected=list.querySelector('[aria-pressed=true]');
 if(selected)list.scrollTop=selected.offsetTop-list.offsetTop-list.clientHeight/2+selected.offsetHeight/2;
},true);
// Delegación única: el panel se vuelve a dibujar al seleccionar una barra o un mes.
document.addEventListener('click',e=>{
 const option=e.target.closest('[data-analysis-month]');
 if(option){const select=$('#yearReadoutMonth');select.value=option.dataset.analysisMonth;select.dispatchEvent(new Event('change',{bubbles:true}));return;}
 const picker=$('.analysis-month-picker');if(picker?.open&&!picker.contains(e.target))picker.open=false;
});
document.addEventListener('keydown',e=>{
 const picker=e.target.closest('.analysis-month-picker');if(!picker)return;
 if(e.key==='Escape'&&picker.open){e.preventDefault();picker.open=false;$('#analysisMonthTrigger').focus();return;}
 if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();picker.open=true;
 const options=[...picker.querySelectorAll('[data-analysis-month]')];
 let i=options.indexOf(document.activeElement);
 if(i<0)i=options.findIndex(b=>b.getAttribute('aria-pressed')==='true');
 else i=Math.max(0,Math.min(options.length-1,i+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1)));
 if(e.key==='Home')i=0;if(e.key==='End')i=options.length-1;
 options[i]?.focus({preventScroll:true});options[i]?.scrollIntoView({block:'nearest'});
});

matchMedia('(max-width:700px)').addEventListener('change',()=>{
  dirty.add('analysis');
  if(activeTab()==='analysis') renderView('analysis');
});

function renderAnalysis(){
  const y = currentMonth.slice(0,4), tm = thisMonth();
  const months = MONTHS_ES.map((_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
  $('#yearLabel').textContent = y;
  const yearTx = state.transactions.filter(t => t.date.slice(0,4) === y && !isPlanned(t));
  const grid = {};
  yearTx.forEach(t => {
    const known = state.categories.some(c => c.id === t.catId);
    const k = t.type + ':' + (known ? t.catId : '_none');
    (grid[k] = grid[k] || Array(12).fill(0))[Number(t.date.slice(5,7)) - 1] += Number(t.amount) || 0;
  });
  const tot = months.map((_, i) => ({
    inc: Object.keys(grid).filter(k => k.startsWith('income:')).reduce((a,k) => a + grid[k][i], 0),
    exp: Object.keys(grid).filter(k => k.startsWith('expense:')).reduce((a,k) => a + grid[k][i], 0)}));
  const nData = tot.filter(t => t.inc || t.exp).length, withData = nData || 1;
  const yInc = tot.reduce((a,t) => a + t.inc, 0), yExp = tot.reduce((a,t) => a + t.exp, 0);

  // KPIs del año (el ahorro se mide igual que en el Resumen: lo que separo o lo que sobra)
  const savings = months.map(savingsOf);
  const ySv = savings.reduce((a, v, i) => { a.saved += v.saved; if (v.pct && v.inc && months[i] <= tm){ a.goalMonths++; if (v.saved >= v.target) a.hit++; } return a; }, {saved:0, goalMonths:0, hit:0});
  const kpi=(id,icon,value,sub,cls='')=>{const metric=ANALYSIS_METRICS[id],on=analysisMetric===id;return `<button type="button" class="card kpi analysis-metric${on?' selected':''}" data-analysis-metric="${id}" aria-pressed="${on}" aria-controls="yearChartCard"><div class="label"><span class="dot" style="color:var(${metric.color});background:color-mix(in srgb,var(${metric.color}) 14%,var(--surface))">${ic(icon)}</span>${metric.label}</div><span class="metric-selection" aria-hidden="true">${ic(on?'check':'chevron-down')}</span><div class="value ${cls}" data-k="an:${id}" data-num="${typeof value==='number'?value:''}" data-kind="${id==='rate'?'pct':'money'}">${typeof value==='number'?'':value}</div><div class="small muted">${sub}</div></button>`;};
  const caption=(mobile,desktop)=>'<span class="metric-caption-mobile">'+mobile+'</span><span class="metric-caption-desktop">'+desktop+'</span>';
  const savingsCaption = saveMode() === 'set' ? 'Dinero apartado' : 'Incluye el dinero apartado';
  const availableCaption = `Saldo disponible del año: ${fmt(yInc - yExp)}`;
  $('#anKpis').innerHTML =
    kpi('income','arrow-down',yInc,caption(`Promedio mensual<br>${fmt(yInc/withData)}`,`Promedio ${fmt(yInc/withData)} al mes`)) +
    kpi('expense','arrow-up',yExp,caption(`Promedio mensual<br>${fmt(yExp/withData)}`,`Promedio ${fmt(yExp/withData)} al mes`)) +
    kpi('savings','piggy-bank',ySv.saved,`${savingsCaption}<br>${availableCaption}`,ySv.saved>=0?'savings-positive':'neg') +
    kpi('rate','chart-pie',yInc?ySv.saved/yInc*100:'—',ySv.goalMonths?caption(`Meta: ${ySv.hit} de ${ySv.goalMonths} meses`,`Meta cumplida en ${ySv.hit} de ${ySv.goalMonths} meses`):'Sin ingresos registrados');
  $('#anKpis').querySelectorAll('[data-num]').forEach(el => { if (el.dataset.num !== '') countUp(el, Number(el.dataset.num), el.dataset.kind); });

  // Gráfico: ahorro mensual + acumulado
  const bal = savings.map(v => v.saved), balC = tot.map((t, i) => t.inc || t.exp ? bal[i] : null);
  const firstData = tot.findIndex(t => t.inc || t.exp);
  let acc = 0; const cum = months.map((m, i) => firstData >= 0 && i >= firstData && (m <= tm || tot[i].inc || tot[i].exp) ? (acc += bal[i]) : null);
  analysisData={months,bal,balC,cum,tot,grid,rates:tot.map((t,i)=>t.inc?bal[i]/t.inc*100:null),first:firstData,cumulative:analysisCumulativeSeries(tot,bal,cum)};
  analysisSelectedMonth=currentMonth;
  if(analysisDetailPeriod!=='year')analysisDetailPeriod=currentMonth;
  renderAnalysisSelection();
}

function renderAnalysisSelection(){
  const hasData = analysisData.first >= 0;
  const metric=analysisChartMode==='total'?ANALYSIS_ACCUMULATED[analysisMetric]:ANALYSIS_METRICS[analysisMetric];
  $('#analysisChartTitle').textContent=metric.title;
  $('#yearChartHelp').dataset.tip=metric.help;
  $('#yearChartDescription').textContent=metric.help;
  $('#yearChartModes').hidden=!hasData;
  $('#yearChartModes').querySelectorAll('[data-year-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.yearMode===analysisChartMode)));
  renderYearReadout();
  if (chYear && !hasData){ chYear.destroy(); chYear = null; }
  if (!hasData){ $('#yearWrap').innerHTML = emptyBox('chart-line', `Aún no hay movimientos registrados en ${currentMonth.slice(0,4)}. Los programados aparecerán aquí cuando llegue su fecha.`); }
  else renderAnalysisChart();

  renderAnalysisDetails();
}
$('#yearPrev').onclick = () => goMonth(shiftMonth(currentMonth, -12));
$('#yearNext').onclick = () => goMonth(shiftMonth(currentMonth, 12));
