// Netlify Edge Function: keeps the whole demo behind a password, checked on Netlify's servers.
// Nothing (pages, pictures, code) is sent until the visitor has entered DEMO_PASSWORD, which is
// set in Netlify under Keys and secrets. Without that key the site is open as usual.
const COOKIE = 'forward_demo';
const WEEK = 60 * 60 * 24 * 7;

const text = {
  ro: { title: 'Previzualizare privată', lead: 'Introduceți parola primită pentru a vedea propunerea.', field: 'Parolă', go: 'Deschide', wrong: 'Parolă greșită.' },
  en: { title: 'Private preview', lead: 'Enter the password you were given to view the proposal.', field: 'Password', go: 'Open', wrong: 'Wrong password.' },
  ru: { title: 'Закрытый просмотр', lead: 'Введите полученный пароль, чтобы увидеть предложение.', field: 'Пароль', go: 'Открыть', wrong: 'Неверный пароль.' },
};

async function sha256(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeNext(value) {
  const next = typeof value === 'string' ? value : '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

function esc(value) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function loginPage(next, wrong) {
  const lang = (next.match(/^\/(en|ru)(\/|$)/) || [])[1] || 'ro';
  const t = text[lang];
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${t.title}</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;
font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#f4f8fc;color:#0b1f33}
form{width:min(100%,380px);display:grid;gap:14px;padding:32px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;text-align:center}
h1{margin:0;font-size:1.6rem}p{margin:0;color:#5b6b7c}label{display:grid;gap:6px;text-align:left;font-weight:600}
input{font:inherit;padding:12px 14px;border:1px solid #cfd8e3;border-radius:12px}
button{font:inherit;font-weight:700;padding:13px;border:0;border-radius:999px;background:#1d6fb0;color:#fff;cursor:pointer}
.err{color:#c0362c;font-weight:600}</style></head><body>
<form method="post" action="/__demo-login"><h1>${t.title}</h1><p>${t.lead}</p>
<label>${t.field}<input type="password" name="pw" autocomplete="off" required autofocus></label>
${wrong ? `<p class="err" role="alert">${t.wrong}</p>` : ''}
<input type="hidden" name="next" value="${esc(next)}"><button type="submit">${t.go}</button></form></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}

// One line per event in Netlify's Edge Function logs (Logs > Edge Functions), so it is visible
// who opened the demo and when. To count unique visitors without storing addresses:
// - "visitor" is a random ID kept in a cookie, so it is one browser (one person, one device);
// - "network" is a short scrambled code of the IP address (salted with the password, so the
//   address itself is never written down). People in the same office usually share a network.
// Visiting /__demo-me once marks that browser as the owner, and its lines say "OWNER".
const VID = 'forward_vid';
const ME = 'forward_me';
const YEAR = 60 * 60 * 24 * 365;

async function log(event, request, context, ids, extra = {}) {
  const geo = context.geo || {};
  const ua = request.headers.get('user-agent') || '';
  const device = /mobile|iphone|android/i.test(ua) ? 'phone' : 'computer';
  const place = [geo.city, geo.country && geo.country.name].filter(Boolean).join(', ') || 'unknown place';
  const who = ids.me ? 'OWNER' : `visitor ${ids.visitor}`;
  console.log(`[demo] ${event} | ${who} | network ${ids.network} | ${place} | ${device}${extra.path ? ` | ${extra.path}` : ''}`);
}

function withCookies(response, ids) {
  if (ids.fresh) response.headers.append('Set-Cookie', `${VID}=${ids.visitor}; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Lax`);
  return response;
}

const isPage = (request) => (request.headers.get('accept') || '').includes('text/html');

export default async (request, context) => {
  const password = (Netlify.env.get('DEMO_PASSWORD') || '').trim();
  if (!password) return;
  const token = await sha256(`${password}:forward-demo`);
  const url = new URL(request.url);
  const known = context.cookies.get(VID);
  const ids = {
    visitor: /^[0-9a-f]{8}$/.test(known || '') ? known : crypto.randomUUID().slice(0, 8),
    fresh: !/^[0-9a-f]{8}$/.test(known || ''),
    network: (await sha256(`${context.ip || 'unknown'}:${password}`)).slice(0, 8),
    me: context.cookies.get(ME) === '1',
  };

  if (url.pathname === '/__demo-me') {
    console.log(`[demo] owner marked | visitor ${ids.visitor} | network ${ids.network}`);
    const response = new Response(null, { status: 303, headers: { Location: '/', 'Cache-Control': 'no-store' } });
    response.headers.append('Set-Cookie', `${ME}=1; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Lax`);
    return withCookies(response, ids);
  }

  if (url.pathname === '/__demo-login' && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    if (String(form.get('pw') || '').trim() !== password) {
      await log('wrong password', request, context, ids);
      return withCookies(loginPage(next, true), ids);
    }
    await log('login', request, context, ids);
    const response = new Response(null, { status: 303, headers: { Location: next, 'Cache-Control': 'no-store' } });
    response.headers.append('Set-Cookie', `${COOKIE}=${token}; Path=/; Max-Age=${WEEK}; HttpOnly; Secure; SameSite=Lax`);
    return withCookies(response, ids);
  }

  if (context.cookies.get(COOKIE) === token) {
    if (isPage(request)) await log('page view', request, context, ids, { path: url.pathname });
    const response = await context.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
    return withCookies(response, ids);
  }
  if (isPage(request)) await log('password page shown', request, context, ids, { path: url.pathname });
  return withCookies(loginPage(url.pathname + url.search, false), ids);
};

export const config = { path: '/*' };
