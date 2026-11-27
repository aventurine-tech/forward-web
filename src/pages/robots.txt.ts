// robots.txt: points crawlers to the sitemap.
import type { APIRoute } from 'astro';
import { asset, isPreview } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(asset('sitemap.xml'), site ?? 'https://www.forward.md').href;
  // Previews are kept out of search engines; the real domain is open.
  const rule = isPreview(site) ? 'Disallow: /' : 'Allow: /';
  return new Response(`User-agent: *\n${rule}\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
