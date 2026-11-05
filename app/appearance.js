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
const THEMES = [
  {id:'minimal', name:'Claro', desc:'Siempre en modo claro, íconos en negro puro', mode:'light', accent:'#000000', uniform:'#000000', inc:'#3f3f46', exp:'#a1a1aa', sav:'#18181b'},
  {id:'mono', name:'Oscuro OLED', desc:'Siempre en negro puro, íconos en blanco puro', mode:'dark', accent:'#ffffff', uniform:'#ffffff', inc:'#e4e4e7', exp:'#71717a', sav:'#a1a1aa'},
  {id:'sage', name:'Monocromático', desc:'Íconos en un solo color que tú eliges', custom:true, accent:'#5f7f68', uniform:'#6b8f75', inc:'#8fb39a', exp:'#c7d6cb', sav:'#4f6f58'},
  {id:'pastel', name:'Pastel', desc:'Suave y luminoso, ideal para modo oscuro', accent:'#8b7fd6', inc:'#a6e3a1', exp:'#f38ba8', sav:'#cba6f7',
   c:R('#89b4fa','#fab387','#74c7ec','#f9e2af','#89dceb','#cba6f7','#f5c2e7','#b4befe','#f38ba8','#94e2d5','#f2cdcd','#a6e3a1','#f9e2af','#eba0ac','#a6e3a1','#f5e0dc')},
  {id:'vivid', name:'Vibrante', desc:'Intenso pero equilibrado', accent:'#1e66f5', inc:'#40a02b', exp:'#d20f39', sav:'#8839ef',
   c:R('#1e66f5','#fe640b','#209fb5','#df8e1d','#40a02b','#8839ef','#ea76cb','#7287fd','#d20f39','#179299','#dd7878','#40a02b','#df8e1d','#e64553','#04a5e5','#dc8a78')},
  {id:'nordic', name:'Nórdico', desc:'Escarcha y aurora boreal', accent:'#5e81ac', inc:'#a3be8c', exp:'#bf616a', sav:'#b48ead',
   c:R('#5e81ac','#d08770','#81a1c1','#ebcb8b','#a3be8c','#b48ead','#c5727a','#88c0d0','#bf616a','#8fbcbb','#9aa5b8','#a3be8c','#ebcb8b','#c79a7a','#7fb0c7','#b0bccf')},
  {id:'rose', name:'Rosé Pine', desc:'Rosa, oro, pino e iris', accent:'#907aa9', inc:'#56949f', exp:'#eb6f92', sav:'#c4a7e7',
   c:R('#31748f','#f6c177','#9ccfd8','#ebbcba','#56949f','#c4a7e7','#eb6f92','#907aa9','#b4637a','#286983','#908caa','#9ccfd8','#f6c177','#d7827e','#ea9d34','#6e6a86')},
  {id:'dracula', name:'Drácula', desc:'Neón suave sobre gris púrpura', mode:'dark', ui:{bg:'#14151b', surface:'#1d1e26', s2:'#282a36', border:'#2f3142'}, accent:'#bd93f9', inc:'#50fa7b', exp:'#ff5555', sav:'#bd93f9',
   c:R('#8be9fd','#ffb86c','#6272a4','#f1fa8c','#50fa7b','#bd93f9','#ff79c6','#9aa5ff','#ff5555','#5af0c6','#a4abc6','#50fa7b','#f1fa8c','#ff92df','#79dafa','#c9a8ff')},
  {id:'tokyo', name:'Tokyo Night', desc:'Azules nocturnos con luces de neón', mode:'dark', ui:{bg:'#111219', surface:'#1a1b26', s2:'#24283b', border:'#292e42'}, accent:'#7aa2f7', inc:'#9ece6a', exp:'#f7768e', sav:'#bb9af7',
   c:R('#7aa2f7','#ff9e64','#7dcfff','#e0af68','#73daca','#bb9af7','#f7768e','#2ac3de','#db4b4b','#9ece6a','#a9b1d6','#9ece6a','#e0af68','#ff9e64','#b4f9f8','#565f89')},
  {id:'gruvbox', name:'Gruvbox', desc:'Retro cálido: mostaza, óxido y musgo', accent:'#d65d0e', inc:'#98971a', exp:'#cc241d', sav:'#b16286',
   c:R('#458588','#d65d0e','#83a598','#d79921','#689d6a','#b16286','#d3869b','#8ec07c','#cc241d','#98971a','#a89984','#98971a','#fabd2f','#fe8019','#83a598','#928374')},
  {id:'solar', name:'Solarized', desc:'Clásico de alto contraste y tonos precisos', accent:'#268bd2', inc:'#859900', exp:'#dc322f', sav:'#6c71c4',
   c:R('#268bd2','#cb4b16','#2aa198','#b58900','#859900','#6c71c4','#d33682','#3f8fc4','#dc322f','#2aa198','#93a1a1','#859900','#b58900','#cb4b16','#268bd2','#657b83')},
  {id:'everforest', name:'Everforest', desc:'Bosque suave y cálido, descansa la vista', accent:'#7fbbb3', inc:'#a7c080', exp:'#e67e80', sav:'#d699b6',
   c:R('#7fbbb3','#e69875','#83c092','#dbbc7f','#a7c080','#d699b6','#e67e80','#9fb6c9','#d6676b','#83c092','#9da9a0','#a7c080','#dbbc7f','#e5a07f','#8fb8ad','#859289')},
  {id:'kanagawa', name:'Kanagawa', desc:'Inspirado en la ola: índigo, sakura y otoño', accent:'#7e9cd8', inc:'#98bb6c', exp:'#e46876', sav:'#957fb8',
   c:R('#7e9cd8','#ffa066','#7fb4ca','#e6c384','#6a9589','#957fb8','#d27e99','#9cabca','#c34043','#76946a','#727169','#98bb6c','#dca561','#e98a6b','#7aa89f','#658594')},
  {id:'ocean', name:'Océano', desc:'Azules, turquesas y arena', accent:'#1e6091', inc:'#34a0a4', exp:'#e76f51', sav:'#5e60ce',
   c:R('#2a6f97','#e9c46a','#61a5c2','#89c2d9','#52b69a','#5e60ce','#f28482','#4361ee','#e76f51','#2ec4b6','#a9b4c2','#34a0a4','#76c893','#c9ada7','#00b4d8','#184e77')},
  {id:'earth', name:'Tierra', desc:'Terracota, oliva, arena y café', accent:'#9c6644', inc:'#588157', exp:'#a44a3f', sav:'#bc6c25',
   c:R('#9c6644','#d4a373','#6b705c','#e9c46a','#8a9a5b','#bc6c25','#c97b63','#606c38','#a44a3f','#588157','#b7b7a4','#588157','#dda15e','#b08968','#a3b18a','#7f5539')},
  {id:'sunset', name:'Atardecer', desc:'Coral, durazno, ciruela y salvia', accent:'#e56b6f', inc:'#7fb7a4', exp:'#c44569', sav:'#6d597a',
   c:R('#e56b6f','#f4a261','#b56576','#f6bd60','#7fb7a4','#6d597a','#f28482','#915f78','#c44569','#84a59d','#eaac8b','#7fb7a4','#f6bd60','#e0a07e','#f7b267','#6d597a')},
  {id:'forest', name:'Bosque', desc:'Pino, musgo, salvia y ocre', accent:'#2d6a4f', inc:'#40916c', exp:'#9c4a3c', sav:'#c9a227',
   c:R('#2d6a4f','#d4a373','#52796f','#c9a227','#74c69d','#6b9080','#b08d57','#354f52','#9c4a3c','#40916c','#a3b18a','#40916c','#c9a227','#8c6a5d','#84a98c','#1b4332')},
  {id:'cafe', name:'Café', desc:'Espresso, caramelo, crema y canela', accent:'#7f5539', inc:'#8a9a5b', exp:'#a4473e', sav:'#c8a27c',
   c:R('#6f4e37','#c8a27c','#a67b5b','#e0c9a6','#8a9a5b','#b5835a','#d4a373','#8b5a3c','#a4473e','#7f5539','#b9a89a','#8a9a5b','#d9b382','#c19a6b','#a98467','#5c4033')},
  {id:'lavender', name:'Lavanda', desc:'Lilas, malvas y rosas empolvados', accent:'#8b6fc0', inc:'#7fb5a4', exp:'#d16d8a', sav:'#a78bfa',
   c:R('#8b6fc0','#e8a7b8','#a5b4fc','#e9d5a3','#9cc9b9','#b794f4','#f0a6ca','#9f8fd8','#d16d8a','#7fb5a4','#c4b5d0','#7fb5a4','#e9c48f','#d8a7c4','#93b5e0','#7c6a9a')},
  // Oscuros: fuerzan el modo oscuro y tiñen apenas el fondo (casi negro) con el tono del tema
  {id:'midnight', name:'Medianoche', desc:'Azul marino profundo con luces frías', mode:'dark', ui:{bg:'#05070d', surface:'#0c111c', s2:'#151c2b', border:'#1c2537'}, accent:'#6d8dff', inc:'#4fd1a5', exp:'#ff6b81', sav:'#9b8cff',
   c:R('#6d8dff','#ffa94d','#4cc9f0','#ffd166','#4fd1a5','#9b8cff','#ff8fab','#7aa7ff','#ff6b81','#3ddbd9','#94a3b8','#4fd1a5','#ffd166','#f4a28c','#72ddf7','#8093f1')},
  {id:'obsidian', name:'Obsidiana', desc:'Joyas sobre negro: amatista, esmeralda y rubí', mode:'dark', ui:{bg:'#07060a', surface:'#100e16', s2:'#1a1722', border:'#241f2e'}, accent:'#a78bfa', inc:'#34d399', exp:'#f43f5e', sav:'#c084fc',
   c:R('#818cf8','#fb923c','#38bdf8','#facc15','#34d399','#c084fc','#f472b6','#a78bfa','#f43f5e','#2dd4bf','#a1a1aa','#34d399','#fbbf24','#fda4af','#22d3ee','#e879f9')},
  {id:'charcoal', name:'Carbón', desc:'Grafito sobrio con un toque ámbar', mode:'dark', ui:{bg:'#0b0b0c', surface:'#141416', s2:'#1e1e21', border:'#28282c'}, accent:'#f5a524', inc:'#7dc49b', exp:'#e5737d', sav:'#d9a55b',
   c:R('#8ea4c8','#e0a46b','#7fb2bf','#d9b65b','#7dc49b','#b49bd1','#d98fa8','#9aa6c4','#e5737d','#78b8a8','#9a9aa3','#7dc49b','#e8c070','#c9a18a','#8cbcd6','#a3a3b3')},
  {id:'wine', name:'Vino', desc:'Burdeos, ciruela y dorado de noche', mode:'dark', ui:{bg:'#0c0607', surface:'#170d10', s2:'#221418', border:'#2e1b21'}, accent:'#e0607e', inc:'#8fc79a', exp:'#ff6f7d', sav:'#c58fd6',
   c:R('#d9748f','#e8a76b','#b48ab8','#e6c27a','#8fc79a','#c58fd6','#f29bb2','#a98bd4','#ff6f7d','#7fbfb0','#a8959b','#8fc79a','#e6c27a','#d99a86','#9fb7e0','#b06a82')},
  {id:'nightforest', name:'Bosque nocturno', desc:'Verdes profundos y luciérnagas', mode:'dark', ui:{bg:'#050a07', surface:'#0b140f', s2:'#132019', border:'#1a2b21'}, accent:'#4ade80', inc:'#4ade80', exp:'#f87171', sav:'#facc15',
   c:R('#5fb98a','#e3a15e','#6fa8dc','#e4c95b','#4ade80','#a3c76b','#e58f8f','#7cc6a4','#f87171','#2fbf8f','#94a39a','#4ade80','#facc15','#c9a27a','#6fc3c9','#8fae7a')}];
