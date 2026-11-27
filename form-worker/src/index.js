// Contact and job application form handler for forward.md.
// The site's forms post here as normal HTML forms (kind=job marks a job application).
// We verify the Turnstile token,
// drop honeypot hits, email the message to the office and redirect back to the site.

const LOCALES = { ro: '', en: '/en', ru: '/ru' };
// CVs sent with job applications: PDF, Word or a photo, up to 5 MB (Resend allows 40 MB per email).
const CV_TYPES = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const CV_MAX = 5 * 1024 * 1024;
const LIMITS = { firstName: 80, lastName: 80, email: 200, company: 160, phone: 40, position: 120, message: 5000 };

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    const prefix = LOCALES[form.get('lang')] ?? '';
    const job = form.get('kind') === 'job';
    const to = (page, query = '') => Response.redirect(`${env.SITE_URL}${prefix}/${page}/${query}`, 303);
    const fail = (reason) => to(job ? 'careers' : 'contact', `?form=${reason}#form`);

    // Honeypot: real people never see or fill this field. Pretend it worked.
    if (form.get('website')) return to('thanks');

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: String(form.get('cf-turnstile-response') ?? ''),
        remoteip: request.headers.get('CF-Connecting-IP') ?? '',
      }),
    }).then((r) => r.json()).catch(() => ({ success: false }));
    if (!verify.success) return fail('captcha');

    const f = {};
    for (const [key, max] of Object.entries(LIMITS)) {
      f[key] = String(form.get(key) ?? '').trim().slice(0, max);
    }
    if (!f.firstName || !f.lastName || !f.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      return fail('invalid');
    }

    // Optional CV upload (job applications only).
    const attachments = [];
    const cv = job ? form.get('cv') : null;
    if (cv && typeof cv === 'object' && cv.size > 0) {
      const ext = String(cv.name).split('.').pop().toLowerCase();
      if (!CV_TYPES[ext] || cv.size > CV_MAX) return fail('file');
      const bytes = new Uint8Array(await cv.arrayBuffer());
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const safe = `${f.firstName}-${f.lastName}`.normalize('NFKD').replace(/[^\w-]+/g, '').slice(0, 60) || 'candidat';
      attachments.push({ filename: `CV-${safe}.${ext}`, content: btoa(bin) });
    }

    const text = [
      `Nume: ${f.firstName} ${f.lastName}`,
      `Email: ${f.email}`,
      job ? `Telefon: ${f.phone || '-'}` : `Companie: ${f.company || '-'}`,
      ...(job ? [`Post: ${f.position || '-'}`] : []),
      ...(job ? [`CV: ${attachments.length ? 'atașat' : 'nu a fost trimis'}`] : []),
      `Limba site-ului: ${form.get('lang') || 'ro'}`,
      '',
      f.message,
    ].join('\n');
    const subject = job
      ? `Candidatură de pe site: ${f.firstName} ${f.lastName} (${f.position || 'post nespecificat'})`
      : `Mesaj nou de pe site: ${f.firstName} ${f.lastName}`;

    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.TO_EMAIL],
        reply_to: f.email,
        subject: subject.replace(/[\r\n]+/g, ' '),
        text,
        ...(attachments.length ? { attachments } : {}),
      }),
    }).catch(() => null);
    if (!sent || !sent.ok) return fail('error');

    return to('thanks');
  },
};
