// Share pictures: /og/<locale>/<page>.jpg, one per page and language (see src/og/render.ts).
import type { APIRoute, GetStaticPaths } from 'astro';
import { locales, pages, type Locale } from '../../../i18n';
import { ogCard, ogSlug } from '../../../og/cards';
import { renderOg } from '../../../og/render';

export const getStaticPaths = (() =>
  locales.flatMap((locale) =>
    pages.map((page) => ({ params: { locale, page: ogSlug(page) }, props: { locale, page } })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { locale, page } = props as { locale: Locale; page: string };
  const jpg = await renderOg(ogCard(locale, page));
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
