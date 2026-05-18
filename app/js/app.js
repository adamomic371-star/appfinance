/* ─── INIT FIREBASE (config caricata da config.js) ─── */
'use strict';
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth(), db = firebase.database();

/* ─── CONSTANTS ─── */
const CI={alimentari:'🛒',trasporti:'🚗',casa:'🏠',salute:'💊',svago:'🎬',lavoro:'💼',abbonamenti:'📱',istruzione:'📚',viaggi:'✈️',altro:'📦'};
const CC=['#7B68EE','#00F0A0','#00E5FF','#FF8C42','#FF3355','#FFD166','#FF3D78','#3ecf8e','#60a5fa','#a78bfa'];
const AI_IC={bank:'🏦',card:'💳',paypal:'🟦',cash:'💵',crypto:'₿',investment:'📈'};
const FQ={weekly:'Settimanale',monthly:'Mensile',quarterly:'Trimestrale',yearly:'Annuale'};
const IS={draft:{l:'Bozza',c:'bg-gy'},sent:{l:'Inviata',c:'bg-ye'},paid:{l:'Pagata',c:'bg-gr'},overdue:{l:'Scaduta',c:'bg-re'}};
const CS={EUR:'€',USD:'$',CHF:'Fr',GBP:'£'};

/* ─── AUTH ─── */
auth.onAuthStateChanged(async u=>{
  if(u && !u.isAnonymous){
    UID=u.uid;
    try{ await loadProfile(u); }catch(e){ console.warn('Profile err:',e.message); }
    showApp();
    subscribeData();
  } else if(!u){
    showAuth();
  }
});

function showAuth(){
  document.getElementById('auth').style.display='flex';
  document.getElementById('app').style.display='none';
}

function showApp(){
  document.getElementById('auth').style.display='none';
  document.getElementById('app').style.display='block';
  applyTheme(theme);
  setMode(mode);
  const sc=document.getElementById('set-cur'); if(sc)sc.value=defaultCur;
  const sc2=document.getElementById('set-cur2'); if(sc2)sc2.value=defaultCur;
  updateNotifBadge();
  setTimeout(()=>{ try{fetchRates();}catch(e){} }, 1000);
}

async function loadProfile(u){
  const snap=await db.ref(`users/${UID}/profile`).once('value');
  UP=snap.val();
  if(!UP){
    UP={uid:UID,email:u.email,name:u.displayName||u.email.split('@')[0],plan:'free',role:'user',createdAt:new Date().toISOString()};
    await db.ref(`users/${UID}/profile`).set(UP);
  }
  const ini=(UP.name||'K').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  ['nav-av','side-av'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=ini;});
  const sn=document.getElementById('side-name'); if(sn)sn.textContent=UP.name||'';
  const se=document.getElementById('side-email'); if(se)se.textContent=UP.email||'';
  const h=new Date().getHours();
  const g=h<12?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera';
  const dg=document.getElementById('dash-greet'); if(dg)dg.textContent=`${g}, ${(UP.name||'').split(' ')[0]}! 👋`;
  const dd=document.getElementById('dash-date'); if(dd)dd.textContent=new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const pn=document.getElementById('prof-name'); if(pn)pn.value=UP.name||'';
  const pe=document.getElementById('prof-email'); if(pe)pe.value=UP.email||'';
}

function subscribeData(){
  const paths=['transactions','accounts','goals','recurring','invoices','travel','transfers','debts','quotes','suppliers'];
  paths.forEach(p=>{
    db.ref(`users/${UID}/${p}`).on('value',
      snap=>{
        const raw=snap.val()||{};
        S[p]=Object.entries(raw).map(([id,v])=>({id,...v}));
        if(p==='transactions')S[p].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
        renderAll();
      },
      err=>{ console.error(`[subscribeData:${p}]`,err); toast(`Errore caricamento ${p}`,'err'); }
    );
  });
  db.ref(`users/${UID}/budgets`).on('value',
    snap=>{S.budgets=snap.val()||{};renderBudget();},
    err=>{ console.error('[subscribeData:budgets]',err); }
  );
  db.ref('groups').on('value',
    snap=>{
      const raw=snap.val()||{};
      S.groups={};
      Object.entries(raw).forEach(([gid,g])=>{
        if(g.members&&(g.members[UID]||Object.values(g.members||{}).some(m=>m.email===UP?.email)))
          S.groups[gid]=g;
      });
      renderGroups();
    },
    err=>{ console.error('[subscribeData:groups]',err); }
  );
}

