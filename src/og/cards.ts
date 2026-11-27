// What each page's share picture says. Titles and text come from the page copy in src/i18n,
// so a change there shows up in the picture on the next build.
import { company, t, type Locale } from '../i18n';
import type { OgCard } from './render';

/** Page path (as in `pages` from src/i18n) to the file name of its share picture. */
export function ogSlug(page: string): string {
  return page === '/' ? 'home' : page.replace(/^\//, '');
}

const domain = 'forward.md';

export function ogCard(locale: Locale, page: string): OgCard {
  const d = t(locale);
  const label = d.home.eyebrow;
  switch (page) {
    case '/':
      return { label, title: d.home.title, text: d.home.lead, photo: 'warehouse', domain };
    case '/services':
      return { label: company.name, title: d.servicesPage.title, text: d.servicesPage.lead, photo: 'fleet', domain };
    case '/brands':
      return { label: company.name, title: d.brandsPage.title, text: d.brandsPage.lead, photo: 'warehouse', domain };
    case '/about':
      return { label: company.name, title: d.about.title, text: d.about.lead, photo: 'city', domain };
    case '/news':
      return { label: company.name, title: d.news.title, text: d.news.lead, photo: 'city', domain };
    case '/careers':
      return { label: company.name, title: d.careers.title, text: d.careers.lead, photo: 'fleet', domain };
    case '/contact':
      return { label: company.name, title: d.contact.title, text: d.contact.lead, photo: 'city', domain };
    case '/privacy':
      return { label: company.name, title: d.privacy.title, text: company.legalName, photo: 'warehouse', domain };
    default:
      throw new Error(`No share picture defined for ${page}`);
  }
}
