// Presupuesto: storage.js — ver README.md del proyecto para responsabilidades y orden de carga.
(function(root){
'use strict';
// El adaptador no oculta errores: la capa de estado decide cómo informar y conservar pendientes.
function create(provider){const storage=()=>typeof provider==='function'?provider():provider;return {readText:key=>storage().getItem(key),writeText:(key,value)=>storage().setItem(key,value),remove:key=>storage().removeItem(key),clear:()=>storage().clear(),readJSON:(key,fallback=null)=>{const raw=storage().getItem(key);return raw?JSON.parse(raw):fallback;},writeJSON:(key,value)=>storage().setItem(key,JSON.stringify(value))};}
const api={create};root.BudgetStorage=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
