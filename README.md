# Forward International website

New site for [Forward International](https://www.forward.md), a food import, warehousing and
distribution company in Moldova (since 1994). Built with [Astro](https://astro.build) as a fully
static site, in Romanian (default, at `/`), English (`/en/...`) and Russian (`/ru/...`).

For non-developers: see [docs/EDITING.md](docs/EDITING.md) for how to change text, brands,
figures and posts from the browser.

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
| Partner brands and their product groups | `src/data/brands.ts`, logos in `public/brands/` |
| Coverage map (Moldova outline, towns) | `src/data/moldova.ts`, `src/components/CoverageMap.astro` |
| Font (Inter, self-hosted) | `public/fonts/` |
| Logo (vector) | `src/data/logo.ts`, redrawn from `design/reference/logo-amcham.jpg` by `scripts/build-logo.py` |
| Photos | `public/photos/` (WebP + JPEG); originals from the old site in `design/legacy/` |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, key figures, services, why Forward, coverage map, brand wall, story, call to action |
| `/services` | Distribution, warehousing, transport, merchandising (each with an anchor), coverage map |
| `/brands` | Partner brand logos with a product-group filter, and own brands |
| `/about` | Story, motto, portfolio timeline, values, quality |
| `/news` | Latest Instagram posts (`src/data/instagram.json`) and the live Facebook timeline |
| `/careers` | Why work at Forward, teams, job application form with optional CV upload (same form worker, `kind=job`; the CV is emailed as an attachment) |
| `/contact` | Office, phone, email, company details, contact form, map |
| `/thanks`, `/privacy`, `/404` | Form confirmation, privacy, not found (thanks and 404 are `noindex`) |
| `/sitemap.xml`, `/robots.txt` | Generated from `pages` in `src/i18n/index.ts` |

Old forward.md addresses (`/ro/servicii/`, `/ro/contacts/`, `/ro/about/`, and their
EN/RU versions) redirect to the new pages (see `redirects` in `astro.config.mjs`). Old news
articles (`/ro/news/newsdetalii/…`) land on the 404 page, which forwards them to the News page.

## Search engines

While the site runs on the GitHub Pages preview (`*.github.io`), every page carries
`noindex` and `robots.txt` disallows crawling, so the preview never competes with forward.md.
Both switch to indexable automatically once the site is built for the real domain. After the
switch, submit `https://www.forward.md/sitemap.xml` in Google Search Console.

## Content sources

Copy and figures come from the old forward.md, the state register (data2b.md, infodebit.md) and
the company's LinkedIn page. To check before launch:

- **Address:** the old site says str. Industrială 61; the register and Google Maps say
  șos. Muncești 801A, which the new site uses.
- **Figures:** 70+ vehicles and 3,000+ products date from 2019; 400+ employees is from the
  register (406). Update in `stats` in each language file.
- **Brands:** the list is the one on the old site. Own brands (Morarița, Poienița) are from a 2018
  news post. The product group of each brand (for the filter) was assigned from what the brand
  sells; confirm it.
- **Careers:** the teams and reasons to join are general (based on the company's size, services
  and Instagram posts), not specific vacancies.
- **Coverage map:** the towns illustrate national coverage; they are not a list of real routes.
- EN and RU copy were written fresh (the old EN/RU pages were mostly untranslated); have them
  reviewed by native speakers.

## News page

The Facebook section uses Facebook's Page Plugin, so new Facebook posts appear on their own.

The Instagram grid is drawn by the site itself, so the page loads nothing from Instagram.
Posts are in `src/data/instagram.json` and their pictures in `public/instagram/`.

### Automatic updates (daily)

`.github/workflows/instagram-sync.yml` runs every day at 05:17 UTC, pulls the 6 latest posts
through the Instagram API, commits them and redeploys the site. It can also be started by hand
under Actions > Sync Instagram posts > Run workflow. It needs one secret:

1. The Instagram account must be a **Business** or **Creator** account (Instagram app >
   Settings > Account type and tools).
2. At [developers.facebook.com](https://developers.facebook.com/apps) create an app of type
   **Business** and add the **Instagram** product, then choose "API setup with Instagram login".
3. Under "Generate access tokens", add the Forward Instagram account and log in with it. Copy
   the token it shows (a long-lived token, valid 60 days).
4. In GitHub, add it as the repository secret `INSTAGRAM_TOKEN` (Settings > Secrets and
   variables > Actions > New repository secret).

The job refreshes the token on every run, so it keeps working as long as it runs at least once
every 60 days. Without the secret the job does nothing and the current posts stay.

### Adding a post by hand

1. Add its shortcode, date, whether it is a video, and caption to `src/data/instagram.json`
   (newest first).
2. Add a line `<shortcode> <picture URL>` to `scripts/instagram-images.txt`. The picture URL
   is the post's `og:image`, which a browser shows in the page source of the post.
3. Push. The "Save Instagram pictures" workflow saves the picture to `public/instagram/`.
   Posts without a picture are left out of the grid.

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
