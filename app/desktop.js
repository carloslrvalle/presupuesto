// Presentación de escritorio: los controles conservan sus eventos y sus datos.
const desktopSurface=matchMedia('(min-width:601px) and (min-height:501px), (min-width:961px), (min-width:601px) and (pointer:fine)');
const desktopSidebarSpace=matchMedia('(min-width:1050px)');
const desktopSidebar=document.createElement('aside');
desktopSidebar.id='desktopSidebar';desktopSidebar.setAttribute('aria-label','Menú lateral');
desktopSidebar.innerHTML='<div class="desktop-brand-host"></div><div class="desktop-profile-host"></div><div class="desktop-navigation-host"></div><div class="desktop-sidebar-footer"></div>';
document.body.append(desktopSidebar);
const desktopSettings=document.createElement('button');
desktopSettings.type='button';desktopSettings.className='desktop-settings';
desktopSettings.innerHTML=ic('settings')+'<span>Ajustes</span>';
desktopSettings.onclick=()=>$('#btnSettings').click();
desktopSidebar.lastElementChild.append(desktopSettings);
const desktopToggle=document.createElement('button');
desktopToggle.type='button';desktopToggle.id='desktopLayoutToggle';desktopToggle.className='iconbtn';
desktopToggle.setAttribute('aria-label','Navegación lateral');
desktopToggle.innerHTML='<svg class="vi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="4"/><path d="M9 4v16"/></svg>';
$('.topbar>.wrap').prepend(desktopToggle);
// Con barra lateral, el encabezado nombra la sección actual; el nombre de la app pasa al menú.
const desktopSectionTitle=document.createElement('h1');
desktopSectionTitle.id='desktopSectionTitle';
desktopToggle.after(desktopSectionTitle);
const desktopSectionNames={settings:'Ajustes',both:'Ambos'};
const desktopNodes=[[$('#tabs'),desktopSidebar.querySelector('.desktop-navigation-host')],[$('.top-pair'),desktopSidebar.querySelector('.desktop-profile-host')],[$('.topbar .brand'),desktopSidebar.querySelector('.desktop-brand-host')]].map(([node,parent])=>{
 const anchor=document.createComment('Posición de la navegación superior');node.before(anchor);return {node,parent,anchor};
});
// En teléfono, perfil y estado de guardado viven al inicio de Ajustes: la cabecera queda solo con el período.
const mobileProfileHost=document.createElement('div');mobileProfileHost.className='mobile-profile-host';
let desktopPreferredLayout='side';
const desktopMotionNodes=[$('.topbar'),$('main.wrap'),$('#fab')];
function stopDesktopMotion(){
 for(const node of [...desktopMotionNodes,desktopSidebar]){node._desktopMotion?.cancel();node._desktopMotion=null;}
}
function updateDesktopNavigation(){
 const active=activeTab()==='settings';desktopSettings.classList.toggle('active',active);
 if(active)desktopSettings.setAttribute('aria-current','page');else desktopSettings.removeAttribute('aria-current');
 const tab=activeTab();
 desktopSectionTitle.textContent=(mobileLayout.matches&&tab==='dashboard'?'Inicio':'')||desktopSectionNames[tab]||$(`#tabs [data-tab="${tab}"]`)?.getAttribute('aria-label')||'';
}
function positionDesktopNavigation(animate=false){
 const side=desktopSurface.matches&&desktopSidebarSpace.matches&&desktopPreferredLayout==='side';
 const changed=document.documentElement.dataset.desktopNav!==(side?'side':'top');
 const smooth=animate===true&&changed&&desktopSurface.matches&&!reduceMotion();
 // Leer la posición visible antes de cancelar permite invertir un cambio en curso sin saltos.
 const previous=smooth?desktopMotionNodes.map(node=>node.getBoundingClientRect()):[];
 stopDesktopMotion();
 document.documentElement.dataset.desktopNav=side?'side':'top';
 desktopToggle.setAttribute('aria-pressed',String(side));
 desktopToggle.title=side?'Usar navegación superior':'Usar navegación lateral';
 const focused=document.activeElement;
 for(const {node,parent,anchor} of desktopNodes){
  if(side){if(node.parentElement!==parent)parent.append(node);}
  else if(mobileLayout.matches&&node.matches('.top-pair')){
   if(!mobileProfileHost.isConnected)$('#tab-settings .settings-intro')?.after(mobileProfileHost);
   if(mobileProfileHost.isConnected&&node.parentElement!==mobileProfileHost)mobileProfileHost.append(node);
  }
  else if(node.previousSibling!==anchor)anchor.after(node);
 }
 if(focused!==document.activeElement&&focused instanceof HTMLElement)focused.focus({preventScroll:true});
 moveTabInd(false);
 if(smooth){
  const zoom=Number(getComputedStyle(document.documentElement).zoom)||1;
  desktopMotionNodes.forEach((node,index)=>{
   const from=previous[index],to=node.getBoundingClientRect();
   if(!from.width||!to.width)return;
   const x=(from.left-to.left)/zoom,y=(from.top-to.top)/zoom;
   if(Math.abs(x)<.5&&Math.abs(y)<.5)return;
   const motion=node.animate([{transform:`translate(${x}px,${y}px)`},{transform:'none'}],{duration:MOTION.panel,easing:MOTION.ease});
   node._desktopMotion=motion;
   motion.onfinish=()=>{if(node._desktopMotion===motion)node._desktopMotion=null;};
  });
  if(side){
   const motion=desktopSidebar.animate([{opacity:0},{opacity:1}],{duration:MOTION.panel,easing:MOTION.ease});
   desktopSidebar._desktopMotion=motion;
   motion.onfinish=()=>{if(desktopSidebar._desktopMotion===motion)desktopSidebar._desktopMotion=null;};
  }
 }
 requestAnimationFrame(()=>{moveTabInd(false);fitMetricValues();if(typeof renderAll==='function')renderAll();});
}
desktopToggle.onclick=()=>{desktopPreferredLayout=document.documentElement.dataset.desktopNav==='side'?'top':'side';positionDesktopNavigation(true);};
desktopSurface.addEventListener('change',positionDesktopNavigation);
desktopSidebarSpace.addEventListener('change',positionDesktopNavigation);
mobileLayout.addEventListener('change',()=>{positionDesktopNavigation();updateDesktopNavigation();});
window.addEventListener('resize',stopDesktopMotion);
document.addEventListener('keydown',event=>{if(!['Shift','Control','Alt','Meta'].includes(event.key))stopDesktopMotion();},true);
matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',stopDesktopMotion);
// Las superficies cambian solo al cruzar el umbral de escritorio o teléfono.
positionDesktopNavigation();
