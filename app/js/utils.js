// +--------------------------------------------------------------+
// �  WARNING � FILE ORFANO / NON INTEGRATO                      �
// �  Questo file NON � caricato dall'app principale (app.html).  �
// �  Il codice eseguibile � nello script inline di app/app.html. �
// �  Mantenuto per riferimento storico � NON modificare.         �
// +--------------------------------------------------------------+
/* ─── PROFILE ─── */
async function saveProfile(){
  try{
  const name=document.getElementById('prof-name')?.value.trim();if(!name){toast('Inserisci nome','err');return;}await db.ref(`users/${UID}/profile/name`).set(name);await auth.currentUser?.updateProfile({displayName:name});UP.name=name;const ini=name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);['nav-av','side-av'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ini;});const sn=document.getElementById('side-name');if(sn)sn.textContent=name;toast('Profilo aggiornato','ok');
  }catch(e){console.error('[saveProfile]',e);toast(ferr(e.code)||e.message,'err');}
}async function changePass(){const pass=document.getElementById('prof-pass')?.value;if(!pass||pass.length<6){toast('Password min. 6 caratteri','err');return;}try{await auth.currentUser?.updatePassword(pass);toast('Password aggiornata','ok');document.getElementById('prof-pass').value='';}catch(e){toast('Rieffettua il login e riprova','err');}}

/* ─── BACKUP ─── */
function exportBackup(){const backup={version:2,exportedAt:new Date().toISOString(),user:{name:UP?.name,email:UP?.email},data:{transactions:S.transactions,accounts:S.accounts,budgets:S.budgets,goals:S.goals,recurring:S.recurring,invoices:S.invoices,travel:S.travel,transfers:S.transfers,debts:S.debts,quotes:S.quotes||[],suppliers:S.suppliers||[]}};const b=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`kazka-backup-${today()}.json`;a.click();toast('Backup esportato','ok');}
async function importBackup(e){const file=e.target.files[0];if(!file)return;try{const text=await file.text();const backup=JSON.parse(text);if(!backup.data){toast('File non valido','err');return;}if(!confirm(`Importare backup del ${fd(backup.exportedAt)}?`))return;const data=backup.data,ops={};if(data.accounts){const map={};data.accounts.forEach(a=>{const{id,...r}=a;map[id||db.ref().push().key]=r;});ops.accounts=map;}if(data.goals){const map={};data.goals.forEach(g=>{const{id,...r}=g;map[id||db.ref().push().key]=r;});ops.goals=map;}if(data.transactions){const map={};data.transactions.forEach(t=>{const{id,...r}=t;map[id||db.ref().push().key]=r;});ops.transactions=map;}if(data.budgets)ops.budgets=data.budgets;await db.ref(`users/${UID}`).update(ops);toast('Backup ripristinato!','ok');}catch(e){toast('Errore: '+e.message,'err');}e.target.value='';}

