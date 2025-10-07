const CACHE_NAME = 'safesource-consumer-v3';
const STATIC_ASSETS = [
  '/consumer',
  '/manifest-consumer.json',
  '/icons/consumer-192.png',
  '/icons/consumer-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Sync data with main platform
self.addEventListener('sync', (event) => {
  if (event.tag === 'network-sync') {
    event.waitUntil(syncWithMainPlatform());
  }
});

async function syncWithMainPlatform() {
  const verifications = JSON.parse(localStorage.getItem('network_verifications')) || [];
  const reports = JSON.parse(localStorage.getItem('network_reports')) || [];
  
  // Simulate sync with main platform
  console.log('🔄 Syncing consumer data with main platform:', { verifications, reports });
}