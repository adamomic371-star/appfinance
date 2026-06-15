importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCMPawrAL5tT_bH6YEcNe_UEEyIwLIgHIQ",
  authDomain: "financeapp-556ae.firebaseapp.com",
  databaseURL: "https://financeapp-556ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "financeapp-556ae",
  storageBucket: "financeapp-556ae.firebasestorage.app",
  messagingSenderId: "181987533980",
  appId: "1:181987533980:web:41c5032990ccede17eb959"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  const n = payload.notification || {};
  const title = n.title || data.title || 'Kazka';
  const body = n.body || data.body || 'Hai una nuova notifica';
  const tag = data.tag || 'kazka-' + Date.now();
  self.registration.showNotification(title, {
    body,
    icon: '../assets/icons/icon-192.png',
    badge: '../assets/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag,
    data: { url: data.url || './index.html', ...data }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clist => {
      for (const c of clist) {
        if (c.url.includes('app/index.html') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
