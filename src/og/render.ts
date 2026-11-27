// Share pictures (Open Graph) for every page and language, drawn at build time.
// Facebook, Viber, WhatsApp, Telegram and LinkedIn all read og:image; 1200x630 (1.91:1) is the
// size Facebook asks for and the others crop it well. Satori lays the card out and turns the
// text into shapes, so no font has to be installed on the build machine; sharp saves it as JPEG.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { brandBlue, chevronPath, logoViewBox, wordPath } from '../data/logo';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const root = process.cwd();
const fontDir = join(root, 'node_modules/@fontsource/inter/files');

// Inter in the three subsets the site needs (Romanian diacritics and Cyrillic included).
// Satori takes .woff but not .woff2, so these come from @fontsource rather than public/fonts.
// Each subset gets its own family name; the card lists all three so missing letters fall through.
const families = { latin: 'Inter', 'latin-ext': 'InterExt', cyrillic: 'InterCyr' } as const;
let fonts: { name: string; data: Buffer; weight: 500 | 800; style: 'normal' }[] | undefined;
function loadFonts() {
  fonts ??= (['latin', 'latin-ext', 'cyrillic'] as const).flatMap((subset) =>
    ([500, 800] as const).map((weight) => ({
      name: families[subset],
      data: readFileSync(join(fontDir, `inter-${subset}-${weight}-normal.woff`)),
      weight,
      style: 'normal' as const,
    })),
  );
  return fonts;
}

const photoCache = new Map<string, string>();
/** A photo from public/photos, cut to the right-hand panel and inlined as a data URI. */
async function photo(name: string): Promise<string> {
  const hit = photoCache.get(name);
  if (hit) return hit;
  const buf = await sharp(join(root, 'public/photos', `${name}.jpg`))
    .resize(PHOTO_W, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82 })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${buf.toString('base64')}`;
  photoCache.set(name, uri);
  return uri;
}

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// White logo for a blue background: white square with blue chevrons, white wordmark.
const logoSvg = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${logoViewBox}">` +
    `<path d="M0 0H419V422H0Z" fill="#fff"/><path d="${chevronPath}" fill="${brandBlue}"/>` +
    `<path d="${wordPath}" fill="#fff"/></svg>`,
);

const PHOTO_W = 520;
const PANEL_W = OG_WIDTH - PHOTO_W + 90; // the panel's arrow point reaches into the photo
// Blue panel whose right edge is one of the logo's chevrons, pointing forward.
const panelSvg = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_W}" height="${OG_HEIGHT}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#12304c"/><stop offset="0.55" stop-color="#175f96"/><stop offset="1" stop-color="#1d77ba"/>` +
    `</linearGradient></defs>` +
    `<path d="M0 0H${PANEL_W - 90}L${PANEL_W} ${OG_HEIGHT / 2}L${PANEL_W - 90} ${OG_HEIGHT}H0Z" fill="url(#g)"/>` +
    `</svg>`,
);
// A second chevron just ahead of the panel, echoing the double chevron in the logo.
const echoSvg = svgUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="${OG_HEIGHT}">` +
    `<path d="M0 0H40L130 ${OG_HEIGHT / 2}L40 ${OG_HEIGHT}H0L90 ${OG_HEIGHT / 2}Z" fill="${brandBlue}" fill-opacity="0.85"/></svg>`,
);

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Node => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});
const img = (src: string, style: Record<string, unknown>): Node => ({ type: 'img', props: { src, style } });

export interface OgCard {
  /** Small line above the title. */
  label: string;
  title: string;
  /** One or two sentences under the title; long text is cut with an ellipsis. */
  text?: string;
  /** File name (without .jpg) of a picture in public/photos. */
  photo: string;
  /** Shown bottom left, e.g. "forward.md". */
  domain: string;
}

/** Cut text at a word boundary so it fits in about three lines. */
function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,:;.]$/, '')}…`;
}

/** Draw one share picture and return it as JPEG bytes. */
export async function renderOg(card: OgCard): Promise<Buffer> {
  const titleSize = card.title.length > 26 ? 50 : card.title.length > 15 ? 54 : 72;
  const textW = PANEL_W - 90 - 72 - 30;
  const tree = h(
    'div',
    { width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', position: 'relative', backgroundColor: '#12304c', fontFamily: Object.values(families).join(', ') },
    img(await photo(card.photo), { position: 'absolute', right: 0, top: 0, width: PHOTO_W, height: OG_HEIGHT, objectFit: 'cover' }),
    img(echoSvg, { position: 'absolute', left: PANEL_W - 76, top: 0, width: 130, height: OG_HEIGHT }),
    img(panelSvg, { position: 'absolute', left: 0, top: 0, width: PANEL_W, height: OG_HEIGHT }),
    h(
      'div',
      {
        position: 'absolute',
        left: 72,
        top: 60,
        width: textW,
        height: OG_HEIGHT - 60 - 104,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#fff',
      },
      img(logoSvg, { width: 262, height: 64 }),
      h(
        'div',
        { display: 'flex', flexDirection: 'column' },
        h('div', { fontSize: 22, fontWeight: 500, color: '#9fd0f3', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18 }, card.label),
        h('div', { fontSize: titleSize, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }, card.title),
        ...(card.text
          ? [
              h(
                'div',
                { fontSize: 24, fontWeight: 500, lineHeight: 1.4, color: '#d4e9f8', marginTop: 22 },
                shorten(card.text, 150),
              ),
            ]
          : []),
      ),
    ),
    h(
      'div',
      { position: 'absolute', left: 72, bottom: 52, display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 500, color: '#d4e9f8' },
      h('div', { width: 28, height: 4, backgroundColor: brandBlue, marginRight: 14, borderRadius: 2 }),
      h('div', {}, card.domain),
    ),
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loadFonts(),
  });
  return sharp(Buffer.from(svg)).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
}