/* ─── EXPORT ─── */
function exportCSV(){const rows=[['Data','Descrizione','Tipo','Categoria','Importo','Note']];const aN=id=>S.accounts.find(a=>a.id===id)?.name||'';S.transactions.forEach(t=>rows.push([t.date,t.description,t.type,t.category,aN(t.account),(t.type==='income'?'':'-')+t.amount,t.note||'']));const b=new Blob([rows.map(r=>r.join(';')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kazka-tx.csv';a.click();}
function exportPDF(){try{const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.setFontSize(20);doc.text('Kazka — Report',14,22);doc.setFontSize(9);doc.setTextColor(120);doc.text(new Date().toLocaleDateString('it-IT'),14,30);doc.setTextColor(0);const ti=S.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),te=S.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);doc.setFontSize(11);doc.text('Riepilogo',14,42);doc.setFontSize(9);doc.text(`Entrate: ${fmt(ti)}`,14,52);doc.text(`Uscite: ${fmt(te)}`,14,60);doc.text(`Netto: ${fmt(ti-te)}`,14,68);let y=85;doc.setFontSize(10);doc.text('Ultime transazioni',14,78);S.transactions.slice(0,20).forEach(t=>{if(y>270){doc.addPage();y=20;}doc.setFontSize(8);doc.text(t.date||'—',14,y);doc.text((t.description||'—').slice(0,35),40,y);doc.text(`${t.type==='income'?'+':'-'}${fmt(t.amount)}`,160,y);y+=7;});doc.save('kazka-report.pdf');toast('PDF esportato','ok');}catch(e){toast('Errore PDF','err');}}

/* ─── EXCHANGE RATES ─── */
let rates={EUR:1,USD:1.08,CHF:0.96,GBP:0.86};
async function fetchRates(){const ls=localStorage.getItem('kz_rates_ts');if(ls&&Date.now()-parseInt(ls)<3600000)return;try{const r=await fetch('https://api.exchangerate-api.com/v4/latest/EUR');if(!r.ok)return;const d=await r.json();rates={EUR:1,USD:d.rates.USD,CHF:d.rates.CHF,GBP:d.rates.GBP};localStorage.setItem('kz_rates_ts',String(Date.now()));}catch(e){}}

/* ─── HELPERS ─── */
function populateSels(){const opts=S.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')||'<option value="">Nessun conto</option>';const el=document.getElementById('tx-acc');if(el)el.innerHTML=opts;}
function mkChart(id,type,data,options){const canvas=document.getElementById(id);if(!canvas)return;if(charts[id])charts[id].destroy();charts[id]=new Chart(canvas,{type,data,options});}
function om(id){const el=document.getElementById(id);if(el){el.style.display='flex';el.classList.add('open');}}
function cm(id){const el=document.getElementById(id);if(el){el.style.display='none';el.classList.remove('open');}}
document.addEventListener('click',e=>{if(e.target.classList.contains('mo'))e.target.style.display='none';});
function fmt(v){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(N(v));}
function fd(d){if(!d)return'—';try{return new Date(d).toLocaleDateString('it-IT');}catch{return d;}}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function today(){return new Date().toISOString().split('T')[0];}
function N(v){return Number(v)||0;}
function showErr(el,msg){if(el){el.textContent=msg;el.style.display='block';}}
function toast(msg,type='ok'){const t=document.getElementById('toast');if(!t)return;t.innerHTML=`<span>${{ok:'✓',err:'✕',warn:'⚠'}[type]||'ℹ'}</span> ${msg}`;t.className='toast '+type+' show';clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3500);}
function ferr(c){const m={'auth/user-not-found':'Email non trovata','auth/wrong-password':'Password errata','auth/email-already-in-use':'Email già registrata','auth/weak-password':'Password troppo corta (min. 6)','auth/invalid-email':'Email non valida','auth/too-many-requests':'Troppi tentativi — riprova più tardi','auth/invalid-credential':'Credenziali non valide','auth/network-request-failed':'Errore di rete — controlla la connessione'};return m[c]||'Errore — riprova';}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded',()=>{
  applyTheme(theme);
  const dateFields=['tx-date','rec-next','inv-date','trv-start','ge-date','tr-date'];
  dateFields.forEach(id=>{const el=document.getElementById(id);if(el)el.value=today();});
  renderCalendar();
  updateNotifBadge();
});


/* ══ DASHBOARD WIDGETS ══ */
function updateDashWidgets(){
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0);
  const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const recTot=S.recurring.reduce((s,r)=>{const f={weekly:4.33,monthly:1,quarterly:1/3,yearly:1/12}[r.frequency]||1;return s+N(r.amount)*f;},0);
  const debtR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  const fixedInc=N(fmCfg.income||inc);
  const free=fixedInc-recTot-debtR-exp;
  const wfm=document.getElementById('w-freemoney');
  if(wfm){wfm.textContent=fmt(free);wfm.style.color=free>=0?'var(--gr)':'var(--re)';}
  // Next 30 days expenses forecast
  const today2=new Date();
  const in30=new Date();in30.setDate(in30.getDate()+30);
  const future=recTot*1+debtR;
  const wn=document.getElementById('w-next30');if(wn)wn.textContent=fmt(future+exp);
  // Debt widget
  const drow=document.getElementById('w-debt-row');
  if(S.debts.length&&drow){
    drow.style.display='block';
    const totDebt=S.debts.reduce((s,d)=>s+N(d.rem||d.remaining||0),0);
    const totRate=S.debts.reduce((s,d)=>s+N(d.rate),0);
    const avgRate=S.debts.length?S.debts.reduce((s,d)=>s+N(d.int||0),0)/S.debts.length:0;
    document.getElementById('w-debt-cards').innerHTML=S.debts.map(d=>{
      const rem=N(d.rem||d.remaining||0),rate=N(d.rate||0),interest=N(d.int||0);
      const monthsLeft=rate>0?Math.ceil(rem/rate):0;
      return`<div style="background:var(--bg3);border-radius:var(--rs);padding:.75rem">
        <div style="font-size:.72rem;font-weight:700;color:var(--tx2);margin-bottom:.25rem">${d.name}</div>
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:var(--re)">${fmt(rem)}</div>
        <div style="font-size:.72rem;color:var(--tx3);margin-top:.2rem">Rata: <strong style="color:var(--ye)">${fmt(rate)}/mese</strong></div>
        <div style="font-size:.72rem;color:var(--tx3)">Fine: <strong>${monthsLeft>0?monthsLeft+' mesi':'—'}</strong></div>
      </div>`;
    }).join('');
  } else if(drow) drow.style.display='none';
}

