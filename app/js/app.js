'use strict';

/* â”€â”€â”€ CONFIG â”€â”€â”€ */
const FB={apiKey:"AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ",authDomain:"financeapp-556ae.firebaseapp.com",databaseURL:"https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app",projectId:"financeapp-556ae",storageBucket:"financeapp-556ae.firebasestorage.app",messagingSenderId:"181987533980",appId:"1:181987533980:web:41c5032990ccede17eb959"};
firebase.initializeApp(FB);
const auth=firebase.auth(), db=firebase.database();

/* â”€â”€â”€ RIPPLE EFFECT â”€â”€â”€ */
document.addEventListener('click',e=>{const target=e.target.closest('.btn,.ni,.bt-item');if(!target||target.closest('.no-ripple'))return;const rect=target.getBoundingClientRect();const ripple=document.createElement('span');ripple.className='ripple';const s=Math.max(rect.width,rect.height);ripple.style.width=ripple.style.height=s+'px';ripple.style.left=(e.clientX-rect.left-s/2)+'px';ripple.style.top=(e.clientY-rect.top-s/2)+'px';target.appendChild(ripple);setTimeout(()=>ripple.remove(),500);});

/* â”€â”€â”€ COUNT-UP ANIMATION â”€â”€â”€ */
function animateValue(el,target,duration=600){if(!el)return;const start=parseFloat(el.dataset.lastVal)||0;const diff=target-start;if(Math.abs(diff)<.01){el.textContent=fmt(target);el.dataset.lastVal=target;return;}const startTime=performance.now();const fmt2=fmt;function tick(now){const elapsed=now-startTime;const progress=Math.min(elapsed/duration,1);const eased=1-Math.pow(1-progress,3);const current=start+diff*eased;el.textContent=fmt2(current);if(progress<1)requestAnimationFrame(tick);else{el.textContent=fmt2(target);el.dataset.lastVal=target;}}requestAnimationFrame(tick);}

/* â”€â”€â”€ GLOBAL ERROR HANDLER â”€â”€â”€ */
window.onerror=function(msg,url,line,col,err){try{const key=Date.now().toString(36);if(!window._errLog)window._errLog={};window._errLog[key]={msg:msg?.slice(0,200),url,line,col,time:new Date().toISOString()};if(Object.keys(window._errLog).length>50){const keys=Object.keys(window._errLog).slice(0,Object.keys(window._errLog).length-50);keys.forEach(k=>delete window._errLog[k]);}}catch(e){}if(typeof toast==='function')toast('Errore imprevisto','err');};
/* â”€â”€â”€ CONSTANTS â”€â”€â”€ */
const CI={alimentari:'ðŸ›’',trasporti:'ðŸš—',casa:'ðŸ ',salute:'ðŸ’Š',svago:'ðŸŽ¬',lavoro:'ðŸ’¼',abbonamenti:'ðŸ“±',istruzione:'ðŸ“š',viaggi:'âœˆï¸',altro:'ðŸ“¦'};
const CC=['#2563EB','#06B6D4','#34D399','#FB923C','#EF4444','#FBBF24','#E879F9','#3ecf8e','#60a5fa','#818CF8'];
const AI_IC={bank:'ðŸ¦',card:'ðŸ’³',paypal:'ðŸŸ¦',cash:'ðŸ’µ',crypto:'â‚¿',investment:'ðŸ“ˆ'};
const FQ={weekly:'Settimanale',monthly:'Mensile',quarterly:'Trimestrale',yearly:'Annuale'};
const IS={draft:{l:'Bozza',c:'bg-gy'},sent:{l:'Inviata',c:'bg-ye'},paid:{l:'Pagata',c:'bg-gr'},overdue:{l:'Scaduta',c:'bg-re'}};
const CS={EUR:'â‚¬',USD:'$',CHF:'Fr',GBP:'Â£'};

/* â”€â”€â”€ STATE â”€â”€â”€ */
let UID=null, UP=null;
let S={transactions:[],accounts:[],budgets:{},goals:[],recurring:[],invoices:[],travel:[],transfers:[],debts:[],groups:{},quotes:[],suppliers:[],categories:[],invoiceTemplates:[],sharedGoals:{}};
// Tracks which data paths have received at least one Firebase snapshot
const _dataReady={};
let charts={}, theme=localStorage.getItem('kz_theme')||'dark', mode=localStorage.getItem('kz_mode')||'personal';
let defaultCur=localStorage.getItem('kz_cur')||'EUR';
let forecastDays=parseInt(localStorage.getItem('kz_forecast_days'))||30;
let currentGid=null, chatOff=null, calDate=new Date(), monthlyDate=new Date(), pnDate=new Date();
let notifications=[];
let fmCfg=JSON.parse(localStorage.getItem('kz_fm')||'{}');
let mainAccId=localStorage.getItem('kz_mainAcc')||'';

/* â”€â”€â”€ FCM (Firebase Cloud Messaging) â”€â”€â”€ */
let messaging=null; let fcmToken=null;
try{if(firebase.messaging) messaging=firebase.messaging();}catch(e){}
async function initFCM(){
  if(!messaging||!UID)return;
  try{
    const perm=await Notification.requestPermission();
    if(perm!=='granted')return;
    // Ottieni la VAPID Key dal tuo Firebase Console -> Cloud Messaging -> Web Push Certificate
    const vapidKey='BB8n2W9trmRHHFKfbJV_TiU2Ul9Qj9lvMXpuM_ujtkrjbsTMyxnYEmbP5Xwu9WJPROhtVEX-WlpW5vEo1NBkx2k';
    fcmToken=await messaging.getToken({vapidKey});
    if(fcmToken) await db.ref(`users/${UID}/fcmTokens/${fcmToken.replace(/[:.]/g,'_')}`).set({token:fcmToken,device:navigator.userAgent?.slice(0,100)||'unknown',ts:new Date().toISOString()});
    messaging.onMessage(payload=>{
      const n=payload.notification||{};
      const title=n.title||'Axiom';
      const body=n.body||'Hai una nuova notifica';
      if(Notification.permission==='granted'&&document.visibilityState==='visible'){
        try{new Notification(title,{body,icon:'./assets/icons/icon-192.png'});}catch(e){}
      }
    });
    // Refresh token on change
    messaging.onTokenRefresh(async()=>{
      try{
        const newToken=await messaging.getToken({vapidKey});
        if(newToken&&newToken!==fcmToken){
          fcmToken=newToken;
          await db.ref(`users/${UID}/fcmTokens/${newToken.replace(/[:.]/g,'_')}`).set({token:newToken,device:navigator.userAgent?.slice(0,100)||'unknown',ts:new Date().toISOString()});
        }
      }catch(e){}
    });
  }catch(e){console.warn('FCM init:',e.message);}
}
/* â”€â”€â”€ NOTIFICATION SETTINGS â”€â”€â”€ */
function initNotifSettings(){
  const t=document.getElementById('notif-toggle');
  const s=document.getElementById('notif-status');
  if(!t||!s)return;
  const saved=localStorage.getItem('kz_notif_enabled');
  t.checked=saved==='true';
  if(Notification.permission==='granted'){
    s.textContent='âœ… Notifiche attive sul dispositivo';
    s.style.color='var(--gr)';
  } else if(Notification.permission==='denied'){
    s.textContent='â›” Permesso notifiche negato â€” abilita dalle impostazioni del browser';
    s.style.color='var(--re)';
  } else {
    s.textContent='âš ï¸ Richiedi il permesso per ricevere notifiche';
    s.style.color='var(--ye)';
  }
}
async function toggleDeviceNotif(enabled){
  localStorage.setItem('kz_notif_enabled',enabled?'true':'false');
  ['notif-status','notif-push-status'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    if(enabled){
      if(Notification.permission==='granted'){
        el.textContent='âœ… Notifiche attive sul dispositivo';
        el.style.color='var(--gr)';
      } else if(Notification.permission==='denied'){
        el.textContent='â›” Permesso negato';
        el.style.color='var(--re)';
      } else {
        el.textContent='âš ï¸ Richiedi permesso';
        el.style.color='var(--ye)';
      }
    } else {
      el.textContent='ðŸ”• Notifiche disattivate';
      el.style.color='var(--tx3)';
    }
  });
  // Sync both toggles
  ['notif-toggle','notif-push-toggle'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=enabled;});
  if(enabled){
    if(Notification.permission==='default'){
      const perm=await Notification.requestPermission();
      if(perm==='granted'){
        initFCM();
        toast('Notifiche attivate','ok');
        ['notif-status','notif-push-status'].forEach(id=>{
          const el=document.getElementById(id);
          if(el){el.textContent='âœ… Notifiche attive sul dispositivo';el.style.color='var(--gr)';}
        });
      } else {
        ['notif-status','notif-push-status'].forEach(id=>{
          const el=document.getElementById(id);
          if(el){el.textContent='âš ï¸ Permesso negato';el.style.color='var(--re)';}
        });
        ['notif-toggle','notif-push-toggle'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});
        localStorage.setItem('kz_notif_enabled','false');
      }
    } else if(Notification.permission==='granted'){
      initFCM();
      toast('Notifiche giÃ  attive','ok');
    } else {
      ['notif-status','notif-push-status'].forEach(id=>{
        const el=document.getElementById(id);
        if(el){el.textContent='â›” Permesso negato permanentemente';el.style.color='var(--re)';}
      });
      ['notif-toggle','notif-push-toggle'].forEach(id=>{const el=document.getElementById(id);if(el)el.checked=false;});
      localStorage.setItem('kz_notif_enabled','false');
    }
  } else {
    toast('Notifiche disattivate','warn');
  }
}
async function sendTestNotif(){
  if(!UID){toast('Effettua il login','err');return;}
  var btn=document.getElementById('btn-test-notif');
  if(!btn||!btn.offsetParent)btn=document.getElementById('btn-test-notif-2');
  if(btn)btn.disabled=true;
  try{
    const body='ðŸ• Questa Ã¨ una notifica di test inviata da Axiom. Se vedi questo messaggio, le notifiche funzionano correttamente!';
    await db.ref(`users/${UID}/notifications`).push({
      title:'âœ… Notifica di test',
      body,
      type:'system',
      ts:new Date().toISOString(),
      read:false
    });
    toast('Notifica di test inviata!','ok');
  }catch(e){
    toast('Errore invio notifica','err');
    console.warn(e);
  }
  if(btn)setTimeout(()=>btn.disabled=false,2000);
}
/* â”€â”€â”€ AUTH â”€â”€â”€ */
auth.getRedirectResult().then(result=>{
  if(result && result.user) console.log('Google login ok:', result.user.email);
}).catch(e=>{
  if(e.code && e.code!=='auth/no-auth-event'){
    const err=document.getElementById('login-err');
    if(err){ err.textContent=ferr(e.code); err.style.display='block'; }
  }
});
auth.onAuthStateChanged(async u=>{
  if(u && !u.isAnonymous){
    UID=u.uid;
    try{ await loadProfile(u); }catch(e){ console.warn('Profile err:',e.message); }
    showApp();
    subscribeData();
    subscribeNotifs();
    setTimeout(initFCM,2000);
  } else {
    showAuth();
  }
});

function showAuth(){
  document.getElementById('auth').style.display='flex';
  document.getElementById('app').style.display='none';
  const bl=document.getElementById('boot-loader');if(bl)bl.style.display='none';
}

function showApp(){
  document.getElementById('auth').style.display='none';
  document.getElementById('app').style.display='block';
  const bl=document.getElementById('boot-loader');if(bl)bl.style.display='none';
  applyTheme(theme);
  setMode(mode);
  const sc=document.getElementById('set-cur'); if(sc)sc.value=defaultCur;
  const sc2=document.getElementById('set-cur2'); if(sc2)sc2.value=defaultCur;
  const sf=document.getElementById('set-forecast'); if(sf)sf.value=forecastDays;
  updateNotifBadge();
  showAdminNav();
  loadAdminData();
  initSyncIndicator();
  setTimeout(initPullToRefresh,500);
  setTimeout(initEdgeSwipe,500);
  setTimeout(initNavShadow,500);
  setTimeout(initSidebarCollapse,500);
  setTimeout(()=>{renderFavs();updateFavStars();},550);
  setTimeout(initKeyboardHide,200);
  setTimeout(()=>{ try{fetchRates();}catch(e){} }, 1000);
  /* BUG-07 FIX: inizializza banner cookie GDPR */
  initCookies();
  checkBackupReminder();
  /* Notifica di test automatica dopo 1 minuto */
  if(localStorage.getItem('kz_notif_enabled')==='true'&&Notification.permission==='granted'){
    setTimeout(async()=>{
      try{
        const snap=await db.ref(`users/${UID}/notifications`).limitToLast(1).once('value');
        const last=snap.val()?Object.values(snap.val())[0]:null;
        if(!last||!last.title?.includes('âœ… Notifica di test')){
          await db.ref(`users/${UID}/notifications`).push({
            title:'âœ… Notifica di test automatica',
            body:'ðŸ• Le notifiche sono attive! Questo messaggio Ã¨ stato inviato 1 minuto dopo l\'avvio.',
            type:'system',
            ts:new Date().toISOString(),
            read:false
          });
        }
      }catch(e){console.warn('Test notif auto:',e.message);}
    },60000);
  }
}

async function loadProfile(u){
  const snap=await db.ref(`users/${u.uid}/profile`).once('value');
  UP=snap.val();
  if(!UP){
    const eml=u.email||'';UP={uid:u.uid,email:eml,name:u.displayName||eml.split('@')[0]||'Utente',plan:'free',role:'user',createdAt:new Date().toISOString()};
    await db.ref(`users/${u.uid}/profile`).set(UP);
  }
  const sn=document.getElementById('side-name'); if(sn)sn.textContent=UP.name||'';
  const se=document.getElementById('side-email'); if(se)se.textContent=UP.email||'';
  const h=new Date().getHours();
  const g=h<12?'Buongiorno':h<18?'Buon pomeriggio':'Buonasera';
  const dg=document.getElementById('dash-greet'); if(dg)dg.textContent=`${g}, ${(UP.name||'').split(' ')[0]}! ðŸ‘‹`;
  const dd=document.getElementById('dash-date'); if(dd)dd.textContent=new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const pn=document.getElementById('prof-name'); if(pn)pn.value=UP.name||'';
  const pe=document.getElementById('prof-email'); if(pe)pe.value=UP.email||'';
  const pp=document.getElementById('prof-paypal'); if(pp)pp.value=UP.paypal||'';
  // Update lastLogin for inactivity tracking
  if(UID)db.ref(`users/${UID}/profile/lastLogin`).set(new Date().toISOString()).catch(()=>{});
}

let _rd=null;
function scheduleRender(){
  if(_rd)clearTimeout(_rd);
  _rd=setTimeout(()=>{
    _rd=null;
    const v=document.querySelector('.view.active');
    if(!v)return;
    const n=v.id.replace('view-','');
    try{updateDashWidgets();populateSels();checkNotifAlerts();checkReminders();}catch(e){}
    if(n==='dashboard'){try{renderDashboard();}catch(e){}try{renderCalendar();}catch(e){}}
    else if(n==='transactions'){try{renderTransactions();}catch(e){}}
    else if(n==='accounts'){try{renderAccounts();}catch(e){}}
    else if(n==='budget'){try{renderBudget();}catch(e){}}
    else if(n==='goals'){try{renderGoals();}catch(e){}}
    else if(n==='recurring'){try{renderRecurring();}catch(e){}}
    else if(n==='debts'){try{renderDebts();}catch(e){}}
    else if(n==='score'){try{renderScore();}catch(e){}}
    else if(n==='calendar'){try{renderCalendar();}catch(e){}}
    else if(n==='reports'){try{renderReports();}catch(e){}}
    else if(n==='monthly'){try{renderMonthly();}catch(e){}}
    else if(n==='primanota'){try{renderPrimaNota();}catch(e){}}
    else if(n==='transfer'){try{renderTransfers();}catch(e){}}
    else if(n==='invoices'){try{renderInvoices();}catch(e){}}
    else if(n==='travel'){try{renderTravel();}catch(e){}}
    else if(n==='quotes'){try{renderQuotes();}catch(e){}}
    else if(n==='suppliers'){try{renderSuppliers();}catch(e){}}
    else if(n==='projects'){try{renderProjects();}catch(e){}}
    else if(n==='freemoney'){try{calcFreeMoney();}catch(e){}}
    else if(n==='portfolio'){try{renderPortfolio();}catch(e){}}
    else if(n==='insurance'){try{renderInsurance();}catch(e){}}
    else if(n==='notifications'){try{renderNotifications();}catch(e){}}
    try{renderCategories();}catch(e){}
    try{renderDebtStrategy();}catch(e){}
    try{renderSharedGoals();}catch(e){}
    try{renderGroups();}catch(e){}
  },120);
}

function subscribeData(){
  const paths=['transactions','accounts','goals','recurring','invoices','travel','transfers','debts','quotes','suppliers'];
  paths.forEach(p=>{
    db.ref(`users/${UID}/${p}`).on('value',snap=>{
      const raw=snap.val()||{};
      S[p]=Object.entries(raw).map(([id,v])=>({id,...v}));
      if(p==='transactions')S[p].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
      _dataReady[p]=true;
      scheduleRender();
    });
  });
  db.ref(`users/${UID}/budgets`).on('value',snap=>{S.budgets=snap.val()||{};scheduleRender();});
  const groupListeners={};
  db.ref(`users/${UID}/groups`).on('value',snap=>{
    const gids=snap.val()?Object.keys(snap.val()):[];
    // Detach listeners for removed groups
    Object.keys(groupListeners).forEach(gid=>{if(!gids.includes(gid)){groupListeners[gid]();delete groupListeners[gid];delete S.groups[gid];}});
    if(!gids.length){scheduleRender();return;}
    let loaded=0;
    gids.forEach(gid=>{
      if(!groupListeners[gid]){
        groupListeners[gid]=db.ref(`groups/${gid}`).on('value',s=>{const g=s.val();if(g){S.groups[gid]=g;}else{delete S.groups[gid];}scheduleRender();});
      }
      loaded++;if(loaded===gids.length&&!S.groups)scheduleRender();
    });
  });
  db.ref(`users/${UID}/projects`).on('value',snap=>{
    const raw=snap.val()||{};
    S.projects=Object.entries(raw).map(([id,v])=>({id,...v}));
    scheduleRender();
  });
  db.ref(`users/${UID}/categories`).on('value',snap=>{const raw=snap.val()||{};S.categories=Object.entries(raw).map(([id,v])=>({id,...v}));scheduleRender();});
  db.ref(`users/${UID}/invoiceTemplates`).on('value',snap=>{const raw=snap.val()||{};S.invoiceTemplates=Object.entries(raw).map(([id,v])=>({id,...v}));});
  const sgListeners={};
  db.ref(`users/${UID}/sharedGoals`).on('value',snap=>{
    const raw=snap.val()||{};
    const gids=Object.keys(raw);
    // Detach listeners for removed shared goals
    Object.keys(sgListeners).forEach(gid=>{if(!gids.includes(gid)){sgListeners[gid]();delete sgListeners[gid];delete S.sharedGoals[gid];}});
    if(!gids.length){scheduleRender();return;}
    gids.forEach(gid=>{
      if(!sgListeners[gid]){
        sgListeners[gid]=db.ref(`sharedGoals/${gid}`).on('value',s=>{const g=s.val();if(g)S.sharedGoals[gid]=g;else delete S.sharedGoals[gid];scheduleRender();});
      }
    });
  });
  ['portfolio','insurance'].forEach(p=>{
    db.ref(`users/${UID}/${p}`).on('value',snap=>{
      const raw=snap.val();
      S[p]=Array.isArray(raw)?raw:(raw?Object.values(raw):[]);
      scheduleRender();
    });
  });
}

/* â”€â”€â”€ AUTH FUNCTIONS â”€â”€â”€ */
function switchTab(t){
  document.querySelectorAll('.auth-tab').forEach((tb,i)=>tb.classList.toggle('active',['login','register','reset'][i]===t));
  document.querySelectorAll('.auth-panel').forEach(p=>{p.style.animation='none';p.classList.remove('active');void p.offsetHeight;});
  const next=document.getElementById('panel-'+t);
  if(next){next.style.animation='';next.classList.add('active');}
}
function authRipple(e){
  const btn=e.currentTarget;
  const rect=btn.getBoundingClientRect();
  const r=Math.max(rect.width,rect.height);
  const span=document.createElement('span');
  span.className='ripple';
  span.style.width=span.style.height=r+'px';
  span.style.left=(e.clientX||e.touches?.[0]?.clientX||rect.left+rect.width/2)-rect.left-r/2+'px';
  span.style.top=(e.clientY||e.touches?.[0]?.clientY||rect.top+rect.height/2)-rect.top-r/2+'px';
  btn.appendChild(span);
  setTimeout(()=>span.remove(),600);
}


async function doLogin(){
  const email=document.getElementById('l-email').value.trim();
  const pass=document.getElementById('l-pass').value;
  const err=document.getElementById('login-err');
  const btn=document.getElementById('btn-login');
  err.style.display='none';
  if(!email||!pass){showErr(err,'Compila tutti i campi');return;}
  btn.innerHTML='<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px"></span> Accesso...';btn.disabled=true;
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    // onAuthStateChanged gestirÃ  il resto
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
  if(!document.getElementById('r-gdpr')?.checked){showErr(err,'Devi accettare Termini e Privacy Policy');return;}
  if(!name||!email||!pass){showErr(err,'Compila tutti i campi');return;}
  btn.innerHTML='<span style="display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px"></span> Creazione...';btn.disabled=true;
  try{
    const c=await auth.createUserWithEmailAndPassword(email,pass);
    await c.user.updateProfile({displayName:name});
  }catch(e){
    showErr(err,ferr(e.code));
    btn.textContent='Crea account';btn.disabled=false;
  }
}

