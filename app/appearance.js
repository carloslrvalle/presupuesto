// Presupuesto: appearance.js — ver README.md del proyecto para responsabilidades y orden de carga.
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
// Historial: seis temas desde 1.10.86, con Vercel como base. Desde 1.10.138 solo se exponen Claro y Oscuro.
function neutralPalette(dark){
 const bg=dark?'#000000':'#fafafa',surface=dark?'#0a0a0a':'#ffffff',text=dark?'#ededed':'#171717',muted=dark?'#a4a4a4':'#525252',secondary=dark?'#1d1d1d':'#f5f5f5',border=dark?'#292929':'#e4e4e4';
 return {background:bg,foreground:text,card:surface,'card-foreground':text,popover:surface,'popover-foreground':text,primary:text,'primary-foreground':bg,secondary,'secondary-foreground':text,muted:secondary,'muted-foreground':muted,accent:secondary,'accent-foreground':text,destructive:dark?'#f07a8e':'#be123c','destructive-foreground':'#ffffff',border,input:border,ring:muted,'chart-1':dark?'#ff9b9b':'#db666a','chart-2':dark?'#77ddb1':'#319e77','chart-3':dark?'#91c5ff':'#528dce','chart-4':text,'chart-5':dark?'#c3abff':'#9670d1',radius:'0.5rem',sidebar:bg,'sidebar-foreground':text,'sidebar-primary':text,'sidebar-primary-foreground':bg,'sidebar-accent':secondary,'sidebar-accent-foreground':text,'sidebar-border':border,'sidebar-ring':muted,'shadow-opacity':'.08','shadow-blur':'3px','shadow-spread':'0px','shadow-offset-x':'0px','shadow-offset-y':'1px'};
}
const THEMES=['light','dark'].map(mode=>({id:mode,name:mode==='dark'?'Oscuro':'Claro',mode,accent:mode==='dark'?'#ededed':'#171717',c:R('#8b829c','#b67a65','#6398a6','#ad4056','#698a73','#b0966b','#8f819d','#82755f','#b44c60','#6d7d91','#8b8b8b','#5b8c71','#9b875d','#8a7994','#688898','#798595'),palette:{light:neutralPalette(false),dark:neutralPalette(true)}}));
const PALETTE_KEYS = [...new Set(THEMES.flatMap(t => Object.keys(t.palette?.light || {})))];
function themeName(t){return t.name;}
function themePalette(t, dark = isDarkUI()){ return t.palette?.[dark ? 'dark' : 'light']; }
function themeUi(t, dark){
  const p = themePalette(t, dark);
  return p ? {bg:p.background, surface:p.card, s2:p.muted, border:p.border, text:p.foreground, muted:p['muted-foreground']} : dark ? t.ui : t.uiLight;
}
// Temas retirados en 1.10.72: cada elección guardada se lee como el tema vigente más parecido (sin reescribir datos).
const LEGACY_DARK_THEMES=['mono','charcoal','obsidian','midnight','dracula','tokyo','wine','nightforest'];
const themeById=id=>THEMES.find(t=>t.id===id)||THEMES[LEGACY_DARK_THEMES.includes(id)||matchMedia('(prefers-color-scheme: dark)').matches?1:0];
const colorSchemeKey='budgetPlanner.colorScheme';
let colorSchemePreference='system';
try {
 const stored=localData.readText(colorSchemeKey);
 if(['system','light','dark'].includes(stored))colorSchemePreference=stored;
} catch(error) { /* Sin preferencia local, se sigue el equipo. */ }
function appearanceModeName(){
 return colorSchemePreference==='system'?'Sistema · '+themeName(curTheme()):themeName(curTheme());
}
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
 if(!['system','light','dark'].includes(id))return;
 try { localData.writeText(colorSchemeKey,id); }
 catch(error){toast('No se pudo guardar el modo. Vuelve a intentarlo.');return;}
 colorSchemePreference=id;
 renderAll();toast(id==='system'?'Se sigue el modo del equipo':'Modo '+themeName(curTheme()).toLowerCase()+' aplicado');
}
// ---- Tipografía ----
const INTERFACE_FONT={id:'geist',name:'Geist Sans',body:'"Geist"'};
function availableFonts(){return [INTERFACE_FONT];}
function currentFont(){return INTERFACE_FONT;}
function refreshFontLayout(){
  fitMetricValues();
  moveTabInd();
  if (typeof Chart === 'undefined') return;
  const family = cssVar('--font-body');
  Chart.defaults.font.family = family;
  for (const chart of Object.values(Chart.instances)){
    chart.options.font = {...chart.options.font, family};
    if (chart.canvas.getBoundingClientRect().width){ chart.resize(); chart.update('none'); }
  }
}
let activeFontId;
function applyAppFont(){
 const root=document.documentElement;
 root.style.setProperty('--font-body','"Geist", system-ui, sans-serif');
 root.style.setProperty('--font-head','var(--font-body)');
 if(activeFontId==='geist')return;
 activeFontId='geist';requestAnimationFrame(refreshFontLayout);
 if(document.fonts)Promise.all([document.fonts.load('400 14px Geist','Presupuesto Áéñ S/ 1,250.90'),document.fonts.load('600 24px Geist')]).then(()=>requestAnimationFrame(refreshFontLayout)).catch(()=>toast('No se pudo cargar Geist Sans. Se usa temporalmente la fuente del dispositivo.'));
}