/* ══ PROJECTS ══ */
let currentProjId=null;
let selectedProjLinks=[];

function renderProjects(){
  const grid=document.getElementById('projects-grid'),empty=document.getElementById('projects-empty');
  if(!grid)return;
  const projects=S.projects||[];
  if(!projects.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=projects.map(p=>{
    const items=p.items||[];
    const spent=items.reduce((s,i)=>s+N(i.amount),0);
    const budget=N(p.budget||0);
    const pct=budget>0?Math.min(100,Math.round((spent/budget)*100)):0;
    const color=pct>=90?'var(--re)':pct>=70?'var(--ye)':'var(--gr)';
    const daysLeft=p.endDate?Math.ceil((new Date(p.endDate)-new Date())/864e5):null;
    return`<div class="gc" style="cursor:pointer;border-left:3px solid ${p.color||'var(--ac)'}" onclick="openProject('${p.id}')">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="font-size:1.5rem">${p.icon||'📁'}</div>
        ${daysLeft!==null?`<span class="badge ${daysLeft<=0?'bg-re':daysLeft<=7?'bg-ye':'bg-gy'}">${daysLeft<=0?'Scaduto':daysLeft+'gg'}</span>`:''}
      </div>
      <div style="font-weight:700;font-size:.95rem;margin-bottom:.2rem">${p.name}</div>
      <div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${p.description||''}</div>
      <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.35rem">
        <span>Speso: <strong>${fmt(spent)}</strong></span>
        ${budget>0?`<span style="color:${color}"><strong>${pct}%</strong> di ${fmt(budget)}</span>`:'<span style="color:var(--tx3)">nessun budget</span>'}
      </div>
      ${budget>0?`<div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div>`:''}
      <div style="font-size:.72rem;color:var(--tx3);margin-top:.5rem">${items.length} voci · ${fd(p.startDate)} → ${fd(p.endDate)}</div>
    </div>`;
  }).join('');
}

async function saveProject(){
  const id=document.getElementById('proj-id').value;
  const p={name:document.getElementById('proj-name').value.trim(),description:document.getElementById('proj-desc').value.trim(),budget:parseFloat(document.getElementById('proj-budget').value)||0,icon:document.getElementById('proj-icon').value,color:document.getElementById('proj-color').value,startDate:document.getElementById('proj-start').value,endDate:document.getElementById('proj-end').value,items:[],updatedAt:new Date().toISOString()};
  if(!p.name){toast('Inserisci nome progetto','err');return;}
  if(id){
    const existing=S.projects?.find(pr=>pr.id===id);
    p.items=existing?.items||[];
    await db.ref(`users/${UID}/projects/${id}`).update({...p,items:undefined});
  } else {
    p.createdAt=new Date().toISOString();
    await db.ref(`users/${UID}/projects`).push(p);
  }
  cm('modal-project');document.getElementById('proj-id').value='';toast(id?'Aggiornato':'Creato','ok');
}

function openProject(pid){
  currentProjId=pid;
  const p=S.projects?.find(pr=>pr.id===pid);if(!p)return;
  document.getElementById('pd-title').textContent=`${p.icon||'📁'} ${p.name}`;
  const items=p.items||[];
  const spent=items.reduce((s,i)=>s+N(i.amount),0);
  const budget=N(p.budget||0);
  const pct=budget>0?Math.min(100,Math.round((spent/budget)*100)):0;
  const color=pct>=90?'var(--re)':pct>=70?'var(--ye)':'var(--gr)';
  document.getElementById('pd-sub').textContent=`${items.length} voci · Budget: ${fmt(budget)} · Speso: ${fmt(spent)}`;
  const ps=document.getElementById('pd-stats');
  if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Budget</div><div class="sv">${fmt(budget)}</div></div><div class="sc"><div class="sl">Speso</div><div class="sv" style="color:${color}">${fmt(spent)}</div></div><div class="sc"><div class="sl">Rimanente</div><div class="sv" style="color:${budget-spent>=0?'var(--gr)':'var(--re)'}">${fmt(budget-spent)}</div></div><div class="sc"><div class="sl">Voci</div><div class="sv">${items.length}</div></div>`;
  const pp=document.getElementById('pd-progress');
  if(pp)pp.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.5rem"><span>${pct}% utilizzato</span><span style="color:${color};font-weight:700">${fmt(spent)} / ${fmt(budget)}</span></div><div class="pb" style="height:10px"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="font-size:.8rem;color:var(--tx2);margin-top:.5rem">${budget-spent>=0?'Rimanente: '+fmt(budget-spent):'Sforamento: '+fmt(spent-budget)}</div>`;
  // Category breakdown
  const cats={};items.forEach(i=>{cats[i.cat]=(cats[i.cat]||0)+N(i.amount);});
  const sc=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const mc=sc[0]?.[1]||1;
  const CATS={materiali:'🧱',manodopera:'🔨',trasporti:'🚗',professioni:'👷',permessi:'📋',altro:'📦',alimentari:'🛒',casa:'🏠',svago:'🎬',lavoro:'💼'};
  const pc=document.getElementById('pd-cats');
  if(pc)pc.innerHTML=sc.length?sc.map(([c,v])=>`<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.25rem"><span>${CATS[c]||'📦'} ${cap(c)}</span><span style="font-weight:600">${fmt(v)}</span></div><div class="pb" style="height:4px"><div class="pf" style="width:${Math.round((v/mc)*100)}%;background:var(--ac)"></div></div></div>`).join(''):'<div style="color:var(--tx3);font-size:.8rem">Nessuna categoria</div>';
  // Items table
  const tbody=document.getElementById('pd-tbody'),pempty=document.getElementById('pd-empty');
  if(!tbody)return;
  const sorted=[...items].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!sorted.length){tbody.innerHTML='';if(pempty)pempty.style.display='block';}
  else{if(pempty)pempty.style.display='none';tbody.innerHTML=sorted.map((i,idx)=>`<tr><td style="font-size:.82rem">${fd(i.date)}</td><td class="tdm">${i.description||'—'}</td><td><span class="badge bg-gy">${cap(i.cat||'altro')}</span></td><td><span class="badge ${i.fromTx?'bg-bl':'bg-pu'}">${i.fromTx?'Transazione':'Manuale'}</span></td><td style="font-weight:700;color:var(--re)">${fmt(i.amount)}</td><td><button class="btn bi bd bsm" onclick="deleteProjItem('${pid}',${i._idx||idx})">🗑</button></td></tr>`).join('');}
  // Populate account select in proj-tx modal
  const pa=document.getElementById('ptx-account');if(pa)pa.innerHTML=S.accounts.map(a=>`<option value="${a.id}">${a.name} (${fmt(a.balance)})</option>`).join('');
  document.getElementById('ptx-date').value=today();
  showView('project-detail');
}

