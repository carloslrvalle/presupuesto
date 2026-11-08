/* Comparación de tres versiones. Sin red ni dependencias del navegador. */
(function(root){
'use strict';
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
function semantic(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return value;
 const out={...value};
 if(Array.isArray(out.categories)&&Array.isArray(out.transactions)){
  delete out.meta;delete out.updatedAt;delete out.rev;
  for(const name of ['categories','transactions','recurring','goals'])if(Array.isArray(out[name]))out[name]=out[name].map(r=>{const item={...r};delete item.u;return item;});
 }else if(typeof out.id==='string')delete out.u;
 return out;
}
const same=(a,b)=>JSON.stringify(canonical(semantic(a)))===JSON.stringify(canonical(semantic(b)));
function reconcile(base,local,remote,choices={}){
 const conflicts=[],known=base!=null,b=base||{},l=local||{},r=remote||{};
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const conflict=(before,here,there,path)=>{const key=JSON.stringify(path);if(choices[key]==='remote')return clone(there);if(choices[key]==='local')return clone(here);conflicts.push({key,path,base:clone(before),local:clone(here),remote:clone(there)});return clone(here);};
 function merge(before,here,there,path){
  if(same(here,there))return clone(here);
  if(known&&same(here,before))return clone(there);
  if(known&&same(there,before))return clone(here);
  if(object(here)&&object(there)&&(before===undefined||object(before))){const out={};
   const classification=path.length===2&&['transactions','recurring'].includes(path[0]);
   if(classification){
    const pick=v=>v?{type:v.type,catId:v.catId}:undefined,B=pick(before),L=pick(here),R=pick(there);
    const group=same(L,R)?L:known&&same(L,B)?R:known&&same(R,B)?L:conflict(B,L,R,path.concat('classification'));
    Object.assign(out,group);
   }
   for(const k of new Set([...Object.keys(before||{}),...Object.keys(here),...Object.keys(there)])){if(k==='u'||classification&&['type','catId'].includes(k))continue;
    // La hora de creación solo ordena listas y nadie la edita: dos dispositivos que crean el mismo registro conservan la más antigua sin pedir revisión.
    if(k==='created'&&path.length===2){const times=[here[k],there[k]].map(Number).filter(n=>Number.isFinite(n)&&n>0);if(times.length){out[k]=Math.min(...times);continue;}}const value=merge(before?.[k],here[k],there[k],path.concat(k));if(value!==undefined)Object.defineProperty(out,k,{value,enumerable:true,writable:true,configurable:true});}return out;}
  if(!known&&before===undefined&&(here===undefined||there===undefined))return clone(here===undefined?there:here);
  return conflict(before,here,there,path);
 }
 const out={...clone(r),meta:{del:{...(r.meta?.del||{}),...(l.meta?.del||{})},bu:{...(r.meta?.bu||{}),...(l.meta?.bu||{})},su:Math.max(l.meta?.su||0,r.meta?.su||0),co:Math.max(l.meta?.co||0,r.meta?.co||0)}};
 for(const name of ['categories','transactions','recurring','goals']){
  const maps=[b,l,r].map(d=>new Map((d[name]||[]).map(x=>[String(x.id),x])));const records=[];
  for(const id of new Set([...maps[2].keys(),...maps[1].keys(),...maps[0].keys()])){
   const [before,here,there]=maps.map(m=>m.get(id));let value;
   const tombstone=name+':'+id;
   if(!known&&((!here&&(l.meta?.del?.[tombstone]||l.meta?.del?.[id])&&there)||(!there&&(r.meta?.del?.[tombstone]||r.meta?.del?.[id])&&here)))value=conflict(before,here,there,[name,id]);
   else value=merge(before,here,there,[name,id]);
   if(value!==undefined){value.u=Math.max(here?.u||0,there?.u||0,Date.now());records.push(value);delete out.meta.del[tombstone];delete out.meta.del[id];}
   else out.meta.del[tombstone]=Math.max(l.meta?.del?.[tombstone]||0,r.meta?.del?.[tombstone]||0,l.meta?.del?.[id]||0,r.meta?.del?.[id]||0,Date.now());
  }out[name]=records;
 }
 if(known){
  const shared=(b.categories||[]).map(c=>c.id).filter(id=>(l.categories||[]).some(c=>c.id===id)&&(r.categories||[]).some(c=>c.id===id));
  const order=d=>(d.categories||[]).map(c=>c.id).filter(id=>shared.includes(id));
  const chosen=merge(order(b),order(l),order(r),['categoryOrder']),rank=new Map(chosen.map((id,i)=>[id,i]));
  out.categories.sort((a,b)=>(rank.get(a.id)??shared.length)-(rank.get(b.id)??shared.length));
 }
 out.budgets=merge(b.budgets||{},l.budgets||{},r.budgets||{},['budgets']);
 out.settings=merge(b.settings||{},l.settings||{},r.settings||{},['settings']);
 out.methods=merge(b.methods,l.methods,r.methods,['methods'])||[];
 out.updatedAt=Date.now();return {data:out,conflicts};
}
const api={clone,same,reconcile};root.SyncCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?this:globalThis);
