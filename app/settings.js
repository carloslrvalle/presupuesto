// Presupuesto: settings.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Gestos táctiles y celebraciones ---------- */
VICONS['arrow-left'] = '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>';
VICONS['refresh-cw'] ='<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>';
const isTouchPhone = () => innerWidth <= 600;
// Hoja (diálogo) en el celular: se cierra deslizándola hacia abajo desde su parte superior
// ui.js gestiona el arrastre con Pointer Events para ratón, lápiz y tacto;
// un único controlador respeta cancel y evita cierres duplicados o diferidos.
// Deslizar a los lados cambia de mes; jalar hacia abajo (arriba de todo) sincroniza con Sheets
const ptr = document.createElement('div'); ptr.className = 'ptr'; ptr.innerHTML = ic('refresh-cw'); document.body.appendChild(ptr);
let sw = null, ptrBusy = false;
function hasHScroll(el){ for (let n = el; n && n !== document.body; n = n.parentElement){ const o = getComputedStyle(n).overflowX; if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth + 2) return true; } return false; }
document.addEventListener('touchstart', e => {
  sw = null; if (e.touches.length !== 1 || !isTouchPhone() || document.querySelector('dialog[open]') || !profMenu.hidden) return;
  const tg = e.target; if (!tg.closest || !tg.closest('main') || tg.closest('input,select,textarea,canvas,.vseg,[contenteditable]')) return;
  const t = e.touches[0]; sw = {x:t.clientX, y:t.clientY, t:Date.now(), top:window.scrollY <= 0, h:!hasHScroll(tg), pull:0};
}, {passive:true});
document.addEventListener('touchmove', e => {
  if (!sw) return; const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
  if (sw.top && !ptrBusy && syncOn() && dy > 0 && dy > Math.abs(dx) * 1.4 && window.scrollY <= 0){
    sw.pull = Math.min(120, dy * .5); ptr.classList.remove('back');
    ptr.style.opacity = Math.min(1, sw.pull / 50); ptr.style.transform = `translateY(${sw.pull - 20}px) rotate(${sw.pull * 3}deg)`;
  }
}, {passive:true});
document.addEventListener('touchend', e => {
  if (!sw) return; const s0 = sw; sw = null; const t = e.changedTouches[0], dx = t.clientX - s0.x, dy = t.clientY - s0.y;
  if (s0.pull){ if (s0.pull >= 60) pullRefresh(); else { ptr.classList.add('back'); ptr.style.opacity = 0; ptr.style.transform = 'translateY(-60px)'; } return; }
  if (s0.h && Math.abs(dx) > 70 && Math.abs(dy) < 50 && Math.abs(dx) > Math.abs(dy) * 2 && Date.now() - s0.t < 600 && !['settings', 'cats'].includes(activeTab()))
    goMonth(shiftMonth(currentMonth, dx < 0 ? 1 : -1));
});
async function pullRefresh(){
  ptrBusy = true; ptr.classList.add('spin', 'back'); ptr.style.opacity = 1; ptr.style.transform = 'translateY(44px)';
  try { if (sync.pending) await pushNow(); await startupLoad(); otherAt = 0; await refreshOther(true); renderAll(); toast('Actualizado con Sheets', {icon:'cloud'}); }
  catch(e){ toast('⚠️ No se pudo actualizar'); }
  finally { ptrBusy = false; ptr.classList.remove('spin'); ptr.style.opacity = 0; ptr.style.transform = 'translateY(-60px)'; }
}
// Confeti breve (respeta «reducir movimiento»)
function confetti(){
  if (reduceMotion()) return;
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  c.className = 'confetti'; c.width = W * dpr; c.height = H * dpr; document.body.appendChild(c);
  const x = c.getContext('2d'); x.scale(dpr, dpr);
  const cols = [cssVar('--primary'), cssVar('--income'), '#f59e0b', '#ec4899', '#38bdf8', '#a78bfa'].concat(profiles.list.map(p => p.color)).filter(Boolean);
  const P = Array.from({length:150}, (_, i) => ({x:W / 2 + (Math.random() - .5) * W * .25, y:H * .38, vx:(Math.random() - .5) * 13, vy:-Math.random() * 13 - 4, s:5 + Math.random() * 6, r:Math.random() * 6, vr:(Math.random() - .5) * .35, c:cols[i % cols.length]}));
  const t0 = performance.now(), DUR = 2000;
  (function frame(now){ const t = now - t0; x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .33; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.globalAlpha = Math.max(0, 1 - t / DUR); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); });
    if (t < DUR) requestAnimationFrame(frame); else c.remove(); })(t0);
}
// Meta lograda: celebra cuando una meta pasa a completa (no al abrir la app)
let _doneSet = null;
function checkGoalCelebration(){
  if (bothMode) return; const now = new Set(myGoals().filter(goalDone).map(g => g.id));
  if (_doneSet){ const fresh = [...now].filter(id => !_doneSet.has(id)); if (fresh.length){ const g = myGoals().find(x => x.id === fresh[0]); setTimeout(() => { confetti(); toast(`¡Meta lograda: ${g.name}!`, {icon:'party-popper'}); }, 380); } }
  _doneSet = now;
}