async function saveProjTx(){
  const pid=currentProjId;if(!pid)return;
  const desc=document.getElementById('ptx-desc').value.trim();
  const amount=parseFloat(document.getElementById('ptx-amount').value)||0;
  const date=document.getElementById('ptx-date').value;
  const cat=document.getElementById('ptx-cat').value;
  const note=document.getElementById('ptx-note').value.trim();
  const deduct=document.querySelector('input[name="ptx-deduct"]:checked')?.value==='yes';
  const accId=document.getElementById('ptx-account').value;
  if(!desc||!amount){toast('Compila descrizione e importo','err');return;}
  const item={description:desc,amount,date,cat,note,deduct,fromTx:false,createdAt:new Date().toISOString()};
  const p=S.projects?.find(pr=>pr.id===pid);
  const items=[...(p?.items||[]),item];
  await db.ref(`users/${UID}/projects/${pid}/items`).set(items);
  if(deduct&&accId){await updateBal(accId,'expense',amount);}
  cm('modal-proj-tx');toast('Spesa aggiunta','ok');openProject(pid);
}

async function deleteProjItem(pid,idx){
  if(!confirm('Eliminare voce?'))return;
  const p=S.projects?.find(pr=>pr.id===pid);
  if(!p)return;
  const items=[...(p.items||[])];items.splice(idx,1);
  await db.ref(`users/${UID}/projects/${pid}/items`).set(items);
  toast('Eliminato','ok');openProject(pid);
}

