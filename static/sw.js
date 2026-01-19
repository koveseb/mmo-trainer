const CACHE_NAME = 'mmo-trainer-v1';
const STATIC_ASSETS = [
	'/',
	'/train',
	'/history',
	'/settings',
	'/manifest.json'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	
	const url = new URL(event.request.url);
	
	if (url.pathname.startsWith('/api/')) {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				if (response.ok) {
					const responseClone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseClone);
					});
				}
				return response;
			})
			.catch(() => {
				return caches.match(event.request);
			})
	);
});

self.addEventListener('push', (event) => {
	const data = event.data ? event.data.json() : {};
	const title = data.title || 'MMO Trainer';
	const options = {
		body: data.body || '',
		icon: '/icon.svg',
		badge: '/icon.svg',
		vibrate: data.vibrate || [200, 100, 200],
		tag: data.tag || 'mmo-notification',
		renotify: true
	};

	event.waitUntil(
		self.registration.showNotification(title, options)
	);
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil(
		clients.matchAll({ type: 'window' }).then((clientList) => {
			for (const client of clientList) {
				if (client.url.includes('/train') && 'focus' in client) {
					return client.focus();
				}
			}
			if (clients.openWindow) {
				return clients.openWindow('/train');
			}
		})
	);
});
