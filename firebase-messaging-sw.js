// Sviluppato da Adamo Michele
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
const config={apiKey:"AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ",authDomain:"financeapp-556ae.firebaseapp.com",databaseURL:"https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app",projectId:"financeapp-556ae",storageBucket:"financeapp-556ae.firebasestorage.app",messagingSenderId:"181987533980",appId:"1:181987533980:web:41c5032990ccede17eb959"};
firebase.initializeApp(config);
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const n=payload.notification||{};
  const title=n.title||'Axiom';
  const options={body:n.body||'',icon:'/appfinance/assets/icons/icon-192.png',badge:'/appfinance/assets/icons/icon-192.png',vibrate:[200,100,200],tag:'axiom-'+Date.now(),data:{url:'/appfinance/app/'}};
  self.registration.showNotification(title,options);
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'/appfinance/app/';
  event.waitUntil(clients.openWindow(url));
});