function filterProjLink(){
  const q=document.getElementById('plnk-search').value.toLowerCase();
  const list=document.getElementById('plnk-list');if(!list)return;
  let tx=S.transactions.filter(t=>t.type==='expense');
  if(q)tx=tx.filter(t=>(t.description||'').toLowerCase().includes(q));
  list.innerHTML=tx.slice(0,30).map(t=>`<label style="display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-bottom:1px solid var(--b1);cursor:pointer;font-size:.875rem"><input type="checkbox" class="plnk-cb" value="${t.id}" style="width:15px;height:15px;accent-color:var(--ac);flex-shrink:0"><div style="flex:1"><div style="font-weight:500">${t.description||'—'}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)} · ${cap(t.category||'altro')}</div></div><div style="font-weight:700;color:var(--re)">-${fmt(t.amount)}</div></label>`).join('')||'<div style="padding:1rem;text-align:center;color:var(--tx3)">Nessuna transazione trovata</div>';
}

async function linkSelectedTx(){
  const pid=currentProjId;if(!pid)return;
  const checked=[...document.querySelectorAll('.plnk-cb:checked')].map(cb=>cb.value);
  if(!checked.length){toast('Seleziona almeno una transazione','warn');return;}
  const p=S.projects?.find(pr=>pr.id===pid);
  const items=[...(p?.items||[])];
  checked.forEach(txId=>{const t=S.transactions.find(t=>t.id===txId);if(t)items.push({description:t.description||'—',amount:N(t.amount),date:t.date,cat:t.category||'altro',note:t.note||'',deduct:true,fromTx:true,txId,createdAt:new Date().toISOString()});});
  await db.ref(`users/${UID}/projects/${pid}/items`).set(items);
  cm('modal-proj-link');toast(`${checked.length} transazioni associate`,'ok');openProject(pid);
}

/* ══ GROUPS SEARCH & EXPIRY ══ */
let grpSearchQ='';
function filterGroups(){grpSearchQ=document.getElementById('grp-search')?.value.toLowerCase()||'';renderGroups();}

function checkGroupExpiry(){
  Object.entries(S.groups).forEach(([gid,g])=>{
    const info=g.info||{};
    if(!info.expiry)return;
    if(new Date(info.expiry)>new Date())return;
    // Check if all balances are settled
    const members=Object.values(g.members||{});
    const expenses=Object.values(g.expenses||{});
    const balances={};members.forEach(m=>{balances[m.name||m.email]=0;});
    expenses.forEach(e=>{const payer=members.find(m=>m.uid===e.payerId||m.email===e.payerId);const pName=payer?.name||e.payerName||e.payerId;const share=e.amount/members.length;members.forEach(m=>{const n=m.name||m.email;if(!balances[n])balances[n]=0;if(n===pName)balances[n]+=(e.amount-share);else balances[n]-=share;});});
    const allSettled=Object.values(balances).every(b=>Math.abs(b)<0.01);
    if(allSettled&&info.autoDelete!==false){
      db.ref(`groups/${gid}`).remove().then(()=>{toast(`Gruppo "${info.name}" auto-eliminato — saldi a zero`,'ok');});
    }
  });
}

