// Presupuesto: appearance.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Temas de color ---------- */
// Cada categoría recibe un "rol" según su nombre o ícono, y cada tema define un color por rol
const ROLES = ['home','food','transport','bills','health','fun','shop','edu','debt','save','other','income','bonus','pet','travel','tech'];
const ROLE_RX = [
  ['home', /vivienda|casa|alquiler|hipoteca|depa|hogar|mantenimiento/i, /house|home|building|sofa|bed|key|armchair|lamp/],
  ['food', /aliment|comida|mercado|super|restaur|delivery|caf[eé]|almuerzo|cena|bodega/i, /shopping-cart|shopping-basket|utensils|coffee|pizza|apple|croissant|sandwich|soup|salad|beef|cake|cookie|egg/],
  ['transport', /transporte|auto|carro|gasolina|combustible|taxi|uber|bus|movilidad|peaje|cochera/i, /car|bus|fuel|bike|train|truck|motorbike|scooter|parking/],
  ['bills', /servicio|luz|agua|internet|tel[eé]fono|movistar|claro|entel|bitel|cable|\bgas\b|l[ií]nea|celular|plan/i, /lightbulb|wifi|plug|droplet|phone|smartphone|wrench|router|zap/],
  ['health', /salud|m[eé]dic|farmacia|seguro|gym|gimnasio|dentista|cl[ií]nica/i, /stethoscope|pill|heart-pulse|dumbbell|hospital|syringe|activity|bandage/],
  ['fun', /entreten|ocio|netflix|spotify|disney|hbo|prime|cine|juego|salida|apple|youtube|m[uú]sica|streaming|fiesta/i, /film|clapperboard|music|gamepad|headphones|tv|ticket|popcorn|party|dices|joystick/],
  ['shop', /ropa|compra|shopping|regalo|zapat|belleza|cuidado/i, /shirt|shopping-bag|scissors|gem|store|sparkles|watch/],
  ['edu', /educa|curso|estudio|universidad|colegio|libro|idioma|ingl[eé]s/i, /book|graduation|school|notebook|library|languages|pencil/],
  ['debt', /deuda|tarjeta|cr[eé]dito|pr[eé]stamo|cuota|banco/i, /credit-card|landmark|receipt/],
  ['save', /ahorro|inversi[oó]n|fondo|meta/i, /piggy-bank|trending-up|vault|chart/],
  ['pet', /mascota|perro|gato|michi|micha|veterin/i, /dog|cat|paw|bird|rabbit|fish/],
  ['travel', /viaje|vacacion|hotel|pasaje|vuelo/i, /plane|luggage|globe|map|tent|mountain|umbrella/],
  ['tech', /tecnolog|software|app|nube|dominio|hosting|suscrip/i, /laptop|monitor|cpu|cloud|server|hard-drive/],
  ['income', /sueldo|salario|pago|n[oó]mina|honorario|freelance|venta/i, /briefcase|dollar|banknote|wallet/],
  ['bonus', /gratific|bono|cts|extra|pluxee|utilidad|aguinaldo|reembolso|devoluci/i, /gift|star|award|trophy|coins/],
  ['other', /otro|varios|misc/i, /package|plus|tag|circle-help/]];
