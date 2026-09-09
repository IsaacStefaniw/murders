// Read-only App Store Connect status. GETs only — this script never
// submits, releases, or changes anything, so it is safe to run while a
// version is in review.
//
// Answers the question Isaac keeps asking: where is 1.0, which build is
// attached to it, and has a reviewer picked it up yet.
//
// Since the 2.1(b) rejection of build 16 it also answers the question the
// app cannot answer from the phone: would StoreKit serve these three
// products at all. An in-app purchase only reaches the paywall — in
// sandbox and in review alike — once it has a price, a localisation and a
// state past MISSING_METADATA, and the paywall's own error cannot tell
// "Apple has no products for this app" from "the network dropped". This
// can. Run it before every resubmission.
import { readFileSync } from 'fs';
import crypto from 'crypto';

const BUNDLE_ID = 'com.isaacstefaniw.intentos';

// The identifiers are read from the app's own source rather than repeated
// here, because a check that can disagree with the code it checks is worse
// than no check.
const ENTITLEMENT_SRC = 'src/features/plus/entitlement.ts';
const EXPECTED_IDS = [
  ...new Set(
    [...readFileSync(ENTITLEMENT_SRC, 'utf8').matchAll(/'(app\.intentnorth\.plus\.[a-z]+)'/g)].map((m) => m[1]),
  ),
];
if (EXPECTED_IDS.length === 0) {
  console.error(`No product identifiers found in ${ENTITLEMENT_SRC}. Refusing to report on nothing.`);
  process.exit(2);
}

// A product in any other state is not served to StoreKit, so the paywall
// is empty however good the code is. MISSING_METADATA is the usual one,
// and the usual cause of it is a price never set — which is itself the
// usual symptom of the Paid Applications agreement not being in effect.
const SERVABLE = new Set([
  'READY_TO_SUBMIT',
  'WAITING_FOR_REVIEW',
  'IN_REVIEW',
  'PENDING_BINARY_APPROVAL',
  'PENDING_DEVELOPER_RELEASE',
  'APPROVED',
  'DEVELOPER_ACTION_NEEDED',
]);

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

