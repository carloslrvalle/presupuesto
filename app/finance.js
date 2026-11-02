// Presupuesto: finance.js — ver ARQUITECTURA.md para responsabilidades y orden de carga.
(function(root){
'use strict';
const ym=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
const shiftMonth=(m,n)=>{const [y,mo]=m.split('-').map(Number);return ym(new Date(y,mo-1+n,1));};
const daysIn=m=>{const [y,mo]=m.split('-').map(Number);return new Date(y,mo,0).getDate();};
const dateFor=(m,day)=>m+'-'+String(Math.min(day,daysIn(m))).padStart(2,'0');
const dateOffset=(iso,n)=>{const[y,m,d]=iso.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);};
function cyclePeriod(m,day){const start=dateFor(day===1?m:shiftMonth(m,-1),day),next=dateFor(day===1?shiftMonth(m,1):m,day);return {anchor:m,start,end:dateOffset(next,-1),day};}
function cycleMonthForDate(date,day){const m=date.slice(0,7);return day===1||date<dateFor(m,day)?m:shiftMonth(m,1);}
function transactions(records,start,end,today,all=false){return records.filter(t=>t.date>=start&&t.date<=end&&(all||t.date<=today));}
function balance(records,start,end,today){let previous=0,result=0;for(const t of records){if(!t||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||t.date>today||t.date>end||!['income','expense'].includes(t.type))continue;const cents=Math.round((Number(t.amount)||0)*100)*(t.type==='income'?1:-1);if(t.date<start)previous+=cents;else result+=cents;}return {previous:previous/100,result:result/100,total:(previous+result)/100,provisional:start>today};}
function savings(records,{savingIds=[],mode='left',pct=0,incomeBudget=0}={}){const sum=xs=>xs.reduce((a,t)=>a+Number(t.amount||0),0),inc=sum(records.filter(t=>t.type==='income')),exps=records.filter(t=>t.type==='expense'),sep=sum(exps.filter(t=>savingIds.includes(t.catId)||t.goalId)),cons=sum(exps)-sep,saved=mode==='set'?sep:inc-cons,base=inc>0?inc:incomeBudget;return {inc,sep,cons,free:inc-cons-sep,saved,pct,base,target:base*pct/100,rate:inc>0?saved/inc*100:null};}
const api={ym,shiftMonth,daysIn,dateFor,dateOffset,cyclePeriod,cycleMonthForDate,transactions,balance,savings};root.BudgetFinance=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
