// Downloads the picture and caption of each post in scripts/instagram-posts.txt from
// Instagram's public embed page, so the News page can show its own clean grid without
// loading Instagram's scripts. Writes public/instagram/<code>.jpg and src/data/instagram.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .trim();

const list = (await readFile('scripts/instagram-posts.txt', 'utf8'))
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [code, date] = l.split(/\s+/);
    return { code, date };
  });

let old = [];
try {
  old = JSON.parse(await readFile('src/data/instagram.json', 'utf8'));
} catch {}

await mkdir('public/instagram', { recursive: true });
const out = [];
for (const { code, date } of list) {
  const prev = old.find((p) => p.code === code);
  try {
    const res = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, {
      headers: { 'user-agent': UA, 'accept-language': 'ro,en;q=0.8' },
    });
    if (!res.ok) throw new Error(`embed ${res.status}`);
    const html = await res.text();
    const img =
      html.match(/class="EmbeddedMediaImage"[^>]*?src="([^"]+)"/)?.[1] ??
      html.match(/<img[^>]+src="([^"]+)"[^>]*class="EmbeddedMediaImage"/)?.[1] ??
      html.match(/"display_url":"([^"]+)"/)?.[1]?.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    if (!img) throw new Error('no image in embed page');
    const pic = await fetch(decode(img), { headers: { 'user-agent': UA } });
    if (!pic.ok) throw new Error(`image ${pic.status}`);
    await writeFile(`public/instagram/${code}.jpg`, Buffer.from(await pic.arrayBuffer()));
    let caption = '';
    const cap = html.match(/<div class="Caption">([\s\S]*?)<div class="CaptionComments">/)?.[1];
    if (cap) caption = decode(cap.replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/, ''));
    const video = /"is_video":true|class="[^"]*Video|data-media-type="GraphVideo"/.test(html);
    out.push({ code, date, video, caption: caption || prev?.caption || '' });
    console.log(`ok   ${code} (${caption.length} chars)`);
  } catch (e) {
    console.log(`::warning::${code}: ${e.message}`);
    if (prev) out.push({ ...prev, date });
  }
}
await writeFile('src/data/instagram.json', JSON.stringify(out, null, 2) + '\n');
