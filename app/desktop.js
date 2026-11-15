// Presentación de escritorio: los controles conservan sus eventos y sus datos.
const desktopSurface=matchMedia('(min-width:601px) and (min-height:501px), (min-width:961px), (min-width:601px) and (pointer:fine)');
const desktopSidebarSpace=matchMedia('(min-width:1050px)');
const desktopSidebar=document.createElement('aside');
desktopSidebar.id='desktopSidebar';desktopSidebar.setAttribute('aria-label','Menú lateral');
desktopSidebar.innerHTML='<div class="desktop-profile-host"></div><div class="desktop-navigation-host"></div><div class="desktop-sidebar-footer"></div>';
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
const desktopNodes=[[$('#tabs'),desktopSidebar.querySelector('.desktop-navigation-host')],[$('.top-pair'),desktopSidebar.querySelector('.desktop-profile-host')]].map(([node,parent])=>{
 const anchor=document.createComment('Posición de la navegación superior');node.before(anchor);return {node,parent,anchor};
});
let desktopPreferredLayout='side';
function updateDesktopNavigation(){
 const active=activeTab()==='settings';desktopSettings.classList.toggle('active',active);
 if(active)desktopSettings.setAttribute('aria-current','page');else desktopSettings.removeAttribute('aria-current');
}
function positionDesktopNavigation(){
 const side=desktopSurface.matches&&desktopSidebarSpace.matches&&desktopPreferredLayout==='side';
 document.documentElement.dataset.desktopNav=side?'side':'top';
 desktopToggle.setAttribute('aria-pressed',String(side));
 desktopToggle.title=side?'Usar navegación superior':'Usar navegación lateral';
 for(const {node,parent,anchor} of desktopNodes){if(side)parent.append(node);else anchor.after(node);}
 requestAnimationFrame(()=>{moveTabInd();fitMetricValues();if(typeof renderAll==='function')renderAll();});
}
desktopToggle.onclick=()=>{desktopPreferredLayout=document.documentElement.dataset.desktopNav==='side'?'top':'side';positionDesktopNavigation();};
desktopSurface.addEventListener('change',positionDesktopNavigation);
desktopSidebarSpace.addEventListener('change',positionDesktopNavigation);
// Las superficies cambian solo al cruzar el umbral de escritorio o teléfono.
positionDesktopNavigation();
