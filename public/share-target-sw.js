// Loaded into the service worker. When a set file is shared to the installed app (Android's share
// sheet), keep it for the app to pick up, then open the app.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.pathname !== '/share-target') return;
  event.respondWith(
    (async () => {
      try {
        const form = await event.request.formData();
        const file = form.get('file');
        if (file && typeof file !== 'string') {
          const cache = await caches.open('kids-flashcards-shared');
          await cache.put('/shared-set', new Response(file, { headers: { 'Content-Type': 'application/json' } }));
        }
      } catch (error) {
        console.warn('Unable to receive the shared file', error);
      }
      // The app checks for a waiting file every time it starts. (A plain "/" is always available
      // offline; other addresses fall back to the offline page.)
      return Response.redirect('/', 303);
    })(),
  );
});
