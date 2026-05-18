/* ─── ACCOUNTS ─── */
function renderAccounts(){
  const grid=document.getElementById('acc-grid'),empty=document.getElementById('acc-empty');
  if(!grid)return;
  if(!S.accounts.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=S.accounts.map(a=>`<div style="background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r);padding:1.5rem;position:relative;overflow:hidden;transition:transform .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
    <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${a.color||'var(--ac)'};margin-bottom:.75rem">${AI_IC[a.type]||'🏦'} ${cap(a.type||'bank')}</div>
    <div style="font-weight:600;margin-bottom:.25rem">${a.name}</div>
    <div style="font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:${N(a.balance)>=0?'var(--gr)':'var(--re)'};margin:.5rem 0">${fmt(a.balance)}</div>
    <div style="display:flex;gap:.5rem;margin-top:1rem">
      <button class="btn bs bsm" onclick="editAcc('${a.id}')">Modifica</button>
      <button class="btn bd bsm" onclick="deleteAcc('${a.id}')">Elimina</button>
    </div>
  </div>`).join('');
}
async function saveAcc(){
  try{
  const id=document.getElementById('acc-id').value;const a={name:document.getElementById('acc-name').value.trim(),type:document.getElementById('acc-type').value,balance:parseFloat(document.getElementById('acc-bal').value)||0,color:document.getElementById('acc-color').value,updatedAt:new Date().toISOString()};if(!a.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/accounts/${id}`).update(a);}else{a.createdAt=new Date().toISOString();await db.ref(`users/${UID}/accounts`).push(a);}cm('modal-acc');document.getElementById('acc-id').value='';toast(id?'Aggiornato':'Aggiunto','ok');
  }catch(e){console.error('[saveAcc]',e);toast(ferr(e.code)||e.message,'err');}
}function editAcc(id){const a=S.accounts.find(a=>a.id===id);if(!a)return;document.getElementById('acc-id').value=id;document.getElementById('acc-name').value=a.name;document.getElementById('acc-type').value=a.type;document.getElementById('acc-bal').value=a.balance;document.getElementById('acc-color').value=a.color||'#7B68EE';om('modal-acc');}
async function deleteAcc(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/accounts/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteAcc]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── TRANSFER ─── */
function populateTransferSels(){const opts=S.accounts.map(a=>`<option value="${a.id}">${a.name} (${fmt(a.balance)})</option>`).join('');['tr-from','tr-to'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=opts||'<option>Nessun conto</option>';});}
async function doTransfer(){
  try{
  const fId=document.getElementById('tr-from').value,tId=document.getElementById('tr-to').value,amount=parseFloat(document.getElementById('tr-amount').value)||0,date=document.getElementById('tr-date').value,note=document.getElementById('tr-note').value.trim();if(!fId||!tId||fId===tId){toast('Seleziona due conti diversi','err');return;}if(!amount||!date){toast('Inserisci importo e data','err');return;}const from=S.accounts.find(a=>a.id===fId),to=S.accounts.find(a=>a.id===tId);if(!from||!to)return;if(N(from.balance)<amount){toast('Saldo insufficiente','err');return;}await db.ref(`users/${UID}/accounts/${fId}/balance`).set(N(from.balance)-amount);await db.ref(`users/${UID}/accounts/${tId}/balance`).set(N(to.balance)+amount);await db.ref(`users/${UID}/transfers`).push({from:fId,to:tId,fromName:from.name,toName:to.name,amount,date,note,createdAt:new Date().toISOString()});document.getElementById('tr-amount').value='';document.getElementById('tr-note').value='';toast(`Trasferito ${fmt(amount)} da ${from.name} a ${to.name}`,'ok');
  }catch(e){console.error('[doTransfer]',e);toast(ferr(e.code)||e.message,'err');}
}function renderTransfers(){const list=document.getElementById('transfer-list');if(!list)return;const tr=[...S.transfers].sort((a,b)=>new Date(b.date)-new Date(a.date));list.innerHTML=tr.slice(0,10).map(t=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1);font-size:.85rem"><div><div style="font-weight:500">${t.fromName} → ${t.toName}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)}${t.note?` · ${t.note}`:''}</div></div><div style="font-weight:700;color:var(--ac)">${fmt(t.amount)}</div></div>`).join('')||'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Nessun trasferimento</div>';}

/* ─── BUDGET ─── */
function renderBudget(){
  const m=new Date().toISOString().slice(0,7);
  const bm=document.getElementById('budget-month');if(bm)bm.textContent=new Date().toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const budgets=S.budgets[m]||{};
  const grid=document.getElementById('budget-grid'),empty=document.getElementById('budget-empty');
  if(!grid)return;
  const txM=S.transactions.filter(t=>t.date?.startsWith(m)&&t.type==='expense');
  if(!Object.keys(budgets).length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=Object.entries(budgets).map(([cat,b])=>{const spent=txM.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);const pct=Math.min(100,Math.round((spent/b.limit)*100));const color=pct>=90?'var(--re)':pct>=70?'var(--ye)':'var(--gr)';return`<div class="gc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem"><div style="font-size:.9rem;font-weight:600">${CI[cat]||'📦'} ${cap(cat)}</div><button class="btn bi bd bsm" onclick="deleteBudget('${cat}')">🗑</button></div><div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--tx2);margin-top:.4rem"><span>Speso: <strong>${fmt(spent)}</strong></span><span style="color:${color}"><strong>${pct}%</strong> di ${fmt(b.limit)}</span></div></div>`;}).join('');
}
async function saveBudget(){
  try{
  const cat=document.getElementById('bud-cat').value,limit=parseFloat(document.getElementById('bud-limit').value)||0;if(!limit){toast('Inserisci limite','err');return;}const m=new Date().toISOString().slice(0,7);await db.ref(`users/${UID}/budgets/${m}/${cat}`).set({limit,updatedAt:new Date().toISOString()});cm('modal-budget');toast('Budget salvato','ok');
  }catch(e){console.error('[saveBudget]',e);toast(ferr(e.code)||e.message,'err');}
}async function deleteBudget(cat){
  try{
  const m=new Date().toISOString().slice(0,7);await db.ref(`users/${UID}/budgets/${m}/${cat}`).remove();toast('Rimosso','ok');
  }catch(e){console.error('[deleteBudget]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── GOALS ─── */
function renderGoals(){
  const grid=document.getElementById('goals-grid'),empty=document.getElementById('goals-empty');
  if(!grid)return;
  if(!S.goals.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=S.goals.map(g=>{const pct=Math.min(100,Math.round((N(g.current)/N(g.target))*100));const color=pct>=100?'var(--gr)':pct>=60?'var(--ac)':'var(--ac2)';return`<div class="gc"><div style="font-size:1.75rem;margin-bottom:.75rem">${g.icon||'🎯'}</div><div style="font-weight:700;margin-bottom:.25rem">${g.name}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">Target: ${fmt(g.target)} · ${fd(g.dl)}</div><div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem"><div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:${color}">${pct}%</div><div style="font-size:.8rem;color:var(--tx2)">${fmt(g.current||0)} / ${fmt(g.target)}</div></div><div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editGoal('${g.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteGoal('${g.id}')">🗑</button></div></div>`;}).join('');
}
async function saveGoal(){
  try{
  const id=document.getElementById('goal-id').value;const g={name:document.getElementById('goal-name').value.trim(),target:parseFloat(document.getElementById('goal-target').value)||0,current:parseFloat(document.getElementById('goal-cur').value)||0,dl:document.getElementById('goal-dl').value,icon:document.getElementById('goal-icon').value,updatedAt:new Date().toISOString()};if(!g.name||!g.target){toast('Compila nome e target','err');return;}if(id){await db.ref(`users/${UID}/goals/${id}`).update(g);}else{g.createdAt=new Date().toISOString();await db.ref(`users/${UID}/goals`).push(g);}cm('modal-goal');document.getElementById('goal-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveGoal]',e);toast(ferr(e.code)||e.message,'err');}
}function editGoal(id){const g=S.goals.find(g=>g.id===id);if(!g)return;document.getElementById('goal-id').value=id;document.getElementById('goal-name').value=g.name;document.getElementById('goal-target').value=g.target;document.getElementById('goal-cur').value=g.current||0;document.getElementById('goal-dl').value=g.dl||'';document.getElementById('goal-icon').value=g.icon||'🎯';om('modal-goal');}
async function deleteGoal(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/goals/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteGoal]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── CALENDAR ─── */
function renderCalendar(){
  const y=calDate.getFullYear(),mo=calDate.getMonth();
  const ct=document.getElementById('cal-title');if(ct)ct.textContent=new Date(y,mo,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const heads=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  const ch=document.getElementById('cal-heads');if(ch)ch.innerHTML=heads.map(h=>`<div style="font-size:.68rem;font-weight:700;text-align:center;color:var(--tx3);padding:.25rem">${h}</div>`).join('');
  const first=new Date(y,mo,1),last=new Date(y,mo+1,0),startDow=(first.getDay()+6)%7;
  const days=[];for(let i=0;i<startDow;i++)days.push(null);for(let d=1;d<=last.getDate();d++)days.push(d);
  const mStr=`${y}-${String(mo+1).padStart(2,'0')}`;
  const evMap={};
  S.recurring.filter(r=>r.nextDate?.startsWith(mStr)).forEach(r=>{const d=parseInt(r.nextDate?.split('-')[2]);if(d)evMap[d]=(evMap[d]||[]).concat({color:'var(--ye)'});});
  S.invoices.filter(i=>i.due?.startsWith(mStr)&&i.status!=='paid').forEach(i=>{const d=parseInt(i.due?.split('-')[2]);if(d)evMap[d]=(evMap[d]||[]).concat({color:'var(--re)'});});
  const td=new Date(),isTod=d=>td.getFullYear()===y&&td.getMonth()===mo&&td.getDate()===d;
  const cd=document.getElementById('cal-days');if(cd)cd.innerHTML=days.map(d=>{if(!d)return'<div></div>';const evs=evMap[d]||[];return`<div style="background:var(--bg3);border:1px solid ${isTod(d)?'var(--ac)':evs.length?'var(--ye)':'var(--b1)'};border-radius:6px;padding:.4rem;min-height:48px"><div style="font-size:.72rem;font-weight:600;color:var(--tx2)">${d}</div>${evs.map(e=>`<div style="width:5px;height:5px;border-radius:50%;background:${e.color};margin-top:2px"></div>`).join('')}</div>`;}).join('');
  const all=[...S.recurring.filter(r=>r.nextDate?.startsWith(mStr)).map(r=>({...r,etype:'rec'})),...S.invoices.filter(i=>i.due?.startsWith(mStr)&&i.status!=='paid').map(i=>({...i,etype:'inv'}))].sort((a,b)=>new Date(a.nextDate||a.due)-new Date(b.nextDate||b.due));
  const ce=document.getElementById('cal-events');if(ce)ce.innerHTML=all.length?all.map(e=>`<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem 0;border-bottom:1px solid var(--b1)"><div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${e.etype==='rec'?'var(--ye)':'var(--re)'}"></div><div style="flex:1"><div style="font-size:.875rem;font-weight:500">${e.etype==='rec'?e.name:e.client}</div><div style="font-size:.72rem;color:var(--tx3)">${e.etype==='rec'?'🔁 Ricorrente':'🧾 Fattura'} · ${fd(e.nextDate||e.due)}</div></div><div style="font-weight:700;font-size:.875rem;color:${e.etype==='rec'?'var(--ye)':'var(--re)'}">${fmt(e.amount)}</div></div>`).join(''):'<div style="color:var(--tx3);font-size:.8rem;padding:1rem 0">Nessuna scadenza</div>';
}
function calPrev(){calDate.setMonth(calDate.getMonth()-1);renderCalendar();}
function calNext(){calDate.setMonth(calDate.getMonth()+1);renderCalendar();}

/* ─── RECURRING ─── */
function renderRecurring(){const tbody=document.getElementById('rec-tbody'),empty=document.getElementById('rec-empty');if(!tbody)return;if(!S.recurring.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';tbody.innerHTML=S.recurring.map(r=>`<tr><td class="tdm">${CI[r.category]||'📦'} ${r.name}</td><td><span class="badge bg-pu">${cap(r.category||'altro')}</span></td><td>${FQ[r.frequency]||r.frequency}</td><td>${fd(r.nextDate)}</td><td style="font-weight:700;color:var(--re)">${fmt(r.amount)}</td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editRec('${r.id}')">✏️</button><button class="btn bi bd bsm" onclick="deleteRec('${r.id}')">🗑</button></div></td></tr>`).join('');}
async function saveRec(){
  try{
  const id=document.getElementById('rec-id').value;const r={name:document.getElementById('rec-name').value.trim(),amount:parseFloat(document.getElementById('rec-amount').value)||0,frequency:document.getElementById('rec-freq').value,category:document.getElementById('rec-cat').value,nextDate:document.getElementById('rec-next').value,updatedAt:new Date().toISOString()};if(!r.name||!r.amount){toast('Compila nome e importo','err');return;}if(id){await db.ref(`users/${UID}/recurring/${id}`).update(r);}else{r.createdAt=new Date().toISOString();await db.ref(`users/${UID}/recurring`).push(r);}cm('modal-rec');document.getElementById('rec-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveRec]',e);toast(ferr(e.code)||e.message,'err');}
}function editRec(id){const r=S.recurring.find(r=>r.id===id);if(!r)return;document.getElementById('rec-id').value=id;document.getElementById('rec-name').value=r.name;document.getElementById('rec-amount').value=r.amount;document.getElementById('rec-freq').value=r.frequency;document.getElementById('rec-cat').value=r.category;document.getElementById('rec-next').value=r.nextDate||'';om('modal-rec');}
async function deleteRec(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/recurring/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteRec]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── DEBTS ─── */
function renderDebts(){
  const grid=document.getElementById('debts-grid'),empty=document.getElementById('debts-empty'),stats=document.getElementById('debt-stats');
  if(!grid)return;
  const totD=S.debts.reduce((s,d)=>s+N(d.rem||d.remaining||0),0),totR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  if(stats)stats.innerHTML=`<div class="sc"><div class="sl">Debito totale</div><div class="sv" style="color:var(--re)">${fmt(totD)}</div></div><div class="sc"><div class="sl">Rate mensili</div><div class="sv" style="color:var(--ye)">${fmt(totR)}</div></div><div class="sc"><div class="sl">N° debiti</div><div class="sv">${S.debts.length}</div></div>`;
  if(!S.debts.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  const DT={mortgage:'🏠 Mutuo',personal:'💰 Personale',car:'🚗 Auto',credit:'💳 Carta',other:'📦 Altro'};
  grid.innerHTML=S.debts.map(d=>{const rem=N(d.rem||d.remaining||0),tot=N(d.total||0);const pct=tot?Math.min(100,Math.round(((tot-rem)/tot)*100)):0;return`<div class="gc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem"><div><div style="font-weight:700">${d.name}</div><div style="font-size:.75rem;color:var(--tx2)">${DT[d.type]||d.type}</div></div><button class="btn bi bd bsm" onclick="deleteDebt('${d.id}')">🗑</button></div><div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;color:var(--re)">${fmt(rem)}</div><div class="pb" style="margin:.5rem 0"><div class="pf" style="width:${pct}%;background:var(--gr)"></div></div><div style="font-size:.75rem;color:var(--tx3);margin-bottom:.75rem">${pct}% rimborsato di ${fmt(tot)}</div><div style="display:flex;gap:1rem;font-size:.8rem"><div><div style="color:var(--tx3)">Rata</div><div style="font-weight:600;color:var(--ye)">${fmt(d.rate||0)}/mese</div></div><div><div style="color:var(--tx3)">Tasso</div><div style="font-weight:600">${d.int||0}%</div></div><div><div style="color:var(--tx3)">Fine</div><div style="font-weight:600">${fd(d.end)}</div></div></div></div>`;}).join('');
}
async function saveDebt(){
  try{
  const id=document.getElementById('debt-id').value;const d={name:document.getElementById('debt-name').value.trim(),total:parseFloat(document.getElementById('debt-total').value)||0,rem:parseFloat(document.getElementById('debt-rem').value)||0,rate:parseFloat(document.getElementById('debt-rate').value)||0,int:parseFloat(document.getElementById('debt-int').value)||0,start:document.getElementById('debt-start').value,end:document.getElementById('debt-end').value,type:document.getElementById('debt-type').value,updatedAt:new Date().toISOString()};if(!d.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/debts/${id}`).update(d);}else{d.createdAt=new Date().toISOString();await db.ref(`users/${UID}/debts`).push(d);}cm('modal-debt');document.getElementById('debt-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveDebt]',e);toast(ferr(e.code)||e.message,'err');}
}async function deleteDebt(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/debts/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteDebt]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── FREE MONEY ─── */
function calcFreeMoney(){
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const mInc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0);
  const mExp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const recTot=S.recurring.reduce((s,r)=>{const m2={weekly:4.33,monthly:1,quarterly:1/3,yearly:1/12}[r.frequency]||1;return s+N(r.amount)*m2;},0);
  const debtRates=S.debts.reduce((s,d)=>s+N(d.rate),0);
  const fixedInc=N(fmCfg.income||mInc),otherInc=N(fmCfg.otherIncome||0);
  const totalInc=fixedInc+otherInc,totalFixed=recTot+debtRates;
  const free=totalInc-totalFixed-mExp;
  const freeAfterFixed=totalInc-totalFixed;
  const fs=document.getElementById('fm-stats');if(fs)fs.innerHTML=`<div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(totalInc)}</div></div><div class="sc"><div class="sl">Spese fisse</div><div class="sv" style="color:var(--ye)">${fmt(totalFixed)}</div></div><div class="sc"><div class="sl">Già speso</div><div class="sv" style="color:var(--re)">${fmt(mExp)}</div></div><div class="sc"><div class="sl">💰 Liberi ora</div><div class="sv" style="color:${free>=0?'var(--gr)':'var(--re)'};font-size:1.8rem">${fmt(free)}</div></div>`;
  const fb=document.getElementById('fm-breakdown');if(fb)fb.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>💼 Entrate</span><span style="font-weight:700;color:var(--gr)">+${fmt(totalInc)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>🔁 Ricorrenti</span><span style="font-weight:700;color:var(--ye)">-${fmt(recTot)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>💳 Rate</span><span style="font-weight:700;color:var(--ye)">-${fmt(debtRates)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>🛒 Spese mese</span><span style="font-weight:700;color:var(--re)">-${fmt(mExp)}</span></div><div style="display:flex;justify-content:space-between;padding:.875rem;background:${free>=0?'rgba(0,240,160,.08)':'rgba(255,51,85,.08)'};border-radius:var(--rs)"><span style="font-weight:700">💰 Liberi ora</span><span style="font-weight:800;font-size:1.1rem;color:${free>=0?'var(--gr)':'var(--re)'}">${fmt(free)}</span></div></div>`;
  const fd2=document.getElementById('fm-dist');const d50=freeAfterFixed*.5,d30=freeAfterFixed*.3,d20=freeAfterFixed*.2;
  if(fd2)fd2.innerHTML=`<div style="font-size:.8rem;color:var(--tx2);margin-bottom:.875rem">Sul disponibile dopo spese fisse: ${fmt(freeAfterFixed)}</div>${[{l:'🏠 Necessità (50%)',v:d50,c:'var(--ac2)'},{l:'🎬 Svago (30%)',v:d30,c:'var(--ac)'},{l:'🏆 Risparmio (20%)',v:d20,c:'var(--gr)'}].map(i=>`<div style="margin-bottom:.875rem"><div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.3rem"><span>${i.l}</span><span style="font-weight:700;color:${i.c}">${fmt(i.v)}</span></div><div class="pb"><div class="pf" style="width:${Math.min(100,mExp/(i.v||1)*100)}%;background:${i.c}"></div></div></div>`).join('')}`;
  const fi=document.getElementById('fm-income');if(fi&&!fi.value)fi.value=fmCfg.income||'';
  const fo=document.getElementById('fm-other');if(fo&&!fo.value)fo.value=fmCfg.otherIncome||'';
}
function saveFM(){fmCfg={income:parseFloat(document.getElementById('fm-income').value)||0,otherIncome:parseFloat(document.getElementById('fm-other').value)||0};localStorage.setItem('kz_fm',JSON.stringify(fmCfg));calcFreeMoney();toast('Salvato','ok');}

