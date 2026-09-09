// Attach the three in-app purchases to the version under review, and
// optionally submit it.
//
// This is the ONLY script here that writes. Everything in asc-status.mjs
// is a GET; this one POSTs and PATCHes against a live App Store listing,
// so it defaults to a dry run and will not write a byte until it is told
// to twice — CONFIRM=yes in the environment, which the workflow only sets
// when a human ticks the box.
//
// Why it exists: the 2.1(b) rejection of build 16 was not a configuration
// fault. All three products had prices, localisations and a clean state,
// and none of them was attached to version 1.0. READY_TO_SUBMIT means
// never submitted, and on a first release the purchases are part of the
// version's submission or the reviewer opens a paywall for products
// outside what they were asked to review.
//
// What it CANNOT do, and nobody should think it can: the Paid
// Applications agreement has no API. If that is not Active, this script
// will happily attach three products that still cannot be sold.
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

const api = async (method, path, body) => {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`  ! ${method} ${path} → ${res.status}`);
    console.error(`    ${text.slice(0, 500)}`);
    return null;
  }
  return text ? JSON.parse(text) : {};
};
const get = (path) => api('GET', path);

const write = async (method, path, body, what) => {
  if (!CONFIRM) {
    console.log(`  DRY RUN — would ${method} ${path}`);
    console.log(`            ${what}`);
    return { dryRun: true };
  }
  const out = await api(method, path, body);
  console.log(out ? `  done — ${what}` : `  FAILED — ${what}`);
  return out;
};

console.log(CONFIRM ? 'MODE: writing to App Store Connect' : 'MODE: dry run — nothing will be changed');
console.log('');

const apps = await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
const app = apps?.data?.[0];
if (!app) {
  console.error(`No app for ${BUNDLE_ID}.`);
  process.exit(2);
}
console.log(`APP  ${app.attributes?.name} (${BUNDLE_ID}) id=${app.id}`);

// The products the app actually asks for, read from its own source so the
// two cannot drift apart.
const EXPECTED_IDS = [
  ...new Set(
    [...readFileSync('src/features/plus/entitlement.ts', 'utf8').matchAll(/'(app\.intentnorth\.plus\.[a-z]+)'/g)].map((m) => m[1]),
  ),
];

// Resolve each identifier to its App Store Connect id and the relationship
// type a review submission item wants for it. Subscriptions and one-off
// purchases are different resources and go in under different keys.
const targets = [];
const groups = await get(`/v1/apps/${app.id}/subscriptionGroups?limit=10`);
for (const g of groups?.data ?? []) {
  const subs = await get(`/v1/subscriptionGroups/${g.id}/subscriptions?limit=20`);
  for (const s of subs?.data ?? []) {
    const pid = s.attributes?.productId;
    if (EXPECTED_IDS.includes(pid)) targets.push({ pid, id: s.id, type: 'subscriptions', rel: 'subscription', state: s.attributes?.state });
  }
}
const iaps = await get(`/v1/apps/${app.id}/inAppPurchasesV2?limit=20`);
for (const p of iaps?.data ?? []) {
  const pid = p.attributes?.productId;
  if (EXPECTED_IDS.includes(pid)) targets.push({ pid, id: p.id, type: 'inAppPurchases', rel: 'inAppPurchaseV2', state: p.attributes?.state });
}

console.log('\nPRODUCTS THE APP ASKS FOR');
for (const id of EXPECTED_IDS) {
  const t = targets.find((x) => x.pid === id);
  console.log(t ? `  ${id}  ${t.state}  (${t.rel} ${t.id})` : `  ${id}  NOT FOUND IN APP STORE CONNECT`);
}
if (targets.length !== EXPECTED_IDS.length) {
  console.error('\nRefusing to continue: not every product the app asks for exists.');
  process.exit(2);
}

// The version to attach them to. PREPARE_FOR_SUBMISSION or REJECTED is the
// editable one; anything in review is not ours to touch.
const versions = await get(`/v1/apps/${app.id}/appStoreVersions?limit=5`);
const EDITABLE = new Set(['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY']);
const version = (versions?.data ?? []).find((v) =>
  EDITABLE.has(v.attributes?.appVersionState ?? v.attributes?.appStoreState),
);
if (!version) {
  console.error('\nNo editable version. Nothing to attach to — is 1.0 still in review?');
  process.exit(2);
}
const vstate = version.attributes?.appVersionState ?? version.attributes?.appStoreState;
console.log(`\nVERSION  ${version.attributes?.versionString}  ${vstate}  id=${version.id}`);

