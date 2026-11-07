// Cloudflare Pages Function — POST /api/paddle
// Paddle webhook ("payment approved" notification). Replaces the old Netlify function.
// Data stays in Firebase (Firestore). It talks to Firestore through the REST API (no firebase-admin needed on Workers).
// Secrets (Cloudflare Pages > Settings > Variables and Secrets, type "Secret"):
//   FIREBASE_SERVICE_ACCOUNT  whole service-account .json file content
//   PADDLE_WEBHOOK_SECRET     Paddle > Developer tools > Notifications > your destination > Secret key (pdl_ntfset_...)

const DAY = 864e5, GRACE = 2 * DAY, TOLERANCE = 300;
const te = new TextEncoder();

const out = (c, b) => new Response(typeof b === 'string' ? b : JSON.stringify(b), {
  status: c, headers: { 'Content-Type': typeof b === 'string' ? 'text/plain' : 'application/json' }
});

/* ---------- Paddle signature: Paddle-Signature: ts=<unix>;h1=<hex>, h1 = HMAC-SHA256(secret, ts + ':' + rawBody) ---------- */
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const same = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
async function verify(request, env, body) {
  const secret = env.PADDLE_WEBHOOK_SECRET; if (!secret) return 'config';
  const hdr = String(request.headers.get('paddle-signature') || '');
  const parts = hdr.split(';').map(x => x.split('='));
  const ts = (parts.find(p => p[0] === 'ts') || [])[1], h1s = parts.filter(p => p[0] === 'h1').map(p => p[1]);
  if (!ts || !h1s.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCE) return false;
  const key = await crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const exp = hex(await crypto.subtle.sign('HMAC', key, te.encode(ts + ':' + body)));
  return h1s.some(h => same(String(h), exp));
}

/* ---------- Firestore over REST (service-account OAuth, signed with WebCrypto) ---------- */
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const strB64u = s => b64u(te.encode(s));
let TOK = { t: null, exp: 0 };