async function doGoogle(){
  const p=new firebase.auth.GoogleAuthProvider();
  p.setCustomParameters({prompt:'select_account'});
  const errEl=document.getElementById('login-err');
  if(errEl) errEl.style.display='none';
  const btn=document.querySelector('.auth-google');
  if(btn){btn.disabled=true;btn.textContent='Apertura Googleâ€¦';}
  try{
    await auth.signInWithPopup(p);
  } catch(e){
    if(btn){btn.disabled=false;btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continua con Google';}
    if(e.code!=='auth/cancelled-popup-request'&&e.code!=='auth/popup-closed-by-user'){
      if(errEl){errEl.textContent=ferr(e.code);errEl.style.display='block';}
    }
  }
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
  // Detach all realtime listeners before logout to prevent permission errors
  try{
    const paths=['transactions','accounts','goals','recurring','invoices','travel','transfers','debts','quotes','suppliers','budgets','groups','projects','categories','invoiceTemplates','portfolio','insurance'];
    paths.forEach(p=>{try{db.ref(`users/${UID}/${p}`).off();}catch(e){}});
    try{db.ref(`users/${UID}/sharedGoals`).off();}catch(e){}
    try{db.ref(`users/${UID}/notifications`).off();}catch(e){}
    try{db.ref('.info/connected').off();}catch(e){}
    if(notifOff){notifOff();notifOff=null;}
    if(chatOff){chatOff();chatOff=null;}
  }catch(e){}
  await auth.signOut();
  showAuth();
}

/* â”€â”€â”€ NAV â”€â”€â”€ */
const viewStack=[];
function showView(n,{noTab,noPush}={}){
  const prev=document.querySelector('.view.active')?.id?.replace('view-','');
  if(prev===n)return;
  if(!noPush&&prev)viewStack.push(prev);
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+n)?.classList.add('active');
  document.getElementById('nav-'+n)?.classList.add('active');
  if(!noTab&&window.innerWidth<=768){
    document.querySelectorAll('.bt-item').forEach(t=>t.classList.remove('active'));
    const tab=document.querySelector(`.bt-item[data-view="${n}"]`);
    if(tab)tab.classList.add('active');
  }
  document.getElementById('fab-menu')?.classList.remove('show');fabOpen=false;
  document.getElementById('search-overlay')?.classList.remove('open');
  if(window.innerWidth<=768){document.getElementById('sidebar').classList.remove('open');document.getElementById('s-ov').style.display='none';}
  window.scrollTo(0,0);
  if(n==='accounts'){try{renderAccounts();}catch(e){}}
  if(n==='reports')setTimeout(renderRepCharts,100);
  if(n==='transfer')populateTransferSels();
  if(n==='portfolio'){try{renderPortfolio();}catch(e){}}
  if(n==='networth'){try{renderNetWorth();}catch(e){}}
  if(n==='cashflow'){try{renderCashflow();}catch(e){}}
  if(n==='pension'){setTimeout(()=>{try{calcPension();}catch(e){}},50);}
  if(n==='insurance'){try{renderInsurance();}catch(e){}}
  if(n==='referral'){setTimeout(()=>{try{initReferral();}catch(e){}},100);}
  if(n==='notifications')renderNotifications();
  if(n==='taxcalc')setTimeout(calcTax,50);
  if(n==='admin'){setTimeout(()=>{try{renderAdmin();}catch(e){}},50);}
  if(n==='categories'){setTimeout(()=>{try{renderCategories();}catch(e){}},50);}
  if(n==='profile'){setTimeout(()=>{try{renderProfilePlan();}catch(e){}},50);}
  if(n==='settings'){setTimeout(()=>{try{initNotifSettings();}catch(e){}},50);}
  if(n==='debtstrategy'){setTimeout(()=>{try{renderDebtStrategy();}catch(e){}},50);}
  if(n==='sharedgoals'){setTimeout(()=>{try{renderSharedGoals();}catch(e){}},50);}
}
function goBack(){
  if(viewStack.length){
    const prev=viewStack.pop();
    showView(prev,{noPush:true});
    haptic('light');
  }else if(window.innerWidth<=768){
    showView('dashboard',{noPush:true});
  }
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

let themeAuto=false,themeMedia;
function applyTheme(t,{noMedia}={}){
  theme=t;
  if(t==='auto'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';themeAuto=true;}else{themeAuto=false;}
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem('kz_theme',themeAuto?'auto':t);
  const btn=document.getElementById('theme-btn');
  if(btn)btn.textContent=themeAuto?'ðŸ”®':(t==='dark'?'ðŸŒ™':'â˜€ï¸');
  if(!noMedia&&themeAuto&&!themeMedia){
    themeMedia=window.matchMedia('(prefers-color-scheme:dark)');
    themeMedia.addEventListener('change',e=>applyTheme('auto',{noMedia:true}));
  }
}
function toggleTheme(){
  const modes=['dark','light','auto'];
  const cur=themeAuto?'auto':theme;
  const idx=modes.indexOf(cur);
  applyTheme(modes[(idx+1)%modes.length]);
}
/* â”€â”€â”€ SIDEBAR COLLAPSE â”€â”€â”€ */
function togG(h){
  h.classList.toggle('coll');
  const g=h.nextElementSibling;
  if(!g||!g.classList.contains('sgp'))return;
  if(h.classList.contains('coll')){
    g.style.maxHeight='0';
  }else{
    g.style.maxHeight=g.scrollHeight+'px';
  }
}
/* â”€â”€â”€ FAVORITES â”€â”€â”€ */
function getFavs(){try{return JSON.parse(localStorage.getItem('kz_favs')||'[]');}catch(e){return [];}}
function setFavs(v){localStorage.setItem('kz_favs',JSON.stringify(v));}
function toggleFav(n){
  let f=getFavs();const i=f.indexOf(n);
  if(i>-1)f.splice(i,1);else f.push(n);
  setFavs(f);renderFavs();updateFavStars();
}
function isFav(n){return getFavs().indexOf(n)>-1;}
function updateFavStars(){
  const f=getFavs();
  document.querySelectorAll('.ni').forEach(el=>{
    const id=el.id?.replace('nav-','');
    if(!id)return;
    const star=el.querySelector('.nfav');
    if(!star)return;
    const isFav=f.indexOf(id)>-1;
    star.textContent=isFav?'â˜…':'â˜†';
    el.classList.toggle('nfav-on',isFav);
  });
}
function renderFavs(){
  const c=document.getElementById('fav-list');
  if(!c)return;
  const f=getFavs();
  if(!f.length){c.innerHTML='<div class="fav-empty-msg">Nessun preferito.<br>â­ clicca la stella accanto a una voce</div>';return;}
  c.innerHTML=f.map(n=>{
    const nav=document.getElementById('nav-'+n);
    if(!nav)return '';
    const label=nav.textContent.replace('â˜†','').replace('â˜…','').trim();
    return `<div class="ni" onclick="showView('${n}')">${label}<span class="nfav nfav-on" onclick="event.stopPropagation();toggleFav('${n}')">â˜…</span></div>`;
  }).join('');
}
function initSidebarCollapse(){
  const active=document.querySelector('.ni.active');
  document.querySelectorAll('.ss').forEach(h=>{
    const g=h.nextElementSibling;
    if(!g||!g.classList.contains('sgp'))return;
    if(h.textContent.trim().startsWith('â­ Preferiti'))return;
    const hasActive=g.contains(active);
    if(!hasActive){
      h.classList.add('coll');
      g.style.maxHeight='0';
    }else{
      g.style.maxHeight=g.scrollHeight+'px';
    }
  });
}
/* â”€â”€â”€ HAPTIC FEEDBACK â”€â”€â”€ */
function haptic(type='light'){
  try{if(window.Capacitor?.Plugins?.Haptics){Capacitor.Plugins.Haptics.impact({style:type});return;}}catch(e){}
  if(navigator.vibrate){const p={light:[10],medium:[20],heavy:[30,10,30]};navigator.vibrate(p[type]||p.light);}
}
/* â”€â”€â”€ EDGE SWIPE TO OPEN / CLOSE SIDEBAR + BACK NAV â”€â”€â”€ */
let edgeStartX=0,edgeStartY=0,swipeTs=0;
function initEdgeSwipe(){
  if(window.innerWidth>768)return;
  document.addEventListener('touchstart',e=>{
    edgeStartX=e.touches[0].clientX;edgeStartY=e.touches[0].clientY;swipeTs=Date.now();
  },{passive:true});
  document.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-edgeStartX;
    const dy=e.changedTouches[0].clientY-edgeStartY;
    const dt=Date.now()-swipeTs;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>50&&dt<400){
      if(dx>0&&edgeStartX<30){toggleSidebar();haptic('medium');}
      else if(dx>0&&edgeStartX>60&&viewStack.length){goBack();haptic('light');}
      else if(dx<0&&document.getElementById('sidebar')?.classList.contains('open')){toggleSidebar();}
    }
  },{passive:true});
}
/* â”€â”€â”€ KEYBOARD-AWARE FIXED ELEMENTS â”€â”€â”€ */
function initKeyboardHide(){
  if(!window.visualViewport)return;
  let prevH=window.innerHeight;
  window.visualViewport.addEventListener('resize',()=>{
    const vv=window.visualViewport;
    const diff=prevH-vv.height;
    const kbOpen=diff>80;
    const tab=document.getElementById('bottom-tab');
    const fab=document.querySelector('.fab');
    if(tab)tab.style.display=kbOpen?'none':(window.innerWidth<=768?'flex':'none');
    if(fab)fab.style.display=kbOpen?'none':(window.innerWidth<=768?'flex':'flex');
    prevH=vv.height;
  });
}
/* â”€â”€â”€ NAV SCROLL SHADOW â”€â”€â”€ */
function initNavShadow(){
  const nav=document.getElementById('nav');
  if(!nav)return;
  const mc=document.getElementById('mc');
  if(!mc)return;
  mc.addEventListener('scroll',()=>{
    nav.style.boxShadow=mc.scrollTop>4?'0 2px 12px rgba(0,0,0,.25)':'0 1px 0 var(--b1)';
  },{passive:true});
}
/* â”€â”€â”€ MOBILE SEARCH TOGGLE â”€â”€â”€ */
function toggleSearch(){
  const ov=document.getElementById('search-overlay');
  if(!ov)return;
  ov.classList.toggle('open');
  if(ov.classList.contains('open')){
    setTimeout(()=>document.getElementById('mobile-search-input')?.focus(),150);
  } else {
    document.getElementById('mobile-search-input').value='';
    filterTx();
  }
}
/* â”€â”€â”€ GLOBAL SEARCH â”€â”€â”€ */
function toggleGlobalSearch(show){
  const el=document.getElementById('global-search');
  if(!el)return;
  if(show===undefined)show=el.style.display!=='flex';
  el.style.display=show?'flex':'none';
  if(show){setTimeout(()=>document.getElementById('glob-srch')?.focus(),100);document.getElementById('glob-results').innerHTML='';}
}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();toggleGlobalSearch();}
  if(e.key==='Escape'){const gs=document.getElementById('global-search');if(gs?.style.display==='flex')toggleGlobalSearch(false);}
});
function globalSearch(q){
  const r=document.getElementById('glob-results');
  if(!r)return;
  if(!q||q.length<2){r.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--tx3);font-size:.85rem">Digita almeno 2 caratteri</div>';return;}
  const l=q.toLowerCase();
  const tx=S.transactions.filter(t=>(t.description||'').toLowerCase().includes(l)||(t.category||'').toLowerCase().includes(l)||(t.note||'').toLowerCase().includes(l)).slice(0,8);
  const ac=S.accounts.filter(a=>(a.name||'').toLowerCase().includes(l)).slice(0,5);
  const ct=Object.keys(allCats()).filter(c=>c.toLowerCase().includes(l)).slice(0,5);
  const pr=(S.projects||[]).filter(p=>(p.name||'').toLowerCase().includes(l)).slice(0,5);
  let html='';
  if(tx.length){html+=`<div style="padding:.65rem 1rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);border-top:1px solid var(--b1)">Transazioni (${tx.length})</div>`;tx.forEach(t=>{html+=`<div class="glob-r" onclick="toggleGlobalSearch(false);showView('transactions')">${CI[t.category]||'ðŸ“¦'} ${esc(t.description||'â€”')} <span style="color:${t.type==='income'?'var(--gr)':'var(--re)'};font-weight:600">${t.type==='income'?'+':'-'}${fmt(t.amount)}</span></div>`;});}
  if(ac.length){html+=`<div style="padding:.65rem 1rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);border-top:1px solid var(--b1)">Conti (${ac.length})</div>`;ac.forEach(a=>{html+=`<div class="glob-r" onclick="toggleGlobalSearch(false);showView('accounts')">ðŸ¦ ${esc(a.name)} â€” ${fmt(a.balance)}</div>`;});}
  if(ct.length){html+=`<div style="padding:.65rem 1rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);border-top:1px solid var(--b1)">Categorie (${ct.length})</div>`;ct.forEach(c=>{html+=`<div class="glob-r" onclick="toggleGlobalSearch(false);showView('categories')">${getCatIcon(c)} ${cap(c)}</div>`;});}
  if(pr.length){html+=`<div style="padding:.65rem 1rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);border-top:1px solid var(--b1)">Progetti (${pr.length})</div>`;pr.forEach(p=>{html+=`<div class="glob-r" onclick="toggleGlobalSearch(false);showView('projects')">ðŸ“ ${esc(p.name)}</div>`;});}
  if(!html)html='<div style="padding:1.5rem;text-align:center;color:var(--tx3);font-size:.85rem">Nessun risultato</div>';
  r.innerHTML=html;
}
/* â”€â”€â”€ BOTTOM TAB BAR â”€â”€â”€ */
function switchTabView(n){
  if(n==='more'){haptic('light');toggleSidebar();return;}
  haptic('light');
  const tab=document.querySelector(`.bt-item[data-view="${n}"]`);
  if(tab)tab.classList.add('active');
  showView(n);
}
/* â”€â”€â”€ PULL-TO-REFRESH â”€â”€â”€ */
let ptrState=0;let ptrStartY=0;
function initPullToRefresh(){
  const mc=document.getElementById('mc');
  if(!mc||window.innerWidth>768)return;
  let ind=document.getElementById('ptr-indicator');
  if(!ind){ind=document.createElement('div');ind.id='ptr-indicator';ind.innerHTML='<span class="ptr-spinner"></span><span class="ptr-text">Trascina per aggiornare</span>';mc.parentElement.insertBefore(ind,mc);}
  mc.addEventListener('touchstart',e=>{
    if(mc.scrollTop>0||ptrState)return;
    ptrStartY=e.touches[0].clientY;
    ptrState=1;
  },{passive:true});
  mc.addEventListener('touchmove',e=>{
    if(ptrState!==1)return;
    const dy=e.touches[0].clientY-ptrStartY;
    if(dy>0){ind.style.transform=`translateY(${Math.min(dy*0.4,60)}px)`;ind.classList.toggle('pulling',dy>30);}
  },{passive:true});
  mc.addEventListener('touchend',()=>{
    if(ptrState!==1)return;
    const pulled=ind.classList.contains('pulling');
    ind.style.transform='';
    ind.classList.remove('pulling');
    if(pulled){
      ptrState=2;ind.classList.add('refreshing');
      setTimeout(()=>{scheduleRender();setTimeout(()=>{ind.classList.remove('refreshing');ptrState=0;},500);},100);
    }else{ptrState=0;}
  },{passive:true});
}
/* â”€â”€â”€ SWIPE ON ROWS â”€â”€â”€ */
function enableSwipe(el,onSwipeLeft,onSwipeRight){
  let sx=0,dx=0,swiping=false;
  el.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;dx=0;swiping=false;},{passive:true});
  el.addEventListener('touchmove',e=>{
    dx=e.touches[0].clientX-sx;
    if(Math.abs(dx)>10)swiping=true;
    if(swiping&&onSwipeLeft&&dx<0)el.style.transform=`translateX(${Math.max(dx,-80)}px)`;
    if(swiping&&onSwipeRight&&dx>0)el.style.transform=`translateX(${Math.min(dx,80)}px)`;
  },{passive:true});
  el.addEventListener('touchend',()=>{
    if(!swiping)return;
    if(dx<-60&&onSwipeLeft)onSwipeLeft(el);
    else if(dx>60&&onSwipeRight)onSwipeRight(el);
    el.style.transition='transform .2s';el.style.transform='';setTimeout(()=>el.style.transition='',250);
  },{passive:true});
}
function wrapSwipeRow(html,id,onEdit,onDelete){
  return`<div class="swipe-wrap"><div class="swipe-content">${html}</div><div class="swipe-actions"><button style="background:var(--gr)" onclick="${onEdit}">âœï¸</button><button style="background:var(--re)" onclick="${onDelete}">ðŸ—‘</button></div></div>`;
}

/* â”€â”€â”€ DASHBOARD â”€â”€â”€ */
function renderDashboard(){
  const skel=document.getElementById('dash-skeleton');
  if(skel){skel.style.display='none';}
  const dw=document.getElementById('dash-widgets');
  if(dw)dw.style.display='grid';
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0);
  const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const tot=S.accounts.reduce((s,a)=>s+N(a.balance),0);
  const el=document.getElementById('dash-stats');
  if(el)el.innerHTML=`
    <div class="sc e-fade e-d1"><div class="sl">Saldo totale</div><div class="sv">${fmt(tot)}</div></div>
    <div class="sc e-fade e-d2"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div><div style="font-size:.75rem;color:var(--tx3)">questo mese</div></div>
    <div class="sc e-fade e-d3"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div><div style="font-size:.75rem;color:var(--tx3)">questo mese</div></div>
    <div class="sc e-fade e-d4"><div class="sl">Risparmio</div><div class="sv" style="color:${inc-exp>=0?'var(--gr)':'var(--re)'}">${fmt(inc-exp)}</div></div>`;
  const da=document.getElementById('dash-acc');
  if(da)da.innerHTML=S.accounts.length
    ?S.accounts.map((a,i)=>`<div class="e-fade e-d${Math.min(i+1,5)}" style="display:flex;align-items:center;justify-content:space-between;padding:.65rem .875rem;background:var(--bg3);border-radius:var(--rs);margin-bottom:.5rem;transition:transform .2s;cursor:pointer" onmouseenter="this.style.transform='translateX(4px)'" onmouseleave="this.style.transform=''"><div style="display:flex;align-items:center;gap:.5rem"><div style="width:26px;height:26px;border-radius:8px;background:${a.color||'var(--ac)'}22;display:flex;align-items:center;justify-content:center">${AI_IC[a.type]||'ðŸ¦'}</div><span style="font-size:.875rem">${a.name}</span></div><span style="font-weight:700;color:${N(a.balance)>=0?'var(--gr)':'var(--re)'}">${fmt(a.balance)}</span></div>`).join('')
    :'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Aggiungi un conto</div>';
  const dr=document.getElementById('dash-recent');
  if(dr)dr.innerHTML=S.transactions.slice(0,6).map(t=>`<div style="display:flex;align-items:center;gap:.75rem;padding:.6rem;border-radius:var(--rs);margin-bottom:.3rem"><div style="width:34px;height:34px;border-radius:10px;background:${t.type==='income'?'rgba(52,211,153,.15)':'rgba(238,68,68,.12)'};display:flex;align-items:center;justify-content:center;font-size:.9rem;flex-shrink:0">${CI[t.category]||'ðŸ“¦'}</div><div style="flex:1;min-width:0"><div style="font-size:.875rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.description||'â€”')}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)}</div></div><div style="font-weight:700;font-size:.875rem;color:${t.type==='income'?'var(--gr)':'var(--re)'}">${t.type==='income'?'+':'-'}${fmt(t.amount)}</div></div>`).join('')||'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Nessuna transazione</div>';
  renderDashCharts();
}

function renderDashCharts(){
  const labs=[],inc=[],exp=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const m=d.toISOString().slice(0,7);labs.push(d.toLocaleDateString('it-IT',{month:'short'}));const txM=S.transactions.filter(t=>t.date?.startsWith(m));inc.push(txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0));exp.push(txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0));}
  const o={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'var(--tx2)',font:{size:11}}}},scales:{x:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}}}};
  mkChart('ch-trend','bar',{labels:labs,datasets:[{label:'Entrate',data:inc,backgroundColor:'rgba(52,211,153,.7)',borderRadius:4},{label:'Uscite',data:exp,backgroundColor:'rgba(238,68,68,.7)',borderRadius:4}]},o);
  const cm2={};S.transactions.filter(t=>t.type==='expense').forEach(t=>{cm2[t.category]=(cm2[t.category]||0)+N(t.amount);});const cats=Object.keys(cm2);
  if(cats.length)mkChart('ch-cat','doughnut',{labels:cats.map(c=>CI[c]+' '+cap(c)),datasets:[{data:cats.map(c=>cm2[c]),backgroundColor:CC.slice(0,cats.length),borderWidth:0}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'var(--tx2)',font:{size:10},boxWidth:10}}}});
}

/* â”€â”€â”€ TRANSACTIONS â”€â”€â”€ */
let txPage=1,txPageSize=50;
let selectedTx=new Set();
function renderTransactions(){
  const skel=document.getElementById('tx-skeleton'),tw=document.querySelector('#view-transactions .tw');
  if(skel)skel.style.display='none';
  if(tw)tw.style.display='';
  const q=(document.getElementById('search-input')||{}).value?.toLowerCase()||(document.getElementById('mobile-search-input')||{}).value?.toLowerCase()||'';
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
  if(!tx.length){tbody.innerHTML='';if(empty)empty.style.display='block';if(tw)tw.style.display='none';return;}
  if(empty)empty.style.display='none';
  const aN=id=>S.accounts.find(a=>a.id===id)?.name||'â€”';
  const total=tx.length;
  const page=Math.min(txPage,Math.ceil(total/txPageSize)||1);
  const start=0,end=Math.min(page*txPageSize,total);
  const pageTx=tx.slice(start,end);
  const allSel=pageTx.every(t=>selectedTx.has(t.id));
  tbody.innerHTML=pageTx.map(t=>`<tr class="${selectedTx.has(t.id)?'tx-sel':''}">
    <td style="width:32px"><input type="checkbox" ${selectedTx.has(t.id)?'checked':''} onchange="toggleSelectTx('${t.id}')" style="accent-color:var(--ac);width:16px;height:16px;cursor:pointer"></td>
    <td style="font-size:.82rem">${fd(t.date)}</td>
    <td class="tdm">${CI[t.category]||'ðŸ“¦'} ${esc(t.description||'â€”')}${t.note?`<div style="font-size:.72rem;color:var(--tx3)">${esc(t.note)}</div>`:''}</td>
    <td><span class="badge bg-gy">${cap(t.category||'altro')}</span></td>
    <td style="font-size:.82rem">${aN(t.account)}</td>
    <td style="font-weight:700;color:${t.type==='income'?'var(--gr)':'var(--re)'}">${t.type==='income'?'+':'-'}${CS[t.currency]||'â‚¬'}${N(t.amount).toFixed(2)}</td>
    <td><div style="display:flex;gap:.25rem">
      <button class="btn bi bs bsm" onclick="editTx('${t.id}')">âœï¸</button>
      <button class="btn bi bd bsm" onclick="deleteTx('${t.id}')">ðŸ—‘</button>
    </div></td>
  </tr>`).join('');
  if(end<total){
    tbody.innerHTML+=`<tr><td colspan="7" style="text-align:center;padding:.75rem"><button class="btn bs bsm" onclick="txPage++;renderTransactions();" style="width:100%;justify-content:center">â¬‡ï¸ Carica altro (${total-end} rimanenti)</button></td></tr>`;
  }
  updateMdelBtn();
}
function toggleSelectTx(id){
  if(selectedTx.has(id))selectedTx.delete(id);else selectedTx.add(id);
  renderTransactions();
}
function selectAllTx(){
  const ids=S.transactions.map(t=>t.id);
  if(selectedTx.size===ids.length){selectedTx.clear();}else{ids.forEach(id=>selectedTx.add(id));}
  renderTransactions();
}
async function deleteSelectedTx(){
  if(!selectedTx.size){toast('Nessuna transazione selezionata','err');return;}
  if(!confirm(`Eliminare ${selectedTx.size} transazioni?`))return;
  const ops={};
  var balDeltas={};
  selectedTx.forEach(function(id){
    ops['transactions/'+id]=null;
    var t=S.transactions.find(function(tx){return tx.id===id});
    if(t&&t.account){
      var delta=t.type==='income'?-N(t.amount):N(t.amount);
      balDeltas[t.account]=(balDeltas[t.account]||0)+delta;
    }
  });
  try{await db.ref(`users/${UID}`).update(ops);}catch(e){toast('Errore','err');return;}
  for(const e of Object.entries(balDeltas)){if(e[1])await updateBal(e[0],e[1]>0?'expense':'income',Math.abs(e[1]));}
  selectedTx.clear();toast('Eliminate','ok');
}
function updateMdelBtn(){
  const btn=document.getElementById('btn-mdel');
  if(!btn)return;
  if(selectedTx.size){btn.style.display='inline-flex';btn.textContent='ðŸ—‘ Elimina ('+selectedTx.size+')';}else{btn.style.display='none';}
}
function filterTx(){txPage=1;renderTransactions();}

function setTT(t){document.getElementById('tx-type').value=t;document.getElementById('btn-exp').className='tb'+(t==='expense'?' ae':'');document.getElementById('btn-inc').className='tb'+(t==='income'?' ai':'');}
function previewRec(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const img=document.getElementById('tx-rec-prev');img.src=ev.target.result;img.style.display='block';};r.readAsDataURL(f);}

async function saveTx(){
  setModalSaving(true);
  const id=document.getElementById('tx-id').value;
  const tx={type:document.getElementById('tx-type').value,amount:parseFloat(document.getElementById('tx-amount').value)||0,date:document.getElementById('tx-date').value,description:document.getElementById('tx-desc').value.trim(),category:document.getElementById('tx-cat').value,account:document.getElementById('tx-acc').value,note:document.getElementById('tx-note').value.trim(),currency:document.getElementById('tx-cur').value||'EUR',updatedAt:new Date().toISOString()};
  if(!tx.amount||!tx.date||!tx.description){toast('Compila importo, data e descrizione','err');return;}
  const img=document.getElementById('tx-rec-prev');if(img.style.display!=='none'&&img.src?.startsWith('data:'))tx.receiptUrl=img.src;
  if(id){
    /* BUG-03 FIX: reversa effetto vecchio saldo e applica il nuovo */
    const old=S.transactions.find(t=>t.id===id);
    if(old){
      /* annulla vecchio effetto */
      if(old.account)await updateBal(old.account,old.type==='income'?'expense':'income',old.amount);
      /* applica nuovo effetto */
      if(tx.account)await updateBal(tx.account,tx.type,tx.amount);
    }
    await db.ref(`users/${UID}/transactions/${id}`).update(tx);
  } else {
    tx.createdAt=new Date().toISOString();
    const ref=await db.ref(`users/${UID}/transactions`).push(tx);
    await updateBal(tx.account,tx.type,tx.amount);
    /* BUG-06 FIX: salva split usando l'ID reale della nuova transazione */
    if(splitMode){
      const rows=document.querySelectorAll('#split-rows .split-row');
      const splits=[];rows.forEach(r=>{const sel=r.querySelector('select'),inp=r.querySelector('input');splits.push({category:sel.value,amount:parseFloat(inp.value)||0});});
      if(splits.length)await db.ref(`users/${UID}/transactions/${ref.key}/splits`).set(splits);
    }
  }
  cm('modal-tx');resetTxForm();toast(id?'Aggiornata':'Aggiunta','ok');
  splitMode=false;document.getElementById('split-area').style.display='none';
  document.getElementById('split-toggle').textContent='âœ‚ï¸ Split';
  setModalSaving(false);
}

