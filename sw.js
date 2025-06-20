// Nom du cache
const CACHE_NAME = 'coran-app-v1';

// Fichiers à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/src/js/state.js',
  '/src/js/storage.js',
  '/src/js/api.js',
  '/src/js/setup.js',
  '/src/js/app.js',
  '/src/js/global-functions.js',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des fichiers');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes de navigation dans StackBlitz ou les environnements de développement
  if (event.request.mode === 'navigate' && 
      (event.request.url.includes('webcontainer-api.io') || 
       event.request.url.includes('stackblitz') ||
       event.request.url.includes('localhost'))) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retourner la version en cache ou récupérer depuis le réseau
        if (response) {
          return response;
        }
        
        // Cloner la requête car elle ne peut être utilisée qu'une fois
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse car elle ne peut être utilisée qu'une fois
          const responseToCache = response.clone();

          // Ajouter au cache
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Si les deux échouent, retourner la page d'accueil pour les documents
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
          
          // Pour les API, retourner une réponse vide mais valide
          if (event.request.url.includes('api.alquran.cloud') || 
              event.request.url.includes('api.aladhan.com')) {
            return new Response(JSON.stringify({
              code: 200,
              status: 'OK',
              data: { offline: true }
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        });
      })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  console.log('Service Worker: Synchronisation en arrière-plan');
  // Implémenter la synchronisation des données
  return Promise.resolve();
}

// Gestion des notifications push
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxYTVmM2YiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik00IDRoMTZ2MTZINFoiLz4KPHBhdGggZD0iTTggMTJoOCIvPgo8L3N2Zz4KPC9zdmc+',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiMxYTVmM2YiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CjxwYXRoIGQ9Ik00IDRoMTZ2MTZINFoiLz4KPHBhdGggZD0iTTggMTJoOCIvPgo8L3N2Zz4KPC9zdmc+',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Coran App', options)
  );
});

// Clic sur notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});