// Monocromático personalizable: todo sale de un solo color elegido por el usuario
function syncMono(){
  const t = THEMES.find(x => x.id === 'sage'), c = /^#[0-9a-f]{6}$/i.test(state.settings.monoColor || '') ? state.settings.monoColor : '#6b8f75';
  const L = hexLight(c), sat = hueOf(c).s;
  t.uniform = c; t.accent = L > .7 ? toneHex(c, .42, Math.min(.6, sat)) : c;
  t.inc = toneHex(c, Math.min(.72, L + .14), 0); t.exp = toneHex(c, Math.min(.86, L + .28), 0); t.sav = toneHex(c, Math.max(.28, L - .12), 0);
  t.desc = `Íconos en un solo color: ${colorName(c).toLowerCase()}`;
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
  syncMono();
  const t = THEMES.find(x => x.id === id); if (!t) return;
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
const FONTS = [
  {id:'jakarta', name:'Plus Jakarta', desc:'La original: moderna y amable', body:`"Plus Jakarta Sans",${SANS_FB}`},
  {id:'claude', name:'Estilo Claude', desc:'Serif editorial, como las respuestas de Claude', body:`"Source Serif 4",${SERIF_FB}`, num:'"lnum","tnum"'},
  {id:'geist', name:'Geist', desc:'Limpia y moderna, con cifras claras', body:`"Geist",${SANS_FB}`, num:'"tnum"'},
  {id:'geistmono', name:'Geist Mono', desc:'Monoespaciada, ideal para tablas y cifras', body:`"Geist Mono",ui-monospace,monospace`, num:'"tnum"'},
  {id:'geistserif', name:'Geist Serif', desc:'Serif con detalles expresivos', body:`"Geist Serif",${SERIF_FB}`, num:'"tnum"'},
  {id:'apple', name:'Apple · SF', desc:'SF en Apple; Inter en otros dispositivos', body:`-apple-system,BlinkMacSystemFont,"Inter",${SANS_FB}`, num:'"tnum"'},
  {id:'googlesans', name:'Google Sans', desc:'La de Google: clara y amable', body:`"Google Sans",${SANS_FB}`, num:'"tnum"'},
  {id:'publicsans', name:'Public Sans', desc:'Sobria y legible para cifras y presupuestos', body:`"Public Sans",${SANS_FB}`, num:'"tnum"'},
  {id:'inter', name:'Inter', desc:'Neutra y muy legible en pantalla', body:`"Inter",${SANS_FB}`, num:'"tnum"'},
  {id:'dmsans', name:'DM Sans', desc:'Geométrica y limpia', body:`"DM Sans",${SANS_FB}`},
  {id:'manrope', name:'Manrope', desc:'Compacta, ideal para cifras', body:`"Manrope",${SANS_FB}`},
  {id:'spacegrotesk', name:'Space Grotesk', desc:'Moderna, con carácter tecnológico', body:`"Space Grotesk",${SANS_FB}`, num:'"tnum"'},
  {id:'roboto', name:'Roboto', desc:'Clásica, clara y familiar', body:`Roboto,${SANS_FB}`, num:'"tnum"'},
  {id:'plexsans', name:'IBM Plex Sans', desc:'Precisa, inspirada en diseño editorial y técnico', body:`"IBM Plex Sans",${SANS_FB}`, num:'"tnum"'},
  {id:'plexmono', name:'IBM Plex Mono', desc:'Monoespaciada: cifras y texto con ancho uniforme', body:`"IBM Plex Mono",ui-monospace,monospace`, num:'"tnum"'},
  {id:'nunito', name:'Nunito', desc:'Redondeada y suave', body:`"Nunito",${SANS_FB}`},
  {id:'system', name:'Del sistema', desc:'La fuente nativa de tu celular o computadora', body:SANS_FB, num:'"tnum"'}];
// Compatibilidad con elecciones guardadas de opciones retiradas.
const FONT_REPLACEMENTS = {claudemix:'claude', geistserifheart:'geistserif', geistserifsquare:'geistserif', geistseriftriangle:'geistserif', geistpixelcircle:'geistmono', geistpixelgrid:'geistmono', geistpixelline:'geistmono', geistpixelsquare:'geistmono', geistpixeltriangle:'geistmono'};
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
  const family = (f.id === 'apple' ? '"Inter"' : f.body.split(',')[0]);
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
  $('#fontNote').textContent = cur === 'apple' ? 'Usa San Francisco del sistema en iPhone, iPad y Mac; en otros dispositivos usa Inter. Funciona sin internet.' : cur === 'system' ? 'Usa la fuente nativa de tu dispositivo: San Francisco en Apple, Segoe UI en Windows o la predeterminada de Android. Su apariencia varía entre sistemas.' : cur === 'claude' ? 'Las fuentes de Claude (Anthropic Sans y Anthropic Serif) son de uso exclusivo de Anthropic; aquí usamos Source Serif 4, una serif libre muy parecida.' : 'Cambia la letra de toda la app. Funciona sin internet.';
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-font]'); if (!b) return;
  const prev = state.settings.font; state.settings.font = b.dataset.font; save();
  (document.fonts ? document.fonts.load(`16px ${curFont().body.split(',')[0]}`) : Promise.resolve()).catch(() => {}).then(() => { applyFont(); renderFonts(); renderAll(); moveTabInd(); });
  toast(`Letra: ${curFont().name}`, {icon:'type', action:'Deshacer', onAction: () => { state.settings.font = prev; save(); applyFont(); renderFonts(); renderAll(); moveTabInd(); }});
});
function renderThemes(){
  const el=$('#themeGrid');if(!el)return;syncMono();const cur=state.settings.theme;
  const card=t=>{
    const dark=t.mode==='dark'||(!t.mode&&isDarkUI()), surface=t.ui?.surface||(dark?'#101114':'#ffffff');
    const bg=t.ui?.bg||(dark?'#060708':'#f4f5f8'), series=themeSeries(t,surface), cols=themeColors(t);
    const categories=[0,1,2,3,4].map(i=>fitThemeColor(cols[i],surface,3));
    return `<div class="theme-option"><button type="button" class="theme-card${t.id===cur?' active':''}" data-theme="${t.id}" aria-pressed="${t.id===cur}" title="${esc(t.desc)}">
      <div class="theme-preview" style="--preview-bg:${bg};--preview-surface:${surface};--preview-income:${series.income};--preview-expense:${series.expense};--preview-saving:${series.savings}">
        <div class="theme-preview-bars">${[40,65,53,82,68,92].map((v,i)=>`<i style="height:${v}%"></i><i class="out" style="height:${v*.67}%"></i>`).join('')}</div>
        <svg class="theme-preview-line" viewBox="0 0 180 46" aria-hidden="true"><path d="M2 41 L36 35 L70 31 L104 21 L138 17 L178 4"/><circle cx="178" cy="4" r="2.5"/></svg>
        <div class="theme-preview-categories">${categories.map(c=>`<i style="background:${c}"></i>`).join('')}</div>
      </div><div class="tc-row"><b>${esc(t.name)}</b>${t.id===cur?`<span class="tc-on">${ic('check')}</span>`:''}</div>
      <span class="theme-mode-label">${t.mode==='light'?'Siempre claro':t.mode==='dark'?'Siempre oscuro':'Se adapta al dispositivo'}</span></button>
      ${t.custom?'<button type="button" class="btn sm theme-custom" data-mono-pick>Elegir color</button>':''}</div>`;
  };
  const recommended=['pastel','nordic','ocean','forest','lavender','earth'];
  const group=(title,list)=>'<div class="tg-title">'+title+'</div>'+list.map(card).join('');
  const extra=THEMES.filter(t=>!t.uniform&&!recommended.includes(t.id));
  el.innerHTML='<div class="theme-key"><span style="--key:var(--income-chart)">Ingresos</span><span style="--key:var(--expense-chart)">Gastos</span><span style="--key:var(--k-violet)">Ahorro acumulado</span></div>'+group('Neutros',THEMES.filter(t=>t.uniform))+group('Paletas esenciales',THEMES.filter(t=>recommended.includes(t.id)))+
    '<details class="theme-more"'+(extra.some(t=>t.id===cur)?' open':'')+'><summary>Más paletas <span>'+extra.length+' opciones</span></summary><div class="theme-more-grid">'+extra.map(card).join('')+'</div></details>';
  const t=curTheme();
  const custom=t&&state.categories.some(c=>String(c.color).toLowerCase()!==String(themeMap(t)[c.id]).toLowerCase());
  $('#themeNote').textContent=t?'Tema '+t.name+(custom?' · categorías personalizadas.':'.')+' Las muestras muestran ingresos, gastos, ahorro y categorías.':'Elige una paleta para coordinar categorías, metas, indicadores y gráficos.';
}