/* Reorganiza los controles existentes conservando sus eventos y datos. */
function setupSettings(){
 const root=$('#tab-settings'), cards=[...root.querySelectorAll('.card')];
 const [users,themes,fonts,backup,connection,methods,danger]=cards;
 root.querySelector('.toolbar').remove(); root.querySelector('.grid2').remove();
 const version=$('#appVer'),install=$('#btnInstall');
 root.replaceChildren();
 root.innerHTML=`<header class="settings-intro"><h2>Ajustes</h2></header>
 <button type="button" class="settings-status" id="settingsStatus"><span class="status-icon">${ic('cloud')}</span><span class="settings-status-copy"><strong id="settingsStatusTitle"></strong><small id="settingsStatusInfo"></small></span>${ic('chevron-right')}</button>
 <div class="settings-layout"><nav class="settings-nav" aria-label="Secciones de ajustes"></nav><div class="settings-content"><div class="settings-home"><h3>Configuración actual</h3><div class="settings-home-rows"><button type="button" class="settings-home-row" data-settings-target="users"><span class="settings-home-icon">${ic('users')}</span><span class="settings-home-copy"><b>Usuarios</b><span class="settings-home-value" id="settingsHomeUsers"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="appearance"><span class="settings-home-icon">${ic('palette')}</span><span class="settings-home-copy"><b>Apariencia</b><span class="settings-home-value" id="settingsHomeAppearance"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="methods"><span class="settings-home-icon">${ic('credit-card')}</span><span class="settings-home-copy"><b>Métodos de pago</b><span class="settings-home-value" id="settingsHomeMethods"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="data"><span class="settings-home-icon">${ic('cloud')}</span><span class="settings-home-copy"><b>Datos y sincronización</b><span class="settings-home-value" id="settingsHomeData"></span></span>${ic('chevron-right')}</button></div></div></div></div>
 <footer class="settings-footer"></footer>`;
 root.querySelector('.settings-footer').append(version,install);
 const entries=[['users','Usuarios','Nombres, fotos e íconos','users'],['appearance','Apariencia','Colores y tipografía','palette'],['methods','Métodos de pago','Organiza cómo pagas','credit-card'],['data','Datos y sincronización','Conexión y respaldos','cloud']];
 const nav=root.querySelector('.settings-nav'),content=root.querySelector('.settings-content');
 for(const [id,title,desc,icon] of entries){
  const button=document.createElement('button');button.type='button';button.dataset.settingsTarget=id;button.setAttribute('aria-controls','settings-panel-'+id);
  button.innerHTML=`<span class="settings-nav-icon">${ic(icon)}</span><span class="settings-nav-copy"><b>${title}</b><small>${desc}</small></span>${ic('chevron-right')}`;nav.append(button);
  const panel=document.createElement('section');panel.id='settings-panel-'+id;panel.className='settings-panel';panel.hidden=true;panel.setAttribute('aria-labelledby','settings-heading-'+id);
  panel.innerHTML=`<div class="settings-panel-head"><button type="button" class="iconbtn settings-back" aria-label="Volver a ajustes">${ic('arrow-left')}</button><h3 id="settings-heading-${id}" tabindex="-1">${title}</h3></div>`;
  panel.querySelector('.settings-back').onclick=()=>openSettingsSection(null,true);content.append(panel);
 }
 const panel=id=>$('#settings-panel-'+id);
 function disclosure(title,card,extra=''){
  const details=document.createElement('details');details.className='settings-disclosure '+extra;
  const summary=document.createElement('summary');summary.textContent=title;details.append(summary);
  const body=document.createElement('div');body.className='settings-disclosure-body';body.append(card);details.append(body);
  details.setExpanded=(open,animate=true)=>{
   if(details.id==='settingsConnectionConfig'&&!settingsConnectionReady())open=true;
   toggleDisclosure(details,summary,open,animate);
  };
  summary.addEventListener('click',e=>{e.preventDefault();details.setExpanded(details._disclosure?!details._disclosure.open:!details.open);});
  return details;
 }
 users.querySelector('p').textContent='Cada usuario conserva sus propios datos y preferencias. Toca su nombre, avatar o foto para editarlo.';
 users.querySelector('h3').remove();panel('users').append(users);
 const themeDetails=disclosure('Tema de colores',themes),fontDetails=disclosure('Tipografía',fonts);
 themeDetails.querySelector('summary').insertAdjacentHTML('beforeend','<small id="settingsThemeName"></small>');
 fontDetails.querySelector('summary').insertAdjacentHTML('beforeend','<small id="settingsFontName"></small>');
 panel('appearance').append(themeDetails,fontDetails);
 methods.querySelector('p').textContent='Agrega tus métodos de pago. Toca un nombre para editarlo.';
 methods.querySelector('h3').remove();methodsInput.hidden=true;
 methods.insertAdjacentHTML('beforeend',`<div class="settings-methods" id="settingsMethods"></div><form class="settings-method-add" id="settingsMethodForm"><input id="settingsMethodName" aria-label="Nombre del método de pago" placeholder="Ej. Transferencia" maxlength="60" required><button class="btn primary" type="submit" id="settingsMethodSubmit">Agregar</button></form><div class="settings-method-help" id="settingsMethodHelp" role="status"></div>`);
 panel('methods').append(methods);
 let editing=-1;
 const commit=()=>{methodsInput.value=state.settings.methods.join(', ');methodsInput.dispatchEvent(new Event('change'));renderSettingsOverview();};
 $('#settingsMethodForm').onsubmit=e=>{e.preventDefault();const input=$('#settingsMethodName'),name=input.value.trim(),list=state.settings.methods;
  if(!name||name.includes(',')){ $('#settingsMethodHelp').textContent='Escribe un nombre sin comas.';return; }
  if(list.some((m,i)=>i!==editing&&m.toLocaleLowerCase()===name.toLocaleLowerCase())){$('#settingsMethodHelp').textContent='Este método ya existe.';return;}
  if(editing<0)list.push(name);else list[editing]=name;
  editing=-1;input.value='';$('#settingsMethodSubmit').textContent='Agregar';$('#settingsMethodHelp').textContent='';commit();
 };
 $('#settingsMethods').onclick=e=>{const button=e.target.closest('button');if(!button)return;const i=Number(button.dataset.index);
  if(button.dataset.action==='remove'){state.settings.methods.splice(i,1);editing=-1;$('#settingsMethodName').value='';$('#settingsMethodSubmit').textContent='Agregar';commit();}
  else{editing=i;$('#settingsMethodName').value=state.settings.methods[i];$('#settingsMethodSubmit').textContent='Guardar';$('#settingsMethodName').focus();$('#settingsMethodHelp').textContent='Editando método de pago.';}
 };
 panel('data').append(connection,backup,danger);
 const stack=connection.querySelector('.stack'),config=document.createElement('div');
 for(const id of ['syncUrl','syncToken'])config.append($('#'+id).closest('.field'));
 config.append($('#btnSyncConnect'));
 const configDetails=disclosure('Configurar conexión',config);configDetails.id='settingsConnectionConfig';stack.append(configDetails);
 const advanced=document.createElement('div');advanced.append($('#btnSyncPush'),$('#btnSyncPull'));advanced.className='toolbar';
 const advancedDetails=disclosure('Opciones avanzadas',advanced);
 connection.querySelector('p').textContent='Tus cambios se guardan en este dispositivo y se sincronizan con tu hoja cuando hay conexión.';
 const emptyToolbar=stack.querySelector('.toolbar');if(emptyToolbar)emptyToolbar.remove();
 $('#syncToken').type='password';$('#syncToken').insertAdjacentHTML('afterend','<button class="btn sm" type="button" id="settingsShowKey" aria-pressed="false">Mostrar clave</button>');
 $('#settingsShowKey').onclick=e=>{const show=$('#syncToken').type==='password';$('#syncToken').type=show?'text':'password';e.currentTarget.textContent=show?'Ocultar clave':'Mostrar clave';e.currentTarget.setAttribute('aria-pressed',String(show));};
 stack.append(configDetails,advancedDetails);
 const connHeading=$('#connBox .conn-h');if(connHeading)connHeading.lastChild.textContent='Conectar otro dispositivo';
 backup.querySelector('p').textContent='Descarga una copia para conservarla o restaura un respaldo anterior.';
 danger.querySelector('p').textContent='Borra movimientos y presupuestos del usuario activo. Con sincronización automática, el borrado también se enviará a Sheets. Exporta un respaldo antes de continuar.';
 panel('data').append(connection,disclosure('Respaldos y exportación',backup),disclosure('Borrar datos',danger,'settings-danger'));
 root.addEventListener('click',e=>{const b=e.target.closest('[data-settings-target]');if(b)openSettingsSection(b.dataset.settingsTarget,true);});
 $('#settingsStatus').onclick=()=>{
  openSettingsSection('data',true);
  configDetails.setExpanded(true);
  if(!settingsConnectionReady())$('#syncUrl').focus({preventScroll:true});
 };
 new MutationObserver(()=>renderSettingsStatus()).observe($('#syncInfo'),{childList:true,characterData:true,subtree:true});
 new MutationObserver(()=>renderSettingsOverview()).observe($('#themeGrid'),{childList:true});
 new MutationObserver(()=>renderSettingsOverview()).observe($('#fontGrid'),{childList:true});
 // La primera conexión debe mantener visibles los campos que reciben el foco.
 if(!settingsConnectionReady()){configDetails.setExpanded(true,false);if(!state.transactions.length&&!state.goals.length)openSettingsSection('data');}
}
let settingsVerifiedConnection=syncOn()&&sync.lastSync?sync.url+'|'+sync.token:'';
function settingsConnectionReady(){return syncOn()&&settingsVerifiedConnection===sync.url+'|'+sync.token;}
function openSettingsSection(id,focus=false){
 const root=$('#tab-settings');
 const changed=(root.dataset.settingsView||null)!==id;
 if(id)root.dataset.settingsView=id;else delete root.dataset.settingsView;
 root.querySelectorAll('.settings-panel').forEach(p=>{p.hidden=p.id!=='settings-panel-'+id;});
 root.querySelector('.settings-home').hidden=!!id;
 root.querySelectorAll('[data-settings-target]').forEach(b=>{if(b.dataset.settingsTarget===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
 const target=id?$('#settings-panel-'+id):root.querySelector('.settings-home');
 if(changed)motionAnimate(target,[{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}]);
 if(focus){if(id)$('#settings-heading-'+id).focus({preventScroll:true});else root.querySelector('.settings-home [data-settings-target]').focus({preventScroll:true});}
}
function renderSettingsStatus(){
 if(!$('#settingsStatusTitle'))return;
 const config=$('#settingsConnectionConfig');
 if(config){const summary=config.querySelector('summary');summary.setAttribute('aria-disabled',String(!settingsConnectionReady()));summary.textContent=settingsConnectionReady()?'Configurar conexión':'Vincular hoja de cálculo';}
 $('#settingsStatusTitle').textContent=!settingsConnectionReady()?'Conecta tu hoja de cálculo':$('#syncBadge').classList.contains('err')?'Revisa la sincronización':sync.pending?'Cambios pendientes de sincronizar':'Google Sheets conectado';
 $('#settingsStatusInfo').textContent=$('#syncInfo').textContent;renderSettingsHome();
}
function renderSettingsHome(){
 if(!$('#settingsHomeUsers'))return;
 $('#settingsHomeUsers').textContent=profiles.list.map(p=>p.name).join(' · ');
 $('#settingsHomeAppearance').textContent=(curTheme()?.name||'Personalizado')+' · '+curFont().name;
 const methods=state.settings.methods||[];
 $('#settingsHomeMethods').textContent=methods.length?methods.slice(0,3).join(' · ')+(methods.length>3?' · +'+(methods.length-3):''):'Sin métodos definidos';
 $('#settingsHomeData').textContent=!syncOn()?'Datos en este dispositivo · Sin conectar a Sheets':$('#syncBadge').classList.contains('err')?'Revisar conexión con Google Sheets':sync.pending?'Google Sheets · Cambios pendientes':sync.lastSync?'Google Sheets · Última sincronización '+new Date(sync.lastSync).toLocaleString('es-PE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Google Sheets · Esperando sincronización';
}
function renderSettingsOverview(){
 if(!$('#settingsThemeName'))return;
 const theme=curTheme()?.name||'Personalizado',font=curFont().name;
 $('#settingsThemeName').textContent=theme;$('#settingsFontName').textContent=font;
 renderSettingsHome();
 $('#settingsMethods').innerHTML=(state.settings.methods||[]).map((m,i)=>`<span class="settings-method-chip"><button type="button" data-index="${i}" data-action="edit" aria-label="Editar ${esc(m)}">${esc(m)}</button><button type="button" data-index="${i}" data-action="remove" aria-label="Eliminar ${esc(m)}">${ic('x')}</button></span>`).join('')||'<p class="small muted">Aún no agregaste métodos de pago.</p>';
 renderSettingsStatus();
}