// ---- Temas ----
function renderThemes(){
 const el=$('#themeGrid');if(!el)return;
 el.innerHTML=[['system','Sistema','monitor'],['light','Claro','sun'],['dark','Oscuro','moon']].map(([id,name,icon])=>'<button type="button" class="btn'+(id===colorSchemePreference?' primary':'')+'" data-theme="'+id+'" aria-pressed="'+(id===colorSchemePreference)+'">'+ic(icon)+name+'</button>').join('');
 $('#themeNote').textContent='Sistema sigue automáticamente el modo claro u oscuro de este equipo.';
}
$('#themeGrid').addEventListener('click',e=>{const button=e.target.closest('[data-theme]');if(button)applyTheme(button.dataset.theme);});

const curTheme = () => themeById(colorSchemePreference==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):colorSchemePreference);
const curThemeColorCat = c => { const t = curTheme(); return t ? themeMap(t)[c.id] : null; };
const curThemeColorGoal = id => { const t = curTheme(); if (!t) return null; const i = id ? state.goals.findIndex(g => g.id === id) : state.goals.length; return goalThemeColor(t, Math.max(0, i)); };
/* ---------- Selector de colores ---------- */
const colorDialog = $('#colorDialog'); let colorCb = null,colorDraft='#6366f1',colorOpener=null;
function normalizeColor(value){const s=String(value).trim().replace(/^#/,'');return /^[a-f\d]{6}$/i.test(s)?'#'+s.toLowerCase():/^[a-f\d]{3}$/i.test(s)?'#'+[...s].map(c=>c+c).join('').toLowerCase():null;}
function previewColor(color,fromSliders=false,keepInput=false){
 colorDraft=color;if(!keepInput)$('#colorHex').value=color.toUpperCase();$('#colorHex').setAttribute('aria-invalid','false');$('#colorError').textContent='';$('#applyColor').disabled=false;
 const hsl=hueOf(color);
 if(!fromSliders){$('#colorHue').value=hsl.h;$('#colorSaturation').value=hsl.s*100;$('#colorLightness').value=hexLight(color)*100;}
 const hue=Number($('#colorHue').value),sat=Number($('#colorSaturation').value),light=Number($('#colorLightness').value),preview=$('#colorPreview');
 preview.style.background=color;preview.style.color=themeForeground('#ffffff',color);$('#colorPreviewValue').textContent=color.toUpperCase();
 $('#colorSaturation').style.background=`linear-gradient(90deg,${hslHex(hue,0,light/100)},${hslHex(hue,1,light/100)})`;
 $('#colorLightness').style.background=`linear-gradient(90deg,#000000,${hslHex(hue,sat/100,.5)},#ffffff)`;
 $('#paletteGrid').querySelectorAll('[data-color]').forEach(b=>{const on=b.dataset.color.toLowerCase()===color;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function openColor(current, cb, options={}){
  colorCb = cb;
  colorOpener=document.activeElement;
  $('#colorDialogTitle').textContent=options.title||'Elegir color';
  const cur = String(current).toLowerCase();
  const items = list => list.map(([hex, name]) => `<div class="sw-item"><button type="button" class="swatch lg${hex.toLowerCase() === cur ? ' active' : ''}" data-color="${hex}" style="background:${hex}" title="${name}"></button>${name}</div>`).join('');
  $('#paletteGrid').innerHTML = `<div class="pal-title">Pastel</div>${items(COLORS_PASTEL)}<div class="pal-title">Intensos</div>${items(COLORS_MAIN)}`;
  $('#colorPreviewIcon').innerHTML=ic(options.icon||'palette');previewColor(normalizeColor(current)||'#6366f1');
  colorDialog.showModal();
}
colorDialog.addEventListener('close',()=>{
  if(colorOpener?.isConnected)colorOpener.focus({preventScroll:true});
  colorOpener=null;
});
$('#paletteGrid').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if(b)previewColor(b.dataset.color.toLowerCase()); });
$('#colorHex').addEventListener('input',()=>{const color=normalizeColor($('#colorHex').value);if(color)previewColor(color,false,true);else{$('#colorHex').setAttribute('aria-invalid','true');$('#colorError').textContent='Usa 3 o 6 caracteres HEX (0–9, A–F).';$('#applyColor').disabled=true;}});
for(const id of ['colorHue','colorSaturation','colorLightness'])$('#'+id).addEventListener('input',()=>previewColor(hslHex(Number($('#colorHue').value),Number($('#colorSaturation').value)/100,Number($('#colorLightness').value)/100),true));
$('#applyColor').onclick=()=>{if($('#applyColor').disabled)return;const cb=colorCb;colorDialog.close();if(cb)cb(colorDraft);};
$('#colorHex').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#applyColor').click();}});

/* ---------- Nombre de la app ---------- */
const nameEl = $('#appName'), nameInput = $('#appNameInput');
// Historial 1.10.135: adopción de Tiesen (tema base, acento índigo y Geist). Desde 1.10.138 se aplica el modo sin migrar ni recolorear los datos del perfil.
function applyBrand(){
  const mode = curTheme().mode;
  document.documentElement.dataset.theme = curTheme().id;
  if (mode) document.documentElement.dataset.mode = mode; else delete document.documentElement.dataset.mode;
  const n = state.settings.appName || 'Presupuesto';
  nameEl.textContent = n;
  if (document.activeElement !== nameInput) nameInput.value = n;
  document.title = n;
  applyUiIcons(); applyThemeVars(); applyAccent(); applyAppFont(); applyBrowserChrome();cacheBootAppearance();
}
// Caché derivada y local por perfil; no contiene finanzas ni cambia el estado sincronizado.
function cacheBootAppearance(){
  try{
    const root=document.documentElement,css=getComputedStyle(root),hex=v=>/^#[a-f\d]{6}$/i.test(v),data={mode:root.dataset.mode||'',systemDark:matchMedia('(prefers-color-scheme: dark)').matches,mobile:mobileLayout.matches};
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
function themeForeground(color, background){
  if (colorContrast(color,background) >= 4.5) return color;
  return colorContrast('#000000',background) > colorContrast('#ffffff',background) ? '#000000' : '#ffffff';
}
function fitThemeColor(color, background, minimum=3){
  const surfaces=Array.isArray(background)?background:[background];
  const target=hexLum(surfaces[0])<.25?'#ffffff':'#111113';
  for(let step=0;step<=40;step++){
    const candidate=mixHex(color,target,step/40);
    if(surfaces.every(surface=>colorContrast(candidate,surface)>=minimum))return candidate;
  }
  return target;
}
const FINANCE_COLOR_ROLES = [
  ['income','Ingresos','chart-2'], ['expense','Gastos','chart-1'],
  ['savings','Ahorro','chart-5'], ['balance','Saldo acumulado','chart-3']
];
const FINANCE_TONES = {soft:3, standard:3, strong:5};
const financeColorKey = 'budgetPlanner.financeColors';
let financeColors = {tone:'standard', colors:{}};
try {
  const stored = JSON.parse(localData.readText(financeColorKey));
  if (Object.hasOwn(FINANCE_TONES, stored?.tone)) financeColors.tone = stored.tone;
  for (const [role] of FINANCE_COLOR_ROLES){
    const color = stored?.colors?.[role];
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) financeColors.colors[role] = color;
  }
} catch (error) { /* Una preferencia ilegible usa la paleta original. */ }

function financialChartColor(color, surface = cssVar('--surface'), tone = financeColors.tone){
  const ink = hexLum(surface)<.25 ? '#ffffff' : '#111113';
  const seed = tone === 'soft' ? mixHex(color,surface,.17) : tone === 'strong' ? mixHex(color,ink,.18) : color;
  return fitThemeColor(seed,surface,FINANCE_TONES[tone]);
}

function saveFinanceColors(preference){
  try {
    localData.writeText(financeColorKey, JSON.stringify(preference));
  } catch (error) {
    return false;
  }
  financeColors = preference;
  renderAll();
  return true;
}

function applyThemeVars(){
  const r=document.documentElement.style, t=curTheme(), dark=isDarkUI();
  // Superficies propias del tema: ui en oscuro, uiLight en claro; texto y texto secundario son opcionales.
  const ui=themeUi(t,dark),uiMap=[['--bg','bg'],['--surface','surface'],['--surface-2','s2'],['--border','border'],['--text','text'],['--muted','muted']];
  for(const [key,field] of uiMap){if(ui?.[field])r.setProperty(key,ui[field]);else r.removeProperty(key);}
  const palette = themePalette(t, dark);
  for (const key of PALETTE_KEYS){
    if (palette?.[key]) r.setProperty('--color-'+key, palette[key]);
    else r.removeProperty('--color-'+key);
  }
  for (const key of ['--ring','--radius','--shadow-sm','--destructive-ink']) r.removeProperty(key);
  if (palette){
    r.setProperty('--ring', palette.ring);
    r.setProperty('--destructive-ink',themeForeground(palette['destructive-foreground'],palette.destructive));
    r.setProperty('--radius', palette.radius);
    r.setProperty('--muted',fitThemeColor(palette['muted-foreground'],[palette.background,palette.card,palette.muted,palette.popover],4.65));
    if (palette['shadow-blur']) r.setProperty('--shadow-sm', palette['shadow-offset-x']+' '+palette['shadow-offset-y']+' '+palette['shadow-blur']+' '+palette['shadow-spread']+' rgb(0 0 0 / '+palette['shadow-opacity']+')');
  }
  const surface=ui.surface, textSurfaces=[surface,ui.s2,ui.bg];
  for(const [role,,key] of FINANCE_COLOR_ROLES){
    const base = fitThemeColor(palette[key], surface);
    const soft = mixHex(base, surface, dark ? .84 : .88);
    const ink = fitThemeColor(base, [...textSurfaces, soft], 4.65);
    const series = financialChartColor(financeColors.colors[role] || palette[key], surface);
    const tint = mixHex(series, surface, dark ? .84 : .88);
    r.setProperty('--'+role+'-chart',series);
    r.setProperty('--'+role+'-soft',soft);
    r.setProperty('--'+role,ink);
    r.setProperty('--'+role+'-figure',fitThemeColor(series,[...textSurfaces,tint],financeColors.tone==='strong'?5.5:4.65));
    r.setProperty('--'+role+'-figure-soft',tint);
    if(role==='expense')r.setProperty('--on-expense',themeForeground('#ffffff',ink));
  }
  r.setProperty('--warn-ink', dark ? '#fbbf24' : '#854d0e');
}

function applyAccent(){
 const r=document.documentElement.style,p=themePalette(curTheme());
 for(const [key,value] of Object.entries({'--primary':p.primary,'--primary-fill':p.primary,'--primary-soft':p.accent,'--on-primary':p['primary-foreground'],'--accent':p.primary,'--accent-bg':p.accent,'--accent-ink':p.primary}))r.setProperty(key,value);
}
// El nombre se edita en Ajustes: en la cabecera era fácil cambiarlo por accidente.
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter'){ e.preventDefault(); nameInput.blur(); }
  if (e.key === 'Escape'){ nameInput.value = state.settings.appName || 'Presupuesto'; nameInput.blur(); }
});
nameInput.addEventListener('change', () => {
  const v = nameInput.value.replace(/\s+/g, ' ').trim().slice(0, 40) || 'Presupuesto';
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
  dpEl.inert=false;
  if (dpEl.showPopover){ try{ if (!dpEl.matches(':popover-open')) dpEl.showPopover(); }catch(e){} }
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
  dpEl.inert=true;
  dpEl._hideTimer=setTimeout(() => { if (!dpS && dpEl.hidePopover){ try{ dpEl.hidePopover(); }catch(e){} } }, reduceMotion()?0:MOTION.popup);
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
  dpEl.style.transformOrigin = Math.max(0,Math.min(w,r.left+r.width/2-left))/zoom+'px '+(up?'bottom':'top');
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
