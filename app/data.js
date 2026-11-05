// Presupuesto: data.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
/* ---------- Datos ---------- */
function download(name, content, type){
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], {type})); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
$('#btnExport').onclick = () => download(`presupuesto-respaldo-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json');
function validateBackup(d){
  validateStateData(d);return cleanState(JSON.parse(JSON.stringify(d)));
}
function importBackup(d){
  if(localTabChanged)throw new Error('Recarga antes de importar: otra pestaña cambió los datos');
  const candidate=validateBackup(d),previous=state,previousSnap=_snapRec,previousDone=_doneSet,normalSave=save;
  candidate.budgets??={};candidate.settings??={methods:[]};candidate.recurring??=[];candidate.goals??=[];
  try{
    state=candidate;_txIdx=null;_doneSet=null;
    // Comprobar todas las vistas antes de persistir o programar una subida.
    save=()=>true;
    migrateVec();for(const view of Object.values(VIEWS))view();renderAll();
    save=normalSave;_snapRec=previousSnap;stampChanges();state.updatedAt=Date.now();
    localData.writeText(storeKey()+'.beforeImport',JSON.stringify(previous));
    if(!saveLocal())throw new Error('No se pudo guardar el respaldo en este dispositivo');
  }catch(err){
    save=normalSave;state=previous;_snapRec=previousSnap;_doneSet=previousDone;_txIdx=null;
    try{renderAll();}catch(renderError){reportBootError(renderError.message);}
    throw err;
  }
  schedulePush();return true;
}
$('#fileImport').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    try{
      const d = validateBackup(JSON.parse(r.result));
      if (!(await ask({title:'¿Importar este respaldo?', msg:`Reemplazará los datos actuales por los del archivo (${d.transactions.length} movimientos).`, ok:'Importar', danger:false, icon:'📥'}))){ e.target.value = ''; return; }
      importBackup(d);toast('Respaldo importado ✅');
    }catch(err){ toast('⚠️ Archivo no válido o importación no completada: '+err.message); }
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