/*
  Which build the version carries.

  `eas submit` puts a binary in TestFlight and stops there — attaching it
  to the App Store version is a separate act, and version 1.0 is still
  carrying build 16, the one that was rejected. Submitting without this
  would send the reviewer the same binary again.

  Newest VALID build wins unless BUILD_NUMBER names one, because the usual
  case is "the one that just finished" and naming it is the exception.
*/
const builds = await get(`/v1/builds?filter[app]=${app.id}&limit=10&sort=-uploadedDate`);
const wanted = process.env.BUILD_NUMBER?.trim();
const pick = (builds?.data ?? []).find((b) =>
  wanted ? b.attributes?.version === wanted : b.attributes?.processingState === 'VALID',
);
const attached = await get(`/v1/appStoreVersions/${version.id}/build`);
const attachedNo = attached?.data?.attributes?.version ?? null;
console.log(`\nBUILD`);
console.log(`  on the version now: ${attachedNo ?? '(none)'}`);
if (!pick) {
  console.log(`  ! ${wanted ? `build ${wanted} not found` : 'no VALID build to attach'} — leaving the version as it is`);
} else if (pick.attributes?.version === attachedNo) {
  console.log(`  already build ${attachedNo} — nothing to change`);
} else {
  console.log(`  would move to: ${pick.attributes?.version} (${pick.attributes?.processingState})`);
  await write(
    'PATCH',
    `/v1/appStoreVersions/${version.id}/relationships/build`,
    { data: { type: 'builds', id: pick.id } },
    `put build ${pick.attributes?.version} on version ${version.attributes?.versionString}`,
  );
}

// An existing submission has to be cleared before a new one can be built:
// Apple allows one open review submission per app.
const subs = await get(`/v1/apps/${app.id}/reviewSubmissions?filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=5`);
let submission = subs?.data?.[0];
if (submission) {
  const st = submission.attributes?.state;
  console.log(`\nOPEN SUBMISSION  state=${st}  id=${submission.id}`);
  if (st === 'UNRESOLVED_ISSUES' || st === 'READY_FOR_REVIEW') {
    console.log('  This is the rejected submission. Items get added to it and it is resubmitted.');
  } else {
    console.error('  It is with a reviewer. Refusing to touch a submission in review.');
    process.exit(2);
  }
} else {
  console.log('\nNo open submission — one will be created.');
  const made = await write(
    'POST',
    '/v1/reviewSubmissions',
    { data: { type: 'reviewSubmissions', relationships: { app: { data: { type: 'apps', id: app.id } } }, attributes: { platform: 'IOS' } } },
    'create a review submission',
  );
  submission = made?.data ?? null;
  if (!submission && CONFIRM) process.exit(1);
}

// What is already in it, so re-running this is safe.
const existing = new Set();
if (submission?.id) {
  const items = await get(`/v1/reviewSubmissions/${submission.id}/items?limit=25`);
  for (const item of items?.data ?? []) {
    for (const [rel, value] of Object.entries(item.relationships ?? {})) {
      if (value?.data?.id) existing.add(`${rel}:${value.data.id}`);
    }
  }
}

console.log('\nATTACHING');
const sid = submission?.id ?? '(new submission)';
if (!existing.has(`appStoreVersion:${version.id}`)) {
  await write(
    'POST',
    '/v1/reviewSubmissionItems',
    {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: sid } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
        },
      },
    },
    `version ${version.attributes?.versionString}`,
  );
} else {
  console.log(`  already there — version ${version.attributes?.versionString}`);
}

for (const t of targets) {
  if (existing.has(`${t.rel}:${t.id}`)) {
    console.log(`  already there — ${t.pid}`);
    continue;
  }
  await write(
    'POST',
    '/v1/reviewSubmissionItems',
    {
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: sid } },
          [t.rel]: { data: { type: t.type, id: t.id } },
        },
      },
    },
    t.pid,
  );
}

console.log('\nSUBMIT');
if (process.env.SUBMIT !== 'yes') {
  console.log('  not submitting — SUBMIT is not set. Attach first, look at it in App Store');
  console.log('  Connect, then run again with submit ticked.');
} else {
  await write(
    'PATCH',
    `/v1/reviewSubmissions/${sid}`,
    { data: { type: 'reviewSubmissions', id: sid, attributes: { submitted: true } } },
    'submit for review',
  );
}

console.log('\nWHAT THIS CANNOT CHECK');
console.log('  The Paid Applications agreement has no API. If it is not Active,');
console.log('  three correctly attached products still cannot be sold, and the');
console.log('  paywall is empty however this run went.');
console.log('  App Store Connect → Business → Agreements.');
if (!CONFIRM) console.log('\nDry run. Nothing was changed.');