function resetTxForm(){['tx-id','tx-amount','tx-desc','tx-note'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('tx-date').value=today();setTT('expense');document.getElementById('tx-title').textContent='Nuova transazione';const img=document.getElementById('tx-rec-prev');img.style.display='none';document.getElementById('tx-rec').value='';const cd=document.getElementById('tx-cat');if(cd)cd.value='altro';const ad=document.getElementById('tx-acc');if(ad)ad.value='';}

/* BUG-04 FIX: usa Firebase transaction per evitare race condition sul saldo */
async function updateBal(accId,type,amount){
  if(!accId)return;
  const delta=type==='income'?N(amount):-N(amount);
  await db.ref(`users/${UID}/accounts/${accId}/balance`).transaction(cur=>N(cur)+delta);
}

function editTx(id){const t=S.transactions.find(t=>t.id===id);if(!t)return;document.getElementById('tx-id').value=id;document.getElementById('tx-type').value=t.type;setTT(t.type);document.getElementById('tx-amount').value=t.amount;document.getElementById('tx-date').value=t.date;document.getElementById('tx-desc').value=t.description||'';document.getElementById('tx-cat').value=t.category||'altro';document.getElementById('tx-acc').value=t.account||'';document.getElementById('tx-note').value=t.note||'';document.getElementById('tx-cur').value=t.currency||'EUR';document.getElementById('tx-title').textContent='Modifica transazione';if(t.receiptUrl){const img=document.getElementById('tx-rec-prev');img.src=t.receiptUrl;img.style.display='block';}om('modal-tx');}
async function deleteTx(id){
  if(!confirm('Eliminare?'))return;
  const t=S.transactions.find(tx=>tx.id===id);
  if(t&&t.account)await updateBal(t.account,t.type==='income'?'expense':'income',t.amount);
  await db.ref(`users/${UID}/transactions/${id}`).remove();
  toast('Eliminata','ok');
}

/* â”€â”€â”€ ACCOUNTS â”€â”€â”€ */
function renderAccounts(){
  const grid=document.getElementById('acc-grid'),empty=document.getElementById('acc-empty');
  if(!grid)return;
  // Dati non ancora arrivati da Firebase: mostra skeleton invece dello stato vuoto
  if(!_dataReady.accounts){
    if(empty)empty.style.display='none';
    document.getElementById('main-acc-section').style.display='none';
    grid.innerHTML=`
      <div class="skeleton" style="height:120px;border-radius:var(--r)"></div>
      <div class="skeleton" style="height:120px;border-radius:var(--r)"></div>
      <div class="skeleton" style="height:120px;border-radius:var(--r)"></div>`;
    return;
  }
  if(!S.accounts.length){grid.innerHTML='';if(empty)empty.style.display='block';document.getElementById('main-acc-section').style.display='none';return;}
  if(empty)empty.style.display='none';
  // Determine main account
  if(!mainAccId||!S.accounts.find(a=>a.id===mainAccId))mainAccId=S.accounts[0].id;
  const main=S.accounts.find(a=>a.id===mainAccId);
  const others=S.accounts.filter(a=>a.id!==mainAccId);
  // Render main account hero
  const ms=document.getElementById('main-acc-section');
  if(main){
    ms.style.display='block';
    document.getElementById('main-acc-name').textContent=main.name;
    document.getElementById('main-acc-bal').textContent=fmt(main.balance);
    document.getElementById('main-acc-bal').style.color=N(main.balance)>=0?'var(--gr)':'var(--re)';
    calcMainAccFreeMoney(main);
  } else {ms.style.display='none';}
  // Other accounts count
  const oc=document.getElementById('other-acc-count');
  if(oc)oc.textContent=others.length+' conti';
  // Render other accounts
  grid.innerHTML=others.map(a=>`<div style="background:var(--bg2);border:1px solid var(--b1);border-radius:var(--r);padding:1.5rem;position:relative;overflow:hidden;transition:transform .2s" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
    <div style="font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${a.color||'var(--ac)'};margin-bottom:.75rem">${AI_IC[a.type]||'ðŸ¦'} ${cap(a.type||'bank')}</div>
    <div style="font-weight:600;margin-bottom:.25rem">${a.name}</div>
    <div style="font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:${N(a.balance)>=0?'var(--gr)':'var(--re)'};margin:.5rem 0">${fmt(a.balance)}</div>
    <div style="display:flex;gap:.5rem;margin-top:1rem">
      <button class="btn bs bsm" onclick="editAcc('${a.id}')">Modifica</button>
      <button class="btn bd bsm" onclick="deleteAcc('${a.id}')">Elimina</button>
    </div>
  </div>`).join('');
  document.getElementById('other-acc-section').style.display=others.length?'block':'none';
}
function calcMainAccFreeMoney(main){
  const bal=N(main.balance);
  const m=new Date().toISOString().slice(0,7);
  const budgets=S.budgets[m]||{};
  const alloc=Object.values(budgets).reduce((s,b)=>s+N(b.limit),0);
  const goals=S.goals.reduce((s,g)=>s+N(g.target||0)-N(g.current||0),0);
  const rec=S.recurring.reduce((s,r)=>{const f={weekly:4.33,monthly:1,quarterly:1/3,yearly:1/12}[r.frequency]||1;return s+N(r.amount)*f;},0);
  const debtR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  const committed=alloc+rec+debtR;
  const free=bal-committed;
  document.getElementById('fm-main-free').textContent=fmt(Math.max(0,free));
  document.getElementById('fm-main-free').style.color=free>=0?'var(--gr)':'var(--re)';
  document.getElementById('fm-main-alloc').textContent=fmt(alloc+rec+debtR);
  document.getElementById('fm-main-goals').textContent=fmt(goals);
}
async function saveAcc(){const id=document.getElementById('acc-id').value;const isMain=document.getElementById('acc-main-check').checked;const a={name:document.getElementById('acc-name').value.trim(),type:document.getElementById('acc-type').value,balance:parseFloat(document.getElementById('acc-bal').value)||0,color:document.getElementById('acc-color').value,updatedAt:new Date().toISOString()};if(!a.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/accounts/${id}`).update(a);if(isMain){mainAccId=id;localStorage.setItem('kz_mainAcc',id);}}else{const ref=await db.ref(`users/${UID}/accounts`).push(a);if(isMain||!mainAccId){mainAccId=ref.key;localStorage.setItem('kz_mainAcc',ref.key);}}cm('modal-acc');document.getElementById('acc-id').value='';toast(id?'Aggiornato':'Aggiunto','ok');}
function editAcc(id){const a=S.accounts.find(a=>a.id===id);if(!a)return;document.getElementById('acc-id').value=id;document.getElementById('acc-name').value=a.name;document.getElementById('acc-type').value=a.type;document.getElementById('acc-bal').value=a.balance;document.getElementById('acc-color').value=a.color||'#2563EB';document.getElementById('acc-main-check').checked=id===mainAccId;om('modal-acc');}
async function deleteAcc(id){
  if(!confirm('Eliminare?'))return;
  await db.ref(`users/${UID}/accounts/${id}`).remove();
  if(id===mainAccId){
    const remaining=S.accounts.filter(a=>a.id!==id);
    if(remaining.length){
      mainAccId=remaining[0].id;
      localStorage.setItem('kz_mainAcc',mainAccId);
    }else{
      mainAccId='';
      localStorage.removeItem('kz_mainAcc');
    }
  }
  toast('Eliminato','ok');
}
function setMainAcc(){
  const opts=S.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  const div=document.createElement('div');
  div.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);z-index:200;display:flex;align-items:center;justify-content:center;padding:1rem';
  div.onclick=function(e){if(e.target===this)this.remove();};
  div.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--b2);border-radius:var(--r);width:100%;max-width:380px;padding:1.5rem">
    <div style="font-weight:700;font-size:1rem;margin-bottom:1rem">Scegli conto principale</div>
    <select id="set-main-sel" style="width:100%;padding:.7rem .875rem;background:var(--bg3);border:1.5px solid var(--b2);border-radius:var(--rs);color:var(--tx);font-size:.875rem;margin-bottom:1rem">${opts}</select>
    <button class="btn bp" style="width:100%" onclick="var s=document.getElementById('set-main-sel');if(s.value){mainAccId=s.value;localStorage.setItem('kz_mainAcc',mainAccId);this.parentElement.parentElement.remove();renderAccounts();toast('Conto principale aggiornato','ok');}">Conferma</button>
  </div>`;
  document.body.appendChild(div);
}

/* â”€â”€â”€ TRANSFER â”€â”€â”€ */
function populateTransferSels(){const opts=S.accounts.map(a=>`<option value="${a.id}">${a.name} (${fmt(a.balance)})</option>`).join('');['tr-from','tr-to'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=opts||'<option>Nessun conto</option>';});}
async function doTransfer(){
  const fId=document.getElementById('tr-from').value,tId=document.getElementById('tr-to').value,
    amount=parseFloat(document.getElementById('tr-amount').value)||0,
    date=document.getElementById('tr-date').value,
    note=document.getElementById('tr-note').value.trim();
  if(!fId||!tId||fId===tId){toast('Seleziona due conti diversi','err');return;}
  if(!amount||!date){toast('Inserisci importo e data','err');return;}
  const fAcc=S.accounts.find(a=>a.id===fId),tAcc=S.accounts.find(a=>a.id===tId);
  if(!fAcc||!tAcc){toast('Conto non trovato','err');return;}
  const fromName=fAcc.name,toName=tAcc.name;

  // Scala il saldo del conto sorgente in modo atomico.
  // La funzione passata a .transaction() riceve il valore corrente dal server,
  // quindi e' immune a scritture concorrenti da altri dispositivi.
  let finalFrom=null;
  try{
    const fromResult=await db.ref(`users/${UID}/accounts/${fId}/balance`).transaction(current=>{
      const bal=N(current);
      if(bal<amount) return; // abort: undefined -> Firebase annulla senza scrivere
      finalFrom=bal-amount;
      return finalFrom;
    });
    if(!fromResult.committed){
      toast('Saldo insufficiente','err');
      return;
    }
  }catch(e){
    toast('Errore durante il trasferimento','err');
    console.error('Transfer from-tx error:',e);
    return;
  }

  // Accredita il conto destinazione in modo atomico.
  // Se questo fallisce dopo che il primo ha gia' scalato, eseguiamo un rollback manuale.
  try{
    const toResult=await db.ref(`users/${UID}/accounts/${tId}/balance`).transaction(current=>{
      return N(current)+amount;
    });
    if(!toResult.committed) throw new Error('to-tx not committed');
  }catch(e){
    // Rollback: ripristina il saldo sorgente
    console.error('Transfer to-tx error, rolling back:',e);
    await db.ref(`users/${UID}/accounts/${fId}/balance`).transaction(current=>N(current)+amount).catch(()=>{});
    toast('Errore durante il trasferimento, operazione annullata','err');
    return;
  }

  // Registra il trasferimento nel log
  await db.ref(`users/${UID}/transfers`).push({
    from:fId,to:tId,fromName,toName,amount,date,note,
    createdAt:new Date().toISOString()
  });

  document.getElementById('tr-amount').value='';
  document.getElementById('tr-note').value='';
  toast(`Trasferito ${fmt(amount)} da ${fromName} a ${toName}`,'ok');
  renderAccounts();
  updateDashWidgets();
}
function renderTransfers(){const list=document.getElementById('transfer-list');if(!list)return;const tr=[...S.transfers].sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));list.innerHTML=tr.slice(0,10).map(t=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1);font-size:.85rem"><div><div style="font-weight:500">${t.fromName} â†’ ${t.toName}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)}${t.note?` Â· ${t.note}`:''}</div></div><div style="font-weight:700;color:var(--ac)">${fmt(t.amount)}</div></div>`).join('')||'<div style="color:var(--tx3);font-size:.8rem;padding:.5rem">Nessun trasferimento</div>';}

/* â”€â”€â”€ BUDGET â”€â”€â”€ */
function renderBudget(){
  const skel=document.getElementById('budget-skeleton');
  if(skel)skel.style.display='none';
  const m=new Date().toISOString().slice(0,7);
  const bm=document.getElementById('budget-month');if(bm)bm.textContent=new Date().toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const budgets=S.budgets[m]||{};
  const grid=document.getElementById('budget-grid'),empty=document.getElementById('budget-empty');
  if(!grid)return;
  const txM=S.transactions.filter(t=>t.date?.startsWith(m)&&t.type==='expense');
  if(!Object.keys(budgets).length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=Object.entries(budgets).map(([cat,b])=>{const spent=txM.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);const pct=Math.min(100,Math.round((spent/b.limit)*100));const color=pct>=90?'var(--re)':pct>=70?'var(--ye)':'var(--gr)';return`<div class="gc"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem"><div style="font-size:.9rem;font-weight:600">${CI[cat]||'ðŸ“¦'} ${cap(cat)}</div><button class="btn bi bd bsm" onclick="deleteBudget('${cat}')">ðŸ—‘</button></div><div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--tx2);margin-top:.4rem"><span>Speso: <strong>${fmt(spent)}</strong></span><span style="color:${color}"><strong>${pct}%</strong> di ${fmt(b.limit)}</span></div></div>`;}).join('');
}
async function saveBudget(){const cat=document.getElementById('bud-cat').value,limit=parseFloat(document.getElementById('bud-limit').value)||0;if(!limit){toast('Inserisci limite','err');return;}const m=new Date().toISOString().slice(0,7);await db.ref(`users/${UID}/budgets/${m}/${cat}`).set({limit,updatedAt:new Date().toISOString()});cm('modal-budget');toast('Budget salvato','ok');}
async function deleteBudget(cat){const m=new Date().toISOString().slice(0,7);await db.ref(`users/${UID}/budgets/${m}/${cat}`).remove();toast('Rimosso','ok');}

