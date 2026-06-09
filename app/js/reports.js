// +--------------------------------------------------------------+
// �  WARNING � FILE ORFANO / NON INTEGRATO                      �
// �  Questo file NON � caricato dall'app principale (app.html).  �
// �  Il codice eseguibile � nello script inline di app/app.html. �
// �  Mantenuto per riferimento storico � NON modificare.         �
// +--------------------------------------------------------------+
/* ─── REPORTS ─── */
function renderReports(){const ae=S.transactions.filter(t=>t.type==='expense'),ai=S.transactions.filter(t=>t.type==='income');const te=ae.reduce((s,t)=>s+N(t.amount),0),ti=ai.reduce((s,t)=>s+N(t.amount),0);const rs=document.getElementById('rep-stats');if(rs)rs.innerHTML=`<div class="sc"><div class="sl">Totale entrate</div><div class="sv" style="color:var(--gr)">${fmt(ti)}</div></div><div class="sc"><div class="sl">Totale uscite</div><div class="sv" style="color:var(--re)">${fmt(te)}</div></div><div class="sc"><div class="sl">Saldo netto</div><div class="sv">${fmt(ti-te)}</div></div><div class="sc"><div class="sl">Transazioni</div><div class="sv">${S.transactions.length}</div></div>`;const cm2={};ae.forEach(t=>{cm2[t.category]=(cm2[t.category]||{count:0,total:0});cm2[t.category].count++;cm2[t.category].total+=N(t.amount);});const sorted=Object.entries(cm2).sort((a,b)=>b[1].total-a[1].total);const tbody=document.getElementById('rep-cat-tbody');if(tbody)tbody.innerHTML=sorted.map(([c,d])=>`<tr><td class="tdm">${CI[c]||'📦'} ${cap(c)}</td><td>${d.count}</td><td style="font-weight:700">${fmt(d.total)}</td><td>${te>0?Math.round((d.total/te)*100):0}%</td></tr>`).join('');}
function renderRepCharts(){
  const labs=[],inc=[],exp=[];for(let i=11;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const m=d.toISOString().slice(0,7);labs.push(d.toLocaleDateString('it-IT',{month:'short',year:'2-digit'}));const txM=S.transactions.filter(t=>t.date?.startsWith(m));inc.push(txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0));exp.push(txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0));}
  const o={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'var(--tx2)',font:{size:11}}}},scales:{x:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'var(--tx3)'},grid:{color:'rgba(255,255,255,.04)'}}}};
  mkChart('ch-rep','line',{labels:labs,datasets:[{label:'Entrate',data:inc,borderColor:'var(--gr)',backgroundColor:'rgba(0,240,160,.1)',fill:true,tension:.4},{label:'Uscite',data:exp,borderColor:'var(--re)',backgroundColor:'rgba(255,51,85,.1)',fill:true,tension:.4}]},o);
  const cm2={};S.transactions.filter(t=>t.type==='expense').forEach(t=>{cm2[t.category]=(cm2[t.category]||0)+N(t.amount);});const cats=Object.entries(cm2).sort((a,b)=>b[1]-a[1]).slice(0,8);if(cats.length)mkChart('ch-rep-cat','bar',{labels:cats.map(([c])=>CI[c]+' '+cap(c)),datasets:[{label:'Spese',data:cats.map(([,v])=>v),backgroundColor:CC.slice(0,cats.length),borderRadius:6}]},{...o,indexAxis:'y',plugins:{legend:{display:false}}});
}

