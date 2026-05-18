/* ─── INVOICES ─── */
function renderInvoices(){
  const tbody=document.getElementById('inv-tbody'),empty=document.getElementById('inv-empty'),stats=document.getElementById('inv-stats');
  if(!tbody)return;
  const am={draft:0,sent:0,paid:0,overdue:0};S.invoices.forEach(i=>{am[i.status]=(am[i.status]||0)+N(i.amount)*(1+N(i.vat||22)/100);});
  if(stats)stats.innerHTML=Object.entries(am).map(([s,v])=>`<div style="background:var(--bg2);border:1px solid var(--b1);border-radius:var(--rs);padding:.75rem 1rem"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);margin-bottom:.25rem">${IS[s]?.l||s}</div><div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700">${fmt(v)}</div></div>`).join('');
  if(!S.invoices.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  tbody.innerHTML=S.invoices.map(i=>{const vat=N(i.vat||22);const total=N(i.amount)*(1+vat/100);const s=IS[i.status]||IS.draft;return`<tr><td class="tdm">${i.invoiceNum||'—'}</td><td>${i.client}</td><td>${fd(i.date)}</td><td>${fd(i.due)}</td><td>${vat}%</td><td style="font-weight:700">${fmt(total)}</td><td><span class="badge ${s.c}">${s.l}</span></td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editInv('${i.id}')">✏️</button><button class="btn bi bd bsm" onclick="deleteInv('${i.id}')">🗑</button></div></td></tr>`;}).join('');
}
async function saveInv(){
  try{
  const id=document.getElementById('inv-id').value;const vat=parseInt(document.getElementById('inv-vat').value)||22,amount=parseFloat(document.getElementById('inv-amount').value)||0;const inv={client:document.getElementById('inv-client').value.trim(),invoiceNum:document.getElementById('inv-num').value.trim(),date:document.getElementById('inv-date').value,due:document.getElementById('inv-due').value,amount,vat,totalWithVat:amount*(1+vat/100),status:document.getElementById('inv-status').value,notes:document.getElementById('inv-notes').value.trim(),updatedAt:new Date().toISOString()};if(!inv.client||!inv.amount){toast('Compila cliente e importo','err');return;}if(id){await db.ref(`users/${UID}/invoices/${id}`).update(inv);}else{inv.createdAt=new Date().toISOString();await db.ref(`users/${UID}/invoices`).push(inv);}cm('modal-inv');document.getElementById('inv-id').value='';toast('Salvata','ok');
  }catch(e){console.error('[saveInv]',e);toast(ferr(e.code)||e.message,'err');}
}function editInv(id){const i=S.invoices.find(i=>i.id===id);if(!i)return;document.getElementById('inv-id').value=id;document.getElementById('inv-client').value=i.client;document.getElementById('inv-num').value=i.invoiceNum||'';document.getElementById('inv-date').value=i.date;document.getElementById('inv-due').value=i.due||'';document.getElementById('inv-amount').value=i.amount;document.getElementById('inv-vat').value=i.vat||22;document.getElementById('inv-status').value=i.status;document.getElementById('inv-notes').value=i.notes||'';om('modal-inv');}
async function deleteInv(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/invoices/${id}`).remove();toast('Eliminata','ok');
  }catch(e){console.error('[deleteInv]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── QUOTES ─── */
function renderQuotes(){const tbody=document.getElementById('quotes-tbody'),empty=document.getElementById('quotes-empty');if(!tbody)return;const QS={draft:{l:'Bozza',c:'bg-gy'},sent:{l:'Inviato',c:'bg-ye'},accepted:{l:'Accettato',c:'bg-gr'},rejected:{l:'Rifiutato',c:'bg-re'}};if(!S.quotes.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';tbody.innerHTML=S.quotes.map(q=>{const total=N(q.amount)*(1+N(q.vat||22)/100);const s=QS[q.status]||QS.draft;return`<tr><td class="tdm">${q.num||'—'}</td><td>${q.client||'—'}</td><td>${fd(q.date)}</td><td>${fd(q.valid)}</td><td style="font-weight:700">${fmt(total)}</td><td><span class="badge ${s.c}">${s.l}</span></td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editQt('${q.id}')">✏️</button><button class="btn bi bs bsm" onclick="qt2Inv('${q.id}')">🧾</button><button class="btn bi bd bsm" onclick="deleteQt('${q.id}')">🗑</button></div></td></tr>`;}).join('');}
async function saveQt(){
  try{
  const id=document.getElementById('qt-id').value;const q={client:document.getElementById('qt-client').value.trim(),num:document.getElementById('qt-num').value.trim(),date:document.getElementById('qt-date').value,valid:document.getElementById('qt-valid').value,amount:parseFloat(document.getElementById('qt-amount').value)||0,vat:parseInt(document.getElementById('qt-vat').value)||22,status:document.getElementById('qt-status').value,notes:document.getElementById('qt-notes').value.trim(),updatedAt:new Date().toISOString()};if(!q.client||!q.amount){toast('Compila cliente e importo','err');return;}if(id){await db.ref(`users/${UID}/quotes/${id}`).update(q);}else{q.createdAt=new Date().toISOString();await db.ref(`users/${UID}/quotes`).push(q);}cm('modal-quote');document.getElementById('qt-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveQt]',e);toast(ferr(e.code)||e.message,'err');}
}function editQt(id){const q=S.quotes.find(q=>q.id===id);if(!q)return;document.getElementById('qt-id').value=id;document.getElementById('qt-client').value=q.client;document.getElementById('qt-num').value=q.num||'';document.getElementById('qt-date').value=q.date;document.getElementById('qt-valid').value=q.valid||'';document.getElementById('qt-amount').value=q.amount;document.getElementById('qt-vat').value=q.vat||22;document.getElementById('qt-status').value=q.status;document.getElementById('qt-notes').value=q.notes||'';om('modal-quote');}
async function qt2Inv(id){const q=S.quotes.find(q=>q.id===id)||S.quotes.find(q=>q.id===document.getElementById('qt-id').value);if(!q){toast('Salva prima il preventivo','warn');return;}if(!confirm(`Convertire in fattura?`))return;const inv={client:q.client,invoiceNum:(q.num||'').replace('PREV','FAT')||'',date:today(),due:'',amount:q.amount,vat:q.vat,totalWithVat:q.amount*(1+q.vat/100),status:'draft',notes:q.notes||'',createdAt:new Date().toISOString()};await db.ref(`users/${UID}/invoices`).push(inv);if(q.id)await db.ref(`users/${UID}/quotes/${q.id}`).update({status:'accepted'});toast('Convertito in fattura!','ok');showView('invoices');}
async function deleteQt(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/quotes/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteQt]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── SUPPLIERS ─── */
const SUP_IC={software:'💻',servizi:'🔧',materiali:'📦',consulenza:'💼',utilities:'⚡',altro:'📋'};
function renderSuppliers(){const grid=document.getElementById('suppliers-grid'),empty=document.getElementById('suppliers-empty');if(!grid)return;if(!S.suppliers.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';grid.innerHTML=S.suppliers.map(s=>`<div class="gc"><div style="font-size:1.5rem;margin-bottom:.5rem">${SUP_IC[s.cat]||'📋'}</div><div style="font-weight:700;font-size:1rem;margin-bottom:.2rem">${s.name}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${s.email||'—'}</div>${s.cost>0?`<div style="font-size:.875rem">Costo: <strong style="color:var(--re)">${fmt(s.cost)}/mese</strong></div>`:''}<div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editSup('${s.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteSup('${s.id}')">🗑</button></div></div>`).join('');}
async function saveSup(){
  try{
  const id=document.getElementById('sup-id').value;const s={name:document.getElementById('sup-name').value.trim(),cat:document.getElementById('sup-cat').value,cost:parseFloat(document.getElementById('sup-cost').value)||0,email:document.getElementById('sup-email').value.trim(),notes:document.getElementById('sup-notes').value.trim(),updatedAt:new Date().toISOString()};if(!s.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/suppliers/${id}`).update(s);}else{s.createdAt=new Date().toISOString();await db.ref(`users/${UID}/suppliers`).push(s);}cm('modal-sup');document.getElementById('sup-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveSup]',e);toast(ferr(e.code)||e.message,'err');}
}function editSup(id){const s=S.suppliers.find(s=>s.id===id);if(!s)return;document.getElementById('sup-id').value=id;document.getElementById('sup-name').value=s.name;document.getElementById('sup-cat').value=s.cat||'altro';document.getElementById('sup-cost').value=s.cost||'';document.getElementById('sup-email').value=s.email||'';document.getElementById('sup-notes').value=s.notes||'';om('modal-sup');}
async function deleteSup(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/suppliers/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteSup]',e);toast(ferr(e.code)||e.message,'err');}
}
/* ─── PRIMA NOTA ─── */
function renderPrimaNota(){
  const y=pnDate.getFullYear(),mo=pnDate.getMonth(),mStr=`${y}-${String(mo+1).padStart(2,'0')}`;
  const pt=document.getElementById('pn-title');if(pt)pt.textContent='Prima Nota — '+new Date(y,mo,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const txM=S.transactions.filter(t=>t.date?.startsWith(mStr)).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const ps=document.getElementById('pn-stats');if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Registrazioni</div><div class="sv">${txM.length}</div></div><div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div></div><div class="sc"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div></div><div class="sc"><div class="sl">Saldo</div><div class="sv" style="color:${inc-exp>=0?'var(--gr)':'var(--re)'}">${fmt(inc-exp)}</div></div>`;
  const tbody=document.getElementById('pn-tbody');if(!tbody)return;let prog=0;tbody.innerHTML=txM.map((t,i)=>{const amt=N(t.amount);prog+=t.type==='income'?amt:-amt;return`<tr><td style="font-size:.82rem;color:var(--tx3)">${String(i+1).padStart(3,'0')}</td><td style="font-size:.82rem">${fd(t.date)}</td><td class="tdm">${t.description||'—'}</td><td><span class="badge bg-gy">${cap(t.category||'altro')}</span></td><td style="font-weight:600;color:var(--gr)">${t.type==='income'?fmt(amt):'—'}</td><td style="font-weight:600;color:var(--re)">${t.type==='expense'?fmt(amt):'—'}</td><td style="font-weight:700;color:${prog>=0?'var(--gr)':'var(--re)'}">${fmt(prog)}</td></tr>`;}).join('');
}
function pnPrev(){pnDate.setMonth(pnDate.getMonth()-1);renderPrimaNota();}
function pnNext(){pnDate.setMonth(pnDate.getMonth()+1);renderPrimaNota();}
function exportPrimaNota(){try{const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.setFontSize(16);doc.text('Prima Nota',14,20);doc.setFontSize(9);doc.setTextColor(120);doc.text(pnDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'}),14,28);doc.setTextColor(0);let y=40;const y2=pnDate.getFullYear(),mo2=pnDate.getMonth(),mStr2=`${y2}-${String(mo2+1).padStart(2,'0')}`;const txM=S.transactions.filter(t=>t.date?.startsWith(mStr2)).sort((a,b)=>new Date(a.date)-new Date(b.date));let prog=0;txM.forEach((t,i)=>{if(y>270){doc.addPage();y=20;}const amt=N(t.amount);prog+=t.type==='income'?amt:-amt;doc.setFontSize(8);doc.text(String(i+1).padStart(3,'0'),14,y);doc.text(t.date||'—',20,y);doc.text((t.description||'—').slice(0,35),40,y);if(t.type==='income')doc.text(fmt(amt),120,y);if(t.type==='expense')doc.text(fmt(amt),145,y);doc.text(fmt(prog),170,y);y+=7;});doc.save('prima-nota.pdf');toast('PDF esportato','ok');}catch(e){toast('Errore PDF','err');}}

/* ─── TAX CALC ─── */
function calcTax(){
  const rev=parseFloat(document.getElementById('tax-rev')?.value)||0;
  const res=document.getElementById('tax-result');if(!res)return;
  if(!rev){res.innerHTML='<div style="color:var(--tx3);font-size:.875rem;padding:1rem 0">Inserisci il fatturato annuo lordo</div>';return;}
  const regime=document.getElementById('tax-regime')?.value||'forfettario_15';
  const coeff=parseFloat(document.getElementById('tax-ateco')?.value)||0.78;
  const inpsRate=parseFloat(document.getElementById('tax-inps')?.value)||0.2607;
  let taxableBase,taxAmount,inpsAmount,net;
  const taxRate=regime==='forfettario_5'?0.05:regime==='forfettario_15'?0.15:null;
  taxableBase=rev*coeff;
  inpsAmount=taxableBase*inpsRate;
  if(taxRate){const adj=taxableBase-inpsAmount*0.5;taxAmount=adj*taxRate;}
  else{const nb=taxableBase-inpsAmount;taxAmount=nb<=15000?nb*.23:nb<=28000?3450+(nb-15000)*.25:nb<=50000?6700+(nb-28000)*.35:nb<=75000?14400+(nb-50000)*.41:24650+(nb-75000)*.43;}
  net=rev-taxAmount-inpsAmount;
  res.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>Fatturato lordo</span><span style="font-weight:700">${fmt(rev)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>Base imponibile</span><span style="font-weight:700">${fmt(taxableBase)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>🏛️ Tasse</span><span style="font-weight:700;color:var(--re)">-${fmt(taxAmount)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>🏦 INPS</span><span style="font-weight:700;color:var(--ye)">-${fmt(inpsAmount)}</span></div><div style="display:flex;justify-content:space-between;padding:.875rem;background:rgba(0,240,160,.08);border-radius:var(--rs)"><span style="font-weight:700">💰 Netto annuo</span><span style="font-weight:800;font-size:1.1rem;color:var(--gr)">${fmt(net)}</span></div><div style="font-size:.8rem;color:var(--tx2);margin-top:.5rem">Mensile netto: <strong style="color:var(--tx)">${fmt(net/12)}</strong> · Accantona: <strong style="color:var(--or)">${fmt((taxAmount+inpsAmount)/12)}/mese</strong></div></div>`;
}

/* ─── TRAVEL ─── */
function renderTravel(){const grid=document.getElementById('travel-grid'),empty=document.getElementById('travel-empty');if(!grid)return;if(!S.travel.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';const ic={vacation:'🏖️',business:'💼',other:'📦'};grid.innerHTML=S.travel.map(t=>`<div class="gc"><div style="font-size:1.75rem;margin-bottom:.75rem">${ic[t.reason]||'✈️'}</div><div style="font-weight:700;margin-bottom:.25rem">${t.destination}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${fd(t.startDate)} → ${fd(t.endDate)}</div><div style="font-size:.875rem">Budget: <strong>${fmt(t.budget)}</strong></div><div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editTrv('${t.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteTrv('${t.id}')">🗑</button></div></div>`).join('');}
async function saveTrv(){
  try{
  const id=document.getElementById('trv-id').value;const t={destination:document.getElementById('trv-dest').value.trim(),startDate:document.getElementById('trv-start').value,endDate:document.getElementById('trv-end').value,budget:parseFloat(document.getElementById('trv-budget').value)||0,reason:document.getElementById('trv-reason').value,updatedAt:new Date().toISOString()};if(!t.destination){toast('Inserisci destinazione','err');return;}if(id){await db.ref(`users/${UID}/travel/${id}`).update(t);}else{t.createdAt=new Date().toISOString();await db.ref(`users/${UID}/travel`).push(t);}cm('modal-travel');document.getElementById('trv-id').value='';toast('Salvato','ok');
  }catch(e){console.error('[saveTrv]',e);toast(ferr(e.code)||e.message,'err');}
}function editTrv(id){const t=S.travel.find(t=>t.id===id);if(!t)return;document.getElementById('trv-id').value=id;document.getElementById('trv-dest').value=t.destination;document.getElementById('trv-start').value=t.startDate||'';document.getElementById('trv-end').value=t.endDate||'';document.getElementById('trv-budget').value=t.budget||0;document.getElementById('trv-reason').value=t.reason||'vacation';om('modal-travel');}
async function deleteTrv(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/travel/${id}`).remove();toast('Eliminato','ok');
  }catch(e){console.error('[deleteTrv]',e);toast(ferr(e.code)||e.message,'err');}
}