function roleOf(c){
  const ic = String(c.icon || '').replace('svg:', '');
  for (const [r, rx] of ROLE_RX) if (rx.test(c.name || '')) return r;
  for (const [r, , ri] of ROLE_RX) if (ri.test(ic)) return r;
  return c.type === 'income' ? 'bonus' : 'other';
}
// h = color por rol (en el orden de ROLES), accent = color del logo
// Paletas inspiradas en esquemas conocidos por su armonía (Catppuccin, Nord, Rosé Pine, Dracula, Tokyo Night,
// Gruvbox, Solarized, Everforest, Kanagawa) y en paletas de finanzas.
// R(): un color por ROL → home, food, transport, bills, health, fun, shop, edu, debt, save, other, income, bonus, pet, travel, tech
// inc / exp / sav: colores del tema para gráficos, barras de ingresos/alertas y calendario
const R = (...c) => c;
// Cuatro temas desde 1.10.72. Vercel es la base: también se usa cuando no hay tema elegido.
const THEMES = [
  // Tema Vercel (shadcn/ui, 21st.dev): blanco y negro neutros que siguen el modo del sistema; azul ingresos, rojo gastos, ámbar ahorro.
  {id:'vercel', name:'Vercel', desc:'Blanco y negro preciso, sigue el modo del sistema', accent:'#000000',
   ui:{bg:'#000000', surface:'#090909', s2:'#1d1d1d', border:'#242424', text:'#ffffff', muted:'#a4a4a4'},
   uiLight:{bg:'#fcfcfc', surface:'#ffffff', s2:'#f5f5f5', border:'#e4e4e4', text:'#000000', muted:'#525252'},
   inc:'#2d62ef', exp:'#e54b4f', sav:'#ffae04',
   c:R('#2d62ef','#ffae04','#747474','#a4a4a4','#2d62ef','#ffae04','#747474','#525252','#e54b4f','#ffae04','#a4a4a4','#2d62ef','#ffae04','#747474','#2d62ef','#525252')},
  {id:'mono', name:'Oscuro OLED', desc:'Siempre en negro puro, íconos en blanco puro', mode:'dark', accent:'#ffffff', uniform:'#ffffff', inc:'#e4e4e7', exp:'#71717a', sav:'#a1a1aa'},
  {id:'nordic', name:'Nórdico', desc:'Escarcha y aurora boreal', accent:'#5e81ac', inc:'#a3be8c', exp:'#bf616a', sav:'#b48ead',
   c:R('#5e81ac','#d08770','#81a1c1','#ebcb8b','#a3be8c','#b48ead','#c5727a','#88c0d0','#bf616a','#8fbcbb','#9aa5b8','#a3be8c','#ebcb8b','#c79a7a','#7fb0c7','#b0bccf')},
  {id:'pastel', name:'Pastel', desc:'Suave y luminoso, ideal para modo oscuro', accent:'#8b7fd6', inc:'#a6e3a1', exp:'#f38ba8', sav:'#cba6f7',
   c:R('#89b4fa','#fab387','#74c7ec','#f9e2af','#89dceb','#cba6f7','#f5c2e7','#b4befe','#f38ba8','#94e2d5','#f2cdcd','#a6e3a1','#f9e2af','#eba0ac','#a6e3a1','#f5e0dc')}];
// Temas retirados en 1.10.72: cada elección guardada se lee como el tema vigente más parecido (sin reescribir datos).
const THEME_REPLACEMENTS = {minimal:'vercel', sage:'vercel', charcoal:'mono', obsidian:'mono', midnight:'mono', dracula:'mono', tokyo:'mono', wine:'mono', nightforest:'mono',
  ocean:'nordic', solar:'nordic', kanagawa:'nordic', everforest:'nordic', forest:'nordic',
  rose:'pastel', lavender:'pastel', sunset:'pastel', vivid:'pastel', gruvbox:'pastel', earth:'pastel', cafe:'pastel'};
const themeById = id => THEMES.find(x => x.id === (THEME_REPLACEMENTS[id] || id));
const logoHue = () => state.settings.appColor && hueOf(state.settings.appColor).s > .15 ? state.settings.appColor : '#4f46e5';
function themeColors(t){
  if (t.uniform) return ROLES.map(() => t.uniform);
  return t.c;
}
function themeAccent(t){ return t.accent || logoHue(); }
// Colores del tema para cada categoría (si dos comparten rol, la segunda varía un poco el tono)
function themeMap(t){
  const cols = themeColors(t), used = {}, out = {};
  state.categories.forEach(c => { const r = roleOf(c), n = used[r] = (used[r] || 0) + 1, base = cols[ROLES.indexOf(r)];
    if (t.uniform){ out[c.id] = base; return; }
    out[c.id] = n === 1 ? base : toneHex(base, Math.min(.9, Math.max(.22, hexLight(base) + (n % 2 ? -1 : 1) * .07 * Math.ceil((n - 1) / 2))), 0); });
  return out;
}
const goalThemeColor = (t, i) => { const cols = themeColors(t); return cols[[9, 12, 14, 5, 0, 3, 7, 1][i % 8]]; }; // (en temas de un solo color todas las metas comparten el tono)
const hexLight = hex => { const [r,g,b] = [1,3,5].map(i => parseInt(hex.substr(i,2),16) / 255); return (Math.max(r,g,b) + Math.min(r,g,b)) / 2; };
function applyTheme(id){
  const t = themeById(id); if (!t) return;
  const prev = {theme:state.settings.theme, app:state.settings.appColor, cats:state.categories.map(c => [c.id, c.color]), goals:state.goals.map(g => [g.id, g.color])};
  const map = themeMap(t);
  state.categories.forEach(c => c.color = map[c.id]);
  state.goals.forEach((g, i) => g.color = goalThemeColor(t, i));
  state.settings.appColor = themeAccent(t); state.settings.theme = id;
  save(); renderAll();
  toast(`Tema ${t.name} aplicado`, {icon:'palette', action:'Deshacer', onAction: () => {
    state.settings.theme = prev.theme; state.settings.appColor = prev.app;
    prev.cats.forEach(([i, col]) => { const c = state.categories.find(x => x.id === i); if (c) c.color = col; });
    prev.goals.forEach(([i, col]) => { const g = state.goals.find(x => x.id === i); if (g) g.color = col; });
    save(); renderAll(); toast('Colores restaurados', {icon:'undo-2'});
  }});
}
// ---- Tipografía ----
const SANS_FB = 'system-ui,-apple-system,"Segoe UI",sans-serif', SERIF_FB = 'Georgia,"Times New Roman",serif';
// Seis fuentes desde 1.10.72; Geist es la predeterminada (tema Vercel). Georgia es del sistema: no descarga archivo.
const FONTS = [
  {id:'geist', name:'Geist', desc:'Limpia y moderna, con cifras claras', body:`"Geist",${SANS_FB}`, num:'"tnum"'},
  {id:'geistmono', name:'Geist Mono', desc:'Monoespaciada, ideal para tablas y cifras', body:`"Geist Mono",ui-monospace,monospace`, num:'"tnum"'},
  {id:'inter', name:'Inter', desc:'Neutra y muy legible en pantalla', body:`"Inter",${SANS_FB}`, num:'"tnum"'},
  {id:'jakarta', name:'Plus Jakarta', desc:'Moderna y amable', body:`"Plus Jakarta Sans",${SANS_FB}`},
  {id:'georgia', name:'Georgia', desc:'Serif clásica, incluida en el sistema', body:SERIF_FB, num:'"lnum","tnum"'},
  {id:'system', name:'Del sistema', desc:'La fuente nativa de tu celular o computadora', body:SANS_FB, num:'"tnum"'}];
