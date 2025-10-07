// SafeSource Customer App Service Worker v2.0
const CACHE_NAME = 'safesource-customer-v2.0';
const STATIC_CACHE = 'safesource-customer-static-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/customer-icon-72x72.png',
  '/icons/customer-icon-192x192.png',
  '/icons/customer-icon-512x512.png',
  '/screenshots/customer-scan.png',
  '/screenshots/customer-results.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🛠️ SafeSource Customer App Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching customer app assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Customer app assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 SafeSource Customer App Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            console.log('🗑️ Deleting old customer cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Customer Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(STATIC_CACHE)
              .then((cache) => {
                // Only cache same-origin requests
                if (event.request.url.startsWith(self.location.origin)) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline verification history
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync for customer app:', event.tag);
  if (event.tag === 'background-sync-verification') {
    event.waitUntil(syncVerificationData());
  }
});

// Push notifications for verification alerts
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received for customer app');
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'SafeSource Verification Alert',
    icon: '/icons/customer-icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SafeSource', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then((windowClients) => {
        // Check if window is already open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Helper functions
async function syncVerificationData() {
  try {
    // Get pending verifications from IndexedDB
    const pendingVerifications = await getPendingVerifications();
    
    // Sync with server when online
    for (let verification of pendingVerifications) {
      await syncVerification(verification);
      await markVerificationSynced(verification.id);
    }
    
    console.log('✅ Verification data synced');
  } catch (error) {
    console.error('❌ Verification sync failed:', error);
  }
}

// Mock functions - replace with actual IndexedDB logic
function getPendingVerifications() {
  return Promise.resolve([]);
}

function syncVerification(verification) {
  return Promise.resolve();
}

function markVerificationSynced(id) {
  return Promise.resolve();
}

console.log('🎯 SafeSource Customer App Service Worker loaded successfully');