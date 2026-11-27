# Forward International website

New site for [Forward International](https://www.forward.md), a food import, warehousing and
distribution company in Moldova (since 1994). Built with [Astro](https://astro.build) as a fully
static site, in Romanian (default, at `/`), English (`/en/...`) and Russian (`/ru/...`).

## Getting started

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # type-checks, then writes the static site to dist/
npm run preview  # serves dist/ locally
```

## Where things live

| What | Where |
| --- | --- |
| All copy, per language | `src/i18n/ro.ts`, `en.ts`, `ru.ts` (one shared type: a missing key fails the build) |
| Address, phone, email, IDNO, social links | `company` in `src/i18n/index.ts` |
| Partner brands | `src/data/brands.ts`, logos in `public/brands/` |
| Logo (vector) | `src/data/logo.ts`, redrawn from `design/reference/logo-amcham.jpg` by `scripts/build-logo.py` |
| Photos | `public/photos/` (WebP + JPEG); originals from the old site in `design/legacy/` |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, key figures, services, why Forward, brand wall, story, call to action |
| `/services` | Distribution, warehousing, transport, merchandising (each with an anchor) |
| `/brands` | Partner brand logos and own brands |
| `/about` | Story, motto, portfolio timeline, values, quality |
| `/contact` | Office, phone, email, company details, contact form, map |
| `/thanks`, `/privacy`, `/404` | Form confirmation, privacy, not found |

Old forward.md addresses (`/ro/servicii/`, `/ro/contacts/`, `/ro/about/`, `/ro/news/` and their
EN/RU versions) redirect to the new pages (see `redirects` in `astro.config.mjs`).

## Content sources

Copy and figures come from the old forward.md, the state register (data2b.md, infodebit.md) and
the company's LinkedIn page. To check before launch:

- **Address:** the old site says str. Industrială 61; the register and Google Maps say
  șos. Muncești 801A, which the new site uses.
- **Figures:** 70+ vehicles and 3,000+ products date from 2019; 400+ employees is from the
  register (406). Update in `stats` in each language file.
- **Brands:** the list is the one on the old site. Own brands (Morarița, Poienița) are from a 2018
  news post.
- EN and RU copy were written fresh (the old EN/RU pages were mostly untranslated); have them
  reviewed by native speakers.

## Contact form

The form posts to a small Cloudflare Worker in `form-worker/`. It checks Cloudflare Turnstile,
ignores honeypot hits and emails the message to info@forward.md through Resend, sending from
`website@forward.md`. Until it is set up, the form only shows the thank-you page.

To turn it on, add these in GitHub under Settings > Secrets and variables > Actions, either
separately or as `NAME: value` lines in one `FORWARD_FORME` secret / `FORWARD_FORM` variable:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API token with "Edit Cloudflare Workers" |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| Secret | `TURNSTILE_SECRET` | Turnstile widget secret key |
| Secret | `RESEND_API_KEY` | Resend API key |
| Variable | `FORM_WORKER_ENABLED` | `true` |
| Variable | `TURNSTILE_SITE_KEY` | Turnstile widget site key |
| Variable | `FORM_ENDPOINT` | The worker URL, e.g. `https://forward-form.<subdomain>.workers.dev` |

## Deploying

`.github/workflows/deploy.yml` builds the site and publishes it to GitHub Pages on every push.
To serve it at forward.md, add the domain under Settings > Pages and point DNS at GitHub Pages.
