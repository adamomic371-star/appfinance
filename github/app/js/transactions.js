// +--------------------------------------------------------------+
// �  WARNING � FILE ORFANO / NON INTEGRATO                      �
// �  Questo file NON � caricato dall'app principale (app.html).  �
// �  Il codice eseguibile � nello script inline di app/app.html. �
// �  Mantenuto per riferimento storico � NON modificare.         �
// +--------------------------------------------------------------+
/* ─── TRANSACTIONS ─── */
function renderTransactions(){
  const q=(document.getElementById('search-input')||{}).value?.toLowerCase()||'';
  const type=(document.getElementById('f-type')||{}).value||'';
  const cat=(document.getElementById('f-cat')||{}).value||'';
  const cats=[...new Set(S.transactions.map(t=>t.category).filter(Boolean))];
  const fc=document.getElementById('f-cat');if(fc){const cv=fc.value;fc.innerHTML='<option value="">Cat.</option>'+cats.map(c=>`<option value="${c}">${CI[c]||''} ${cap(c)}</option>`).join('');fc.value=cv;}
  let tx=S.transactions;
  if(q)tx=tx.filter(t=>(t.description||'').toLowerCase().includes(q)||(t.category||'').toLowerCase().includes(q));
  if(type)tx=tx.filter(t=>t.type===type);
  if(cat)tx=tx.filter(t=>t.category===cat);
  const tbody=document.getElementById('tx-tbody'),empty=document.getElementById('tx-empty');
  if(!tbody)return;
  if(!tx.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  const aN=id=>S.accounts.find(a=>a.id===id)?.name||'—';
  tbody.innerHTML=tx.map(t=>`<tr>
    <td style="font-size:.82rem">${fd(t.date)}</td>
    <td class="tdm">${CI[t.category]||'📦'} ${t.description||'—'}${t.note?`<div style="font-size:.72rem;color:var(--tx3)">${t.note}</div>`:''}</td>
    <td><span class="badge bg-gy">${cap(t.category||'altro')}</span></td>
    <td style="font-size:.82rem">${aN(t.account)}</td>
    <td style="font-weight:700;color:${t.type==='income'?'var(--gr)':'var(--re)'}">${t.type==='income'?'+':'-'}${CS[t.currency]||'€'}${N(t.amount).toFixed(2)}</td>
    <td><div style="display:flex;gap:.25rem">
      <button class="btn bi bs bsm" onclick="editTx('${t.id}')">✏️</button>
      <button class="btn bi bd bsm" onclick="deleteTx('${t.id}')">🗑</button>
    </div></td>
  </tr>`).join('');
}
function filterTx(){renderTransactions();}

function setTT(t){document.getElementById('tx-type').value=t;document.getElementById('btn-exp').className='tb'+(t==='expense'?' ae':'');document.getElementById('btn-inc').className='tb'+(t==='income'?' ai':'');}
function previewRec(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=document.getElementById('tx-rec-prev');img.src=ev.target.result;img.style.display='block';};r.readAsDataURL(f);}

async function saveTx(){
  const id=document.getElementById('tx-id').value;
  const tx={type:document.getElementById('tx-type').value,amount:parseFloat(document.getElementById('tx-amount').value)||0,date:document.getElementById('tx-date').value,description:document.getElementById('tx-desc').value.trim(),category:document.getElementById('tx-cat').value,account:document.getElementById('tx-acc').value,note:document.getElementById('tx-note').value.trim(),currency:document.getElementById('tx-cur').value||'EUR',updatedAt:new Date().toISOString()};
  if(!tx.amount||!tx.date||!tx.description){toast('Compila importo, data e descrizione','err');return;}
  const img=document.getElementById('tx-rec-prev');if(img.style.display!=='none'&&img.src?.startsWith('data:'))tx.receiptUrl=img.src;
  if(id){await db.ref(`users/${UID}/transactions/${id}`).update(tx);}
  else{tx.createdAt=new Date().toISOString();await db.ref(`users/${UID}/transactions`).push(tx);await updateBal(tx.account,tx.type,tx.amount);}
  cm('modal-tx');resetTxForm();toast(id?'Aggiornata':'Aggiunta','ok');
}

function resetTxForm(){['tx-id','tx-amount','tx-desc','tx-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('tx-date').value=today();setTT('expense');document.getElementById('tx-title').textContent='Nuova transazione';const img=document.getElementById('tx-rec-prev');img.style.display='none';document.getElementById('tx-rec').value='';}

async function updateBal(accId,type,amount){
  try{
  if(!accId)return;const a=S.accounts.find(a=>a.id===accId);if(!a)return;const d=type==='income'?N(amount):-N(amount);await db.ref(`users/${UID}/accounts/${accId}/balance`).set(N(a.balance)+d);
  }catch(e){console.error('[updateBal]',e);toast(ferr(e.code)||e.message,'err');}
}
function editTx(id){const t=S.transactions.find(t=>t.id===id);if(!t)return;document.getElementById('tx-id').value=id;document.getElementById('tx-type').value=t.type;setTT(t.type);document.getElementById('tx-amount').value=t.amount;document.getElementById('tx-date').value=t.date;document.getElementById('tx-desc').value=t.description||'';document.getElementById('tx-cat').value=t.category||'altro';document.getElementById('tx-acc').value=t.account||'';document.getElementById('tx-note').value=t.note||'';document.getElementById('tx-cur').value=t.currency||'EUR';document.getElementById('tx-title').textContent='Modifica transazione';if(t.receiptUrl){const img=document.getElementById('tx-rec-prev');img.src=t.receiptUrl;img.style.display='block';}om('modal-tx');}
async function deleteTx(id){
  try{
  if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/transactions/${id}`).remove();toast('Eliminata','ok');
  }catch(e){console.error('[deleteTx]',e);toast(ferr(e.code)||e.message,'err');}
}
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