/* ─── SCORE ─── */
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
  const sl=document.getElementById('score-label');if(sl)sl.textContent=pct>=80?'Eccellente 🏆':pct>=60?'Buono 👍':pct>=40?'Sufficiente ⚠️':'Da migliorare 📉';
  const sd=document.getElementById('score-desc');if(sd)sd.textContent='Basato su risparmio, budget, obiettivi e debiti';
  const sb=document.getElementById('score-bar');if(sb)sb.innerHTML=details.map(d=>`<div style="display:flex;align-items:center;gap:.75rem;font-size:.8rem;margin-bottom:.5rem"><div style="width:140px;color:var(--tx2);flex-shrink:0">${d.l}</div><div style="flex:1;height:5px;background:var(--b1);border-radius:3px;overflow:hidden"><div style="height:100%;width:${Math.round((d.v/d.max)*100)}%;background:${d.color};border-radius:3px"></div></div><div style="font-size:.75rem;font-weight:600;width:36px;text-align:right">${d.v}/${d.max}</div></div>`).join('');
  const tips=[];if(savR<.2)tips.push('💡 Cerca di risparmiare almeno il 20% delle entrate.');if(!S.budgets[m]||!Object.keys(S.budgets[m]).length)tips.push('💡 Imposta un budget per categoria.');if(!S.goals.length)tips.push('💡 Crea almeno un obiettivo di risparmio.');if(totDebt>0)tips.push(`💡 Hai ${fmt(totDebt)} di debito residuo — priorità alle rate costose.`);if(totBal<0)tips.push('⚠️ Saldo negativo — rivedi le spese urgentemente.');const st=document.getElementById('score-tips');if(st)st.innerHTML=tips.length?tips.map(t=>`<div style="padding:.75rem 0;border-bottom:1px solid var(--b1);font-size:.875rem;color:var(--tx2)">${t}</div>`).join(''):'<div style="color:var(--tx2);font-size:.875rem;padding:.5rem">Ottimo lavoro! 🎉</div>';
}

/* ─── MONTHLY ─── */
function renderMonthly(){
  const y=monthlyDate.getFullYear(),mo=monthlyDate.getMonth(),mStr=`${y}-${String(mo+1).padStart(2,'0')}`;
  const mt=document.getElementById('monthly-title');if(mt)mt.textContent=new Date(y,mo,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
  const txM=S.transactions.filter(t=>t.date?.startsWith(mStr));
  const inc=txM.filter(t=>t.type==='income').reduce((s,t)=>s+N(t.amount),0),exp=txM.filter(t=>t.type==='expense').reduce((s,t)=>s+N(t.amount),0);
  const days=new Date(y,mo+1,0).getDate();const avgDay=exp>0?exp/days:0;
  const dl=mo===new Date().getMonth()&&y===new Date().getFullYear()?new Date(y,mo+1,0).getDate()-new Date().getDate():0;
  const ms=document.getElementById('monthly-stats');if(ms)ms.innerHTML=`<div class="sc"><div class="sl">Entrate</div><div class="sv" style="color:var(--gr)">${fmt(inc)}</div></div><div class="sc"><div class="sl">Uscite</div><div class="sv" style="color:var(--re)">${fmt(exp)}</div></div><div class="sc"><div class="sl">Media/giorno</div><div class="sv" style="color:var(--ye)">${fmt(avgDay)}</div></div><div class="sc"><div class="sl">Proiezione</div><div class="sv" style="color:var(--or)">${fmt(exp+avgDay*dl)}</div><div style="font-size:.75rem;color:var(--tx2)">${dl>0?dl+' gg rimasti':'mese passato'}</div></div>`;
  const cats2={};txM.filter(t=>t.type==='expense').forEach(t=>{cats2[t.category]=(cats2[t.category]||0)+N(t.amount);});const sc2=Object.entries(cats2).sort((a,b)=>b[1]-a[1]);const maxC=sc2[0]?.[1]||1;
  const mc=document.getElementById('monthly-cats');if(mc)mc.innerHTML=sc2.length?sc2.map(([c,v])=>`<div style="margin-bottom:.75rem"><div style="display:flex;justify-content:space-between;font-size:.875rem;margin-bottom:.3rem"><span>${CI[c]||'📦'} ${cap(c)}</span><span style="font-weight:700">${fmt(v)}</span></div><div class="pb"><div class="pf" style="width:${Math.round((v/maxC)*100)}%;background:var(--ac)"></div></div></div>`).join(''):'<div style="color:var(--tx3);font-size:.875rem;padding:1rem">Nessuna spesa</div>';
  const daily=Array(days).fill(0);txM.filter(t=>t.type==='expense').forEach(t=>{const d=parseInt(t.date?.split('-')[2])-1;if(d>=0&&d<days)daily[d]+=N(t.amount);});
  mkChart('ch-daily','bar',{labels:Array.from({length:days},(_,i)=>i+1),datasets:[{label:'Spese',data:daily,backgroundColor:'rgba(255,51,85,.6)',borderRadius:3}]},{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'var(--tx3)',font:{size:9}}},y:{ticks:{color:'var(--tx3)'}}}}); 
}
function monthPrev(){monthlyDate.setMonth(monthlyDate.getMonth()-1);renderMonthly();}
function monthNext(){monthlyDate.setMonth(monthlyDate.getMonth()+1);renderMonthly();}

