/* ─── GROUPS ─── */
function renderGroups(){
  const el=document.getElementById('groups-list'),empty=document.getElementById('groups-empty');
  if(!el)return;
  const entries=Object.entries(S.groups);
  if(!entries.length){el.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  el.innerHTML=`<div class="gg">${entries.map(([gid,g])=>{const info=g.info||{};const mC=Object.keys(g.members||{}).length;const tot=Object.values(g.expenses||{}).reduce((s,e)=>s+N(e.amount),0);return`<div class="gc" style="cursor:pointer" onclick="openGroup('${gid}')"><div style="font-size:1.5rem;margin-bottom:.5rem">${info.icon||'👥'}</div><div style="font-weight:700;font-size:1rem;margin-bottom:.25rem">${info.name||'Gruppo'}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${info.description||''}</div><div style="display:flex;gap:1rem;font-size:.8rem"><div><div style="color:var(--tx3)">Membri</div><div style="font-weight:600">${mC}</div></div><div><div style="color:var(--tx3)">Spese</div><div style="font-weight:600;color:var(--re)">${fmt(tot)}</div></div></div></div>`;}).join('')}</div>`;
}
async function saveGroup(){const name=document.getElementById('grp-name').value.trim();if(!name){toast('Inserisci nome','err');return;}const membersRaw=document.getElementById('grp-members').value;const gid=db.ref('groups').push().key;const members={};members[UID]={email:UP?.email||'',name:UP?.name||'',uid:UID,joinedAt:new Date().toISOString()};membersRaw.split(',').map(m=>m.trim()).filter(m=>m).forEach((email,i)=>{members['g'+i]={email,name:email,pending:true,joinedAt:new Date().toISOString()};});await db.ref(`groups/${gid}`).set({info:{name,description:document.getElementById('grp-desc').value.trim(),icon:document.getElementById('grp-icon').value,createdBy:UID,createdAt:new Date().toISOString()},members});cm('modal-group');toast('Gruppo creato!','ok');}
function openGroup(gid){
  currentGid=gid;const g=S.groups[gid];if(!g)return;const info=g.info||{};
  document.getElementById('gd-title').textContent=info.name||'Gruppo';
  const members=Object.values(g.members||{});
  // Calculate balances
  const balances={};members.forEach(m=>{balances[m.name||m.email]=0;});
  Object.values(g.expenses||{}).forEach(e=>{const payer=members.find(m=>m.uid===e.payerId||m.email===e.payerId);const pName=payer?.name||e.payerName||e.payerId;const share=e.amount/members.length;members.forEach(m=>{const n=m.name||m.email;if(!balances[n])balances[n]=0;if(n===pName)balances[n]+=(e.amount-share);else balances[n]-=share;});});
  document.getElementById('gd-members').innerHTML=members.map(m=>{const n=m.name||m.email;const b=balances[n]||0;return`<div style="display:flex;align-items:center;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--b1)"><div style="width:30px;height:30px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0">${n.charAt(0).toUpperCase()}</div><div style="flex:1"><div style="font-size:.875rem;font-weight:500">${n}</div><div style="font-size:.72rem;color:var(--tx3)">${m.email||''}</div></div><div style="text-align:right"><div style="font-weight:700;font-size:.875rem;color:${b>=0?'var(--gr)':'var(--re)'}">${b>=0?'+':''}${fmt(b)}</div><div style="font-size:.7rem;color:var(--tx3)">${b>0?'da ricevere':b<0?'deve pagare':'in pari'}</div></div></div>`;}).join('');
  const expenses=Object.values(g.expenses||{}).sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('gd-expenses').innerHTML=expenses.slice(0,10).map(e=>`<tr><td>${e.payerName||'—'}</td><td class="tdm">${e.description||'—'}</td><td style="font-weight:700;color:var(--re)">${fmt(e.amount)}</td></tr>`).join('');
  const ps=document.getElementById('ge-payer');if(ps)ps.innerHTML=members.map(m=>`<option value="${m.uid||m.email}">${m.name||m.email}</option>`).join('');
  document.getElementById('ge-date').value=today();
  if(chatOff)chatOff();
  const chatEl=document.getElementById('gd-chat');
  chatOff=db.ref(`groups/${gid}/chat`).limitToLast(50).on('value',snap=>{
    const msgs=Object.entries(snap.val()||{}).map(([id,m])=>({id,...m}));
    chatEl.innerHTML=msgs.map(m=>{const mine=m.uid===UID;return`<div class="${mine?'chat-mine':'chat-other'}">${m.text}<div class="chat-meta">${mine?'Tu':m.name||'?'} · ${new Date(m.ts||0).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div></div>`;}).join('');
    chatEl.scrollTop=chatEl.scrollHeight;
  });
  showView('group-detail');
}
async function sendChat(){const input=document.getElementById('chat-msg'),text=input.value.trim();if(!text||!currentGid)return;await db.ref(`groups/${currentGid}/chat`).push({text,uid:UID,name:UP?.name||'Utente',ts:new Date().toISOString()});input.value='';}
async function saveGE(){const gid=currentGid;if(!gid)return;const desc=document.getElementById('ge-desc').value.trim(),amount=parseFloat(document.getElementById('ge-amount').value)||0,payerId=document.getElementById('ge-payer').value,split=document.getElementById('ge-split').value,date=document.getElementById('ge-date').value;if(!desc||!amount){toast('Compila descrizione e importo','err');return;}const g=S.groups[gid];const payer=Object.values(g?.members||{}).find(m=>m.uid===payerId||m.email===payerId);await db.ref(`groups/${gid}/expenses`).push({description:desc,amount,payerId,payerName:payer?.name||payerId,split,date,createdAt:new Date().toISOString()});cm('modal-ge');toast('Spesa aggiunta','ok');openGroup(gid);}