function renderAll(){
  const fns=[renderDashboard,renderTransactions,renderAccounts,renderBudget,renderGoals,
             renderRecurring,renderInvoices,renderTravel,renderReports,renderTransfers,
             renderDebts,renderScore,populateSels,checkNotifAlerts,renderCalendar,
             renderQuotes,renderSuppliers,calcFreeMoney,renderMonthly,renderPrimaNota];
  fns.forEach(fn=>{ try{fn();}catch(e){console.warn(fn.name,e.message);} });
}

/* ─── AUTH FUNCTIONS ─── */
function switchTab(t){
  document.querySelectorAll('.auth-tab').forEach((tb,i)=>tb.classList.toggle('active',['login','register','reset'][i]===t));
  document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+t)?.classList.add('active');
}

async function doLogin(){
  const email=document.getElementById('l-email').value.trim();
  const pass=document.getElementById('l-pass').value;
  const err=document.getElementById('login-err');
  const btn=document.getElementById('btn-login');
  err.style.display='none';
  if(!email||!pass){showErr(err,'Compila tutti i campi');return;}
  btn.textContent='Accesso...';btn.disabled=true;
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    // onAuthStateChanged gestirà il resto
  }catch(e){
    showErr(err,ferr(e.code));
    btn.textContent='Accedi';btn.disabled=false;
  }
}

async function doRegister(){
  const name=document.getElementById('r-name').value.trim();
  const email=document.getElementById('r-email').value.trim();
  const pass=document.getElementById('r-pass').value;
  const err=document.getElementById('register-err');
  const btn=document.getElementById('btn-register');
  err.style.display='none';
  if(!name||!email||!pass){showErr(err,'Compila tutti i campi');return;}
  btn.textContent='Creazione...';btn.disabled=true;
  try{
    const c=await auth.createUserWithEmailAndPassword(email,pass);
    await c.user.updateProfile({displayName:name});
  }catch(e){
    showErr(err,ferr(e.code));
    btn.textContent='Crea account';btn.disabled=false;
  }
}

async function doGoogle(){
  try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());}
  catch(e){toast(ferr(e.code),'err');}
}

async function doReset(){
  const email=document.getElementById('reset-email').value.trim();
  const err=document.getElementById('reset-err');
  err.style.display='none';
  if(!email){showErr(err,'Inserisci email');return;}
  try{await auth.sendPasswordResetEmail(email);toast('Email inviata!','ok');switchTab('login');}
  catch(e){showErr(err,ferr(e.code));}
}

async function doLogout(){
  if(!confirm('Uscire?'))return;
  await auth.signOut();
  showAuth();
}

/* ─── NAV ─── */
function showView(n){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+n)?.classList.add('active');
  document.getElementById('nav-'+n)?.classList.add('active');
  if(window.innerWidth<=768){document.getElementById('sidebar').classList.remove('open');document.getElementById('s-ov').style.display='none';}
  window.scrollTo(0,0);
  if(n==='reports')setTimeout(renderRepCharts,100);
  if(n==='transfer')populateTransferSels();
  if(n==='notifications')renderNotifications();
  if(n==='taxcalc')setTimeout(calcTax,50);
  if(n==='freemoney')calcFreeMoney();
  if(n==='monthly')renderMonthly();
  if(n==='score')renderScore();
  if(n==='projects')renderProjects();
}

function toggleSidebar(){
  const s=document.getElementById('sidebar'),o=document.getElementById('s-ov');
  s.classList.toggle('open');
  o.style.display=s.classList.contains('open')?'block':'none';
}

function setMode(m){
  mode=m;localStorage.setItem('kz_mode',m);
  document.documentElement.setAttribute('data-mode',m);
  document.getElementById('mb-p').className='mode-btn'+(m==='personal'?' ap':'');
  document.getElementById('mb-b').className='mode-btn'+(m==='business'?' ab':'');
  if(m==='business'){
    const cur=document.querySelector('.view.active');
    if(!cur||!cur.classList.contains('b-only'))showView('invoices');
  } else {
    const cur=document.querySelector('.view.active');
    if(cur&&cur.classList.contains('b-only'))showView('dashboard');
  }
}

function applyTheme(t){theme=t;document.documentElement.setAttribute('data-theme',t);localStorage.setItem('kz_theme',t);const btn=document.getElementById('theme-btn');if(btn)btn.textContent=t==='dark'?'🌙':'☀️';}
function toggleTheme(){applyTheme(theme==='dark'?'light':'dark');}