/* â”€â”€â”€ GOALS â”€â”€â”€ */
function renderGoals(){
  const skel=document.getElementById('goals-skeleton');
  if(skel)skel.style.display='none';
  const grid=document.getElementById('goals-grid'),empty=document.getElementById('goals-empty');
  if(!grid)return;
  if(!S.goals.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=S.goals.map(g=>{const pct=Math.min(100,Math.round((N(g.current)/N(g.target))*100));const color=pct>=100?'var(--gr)':pct>=60?'var(--ac)':'var(--ac2)';return`<div class="gc"><div style="font-size:1.75rem;margin-bottom:.75rem">${g.icon||'ðŸŽ¯'}</div><div style="font-weight:700;margin-bottom:.25rem">${g.name}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">Target: ${fmt(g.target)} Â· ${fd(g.dl)}</div><div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem"><div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:${color}">${pct}%</div><div style="font-size:.8rem;color:var(--tx2)">${fmt(g.current||0)} / ${fmt(g.target)}</div></div><div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editGoal('${g.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteGoal('${g.id}')">ðŸ—‘</button></div></div>`;}).join('');
}
async function saveGoal(){const id=document.getElementById('goal-id').value;const g={name:document.getElementById('goal-name').value.trim(),target:parseFloat(document.getElementById('goal-target').value)||0,current:parseFloat(document.getElementById('goal-cur').value)||0,dl:document.getElementById('goal-dl').value,icon:document.getElementById('goal-icon').value,reminder:document.getElementById('goal-rem').value,updatedAt:new Date().toISOString()};if(!g.name||!g.target){toast('Compila nome e target','err');return;}if(id){await db.ref(`users/${UID}/goals/${id}`).update(g);}else{g.createdAt=new Date().toISOString();await db.ref(`users/${UID}/goals`).push(g);}cm('modal-goal');document.getElementById('goal-id').value='';toast('Salvato','ok');}
function editGoal(id){const g=S.goals.find(g=>g.id===id);if(!g)return;document.getElementById('goal-id').value=id;document.getElementById('goal-name').value=g.name;document.getElementById('goal-target').value=g.target;document.getElementById('goal-cur').value=g.current||0;document.getElementById('goal-dl').value=g.dl||'';document.getElementById('goal-icon').value=g.icon||'ðŸŽ¯';document.getElementById('goal-rem').value=g.reminder||'';om('modal-goal');}
async function deleteGoal(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/goals/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ CALENDAR â”€â”€â”€ */
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
  const ce=document.getElementById('cal-events');if(ce)ce.innerHTML=all.length?all.map(e=>`<div style="display:flex;align-items:center;gap:.75rem;padding:.7rem 0;border-bottom:1px solid var(--b1)"><div style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${e.etype==='rec'?'var(--ye)':'var(--re)'}"></div><div style="flex:1"><div style="font-size:.875rem;font-weight:500">${e.etype==='rec'?e.name:e.client}</div><div style="font-size:.72rem;color:var(--tx3)">${e.etype==='rec'?'ðŸ” Ricorrente':'ðŸ§¾ Fattura'} Â· ${fd(e.nextDate||e.due)}</div></div><div style="font-weight:700;font-size:.875rem;color:${e.etype==='rec'?'var(--ye)':'var(--re)'}">${fmt(e.amount)}</div></div>`).join(''):'<div style="color:var(--tx3);font-size:.8rem;padding:1rem 0">Nessuna scadenza</div>';
}
function calPrev(){calDate.setMonth(calDate.getMonth()-1);renderCalendar();}
function calNext(){calDate.setMonth(calDate.getMonth()+1);renderCalendar();}

/* â”€â”€â”€ RECURRING â”€â”€â”€ */
function renderRecurring(){const tbody=document.getElementById('rec-tbody'),empty=document.getElementById('rec-empty');if(!tbody)return;if(!S.recurring.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';tbody.innerHTML=S.recurring.map(r=>`<tr><td class="tdm">${CI[r.category]||'ðŸ“¦'} ${r.name}</td><td><span class="badge bg-pu">${cap(r.category||'altro')}</span></td><td>${FQ[r.frequency]||r.frequency}</td><td>${fd(r.nextDate)}</td><td style="font-weight:700;color:var(--re)">${fmt(r.amount)}</td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editRec('${r.id}')">âœï¸</button><button class="btn bi bd bsm" onclick="deleteRec('${r.id}')">ðŸ—‘</button></div></td></tr>`).join('');}
async function saveRec(){const id=document.getElementById('rec-id').value;const r={name:document.getElementById('rec-name').value.trim(),amount:parseFloat(document.getElementById('rec-amount').value)||0,frequency:document.getElementById('rec-freq').value,category:document.getElementById('rec-cat').value,nextDate:document.getElementById('rec-next').value,updatedAt:new Date().toISOString()};if(!r.name||!r.amount){toast('Compila nome e importo','err');return;}if(id){await db.ref(`users/${UID}/recurring/${id}`).update(r);}else{r.createdAt=new Date().toISOString();await db.ref(`users/${UID}/recurring`).push(r);}cm('modal-rec');document.getElementById('rec-id').value='';toast('Salvato','ok');}
function editRec(id){const r=S.recurring.find(r=>r.id===id);if(!r)return;document.getElementById('rec-id').value=id;document.getElementById('rec-name').value=r.name;document.getElementById('rec-amount').value=r.amount;document.getElementById('rec-freq').value=r.frequency;document.getElementById('rec-cat').value=r.category;document.getElementById('rec-next').value=r.nextDate||'';om('modal-rec');}
async function deleteRec(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/recurring/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ DEBTS â”€â”€â”€ */
function renderDebts(){
  const grid=document.getElementById('debts-grid'),empty=document.getElementById('debts-empty'),stats=document.getElementById('debt-stats');
  if(!grid)return;
  const totD=S.debts.reduce((s,d)=>s+N(d.rem||d.remaining||0),0),totR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  if(stats)stats.innerHTML=`<div class="sc"><div class="sl">Debito totale</div><div class="sv" style="color:var(--re)">${fmt(totD)}</div></div><div class="sc"><div class="sl">Rate mensili</div><div class="sv" style="color:var(--ye)">${fmt(totR)}</div></div><div class="sc"><div class="sl">NÂ° debiti</div><div class="sv">${S.debts.length}</div></div>`;
  if(!S.debts.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  const DT={mortgage:'ðŸ  Mutuo',personal:'ðŸ’° Personale',car:'ðŸš— Auto',credit:'ðŸ’³ Carta',other:'ðŸ“¦ Altro'};
  grid.innerHTML=S.debts.map(d=>{const rem=N(d.rem||d.remaining||0),tot=N(d.total||0);const pct=tot?Math.min(100,Math.round(((tot-rem)/tot)*100)):0;return`<div class="gc"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem"><div><div style="font-weight:700">${d.name}</div><div style="font-size:.75rem;color:var(--tx2)">${DT[d.type]||d.type}</div></div><button class="btn bi bd bsm" onclick="deleteDebt('${d.id}')">ðŸ—‘</button></div><div style="font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;color:var(--re)">${fmt(rem)}</div><div class="pb" style="margin:.5rem 0"><div class="pf" style="width:${pct}%;background:var(--gr)"></div></div><div style="font-size:.75rem;color:var(--tx3);margin-bottom:.75rem">${pct}% rimborsato di ${fmt(tot)}</div><div style="display:flex;gap:1rem;font-size:.8rem"><div><div style="color:var(--tx3)">Rata</div><div style="font-weight:600;color:var(--ye)">${fmt(d.rate||0)}/mese</div></div><div><div style="color:var(--tx3)">Tasso</div><div style="font-weight:600">${d.int||0}%</div></div><div><div style="color:var(--tx3)">Fine</div><div style="font-weight:600">${fd(d.end)}</div></div></div></div>`;}).join('');
}
async function saveDebt(){const id=document.getElementById('debt-id').value;const d={name:document.getElementById('debt-name').value.trim(),total:parseFloat(document.getElementById('debt-total').value)||0,rem:parseFloat(document.getElementById('debt-rem').value)||0,rate:parseFloat(document.getElementById('debt-rate').value)||0,int:parseFloat(document.getElementById('debt-int').value)||0,start:document.getElementById('debt-start').value,end:document.getElementById('debt-end').value,type:document.getElementById('debt-type').value,updatedAt:new Date().toISOString()};if(!d.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/debts/${id}`).update(d);}else{d.createdAt=new Date().toISOString();await db.ref(`users/${UID}/debts`).push(d);}cm('modal-debt');document.getElementById('debt-id').value='';toast('Salvato','ok');}
async function deleteDebt(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/debts/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ FREE MONEY â”€â”€â”€ */
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
  const fs=document.getElementById('fm-stats');if(fs)fs.innerHTML=`<div class="sc e-fade e-d1"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(totalInc)}</div></div><div class="sc e-fade e-d2"><div class="sl">Spese fisse</div><div class="sv" style="color:var(--ye)">${fmt(totalFixed)}</div></div><div class="sc e-fade e-d3"><div class="sl">GiÃ  speso</div><div class="sv" style="color:var(--re)">${fmt(mExp)}</div></div><div class="sc e-fade e-d4"><div class="sl">ðŸ’° Liberi ora</div><div class="sv" style="color:${free>=0?'var(--gr)':'var(--re)'};font-size:1.8rem">${fmt(free)}</div></div>`;
  const fb=document.getElementById('fm-breakdown');if(fb)fb.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ’¼ Entrate</span><span style="font-weight:700;color:var(--gr)">+${fmt(totalInc)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ” Ricorrenti</span><span style="font-weight:700;color:var(--ye)">-${fmt(recTot)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ’³ Rate</span><span style="font-weight:700;color:var(--ye)">-${fmt(debtRates)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ›’ Spese mese</span><span style="font-weight:700;color:var(--re)">-${fmt(mExp)}</span></div><div style="display:flex;justify-content:space-between;padding:.875rem;background:${free>=0?'rgba(52,211,153,.08)':'rgba(238,68,68,.08)'};border-radius:var(--rs)"><span style="font-weight:700">ðŸ’° Liberi ora</span><span style="font-weight:800;font-size:1.1rem;color:${free>=0?'var(--gr)':'var(--re)'}">${fmt(free)}</span></div></div>`;
  const fd2=document.getElementById('fm-dist');const d50=freeAfterFixed*.5,d30=freeAfterFixed*.3,d20=freeAfterFixed*.2;
  if(fd2)fd2.innerHTML=`<div style="font-size:.8rem;color:var(--tx2);margin-bottom:.875rem">Sul disponibile dopo spese fisse: ${fmt(freeAfterFixed)}</div>${[{l:'ðŸ  NecessitÃ  (50%)',v:d50,c:'var(--ac2)'},{l:'ðŸŽ¬ Svago (30%)',v:d30,c:'var(--ac)'},{l:'ðŸ† Risparmio (20%)',v:d20,c:'var(--gr)'}].map(i=>`<div style="margin-bottom:.875rem"><div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.3rem"><span>${i.l}</span><span style="font-weight:700;color:${i.c}">${fmt(i.v)}</span></div><div class="pb"><div class="pf" style="width:${Math.min(100,mExp/(i.v||1)*100)}%;background:${i.c}"></div></div></div>`).join('')}`;
  const fi=document.getElementById('fm-income');if(fi&&!fi.value)fi.value=fmCfg.income||'';
  const fo=document.getElementById('fm-other');if(fo&&!fo.value)fo.value=fmCfg.otherIncome||'';
}
function saveFM(){fmCfg={income:parseFloat(document.getElementById('fm-income').value)||0,otherIncome:parseFloat(document.getElementById('fm-other').value)||0};localStorage.setItem('kz_fm',JSON.stringify(fmCfg));calcFreeMoney();toast('Salvato','ok');}

function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
/* â”€â”€â”€ GROUPS â”€â”€â”€ */


function openGroup(gid){
  currentGid=gid;const g=S.groups[gid];if(!g)return;const info=g.info||{};
  document.getElementById('gd-title').textContent=info.name||'Gruppo';
  const members=Object.values(g.members||{});
  // Calculate balances
  const balances={};members.forEach(m=>{balances[m.name||m.email]=0;});
  Object.values(g.expenses||{}).forEach(e=>{const payer=members.find(m=>m.uid===e.payerId||m.email===e.payerId);const pName=payer?.name||e.payerName||e.payerId;const share=e.amount/members.length;members.forEach(m=>{const n=m.name||m.email;if(!balances[n])balances[n]=0;if(n===pName)balances[n]+=(e.amount-share);else balances[n]-=share;});});
  const escQ=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,"\\'").replace(/\\/g,'\\\\').replace(/</g,'&lt;').replace(/>/g,'&gt;');const gidQ=escQ(gid);
  document.getElementById('gd-members').innerHTML=members.map(m=>{const n=m.name||m.email;const b=balances[n]||0;const absB=Math.abs(b);const neg=b<0;const uidQ=escQ(m.uid||''),nameQ=escQ(n);const absQ=escQ(String(absB));return`<div style="display:flex;align-items:center;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--b1)"><div style="width:30px;height:30px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:#fff;flex-shrink:0">${esc(n).charAt(0).toUpperCase()}</div><div style="flex:1"><div style="font-size:.875rem;font-weight:500">${esc(n)}</div><div style="font-size:.72rem;color:var(--tx3)">${esc(m.email||'')}</div></div><div style="text-align:right"><div style="font-weight:700;font-size:.875rem;color:${b>=0?'var(--gr)':'var(--re)'}">${b>=0?'+':''}${fmt(b)}</div><div style="font-size:.7rem;color:var(--tx3)">${b>0?'da ricevere':b<0?'deve pagare':'in pari'}</div>${neg?`<button class="btn bp bsm" style="margin-top:.35rem;font-size:.72rem;padding:.25rem .6rem" onclick="payWithPaypal('${uidQ}','${gidQ}','${absQ}','${nameQ}')">ðŸŸ¦ Invia soldi ora</button>`:''}</div></div>`;}).join('');
  const expenses=Object.values(g.expenses||{}).sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('gd-expenses').innerHTML=expenses.slice(0,10).map(e=>`<tr><td>${esc(e.payerName||'â€”')}</td><td class="tdm">${esc(e.description||'â€”')}</td><td style="font-weight:700;color:var(--re)">${fmt(e.amount)}</td></tr>`).join('');
  const ps=document.getElementById('ge-payer');if(ps)ps.innerHTML=members.map(m=>`<option value="${esc(m.uid||m.email)}">${esc(m.name||m.email)}</option>`).join('');
  document.getElementById('ge-date').value=today();
  if(chatOff)chatOff();
  const chatEl=document.getElementById('gd-chat');
  chatOff=db.ref(`groups/${gid}/chat`).limitToLast(50).on('value',snap=>{
    const msgs=Object.entries(snap.val()||{}).map(([id,m])=>({id,...m}));
    chatEl.innerHTML=msgs.map(m=>{const mine=m.uid===UID;return`<div class="${mine?'chat-mine':'chat-other'}">${esc(m.text)}<div class="chat-meta">${mine?'Tu':esc(m.name||'?')} Â· ${new Date(m.ts||0).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</div></div>`;}).join('');
    chatEl.scrollTop=chatEl.scrollHeight;
  });
  showView('group-detail');
}
async function sendChat(){const input=document.getElementById('chat-msg'),text=input.value.trim();if(!text||!currentGid)return;await db.ref(`groups/${currentGid}/chat`).push({text,uid:UID,name:UP?.name||'Utente',ts:new Date().toISOString()});input.value='';}
async function saveGE(){const gid=currentGid;if(!gid)return;const desc=document.getElementById('ge-desc').value.trim(),amount=parseFloat(document.getElementById('ge-amount').value)||0,payerId=document.getElementById('ge-payer').value,split=document.getElementById('ge-split').value,date=document.getElementById('ge-date').value;if(!desc||!amount){toast('Compila descrizione e importo','err');return;}const g=S.groups[gid];const payer=Object.values(g?.members||{}).find(m=>m.uid===payerId||m.email===payerId);await db.ref(`groups/${gid}/expenses`).push({description:desc,amount,payerId,payerName:payer?.name||payerId,split,date,createdAt:new Date().toISOString()});cm('modal-ge');toast('Spesa aggiunta','ok');openGroup(gid);}
async function payWithPaypal(memberUid,gid,amount,memberName){
  const snap=await db.ref(`users/${memberUid}/profile/paypal`).once('value');
  let paypal=snap.val();
  if(!paypal){toast(`${memberName} non ha un PayPal configurato`,'err');return;}
  paypal=paypal.replace('@','').trim();
  const url=`https://paypal.me/${paypal}/${amount.replace(',','.')}EUR`;
  const win=window.open(url,'_blank');
  if(!win){toast('Permetti pop-up per aprire PayPal','warn');return;}
  const handler=e=>{
    if(document.hidden)return;
    window.removeEventListener('visibilitychange',handler);
    setTimeout(async()=>{
      if(!confirm(`Hai pagato ${fmt(parseFloat(amount))} a ${memberName} tramite PayPal?`))return;
      await db.ref(`groups/${gid}/transactions`).push({
        type:'paypal',
        from:UID,
        to:memberUid,
        amount:parseFloat(amount),
        ts:new Date().toISOString(),
        note:`Pagamento PayPal a ${memberName}`
      });
      const payerMember=Object.values(S.groups[gid]?.members||{}).find(m=>m.uid===memberUid);
      if(payerMember){
        try{
          const pSnap=await db.ref(`users/${memberUid}/profile`).once('value');
          const pUp=pSnap.val()||{};
          await db.ref(`users/${memberUid}/notifications`).push({
            title:'ðŸŸ¦ Pagamento ricevuto via PayPal',
            body:`${UP?.name||'Un utente'} ti ha pagato ${fmt(parseFloat(amount))} per il gruppo "${S.groups[gid]?.info?.name||''}"`,
            type:'paypal',ts:new Date().toISOString(),read:false
          });
        }catch(e){console.warn('Notif err:',e);}
      }
      toast(`Pagamento registrato! ðŸ‘`,'ok');
      openGroup(gid);
    },500);
  };
  window.addEventListener('visibilitychange',handler);
}

/* â”€â”€â”€ INVOICES â”€â”€â”€ */
function renderInvoices(){
  const tbody=document.getElementById('inv-tbody'),empty=document.getElementById('inv-empty'),stats=document.getElementById('inv-stats');
  if(!tbody)return;
  const am={draft:0,sent:0,paid:0,overdue:0};S.invoices.forEach(i=>{am[i.status]=(am[i.status]||0)+N(i.amount)*(1+N(i.vat||22)/100);});
  if(stats)stats.innerHTML=Object.entries(am).map(([s,v])=>`<div style="background:var(--bg2);border:1px solid var(--b1);border-radius:var(--rs);padding:.75rem 1rem"><div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);margin-bottom:.25rem">${IS[s]?.l||s}</div><div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700">${fmt(v)}</div></div>`).join('');
  if(!S.invoices.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  tbody.innerHTML=S.invoices.map(i=>{const vat=N(i.vat||22);const total=N(i.amount)*(1+vat/100);const s=IS[i.status]||IS.draft;return`<tr><td class="tdm">${i.invoiceNum||'â€”'}</td><td>${i.client}</td><td>${fd(i.date)}</td><td>${fd(i.due)}</td><td>${vat}%</td><td style="font-weight:700">${fmt(total)}</td><td><span class="badge ${s.c}">${s.l}</span></td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editInv('${i.id}')">âœï¸</button><button class="btn bi bd bsm" onclick="deleteInv('${i.id}')">ðŸ—‘</button></div></td></tr>`;}).join('');
}
async function saveInv(){const id=document.getElementById('inv-id').value;const vat=parseInt(document.getElementById('inv-vat').value)||22,amount=parseFloat(document.getElementById('inv-amount').value)||0;const inv={client:document.getElementById('inv-client').value.trim(),invoiceNum:document.getElementById('inv-num').value.trim(),date:document.getElementById('inv-date').value,due:document.getElementById('inv-due').value,amount,vat,totalWithVat:amount*(1+vat/100),status:document.getElementById('inv-status').value,notes:document.getElementById('inv-notes').value.trim(),updatedAt:new Date().toISOString()};if(!inv.client||!inv.amount){toast('Compila cliente e importo','err');return;}if(id){await db.ref(`users/${UID}/invoices/${id}`).update(inv);}else{inv.createdAt=new Date().toISOString();await db.ref(`users/${UID}/invoices`).push(inv);}cm('modal-inv');document.getElementById('inv-id').value='';toast('Salvata','ok');}
function editInv(id){const i=S.invoices.find(i=>i.id===id);if(!i)return;document.getElementById('inv-id').value=id;document.getElementById('inv-client').value=i.client;document.getElementById('inv-num').value=i.invoiceNum||'';document.getElementById('inv-date').value=i.date;document.getElementById('inv-due').value=i.due||'';document.getElementById('inv-amount').value=i.amount;document.getElementById('inv-vat').value=i.vat||22;document.getElementById('inv-status').value=i.status;document.getElementById('inv-notes').value=i.notes||'';om('modal-inv');}
async function deleteInv(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/invoices/${id}`).remove();toast('Eliminata','ok');}

/* â”€â”€â”€ QUOTES â”€â”€â”€ */
function renderQuotes(){const tbody=document.getElementById('quotes-tbody'),empty=document.getElementById('quotes-empty');if(!tbody)return;const QS={draft:{l:'Bozza',c:'bg-gy'},sent:{l:'Inviato',c:'bg-ye'},accepted:{l:'Accettato',c:'bg-gr'},rejected:{l:'Rifiutato',c:'bg-re'}};if(!S.quotes.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';tbody.innerHTML=S.quotes.map(q=>{const total=N(q.amount)*(1+N(q.vat||22)/100);const s=QS[q.status]||QS.draft;return`<tr><td class="tdm">${q.num||'â€”'}</td><td>${q.client||'â€”'}</td><td>${fd(q.date)}</td><td>${fd(q.valid)}</td><td style="font-weight:700">${fmt(total)}</td><td><span class="badge ${s.c}">${s.l}</span></td><td><div style="display:flex;gap:.25rem"><button class="btn bi bs bsm" onclick="editQt('${q.id}')">âœï¸</button><button class="btn bi bs bsm" onclick="qt2Inv('${q.id}')">ðŸ§¾</button><button class="btn bi bd bsm" onclick="deleteQt('${q.id}')">ðŸ—‘</button></div></td></tr>`;}).join('');}
async function saveQt(){const id=document.getElementById('qt-id').value;const q={client:document.getElementById('qt-client').value.trim(),num:document.getElementById('qt-num').value.trim(),date:document.getElementById('qt-date').value,valid:document.getElementById('qt-valid').value,amount:parseFloat(document.getElementById('qt-amount').value)||0,vat:parseInt(document.getElementById('qt-vat').value)||22,status:document.getElementById('qt-status').value,notes:document.getElementById('qt-notes').value.trim(),updatedAt:new Date().toISOString()};if(!q.client||!q.amount){toast('Compila cliente e importo','err');return;}if(id){await db.ref(`users/${UID}/quotes/${id}`).update(q);}else{q.createdAt=new Date().toISOString();await db.ref(`users/${UID}/quotes`).push(q);}cm('modal-quote');document.getElementById('qt-id').value='';toast('Salvato','ok');}
function editQt(id){const q=S.quotes.find(q=>q.id===id);if(!q)return;document.getElementById('qt-id').value=id;document.getElementById('qt-client').value=q.client;document.getElementById('qt-num').value=q.num||'';document.getElementById('qt-date').value=q.date;document.getElementById('qt-valid').value=q.valid||'';document.getElementById('qt-amount').value=q.amount;document.getElementById('qt-vat').value=q.vat||22;document.getElementById('qt-status').value=q.status;document.getElementById('qt-notes').value=q.notes||'';om('modal-quote');}
async function qt2Inv(id){const q=S.quotes.find(q=>q.id===id)||S.quotes.find(q=>q.id===document.getElementById('qt-id').value);if(!q){toast('Salva prima il preventivo','warn');return;}if(!confirm(`Convertire in fattura?`))return;const inv={client:q.client,invoiceNum:(q.num||'').replace('PREV','FAT')||'',date:today(),due:'',amount:q.amount,vat:q.vat,totalWithVat:q.amount*(1+q.vat/100),status:'draft',notes:q.notes||'',createdAt:new Date().toISOString()};await db.ref(`users/${UID}/invoices`).push(inv);if(q.id)await db.ref(`users/${UID}/quotes/${q.id}`).update({status:'accepted'});toast('Convertito in fattura!','ok');showView('invoices');}
async function deleteQt(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/quotes/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ SUPPLIERS â”€â”€â”€ */
const SUP_IC={software:'ðŸ’»',servizi:'ðŸ”§',materiali:'ðŸ“¦',consulenza:'ðŸ’¼',utilities:'âš¡',altro:'ðŸ“‹'};
function renderSuppliers(){const grid=document.getElementById('suppliers-grid'),empty=document.getElementById('suppliers-empty');if(!grid)return;if(!S.suppliers.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';grid.innerHTML=S.suppliers.map(s=>`<div class="gc"><div style="font-size:1.5rem;margin-bottom:.5rem">${SUP_IC[s.cat]||'ðŸ“‹'}</div><div style="font-weight:700;font-size:1rem;margin-bottom:.2rem">${s.name}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${s.email||'â€”'}</div>${s.cost>0?`<div style="font-size:.875rem">Costo: <strong style="color:var(--re)">${fmt(s.cost)}/mese</strong></div>`:''}<div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editSup('${s.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteSup('${s.id}')">ðŸ—‘</button></div></div>`).join('');}
async function saveSup(){const id=document.getElementById('sup-id').value;const s={name:document.getElementById('sup-name').value.trim(),cat:document.getElementById('sup-cat').value,cost:parseFloat(document.getElementById('sup-cost').value)||0,email:document.getElementById('sup-email').value.trim(),notes:document.getElementById('sup-notes').value.trim(),updatedAt:new Date().toISOString()};if(!s.name){toast('Inserisci nome','err');return;}if(id){await db.ref(`users/${UID}/suppliers/${id}`).update(s);}else{s.createdAt=new Date().toISOString();await db.ref(`users/${UID}/suppliers`).push(s);}cm('modal-sup');document.getElementById('sup-id').value='';toast('Salvato','ok');}
function editSup(id){const s=S.suppliers.find(s=>s.id===id);if(!s)return;document.getElementById('sup-id').value=id;document.getElementById('sup-name').value=s.name;document.getElementById('sup-cat').value=s.cat||'altro';document.getElementById('sup-cost').value=s.cost||'';document.getElementById('sup-email').value=s.email||'';document.getElementById('sup-notes').value=s.notes||'';om('modal-sup');}
async function deleteSup(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/suppliers/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ PRIMA NOTA â”€â”€â”€ */
function renderPrimaNota(){
  const y=pnDate.getFullYear(),mo=pnDate.getMonth(),mStr=`${y}-${String(mo+1).padStart(2,'0')}`;
  const pt=document.getElementById('pn-title');if(pt)pt.textContent='Prima Nota â€” '+new Date(y,mo,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const txM=S.transactions.filter(t=>t.date?.startsWith(mStr)).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const ps=document.getElementById('pn-stats');if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Registrazioni</div><div class="sv">${txM.length}</div></div><div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div></div><div class="sc"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div></div><div class="sc"><div class="sl">Saldo</div><div class="sv" style="color:${inc-exp>=0?'var(--gr)':'var(--re)'}">${fmt(inc-exp)}</div></div>`;
  const tbody=document.getElementById('pn-tbody');if(!tbody)return;let prog=0;tbody.innerHTML=txM.map((t,i)=>{const amt=N(t.amount);prog+=t.type==='income'?amt:-amt;return`<tr><td style="font-size:.82rem;color:var(--tx3)">${String(i+1).padStart(3,'0')}</td><td style="font-size:.82rem">${fd(t.date)}</td><td class="tdm">${t.description||'â€”'}</td><td><span class="badge bg-gy">${cap(t.category||'altro')}</span></td><td style="font-weight:600;color:var(--gr)">${t.type==='income'?fmt(amt):'â€”'}</td><td style="font-weight:600;color:var(--re)">${t.type==='expense'?fmt(amt):'â€”'}</td><td style="font-weight:700;color:${prog>=0?'var(--gr)':'var(--re)'}">${fmt(prog)}</td></tr>`;}).join('');
}
function pnPrev(){pnDate.setMonth(pnDate.getMonth()-1);renderPrimaNota();}
function pnNext(){pnDate.setMonth(pnDate.getMonth()+1);renderPrimaNota();}
async function exportPrimaNota(){
  try{await loadJsPDF();}catch(e){toast('Errore caricamento libreria PDF','err');return;}
  try{const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.setFontSize(16);doc.text('Prima Nota',14,20);doc.setFontSize(9);doc.setTextColor(120);doc.text(pnDate.toLocaleDateString('it-IT',{month:'long',year:'numeric'}),14,28);doc.setTextColor(0);let y=40;const y2=pnDate.getFullYear(),mo2=pnDate.getMonth(),mStr2=`${y2}-${String(mo2+1).padStart(2,'0')}`;const txM=S.transactions.filter(t=>t.date?.startsWith(mStr2)).sort((a,b)=>new Date(a.date)-new Date(b.date));let prog=0;txM.forEach((t,i)=>{if(y>270){doc.addPage();y=20;}const amt=N(t.amount);prog+=t.type==='income'?amt:-amt;doc.setFontSize(8);doc.text(String(i+1).padStart(3,'0'),14,y);doc.text(t.date||'â€”',20,y);doc.text((t.description||'â€”').slice(0,35),40,y);if(t.type==='income')doc.text(fmt(amt),120,y);if(t.type==='expense')doc.text(fmt(amt),145,y);doc.text(fmt(prog),170,y);y+=7;});doc.save('prima-nota.pdf');toast('PDF esportato','ok');}catch(e){toast('Errore PDF','err');}}

/* â”€â”€â”€ TAX CALC â”€â”€â”€ */
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
  /* BUG-14 FIX: la deduzione INPS al 50% si applica prima del calcolo imposta */
  if(taxRate){const adj=Math.max(0,taxableBase-(inpsAmount*0.5));taxAmount=adj*taxRate;}
  else{const nb=taxableBase-inpsAmount;taxAmount=nb<=15000?nb*.23:nb<=28000?3450+(nb-15000)*.25:nb<=50000?6700+(nb-28000)*.35:nb<=75000?14400+(nb-50000)*.41:24650+(nb-75000)*.43;}
  net=rev-taxAmount-inpsAmount;
  res.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>Fatturato lordo</span><span style="font-weight:700">${fmt(rev)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>Base imponibile</span><span style="font-weight:700">${fmt(taxableBase)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ›ï¸ Tasse</span><span style="font-weight:700;color:var(--re)">-${fmt(taxAmount)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span>ðŸ¦ INPS</span><span style="font-weight:700;color:var(--ye)">-${fmt(inpsAmount)}</span></div><div style="display:flex;justify-content:space-between;padding:.875rem;background:rgba(52,211,153,.08);border-radius:var(--rs)"><span style="font-weight:700">ðŸ’° Netto annuo</span><span style="font-weight:800;font-size:1.1rem;color:var(--gr)">${fmt(net)}</span></div><div style="font-size:.8rem;color:var(--tx2);margin-top:.5rem">Mensile netto: <strong style="color:var(--tx)">${fmt(net/12)}</strong> Â· Accantona: <strong style="color:var(--or)">${fmt((taxAmount+inpsAmount)/12)}/mese</strong></div></div>`;
}

/* â”€â”€â”€ TRAVEL â”€â”€â”€ */
function renderTravel(){const grid=document.getElementById('travel-grid'),empty=document.getElementById('travel-empty');if(!grid)return;if(!S.travel.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';const ic={vacation:'ðŸ–ï¸',business:'ðŸ’¼',other:'ðŸ“¦'};grid.innerHTML=S.travel.map(t=>`<div class="gc"><div style="font-size:1.75rem;margin-bottom:.75rem">${ic[t.reason]||'âœˆï¸'}</div><div style="font-weight:700;margin-bottom:.25rem">${t.destination}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${fd(t.startDate)} â†’ ${fd(t.endDate)}</div><div style="font-size:.875rem">Budget: <strong>${fmt(t.budget)}</strong></div><div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editTrv('${t.id}')">Modifica</button><button class="btn bi bd bsm" onclick="deleteTrv('${t.id}')">ðŸ—‘</button></div></div>`).join('');}
async function saveTrv(){const id=document.getElementById('trv-id').value;const t={destination:document.getElementById('trv-dest').value.trim(),startDate:document.getElementById('trv-start').value,endDate:document.getElementById('trv-end').value,budget:parseFloat(document.getElementById('trv-budget').value)||0,reason:document.getElementById('trv-reason').value,updatedAt:new Date().toISOString()};if(!t.destination){toast('Inserisci destinazione','err');return;}if(id){await db.ref(`users/${UID}/travel/${id}`).update(t);}else{t.createdAt=new Date().toISOString();await db.ref(`users/${UID}/travel`).push(t);}cm('modal-travel');document.getElementById('trv-id').value='';toast('Salvato','ok');}
function editTrv(id){const t=S.travel.find(t=>t.id===id);if(!t)return;document.getElementById('trv-id').value=id;document.getElementById('trv-dest').value=t.destination;document.getElementById('trv-start').value=t.startDate||'';document.getElementById('trv-end').value=t.endDate||'';document.getElementById('trv-budget').value=t.budget||0;document.getElementById('trv-reason').value=t.reason||'vacation';om('modal-travel');}
async function deleteTrv(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/travel/${id}`).remove();toast('Eliminato','ok');}

/* â”€â”€â”€ REPORTS â”€â”€â”€ */
function renderReports(){const ae=S.transactions.filter(t=>t.type==='expense'),ai=S.transactions.filter(t=>t.type==='income');const te=ae.reduce((s,t)=>s+N(t.amount),0),ti=ai.reduce((s,t)=>s+N(t.amount),0);const rs=document.getElementById('rep-stats');if(rs)rs.innerHTML=`<div class="sc"><div class="sl">Totale entrate</div><div class="sv" style="color:var(--gr)">${fmt(ti)}</div></div><div class="sc"><div class="sl">Totale uscite</div><div class="sv" style="color:var(--re)">${fmt(te)}</div></div><div class="sc"><div class="sl">Saldo netto</div><div class="sv">${fmt(ti-te)}</div></div><div class="sc"><div class="sl">Transazioni</div><div class="sv">${S.transactions.length}</div></div>`;const cm2={};ae.forEach(t=>{cm2[t.category]=(cm2[t.category]||{count:0,total:0});cm2[t.category].count++;cm2[t.category].total+=N(t.amount);});const sorted=Object.entries(cm2).sort((a,b)=>b[1].total-a[1].total);const tbody=document.getElementById('rep-cat-tbody');if(tbody)tbody.innerHTML=sorted.map(([c,d])=>`<tr><td class="tdm">${CI[c]||'ðŸ“¦'} ${cap(c)}</td><td>${d.count}</td><td style="font-weight:700">${fmt(d.total)}</td><td>${te>0?Math.round((d.total/te)*100):0}%</td></tr>`).join('');}
function renderRepCharts(){
  const labs=[],inc=[],exp=[];for(let i=11;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const m=d.toISOString().slice(0,7);labs.push(d.toLocaleDateString('it-IT',{month:'short',year:'2-digit'}));const txM=S.transactions.filter(t=>t.date?.startsWith(m));inc.push(txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0));exp.push(txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0));}
  const o={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'var(--tx2)',font:{size:11}}}},scales:{x:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}}}};
  mkChart('ch-rep','line',{labels:labs,datasets:[{label:'Entrate',data:inc,borderColor:'var(--gr)',backgroundColor:'rgba(52,211,153,.1)',fill:true,tension:.4},{label:'Uscite',data:exp,borderColor:'var(--re)',backgroundColor:'rgba(238,68,68,.1)',fill:true,tension:.4}]},o);
  const cm2={};S.transactions.filter(t=>t.type==='expense').forEach(t=>{cm2[t.category]=(cm2[t.category]||0)+N(t.amount);});const cats=Object.entries(cm2).sort((a,b)=>b[1]-a[1]).slice(0,8);if(cats.length)mkChart('ch-rep-cat','bar',{labels:cats.map(([c])=>CI[c]+' '+cap(c)),datasets:[{label:'Spese',data:cats.map(([,v])=>v),backgroundColor:CC.slice(0,cats.length),borderRadius:6}]},{...o,indexAxis:'y',plugins:{legend:{display:false}}});
}

/* â”€â”€â”€ SCORE â”€â”€â”€ */
function renderScore(){
  const m=new Date().toISOString().slice(0,7),txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const totBal=S.accounts.reduce((s,a)=>s+N(a.balance),0),totDebt=S.debts.reduce((s,d)=>s+N(d.rem||d.remaining||0),0);
  const savR=inc>0?(inc-exp)/inc:0;let score=0;const details=[];
  const sS=Math.min(30,Math.round(savR*150));score+=sS;details.push({l:'Tasso risparmio',v:sS,max:30,color:'var(--gr)'});
  const bS=Object.keys(S.budgets[m]||{}).length>0?20:5;score+=bS;details.push({l:'Uso budget',v:bS,max:20,color:'var(--ac)'});
  const gS=S.goals.length>0?15:0;score+=gS;details.push({l:'Obiettivi attivi',v:gS,max:15,color:'var(--ac2)'});
  const balS=totBal>0?Math.min(20,Math.round((totBal/5000)*20)):0;score+=balS;details.push({l:'Saldo complessivo',v:balS,max:20,color:'var(--ye)'});
  const dS=totDebt>0?Math.max(0,15-Math.round((totDebt/50000)*15)):15;score+=dS;details.push({l:'Gestione debiti',v:dS,max:15,color:'var(--or)'});
  const pct=Math.min(100,score);const sn=document.getElementById('score-num');if(sn)sn.textContent=pct;
  const arc=document.getElementById('score-arc');if(arc){const c=2*Math.PI*45;arc.style.strokeDashoffset=c*(1-pct/100);arc.style.stroke=pct>=80?'var(--gr)':pct>=60?'var(--ye)':'var(--re)';}
  const sl=document.getElementById('score-label');if(sl)sl.textContent=pct>=80?'Eccellente ðŸ†':pct>=60?'Buono ðŸ‘':pct>=40?'Sufficiente âš ï¸':'Da migliorare ðŸ“‰';
  const sd=document.getElementById('score-desc');if(sd)sd.textContent='Basato su risparmio, budget, obiettivi e debiti';
  const sb=document.getElementById('score-bar');if(sb)sb.innerHTML=details.map(d=>`<div style="display:flex;align-items:center;gap:.75rem;font-size:.8rem;margin-bottom:.5rem"><div style="width:140px;color:var(--tx2);flex-shrink:0">${d.l}</div><div style="flex:1;height:5px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.round((d.v/d.max)*100)}%;background:${d.color};border-radius:3px"></div></div><div style="font-size:.75rem;font-weight:600;width:36px;text-align:right">${d.v}/${d.max}</div></div>`).join('');
  const tips=[];if(savR<.2)tips.push('ðŸ’¡ Cerca di risparmiare almeno il 20% delle entrate.');if(!S.budgets[m]||!Object.keys(S.budgets[m]).length)tips.push('ðŸ’¡ Imposta un budget per categoria.');if(!S.goals.length)tips.push('ðŸ’¡ Crea almeno un obiettivo di risparmio.');if(totDebt>0)tips.push(`ðŸ’¡ Hai ${fmt(totDebt)} di debito residuo â€” prioritÃ  alle rate costose.`);if(totBal<0)tips.push('âš ï¸ Saldo negativo â€” rivedi le spese urgentemente.');const st=document.getElementById('score-tips');if(st)st.innerHTML=tips.length?tips.map(t=>`<div style="padding:.75rem 0;border-bottom:1px solid var(--b1);font-size:.875rem;color:var(--tx2)">${t}</div>`).join(''):'<div style="color:var(--tx2);font-size:.875rem;padding:.5rem">Ottimo lavoro! ðŸŽ‰</div>';
}

/* â”€â”€â”€ MONTHLY â”€â”€â”€ */
function renderMonthly(){
  const y=monthlyDate.getFullYear(),mo=monthlyDate.getMonth(),mStr=`${y}-${String(mo+1).padStart(2,'0')}`;
  const mt=document.getElementById('monthly-title');if(mt)mt.textContent=new Date(y,mo,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const txM=S.transactions.filter(t=>t.date?.startsWith(mStr));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const days=new Date(y,mo+1,0).getDate();const avgDay=exp>0?exp/days:0;
  const dl=mo===new Date().getMonth()&&y===new Date().getFullYear()?new Date(y,mo+1,0).getDate()-new Date().getDate():0;
  const ms=document.getElementById('monthly-stats');if(ms)ms.innerHTML=`<div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div></div><div class="sc"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div></div><div class="sc"><div class="sl">Media/giorno</div><div class="sv" style="color:var(--ye)">${fmt(avgDay)}</div></div><div class="sc"><div class="sl">Proiezione</div><div class="sv" style="color:var(--or)">${fmt(exp+avgDay*dl)}</div><div style="font-size:.75rem;color:var(--tx2)">${dl>0?dl+' gg rimasti':'mese passato'}</div></div>`;
  const cats2={};txM.filter(t=>t.type==='expense').forEach(t=>{cats2[t.category]=(cats2[t.category]||0)+N(t.amount);});const sc2=Object.entries(cats2).sort((a,b)=>b[1]-a[1]);const maxC=sc2[0]?.[1]||1;
  const mc=document.getElementById('monthly-cats');if(mc)mc.innerHTML=sc2.length?sc2.map(([c,v])=>`<div style="margin-bottom:.75rem"><div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.3rem"><span>${CI[c]||'ðŸ“¦'} ${cap(c)}</span><span style="font-weight:700">${fmt(v)}</span></div><div class="pb"><div class="pf" style="width:${Math.round((v/maxC)*100)}%;background:var(--ac)"></div></div></div>`).join(''):'<div style="color:var(--tx3);font-size:.875rem;padding:1rem">Nessuna spesa</div>';
  const daily=Array(days).fill(0);txM.filter(t=>t.type==='expense').forEach(t=>{const d=parseInt(t.date?.split('-')[2])-1;if(d>=0&&d<days)daily[d]+=N(t.amount);});
  mkChart('ch-daily','bar',{labels:Array.from({length:days},(_,i)=>i+1),datasets:[{label:'Spese',data:daily,backgroundColor:'rgba(238,68,68,.6)',borderRadius:3}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'var(--tx3)',font:{size:9}}},y:{ticks:{color:'var(--tx3)'}}}}); 
}
function monthPrev(){monthlyDate.setMonth(monthlyDate.getMonth()-1);renderMonthly();}
function monthNext(){monthlyDate.setMonth(monthlyDate.getMonth()+1);renderMonthly();}

/* â”€â”€â”€ PROFILE PLAN â”€â”€â”€ */
async function renderProfilePlan(){
  const el=document.getElementById('plan-card');
  if(!el)return;
  try{
    const snap=await db.ref('config/plans').once('value');
    const plans=snap.val()?Object.values(snap.val()):[];
    const curPlan=plans.find(p=>p.id===(UP.plan||'free'))||plans[0]||{name:'Free',period:'per sempre',subtitle:'Per iniziare',price:0,features:[]};
    const pn=document.getElementById('prof-plan-name');
    const pp=document.getElementById('prof-plan-period');
    const pb=document.getElementById('prof-plan-badge');
    const ps=document.getElementById('prof-plan-subtitle');
    const pf=document.getElementById('prof-plan-features');
    if(pn)pn.textContent=curPlan.name||'Free';
    if(pp)pp.textContent=curPlan.period||'';
    if(pb){
      if(curPlan.price>0){
        pb.textContent=UP.subscriptionExpiry&&UP.subscriptionExpiry!=='never'?'ATTIVO':'ATTIVO';
        pb.style.background='rgba(52,211,153,.12)';pb.style.color='var(--gr)';
      } else {
        pb.textContent='GRATIS';
        pb.style.background='rgba(122,133,168,.12)';pb.style.color='var(--tx2)';
      }
    }
    if(ps)ps.textContent=curPlan.subtitle||'';
    if(pf)pf.innerHTML=(curPlan.features||[]).slice(0,6).map(f=>`<span style="font-size:.72rem;padding:.15rem .5rem;background:var(--bg3);border:1px solid var(--b1);border-radius:12px;color:var(--tx2)">${f.replace(/^[âŒâœ…âš ï¸âš¡]\s*/,'')}</span>`).join('');
  }catch(e){console.warn('Plan load:',e.message);}
}
/* â”€â”€â”€ NOTIFICATIONS (Firebase) â”€â”€â”€ */
let notifOff=null;
function subscribeNotifs(){
  if(notifOff)notifOff();
  notifOff=db.ref(`users/${UID}/notifications`).orderByChild('ts').limitToLast(100).on('value',snap=>{
    const raw=snap.val()||{};
    notifications=Object.entries(raw).map(([id,n])=>({id,...n})).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    updateNotifBadge();
    if(document.getElementById('view-notifications')?.classList.contains('active'))renderNotifications();
  });
}
function updateNotifBadge(){const unread=notifications.filter(n=>!n.read).length;const b=document.getElementById('notif-badge');if(b){b.textContent=unread;b.style.display=unread>0?'flex':'none';}const tb=document.getElementById('tab-notif-badge');if(tb){tb.textContent=unread;tb.style.display='';tb.classList.remove('pulse','visible');if(unread>0){tb.classList.add('visible');void tb.offsetWidth;tb.classList.add('pulse');}}}
async function addNotif(title,body,type='info'){if(!UID)return;await db.ref(`users/${UID}/notifications`).push({title,body,type,ts:new Date().toISOString(),read:false});}
function renderNotifications(){
  const list=document.getElementById('notif-list');if(!list)return;
  const pt=document.getElementById('notif-push-toggle');if(pt){const saved=localStorage.getItem('kz_notif_enabled');pt.checked=saved==='true';}
  const ps=document.getElementById('notif-push-status');
  if(ps){
    if(Notification.permission==='granted'){ps.textContent='âœ… Notifiche attive';ps.style.color='var(--gr)';}
    else if(Notification.permission==='denied'){ps.textContent='â›” Permesso negato';ps.style.color='var(--re)';}
    else{ps.textContent='âš ï¸ Attiva per ricevere notifiche';ps.style.color='var(--ye)';}
  }
  if(!notifications.length){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--tx3)">ðŸ”” Nessuna notifica</div>';return;}
  const IC={budget:'ðŸŽ¯',goal:'ðŸ†',recurring:'ðŸ”',invoice:'ðŸ§¾',info:'ðŸ’¡',system:'âš¡',reminder:'â°',paypal:'ðŸŸ¦'};
  list.innerHTML=notifications.map(n=>`<div onclick="readNotif('${n.id}')" style="display:flex;align-items:flex-start;gap:.875rem;padding:1rem;border-bottom:1px solid var(--b1);cursor:pointer;background:${n.read?'transparent':'rgba(239,68,68,.05)'}"><div style="width:36px;height:36px;border-radius:10px;background:var(--b1);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${IC[n.type]||'ðŸ’¡'}</div><div style="flex:1;min-width:0"><div style="font-size:.875rem;font-weight:${n.read?'500':'700'};color:${n.read?'var(--tx2)':'var(--tx)'};margin-bottom:.2rem">${n.title}</div><div style="font-size:.8rem;color:var(--tx3);line-height:1.4">${n.body}</div></div>${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--ac);flex-shrink:0;margin-top:4px"></div>':''}</div>`).join('');
}
async function readNotif(id){const n=notifications.find(n=>n.id===id);if(n&&!n.read){n.read=true;await db.ref(`users/${UID}/notifications/${id}`).update({read:true});updateNotifBadge();renderNotifications();}}
async function markAllRead(){if(!UID)return;const updates={};notifications.filter(n=>!n.read).forEach(n=>{updates[`users/${UID}/notifications/${n.id}/read`]=true;n.read=true;});if(Object.keys(updates).length){await db.ref().update(updates);}updateNotifBadge();renderNotifications();toast('Tutte lette','ok');}
function checkNotifAlerts(){
  const m=new Date().toISOString().slice(0,7),budgets=S.budgets[m]||{};
  const txM=S.transactions.filter(t=>t.date?.startsWith(m)&&t.type==='expense');
  Object.entries(budgets).forEach(([cat,b])=>{const spent=txM.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);if(spent/b.limit>0.9){const key=`budget_${cat}_${m}`;if(!localStorage.getItem(key)){addNotif(`âš ï¸ Budget ${cap(cat)} quasi esaurito`,`Speso ${fmt(spent)} di ${fmt(b.limit)} (${Math.round(spent/b.limit*100)}%)`, 'budget');localStorage.setItem(key,'1');}}});
  const soon=new Date();soon.setDate(soon.getDate()+7);
  S.recurring.forEach(r=>{if(r.nextDate&&new Date(r.nextDate)<=soon){const key=`rec_${r.id}_${r.nextDate}`;if(!localStorage.getItem(key)){addNotif(`ðŸ” Scadenza: ${r.name}`,`${fmt(r.amount)} scade il ${fd(r.nextDate)}`,'recurring');localStorage.setItem(key,'1');}}});
  S.goals.forEach(g=>{if(N(g.current||0)/N(g.target)>=1){const key=`goal_${g.id}`;if(!localStorage.getItem(key)){addNotif(`ðŸ† Obiettivo raggiunto!`,`Hai raggiunto "${g.name}"!`,'goal');localStorage.setItem(key,'1');}}});
}
function checkReminders(){
  const today=new Date();const todayStr=today.toISOString().slice(0,10);
  const dayKey=todayStr.replace(/-/g,'');
  // 24h inactivity reminder
  if(UP?.lastLogin){
    const last=new Date(UP.lastLogin);
    const diffH=(today-last)/(1000*60*60);
    if(diffH>24){const key=`rem_inactivity_${dayKey}`;if(!localStorage.getItem(key)){addNotif('â° InattivitÃ ','Non accedi da oltre 24 ore. Apri Axiom per non perdere aggiornamenti!','reminder');localStorage.setItem(key,'1');}}
  }
  // 24h before recurring
  const next24=new Date(today.getTime()+24*60*60*1000);
  S.recurring.forEach(r=>{
    if(r.nextDate){
      const nd=new Date(r.nextDate);
      if(nd>today&&nd<=next24){const key=`rem_rec_${r.id}_${r.nextDate}`;if(!localStorage.getItem(key)){addNotif(`â° ${r.name} in scadenza`,`${fmt(r.amount)} sarÃ  addebitato il ${fd(r.nextDate)}`,'reminder');localStorage.setItem(key,'1');}}
    }
  });
  // Goal reminders (start/mid/end)
  S.goals.forEach(g=>{
    if(!g.reminder)return;
    const ratio=N(g.current||0)/N(g.target||1);
    if(g.reminder==='start'&&ratio===0){const key=`rem_goal_start_${g.id}`;if(!localStorage.getItem(key)){addNotif(`â° Obiettivo: ${g.name}`,`Hai appena iniziato! Inizia a risparmiare per raggiungere ${fmt(g.target)}`,'reminder');localStorage.setItem(key,'1');}}
    if(g.reminder==='mid'&&ratio>=0.5&&ratio<0.9){const key=`rem_goal_mid_${g.id}`;if(!localStorage.getItem(key)){addNotif(`â° Obiettivo: ${g.name}`,`Sei a metÃ  strada (${Math.round(ratio*100)}%) â€” continua cosÃ¬!`,'reminder');localStorage.setItem(key,'1');}}
    if(g.reminder==='end'&&ratio>=0.9&&ratio<1){const key=`rem_goal_end_${g.id}`;if(!localStorage.getItem(key)){addNotif(`â° Obiettivo: ${g.name}`,`Quasi raggiunto (${Math.round(ratio*100)}%)! Ancora un piccolo sforzo!`,'reminder');localStorage.setItem(key,'1');}}
  });
}

/* â”€â”€â”€ PROFILE â”€â”€â”€ */
async function saveProfile(){const name=document.getElementById('prof-name')?.value.trim();if(!name){toast('Inserisci nome','err');return;}await db.ref(`users/${UID}/profile/name`).set(name);await auth.currentUser?.updateProfile({displayName:name});UP.name=name;const sn=document.getElementById('side-name');if(sn)sn.textContent=name;const paypal=document.getElementById('prof-paypal')?.value.trim()||'';if(paypal!==(UP.paypal||'')){await db.ref(`users/${UID}/profile/paypal`).set(paypal||null);UP.paypal=paypal||'';}toast('Profilo aggiornato','ok');}
async function changePass(){const pass=document.getElementById('prof-pass')?.value;if(!pass||pass.length<6){toast('Password min. 6 caratteri','err');return;}try{await auth.currentUser?.updatePassword(pass);toast('Password aggiornata','ok');document.getElementById('prof-pass').value='';}catch(e){toast('Rieffettua il login e riprova','err');}}

/* â”€â”€â”€ BACKUP â”€â”€â”€ */
function exportBackup(){const backup={version:2,exportedAt:new Date().toISOString(),user:{name:UP?.name,email:UP?.email},data:{transactions:S.transactions,accounts:S.accounts,budgets:S.budgets,goals:S.goals,recurring:S.recurring,invoices:S.invoices,travel:S.travel,transfers:S.transfers,debts:S.debts,quotes:S.quotes||[],suppliers:S.suppliers||[]}};const b=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`kazka-backup-${today()}.json`;a.click();toast('Backup esportato','ok');}
async function importBackup(e){const file=e.target.files[0];if(!file)return;try{const text=await file.text();const backup=JSON.parse(text);if(!backup.data){toast('File non valido','err');return;}if(!confirm(`Importare backup del ${fd(backup.exportedAt)}?`))return;const data=backup.data,ops={};if(data.accounts){const map={};data.accounts.forEach(a=>{const{id,...r}=a;map[id||db.ref().push().key]=r;});ops.accounts=map;}if(data.goals){const map={};data.goals.forEach(g=>{const{id,...r}=g;map[id||db.ref().push().key]=r;});ops.goals=map;}if(data.transactions){const map={};data.transactions.forEach(t=>{const{id,...r}=t;map[id||db.ref().push().key]=r;});ops.transactions=map;}if(data.budgets)ops.budgets=data.budgets;await db.ref(`users/${UID}`).update(ops);toast('Backup ripristinato!','ok');}catch(e){toast('Errore: '+e.message,'err');}e.target.value='';}

/* â”€â”€â”€ EXPORT â”€â”€â”€ */
/* BUG-12 FIX: CSV con quoting corretto per campi con separatori o virgolette */
function csvQuote(v){const s=String(v==null?'':v);if(s.includes(';')||s.includes('"')||s.includes('\n'))return'"'+s.replace(/"/g,'""')+'"';return s;}
function exportCSV(){
  const rows=[['Data','Descrizione','Tipo','Categoria','Conto','Importo','Valuta','Note']];
  const aN=id=>S.accounts.find(a=>a.id===id)?.name||'';
  S.transactions.forEach(t=>rows.push([t.date,t.description||'',t.type,t.category||'altro',aN(t.account),(t.type==='income'?'':'-')+N(t.amount).toFixed(2),t.currency||'EUR',t.note||'']));
  const b=new Blob(['ï»¿'+rows.map(r=>r.map(csvQuote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kazka-tx.csv';a.click();
}
function exportCSVmonthly(){
  const m=new Date().toISOString().slice(0,7);
  const rows=[['Data','Descrizione','Tipo','Categoria','Conto','Importo','Valuta','Note']];
  const aN=id=>S.accounts.find(a=>a.id===id)?.name||'';
  S.transactions.filter(t=>t.date?.startsWith(m)).forEach(t=>rows.push([t.date,t.description||'',t.type,t.category||'altro',aN(t.account),(t.type==='income'?'':'-')+N(t.amount).toFixed(2),t.currency||'EUR',t.note||'']));
  const b=new Blob(['ï»¿'+rows.map(r=>r.map(csvQuote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`kazka-tx-${m}.csv`;a.click();
}
async function exportPDF(){
  try{await loadJsPDF();}catch(e){toast('Errore caricamento libreria PDF','err');return;}
  try{const{jsPDF}=window.jspdf;const doc=new jsPDF();doc.setFontSize(20);doc.text('Axiom â€” Report',14,22);doc.setFontSize(9);doc.setTextColor(120);doc.text(new Date().toLocaleDateString('it-IT'),14,30);doc.setTextColor(0);const ti=S.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),te=S.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);doc.setFontSize(11);doc.text('Riepilogo',14,42);doc.setFontSize(9);doc.text(`Entrate: ${fmt(ti)}`,14,52);doc.text(`Uscite: ${fmt(te)}`,14,60);doc.text(`Netto: ${fmt(ti-te)}`,14,68);let y=85;doc.setFontSize(10);doc.text('Ultime transazioni',14,78);S.transactions.slice(0,20).forEach(t=>{if(y>270){doc.addPage();y=20;}doc.setFontSize(8);doc.text(t.date||'â€”',14,y);doc.text((t.description||'â€”').slice(0,35),40,y);doc.text(`${t.type==='income'?'+':'-'}${fmt(t.amount)}`,160,y);y+=7;});doc.save('axiom-report.pdf');toast('PDF esportato','ok');}catch(e){toast('Errore PDF','err');}}

/* â”€â”€â”€ BACKUP REMINDER â”€â”€â”€ */
function checkBackupReminder(){
  const last=localStorage.getItem('kz_last_backup');
  if(last&&Date.now()-parseInt(last)<2592000000)return;
  setTimeout(()=>{if(!document.querySelector('.view.active')||document.querySelector('.view.active')?.id==='view-dashboard'){toast('ðŸ“¦ Non dimenticare il backup! Vai in Profilo â†’ Export','warn');localStorage.setItem('kz_last_backup',String(Date.now()));}},5000);
}
/* â”€â”€â”€ EXCHANGE RATES â”€â”€â”€ */
let rates={EUR:1,USD:1.08,CHF:0.96,GBP:0.86};
async function fetchRates(){const ls=localStorage.getItem('kz_rates_ts');if(ls&&Date.now()-parseInt(ls)<3600000)return;try{const r=await fetch('https://api.exchangerate-api.com/v4/latest/EUR');if(!r.ok)return;const d=await r.json();rates={EUR:1,USD:d.rates.USD,CHF:d.rates.CHF,GBP:d.rates.GBP};localStorage.setItem('kz_rates_ts',String(Date.now()));}catch(e){}}

/* â”€â”€â”€ BUG-09 FIX: funzioni mancanti referenziate dai test â”€â”€â”€ */
/* Multi-currency conversion */
function convertCurrency(amount,from,to){
  const base=N(amount)/(rates[from]||1);
  return (base*(rates[to]||1)).toFixed(2);
}
/* AI category suggestion (keyword-based fallback) */
function aiSuggestCategory(description){
  if(!description)return'altro';
  const d=(description||'').toLowerCase();
  const map={alimentari:['supermercato','coop','esselunga','iper','lidl','penny','spesa','pane','frutta'],trasporti:['benzina','carburante','treno','bus','metro','taxi','uber','autostrada','parcheggio','pedaggio'],casa:['affitto','mutuo','utenze','enel','gas','acqua','luce','condominio'],salute:['farmacia','medico','dentista','occhiali','palestra','sport'],svago:['cinema','ristorante','bar','caffÃ¨','pizza','sushi','teatro','netflix','spotify'],lavoro:['ufficio','software','hardware','corso','formazione','abbonamento'],abbonamenti:['netflix','spotify','amazon','apple','google','microsoft','abbonamento'],istruzione:['libri','universitÃ ','scuola','corso','lezioni'],viaggi:['hotel','volo','aereo','airbnb','vacanza','booking'],altro:[]};
  for(const[cat,kws]of Object.entries(map)){if(kws.some(k=>d.includes(k)))return cat;}
  return'altro';
}
/* Audit log (scrive su Firebase per gli admin) */
async function auditLog(action,details){
  if(!UID)return;
  try{await db.ref(`users/${UID}/auditLog`).push({action,details:details||{},ts:new Date().toISOString(),uid:UID});}catch(e){}
}
/* Carica categorie personalizzate */
function loadCustomCats(){
  return(S.categories||[]).map(c=>({name:c.name,icon:c.icon,type:c.type}));
}
/* Carica soglie di notifica */
function loadThresholds(){
  try{return JSON.parse(localStorage.getItem('kz_thresholds')||'[]');}catch{return[];}
}
/* Salva soglie di notifica */
function saveThresholds(arr){
  localStorage.setItem('kz_thresholds',JSON.stringify(arr||[]));
  toast('Soglie salvate','ok');
}
/* backupAllData: alias di exportBackup per compatibilitÃ  test */
function backupAllData(){return exportBackup();}

/* â”€â”€â”€ HELPERS â”€â”€â”€ */
function populateSels(){const opts=S.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')||'<option value="">Nessun conto</option>';const el=document.getElementById('tx-acc');if(el)el.innerHTML=opts;}
function loadScript(url){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=url;s.onload=()=>res();s.onerror=rej;document.head.appendChild(s);});}
function loadChartJS(){return window.Chart?Promise.resolve():loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js');}
function loadJsPDF(){return window.jspdf?.jsPDF?Promise.resolve():loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');}
function mkChart(id,type,data,options){const canvas=document.getElementById(id);if(!canvas)return;loadChartJS().then(()=>{if(charts[id])charts[id].destroy();charts[id]=new Chart(canvas,{type,data,options});}).catch(()=>{});}
function om(id){const el=document.getElementById(id);if(el){el.style.display='flex';el.classList.add('open');}}
function cm(id){const el=document.getElementById(id);if(el){el.style.display='none';el.classList.remove('open');}}
/* BUG-17 FIX: non chiudere il modal durante operazioni di salvataggio in corso */
let _modalSaving=false;
document.addEventListener('click',e=>{
  if(e.target.classList.contains('mo')&&!_modalSaving){
    e.target.style.display='none';
    e.target.classList.remove('open');
  }
});
function setModalSaving(v){_modalSaving=v;}
function fmt(v){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(N(v));}
function fd(d){if(!d)return'â€”';try{return new Date(d).toLocaleDateString('it-IT');}catch{return d;}}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function today(){return new Date().toISOString().split('T')[0];}
function N(v){return Number(v)||0;}
function showErr(el,msg){if(el){el.textContent=msg;el.style.display='block';}}
function toast(msg,type='ok',dur){const t=document.getElementById('toast');if(!t)return;t.innerHTML=`<span>${{ok:'âœ“',err:'âœ•',warn:'âš '}[type]||'â„¹'}</span> ${msg}`;t.className='toast '+type+' show';clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),dur||3500);}
function ferr(c){const m={'auth/user-not-found':'Email non trovata','auth/wrong-password':'Password errata','auth/email-already-in-use':'Email giÃ  registrata','auth/weak-password':'Password troppo corta (min. 6)','auth/invalid-email':'Email non valida','auth/too-many-requests':'Troppi tentativi â€” riprova piÃ¹ tardi','auth/invalid-credential':'Credenziali non valide','auth/network-request-failed':'Errore di rete â€” controlla la connessione','auth/popup-blocked':'Popup bloccato â€” consenti i popup per questo sito','auth/cancelled-popup-request':'Accesso annullato','auth/popup-closed-by-user':'Finestra chiusa â€” riprova','auth/timeout':'Connessione scaduta â€” riprova','auth/account-exists-with-different-credential':'Email giÃ  usata con un altro metodo di accesso','auth/unauthorized-domain':'Dominio non autorizzato â€” aggiungi questo dominio in Firebase Console â†’ Authentication â†’ Settings â†’ Authorized domains','auth/operation-not-allowed':'Accesso Google non abilitato â€” abilitalo in Firebase Console â†’ Authentication â†’ Sign-in method'};return m[c]||'Errore â€” riprova';}

/* â•â• ADMIN PANEL â•â• */
let allUsers=[];
let adminLoaded=false;
function loadAdminData(){
  if(UP?.role!=='admin')return;
  db.ref('users').on('value',snap=>{
    const raw=snap.val()||{};
    allUsers=Object.entries(raw).map(([uid,v])=>({uid,...v}));
    if(adminLoaded)renderAdmin();
    adminLoaded=true;
  });
}
function renderAdmin(){
  if(!adminLoaded)return;
  const q=(document.getElementById('adm-search')?.value||'').toLowerCase();
  let ul=allUsers.filter(u=>{const p=u.profile||{};return q===''||(p.name||'').toLowerCase().includes(q)||(p.email||'').toLowerCase().includes(q)||(p.role||'').includes(q);}).sort((a,b)=>(b.profile?.createdAt||'').localeCompare(a.profile?.createdAt||''));
  const kpi=document.getElementById('adm-kpi');
  if(kpi)kpi.innerHTML=`<div class="adm-c"><div class="sl">Utenti totali</div><div class="adm-cv">${allUsers.length}</div></div><div class="adm-c"><div class="sl">Piani a pagamento</div><div class="adm-cv" style="color:var(--gr)">${allUsers.filter(u=>u.profile?.plan&&u.profile.plan!=='free').length}</div></div><div class="adm-c"><div class="sl">Admin</div><div class="adm-cv" style="color:var(--ac)">${allUsers.filter(u=>u.profile?.role==='admin').length}</div></div>`;
  const tb=document.getElementById('adm-tbody');
  if(!tb)return;
  const planIcons={free:'ðŸ”µ',pro:'ðŸŸ¢',business:'ðŸŸ ',lifetime:'ðŸ’Ž'};
  tb.innerHTML=ul.map(u=>{
    const p=u.profile||{};
    const ini=(p.name||p.email||'?').charAt(0).toUpperCase();
    return`<tr><td class="tdm"><div style="display:flex;align-items:center;gap:.5rem"><div style="width:28px;height:28px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#fff;flex-shrink:0">${ini}</div>${p.name||'â€”'}</div></td><td style="font-size:.82rem">${p.email||'â€”'}</td><td><select class="btn bs bsm" style="padding:.3rem .5rem;font-size:.75rem" onchange="saveUserRow('${u.uid}')" id="uplan_${u.uid}"><option value="free" ${p.plan==='free'?'selected':''}>ðŸ”µ Free</option><option value="pro" ${p.plan==='pro'?'selected':''}>ðŸŸ¢ Pro</option><option value="business" ${p.plan==='business'?'selected':''}>ðŸŸ  Business</option><option value="lifetime" ${p.plan==='lifetime'?'selected':''}>ðŸ’Ž Lifetime</option></select></td><td><select class="btn bs bsm" style="padding:.3rem .5rem;font-size:.75rem" onchange="saveUserRow('${u.uid}')" id="urole_${u.uid}"><option value="user" ${p.role==='user'?'selected':''}>ðŸ‘¤ User</option><option value="admin" ${p.role==='admin'?'selected':''}>ðŸ‘‘ Admin</option></select></td><td style="font-size:.78rem">${fd(p.createdAt)}</td><td style="font-size:.78rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.adminNotes||''}</td><td><button class="btn bi bs bsm" onclick="impersonate('${u.uid}')" title="Vedi come utente">ðŸ‘ï¸</button><button class="btn bi bs bsm" onclick="setAdminNotes('${u.uid}')" title="Annotazioni">ðŸ“</button></td></tr>`;
  }).join('');
}
async function saveUserRow(uid){
  const plan=document.getElementById('uplan_'+uid)?.value;
  const role=document.getElementById('urole_'+uid)?.value;
  const updates={};
  if(plan)updates['profile/plan']=plan;
  if(role)updates['profile/role']=role;
  await db.ref(`users/${uid}`).update(updates);
  const i=allUsers.findIndex(u=>u.uid===uid);
  if(i>=0){if(!allUsers[i].profile)allUsers[i].profile={};if(plan)allUsers[i].profile.plan=plan;if(role)allUsers[i].profile.role=role;}
  if(uid===UID){
    if(role)UP.role=role;
    if(plan)UP.plan=plan;
    showAdminNav();
  }
  toast('âœ… Utente aggiornato','ok');
}
function showAdminNav(){
  const el=document.getElementById('nav-admin');
  if(el)el.style.display=UP?.role==='admin'?'flex':'none';
}
function impersonate(uid){
  if(!confirm('Vedere l\'app come questo utente? (sola lettura)'))return;
  toast('Funzione in sviluppo','warn');
}
function setAdminNotes(uid){
  const p=allUsers.find(u=>u.uid===uid)?.profile||{};
  const notes=prompt('Note amministrative:',p.adminNotes||'');
  if(notes!==null)db.ref(`users/${uid}/profile/adminNotes`).set(notes).then(()=>{toast('Note salvate','ok');renderAdmin();});
}
async function exportAllBackup(){
  if(!confirm('Esportare backup completo del database?'))return;
  const snap=await db.ref().once('value');
  const b=new Blob([JSON.stringify(snap.val(),null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`kazka-full-backup-${today()}.json`;a.click();
  toast('Backup esportato','ok');
}
/* â•â• FAB â•â• */
let fabOpen=false;
function toggleFabMenu(e){if(e)e.stopPropagation();const m=document.getElementById('fab-menu');if(!m)return;fabOpen=!fabOpen;m.classList.toggle('show',fabOpen);if(fabOpen)buildFabMenu();haptic('light');}
document.addEventListener('click',e=>{if(fabOpen&&!e.target.closest('.fab')&&!e.target.closest('.fab-m')){document.getElementById('fab-menu')?.classList.remove('show');fabOpen=false;}});
function buildFabMenu(){
  const m=document.getElementById('fab-menu');if(!m)return;
  const views=[
    {v:'transactions',label:'ðŸ’¸ Transazione',fn:'om(\'modal-tx\')'},
    {v:'accounts',label:'ðŸ¦ Conto',fn:'om(\'modal-acc\')'},
    {v:'budget',label:'ðŸŽ¯ Budget',fn:'om(\'modal-budget\')'},
    {v:'goals',label:'ðŸ† Obiettivo',fn:'om(\'modal-goal\')'},
    {v:'recurring',label:'ðŸ” Ricorrente',fn:'om(\'modal-rec\')'},
    {v:'debts',label:'ðŸ’³ Debito',fn:'om(\'modal-debt\')'},
    {v:'invoices',label:'ðŸ§¾ Fattura',fn:'om(\'modal-inv\')'},
    {v:'quotes',label:'ðŸ“‹ Preventivo',fn:'om(\'modal-quote\')'},
    {v:'suppliers',label:'ðŸ¢ Fornitore',fn:'om(\'modal-sup\')'},
    {v:'travel',label:'âœˆï¸ Viaggio',fn:'om(\'modal-travel\')'},
    {v:'groups',label:'ðŸ«‚ Gruppo',fn:'om(\'modal-group\')'},
    {v:'projects',label:'ðŸ“ Progetto',fn:'om(\'modal-project\')'},
    {v:'portfolio',label:'ðŸ“ˆ Asset',fn:'om(\'modal-asset\')'},
    {v:'insurance',label:'ðŸ›¡ï¸ Assicurazione',fn:'om(\'modal-insurance\')'},
  ];
  const av=document.querySelector('.view.active');
  const id=av?.id?.replace('view-','')||'';
  const matched=views.filter(x=>x.v===id||(id==='portfolio'&&x.v==='portfolio'));
  if(matched.length){
    m.innerHTML=matched.slice(0,6).map(x=>`<button class="fab-mi" onclick="cm('fab-menu');fabOpen=false;${x.fn}">${x.label}</button>`).join('');
  } else {
    // default rapid actions
    m.innerHTML=[
      {l:'ðŸ’¸ Transazione',fn:'om(\'modal-tx\')'},
      {l:'ðŸ¦ Conto',fn:'om(\'modal-acc\')'},
      {l:'ðŸŽ¯ Budget',fn:'om(\'modal-budget\')'},
      {l:'ðŸ† Obiettivo',fn:'om(\'modal-goal\')'},
    ].map(x=>`<button class="fab-mi" onclick="cm('fab-menu');fabOpen=false;${x.fn}">${x.l}</button>`).join('');
  }
}
/* â•â• SYNC INDICATOR â•â• */
function initSyncIndicator(){
  const dot=document.getElementById('sync-dot');if(!dot)return;
  let connected=true;
  db.ref('.info/connected').on('value',snap=>{
    connected=snap.val()===true;
    dot.className=connected?'sync-ok':'sync-err';
    dot.title=connected?'Connesso':'Disconnesso';
  });
  // Listen for any write operation to show syncing
  let syncTimer=null;
  const origPush=firebase.database.Reference.prototype.push;
  firebase.database.Reference.prototype.push=function(...args){
    // Only intercept push with data (creates network write); push() with no args just creates a ref
    if(!args.length||args[0]===undefined)return origPush.apply(this,args);
    dot.className='sync-syncing';dot.title='Salvataggio...';
    clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(dot.className==='sync-syncing'){dot.className='sync-err';dot.title='Timeout';}},10000);
    const result=origPush.apply(this,args);
    Promise.resolve(result).then(()=>{dot.className='sync-ok';dot.title='Connesso';clearTimeout(syncTimer);}).catch(()=>{dot.className='sync-err';dot.title='Errore';clearTimeout(syncTimer);});
    return result;
  };
  ['set','update','remove'].forEach(method=>{
    const orig=firebase.database.Reference.prototype[method];
    firebase.database.Reference.prototype[method]=function(...args){
      dot.className='sync-syncing';dot.title='Salvataggio...';
      clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(dot.className==='sync-syncing'){dot.className='sync-err';dot.title='Timeout';}},10000);
      const result=orig.apply(this,args);
      result.then(()=>{dot.className='sync-ok';dot.title='Connesso';clearTimeout(syncTimer);}).catch(()=>{dot.className='sync-err';dot.title='Errore';clearTimeout(syncTimer);});
      return result;
    };
  });
}
/* â•â• PWA INSTALL â•â• */
let pwaDeferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();pwaDeferredPrompt=e;
  if(!localStorage.getItem('kz_pwa_dismissed'))document.getElementById('pwa-banner').style.display='block';
});
window.addEventListener('appinstalled',()=>{document.getElementById('pwa-banner').style.display='none';localStorage.removeItem('kz_pwa_dismissed');toast('âœ… Axiom installata!','ok');});
function installPWA(){
  if(!pwaDeferredPrompt){
    // fallback: mostra le istruzioni
    toast('ðŸ“² Apri in Chrome â†’ â‹¯ â†’ Installa app (o Aggiungi alla Home)','warn',5000);
    return;
  }
  pwaDeferredPrompt.prompt();
  pwaDeferredPrompt.userChoice.then(()=>{pwaDeferredPrompt=null;document.getElementById('pwa-banner').style.display='none';localStorage.removeItem('kz_pwa_dismissed');});
}
// Retry banner after 5s if beforeinstallprompt hasn't fired
setTimeout(()=>{
  if(pwaDeferredPrompt&&!localStorage.getItem('kz_pwa_dismissed')){
    const b=document.getElementById('pwa-banner');
    if(b&&b.style.display!=='block')b.style.display='block';
  }
},5000);
function dismissPWA(){document.getElementById('pwa-banner').style.display='none';localStorage.setItem('kz_pwa_dismissed','1');}
/* â•â• INIT â•â• */
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(initScrollAnimations, 500);
  applyTheme(theme);
  const dateFields=['tx-date','rec-next','inv-date','trv-start','ge-date','tr-date'];
  dateFields.forEach(id=>{const el=document.getElementById(id);if(el)el.value=today();});
  renderCalendar();
  updateNotifBadge();
});


/* â•â• DASHBOARD WIDGETS â•â• */
function updateDashWidgets(){
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const recTot=S.recurring.reduce((s,r)=>{const f={weekly:4.33,monthly:1,quarterly:1/3,yearly:1/12}[r.frequency]||1;return s+N(r.amount)*f;},0);
  const debtR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  /* Soldi Liberi = saldo conto principale âˆ’ impegni */
  if(!mainAccId||!S.accounts.find(a=>a.id===mainAccId))mainAccId=S.accounts[0]?.id||'';
  const main=S.accounts.find(a=>a.id===mainAccId);
  const mBal=main?N(main.balance):0;
  const budgets=S.budgets[m]||{};const alloc=Object.values(budgets).reduce((s,b)=>s+N(b.limit),0);
  const free=mBal-(alloc+recTot+debtR);
  const wfm=document.getElementById('w-freemoney');
  if(wfm){animateValue(wfm,Math.max(0,free),500);wfm.style.color=free>=0?'var(--gr)':'var(--re)';wfm.style.animation='numberCount .4s ease forwards';}
  // Next N days expenses forecast
  const today2=new Date();
  const inN=new Date();inN.setDate(inN.getDate()+forecastDays);
  const future=recTot*1+debtR;
  const n30=document.getElementById('w-next30');if(n30){animateValue(n30,future+exp,500);n30.style.animation='numberCount .4s ease forwards';}
  const n30sub=document.getElementById('w-next30-sub');
  if(n30sub){
    const rc=S.recurring.length||0,db=S.debts.length||0,tot=rc+db;
    n30sub.textContent=tot>0?`${tot} spese in ${forecastDays}gg`:`nessuna spesa nei prossimi ${forecastDays}gg`;
  }
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
        <div style="font-size:.72rem;color:var(--tx3)">Fine: <strong>${monthsLeft>0?monthsLeft+' mesi':'â€”'}</strong></div>
      </div>`;
    }).join('');
  } else if(drow) drow.style.display='none';
  // Budget alert
  const bAlert=document.getElementById('dash-balert')||document.createElement('div');
  bAlert.id='dash-balert';
  const m2=new Date().toISOString().slice(0,7);
  const b2=S.budgets[m2]||{};
  const txM2=S.transactions.filter(t=>t.date?.startsWith(m2)&&t.type==='expense');
  const nearLim=Object.entries(b2).filter(([cat,b])=>{const spent=txM2.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);const pct=spent/b.limit*100;return pct>=75&&pct<100;}).map(([cat,b])=>{const spent=txM2.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);const pct=Math.round(spent/b.limit*100);return{cat,spent,limit:b.limit,pct};});
  const over=Object.entries(b2).filter(([cat,b])=>{const spent=txM2.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);return spent>=b.limit;}).map(([cat,b])=>{const spent=txM2.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);return{cat,spent,limit:b.limit,pct:100};});
  if(nearLim.length||over.length){
    bAlert.style.display='block';bAlert.style.marginBottom='1rem';
    let html='';
    if(over.length)html+=over.map(o=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:rgba(238,68,68,.1);border:1px solid rgba(238,68,68,.3);border-radius:var(--rs);margin-bottom:.35rem"><span style="font-size:1.1rem">ðŸš¨</span><div style="flex:1;font-size:.82rem"><strong>${CI[o.cat]||'ðŸ“¦'} ${cap(o.cat)}</strong> â€” superato! ${fmt(o.spent)} / ${fmt(o.limit)}</div></div>`).join('');
    if(nearLim.length)html+=nearLim.map(n=>`<div style="display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);border-radius:var(--rs);margin-bottom:.35rem"><span style="font-size:1.1rem">âš ï¸</span><div style="flex:1;font-size:.82rem"><strong>${CI[n.cat]||'ðŸ“¦'} ${cap(n.cat)}</strong> al ${n.pct}% â€” ${fmt(n.spent)} / ${fmt(n.limit)}</div></div>`).join('');
    bAlert.innerHTML=html;
    const dw=document.getElementById('dash-widgets');
    if(dw&&dw.parentElement&&!document.getElementById('dash-balert').parentElement)dw.parentElement.insertBefore(bAlert,dw.nextSibling);
  }else{bAlert.style.display='none';}
}

/* â•â• PROJECTS â•â• */
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
        <div style="font-size:1.5rem">${p.icon||'ðŸ“'}</div>
        ${daysLeft!==null?`<span class="badge ${daysLeft<=0?'bg-re':daysLeft<=7?'bg-ye':'bg-gy'}">${daysLeft<=0?'Scaduto':daysLeft+'gg'}</span>`:''}
      </div>
      <div style="font-weight:700;font-size:.95rem;margin-bottom:.2rem">${p.name}</div>
      <div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">${p.description||''}</div>
      <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.35rem">
        <span>Speso: <strong>${fmt(spent)}</strong></span>
        ${budget>0?`<span style="color:${color}"><strong>${pct}%</strong> di ${fmt(budget)}</span>`:'<span style="color:var(--tx3)">nessun budget</span>'}
      </div>
      ${budget>0?`<div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div>`:''}
      <div style="font-size:.72rem;color:var(--tx3);margin-top:.5rem">${items.length} voci Â· ${fd(p.startDate)} â†’ ${fd(p.endDate)}</div>
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
  document.getElementById('pd-title').textContent=`${p.icon||'ðŸ“'} ${p.name}`;
  const items=p.items||[];
  const spent=items.reduce((s,i)=>s+N(i.amount),0);
  const budget=N(p.budget||0);
  const pct=budget>0?Math.min(100,Math.round((spent/budget)*100)):0;
  const color=pct>=90?'var(--re)':pct>=70?'var(--ye)':'var(--gr)';
  document.getElementById('pd-sub').textContent=`${items.length} voci Â· Budget: ${fmt(budget)} Â· Speso: ${fmt(spent)}`;
  const ps=document.getElementById('pd-stats');
  if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Budget</div><div class="sv">${fmt(budget)}</div></div><div class="sc"><div class="sl">Speso</div><div class="sv" style="color:${color}">${fmt(spent)}</div></div><div class="sc"><div class="sl">Rimanente</div><div class="sv" style="color:${budget-spent>=0?'var(--gr)':'var(--re)'}">${fmt(budget-spent)}</div></div><div class="sc"><div class="sl">Voci</div><div class="sv">${items.length}</div></div>`;
  const pp=document.getElementById('pd-progress');
  if(pp)pp.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.5rem"><span>${pct}% utilizzato</span><span style="color:${color};font-weight:700">${fmt(spent)} / ${fmt(budget)}</span></div><div class="pb" style="height:10px"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="font-size:.8rem;color:var(--tx2);margin-top:.5rem">${budget-spent>=0?'Rimanente: '+fmt(budget-spent):'Sforamento: '+fmt(spent-budget)}</div>`;
  // Category breakdown
  const cats={};items.forEach(i=>{cats[i.cat]=(cats[i.cat]||0)+N(i.amount);});
  const sc=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const mc=sc[0]?.[1]||1;
  const CATS={materiali:'ðŸ§±',manodopera:'ðŸ”¨',trasporti:'ðŸš—',professioni:'ðŸ‘·',permessi:'ðŸ“‹',altro:'ðŸ“¦',alimentari:'ðŸ›’',casa:'ðŸ ',svago:'ðŸŽ¬',lavoro:'ðŸ’¼'};
  const pc=document.getElementById('pd-cats');
  if(pc)pc.innerHTML=sc.length?sc.map(([c,v])=>`<div style="margin-bottom:.6rem"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.25rem"><span>${CATS[c]||'ðŸ“¦'} ${cap(c)}</span><span style="font-weight:600">${fmt(v)}</span></div><div class="pb" style="height:4px"><div class="pf" style="width:${Math.round((v/mc)*100)}%;background:var(--ac)"></div></div></div>`).join(''):'<div style="color:var(--tx3);font-size:.8rem">Nessuna categoria</div>';
  // Items table
  const tbody=document.getElementById('pd-tbody'),pempty=document.getElementById('pd-empty');
  if(!tbody)return;
  const sorted=[...items].sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!sorted.length){tbody.innerHTML='';if(pempty)pempty.style.display='block';}
  else{if(pempty)pempty.style.display='none';tbody.innerHTML=sorted.map((i,idx)=>`<tr><td style="font-size:.82rem">${fd(i.date)}</td><td class="tdm">${i.description||'â€”'}</td><td><span class="badge bg-gy">${cap(i.cat||'altro')}</span></td><td><span class="badge ${i.fromTx?'bg-bl':'bg-pu'}">${i.fromTx?'Transazione':'Manuale'}</span></td><td style="font-weight:700;color:var(--re)">${fmt(i.amount)}</td><td><button class="btn bi bd bsm" onclick="deleteProjItem('${pid}',${i._idx||idx})">ðŸ—‘</button></td></tr>`).join('');}
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
  list.innerHTML=tx.slice(0,30).map(t=>`<label style="display:flex;align-items:center;gap:.75rem;padding:.65rem 1rem;border-bottom:1px solid var(--b1);cursor:pointer;font-size:.875rem"><input type="checkbox" class="plnk-cb" value="${t.id}" style="width:15px;height:15px;accent-color:var(--ac);flex-shrink:0"><div style="flex:1"><div style="font-weight:500">${t.description||'â€”'}</div><div style="font-size:.72rem;color:var(--tx3)">${fd(t.date)} Â· ${cap(t.category||'altro')}</div></div><div style="font-weight:700;color:var(--re)">-${fmt(t.amount)}</div></label>`).join('')||'<div style="padding:1rem;text-align:center;color:var(--tx3)">Nessuna transazione trovata</div>';
}

async function linkSelectedTx(){
  const pid=currentProjId;if(!pid)return;
  const checked=[...document.querySelectorAll('.plnk-cb:checked')].map(cb=>cb.value);
  if(!checked.length){toast('Seleziona almeno una transazione','warn');return;}
  const p=S.projects?.find(pr=>pr.id===pid);
  const items=[...(p?.items||[])];
  checked.forEach(txId=>{const t=S.transactions.find(t=>t.id===txId);if(t)items.push({description:t.description||'â€”',amount:N(t.amount),date:t.date,cat:t.category||'altro',note:t.note||'',deduct:true,fromTx:true,txId,createdAt:new Date().toISOString()});});
  await db.ref(`users/${UID}/projects/${pid}/items`).set(items);
  cm('modal-proj-link');toast(`${checked.length} transazioni associate`,'ok');openProject(pid);
}

/* â•â• GROUPS SEARCH & EXPIRY â•â• */
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
      db.ref(`groups/${gid}`).remove().then(()=>{toast(`Gruppo "${info.name}" auto-eliminato â€” saldi a zero`,'ok');});
    }
  });
}

/* Override renderGroups to add search and expiry */
function renderGroups(){
  const el=document.getElementById('groups-list'),empty=document.getElementById('groups-empty');
  if(!el)return;
  let entries=Object.entries(S.groups);
  if(grpSearchQ)entries=entries.filter(([,g])=>{const info=g.info||{};return(info.name||'').toLowerCase().includes(grpSearchQ)||Object.values(g.members||{}).some(m=>(m.name||m.email||'').toLowerCase().includes(grpSearchQ));});
  if(!entries.length){el.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  el.innerHTML=`<div class="gg">${entries.map(([gid,g],idx)=>{
    const info=g.info||{};const mC=Object.keys(g.members||{}).length;const tot=Object.values(g.expenses||{}).reduce((s,e)=>s+N(e.amount),0);
    const hasExpiry=info.expiry;const expDays=hasExpiry?Math.ceil((new Date(info.expiry)-new Date())/864e5):null;
    return`<div class="gc e-fade e-d${Math.min(idx+1,8)}" style="cursor:pointer" onclick="openGroup('${gid}')">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="font-size:1.5rem">${info.icon||'ðŸ‘¥'}</div>
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
  /* BUG-20 FIX: valida formato email prima di aggiungere al gruppo */
  const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails=membersRaw.split(',').map(m=>m.trim()).filter(m=>m&&!emailRe.test(m));
  if(invalidEmails.length){toast(`Email non valide: ${invalidEmails.join(', ')}`, 'err');return;}
  membersRaw.split(',').map(m=>m.trim()).filter(m=>m&&emailRe.test(m)).forEach((email,i)=>{members['g'+i]={email,name:email,pending:true,joinedAt:new Date().toISOString()};});
  await db.ref(`groups/${gid}`).set({info:{name,description:document.getElementById('grp-desc').value.trim(),icon:document.getElementById('grp-icon').value,expiry,autoDelete:true,createdBy:UID,createdAt:new Date().toISOString()},members});
  cm('modal-group');toast('Gruppo creato!','ok');
}

/* â•â• SUBSCRIBE PROJECTS â•â• */


/* Open project modal - populate account select */
/* BUG-13 FIX: merged into main DOMContentLoaded listener above */
(function(){
  function attachPtxDeduct(){
    document.querySelectorAll('input[name="ptx-deduct"]').forEach(r=>{
      r.addEventListener('change',()=>{
        const row=document.getElementById('ptx-account-row');
        if(row)row.style.display=r.value==='yes'?'block':'none';
      });
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachPtxDeduct);
  else attachPtxDeduct();
})();

/* â•â• COOKIE BANNER â•â• */
function initCookies(){if(!localStorage.getItem('kz_cookies'))document.getElementById('app-cookie-banner').style.display='block';}
function acceptAppCookies(){localStorage.setItem('kz_cookies','all');document.getElementById('app-cookie-banner').style.display='none';}
function declineAppCookies(){localStorage.setItem('kz_cookies','minimal');document.getElementById('app-cookie-banner').style.display='none';}

/* â•â• REFERRAL SYSTEM â•â• */
/* BUG-11 FIX: referral code usa hash SHA-256 dei primi 16 byte dello UID
   invece di btoa che espone direttamente lo UID */
async function genRefCode(uid){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('kazka-ref-'+uid));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,16);
}
async function initReferral(){
  if(!UID)return;
  const refCode=await genRefCode(UID);
  /* Salva il codice nel profilo se non ancora presente */
  const snap=await db.ref(`users/${UID}/profile/refCode`).once('value');
  if(!snap.val())await db.ref(`users/${UID}/profile/refCode`).set(refCode);
  const link=`${window.location.origin}${window.location.pathname}?ref=${refCode}`;
  const el=document.getElementById('ref-link-display');
  if(el)el.textContent=link;
  const params=new URLSearchParams(window.location.search);
  const incomingRef=params.get('ref');
  if(incomingRef&&UID&&incomingRef!==refCode){
    db.ref(`users/${UID}/profile/referredBy`).once('value').then(s=>{
      if(!s.val())db.ref(`users/${UID}/profile/referredBy`).set(incomingRef);
    });
    history.replaceState({},'',window.location.pathname);
  }
  loadReferralStats();
}
async function loadReferralStats(){
  if(!UID)return;
  const myCode=(await db.ref(`users/${UID}/profile/refCode`).once('value')).val()||await genRefCode(UID);
  /* Carica solo i referral dell'utente, non tutto il DB */
  const snap=await db.ref('users').orderByChild('profile/referredBy').equalTo(myCode).once('value');
  const all=snap.val()||{};
  const refs=Object.entries(all).filter(([uid])=>uid!==UID);
  const el=document.getElementById('ref-count');if(el)el.textContent=refs.length;
  const me=document.getElementById('ref-months');if(me)me.textContent=refs.length;
  const list=document.getElementById('ref-list');
  if(list)list.innerHTML=refs.length?refs.map(([,u])=>`<div style="display:flex;align-items:center;gap:.75rem;padding:.65rem 0;border-bottom:1px solid var(--b1)"><div style="width:28px;height:28px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#fff">${(u.profile?.name||'?').charAt(0).toUpperCase()}</div><div><div style="font-size:.875rem;font-weight:500">${u.profile?.name||'â€”'}</div><div style="font-size:.72rem;color:var(--tx3)">${u.profile?.email||'â€”'} Â· Registrato ${fd(u.profile?.createdAt)}</div></div><span class="badge bg-gr">+1 mese</span></div>`).join(''):'<div style="color:var(--tx3);font-size:.875rem;padding:1rem 0">Nessun referral ancora</div>';
}
function copyRefLink(){const el=document.getElementById('ref-link-display');if(el){navigator.clipboard?.writeText(el.textContent).then(()=>toast('Link copiato!','ok'));}}
function shareRef(platform){const link=document.getElementById('ref-link-display')?.textContent||'';const text=`Prova Axiom, l'app finanze personali gratis in italiano! ${link}`;if(platform==='whatsapp')window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');else if(platform==='telegram')window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Prova+Axiom!`,'_blank');else window.open(`mailto:?subject=Ti invito su Axiom&body=${encodeURIComponent(text)}`);}

/* â•â• PORTFOLIO INVESTIMENTI â•â• */
let liveRates={};
async function refreshPortfolio(){
  const assets=S.portfolio||[];
  if(!assets.length)return;
  toast('Aggiornando prezzi...','warn');
  for(const a of assets){
    if(!a.symbol)continue;
    try{
      if(a.type==='crypto'){
        const id=cryptoIdMap(a.symbol);
        const r=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=eur`);
        if(r.ok){const d=await r.json();if(d[id])liveRates[a.symbol]=d[id].eur;}
      } else {
        // Yahoo Finance via CORS proxy
        const proxy='https://api.allorigins.win/get?url='+encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${a.symbol}?interval=1d&range=1d`);
        const r=await fetch(proxy);
        if(r.ok){const wrapper=await r.json();const d=JSON.parse(wrapper.contents||'{}');const price=d.chart?.result?.[0]?.meta?.regularMarketPrice;if(price)liveRates[a.symbol]=price;}
      }
    }catch(e){}
  }
  renderPortfolio();
  toast('Prezzi aggiornati','ok');
}
function cryptoIdMap(sym){const m={'BTC':'bitcoin','ETH':'ethereum','SOL':'solana','ADA':'cardano','DOT':'polkadot','MATIC':'matic-network','LINK':'chainlink','AVAX':'avalanche-2'};return m[sym.toUpperCase()]||sym.toLowerCase();}
async function saveAsset(){
  const id=document.getElementById('ast-id').value;
  const a={name:document.getElementById('ast-name').value.trim(),type:document.getElementById('ast-type').value,qty:parseFloat(document.getElementById('ast-qty').value)||0,costPrice:parseFloat(document.getElementById('ast-cost').value)||0,symbol:document.getElementById('ast-symbol').value.trim().toUpperCase(),note:document.getElementById('ast-note').value.trim(),updatedAt:new Date().toISOString()};
  if(!a.name||!a.qty){toast('Compila nome e quantitÃ ','err');return;}
  const assets=[...(S.portfolio||[])];
  if(id){const idx=assets.findIndex(x=>x.id===id);if(idx>=0)assets[idx]={...assets[idx],...a};}
  else{a.id='a_'+Date.now();a.createdAt=new Date().toISOString();assets.push(a);}
  await db.ref(`users/${UID}/portfolio`).set(assets);
  cm('modal-asset');toast('Salvato','ok');
}
function renderPortfolio(){
  const assets=S.portfolio||[];
  const tbody=document.getElementById('port-tbody'),empty=document.getElementById('port-empty');
  if(!tbody)return;
  const totCost=assets.reduce((s,a)=>s+N(a.qty)*N(a.costPrice),0);
  const totLive=assets.reduce((s,a)=>{const live=liveRates[a.symbol]||N(a.costPrice);return s+N(a.qty)*live;},0);
  const gain=totLive-totCost;
  const gainPct=totCost>0?((gain/totCost)*100).toFixed(2):0;
  const ps=document.getElementById('port-stats');
  if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Valore attuale</div><div class="sv">${fmt(totLive)}</div></div><div class="sc"><div class="sl">Investito</div><div class="sv">${fmt(totCost)}</div></div><div class="sc"><div class="sl">P&L</div><div class="sv" style="color:${gain>=0?'var(--gr)':'var(--re)'}">${gain>=0?'+':''}${fmt(gain)}</div></div><div class="sc"><div class="sl">Rendimento</div><div class="sv" style="color:${gain>=0?'var(--gr)':'var(--re)'}">${gain>=0?'+':''}${gainPct}%</div></div>`;
  const pp=document.getElementById('port-perf');
  if(pp)pp.innerHTML=assets.length?assets.map(a=>{const live=liveRates[a.symbol]||N(a.costPrice);const val=N(a.qty)*live;const cost=N(a.qty)*N(a.costPrice);const g=val-cost;const gp=cost>0?((g/cost)*100).toFixed(1):0;return`<div style="display:flex;align-items:center;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1);font-size:.875rem"><div><div style="font-weight:600">${a.name}</div><div style="font-size:.72rem;color:var(--tx3)">${a.symbol||a.type}</div></div><div style="text-align:right"><div style="font-weight:700;color:${g>=0?'var(--gr)':'var(--re)'}">${g>=0?'+':''}${gp}%</div><div style="font-size:.72rem;color:var(--tx3)">${fmt(val)}</div></div></div>`;}).join(''):'<div style="color:var(--tx3);font-size:.875rem">Nessun asset</div>';
  if(!assets.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  const TYPE_IC={stock:'ðŸ“Š',etf:'ðŸ—‚ï¸',crypto:'â‚¿',bond:'ðŸ›ï¸',other:'ðŸ“¦'};
  tbody.innerHTML=assets.map(a=>{const live=liveRates[a.symbol]||N(a.costPrice);const val=N(a.qty)*live;const cost=N(a.qty)*N(a.costPrice);const g=val-cost;const gp=cost>0?((g/cost)*100).toFixed(1):0;return`<tr><td class="tdm">${TYPE_IC[a.type]||'ðŸ“¦'} ${a.name}</td><td><span class="badge bg-gy">${a.type}</span></td><td>${a.qty}</td><td>${fmt(a.costPrice)}</td><td style="color:var(--ac)">${live?fmt(live):'â€”'}</td><td style="font-weight:700">${fmt(val)}</td><td style="font-weight:700;color:${g>=0?'var(--gr)':'var(--re)'}">${g>=0?'+':''}${gp}%</td><td><div style="display:flex;gap:.25rem"><button class="btn bi bd bsm" onclick="deleteAsset('${a.id}')">ðŸ—‘</button></div></td></tr>`;}).join('');
  // Doughnut chart
  const cm2={};assets.forEach(a=>{const live=liveRates[a.symbol]||N(a.costPrice);const val=N(a.qty)*live;cm2[a.name]=(cm2[a.name]||0)+val;});
  const cats=Object.keys(cm2);
  if(cats.length)mkChart('ch-port','doughnut',{labels:cats,datasets:[{data:cats.map(c=>cm2[c]),backgroundColor:['#2563EB','#06B6D4','#34D399','#FB923C','#FBBF24','#EF4444'],borderWidth:0}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:'var(--tx2)',font:{size:10},boxWidth:10}}}});
}
async function deleteAsset(id){if(!confirm('Eliminare?'))return;const assets=(S.portfolio||[]).filter(a=>a.id!==id);await db.ref(`users/${UID}/portfolio`).set(assets);toast('Eliminato','ok');}
function searchAsset(q){/* basic suggestions */const sug=document.getElementById('ast-suggestions');if(!q||q.length<2){if(sug)sug.style.display='none';return;}const suggestions=[{s:'AAPL',n:'Apple Inc.'},{s:'MSFT',n:'Microsoft'},{s:'GOOGL',n:'Alphabet'},{s:'AMZN',n:'Amazon'},{s:'TSLA',n:'Tesla'},{s:'NVDA',n:'NVIDIA'},{s:'IWDA.MI',n:'iShares MSCI World ETF'},{s:'VWCE.DE',n:'Vanguard FTSE All-World ETF'},{s:'BTC',n:'Bitcoin'},{s:'ETH',n:'Ethereum'},{s:'SOL',n:'Solana'}].filter(x=>x.n.toLowerCase().includes(q.toLowerCase())||x.s.toLowerCase().includes(q.toLowerCase())).slice(0,5);if(!suggestions.length){if(sug)sug.style.display='none';return;}if(sug){sug.style.display='block';sug.innerHTML=suggestions.map(x=>`<div onclick="selectAsset('${x.s}','${x.n}')" style="padding:.5rem .875rem;cursor:pointer;font-size:.875rem;border-bottom:1px solid var(--b1)" onmouseover="this.style.background='var(--b1)'" onmouseout="this.style.background=''">${x.n} <span style="color:var(--tx3);font-size:.75rem">${x.s}</span></div>`).join('');}}
function selectAsset(symbol,name){document.getElementById('ast-name').value=name;document.getElementById('ast-symbol').value=symbol;const sug=document.getElementById('ast-suggestions');if(sug)sug.style.display='none';}

/* â•â• NET WORTH â•â• */
function renderNetWorth(){
  const totAcc=S.accounts.reduce((s,a)=>s+N(a.balance),0);
  const totPort=(S.portfolio||[]).reduce((s,a)=>{const live=liveRates[a.symbol]||N(a.costPrice);return s+N(a.qty)*live;},0);
  const totGoals=S.goals.reduce((s,g)=>s+N(g.current||0),0);
  const totDebt=S.debts.reduce((s,d)=>s+N(d.rem||d.remaining||0),0);
  const assets=totAcc+totPort+totGoals;
  const netWorth=assets-totDebt;
  const nwt=document.getElementById('nw-total');if(nwt){nwt.textContent=fmt(netWorth);nwt.style.color=netWorth>=0?'var(--gr)':'var(--re)';}
  const nwl=document.getElementById('nw-label');if(nwl)nwl.textContent=`Attivi ${fmt(assets)} âˆ’ Passivi ${fmt(totDebt)}`;
  const ps=document.getElementById('nw-stats');if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Attivi totali</div><div class="sv" style="color:var(--gr)">${fmt(assets)}</div></div><div class="sc"><div class="sl">Passivi (debiti)</div><div class="sv" style="color:var(--re)">${fmt(totDebt)}</div></div><div class="sc"><div class="sl">Patrimonio netto</div><div class="sv" style="color:${netWorth>=0?'var(--gr)':'var(--re)'}">${fmt(netWorth)}</div></div>`;
  const na=document.getElementById('nw-assets');if(na)na.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem"><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span style="font-size:.875rem">ðŸ¦ Conti bancari</span><span style="font-weight:700;color:var(--gr)">${fmt(totAcc)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span style="font-size:.875rem">ðŸ“ˆ Portafoglio</span><span style="font-weight:700;color:var(--gr)">${fmt(totPort)}</span></div><div style="display:flex;justify-content:space-between;padding:.65rem 0"><span style="font-size:.875rem">ðŸ† Obiettivi risparmiati</span><span style="font-weight:700;color:var(--gr)">${fmt(totGoals)}</span></div></div>`;
  const nl=document.getElementById('nw-liabilities');if(nl)nl.innerHTML=S.debts.length?S.debts.map(d=>`<div style="display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid var(--b1)"><span style="font-size:.875rem">${d.name}</span><span style="font-weight:700;color:var(--re)">${fmt(d.rem||d.remaining||0)}</span></div>`).join(''):'<div style="color:var(--tx3);font-size:.875rem;padding:.5rem">Nessun debito â€” ottimo!</div>';
}

/* â•â• CASHFLOW FORECAST â•â• */
function renderCashflow(){
  const m=new Date().toISOString().slice(0,7);
  const txM=S.transactions.filter(t=>t.date?.startsWith(m));
  const avgInc=S.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0)/Math.max(1,new Set(S.transactions.map(t=>t.date?.slice(0,7))).size);
  const avgExp=S.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0)/Math.max(1,new Set(S.transactions.map(t=>t.date?.slice(0,7))).size);
  const recTot=S.recurring.reduce((s,r)=>{const f={weekly:4.33,monthly:1,quarterly:1/3,yearly:1/12}[r.frequency]||1;return s+N(r.amount)*f;},0);
  const debtR=S.debts.reduce((s,d)=>s+N(d.rate),0);
  const curBal=S.accounts.reduce((s,a)=>s+N(a.balance),0);
  const monthlySave=avgInc-recTot-debtR-avgExp;
  const months=12;const labels=[],data=[];
  let bal=curBal;
  for(let i=0;i<=months;i++){const d=new Date();d.setMonth(d.getMonth()+i);labels.push(d.toLocaleDateString('it-IT',{month:'short',year:'2-digit'}));data.push(Math.round(bal));bal+=monthlySave;}
  const ps=document.getElementById('cf-stats');if(ps)ps.innerHTML=`<div class="sc"><div class="sl">Saldo attuale</div><div class="sv">${fmt(curBal)}</div></div><div class="sc"><div class="sl">Risparmio/mese</div><div class="sv" style="color:${monthlySave>=0?'var(--gr)':'var(--re)'}">${fmt(monthlySave)}</div></div><div class="sc"><div class="sl">Fra 6 mesi</div><div class="sv" style="color:${data[6]>=0?'var(--gr)':'var(--re)'}">${fmt(data[6])}</div></div><div class="sc"><div class="sl">Fra 12 mesi</div><div class="sv" style="color:${data[12]>=0?'var(--gr)':'var(--re)'}">${fmt(data[12])}</div></div>`;
  mkChart('ch-cashflow','line',{labels,datasets:[{label:'Saldo previsto',data,borderColor:'var(--ac)',backgroundColor:'rgba(239,68,68,.12)',fill:true,tension:.4,pointRadius:3}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'var(--tx3)',callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.04)'}}}});
  const ca=document.getElementById('cf-assumptions');if(ca)ca.innerHTML=`<div style="display:flex;flex-direction:column;gap:.5rem;font-size:.875rem;color:var(--tx2)"><div>ðŸ“Š Entrata media mensile storica: <strong style="color:var(--tx)">${fmt(avgInc)}</strong></div><div>ðŸ“‰ Uscita media mensile storica: <strong style="color:var(--tx)">${fmt(avgExp)}</strong></div><div>ðŸ” Spese ricorrenti mensili: <strong style="color:var(--tx)">${fmt(recTot)}</strong></div><div>ðŸ’³ Rate mensili debiti: <strong style="color:var(--tx)">${fmt(debtR)}</strong></div><div style="font-size:.8rem;color:var(--tx3);margin-top:.25rem">âš ï¸ Previsione basata su medie storiche â€” potrebbe differire dalla realtÃ .</div></div>`;
}

/* â•â• PENSION CALCULATOR â•â• */
function calcPension(){
  const age=parseInt(document.getElementById('pen-age')?.value)||0;
  const ret=parseInt(document.getElementById('pen-ret')?.value)||65;
  const save=parseFloat(document.getElementById('pen-save')?.value)||0;
  const cap=parseFloat(document.getElementById('pen-capital')?.value)||0;
  const rate=(parseFloat(document.getElementById('pen-rate')?.value)||5)/100;
  const inf=(parseFloat(document.getElementById('pen-inflation')?.value)||2.5)/100;
  const res=document.getElementById('pen-result');if(!res)return;
  if(!age||!ret||ret<=age){res.innerHTML='<div style="color:var(--tx3);font-size:.875rem">Inserisci etÃ  valide</div>';return;}
  const years=ret-age;
  const realRate=rate-inf;
  // Future value with compound interest
  const fvCapital=cap*Math.pow(1+rate,years);
  const fvSavings=save*12*((Math.pow(1+rate,years)-1)/rate)*(1+rate);
  const total=fvCapital+fvSavings;
  // Monthly withdrawal (4% rule)
  const monthly4=total*0.04/12;
  const monthly3=total*0.03/12;
  res.innerHTML=`<div style="display:flex;flex-direction:column;gap:.875rem">
    <div style="text-align:center;padding:1.25rem;background:rgba(52,211,153,.08);border-radius:var(--rs)">
      <div style="font-size:.75rem;color:var(--tx3);margin-bottom:.25rem">Capitale accumulato a ${ret} anni</div>
      <div style="font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;color:var(--gr)">${fmt(total)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:.5rem;font-size:.875rem">
      <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--b1)"><span>Anni di accumulo</span><strong>${years} anni</strong></div>
      <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--b1)"><span>Da capitale iniziale</span><strong style="color:var(--ac)">${fmt(fvCapital)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--b1)"><span>Da risparmi mensili</span><strong style="color:var(--ac2)">${fmt(fvSavings)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--b1)"><span>Rendita mensile (regola 4%)</span><strong style="color:var(--gr)">${fmt(monthly4)}/mese</strong></div>
      <div style="display:flex;justify-content:space-between;padding:.5rem 0"><span>Rendita mensile (prudente 3%)</span><strong style="color:var(--ye)">${fmt(monthly3)}/mese</strong></div>
    </div>
    <div style="font-size:.75rem;color:var(--tx3);padding:.75rem;background:var(--bg3);border-radius:var(--rs)">âš ï¸ Calcolo indicativo con rendimento ${(rate*100).toFixed(1)}% lordo annuo. Non tiene conto di tasse, inflazione reale o variazioni di mercato. Consulta un professionista.</div>
  </div>`;
}

/* â•â• INSURANCE TRACKER â•â• */
function renderInsurance(){
  const grid=document.getElementById('ins-grid'),empty=document.getElementById('ins-empty');
  if(!grid)return;
  const ins=S.insurance||[];
  if(!ins.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  const IC={auto:'ðŸš—',casa:'ðŸ ',vita:'â¤ï¸',salute:'ðŸ’Š',viaggio:'âœˆï¸',garanzia:'ðŸ“¦',altro:'ðŸ“‹'};
  const today2=new Date();
  grid.innerHTML=ins.map(i=>{
    const exp=i.end?new Date(i.end):null;
    const daysLeft=exp?Math.ceil((exp-today2)/864e5):null;
    const expired=daysLeft!==null&&daysLeft<0;
    const soon=daysLeft!==null&&daysLeft>=0&&daysLeft<=30;
    return`<div class="gc" style="${expired?'border-color:rgba(238,68,68,.3)':soon?'border-color:rgba(251,191,36,.3)':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <div style="font-size:1.5rem">${IC[i.type]||'ðŸ“‹'}</div>
        ${daysLeft!==null?`<span class="badge ${expired?'bg-re':soon?'bg-ye':'bg-gr'}">${expired?'Scaduta':daysLeft===0?'Scade oggi':daysLeft+'gg'}</span>`:''}
      </div>
      <div style="font-weight:700;margin-bottom:.2rem">${i.name}</div>
      <div style="font-size:.8rem;color:var(--tx2);margin-bottom:.5rem">${i.company||'â€”'}</div>
      ${i.cost>0?`<div style="font-size:.875rem">Premio: <strong style="color:var(--ye)">${fmt(i.cost)}/anno</strong></div>`:''}
      ${i.policy?`<div style="font-size:.75rem;color:var(--tx3);margin-top:.2rem">NÂ° ${i.policy}</div>`:''}
      <div style="font-size:.75rem;color:var(--tx3);margin-top:.25rem">${fd(i.start)} â†’ ${fd(i.end)}</div>
      <div style="display:flex;gap:.5rem;margin-top:.875rem">
        <button class="btn bs bsm" style="flex:1" onclick="editInsurance('${i.id}')">Modifica</button>
        <button class="btn bi bd bsm" onclick="deleteInsurance('${i.id}')">ðŸ—‘</button>
      </div>
    </div>`;
  }).join('');
}
async function saveInsurance(){
  const id=document.getElementById('ins-id').value;
  const i={name:document.getElementById('ins-name').value.trim(),type:document.getElementById('ins-type').value,cost:parseFloat(document.getElementById('ins-cost').value)||0,start:document.getElementById('ins-start').value,end:document.getElementById('ins-end').value,company:document.getElementById('ins-company').value.trim(),policy:document.getElementById('ins-policy').value.trim(),notes:document.getElementById('ins-notes').value.trim(),updatedAt:new Date().toISOString()};
  if(!i.name){toast('Inserisci nome','err');return;}
  const list=[...(S.insurance||[])];
  if(id){const idx=list.findIndex(x=>x.id===id);if(idx>=0)list[idx]={...list[idx],...i};}
  else{i.id='ins_'+Date.now();i.createdAt=new Date().toISOString();list.push(i);}
  await db.ref(`users/${UID}/insurance`).set(list);
  cm('modal-insurance');toast('Salvato','ok');
}
function editInsurance(id){const i=(S.insurance||[]).find(x=>x.id===id);if(!i)return;document.getElementById('ins-id').value=id;document.getElementById('ins-name').value=i.name;document.getElementById('ins-type').value=i.type;document.getElementById('ins-cost').value=i.cost||'';document.getElementById('ins-start').value=i.start||'';document.getElementById('ins-end').value=i.end||'';document.getElementById('ins-company').value=i.company||'';document.getElementById('ins-policy').value=i.policy||'';document.getElementById('ins-notes').value=i.notes||'';om('modal-insurance');}
async function deleteInsurance(id){if(!confirm('Eliminare?'))return;const list=(S.insurance||[]).filter(x=>x.id!==id);await db.ref(`users/${UID}/insurance`).set(list);toast('Eliminato','ok');}

/* â•â• OVERRIDE showView for new sections â•â• */


/* â•â• SUBSCRIBE new Firebase paths â•â• */


/* â•â• Override showApp to init extras â•â• */



/* â•â• SKELETON LOADING â•â• */
function showSkeleton(containerId, rows=3){
  const el=document.getElementById(containerId);
  if(!el)return;
  el.innerHTML=Array(rows).fill('').map(()=>`
    <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--b1)">
      <div class="skeleton" style="width:34px;height:34px;border-radius:10px;flex-shrink:0"></div>
      <div style="flex:1">
        <div class="skeleton" style="height:12px;border-radius:4px;margin-bottom:.4rem;width:${40+Math.random()*40}%"></div>
        <div class="skeleton" style="height:10px;border-radius:4px;width:${20+Math.random()*30}%"></div>
      </div>
      <div class="skeleton" style="width:60px;height:14px;border-radius:4px"></div>
    </div>`).join('');
}

/* â•â• INTERSECTION OBSERVER for scroll animations â•â• */
/* BUG-10 FIX: non nasconde elementi giÃ  visibili; fallback per browser senza IO */
function initScrollAnimations(){
  /* Se IO non disponibile, non toccare nulla - BUG-16 FIX */
  if(!('IntersectionObserver' in window))return;
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.opacity='1';
        e.target.style.transform='translateY(0)';
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.05,rootMargin:'0px 0px -10px 0px'});
  /* Solo gli elementi fuori dal viewport vengono nascosti */
  document.querySelectorAll('.sc,.gc,.card').forEach(el=>{
    const rect=el.getBoundingClientRect();
    const visible=rect.top<window.innerHeight&&rect.bottom>0;
    if(!visible){
      el.style.opacity='0';
      el.style.transform='translateY(12px)';
      el.style.transition='opacity .4s ease,transform .4s ease';
      obs.observe(el);
    }
  });
}

/* â•â• ANIMATED NUMBERS â•â• */
function animateNumber(el, target, duration=800, prefix='â‚¬'){
  if(!el)return;
  const start=0,startTime=performance.now();
  const isNeg=target<0;
  const abs=Math.abs(target);
  function step(now){
    const progress=Math.min((now-startTime)/duration,1);
    const ease=1-Math.pow(1-progress,3);
    const current=abs*ease;
    const formatted=new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(isNeg?-current:current);
    el.textContent=formatted;
    if(progress<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* â•â• CATEGORIES â•â• */
const DEFAULT_CATS={alimentari:'ðŸ›’',trasporti:'ðŸš—',casa:'ðŸ ',salute:'ðŸ’Š',svago:'ðŸŽ¬',lavoro:'ðŸ’¼',abbonamenti:'ðŸ“±',istruzione:'ðŸ“š',viaggi:'âœˆï¸',altro:'ðŸ“¦'};
function allCats(){const r={...DEFAULT_CATS};S.categories?.forEach(c=>{r[c.name]=c.icon||'ðŸ·ï¸';});return r;}
function getCatIcon(cat){return allCats()[cat]||'ðŸ·ï¸';}
function renderCategories(){
  const grid=document.getElementById('cat-grid'),empty=document.getElementById('cat-empty');
  if(!grid)return;
  if(!S.categories?.length){grid.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  grid.innerHTML=S.categories.map(c=>`<div class="cat-card" onclick="editCategory('${c.id}')"><div class="cat-icon">${c.icon||'ðŸ·ï¸'}</div><div class="cat-name">${c.name}</div><div class="cat-type">${c.type==='income'?'Entrata':c.type==='both'?'Entrambi':'Uscita'}</div><button class="btn bi bd bsm" onclick="event.stopPropagation();deleteCategory('${c.id}')" style="margin-top:.4rem">ðŸ—‘</button></div>`).join('');
}
async function saveCategory(){
  const id=document.getElementById('cat-id').value;
  const c={name:document.getElementById('cat-name').value.trim(),icon:document.getElementById('cat-icon').value,type:document.getElementById('cat-type').value,updatedAt:new Date().toISOString()};
  if(!c.name){toast('Inserisci nome','err');return;}
  if(id){await db.ref(`users/${UID}/categories/${id}`).update(c);}else{c.createdAt=new Date().toISOString();await db.ref(`users/${UID}/categories`).push(c);}
  cm('modal-category');document.getElementById('cat-id').value='';document.getElementById('cat-name').value='';toast('Salvata','ok');
}
function editCategory(id){const c=S.categories.find(c=>c.id===id);if(!c)return;document.getElementById('cat-id').value=id;document.getElementById('cat-name').value=c.name;document.getElementById('cat-icon').value=c.icon||'ðŸ“¦';document.getElementById('cat-type').value=c.type||'expense';om('modal-category');}
async function deleteCategory(id){if(!confirm('Eliminare?'))return;await db.ref(`users/${UID}/categories/${id}`).remove();toast('Eliminata','ok');}

/* â•â• SPLIT TRANSACTION â•â• */
let splitMode=false,splitRows=0;
function toggleSplit(){
  splitMode=!splitMode;
  document.getElementById('split-area').style.display=splitMode?'block':'none';
  document.getElementById('split-toggle').textContent=splitMode?'âœ• Togli split':'âœ‚ï¸ Split';
  if(!splitMode){document.getElementById('split-rows').innerHTML='';splitRows=0;document.getElementById('split-total').textContent='';}
}
function addSplitRow(){
  const div=document.createElement('div');div.className='split-row';const ri=splitRows++;
  div.innerHTML=`<select id="sp-cat-${ri}">${catOptions()}</select><input type="number" id="sp-amt-${ri}" placeholder="0" step="0.01" min="0" oninput="updateSplitTotal()"><button class="btn bi bd bsm" onclick="this.parentElement.remove();updateSplitTotal()">âœ•</button>`;
  document.getElementById('split-rows').appendChild(div);
}
function updateSplitTotal(){
  const rows=document.querySelectorAll('#split-rows .split-row input');let total=0;
  rows.forEach(r=>total+=parseFloat(r.value)||0);
  document.getElementById('split-total').textContent=`Totale split: ${fmt(total)}`;
}
function catOptions(){
  const cats=allCats();return Object.entries(cats).map(([k,v])=>`<option value="${k}">${v} ${cap(k)}</option>`).join('');
}

/* â•â• DEBT STRATEGY â•â• */
function renderDebtStrategy(){
  const el=document.getElementById('debt-strategy-content'),empty=document.getElementById('debt-strategy-empty');
  if(!el)return;
  if(!S.debts.length){el.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  const debts=S.debts.map(d=>({...d,remaining:N(d.rem||d.remaining||0),rate:N(d.rate),interest:N(d.int)||0}));
  // Snowball: sort by remaining (smallest first)
  const snow=[...debts].sort((a,b)=>a.remaining-b.remaining);
  // Avalanche: sort by interest rate (highest first)
  const ava=[...debts].sort((a,b)=>b.interest-a.interest);
  let html='<div class="strategy-cards">';
  html+=buildStrategyCard('â„ï¸ Valanga Inversa (Snowball)','Paga prima il debito piÃ¹ piccolo â€” motivazione psicologica',snow,'var(--ac2)');
  html+=buildStrategyCard('ðŸ”¥ Valanga (Avalanche)','Paga prima il debito con tasso piÃ¹ alto â€” risparmio massimo',ava,'var(--gr)');
  html+='</div>';
  el.innerHTML=html;
}
function buildStrategyCard(title,desc,list,color){
  const totRem=list.reduce((s,d)=>s+d.remaining,0),totRate=list.reduce((s,d)=>s+d.rate,0);
  // Stima mesi (semplificata: debito / rata, con rata extra di 100â‚¬)
  const snowM=simulateMonths(list,'snow'),avaM=simulateMonths(list,'ava');
  const isBest=title.includes('Avalanche')?snowM>=avaM:avaM>=snowM;
  return `<div class="strategy-card ${isBest?'strategy-best':''}" style="border-color:${color}20">
    <h3 style="color:${color}">${title}</h3>
    <p style="font-size:.78rem;color:var(--tx2);margin-bottom:.75rem">${desc}</p>
    <div class="stat-row"><span>Ordine pagamento</span><span class="val">${list.map(d=>d.name).join(' â†’ ')}</span></div>
    <div class="stat-row"><span>Mesi stimati</span><span class="val">${Math.round(snowM)}</span></div>
    <div class="stat-row"><span>Interessi totali stimati</span><span class="val" style="color:var(--re)">${fmt(estimateInterest(list,snowM))}</span></div>
    <div class="stat-row"><span>Rata totale mensile</span><span class="val">${fmt(totRate)}</span></div>
    ${isBest?'<div style="margin-top:.5rem;font-size:.72rem;color:var(--gr);font-weight:600">âœ“ Strategia consigliata</div>':''}
  </div>`;
}
function simulateMonths(list,method){
  if(!list.length)return 0;
  const extra=100;let months=0;
  const copy=list.map(d=>({rem:d.remaining,rate:N(d.rate),int:d.interest/100/12}));
  while(copy.some(d=>d.rem>0.01)&&months<600){
    months++;let totalExtra=extra;
    const sorted=method==='snow'?[...copy].sort((a,b)=>a.rem-b.rem):[...copy].sort((a,b)=>b.int-a.int);
    for(const d of copy)if(d.rem>0.01){const payment=Math.min(d.rem,d.rate+totalExtra);d.rem-=payment;d.rem+=d.rem*d.int;totalExtra=0;if(d.rem<0)d.rem=0;}
  }
  return months;
}
function estimateInterest(list,months){
  return list.reduce((s,d)=>s+N(d.rem||d.remaining||0)*(N(d.int)||0)/100/12*months,0);
}

/* â•â• INVOICE TEMPLATES â•â• */
async function saveInvoiceTemplate(){
  const name=document.getElementById('tpl-name').value.trim(),freq=document.getElementById('tpl-freq').value;
  if(!name){toast('Inserisci nome template','err');return;}
  // Prendi i dati correnti dalla fattura
  const tpl={name,freq,client:document.getElementById('inv-client').value.trim(),amount:parseFloat(document.getElementById('inv-amount').value)||0,vat:parseInt(document.getElementById('inv-vat').value)||22,notes:document.getElementById('inv-notes').value.trim(),createdAt:new Date().toISOString()};
  await db.ref(`users/${UID}/invoiceTemplates`).push(tpl);
  cm('modal-inv-template');toast('Template salvato','ok');
  if(freq!=='none'){toast(`Fattura ricorrente ${freq} attivata`,'ok');}
}
function loadTemplate(id){
  const t=S.invoiceTemplates.find(t=>t.id===id);if(!t)return;
  document.getElementById('inv-client').value=t.client||'';document.getElementById('inv-amount').value=t.amount||0;
  document.getElementById('inv-vat').value=t.vat||22;document.getElementById('inv-notes').value=t.notes||'';
  toast('Template caricato','ok');
}
function renderInvoiceTemplates(){
  // mini render per i tasti template nella view fatture
  const container=document.getElementById('inv-templates');
  if(!container||!S.invoiceTemplates?.length){if(container)container.innerHTML='';return;}
  container.innerHTML='<div style="font-size:.72rem;font-weight:600;color:var(--tx3);margin-bottom:.5rem">ðŸ“‹ Template:</div><div class="tpl-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">'+
    S.invoiceTemplates.map(t=>`<div class="tpl-card" style="padding:.6rem" onclick="loadTemplate('${t.id}')"><div class="tpl-name">${t.name}</div><div class="tpl-meta">${t.freq!=='none'?'ðŸ” '+FQ[t.freq]:'ðŸ“„ Una tantum'}</div></div>`).join('')+'</div>';
}

/* â•â• SHARED GOALS â•â• */
async function inviteToGoal(){
  const gid=document.getElementById('share-goal-id').value,email=document.getElementById('share-email').value.trim(),msg=document.getElementById('share-msg').value.trim();
  if(!gid||!email){toast('Seleziona obiettivo e inserisci email','err');return;}
  const goal=S.goals.find(g=>g.id===gid);if(!goal)return;
  const shareId=db.ref('sharedGoals').push().key;
  await db.ref(`sharedGoals/${shareId}`).set({goalId:gid,ownerId:UID,ownerName:UP?.name||'Utente',goalName:goal.name,goalIcon:goal.icon||'ðŸŽ¯',goalTarget:goal.target,goalCurrent:goal.current,message:msg,members:{[UID]:true,[email]:{email,status:'pending'}},createdAt:new Date().toISOString()});
  cm('modal-goal-share');toast('Invito inviato!','ok');
}
function copyGoalLink(){
  const gid=document.getElementById('share-goal-id').value;
  if(!gid){toast('Seleziona un obiettivo','err');return;}
  const link=`${location.origin}${location.pathname.replace(/\/[^/]*$/,'/')}?sharedGoal=${gid}`;
  navigator.clipboard.writeText(link).then(()=>toast('Link copiato! Condividilo con amici','ok')).catch(()=>toast('Errore copia','err'));
}
function renderSharedGoals(){
  const el=document.getElementById('sg-list'),empty=document.getElementById('sg-empty'),stats=document.getElementById('sg-stats');
  if(!el)return;const goals=Object.values(S.sharedGoals||{});
  if(stats)stats.innerHTML=`<div class="sc"><div class="sl">Obiettivi condivisi</div><div class="sv">${goals.length}</div></div>`;
  if(!goals.length){el.innerHTML='';if(empty)empty.style.display='block';return;}if(empty)empty.style.display='none';
  el.innerHTML=goals.map(g=>{
    const pct=Math.min(100,Math.round((N(g.goalCurrent)/N(g.goalTarget))*100));
    const members=Object.entries(g.members||{}).filter(([k])=>k!==UID).map(([,v])=>(typeof v==='object'?v:{})).filter(v=>v.email);
    return`<div class="sg-card"><div class="sg-header"><div><span style="font-size:1.1rem">${g.goalIcon||'ðŸŽ¯'}</span> <strong>${g.goalName}</strong></div><span style="font-size:.78rem;color:var(--tx3)">da ${g.ownerName||g.ownerId?.slice(0,6)}</span></div>
    <div class="pb"><div class="pf" style="width:${pct}%;background:${pct>=100?'var(--gr)':pct>=60?'var(--ac)':'var(--ac2)'}"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--tx2);margin-bottom:.5rem"><span>${fmt(g.goalCurrent||0)} / ${fmt(g.goalTarget||0)}</span><span style="font-weight:700;color:var(--ac)">${pct}%</span></div>
    ${g.message?`<div style="font-size:.78rem;color:var(--tx2);margin-bottom:.5rem;font-style:italic">"${g.message}"</div>`:''}
    <div class="sg-members">${members.map(m=>`<span title="${m.email||'?'}" style="font-size:.72rem;background:var(--b1);padding:.15rem .5rem;border-radius:99px">${m.email||'?'}</span>`).join('')}</div></div>`;
  }).join('');
}

/* â•â• EXPORT DATA â•â• */
function exportData(format){
  const sections=[];const checks={tx:'exp-tx',acc:'exp-acc',bud:'exp-bud',goals:'exp-goals',inv:'exp-inv',debts:'exp-debts',rec:'exp-rec',port:'exp-port'};
  Object.entries(checks).forEach(([key,id])=>{if(document.getElementById(id)?.checked){const map={tx:'transactions',acc:'accounts',bud:'budgets',goals:'goals',inv:'invoices',debts:'debts',rec:'recurring',port:'portfolio'};sections.push(map[key]);}});
  if(!sections.length){toast('Seleziona almeno una sezione','err');return;}
  const data={};sections.forEach(s=>{data[s]=S[s]||[];});
  if(format==='json'){
    const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`kazka-export-${today()}.json`;a.click();
    toast('JSON esportato','ok');
  }else{
    let csv='';Object.entries(data).forEach(([section,items])=>{
      csv+=`\n=== ${section.toUpperCase()} ===\n`;
      if(!items.length){csv+='(vuoto)\n';return;}
      const arr=Array.isArray(items)?items:Object.entries(items).flatMap(([k,v])=>typeof v==='object'?[{key:k,...v}]:[{key:k,value:v}]);
      if(!arr.length){csv+='(vuoto)\n';return;}
      const keys=Object.keys(arr[0]||{}).filter(k=>!['id','updatedAt','createdAt'].includes(k));
      csv+=keys.join(';')+'\n';
      arr.forEach(item=>{csv+=keys.map(k=>String(item[k]||'').replace(/;/g,',')).join(';')+'\n';});
    });
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`kazka-export-${today()}.csv`;a.click();
    toast('CSV esportato','ok');
  }
  cm('modal-export');
}

/* BUG-06 FIX: split validation ora avviene dentro saveTx; l'override Ã¨ rimosso */
/* Validazione split nel punto di salvataggio */
const _origSaveTxValidate=saveTx;
saveTx=async function(){
  if(splitMode){
    const rows=document.querySelectorAll('#split-rows .split-row');let total=0,valid=true;
    rows.forEach(r=>{const amt=parseFloat(r.querySelector('input').value)||0;if(!amt)valid=false;total+=amt;});
    if(!valid||!total){toast('Compila tutti gli importi dello split','err');setModalSaving(false);return;}
    const baseAmount=parseFloat(document.getElementById('tx-amount').value)||0;
    if(Math.abs(total-baseAmount)>0.01){toast(`Lo split non quadra: ${fmt(total)} vs ${fmt(baseAmount)}`,'err');setModalSaving(false);return;}
  }
  await _origSaveTxValidate();
};

/* â•â• CATEGORY SELECT POPULATOR â•â• */
const _origPopulate=populateSels;
populateSels=function(){_origPopulate();const cats=allCats();['tx-cat','bud-cat','rec-cat'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const val=el.value;el.innerHTML=Object.entries(cats).map(([k,v])=>`<option value="${k}">${v} ${cap(k)}</option>`).join('');el.value=val;});};

/* â•â• APPEND SHARE BUTTON TO GOAL CARDS & TEMPLATES TO INVOICE â•â• */
const _origRenderGoals=renderGoals;
renderGoals=function(){
  // Modifica la grid HTML per aggiungere pulsante condividi
  const grid=document.getElementById('goals-grid');if(!grid)return;
  const orig=grid.innerHTML;
  if(orig&&S.goals.length){
    grid.innerHTML=S.goals.map(g=>{
      const pct=Math.min(100,Math.round((N(g.current)/N(g.target))*100));const color=pct>=100?'var(--gr)':pct>=60?'var(--ac)':'var(--ac2)';
      return`<div class="gc"><div style="font-size:1.75rem;margin-bottom:.75rem">${g.icon||'ðŸŽ¯'}</div><div style="font-weight:700;margin-bottom:.25rem">${g.name}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:.75rem">Target: ${fmt(g.target)} Â· ${fd(g.dl)}</div><div class="pb"><div class="pf" style="width:${pct}%;background:${color}"></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem"><div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:${color}">${pct}%</div><div style="font-size:.8rem;color:var(--tx2)">${fmt(g.current||0)} / ${fmt(g.target)}</div></div><div style="display:flex;gap:.5rem;margin-top:.875rem"><button class="btn bs bsm" style="flex:1" onclick="editGoal('${g.id}')">Modifica</button><button class="btn bs bsm" style="flex:1" onclick="document.getElementById('share-goal-id').value='${g.id}';om('modal-goal-share')">ðŸ¤ Condividi</button><button class="btn bi bd bsm" onclick="deleteGoal('${g.id}')">ðŸ—‘</button></div></div>`;
    }).join('');
  }
};
const _origRenderInvoices=renderInvoices;
renderInvoices=function(){_origRenderInvoices();
  // Aggiungi pulsante template nella page-hd
  const hd=document.querySelector('#view-invoices .page-hd>div:last-child');
  if(hd&&!document.getElementById('inv-tpl-btn')){const btn=document.createElement('button');btn.id='inv-tpl-btn';btn.className='btn bs bsm';btn.textContent='ðŸ“‹ Template';btn.onclick=()=>om('modal-inv-template');hd.appendChild(btn);}
  renderInvoiceTemplates();
  // Aggiungi area template sotto il titolo
  const card=document.querySelector('#view-invoices .card');
  if(card&&!document.getElementById('inv-templates')){const tplDiv=document.createElement('div');tplDiv.id='inv-templates';card.parentElement.insertBefore(tplDiv,card);}
  renderInvoiceTemplates();
  // Popola template nel modal
  const mt=document.getElementById('inv-modal-templates');if(mt&&S.invoiceTemplates?.length){
    mt.style.display='block';
    mt.innerHTML='<div style="font-size:.72rem;font-weight:600;color:var(--tx3);margin-bottom:.35rem">ðŸ“‹ Carica template:</div>'+
      S.invoiceTemplates.map(t=>`<button class="btn bs bsm" onclick="loadTemplate('${t.id}')" style="padding:.25rem .6rem;font-size:.72rem;margin-right:.35rem;margin-bottom:.25rem">${t.name}</button>`).join('');
  }else if(mt){mt.style.display='none';}
};
const _origRenderTx=renderTransactions;
renderTransactions=function(){_origRenderTx();};

/* â•â• CAPACITOR INIT â€” App mobile â•â• */
document.addEventListener('deviceready',()=>{
  if(window.Capacitor){
    try{Capacitor.Plugins.StatusBar?.setOverlaysWebView?.({overlay:false});Capacitor.Plugins.StatusBar?.setStyle?.({style:'DARK'});}catch(e){}
    // Native push notifications via Capacitor Push Notifications plugin
    try{
      const push=Capacitor.Plugins.PushNotifications;
      if(push){
        push.requestPermission().then(result=>{
          if(result.granted){
            push.register();
            push.addListener('registration',async token=>{
              if(token.value&&UID){
                await db.ref(`users/${UID}/fcmTokens/native_${token.value.replace(/[:.]/g,'_')}`).set({
                  token:token.value,
                  device:'capacitor-native',
                  ts:new Date().toISOString()
                });
              }
            });
            push.addListener('pushNotificationReceived',notification=>{
              const title=notification.title||'Axiom';
              const body=notification.body||'';
              // Show in-app toast when in foreground
              try{addNotif(title,body,'info');}catch(e){}
            });
            push.addListener('pushNotificationActionPerformed',()=>{});
          }
        }).catch(()=>{});
      }
    }catch(e){console.warn('Capacitor Push:',e.message);}
  }
  document.addEventListener('backbutton',()=>{
    const modals=document.querySelectorAll('.mo.open');
    if(modals.length){cm(modals[modals.length-1].id);return;}
    if(document.getElementById('sidebar').classList.contains('open')){toggleSidebar();return;}
    if(viewStack.length){goBack();return;}
    if(navigator.app&&navigator.app.exitApp)navigator.app.exitApp();
  });
},false);

if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register('../sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{
        if(nw.state==='installed'&&navigator.serviceWorker.controller)
          document.getElementById('update-banner').style.display='block';
      });
    });
  }).catch(()=>{});
}
function applyUpdate(){
  navigator.serviceWorker.getRegistration().then(reg=>{
    if(reg&&reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
    window.location.reload();
  });
}

