// Presupuesto: data.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Datos ---------- */
function download(name, content, type){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#btnExport').onclick = () => download(`presupuesto-respaldo-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
function validateBackup(d){
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  if(!object(d)||!Array.isArray(d.categories)||!Array.isArray(d.transactions))throw new Error('Respaldo inválido');
  for(const key of ['categories','transactions','goals','recurring']){
    if(d[key]===undefined&&['goals','recurring'].includes(key))continue;
    if(!Array.isArray(d[key])||d[key].some(r=>!object(r)||!r.id||typeof r.id!=='string')||new Set(d[key].map(r=>r.id)).size!==d[key].length)throw new Error('Registros inválidos');
  }
  if(d.categories.some(c=>typeof c.name!=='string'||!['income','expense'].includes(c.type)))throw new Error('Categorías inválidas');
  if(d.transactions.some(t=>!['income','expense'].includes(t.type)||typeof t.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!Number.isFinite(Number(t.amount))||Number(t.amount)<=0))throw new Error('Movimientos inválidos');
  if(d.settings!==undefined&&!object(d.settings)||d.budgets!==undefined&&!object(d.budgets))throw new Error('Configuración inválida');
  if(d.settings?.methods!==undefined&&(!Array.isArray(d.settings.methods)||d.settings.methods.some(m=>typeof m!=='string')))throw new Error('Métodos inválidos');
  return cleanState(d);
}
$('#fileImport').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      const d = validateBackup(JSON.parse(r.result));
      if (!(await ask({title:'¿Importar este respaldo?', msg:`Reemplazará los datos actuales por los del archivo (${d.transactions.length} movimientos).`, ok:'Importar', danger:false, icon:'📥'}))){ e.target.value = ''; return; }
      state = d; state.budgets = state.budgets || {}; state.settings = state.settings || {methods:[]}; state.recurring = state.recurring || []; state.goals = state.goals || [];
      migrateVec(); save(); renderAll(); toast('Respaldo importado ✅');
    }catch(err){ toast('⚠️ Archivo no válido'); }
    e.target.value = '';
  };
  r.readAsText(f);
});
$('#btnCsv').onclick = () => {
  // Un texto que empieza con = + - @ se abriría como fórmula en Excel/Sheets.
  const q = v => { let s = String(v ?? ''); if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = "'" + s; return `"${s.replace(/"/g,'""')}"`; };
  const rows = [['Fecha','Tipo','Categoría','Descripción','Método','Monto']].concat(
    [...state.transactions].sort((a,b) => a.date.localeCompare(b.date)).map(t => [t.date, t.type==='income'?'Ingreso':'Gasto', getCat(t.catId).name, t.desc, t.method, t.amount]));
  download(`movimientos-${todayISO()}.csv`, '\ufeff' + rows.map(r => r.map(q).join(';')).join('\n'), 'text/csv');
};
const methodsInput = $('#methodsInput');
methodsInput.addEventListener('change', () => {
  state.settings.methods = methodsInput.value.split(',').map(s => s.trim()).filter(Boolean);
  save(); toast('Métodos de pago actualizados');
});
$('#btnWipe').onclick = async () => {
  if (!(await ask({title:'¿Borrar todo?', msg:'Se borrarán todos los movimientos y presupuestos (también en Sheets si está conectado). Te recomiendo exportar un respaldo antes.', ok:'Borrar todo', icon:'🧹'}))) return;
  state.transactions = []; state.budgets = {}; save(); renderAll(); toast('Datos borrados');
};
