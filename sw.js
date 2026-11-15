/* 서비스워커 — 홈 화면 설치 · 오프라인에서도 열리게
 * 화면(HTML)은 네트워크 우선, 아이콘은 캐시 우선. */
const CACHE = 'household-budget-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.png?v=2',
  './icon-192.png?v=2',
  './icon-512.png?v=2',
  './icon-maskable-512.png?v=2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // Firebase 등 바깥 요청은 건드리지 않는다

  const isDoc = req.mode === 'navigate' || /\.html$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isDoc) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
