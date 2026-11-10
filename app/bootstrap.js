// Presupuesto: bootstrap.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
// Metadatos y diagnóstico antes de cargar la interfaz.
window.__bootErrs=window.__bootErrs||[];window.__bootDiagnosticsReady=true;window.__APP_VERSION='1.10.80';window.__APP_DATE='2026-11-10';
function reportBootError(message,record=true){
 if(record)window.__bootErrs.push(message);const boot=document.getElementById('boot');
 if(boot&&!boot.classList.contains('gone')){boot.setAttribute('role','alert');boot.innerHTML='<div class="bt-err"><b>No se pudo abrir la app.</b><code></code></div><button type="button" onclick="location.reload()">Reintentar</button>';boot.querySelector('code').textContent=window.__bootErrs.join(' · ');}
 else if(document.body){let bar=document.getElementById('errBar');if(!bar){bar=document.createElement('div');bar.id='errBar';bar.onclick=()=>bar.remove();document.body.append(bar);}bar.textContent=message;}
}
window.addEventListener('error',e=>{if(e.target?.tagName==='SCRIPT'&&e.target.src){reportBootError('No se pudo cargar '+new URL(e.target.src).pathname);return;}if(e.target?.tagName==='LINK'&&e.target.href&&new URL(e.target.href).pathname.endsWith('/app.css')){reportBootError('No se pudo cargar '+new URL(e.target.href).pathname);return;}if(!e.message||/ResizeObserver|^Script error/i.test(e.message))return;reportBootError(e.message+' · '+(e.filename?new URL(e.filename,location.href).pathname:'')+':'+(e.lineno||0)+':'+(e.colno||0));},true);

document.addEventListener("DOMContentLoaded",()=>{if(window.__bootErrs.length)reportBootError("",false);});
