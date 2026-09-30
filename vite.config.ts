import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const NAME = 'Kids Flashcards';
const DESCRIPTION =
  'Make flashcards with your own photos and voice, or add from 60+ ready-made sets. Games, stickers and practice for kids 2 and up. Free, private and works offline.';
const BRAND_BLUE = '#2563eb';
const BACKGROUND = '#f4f7ff';

// Structured data for search engines: what the app is, who it's for, and who makes it.
function structuredData(siteUrl: string) {
  const publisher = { '@type': 'Organization', '@id': 'https://bchain.coffee/#organization', name: 'Beanchain Coffee', url: 'https://bchain.coffee' };
  return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${siteUrl}/#app`,
          name: NAME,
          url: `${siteUrl}/`,
          description: DESCRIPTION,
          image: `${siteUrl}/og-image.png`,
          screenshot: `${siteUrl}/screenshots/home-narrow.jpg`,
          applicationCategory: 'EducationalApplication',
          applicationSubCategory: 'Flashcards',
          operatingSystem: 'Any',
          browserRequirements: 'Runs in a modern web browser. Can be installed, and works offline.',
          inLanguage: 'en',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          audience: { '@type': 'PeopleAudience', suggestedMinAge: 2 },
          featureList: [
            'Make flashcards with your own photos, colors or text, and record your own voice',
            '60+ ready-made sets: animals, everyday words, feelings, science, math, reading, Spanish, French, flags and computers',
            '"How it works" explanations for tricky ideas like binary, fractions and logic gates',
            'Practice for each child with spaced repetition, and difficulty that adjusts as they learn',
            'Games: memory match, listen and find, and odd one out',
            'Stickers and a gentle days-in-a-row streak',
            'Print sets as two-sided flashcards',
            'Share sets as files, and back up everything',
            'Works offline; cards and progress stay on the device',
          ],
          publisher: { '@id': publisher['@id'] },
        },
        { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: NAME, url: `${siteUrl}/`, inLanguage: 'en', publisher: { '@id': publisher['@id'] } },
        publisher,
      ],
    };
  }

  /**
   * Adds what needs the site's own address (the canonical link, the share image's full address and
   * structured data) to index.html, and writes robots.txt and a sitemap. Netlify sets URL during its
   * builds; set SITE_URL to build for somewhere else. Without an address, those parts are left out.
   */
  function siteMeta(siteUrl: string): Plugin {
    const image = `${siteUrl}/og-image.png`;
    return {
      name: 'site-meta',
      transformIndexHtml() {
        const meta = (property: string, content: string) => ({ tag: 'meta', attrs: { property, content }, injectTo: 'head' as const });
        if (!siteUrl) return [meta('og:image', '/og-image.png')];
        return [
          { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' },
          meta('og:url', `${siteUrl}/`),
          meta('og:image', image),
          { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' },
          {
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(structuredData(siteUrl)),
            injectTo: 'head',
          },
        ];
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`,
        });
        if (!siteUrl) return;
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${siteUrl}/</loc></url>\n</urlset>\n`,
        });
      },
    };
  }

  export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', ['SITE_URL', 'URL']);
    const siteUrl = (env.SITE_URL || env.URL || '').replace(/\/+$/, '');
    return {
    plugins: [
      react(),
      siteMeta(siteUrl),
      VitePWA({
        registerType: 'autoUpdate',
        // The install icons are only needed online, when installing.
        includeManifestIcons: false,
        manifest: {
          id: '/',
          name: NAME,
          short_name: 'Flashcards',
          description: DESCRIPTION,
          lang: 'en',
          dir: 'ltr',
          categories: ['education', 'kids'],
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: BACKGROUND,
          theme_color: BRAND_BLUE,
          // Set files can be shared to the installed app (Android) or opened with it (computers).
          share_target: {
            action: '/share-target',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: { files: [{ name: 'file', accept: ['application/json', '.json'] }] },
          },
          file_handlers: [{ action: '/', accept: { 'application/json': ['.json'] } }],
          launch_handler: { client_mode: 'focus-existing' },
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            // Full-bleed, for launchers that cut their own shape.
            { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // Shown when installing the app.
          screenshots: [
            {
              src: '/screenshots/home-narrow.jpg',
              sizes: '780x1688',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Pick a set to learn, or practice with each child',
            },
            {
              src: '/screenshots/set-narrow.jpg',
              sizes: '780x1688',
              type: 'image/jpeg',
              form_factor: 'narrow',
              label: 'Tap a card to flip it over and hear the word',
            },
            {
              src: '/screenshots/home-wide.jpg',
              sizes: '1280x800',
              type: 'image/jpeg',
              form_factor: 'wide',
              label: 'Sets and practice on a computer or tablet',
            },
          ],
        },
        workbox: {
          mode: mode === 'production' ? 'production' : 'development',
          sourcemap: mode !== 'production',
          navigateFallback: '/offline.html',
          // Receives set files shared to the app (see public/share-target-sw.js).
          importScripts: ['share-target-sw.js'],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,mp3,woff2}'],
          // Only needed when sharing a link or installing, both online, so they aren't stored for offline use.
          globIgnores: ['og-image.png', 'screenshots/**', 'icons/**'],
          runtimeCaching: [
            // The app's font (Baloo 2), so text looks and fits the same offline.
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'audio',
              handler: 'CacheFirst',
              options: {
                cacheName: 'audio',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'document',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
              },
            },
          ],
        },
      }),
    ],
    server: {
      port: 5173,
    },
  };
});
