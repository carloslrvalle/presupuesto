// Presupuesto: settings.js — ver README.md del proyecto para responsabilidades y orden de carga.
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
function returnRefreshIndicator(){
  ptr.classList.add('back');
  ptr.style.opacity = 0;
  ptr.style.transform = 'translateY(-60px)';
}
function cancelTouchGesture(){
  if (sw?.pull) returnRefreshIndicator();
  sw = null;
}
function hasHScroll(el){ for (let n = el; n && n !== document.body; n = n.parentElement){ const o = getComputedStyle(n).overflowX; if ((o === 'auto' || o === 'scroll') && n.scrollWidth > n.clientWidth + 2) return true; } return false; }
document.addEventListener('touchstart', e => {
  cancelTouchGesture();
  if (e.touches.length !== 1 || !isTouchPhone() || document.querySelector('dialog[open]') || !profMenu.hidden) return;
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
  if (s0.pull){ if (s0.pull >= 60) pullRefresh(); else returnRefreshIndicator(); return; }
  if (s0.h && Math.abs(dx) > 70 && Math.abs(dy) < 50 && Math.abs(dx) > Math.abs(dy) * 2 && Date.now() - s0.t < 600 && !['settings', 'cats'].includes(activeTab()))
    goMonth(shiftMonth(currentMonth, dx < 0 ? 1 : -1));
});
document.addEventListener('touchcancel',cancelTouchGesture,{passive:true});
async function pullRefresh(){
  ptrBusy = true; ptr.classList.add('spin', 'back'); ptr.style.opacity = 1; ptr.style.transform = 'translateY(44px)';
  try { if (sync.pending && !await pushNow()) return toast('Los cambios siguen pendientes de confirmación'); if (!await startupLoad()) return toast('No se pudo confirmar la actualización con Sheets'); otherAt = 0; await refreshOther(true); renderAll(); toast('Actualizado con Sheets', {icon:'cloud'}); }
  catch(e){ toast('⚠️ No se pudo actualizar'); }
  finally { ptrBusy = false; ptr.classList.remove('spin'); returnRefreshIndicator(); }
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
  (function frame(now){ if (reduceMotion()){c.remove();return;} const t = now - t0; x.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += .33; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.globalAlpha = Math.max(0, 1 - t / DUR); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); });
    if (t < DUR) requestAnimationFrame(frame); else c.remove(); })(t0);
}
// Meta lograda: celebra cuando una meta pasa a completa (no al abrir la app)
let _doneSet = null, pendingGoalCelebration = null;
function playGoalCelebration(){
  const pending=pendingGoalCelebration;
  if(!pending?.ready||bothMode||pending.profile!==activeProfile||pending.tab!==activeTab())return;
  pendingGoalCelebration=null;
  if(myGoals().some(goal=>goal.id===pending.id&&goalDone(goal)))confetti();
}
function checkGoalCelebration(){
  if (bothMode) return;
  if(pendingGoalCelebration?.profile!==activeProfile)pendingGoalCelebration=null;
  const complete=myGoals().filter(goalDone), now=new Set(complete.map(g=>g.id));
  const fresh=_doneSet&&complete.find(g=>!_doneSet.has(g.id));
  if(fresh){
    const pending={id:fresh.id,profile:activeProfile,tab:activeTab(),ready:false};
    pendingGoalCelebration=pending;
    setTimeout(()=>{
      if(bothMode||activeProfile!==pending.profile)return;
      const goal=myGoals().find(g=>g.id===pending.id);
      if(!goal||!goalDone(goal))return;
      pending.ready=true;
      playGoalCelebration();
      toast(`¡Meta lograda: ${goal.name}!`,{icon:'party-popper'});
    },380);
  }
  _doneSet = now;
}

