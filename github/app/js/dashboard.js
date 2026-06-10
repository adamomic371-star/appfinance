// +--------------------------------------------------------------+
// ¶  WARNING ó FILE ORFANO / NON INTEGRATO                      ¶
// ¶  Questo file NON Ë caricato dall'app principale (app.html).  ¶
// ¶  Il codice eseguibile Ë nello script inline di app/app.html. ¶
// ¶  Mantenuto per riferimento storico ó NON modificare.         ¶
// +--------------------------------------------------------------+

/* ‚îÄ‚îÄ‚îÄ DASHBOARD ‚îÄ‚îÄ‚îÄ */
function renderDashboard(){
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0);
  const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const tot=S.accounts.reduce((s,a)=>s+N(a.balance),0);
  const el=document.getElementById('dash-stats');
  if(el)el.innerHTML=`
    <div class="sc"><div class="sl">Saldo totale</div><div class="sv">${fmt(tot)}</div></div>
    <div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div><div style="font-size:.75rem;color:var(--tx3)">questo mese</div></div>
    <div class="sc"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div><div style="font-size:.75rem;color:var(--tx3)">questo mese</div></div>
    <div class="sc"><div class="sl">Risparmio</div><div class="sv" style="color:${inc-exp>=0?'var(--gr)':'var(--re)'}">${fmt(inc-exp)}</div></div>`;
  const da=document.getElementById('dash-acc');
  if(da)da.innerHTML=S.accounts.length
    ?S.accounts.map(a=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.65rem .875rem;background:var(--bg3);border-radius:var(--rs);margin-bottom:.5rem"><div style="display:flex;align-items:center;gap:.5rem"><div style="width:26px;height:26px;border-radius:8px;background:${a.color||'var(--ac)'}22;display:flex;align-items:center;justify-content:center">${AI_IC[a.type]||'üè¶'}</div><span style="font-size:.875rem">${a.name}</span></div><span style="font-weight:700;color:${N(a.balance)>=0?'var(--gr)':'var(--re)'}">${fmt(a.balance)}</span></div>`).join('')
    :'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Aggiungi un conto</div>';
  const dr=document.getElementById('dash-recent');
  if(dr)dr.innerHTML=S.transactions.slice(0,6).map(t=>`<div style="display:flex;align-items:center;gap:.75rem;padding:.6rem;border-radius:var(--rs);margin-bottom:.3rem"><div style="width:34px;height:34px;border-radius:10px;background:${t.type==='income'?'rgba(0,240,160,.15)':'rgba(255,51,85,.12)'};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${CI[t.category]||'üì¶'}</div><div style="flex:1;min-width:0"><div style="font-size:.875rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.description||'‚Äî'}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)}</div></div><div style="font-weight:700;font-size:.875rem;color:${t.type==='income'?'var(--gr)':'var(--re)'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div></div>`).join('')||'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Nessuna transazione</div>';
  renderDashCharts();
}

function renderDashCharts(){
  const labs=[],inc=[],exp=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const m=d.toISOString().slice(0,7);labs.push(d.toLocaleDateString('it-IT',{month:'short'}));const txM=S.transactions.filter(t=>t.date?.startsWith(m));inc.push(txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0));exp.push(txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0));}
  const o={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'var(--tx2)',font:{size:11}}}},scales:{x:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}}}};
  mkChart('ch-trend','bar',{labels:labs,datasets:[{label:'Entrate',data:inc,backgroundColor:'rgba(0,240,160,.7)',borderRadius:4},{label:'Uscite',data:exp,backgroundColor:'rgba(255,51,85,.7)',borderRadius:4}]},o);
  const cm2={};S.transactions.filter(t=>t.type==='expense').forEach(t=>{cm2[t.category]=(cm2[t.category]||0)+N(t.amount);});const cats=Object.keys(cm2);
  if(cats.length)mkChart('ch-cat','doughnut',{labels:cats.map(c=>CI[c]+' '+cap(c)),datasets:[{data:cats.map(c=>cm2[c]),backgroundColor:CC.slice(0,cats.length),borderWidth:0}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'var(--tx2)',font:{size:10},boxWidth:10}}}});
}