// Compatibilidad con elecciones guardadas de opciones retiradas (la última limpieza en 1.10.72).
const FONT_REPLACEMENTS = {claude:'georgia', claudemix:'georgia', geistserif:'georgia', geistserifheart:'georgia', geistserifsquare:'georgia', geistseriftriangle:'georgia',
  geistpixelcircle:'geistmono', geistpixelgrid:'geistmono', geistpixelline:'geistmono', geistpixelsquare:'geistmono', geistpixeltriangle:'geistmono', plexmono:'geistmono',
  apple:'system', googlesans:'inter', publicsans:'inter', dmsans:'inter', manrope:'inter', roboto:'inter', plexsans:'inter', spacegrotesk:'geist', nunito:'jakarta'};
const curFont = () => FONTS.find(f => f.id === (FONT_REPLACEMENTS[state.settings.font] || state.settings.font)) || FONTS[0];
function applyFont(){
  const f = curFont(), r = document.documentElement.style;
  r.setProperty('--font-body', f.body); r.setProperty('--font-head', f.head || f.body); r.setProperty('--num-feat', f.num || 'normal');
  if (typeof Chart !== 'undefined') Chart.defaults.font.family = f.body;
  loadAppFont(f);
}
let appFontKey = '';
function refreshFontLayout(){
  fitMetricValues(); moveTabInd();
  if (typeof Chart !== 'undefined') Object.values(Chart.instances).forEach(chart => {
    if (!chart.canvas?.isConnected || !chart.canvas.getBoundingClientRect().width) return;
    chart.options.font = {...chart.options.font, family:curFont().body};
    chart.resize(); chart.update('none');
  });
}
function loadAppFont(f){
  if (!document.fonts || appFontKey === f.id) return;
  appFontKey = f.id;
  const family = f.body.split(',')[0];
  Promise.all([400,500,600,700].map(w => document.fonts.load(w+' 16px '+family,'Presupuesto Áéñ S/ 1,250.90')))
    .then(() => { if (curFont().id === f.id) requestAnimationFrame(refreshFontLayout); }).catch(() => {});
}
function renderFonts(){
  const el = $('#fontGrid'); if (!el) return;
  const cur = curFont().id;
  el.innerHTML = FONTS.map(f => `<button type="button" class="font-card${f.id === cur ? ' active' : ''}" data-font="${f.id}" title="${esc(f.desc)}">
      <div class="fc-aa"><b style="font-family:${esc(f.head || f.body)}">Aa</b><span style="font-family:${esc(f.head || f.body)}">S/ 1,250.90</span></div>
      <div class="fc-name" style="font-family:${esc(f.body)}">${f.name}${f.id === cur ? `<span class="tc-on">${ic('check')}</span>` : ''}</div>
      <div class="fc-desc" style="font-family:${esc(f.body)}">${f.desc}</div></button>`).join('');
  $('#fontNote').textContent = cur === 'system' ? 'Usa la fuente nativa de tu dispositivo: San Francisco en Apple, Segoe UI en Windows o la predeterminada de Android. Su apariencia varía entre sistemas.' : cur === 'georgia' ? 'Georgia viene instalada en casi todos los dispositivos; si falta, se usa la serif del sistema.' : 'Cambia la letra de toda la app. Funciona sin internet.';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-font]'); if (!b) return;
  const prev = state.settings.font; state.settings.font = b.dataset.font; save();
  (document.fonts ? document.fonts.load(`16px ${curFont().body.split(',')[0]}`) : Promise.resolve()).catch(() => {}).then(() => { applyFont(); renderFonts(); renderAll(); moveTabInd(); });
  toast(`Letra: ${curFont().name}`, {icon:'type', action:'Deshacer', onAction: () => { state.settings.font = prev; save(); applyFont(); renderFonts(); renderAll(); moveTabInd(); }});
});
function renderThemes(){
  const el=$('#themeGrid');if(!el)return;const cur=curTheme().id;
  const card=t=>{
    const dark=t.mode==='dark'||(!t.mode&&isDarkUI()), ui=dark?t.ui:t.uiLight, surface=ui?.surface||(dark?'#101114':'#ffffff');
    const bg=ui?.bg||(dark?'#060708':'#f4f5f8'), series=themeSeries(t,surface), cols=themeColors(t);
    const categories=[0,1,2,3,4].map(i=>fitThemeColor(cols[i],surface,3));
    return `<div class="theme-option"><button type="button" class="theme-card${t.id===cur?' active':''}" data-theme="${t.id}" aria-pressed="${t.id===cur}" title="${esc(t.desc)}">
      <div class="theme-preview" style="--preview-bg:${bg};--preview-surface:${surface};--preview-income:${series.income};--preview-expense:${series.expense};--preview-saving:${series.savings}">
        <div class="theme-preview-bars">${[40,65,53,82,68,92].map((v,i)=>`<i style="height:${v}%"></i><i class="out" style="height:${v*.67}%"></i>`).join('')}</div>
        <svg class="theme-preview-line" viewBox="0 0 180 46" aria-hidden="true"><path d="M2 41 L36 35 L70 31 L104 21 L138 17 L178 4"/><circle cx="178" cy="4" r="2.5"/></svg>
        <div class="theme-preview-categories">${categories.map(c=>`<i style="background:${c}"></i>`).join('')}</div>
      </div><div class="tc-row"><b>${esc(t.name)}</b>${t.id===cur?`<span class="tc-on">${ic('check')}</span>`:''}</div>
      <span class="theme-mode-label">${t.mode==='light'?'Siempre claro':t.mode==='dark'?'Siempre oscuro':'Se adapta al dispositivo'}</span></button>
      </div>`;
  };
  el.innerHTML='<div class="theme-key"><span style="--key:var(--income-chart)">Ingresos</span><span style="--key:var(--expense-chart)">Gastos</span><span style="--key:var(--k-violet)">Ahorro acumulado</span></div>'+THEMES.map(card).join('');
  const t=curTheme();
  const custom=t&&state.categories.some(c=>String(c.color).toLowerCase()!==String(themeMap(t)[c.id]).toLowerCase());
  $('#themeNote').textContent=t?'Tema '+t.name+(custom?' · categorías personalizadas.':'.')+' Las muestras muestran ingresos, gastos, ahorro y categorías.':'Elige una paleta para coordinar categorías, metas, indicadores y gráficos.';
}