function account(env) {
  let raw = String(env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');
  if (raw[0] !== '{') raw = atob(raw); // also accepts a base64 copy of the json
  return JSON.parse(raw);
}
async function token(sa) {
  if (TOK.t && Date.now() < TOK.exp) return TOK.t;
  const now = Math.floor(Date.now() / 1000);
  const head = strB64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = strB64u(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, te.encode(head + '.' + claim));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + head + '.' + claim + '.' + b64u(sig)
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('google token error: ' + JSON.stringify(j));
  TOK = { t: j.access_token, exp: Date.now() + (Number(j.expires_in || 3600) - 120) * 1000 };
  return TOK.t;
}
const enc = v => v === null || v === undefined ? { nullValue: null }
  : typeof v === 'boolean' ? { booleanValue: v }
  : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
  : { stringValue: String(v) };
const dec = f => { const o = {}; for (const k in (f || {})) { const x = f[k]; o[k] = 'integerValue' in x ? Number(x.integerValue) : 'doubleValue' in x ? x.doubleValue : 'stringValue' in x ? x.stringValue : 'booleanValue' in x ? x.booleanValue : null; } return o; };
const fields = obj => { const f = {}; for (const k in obj) f[k] = enc(obj[k]); return f; };

function fsClient(env) {
  const sa = account(env);
  const base = 'https://firestore.googleapis.com/v1/projects/' + sa.project_id + '/databases/(default)/documents';
  const call = async (url, init) => {
    const r = await fetch(url, { ...init, headers: { Authorization: 'Bearer ' + await token(sa), 'Content-Type': 'application/json' } });
    if (r.status === 404) return null;
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('firestore ' + r.status + ' ' + JSON.stringify(j));
    return j;
  };
  return {
    // returns plain object, or null if the document does not exist
    async get(path) { const j = await call(base + '/' + path, { method: 'GET' }); return j && j.fields ? dec(j.fields) : (j ? {} : null); },
    // replace the whole document (create or overwrite)
    async set(path, obj) { await call(base + '/' + path, { method: 'PATCH', body: JSON.stringify({ fields: fields(obj) }) }); },
    // merge only these fields (creates the document if missing)
    async merge(path, obj) { await call(base + '/' + path + '?' + Object.keys(obj).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&'), { method: 'PATCH', body: JSON.stringify({ fields: fields(obj) }) }); },
    // change only these fields of an EXISTING document
    async update(path, obj) { await call(base + '/' + path + '?currentDocument.exists=true&' + Object.keys(obj).map(k => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&'), { method: 'PATCH', body: JSON.stringify({ fields: fields(obj) }) }); },
    // first document id in `coll` where `field` == value, or ''
    async findId(coll, field, value) {
      const j = await call(base + ':runQuery', { method: 'POST', body: JSON.stringify({ structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: String(value) } } }, limit: 1 } }) });
      const hit = (j || []).find(x => x.document);
      return hit ? hit.document.name.split('/').pop() : '';
    }
  };
}

/* ---------- Business logic (same as the Netlify version) ---------- */
const cycleMs = c => { if (!c) return 31 * DAY; const f = Number(c.frequency) || 1; return f * ({ day: 1, week: 7, month: 30.44, year: 365 }[c.interval] || 31) * DAY; };

async function slugOf(fs, d) {
  const cd = d.custom_data || {}; if (cd.slug) return String(cd.slug);
  if (d.subscription_id || (d.id && String(d.id).startsWith('sub_'))) {
    const sid = d.subscription_id || d.id;
    return await fs.findId('subscriptions', 'id', sid);
  }
  return '';
}

// A paid transaction (first payment and every renewal). Safe to receive twice: planUntil only moves to the paid period end.
async function paid(fs, d) {
  const slug = await slugOf(fs, d); if (!slug) return { skipped: 'no slug' };
  const cur = await fs.get('restaurants/' + slug); if (!cur) return { skipped: 'unknown restaurant' };
  const bp = d.billing_period, item = (d.items || [])[0] || {};
  const end = bp && bp.ends_at ? Date.parse(bp.ends_at) : Date.now() + cycleMs(item.price && item.price.billing_cycle);
  const until = Math.max(end + GRACE, cur.planUntil || 0);
  await fs.update('restaurants/' + slug, { plan: 'pro', planUntil: until });
  const t = d.details && d.details.totals, tot = t && t.grand_total != null ? t.grand_total : (t && t.total);
  await fs.set('payments/pd_' + d.id, { slug, owner: 'auto', ownerEmail: (d.custom_data && d.custom_data.email) || '', amount: tot != null ? Number(tot) / 100 : 0, cur: String(d.currency_code || 'USD').toUpperCase(), method: 'Card (Paddle)', trx: String(d.id), status: 'approved', ts: Date.now(), until });
  return { ok: true, until };
}

// Subscription changes: keep the owner's private "manage / cancel" links (never in the public restaurant doc).
async function sub(fs, d) {
  const slug = await slugOf(fs, d); if (!slug) return { skipped: 'no slug' };
  const m = d.management_urls || {};
  await fs.merge('subscriptions/' + slug, { id: d.id, status: d.status, cancelUrl: m.cancel || null, updateUrl: m.update_payment_method || null, next: d.next_billed_at || null, scheduled: (d.scheduled_change && d.scheduled_change.action) || null, ts: Date.now() });
  return { ok: true };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.text(), v = await verify(request, env, body);
    if (v === 'config') return out(500, 'PADDLE_WEBHOOK_SECRET missing');
    if (!v) return out(401, 'bad signature');
    const j = JSON.parse(body), t = j.event_type, d = j.data || {};
    if (t === 'transaction.completed') return out(200, await paid(fsClient(env), d));
    if (/^subscription\.(created|activated|updated|resumed|paused|canceled|past_due)$/.test(t)) return out(200, await sub(fsClient(env), d));
    return out(200, { ignored: t });
  } catch (e) { console.error(e); return out(500, 'server error'); }
}

// anything that is not POST (browser opening /api/paddle, etc.)
export async function onRequest() { return out(405, 'POST only'); }
