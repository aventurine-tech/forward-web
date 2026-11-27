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

export default async (request, context) => {
  const password = (Netlify.env.get('DEMO_PASSWORD') || '').trim();
  if (!password) return;
  const token = await sha256(`${password}:forward-demo`);
  const url = new URL(request.url);

  if (url.pathname === '/__demo-login' && request.method === 'POST') {
    const form = await request.formData();
    const next = safeNext(form.get('next'));
    if (String(form.get('pw') || '').trim() !== password) return loginPage(next, true);
    return new Response(null, {
      status: 303,
      headers: {
        Location: next,
        'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${WEEK}; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    });
  }

  if (context.cookies.get(COOKIE) === token) {
    const response = await context.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }
  return loginPage(url.pathname + url.search, false);
};

export const config = { path: '/*' };
