// Presupuesto: dates.js — ver README.md del proyecto para responsabilidades y orden de carga.
/* ---------- Fechas ---------- */
const ym = BudgetFinance.ym;
const shiftMonth = BudgetFinance.shiftMonth;
const monthLong = m => { const [y,mo] = m.split('-').map(Number); const s = new Date(y,mo-1,1).toLocaleDateString('es-PE',{month:'long',year:'numeric'}).replace(' de ', ' '); return s[0].toUpperCase()+s.slice(1); };
const monthShort = m => ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][Number(m.slice(5,7)) - 1] + ' ' + m.slice(2,4);
const todayISO = () => { const d = new Date(); return ym(d) + '-' + String(d.getDate()).padStart(2,'0'); };
const fmtDate = s => { const [y,m,d] = s.split('-'); return `${d}/${m}/${y.slice(2)}`; };
const MONTH_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const monthAbbr = m => MONTH_ABBR[Number(m.split('-')[1]) - 1];
const daysIn = BudgetFinance.daysIn;
const dateFor = BudgetFinance.dateFor;
const thisMonth = () => ym(new Date());
const fmtDateLong = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('es-PE',{day:'numeric',month:'short',year:'numeric'}).replace('.',''); };
