const CACHE = 'ledger-shell-v1';
const SHELL = ['./', 'index.html', 'manifest.json', 'firebase-config.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firestore traffic is handled by the SDK itself
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('googleapis.com') && !url.hostname.startsWith('fonts')) return;
  // network first (so updates arrive), fall back to cache when offline
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && (url.origin === location.origin || url.hostname.includes('gstatic.com'))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