$('#themeGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-theme]'); if (b) applyTheme(b.dataset.theme);
});

const curTheme = () => themeById(state.settings.theme) || THEMES[0];
const curThemeColorCat = c => { const t = curTheme(); return t ? themeMap(t)[c.id] : null; };
const curThemeColorGoal = id => { const t = curTheme(); if (!t) return null; const i = id ? state.goals.findIndex(g => g.id === id) : state.goals.length; return goalThemeColor(t, Math.max(0, i)); };
/* ---------- Selector de colores ---------- */
const colorDialog = $('#colorDialog'); let colorCb = null,colorDraft='#6366f1';
function normalizeColor(value){const s=String(value).trim().replace(/^#/,'');return /^[a-f\d]{6}$/i.test(s)?'#'+s.toLowerCase():/^[a-f\d]{3}$/i.test(s)?'#'+[...s].map(c=>c+c).join('').toLowerCase():null;}
function previewColor(color,fromSliders=false,keepInput=false){
 colorDraft=color;if(!keepInput)$('#colorHex').value=color.toUpperCase();$('#colorHex').setAttribute('aria-invalid','false');$('#colorError').textContent='';$('#applyColor').disabled=false;
 const hsl=hueOf(color);
 if(!fromSliders){$('#colorHue').value=hsl.h;$('#colorSaturation').value=hsl.s*100;$('#colorLightness').value=hexLight(color)*100;}
 const hue=Number($('#colorHue').value),sat=Number($('#colorSaturation').value),light=Number($('#colorLightness').value),preview=$('#colorPreview');
 preview.style.background=color;preview.style.color=hexLum(color)>.45?'#1b2232':'#ffffff';$('#colorPreviewValue').textContent=color.toUpperCase();
 $('#colorSaturation').style.background=`linear-gradient(90deg,${hslHex(hue,0,light/100)},${hslHex(hue,1,light/100)})`;
 $('#colorLightness').style.background=`linear-gradient(90deg,#000000,${hslHex(hue,sat/100,.5)},#ffffff)`;
 $('#paletteGrid').querySelectorAll('[data-color]').forEach(b=>{const on=b.dataset.color.toLowerCase()===color;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function openColor(current, cb){
  colorCb = cb;
  const cur = String(current).toLowerCase();
  const items = list => list.map(([hex, name]) => `<div class="sw-item"><button type="button" class="swatch lg${hex.toLowerCase() === cur ? ' active' : ''}" data-color="${hex}" style="background:${hex}" title="${name}"></button>${name}</div>`).join('');
  $('#paletteGrid').innerHTML = `<div class="pal-title">Pastel</div>${items(COLORS_PASTEL)}<div class="pal-title">Intensos</div>${items(COLORS_MAIN)}`;
  $('#colorPreviewIcon').innerHTML=ic('palette');previewColor(normalizeColor(current)||'#6366f1');
  colorDialog.showModal();
}
$('#paletteGrid').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if(b)previewColor(b.dataset.color.toLowerCase()); });
$('#colorHex').addEventListener('input',()=>{const color=normalizeColor($('#colorHex').value);if(color)previewColor(color,false,true);else{$('#colorHex').setAttribute('aria-invalid','true');$('#colorError').textContent='Usa 3 o 6 caracteres HEX (0–9, A–F).';$('#applyColor').disabled=true;}});
for(const id of ['colorHue','colorSaturation','colorLightness'])$('#'+id).addEventListener('input',()=>previewColor(hslHex(Number($('#colorHue').value),Number($('#colorSaturation').value)/100,Number($('#colorLightness').value)/100),true));
$('#applyColor').onclick=()=>{if($('#applyColor').disabled)return;const cb=colorCb;colorDialog.close();if(cb)cb(colorDraft);};
$('#colorHex').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#applyColor').click();}});

/* ---------- Nombre de la app ---------- */
const nameEl = $('#appName');
function applyBrand(){
  const mode = curTheme().mode;
  if (mode) document.documentElement.dataset.mode = mode; else delete document.documentElement.dataset.mode;
  const n = state.settings.appName || 'Presupuesto';
  if (document.activeElement !== nameEl) nameEl.textContent = n;
  document.title = n;
  applyUiIcons(); applyThemeVars(); applyAccent(); applyFont(); applyBrowserChrome();cacheBootAppearance();
}
// Caché derivada y local por perfil; no contiene finanzas ni cambia el estado sincronizado.
function cacheBootAppearance(){
  try{
    const root=document.documentElement,css=getComputedStyle(root),hex=v=>/^#[a-f\d]{6}$/i.test(v),data={mode:root.dataset.mode||'',systemDark:matchMedia('(prefers-color-scheme: dark)').matches};
    for(const key of ['bg','text','muted']){const value=css.getPropertyValue('--'+key).trim();if(!hex(value))return;data[key]=value;}
    const key='budgetPlanner.appearance.'+activeProfile,value=JSON.stringify(data);if(localData.readText(key)!==value)localData.writeText(key,value);
  }catch(e){/* La caché visual es opcional; su fallo no altera el guardado financiero. */}
}
// El favicon identifica la app y permanece fijo; el símbolo del perfil solo personaliza la interfaz.
function applyBrowserChrome(){
  const tc = document.querySelector('meta[name=theme-color]'); if (tc) tc.content = (cssVar('--bg') || '#f4f5f9').trim();
}
// Tono de acento (pestaña activa, desplegables) tomado del color del logo
// Variables de color del tema activo (gráficos, barras de ingresos y alertas, calendario)
function colorContrast(a,b){ const x=hexLum(a), y=hexLum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function fitThemeColor(color, background, minimum=3){
  const target=hexLum(background)<.25?'#ffffff':'#111113';
  for(let step=0;step<=40;step++){
    const candidate=mixHex(color,target,step/40);
    if(colorContrast(candidate,background)>=minimum)return candidate;
  }
  return target;
}
function themeSeries(t, surface){
  return {income:fitThemeColor(t?.inc || '#329477',surface), expense:fitThemeColor(t?.exp || '#d7657b',surface), savings:fitThemeColor(t?.sav || '#8b7aca',surface)};
}
function applyThemeVars(){
  const r=document.documentElement.style, t=curTheme(), dark=isDarkUI();
  // Superficies propias del tema: ui en oscuro, uiLight en claro; texto y texto secundario son opcionales.
  const ui=dark?t?.ui:t?.uiLight,uiMap=[['--bg','bg'],['--surface','surface'],['--surface-2','s2'],['--border','border'],['--text','text'],['--muted','muted']];
  for(const [key,field] of uiMap){if(ui?.[field])r.setProperty(key,ui[field]);else r.removeProperty(key);}
  const surface=cssVar('--surface'), series=themeSeries(t,surface);
  for(const [key,role] of [['--income-chart','income'],['--expense-chart','expense'],['--k-violet','savings']])r.setProperty(key,series[role]);
  for(const role of ['income','expense']){
    const ink=fitThemeColor(series[role],surface,4.5);
    r.setProperty('--'+role,ink);r.setProperty('--'+role+'-soft',mixHex(series[role],surface,dark?.88:.92));
  }
  r.setProperty('--warn-ink', dark ? '#fbbf24' : '#854d0e');
}

function applyAccent(){
  const r = document.documentElement.style, c = state.settings.appColor, L = hexLum(c), dark = isDarkUI();
  const keys = ['--primary','--primary-soft','--primary-fill','--on-primary','--accent','--accent-bg','--accent-ink'];
  if (!c || !/^#[0-9a-f]{6}$/i.test(c)){ keys.forEach(k => r.removeProperty(k)); return; }
  if (L > .9 || L < .03){ // blanco o negro (tema Minimalista): acento neutro que se invierte con el modo
    const ink = dark ? '#e4e4e7' : '#18181b', fill = ink, bg = dark ? '#1c1c20' : '#ececef';
    [['--primary', ink], ['--primary-soft', bg], ['--primary-fill', fill], ['--on-primary', dark ? '#111113' : '#ffffff'], ['--accent', fill], ['--accent-bg', bg], ['--accent-ink', ink]].forEach(([k, v]) => r.setProperty(k, v));
    return;
  }
  const bg = dark ? mixHex(c, '#171b24', L > .45 ? .72 : .8) : mixHex(c, '#ffffff', L > .45 ? .5 : .87);
  const contrast=(a,b)=>{const x=hexLum(a),y=hexLum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const surfaces=[cssVar('--bg'),cssVar('--surface'),cssVar('--surface-2'),bg];
  let ink=c;
  for(let step=0;step<=20;step++){
    ink=mixHex(c,dark?'#ffffff':'#111113',step/20);
    if(surfaces.every(surface=>contrast(ink,surface)>=4.7))break;
  }
  const fill = dark && L < .06 ? mixHex(c, '#ffffff', .25) : c;
  r.setProperty('--primary', ink); r.setProperty('--primary-soft', bg);
  r.setProperty('--primary-fill', fill); r.setProperty('--on-primary', contrast('#111113',fill)>contrast('#ffffff',fill)?'#111113':'#ffffff');
  r.setProperty('--accent', fill); r.setProperty('--accent-bg', bg); r.setProperty('--accent-ink', ink);
}
nameEl.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); nameEl.blur(); }
  if (e.key === 'Escape'){ nameEl.textContent = state.settings.appName || 'Presupuesto'; nameEl.blur(); }
});
nameEl.addEventListener('blur', () => {
  const v = nameEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) || 'Presupuesto';
  if (v !== (state.settings.appName || 'Presupuesto')){ state.settings.appName = v; save(); toast('Nombre actualizado'); }
  applyBrand();
});

/* ---------- Selector de mes ---------- */

/* ---------- Selector de mes y fecha propio ---------- */
const DP_M = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DP_W = ['L','M','M','J','V','S','D'];
const dpEl = document.createElement('div'); dpEl.className = 'dp'; dpEl.setAttribute('role', 'dialog'); dpEl.setAttribute('aria-label', 'Elegir fecha');
if ('popover' in HTMLElement.prototype) dpEl.setAttribute('popover', 'manual');
document.body.appendChild(dpEl);
let dpS = null;
const pad2 = n => String(n).padStart(2, '0');
function dpOpen(anchor, o){
  if (dpS && dpS.anchor === anchor){ dpClose(); return; }
  dpClose();
  clearTimeout(dpEl._hideTimer);
  const v = o.value || '';
  dpS = {anchor, ...o, view: o.mode === 'month' ? 'months' : 'days',
    y: Number((v || todayISO()).slice(0, 4)), m: Number((v || todayISO()).slice(5, 7))};
  anchor.classList.add('open');
  // dentro de un diálogo modal el selector debe vivir en él (lo de afuera queda inactivo)
  const host = anchor.closest('dialog') || document.body; if (dpEl.parentNode !== host) host.appendChild(dpEl);
  dpRender();
  if (dpEl.showPopover){ try{ if (dpEl.matches(':popover-open')) dpEl.hidePopover(); dpEl.showPopover(); }catch(e){} }
  dpPlace();
  const opened=dpS;
  requestAnimationFrame(() => {if(dpS===opened)dpEl.classList.add('show');});
  (dpEl.querySelector('.dp-c.sel:not(:disabled)')||dpEl.querySelector('.dp-c.now:not(:disabled)')||dpEl.querySelector('button:not(:disabled)'))?.focus({preventScroll:true});
}
function dpClose(restoreFocus=false){
  if (!dpS) return;
  const anchor=dpS.anchor;
  anchor.classList.remove('open'); dpS = null;
  dpEl.classList.remove('show');
  if(restoreFocus&&anchor.isConnected)anchor.focus({preventScroll:true});
  dpEl._hideTimer=setTimeout(() => { if (!dpS && dpEl.hidePopover){ try{ dpEl.hidePopover(); }catch(e){} } }, reduceMotion()?0:MOTION.panel);
}
function dpPlace(){
  if (!dpS) return;
  const vv=window.visualViewport, zoom=Number(getComputedStyle(document.documentElement).zoom)||1;
  const x=vv?.offsetLeft||0, y=vv?.offsetTop||0, width=vv?.width||innerWidth, height=vv?.height||innerHeight;
  dpEl.style.maxHeight=Math.max(0,(height-16)/zoom)+'px';
  const r = dpS.anchor.getBoundingClientRect(), w = dpEl.offsetWidth*zoom, h = dpEl.offsetHeight*zoom;
  let left = dpS.align === 'center' ? r.left + r.width / 2 - w / 2 : r.left;
  left = Math.max(x+8, Math.min(left, x+width-w-8));
  const up = r.bottom+8+h>y+height-8 && r.top-y>y+height-r.bottom;
  const top=Math.max(y+8,Math.min(up?r.top-8-h:r.bottom+8,y+height-h-8));
  dpEl.classList.toggle('up', up);
  dpEl.style.left = left/zoom + 'px';
  dpEl.style.top = top/zoom + 'px';
}
function dpRender(){
  const S = dpS, now = todayISO(), cur = S.value || '';
  let head, body;
  if (S.view === 'months'){
    head = `<button class="dp-nav" data-dp="py" aria-label="Año anterior">${ic('chevron-left')}</button><button class="dp-t" data-dp="noop">${S.y}</button><button class="dp-nav" data-dp="ny" aria-label="Año siguiente">${ic('chevron-right')}</button>`;
    body = `<div class="dp-g months">${DP_M.map((n, i) => { const k = S.y + '-' + pad2(i + 1);
      return `<button class="dp-c${k === cur.slice(0, 7) ? ' sel' : ''}${k === now.slice(0, 7) ? ' now' : ''}" data-dp="m" data-v="${i + 1}">${n}</button>`; }).join('')}</div>`;
  } else {
    const first = new Date(S.y, S.m - 1, 1), off = (first.getDay() + 6) % 7, dim = new Date(S.y, S.m, 0).getDate();
    const cells = [];
    for (let i = 0; i < 42; i++){
      const d = new Date(S.y, S.m - 1, 1 - off + i), iso = ym(d) + '-' + pad2(d.getDate());
      if (i >= 35 && d.getMonth() !== S.m - 1 && i % 7 === 0) break;
      cells.push(`<button class="dp-c${d.getMonth() !== S.m - 1 ? ' out' : ''}${iso === cur ? ' sel' : ''}${iso === now ? ' now' : ''}" data-dp="d" data-v="${iso}"${S.max && iso > S.max ? ' disabled' : ''}>${d.getDate()}</button>`);
    }
    head = `<button class="dp-nav" data-dp="pm" aria-label="Mes anterior">${ic('chevron-left')}</button><button class="dp-t" data-dp="tomonths" title="Elegir mes">${monthLong(S.y + '-' + pad2(S.m))}</button><button class="dp-nav" data-dp="nm" aria-label="Mes siguiente">${ic('chevron-right')}</button>`;
    body = `<div class="dp-g days">${DP_W.map(w => `<div class="dp-wd">${w}</div>`).join('')}${cells.join('')}</div>`;
  }
  const foot = S.mode === 'month' ? `<button data-dp="today">Este mes</button>`
    : `${S.clearable ? '<button class="muted-b" data-dp="clear">Quitar fecha</button>' : '<span></span>'}<button data-dp="today">Hoy</button>`;
  dpEl.innerHTML = `<div class="dp-h">${head}</div><div class="dp-body">${body}</div><div class="dp-f">${foot}</div>`;
}
function dpPick(v){ const S = dpS; if(S.max && v > S.max)return; dpClose(true); S.onPick(v); }
dpEl.addEventListener('click', e => {
  const b = e.target.closest('[data-dp]'); if (!b || !dpS) return;
  const a = b.dataset.dp, S = dpS;
  if (a === 'py') S.y--; else if (a === 'ny') S.y++;
  else if (a === 'pm'){ if (--S.m < 1){ S.m = 12; S.y--; } }
  else if (a === 'nm'){ if (++S.m > 12){ S.m = 1; S.y++; } }
  else if (a === 'tomonths') S.view = 'months';
  else if (a === 'm'){ if (S.mode === 'month') return dpPick(S.y + '-' + pad2(b.dataset.v)); S.m = Number(b.dataset.v); S.view = 'days'; }
  else if (a === 'd') return dpPick(b.dataset.v);
  else if (a === 'today') return dpPick(S.mode === 'month' ? thisMonth() : todayISO());
  else if (a === 'clear') return dpPick('');
  else return;
  dpRender(); dpPlace();
  (dpEl.querySelector('[data-dp="'+a+'"]')||dpEl.querySelector('.dp-c.sel:not(:disabled),.dp-c:not(:disabled)'))?.focus({preventScroll:true});
});
document.addEventListener('pointerdown', e => { if (dpS && !dpEl.contains(e.target) && !dpS.anchor.contains(e.target)) dpClose(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dpS){ e.preventDefault(); e.stopPropagation(); dpClose(true); } }, true);
addEventListener('resize', () => dpClose());
window.visualViewport?.addEventListener('resize',dpPlace);
window.visualViewport?.addEventListener('scroll',dpPlace);
document.addEventListener('scroll', e => { if (dpS && !dpEl.contains(e.target)) dpPlace(); }, true);
// Convierte un <input type="date"> en un botón con el selector propio (el input sigue guardando el valor)
function dpField(input, opts = {}){
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'dp-trigger';
  input.classList.add('dp-native'); input.tabIndex = -1; input.after(btn);
  const label = () => { const v = input.value;
    btn.innerHTML = `${ic('calendar')}<span class="dp-l${v ? '' : ' ph'}">${v ? (() => { const [y, m, d] = v.split('-').map(Number); const s = new Date(y, m - 1, d).toLocaleDateString('es-PE', {weekday:'short', day:'numeric', month:'short', year:'numeric'}).replace(/\./g, ''); return s[0].toUpperCase() + s.slice(1); })() : (opts.placeholder || 'Elegir fecha')}</span>`; };
  const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  Object.defineProperty(input, 'value', {get(){ return desc.get.call(this); }, set(v){ desc.set.call(this, v); label(); }, configurable:true});
  btn.addEventListener('click', () => dpOpen(btn, {mode:'date', value:input.value, max:input.max, clearable:opts.clearable,
    onPick: v => { input.value = v; input.dispatchEvent(new Event('change', {bubbles:true})); btn.focus(); }}));
  label();
}
dpField($('#fDate'));
dpField($('#gDeadline'), {clearable:true, placeholder:'Sin fecha límite'});
dpField($('#wdDate'));
$('#monthLabel').onclick = () => dpOpen($('#monthLabel'), {mode:'month', value:currentMonth, align:'center', onPick: v => goMonth(v)});
