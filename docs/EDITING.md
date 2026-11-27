# Editing the Forward International website

This guide is for the people at Forward who keep the site up to date. Every change below can be
made in the browser on GitHub, without installing anything. When you save ("commit") a change on
the `main` branch, the site rebuilds and goes live by itself in about two minutes.

## How to edit a file on GitHub

1. Open the repository on GitHub and go to the file (paths are given below).
2. Click the pencil icon ("Edit this file").
3. Make the change. Keep quotes, commas and brackets exactly as they are around your text.
4. Click **Commit changes**, write a short note such as "Update phone number", and confirm.
5. Open the **Actions** tab to watch the check. A green tick means the change is fine and
   Netlify publishes it within a couple of minutes. A red cross means something in the file is
   broken (often a missing quote or comma). The live site stays as it was; open the failed run to see which line is wrong, fix it and commit again.

## Common changes

### Text on any page

All text lives in three files, one per language:

- Romanian: `src/i18n/ro.ts`
- English: `src/i18n/en.ts`
- Russian: `src/i18n/ru.ts`

Each file has the same sections in the same order (`home`, `services`, `about`, `careers`, …).
Change the text between the quotes. If you add or remove an item in one language (for example a
new year in the timeline), do the same in the other two, or the build will stop and tell you.

### Phone, email, address, social links

`src/i18n/index.ts`, in the block that starts with `export const company`. These details are
shared by all three languages.

### Key figures (years, shops, pallets, employees, vehicles)

`stats` near the top of each language file.

### Brands

`src/data/brands.ts`. Each line is one brand:

```ts
{ name: 'Tymbark', logo: 'brands/tymbark.png', category: 'drinks' },
```

- To add a brand, upload its logo to `public/brands/` (Add file > Upload files; a PNG with a
  transparent or white background works best), then add a line like the one above.
- `category` is one of `pantry`, `canned`, `frozen`, `dairy`, `drinks`, `snacks`. It decides
  which filter button shows the brand on the Brands page.
- To remove a brand, delete its line.

### Timeline on the About page

`timeline` in the `about` section of each language file. Add a line with the year and text in
all three files.

### Instagram posts on the News page

Once the `INSTAGRAM_TOKEN` secret is set, the 6 latest posts are pulled in every morning
automatically. To pull them right away: **Actions > Sync Instagram posts > Run workflow**.
The README explains how to set up the token and how to add a post by hand.

### Facebook posts

Nothing to do: the News page shows the Facebook page's live timeline.

## Contact and job application forms

Both forms send an email to the address set as `TO_EMAIL` in `form-worker/wrangler.toml`
(info@forward.md). Job applications arrive with the subject "Candidatură de pe site" and, when the applicant
adds one, their CV attached (PDF, Word, JPG or PNG, up to 5 MB). To send
applications or messages somewhere else, change that address; the form worker redeploys by itself.

## Demo protection on Netlify

While the site is shown as a proposal, the Netlify version has a strip at the top marking it as
a design proposal by Radu G, and asks for a password before any page opens.

- The password is the `DEMO_PASSWORD` key in Netlify (Keys and secrets). It is checked on
  Netlify's servers (`netlify/edge-functions/demo-gate.js`), so nothing is sent before it is
  entered. A correct password is remembered for 7 days; changing it signs everyone out.
- At handover, delete `DEMO_PASSWORD` in Netlify and remove the `DEMO = "1"` line from
  `netlify.toml`, then deploy again. The strip and the password page disappear.

## Accounts the site depends on

| Service | What it does | Who should own it |
| --- | --- | --- |
| GitHub | Code and build checks | Forward's own GitHub organisation |
| Netlify | Builds and hosts the site | Forward |
| Cloudflare | Form worker and anti-spam check (Turnstile) | Forward |
| Resend | Sends the form emails from website@forward.md | Forward |
| Meta developer app | Instagram token for the daily sync | Whoever manages the Instagram account |
| Domain registrar for forward.md | Points the domain at the site | Forward (already theirs) |

Keep the logins for these in Forward's password manager, not in one person's inbox.
