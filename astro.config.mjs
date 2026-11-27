// @ts-check
import { defineConfig } from 'astro/config';

// Static site. Locales are handled by src/pages/[...lang]/:
// Romanian (default) is served at the root, English under /en and Russian under /ru.
// SITE and BASE_PATH are set by the GitHub Pages workflow; on Netlify, URL is its site address.
// Defaults suit the real domain.
export default defineConfig({
  site: (process.env.SITE ?? process.env.URL ?? 'https://www.forward.md').replace(/^http:/, 'https:'),
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  // Old forward.md addresses, so existing links and search results keep working.
  redirects: {
    '/ro': '/',
    '/ro/about': '/about',
    '/ro/servicii': '/services',
    '/ro/contacts': '/contact',
    '/ro/news': '/news',
    '/ro/produse': '/brands',
    '/en/servicii': '/en/services',
    '/en/contacts': '/en/contact',
    '/ru/servicii': '/ru/services',
    '/ru/contacts': '/ru/contact',
  },
});
