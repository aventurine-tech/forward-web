// sitemap.xml: every indexable page in all three languages, with hreflang alternates.
import type { APIRoute } from 'astro';
import { defaultLocale, locales, pages, path } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://www.forward.md');
  const url = (locale: (typeof locales)[number], page: string) => new URL(path(locale, page), base).href;
  const entries = pages.flatMap((page) =>
    locales.map((locale) => {
      const alternates = locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, page)}"/>`)
        .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${url(defaultLocale, page)}"/>`)
        .join('\n');
      return `  <url>\n    <loc>${url(locale, page)}</loc>\n${alternates}\n  </url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