/* Reorganiza los controles existentes conservando sus eventos y datos. */
function setupSettings(){
 const root=$('#tab-settings'), cards=[...root.querySelectorAll('.card')];
 const [users,themes,backup,connection,methods,danger]=cards;
 root.querySelector('.toolbar').remove(); root.querySelector('.grid2').remove();
 const version=$('#appVer'),install=$('#btnInstall');
 root.replaceChildren();
 root.innerHTML=`<header class="settings-intro"><h2 aria-hidden="true">Ajustes</h2></header>
 <button type="button" class="settings-status" id="settingsStatus"><span class="status-icon">${ic('cloud')}</span><span class="settings-status-copy"><strong id="settingsStatusTitle"></strong><small id="settingsStatusInfo"></small></span>${ic('chevron-right')}</button>
 <div class="settings-layout"><nav class="settings-nav" aria-label="Secciones de ajustes"></nav><div class="settings-content"><div class="settings-home"><h2 class="section-title">Configuración actual</h2><div class="settings-home-rows"><button type="button" class="settings-home-row" data-settings-target="users"><span class="settings-home-icon">${ic('users')}</span><span class="settings-home-copy"><b>Usuarios</b><span class="settings-home-value" id="settingsHomeUsers"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="appearance"><span class="settings-home-icon">${ic('palette')}</span><span class="settings-home-copy"><b>Apariencia</b><span class="settings-home-value" id="settingsHomeAppearance"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="methods"><span class="settings-home-icon">${ic('credit-card')}</span><span class="settings-home-copy"><b>Métodos de pago</b><span class="settings-home-value" id="settingsHomeMethods"></span></span>${ic('chevron-right')}</button><button type="button" class="settings-home-row" data-settings-target="data"><span class="settings-home-icon">${ic('cloud')}</span><span class="settings-home-copy"><b>Datos y sincronización</b><span class="settings-home-value" id="settingsHomeData"></span></span>${ic('chevron-right')}</button></div></div></div></div>
 <footer class="settings-footer"></footer>`;
 root.querySelector('.settings-footer').append(version,install);
 const entries=[['users','Usuarios','Nombres, fotos e íconos','users'],['appearance','Apariencia','Modo y colores de datos','palette'],['methods','Métodos de pago','Organiza cómo pagas','credit-card'],['data','Datos y sincronización','Conexión y respaldos','cloud']];
 const nav=root.querySelector('.settings-nav'),content=root.querySelector('.settings-content');
 for(const [id,title,desc,icon] of entries){
  const button=document.createElement('button');button.type='button';button.dataset.settingsTarget=id;button.setAttribute('aria-controls','settings-panel-'+id);
  button.innerHTML=`<span class="settings-nav-icon">${ic(icon)}</span><span class="settings-nav-copy"><b>${title}</b><small>${desc}</small></span>${ic('chevron-right')}`;nav.append(button);
  const panel=document.createElement('section');panel.id='settings-panel-'+id;panel.className='settings-panel';panel.hidden=true;panel.setAttribute('aria-labelledby','settings-heading-'+id);
  panel.innerHTML=`<div class="settings-panel-head"><button type="button" class="iconbtn settings-back" aria-label="Volver a ajustes">${ic('arrow-left')}</button><h2 class="section-title" id="settings-heading-${id}" tabindex="-1">${title}</h2></div>`;
  panel.querySelector('.settings-back').onclick=()=>openSettingsSection(null,true);content.append(panel);
 }
 const panel=id=>$('#settings-panel-'+id);
 function disclosure(title,card,extra=''){
  const details=document.createElement('details');details.className='settings-disclosure '+extra;
  const summary=document.createElement('summary');summary.textContent=title;details.append(summary);
  const body=document.createElement('div');body.className='settings-disclosure-body';body.append(card);details.append(body);
  details.setExpanded=open=>{
   if(details.id==='settingsConnectionConfig'&&!settingsConnectionReady())open=true;
   toggleDisclosure(details,summary,open);
  };
  summary.addEventListener('click',e=>{e.preventDefault();details.setExpanded(details._disclosure?!details._disclosure.open:!details.open);});
  return details;
 }
 users.querySelector('p').textContent='Cada usuario conserva sus propios datos y preferencias. Toca su nombre, avatar o foto para editarlo.';
 users.querySelector('h3').remove();panel('users').append(users);
 const themeDetails=disclosure('Modo de apariencia',themes);
 themeDetails.querySelector('summary').insertAdjacentHTML('beforeend','<small id="settingsThemeName"></small>');
 const fontField=document.createElement('div');fontField.id='settingsFont';fontField.className='settings-font-field';
 fontField.innerHTML='<h3>Fuente de la interfaz</h3><p id="settingsFontName">Geist Sans · Inter</p><p class="small muted">Geist en títulos; Inter en texto, importes y etiquetas. Disponibles sin conexión.</p><div class="settings-font-sample"><strong>Resumen del período</strong><span>Alimentación · S/ 1,250.90</span></div>';
 const financeForm=document.createElement('form');
 financeForm.className='settings-finance-colors';
 financeForm.innerHTML='<p class="small muted">Personaliza las series y las cifras destacadas de este dispositivo.</p>'+
   '<div class="finance-color-fields">'+FINANCE_COLOR_ROLES.map(([role,label],index)=>
     '<input type="hidden" name="'+role+'"><button type="button" class="finance-color-option" data-finance-color="'+role+'" aria-description="Personalizar color" aria-haspopup="dialog"><span class="finance-color-icon">'+ic(['arrow-down','arrow-up','piggy-bank','scale'][index])+'</span><span class="finance-color-copy"><b>'+label+'</b><small data-finance-hex></small></span><span class="finance-color-value">S/ 1,250.00</span>'+ic('chevron-right')+'</button>').join('')+
   '</div><label class="finance-tone">Intensidad <select name="tone"><option value="soft">Suave</option><option value="standard">Equilibrada</option><option value="strong">Intensa</option></select></label>'+
   '<div class="finance-color-actions"><button type="submit" class="btn primary" data-retry-colors hidden>Reintentar guardado</button><button type="button" class="btn" data-reset-colors>Restablecer</button></div><p class="small" role="status" hidden></p>';
 const financePanel=disclosure('Colores de gráficos y cifras',financeForm);
 const fields=financeForm.elements, status=financeForm.querySelector('[role=status]');
 let startingColors={};
 function renderFinancePreview(){
   const surface=cssVar('--surface'),dark=isDarkUI();
   for(const [role] of FINANCE_COLOR_ROLES){
     const color=fields.namedItem(role).value, button=financeForm.querySelector('[data-finance-color="'+role+'"]');
     const tone=fields.namedItem('tone').value, series=financialChartColor(color,surface,tone);
     const tint=mixHex(series,surface,dark?.84:.88);
     button.style.setProperty('--preview-color',fitThemeColor(series,[surface,cssVar('--surface-2'),cssVar('--bg'),tint],tone==='strong'?5.5:4.65));
     button.style.setProperty('--preview-soft',tint);
     button.querySelector('[data-finance-hex]').textContent=color.toUpperCase();
   }
 }
 function fillFinanceForm(keepEdits=false){
   const palette=themePalette(curTheme());
   for(const [role,,key] of FINANCE_COLOR_ROLES){
     const input=fields.namedItem(role), edited=input.value!==startingColors[role];
     startingColors[role]=financeColors.colors[role]||palette[key];
     if(!keepEdits||!edited)input.value=startingColors[role];
   }
   if(!keepEdits)fields.namedItem('tone').value=financeColors.tone;
   renderFinancePreview();
 }
 financeForm.addEventListener('click',event=>{
   const button=event.target.closest('[data-finance-color]');
   if(!button)return;
   const role=button.dataset.financeColor, index=FINANCE_COLOR_ROLES.findIndex(([id])=>id===role);
   button.focus({preventScroll:true});
   openColor(fields.namedItem(role).value,color=>{
     fields.namedItem(role).value=color;
     renderFinancePreview();
     financeForm.requestSubmit();
   },{title:'Color de '+FINANCE_COLOR_ROLES[index][1].toLowerCase(),icon:['arrow-down','arrow-up','piggy-bank','scale'][index]});
 });
 fields.namedItem('tone').addEventListener('change',()=>{
   renderFinancePreview();
   financeForm.requestSubmit();
 });
 function submitFinanceColors(preference,message){
   const saved=saveFinanceColors(preference);
   if(saved)fillFinanceForm();
   status.hidden=false;
   financeForm.querySelector('[data-retry-colors]').hidden=saved;
   status.classList.toggle('neg',!saved);
   status.textContent=saved?message:'No se pudieron guardar los colores. Vuelve a intentarlo.';
 }
 financePanel.querySelector('summary').addEventListener('click',()=>{
   if(!financePanel.open)return;
   fillFinanceForm();
   status.hidden=true;
 });
 themes.querySelector('#themeGrid').addEventListener('click',()=>{
   if(financePanel.open)fillFinanceForm(true);
 });
 financeForm.addEventListener('submit',event=>{
   event.preventDefault();
   const colors={...financeColors.colors};
   for(const [role] of FINANCE_COLOR_ROLES){
     const value=fields.namedItem(role).value;
     if(value!==startingColors[role])colors[role]=value;
   }
   submitFinanceColors({tone:fields.namedItem('tone').value,colors},'Colores aplicados.');
 });
 financeForm.querySelector('[data-reset-colors]').onclick=()=>submitFinanceColors({tone:'standard',colors:{}},'Colores originales restaurados.');
 panel('appearance').append(themeDetails,financePanel,fontField);
 methods.querySelector('p').textContent='Agrega tus métodos de pago. Toca un nombre para editarlo.';
 methods.querySelector('h3').remove();methodsInput.hidden=true;
 methods.insertAdjacentHTML('beforeend',`<div class="settings-methods" id="settingsMethods"></div><form class="settings-method-add" id="settingsMethodForm"><input id="settingsMethodName" aria-label="Nombre del método de pago" placeholder="Ej. Transferencia" maxlength="60" required><button class="btn primary" type="submit" id="settingsMethodSubmit">Agregar</button></form><div class="settings-method-help" id="settingsMethodHelp" role="status"></div>`);
 panel('methods').append(methods);
 let editing=null;
 const methodInput=$('#settingsMethodName'),methodSubmit=$('#settingsMethodSubmit'),methodHelp=$('#settingsMethodHelp');
 const resetMethodEditor=()=>{editing=null;methodInput.value='';methodSubmit.textContent='Agregar';methodHelp.textContent='';};
 const commit=()=>{const saved=save();methodsInput.value=state.settings.methods.join(', ');dirty.add('movs');renderSettingsOverview();return saved;};
 $('#settingsMethodForm').onsubmit=e=>{e.preventDefault();const name=methodInput.value.trim(),list=state.settings.methods||[];
  const index=editing?.profile===activeProfile?list.indexOf(editing.name):-1;
  if(editing&&index<0){resetMethodEditor();methodHelp.textContent='El método cambió. Vuelve a seleccionarlo.';return;}
  if(!name||name.includes(',')){methodHelp.textContent='Escribe un nombre sin comas.';return;}
  if(list.some((m,i)=>i!==index&&m.toLocaleLowerCase()===name.toLocaleLowerCase())){methodHelp.textContent='Este método ya existe.';return;}
  if(index<0)list.push(name);else list[index]=name;
  state.settings.methods=list;resetMethodEditor();if(commit())toast('Métodos de pago actualizados');
 };
 $('#settingsMethods').onclick=e=>{const button=e.target.closest('button');if(!button)return;const i=Number(button.dataset.index),profile=activeProfile;
  if(button.dataset.action==='remove'){const[name]=state.settings.methods.splice(i,1);resetMethodEditor();if(!commit())return;
   toast(`«${name}» eliminado`,{icon:'trash-2',action:'Deshacer',onAction:()=>{if(profile!==activeProfile||localTabChanged)return;const list=state.settings.methods??=[];if(!list.some(m=>m.toLocaleLowerCase()===name.toLocaleLowerCase()))list.splice(Math.min(i,list.length),0,name);commit();}});}
  else{editing={profile,name:state.settings.methods[i]};methodInput.value=editing.name;methodSubmit.textContent='Guardar';methodInput.focus();methodHelp.textContent='Editando método de pago.';}
 };
 $('#settingsMethods').resetEditor=resetMethodEditor;
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
 // La primera conexión debe mantener visibles los campos que reciben el foco.
 if(!settingsConnectionReady())configDetails.setExpanded(true);
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
 if(changed)revealContent(target);
 if(focus){if(id)$('#settings-heading-'+id).focus({preventScroll:true});else root.querySelector('.settings-home [data-settings-target]').focus({preventScroll:true});}
}
function renderSettingsStatus(){
 if(!$('#settingsStatusTitle'))return;
 const check = $('#btnSyncCheck');
 check.hidden = !syncOn();
 const result = $('#syncCheckResult');
 if (result.textContent && syncCheckScope !== syncScope()) result.textContent = '';
 const config=$('#settingsConnectionConfig');
 if(config){const summary=config.querySelector('summary');summary.setAttribute('aria-disabled',String(!settingsConnectionReady()));summary.textContent=settingsConnectionReady()?'Configurar conexión':'Vincular hoja de cálculo';}
 const local=!settingsConnectionReady()&&!$('#syncBadge').classList.contains('err');
 $('#settingsStatusTitle').textContent=$('#syncBadge').classList.contains('err')?'Revisa el guardado':local?'Guardado en este dispositivo':sync.pending?'Cambios pendientes de sincronizar':'Google Sheets conectado';
 $('#settingsStatusInfo').textContent=local?'Vincular Google Sheets o gestionar respaldos':$('#syncInfo').textContent;renderSettingsHome();
}
function renderSettingsHome(){
 if(!$('#settingsHomeUsers'))return;
 $('#settingsHomeUsers').textContent=profiles.list.map(p=>p.name).join(' · ');
 $('#settingsHomeAppearance').textContent=appearanceModeName();
 const methods=state.settings.methods||[];
 $('#settingsHomeMethods').textContent=methods.length?methods.slice(0,3).join(' · ')+(methods.length>3?' · +'+(methods.length-3):''):'Sin métodos definidos';
 $('#settingsHomeData').textContent=!syncOn()?'Datos en este dispositivo · Sin conectar a Sheets':$('#syncBadge').classList.contains('err')?'Revisar conexión con Google Sheets':sync.pending?'Google Sheets · Cambios pendientes':sync.lastSync?'Google Sheets · Última sincronización '+new Date(sync.lastSync).toLocaleString('es-PE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'Google Sheets · Esperando sincronización';
}
function renderSettingsOverview(){
 if(!$('#settingsThemeName'))return;
 $('#settingsThemeName').textContent=appearanceModeName();
 renderSettingsFont();
 renderSettingsHome();
 $('#settingsMethods').innerHTML=(state.settings.methods||[]).map((m,i)=>`<span class="settings-method-chip"><button type="button" data-index="${i}" data-action="edit" aria-label="Editar ${esc(m)}">${esc(m)}</button><button type="button" data-index="${i}" data-action="remove" aria-label="Eliminar ${esc(m)}">${ic('x')}</button></span>`).join('')||'<p class="small muted">Aún no agregaste métodos de pago.</p>';
 renderSettingsStatus();
}
function renderSettingsFont(){
 const font = currentFont();
 for (const radio of $('#settingsFont').querySelectorAll('input')) radio.checked = radio.value === font.id;
 $('#settingsFontName').textContent = font.name;
}