async function get(path) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error(`  ! ${path} → ${res.status} ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  return res.json();
}

const apps = await get(`/v1/apps?filter[bundleId]=${BUNDLE_ID}`);
const app = apps?.data?.[0];
if (!app) {
  console.error(`No app record for ${BUNDLE_ID}.`);
  process.exit(2);
}
console.log(`APP  ${app.attributes?.name} (${BUNDLE_ID}) id=${app.id}`);
console.log(`     SKU ${app.attributes?.sku ?? '-'}  primary locale ${app.attributes?.primaryLocale ?? '-'}`);

console.log('\nAPP STORE VERSIONS');
const versions = await get(`/v1/apps/${app.id}/appStoreVersions?limit=5`);
for (const v of versions?.data ?? []) {
  const a = v.attributes ?? {};
  // Apple exposes both the legacy appStoreState and the newer
  // appVersionState; print whichever came back so this keeps working.
  const state = a.appVersionState ?? a.appStoreState ?? '?';
  console.log(`  ${a.versionString ?? '?'}  ${state}  released=${a.releaseType ?? '-'}  created=${a.createdDate ?? '-'}`);
  const build = await get(`/v1/appStoreVersions/${v.id}/build`);
  const b = build?.data?.attributes;
  console.log(`     build attached: ${b ? `${b.version} (uploaded ${b.uploadedDate})` : 'NONE'}`);
}

console.log('\nREVIEW SUBMISSIONS');
const subs = await get(`/v1/apps/${app.id}/reviewSubmissions?limit=5`);
if (!subs?.data?.length) console.log('  (none returned)');
for (const s of subs?.data ?? []) {
  const a = s.attributes ?? {};
  console.log(`  state=${a.state ?? '?'}  platform=${a.platform ?? '-'}  submitted=${a.submittedDate ?? '-'}`);

  /*
    What is actually IN the submission, which is a different question from
    whether the products are configured.

    On a first release the in-app purchases have to be added to the version
    being reviewed. Products that are configured perfectly and never
    attached sit at READY_TO_SUBMIT forever, and the reviewer is looking at
    a paywall for products that are not part of what they were asked to
    review. Apple's own note says products do not need prior approval to
    FUNCTION in review — which is true, and is not the same as them being
    part of the submission.
  */
  const items = await get(`/v1/reviewSubmissions/${s.id}/items?limit=25`);
  const kinds = new Map();
  for (const item of items?.data ?? []) {
    for (const [rel, value] of Object.entries(item.relationships ?? {})) {
      if (!value?.data) continue;
      kinds.set(rel, (kinds.get(rel) ?? 0) + 1);
    }
  }
  if (kinds.size === 0) {
    console.log('      items: (none returned)');
  } else {
    for (const [rel, n] of kinds) console.log(`      items: ${rel} × ${n}`);
  }
  const iapItems = (kinds.get('inAppPurchaseV2') ?? 0) + (kinds.get('subscription') ?? 0);
  if (iapItems === 0) {
    console.log('      !! no in-app purchase is part of this submission.');
    console.log('         On a first release they are added to the version in');
    console.log('         App Store Connect, under the version’s In-App Purchases');
    console.log('         section, and submitted with it.');
  }
}

console.log('\nRECENT BUILDS (newest first)');
const builds = await get(
  `/v1/builds?filter[app]=${app.id}&limit=8&sort=-uploadedDate`,
);
for (const b of builds?.data ?? []) {
  const a = b.attributes ?? {};
  console.log(
    `  build ${String(a.version ?? '?').padStart(3)}  ${String(a.processingState ?? '?').padEnd(10)}  expired=${a.expired}  uploaded=${a.uploadedDate ?? '-'}`,
  );
}

// ---------------------------------------------------------------------------
// In-app purchases. This is the section that matters after a 2.1(b)
// rejection: everything above can be perfect while the paywall is empty.
// ---------------------------------------------------------------------------

/** yes / NONE / unreadable, kept distinct so a failed query is never read as an empty one. */
const label = (v) => (v === null ? 'COULD NOT READ' : v ? 'yes' : 'NONE');

/** What we learned about one product, keyed by its StoreKit identifier. */
const seen = new Map();

const note = (productId, fields) => seen.set(productId, { ...(seen.get(productId) ?? {}), ...fields });

console.log('\nSUBSCRIPTIONS');
const groups = await get(`/v1/apps/${app.id}/subscriptionGroups?limit=10`);
if (!groups?.data?.length) console.log('  (no subscription group — the yearly and monthly products cannot exist without one)');
for (const g of groups?.data ?? []) {
  console.log(`  group "${g.attributes?.referenceName ?? '?'}" id=${g.id}`);
  const subs = await get(
    `/v1/subscriptionGroups/${g.id}/subscriptions?limit=50&fields[subscriptions]=name,productId,state,subscriptionPeriod,groupLevel`,
  );
  if (!subs?.data?.length) console.log('    (no subscriptions in this group)');
  for (const sub of subs?.data ?? []) {
    const a = sub.attributes ?? {};
    console.log(`    ${a.productId ?? '?'}  ${a.state ?? '?'}  period=${a.subscriptionPeriod ?? '-'}  level=${a.groupLevel ?? '-'}`);
    // A subscription with no price in any territory is not sold anywhere,
    // and StoreKit will not return it.
    const prices = await get(`/v1/subscriptions/${sub.id}/prices?limit=3&include=subscriptionPricePoint,territory`);
    const locales = await get(`/v1/subscriptions/${sub.id}/subscriptionLocalizations?limit=3`);
    const priced = prices === null ? null : (prices.data ?? []).length > 0;
    const localised = locales === null ? null : (locales.data ?? []).length > 0;
    console.log(`      prices=${label(priced)}  localisations=${label(localised)}`);
    note(a.productId, { kind: 'subscription', state: a.state, priced, localised });
  }
}

console.log('\nONE-OFF PURCHASES');
const iaps = await get(
  `/v1/apps/${app.id}/inAppPurchasesV2?limit=50&fields[inAppPurchases]=name,productId,state,inAppPurchaseType`,
);
if (!iaps?.data?.length) console.log('  (none)');
for (const iap of iaps?.data ?? []) {
  const a = iap.attributes ?? {};
  console.log(`  ${a.productId ?? '?'}  ${a.state ?? '?'}  type=${a.inAppPurchaseType ?? '-'}`);
  const schedule = await get(`/v2/inAppPurchases/${iap.id}/iapPriceSchedule?include=manualPrices`);
  const locales = await get(`/v2/inAppPurchases/${iap.id}/inAppPurchaseLocalizations?limit=3`);
  const priced = schedule === null ? null : !!schedule.data;
  const localised = locales === null ? null : (locales.data ?? []).length > 0;
  console.log(`      price schedule=${label(priced)}  localisations=${label(localised)}`);
  note(a.productId, { kind: a.inAppPurchaseType ?? 'in-app', state: a.state, priced, localised });
}

console.log('\nWOULD THE PAYWALL HAVE PRICES? (one line per product the app asks for)');
let blocked = 0;
for (const id of EXPECTED_IDS) {
  const found = seen.get(id);
  if (!found) {
    blocked++;
    console.log(`  ${id}\n      NOT IN APP STORE CONNECT — the app asks for this identifier and nothing answers to it.`);
    continue;
  }
  const reasons = [];
  if (!SERVABLE.has(found.state)) reasons.push(`state is ${found.state}`);
  if (found.priced === false) reasons.push('no price set in any territory');
  if (found.localised === false) reasons.push('no display name or description');
  const unknown = found.priced === null || found.localised === null;
  if (reasons.length) blocked++;
  const verdict = reasons.length
    ? `NOT SERVED — ${reasons.join('; ')}`
    : unknown
      ? `probably served (${found.state}), but a query above failed — read the errors before trusting this`
      : `served (${found.state})`;
  console.log(`  ${id}\n      ${verdict}`);
}

// Products in App Store Connect that the app never asks for are not a
// fault, but a typo in an identifier looks exactly like a missing product,
// and this is where that shows up.
for (const [id, found] of seen) {
  if (!EXPECTED_IDS.includes(id)) console.log(`  ${id}\n      in App Store Connect but the app never asks for it (${found.state})`);
}

console.log('\nWHAT THIS DOES NOT COVER');
console.log('  The Paid Applications agreement has no read API. Check it by hand:');
console.log('  App Store Connect → Business → Agreements — it must say Active, with');
console.log('  banking and tax complete. Until it is, products stay unsellable and');
console.log('  StoreKit returns nothing however the app is written.');

if (blocked > 0) {
  console.log(`\n${blocked} of ${EXPECTED_IDS.length} products would not reach the paywall. Fix these before resubmitting.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${EXPECTED_IDS.length} products would reach the paywall.`);
}
