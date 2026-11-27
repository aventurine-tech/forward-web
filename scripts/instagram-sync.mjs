// Pulls the latest posts from the Instagram API and saves them for the News page:
// pictures to public/instagram/<shortcode>.jpg and captions to src/data/instagram.json.
// Needs INSTAGRAM_TOKEN: a long-lived token from the Instagram API with Instagram Login
// (Business or Creator account). The token is refreshed on every run, which keeps it valid.
import { readdir, rm, writeFile, mkdir } from 'node:fs/promises';

const token = process.env.INSTAGRAM_TOKEN;
const COUNT = 6;
const api = 'https://graph.instagram.com';

if (!token) {
  console.log('INSTAGRAM_TOKEN is not set; nothing to do.');
  process.exit(0);
}

const get = async (url) => {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${body?.error?.message ?? ''}`.trim());
  return body;
};

// Extends the token's 60-day lifetime. Fails harmlessly for tokens under 24 hours old.
try {
  const r = await get(`${api}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`);
  console.log(`Token refreshed, valid for ${Math.round(r.expires_in / 86400)} more days.`);
} catch (e) {
  console.log(`::warning::Token refresh failed: ${e.message}`);
}

const fields = 'caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const { data = [] } = await get(`${api}/me/media?fields=${fields}&limit=${COUNT}&access_token=${token}`);

await mkdir('public/instagram', { recursive: true });
const posts = [];
for (const m of data.slice(0, COUNT)) {
  const code = m.permalink?.match(/\/(?:p|reel|tv)\/([^/]+)/)?.[1];
  const picture = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
  if (!code || !picture) continue;
  const res = await fetch(picture);
  if (!res.ok) {
    console.log(`::warning::${code}: picture ${res.status}`);
    continue;
  }
  await writeFile(`public/instagram/${code}.jpg`, Buffer.from(await res.arrayBuffer()));
  posts.push({
    code,
    date: m.timestamp.slice(0, 10),
    video: m.media_type === 'VIDEO',
    caption: (m.caption ?? '').trim(),
  });
  console.log(`ok   ${code} ${m.timestamp.slice(0, 10)}`);
}

if (posts.length === 0) throw new Error('No posts came back from Instagram; keeping the current ones.');

// Pictures of posts that dropped out of the list are no longer needed.
const keep = new Set(posts.map((p) => `${p.code}.jpg`));
for (const f of await readdir('public/instagram')) if (!keep.has(f)) await rm(`public/instagram/${f}`);

await writeFile('src/data/instagram.json', JSON.stringify(posts, null, 2) + '\n');
