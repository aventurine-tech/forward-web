import en, { type Dictionary } from './en';
import ro from './ro';
import ru from './ru';

export const locales = ['ro', 'en', 'ru'] as const;
export type Locale = (typeof locales)[number];
// Romanian is the primary audience, so it is served at the root; EN and RU live under /en and /ru.
export const defaultLocale: Locale = 'ro';

export const localeNames: Record<Locale, string> = {
  ro: 'Română',
  en: 'English',
  ru: 'Русский',
};

const dictionaries: Record<Locale, Dictionary> = { en, ro, ru };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Value for the [...lang] rest param: undefined for the default locale. */
export function langParam(locale: Locale): string | undefined {
  return locale === defaultLocale ? undefined : locale;
}

/** getStaticPaths helper used by every page under src/pages/[...lang]/. */
export function localePaths() {
  return locales.map((locale) => ({ params: { lang: langParam(locale) }, props: { locale } }));
}

// Base path the site is served from: '/' normally, '/forward-web/' on GitHub Pages.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Build an internal URL for a locale, e.g. path('en', '/about') -> '/en/about/'. */
export function path(locale: Locale, to = '/'): string {
  const clean = to === '/' ? '' : to;
  const local = locale === defaultLocale ? clean || '/' : `/${locale}${clean}`;
  // Pages are built as folders, so the trailing slash avoids a redirect on every click.
  return base + (local.endsWith('/') ? local : `${local}/`);
}

/** Path to a file in public/, honouring the base path. */
export function asset(file: string): string {
  return `${base}/${file.replace(/^\//, '')}`;
}

/** Indexable pages, without locale prefix. Used for the sitemap. */
export const pages = ['/', '/services', '/brands', '/about', '/news', '/careers', '/contact', '/privacy'] as const;

/** Strip the base and locale prefix from a pathname, e.g. '/en/about' -> '/about'. */
export function stripLocale(pathname: string): string {
  const rest = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const parts = rest.split('/').filter(Boolean);
  if (parts.length && (locales as readonly string[]).includes(parts[0])) parts.shift();
  return '/' + parts.join('/');
}

/**
 * Company details shared by every locale.
 * Legal name, IDNO, registration date and address come from the state register
 * (data2b.md, infodebit.md, 2026-11). Phone, fax and email are from the old forward.md.
 * The old site still lists str. Industrială 61; the register and Google Maps give
 * șos. Muncești 801A as the current address.
 */
export const company = {
  name: 'Forward International',
  legalName: '„Forward International” SRL',
  idno: '1003600056900',
  founded: 1994,
  address: {
    ro: ['șos. Muncești 801A', 'MD-2029, Chișinău', 'Republica Moldova'],
    en: ['801A Muncești Highway', 'MD-2029, Chișinău', 'Republic of Moldova'],
    ru: ['шоссе Мунчешть, 801A', 'MD-2029, Кишинёв', 'Республика Молдова'],
  } satisfies Record<Locale, string[]>,
  geo: { lat: 46.93577, lon: 28.95355 },
  phone: '+373 22 47 27 05',
  fax: '+373 22 85 70 60',
  email: 'info@forward.md',
  facebook: 'https://www.facebook.com/p/Forward-International-100063790860323/',
  linkedin: 'https://www.linkedin.com/company/forward-international-srl',
  instagram: 'https://www.instagram.com/forward.international/',
  instagramHandle: '@forward.international',
};

/** Phone number in tel: form. */
export const tel = (n: string) => `tel:${n.replace(/\s+/g, '')}`;

/** True on preview builds (GitHub Pages, Netlify, or PREVIEW=1), which search engines must skip. */
export function isPreview(site: URL | undefined): boolean {
  return Boolean(process.env.PREVIEW) || /(\.github\.io|\.netlify\.app)$/.test(site?.hostname ?? '');
}