/* Override renderGroups to add search and expiry */
const _renderGroupsOrig=renderGroups;
function renderGroups(){
  const el=document.getElementById('groups-list'),empty=document.getElementById('groups-empty');
  if(!el)return;
  let entries=Object.entries(S.groups);
  if(grpSearchQ)entries=entries.filter(([,g])=>{const info=g.info||{};return(info.name||'').toLowerCase().includes(grpSearchQ)||Object.values(g.members||{}).some(m=>(m.name||m.email||'').toLowerCase().includes(grpSearchQ));});
  if(!entries.length){el.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  el.innerHTML=`<div class="gg">${entries.map(([gid,g])=>{
    const info=g.info||{};const mC=Object.keys(g.members||{}).length;const tot=Object.values(g.expenses||{}).reduce((s,e)=>s+N(e.amount),0);
    const hasExpiry=info.expiry;const expDays=hasExpiry?Math.ceil((new Date(info.expiry)-new Date())/864e5):null;
    return`<div class="gc" style="cursor:pointer" onclick="openGroup('${gid}')">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="font-size:1.5rem">${info.icon||'👥'}</div>
        ${expDays!==null?`<span class="badge ${expDays<=0?'bg-re':expDays<=7?'bg-ye':'bg-gy'}">${expDays<=0?'Scaduto':expDays+'gg'}</span>`:''}
      </div>
      <div style="font-weight:700;font-size:1rem;margin-bottom:.25rem">${info.name||'Gruppo'}</div>
      <div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${info.description||''}</div>
      <div style="display:flex;gap:1rem;font-size:.8rem">
        <div><div style="color:var(--tx3)">Membri</div><div style="font-weight:600">${mC}</div></div>
        <div><div style="color:var(--tx3)">Spese</div><div style="font-weight:600;color:var(--re)">${fmt(tot)}</div></div>
        ${hasExpiry?`<div><div style="color:var(--tx3)">Scade</div><div style="font-weight:600">${fd(info.expiry)}</div></div>`:''}
      </div>
    </div>`;
  }).join('')}</div>`;
  checkGroupExpiry();
}

/* Override saveGroup to include expiry */
async function saveGroup(){
  const name=document.getElementById('grp-name').value.trim();if(!name){toast('Inserisci nome','err');return;}
  const expiry=document.getElementById('grp-expiry')?.value||'';
  const membersRaw=document.getElementById('grp-members').value;
  const gid=db.ref('groups').push().key;
  const members={};members[UID]={email:UP?.email||'',name:UP?.name||'',uid:UID,joinedAt:new Date().toISOString()};
  membersRaw.split(',').map(m=>m.trim()).filter(m=>m).forEach((email,i)=>{members['g'+i]={email,name:email,pending:true,joinedAt:new Date().toISOString()};});
  await db.ref(`groups/${gid}`).set({info:{name,description:document.getElementById('grp-desc').value.trim(),icon:document.getElementById('grp-icon').value,expiry,autoDelete:true,createdBy:UID,createdAt:new Date().toISOString()},members});
  cm('modal-group');toast('Gruppo creato!','ok');
}

/* ══ PROJECTS SUBSCRIPTION — aggiunto direttamente in subscribeData ══ */
/* (nessun override a catena: il listener progetti è gestito dentro subscribeData originale) */

/* Patch subscribeData per aggiungere il listener projects */
(function(){
  const _orig = subscribeData;
  subscribeData = function(){
    _orig();
    db.ref(`users/${UID}/projects`).on('value',snap=>{
      const raw=snap.val()||{};
      S.projects=Object.entries(raw).map(([id,v])=>({id,...v}));
      renderProjects();
    });
  };
})();

/* Patch renderAll per aggiungere widgets e projects */
(function(){
  const _orig = renderAll;
  renderAll = function(){
    _orig();
    try{ updateDashWidgets(); }catch(e){ console.warn('updateDashWidgets',e.message); }
    try{ renderProjects(); }catch(e){ console.warn('renderProjects',e.message); }
  };
})();

/* Open project modal - populate account select */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('input[name="ptx-deduct"]').forEach(r=>{
    r.addEventListener('change',()=>{
      const row=document.getElementById('ptx-account-row');
      if(row)row.style.display=r.value==='yes'?'block':'none';
    });
  });
});
if('serviceWorker' in navigator){navigator.serviceWorker.register('../sw.js').catch(()=>{});}

initGlobalErrors();
