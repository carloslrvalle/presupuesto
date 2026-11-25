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
const mobileGreeting=document.createElement('div');
mobileGreeting.className='mobile-only mobile-greeting';
mobileGreeting.innerHTML='<span class="home-hello">Hola,</span><span class="home-name"></span>';
desktopSectionTitle.after(mobileGreeting);
const desktopSectionNames={settings:'Ajustes',both:'Ambos'};
const desktopNodes=[[$('#tabs'),desktopSidebar.querySelector('.desktop-navigation-host')],[$('.top-pair'),desktopSidebar.querySelector('.desktop-profile-host')],[$('.topbar .brand'),desktopSidebar.querySelector('.desktop-brand-host')]].map(([node,parent])=>{
 const anchor=document.createComment('Posición de la navegación superior');node.before(anchor);return {node,parent,anchor};
});
// En teléfono, perfil y estado de guardado viven al inicio de Ajustes.
const mobileProfileHost=document.createElement('div');mobileProfileHost.className='mobile-profile-host';
let desktopPreferredLayout='side';
const desktopMotionNodes=[$('.topbar'),$('main.wrap'),$('#fab')];
const desktopLayoutAnimations=new Map();
let desktopRefitFrame=0;
function refitDesktopLayout(){
 cancelAnimationFrame(desktopRefitFrame);
 desktopRefitFrame=requestAnimationFrame(()=>{
  moveTabInd(false);
  fitMetricValues();
  if(typeof renderAll==='function')renderAll();
 });
}
function stopDesktopMotion(){
 for(const motion of desktopLayoutAnimations.values())motion.cancel();
 desktopLayoutAnimations.clear();
 document.documentElement.classList.remove('desktop-layout-moving');
}
function animateDesktopLayout(node,frames,easing=MOTION.ease){
 const motion=node.animate(frames,{duration:MOTION.panel,easing});
 desktopLayoutAnimations.set(node,motion);
 motion.onfinish=()=>{
  if(desktopLayoutAnimations.get(node)!==motion)return;
  desktopLayoutAnimations.delete(node);
  if(!desktopLayoutAnimations.size){
   document.documentElement.classList.remove('desktop-layout-moving');
   refitDesktopLayout();
  }
 };
}
function updateDesktopNavigation(){
 const active=activeTab()==='settings';desktopSettings.classList.toggle('active',active);
 if(active)desktopSettings.setAttribute('aria-current','page');else desktopSettings.removeAttribute('aria-current');
 const tab=activeTab();
 desktopSectionTitle.textContent=desktopSectionNames[tab]||$(`#tabs [data-tab="${tab}"]`)?.getAttribute('aria-label')||'';
 mobileGreeting.lastElementChild.textContent=profOf(activeProfile).name;
}
function positionDesktopNavigation(animate=false){
 const side=desktopSurface.matches&&desktopSidebarSpace.matches&&desktopPreferredLayout==='side';
 const changed=document.documentElement.dataset.desktopNav!==(side?'side':'top');
 const smooth=animate===true&&changed&&desktopSurface.matches&&!reduceMotion();
 const main=desktopMotionNodes[1];
 const blocks=smooth?[...(main.querySelector('.tab.active')?.children||[])]:[];
 const grids=blocks.filter(node=>node.matches('.kpis,.grid2,.bud-grid'));
 const panels=blocks.flatMap(node=>grids.includes(node)?[...node.children]:[node]);
 const animatedNodes=[...desktopMotionNodes,...panels];
 // Leer la posición visible antes de cancelar permite invertir un cambio en curso sin saltos.
 const previous=smooth?animatedNodes.map(node=>node.getBoundingClientRect()):[];
 const sidebarOpacity=desktopLayoutAnimations.has(desktopSidebar)?Number(getComputedStyle(desktopSidebar).opacity):0;
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
  cancelAnimationFrame(desktopRefitFrame);
  document.documentElement.classList.add('desktop-layout-moving');
  const zoom=Number(getComputedStyle(document.documentElement).zoom)||1;
  const target=animatedNodes.map(node=>node.getBoundingClientRect());
  const mainX=(previous[1].left-target[1].left)/zoom,mainY=(previous[1].top-target[1].top)/zoom;
  const wider=target[1].width>=previous[1].width;
  const reflow=Math.abs(target[1].width-previous[1].width)>.5;
  // Mantener las filas finales permite animar las cajas sin escalar su contenido.
  if(reflow)grids.forEach(grid=>{
   const rows=getComputedStyle(grid).gridTemplateRows;
   if(rows!=='none')animateDesktopLayout(grid,[{gridTemplateRows:rows},{gridTemplateRows:rows}]);
  });
  animatedNodes.forEach((node,index)=>{
   const from=previous[index],to=target[index];
   if(!from.width||!to.width||!from.height||!to.height)return;
   const panel=index>=desktopMotionNodes.length;
   const x=(from.left-to.left)/zoom-(panel?mainX:0),y=(from.top-to.top)/zoom-(panel?mainY:0);
   const resize=reflow&&grids.includes(node.parentElement);
   const sizeDiff=resize&&(Math.abs(from.width-to.width)>.5||Math.abs(from.height-to.height)>.5);
   const headerGrowth=index===0?Math.max(0,(to.height-from.height)/zoom):0;
   if(Math.abs(x)<.5&&Math.abs(y)<.5&&!sizeDiff&&!headerGrowth)return;
   const frame=(dx,dy,width,height)=>({
    transform:`translate(${dx}px,${dy}px)`,
    ...(resize?{width:width/zoom+'px',height:height/zoom+'px'}:{})
   });
   const first=frame(x,y,from.width,from.height), last=frame(0,0,to.width,to.height);
   if(headerGrowth){
    first.clipPath=`inset(0 -100vw ${headerGrowth}px -100vw)`;
    last.clipPath='inset(0 -100vw 0 -100vw)';
   }
   // Al cambiar de filas, mueve un eje antes que el otro para no cruzar tarjetas.
   const middle=wider?frame(0,y,to.width,from.height):frame(x,0,from.width,to.height);
   if(headerGrowth)middle.clipPath=wider?first.clipPath:last.clipPath;
   const staged=reflow&&(panel||node===main||headerGrowth);
   animateDesktopLayout(node,staged?[
    {...first,easing:MOTION.ease},{...middle,offset:.5,easing:MOTION.ease},last
   ]:[first,last],staged?'linear':MOTION.ease);
  });
  if(side){
   const edge=desktopSidebar.getBoundingClientRect().right/zoom;
   const first={opacity:sidebarOpacity,transform:`translateX(${-edge}px)`,easing:MOTION.ease};
   const last={opacity:1,transform:'translateX(0)'};
   // La barra entra al mismo tiempo que se despeja su espacio.
   const hold=reflow&&!wider;
   animateDesktopLayout(desktopSidebar,hold?[first,{...first,offset:.5},last]:[first,last],'linear');
  }
 }
 if(!desktopLayoutAnimations.size){
  document.documentElement.classList.remove('desktop-layout-moving');
  refitDesktopLayout();
 }
}
desktopToggle.onclick=()=>{desktopPreferredLayout=document.documentElement.dataset.desktopNav==='side'?'top':'side';positionDesktopNavigation(true);};
desktopSurface.addEventListener('change',positionDesktopNavigation);
desktopSidebarSpace.addEventListener('change',positionDesktopNavigation);
mobileLayout.addEventListener('change',()=>{positionDesktopNavigation();updateDesktopNavigation();});
window.addEventListener('resize',()=>{
 if(!desktopLayoutAnimations.size)return;
 stopDesktopMotion();
 refitDesktopLayout();
});
// Las superficies cambian solo al cruzar el umbral de escritorio o teléfono.
positionDesktopNavigation();
