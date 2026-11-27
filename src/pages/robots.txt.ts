// robots.txt: points crawlers to the sitemap.
import type { APIRoute } from 'astro';
import { asset } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(asset('sitemap.xml'), site ?? 'https://www.forward.md').href;
  // The GitHub Pages preview is kept out of search engines; the real domain is open.
  const rule = site?.hostname.endsWith('github.io') ? 'Disallow: /' : 'Allow: /';
  return new Response(`User-agent: *\n${rule}\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