$('#themeGrid').addEventListener('click', e => {
  if (e.target.closest('[data-mono-pick]')){
    e.stopPropagation();
    return openColor(state.settings.monoColor || '#6b8f75', col => { state.settings.monoColor = col; applyTheme('sage'); });
  }
  const b = e.target.closest('[data-theme]'); if (b) applyTheme(b.dataset.theme);
});
$('#themeGrid').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-mono-pick]')){ e.preventDefault(); e.stopPropagation(); e.target.click(); } });

const curTheme = () => THEMES.find(x => x.id === state.settings.theme);
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
  syncMono();
  const tm = THEMES.find(x => x.id === state.settings.theme), mode = tm && tm.mode;
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
  const uiKeys=['--bg','--surface','--surface-2','--border'];
  if(t?.ui && dark){r.setProperty('--bg',t.ui.bg);r.setProperty('--surface',t.ui.surface);r.setProperty('--surface-2',t.ui.s2);r.setProperty('--border',t.ui.border);}
  else uiKeys.forEach(k=>r.removeProperty(k));
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
const dpEl = document.createElement('div'); dpEl.className = 'dp'; dpEl.setAttribute('role', 'dialog');
if ('popover' in HTMLElement.prototype) dpEl.setAttribute('popover', 'manual');
document.body.appendChild(dpEl);
let dpS = null;
const pad2 = n => String(n).padStart(2, '0');
function dpOpen(anchor, o){
  if (dpS && dpS.anchor === anchor){ dpClose(); return; }
  dpClose();
  const v = o.value || '';
  dpS = {anchor, ...o, view: o.mode === 'month' ? 'months' : 'days',
    y: Number((v || todayISO()).slice(0, 4)), m: Number((v || todayISO()).slice(5, 7))};
  anchor.classList.add('open');
  // dentro de un diálogo modal el selector debe vivir en él (lo de afuera queda inactivo)
  const host = anchor.closest('dialog') || document.body; if (dpEl.parentNode !== host) host.appendChild(dpEl);
  dpRender();
  if (dpEl.showPopover){ try{ if (dpEl.matches(':popover-open')) dpEl.hidePopover(); dpEl.showPopover(); }catch(e){} }
  dpPlace();
  requestAnimationFrame(() => dpEl.classList.add('show'));
}
function dpClose(){
  if (!dpS) return;
  dpS.anchor.classList.remove('open'); dpS = null;
  dpEl.classList.remove('show');
  setTimeout(() => { if (!dpS && dpEl.hidePopover){ try{ dpEl.hidePopover(); }catch(e){} } }, 200);
}
function dpPlace(){
  if (!dpS) return;
  const r = dpS.anchor.getBoundingClientRect(), w = dpEl.offsetWidth, h = dpEl.offsetHeight;
  let left = dpS.align === 'center' ? r.left + r.width / 2 - w / 2 : r.left;
  left = Math.max(12, Math.min(left, innerWidth - w - 12));
  const up = r.bottom + 8 + h > innerHeight - 8 && r.top - 8 - h > 8;
  dpEl.classList.toggle('up', up);
  dpEl.style.left = left + 'px';
  dpEl.style.top = (up ? r.top - 8 - h : r.bottom + 8) + 'px';
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
function dpPick(v){ const S = dpS; if(S.max && v > S.max)return; dpClose(); S.onPick(v); }
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
});
document.addEventListener('pointerdown', e => { if (dpS && !dpEl.contains(e.target) && !dpS.anchor.contains(e.target)) dpClose(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dpS){ e.preventDefault(); e.stopPropagation(); dpClose(); } }, true);
addEventListener('resize', () => dpClose());
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
