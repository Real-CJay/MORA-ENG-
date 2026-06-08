const CACHE_VERSION = 'mora-quiz-v82';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE   = `${CACHE_VERSION}-runtime`;
// Subject data cache is not versioned; it survives app updates so downloaded
// modules remain available offline even after the user gets a new app version.
const SUBJECTS_CACHE  = 'mora-quiz-subjects';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.json?v=82',
  '/quiz_style.css?v=82',
  '/quiz_data.js?v=82',
  '/auth.js?v=82',
  '/quiz_app.js?v=82',
  '/pwa.js?v=82',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-maskable-192.png',
  '/assets/icons/icon-maskable-512.png'
];

function isApiRequest(url) {
  return [
    'supabase.co',
    'openrouter.ai',
    'api.groq.com',
    'generativelanguage.googleapis.com'
  ].some(host => url.hostname.includes(host));
}

function rootAssetRequest(request, url) {
  const badVersionMatch = url.pathname.match(/^\/([^/]+\.(?:html|json|css|js|png|jpg|jpeg|webp|svg))-v=\d+$/i);
  if (badVersionMatch) {
    return new Request(url.origin + '/' + badVersionMatch[1], request);
  }

  const markers = ['/IMAGES/', '/assets/', '/subject_data/'];
  for (const marker of markers) {
    const index = url.pathname.indexOf(marker);
    if (index > 0) {
      return new Request(url.origin + url.pathname.slice(index) + url.search, request);
    }
  }
  const rootFiles = [
    'index.html',
    'manifest.json',
    'quiz_style.css',
    'quiz_data.js',
    'auth.js',
    'quiz_app.js',
    'pwa.js',
    'service-worker.js'
  ];
  const fileName = url.pathname.split('/').pop();
  if (rootFiles.includes(fileName) && url.pathname !== '/' + fileName) {
    return new Request(url.origin + '/' + fileName + url.search, request);
  }
  return null;
}

function offlineHtmlResponse() {
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mora Quiz Offline</title></head><body style="margin:0;background:#0f1117;color:#e8eaf4;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px;"><main><h1>Mora Quiz is offline</h1><p>The app shell is not cached yet. Reconnect once, then try again.</p></main></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function offlineAssetResponse() {
  return new Response('', { status: 504, statusText: 'Offline cache miss' });
}

function matchOrFallback(request, fallback) {
  return caches.match(request).then(cached => cached || fallback());
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => Promise.allSettled(APP_SHELL.map(item => cache.add(item))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          // Keep versioned caches + the persistent subjects cache
          .filter(key => ![APP_SHELL_CACHE, RUNTIME_CACHE, SUBJECTS_CACHE].includes(key))
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Handle explicit download request from the app
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') { self.skipWaiting(); return; }
  if (event.data?.type === 'CACHE_SUBJECT') {
    const { url, subjectKey } = event.data;
    event.waitUntil(
      fetch(url)
        .then(resp => {
          if (!resp || resp.status !== 200) throw new Error('fetch failed');
          return caches.open(SUBJECTS_CACHE).then(cache => cache.put(url, resp));
        })
        .then(() => {
          event.source?.postMessage({ type: 'SUBJECT_CACHED', subjectKey, ok: true });
        })
        .catch(() => {
          event.source?.postMessage({ type: 'SUBJECT_CACHED', subjectKey, ok: false });
        })
    );
  }
  if (event.data?.type === 'REMOVE_SUBJECT') {
    const { url, subjectKey } = event.data;
    event.waitUntil(
      caches.open(SUBJECTS_CACHE)
        .then(cache => cache.delete(url))
        .then(() => {
          event.source?.postMessage({ type: 'SUBJECT_REMOVED', subjectKey });
        })
    );
  }
  if (event.data?.type === 'CACHE_IMAGES') {
    const { urls } = event.data;
    if (!Array.isArray(urls)) return;
    event.waitUntil(
      caches.open(SUBJECTS_CACHE).then(cache =>
        Promise.allSettled(urls.map(async url => {
          try {
            const resp = await fetch(url);
            if (resp && resp.status === 200) await cache.put(url, resp);
          } catch(e) {}
        }))
      )
    );
  }
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isApiRequest(url)) return;

  // Subject data: serve from persistent SUBJECTS_CACHE when offline,
  // refresh to SUBJECTS_CACHE when online so the download stays current.
  if (url.origin === location.origin && url.pathname.startsWith('/subject_data/')) {
    event.respondWith(
      caches.open(SUBJECTS_CACHE).then(cache =>
        fetch(request)
          .then(resp => {
            if (resp && resp.status === 200) cache.put(request, resp.clone());
            return resp;
          })
          .catch(() => cache.match(request).then(cached => cached || offlineAssetResponse()))
      )
    );
    return;
  }

  const remappedAssetRequest = url.origin === location.origin ? rootAssetRequest(request, url) : null;
  if (remappedAssetRequest) {
    event.respondWith(
      fetch(remappedAssetRequest)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(remappedAssetRequest, copy));
          return response;
        })
        .catch(() => matchOrFallback(remappedAssetRequest, offlineAssetResponse))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(APP_SHELL_CACHE).then(cache => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then(cached => cached || offlineHtmlResponse()))
    );
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => matchOrFallback(request, offlineAssetResponse))
    );
    return;
  }

  if (url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          return response;
        }).catch(() => offlineAssetResponse());
      })
    );
  }
});