/* ─── NOTIFICATIONS ─── */
function updateNotifBadge(){const unread=notifications.filter(n=>!n.read).length;const b=document.getElementById('notif-badge');if(b){b.textContent=unread;b.style.display=unread>0?'flex':'none';}}
function addNotif(title,body,type='info'){const n={id:Date.now(),title,body,type,ts:new Date().toISOString(),read:false};notifications.unshift(n);if(notifications.length>50)notifications=notifications.slice(0,50);localStorage.setItem('kz_notifs',JSON.stringify(notifications));updateNotifBadge();}
function renderNotifications(){const list=document.getElementById('notif-list');if(!list)return;if(!notifications.length){list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--tx3)">🔔 Nessuna notifica</div>';return;}const IC={budget:'🎯',goal:'🏆',recurring:'🔁',invoice:'🧾',info:'💡',system:'⚡'};list.innerHTML=notifications.map(n=>`<div onclick="readNotif(${n.id})" style="display:flex;align-items:flex-start;gap:.875rem;padding:1rem;border-bottom:1px solid var(--b1);cursor:pointer;background:${n.read?'transparent':'rgba(123,104,238,.05)'}"><div style="width:36px;height:36px;border-radius:10px;background:var(--b1);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">${IC[n.type]||'💡'}</div><div style="flex:1;min-width:0"><div style="font-size:.875rem;font-weight:${n.read?'500':'700'};color:${n.read?'var(--tx2)':'var(--tx)'};margin-bottom:.2rem">${n.title}</div><div style="font-size:.8rem;color:var(--tx3);line-height:1.4">${n.body}</div></div>${!n.read?'<div style="width:8px;height:8px;border-radius:50%;background:var(--ac);flex-shrink:0;margin-top:4px"></div>':''}</div>`).join('');}
function readNotif(id){const n=notifications.find(n=>n.id===id);if(n){n.read=true;localStorage.setItem('kz_notifs',JSON.stringify(notifications));updateNotifBadge();renderNotifications();}}
function markAllRead(){notifications.forEach(n=>n.read=true);localStorage.setItem('kz_notifs',JSON.stringify(notifications));updateNotifBadge();renderNotifications();toast('Tutte lette','ok');}
function checkNotifAlerts(){
  const m=new Date().toISOString().slice(0,7),budgets=S.budgets[m]||{};
  const txM=S.transactions.filter(t=>t.date?.startsWith(m)&&t.type==='expense');
  Object.entries(budgets).forEach(([cat,b])=>{const spent=txM.filter(t=>t.category===cat).reduce((s,t)=>s+N(t.amount),0);if(spent/b.limit>0.9){const key=`budget_${cat}_${m}`;if(!localStorage.getItem(key)){addNotif(`⚠️ Budget ${cap(cat)} quasi esaurito`,`Speso ${fmt(spent)} di ${fmt(b.limit)} (${Math.round(spent/b.limit*100)}%)`, 'budget');localStorage.setItem(key,'1');}}});
  const soon=new Date();soon.setDate(soon.getDate()+7);
  S.recurring.forEach(r=>{if(r.nextDate&&new Date(r.nextDate)<=soon){const key=`rec_${r.id}_${r.nextDate}`;if(!localStorage.getItem(key)){addNotif(`🔁 Scadenza: ${r.name}`,`${fmt(r.amount)} scade il ${fd(r.nextDate)}`,'recurring');localStorage.setItem(key,'1');}}});
  S.goals.forEach(g=>{if(N(g.current||0)/N(g.target)>=1){const key=`goal_${g.id}`;if(!localStorage.getItem(key)){addNotif(`🏆 Obiettivo raggiunto!`,`Hai raggiunto "${g.name}"!`,'goal');localStorage.setItem(key,'1');}}});
}

