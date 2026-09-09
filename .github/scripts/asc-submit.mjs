// Submit 1.0 for review: the purchases first, then the version.
//
// The obvious route failed — an in-app purchase is not a
// reviewSubmissionItem relationship, and a rejected submission is frozen.
// Apple has separate resources for submitting the products themselves:
//
//   POST /v1/inAppPurchaseSubmissions   { inAppPurchaseV2 }
//   POST /v1/subscriptionSubmissions    { subscription }
//
// That is what this tries. If those work, the products move out of
// READY_TO_SUBMIT under their own steam and the version goes in after
// them — which is the whole fix for the 2.1(b) rejection.
//
// Writes nothing without CONFIRM=yes. Every call is reported.
import { readFileSync } from 'fs';
import crypto from 'crypto';

const BUNDLE_ID = 'com.isaacstefaniw.intentos';
const CONFIRM = process.env.CONFIRM === 'yes';

const key = readFileSync(process.env.EXPO_ASC_API_KEY_PATH, 'utf8');
const now = Math.floor(Date.now() / 1000);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const unsigned = `${b64({ alg: 'ES256', kid: process.env.EXPO_ASC_KEY_ID, typ: 'JWT' })}.${b64({
  iss: process.env.EXPO_ASC_ISSUER_ID,
  iat: now,
  exp: now + 1200,
  aud: 'appstoreconnect-v1',
})}`;
const token = `${unsigned}.${crypto
  .sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' })
  .toString('base64url')}`;

let failures = 0;
const api = async (method, path, body) => {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = (() => { try { return JSON.parse(text).errors?.[0]; } catch { return null; } })();
    console.log(`      ${res.status} ${err?.code ?? ''} ${err?.detail ?? text.slice(0, 200)}`);
    return null;
  }
  return text ? JSON.parse(text) : {};
};
const get = (p) => api('GET', p);
const write = async (method, path, body, what) => {
  if (!CONFIRM) { console.log(`  DRY RUN — would ${method} ${path}  (${what})`); return { dryRun: true }; }
  const out = await api(method, path, body);
  console.log(out ? `  done — ${what}` : `  FAILED — ${what}`);
  if (!out) failures++;
  return out;
};

console.log(CONFIRM ? 'MODE: writing to App Store Connect\n' : 'MODE: dry run — nothing will be changed\n');

const app = (await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`))?.data?.[0];
if (!app) { console.error('app not found'); process.exit(2); }
console.log(`APP  ${app.attributes?.name}  id=${app.id}`);

const EXPECTED = [...new Set([...readFileSync('src/features/plus/entitlement.ts', 'utf8')
  .matchAll(/'(app\.intentnorth\.plus\.[a-z]+)'/g)].map((m) => m[1]))];

const subsToSubmit = [];
const iapsToSubmit = [];
for (const g of (await get(`/v1/apps/${app.id}/subscriptionGroups?limit=10`))?.data ?? []) {
  for (const s of (await get(`/v1/subscriptionGroups/${g.id}/subscriptions?limit=20`))?.data ?? []) {
    if (EXPECTED.includes(s.attributes?.productId)) subsToSubmit.push({ pid: s.attributes.productId, id: s.id, state: s.attributes?.state });
  }
}
for (const p of (await get(`/v1/apps/${app.id}/inAppPurchasesV2?limit=20`))?.data ?? []) {
  if (EXPECTED.includes(p.attributes?.productId)) iapsToSubmit.push({ pid: p.attributes.productId, id: p.id, state: p.attributes?.state });
}

console.log('\nSTEP 1 — SUBMIT THE PRODUCTS THEMSELVES');
const READY = 'READY_TO_SUBMIT';
for (const s of subsToSubmit) {
  if (s.state !== READY) { console.log(`  ${s.pid} is ${s.state} — nothing to do`); continue; }
  await write('POST', '/v1/subscriptionSubmissions',
    { data: { type: 'subscriptionSubmissions', relationships: { subscription: { data: { type: 'subscriptions', id: s.id } } } } },
    s.pid);
}
for (const p of iapsToSubmit) {
  if (p.state !== READY) { console.log(`  ${p.pid} is ${p.state} — nothing to do`); continue; }
  await write('POST', '/v1/inAppPurchaseSubmissions',
    { data: { type: 'inAppPurchaseSubmissions', relationships: { inAppPurchaseV2: { data: { type: 'inAppPurchases', id: p.id } } } } },
    p.pid);
}

console.log('\nSTEP 2 — THE VERSION');
const EDITABLE = new Set(['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY']);
const version = ((await get(`/v1/apps/${app.id}/appStoreVersions?limit=5`))?.data ?? [])
  .find((v) => EDITABLE.has(v.attributes?.appVersionState ?? v.attributes?.appStoreState));
if (!version) { console.log('  no editable version'); process.exit(failures ? 1 : 0); }
console.log(`  version ${version.attributes?.versionString}  ${version.attributes?.appVersionState ?? version.attributes?.appStoreState}`);

// A frozen submission has to be cleared before a new one can be opened.
const open = ((await get(`/v1/apps/${app.id}/reviewSubmissions?filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=5`))?.data ?? [])[0];
if (open) {
  const st = open.attributes?.state;
  console.log(`  open submission: ${st}  id=${open.id}`);
  if (st === 'IN_REVIEW' || st === 'WAITING_FOR_REVIEW') {
    console.log('  it is with a reviewer — stopping.');
    process.exit(1);
  }
  if (st === 'UNRESOLVED_ISSUES') {
    await write('PATCH', `/v1/reviewSubmissions/${open.id}`,
      { data: { type: 'reviewSubmissions', id: open.id, attributes: { canceled: true } } },
      'cancel the rejected submission so a new one can be opened');
  }
}

const made = await write('POST', '/v1/reviewSubmissions',
  { data: { type: 'reviewSubmissions', attributes: { platform: 'IOS' }, relationships: { app: { data: { type: 'apps', id: app.id } } } } },
  'open a new review submission');
const sid = made?.data?.id;
if (CONFIRM && !sid) { console.log('\nCould not open a submission. Stopping.'); process.exit(1); }

await write('POST', '/v1/reviewSubmissionItems',
  { data: { type: 'reviewSubmissionItems', relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: sid ?? '(new)' } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } } } } },
  `add version ${version.attributes?.versionString}`);

console.log('\nSTEP 3 — SUBMIT');
if (process.env.SUBMIT !== 'yes') {
  console.log('  SUBMIT not set — stopping before the final call.');
} else {
  await write('PATCH', `/v1/reviewSubmissions/${sid ?? '(new)'}`,
    { data: { type: 'reviewSubmissions', id: sid ?? '(new)', attributes: { submitted: true } } },
    'submit for review');
}

console.log(failures ? `\n${failures} call(s) failed.` : '\nNo failures.');
if (!CONFIRM) console.log('Dry run. Nothing was changed.');
process.exitCode = failures ? 1 : 0;
