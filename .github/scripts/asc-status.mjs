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

let submissionMissingPurchases = false;
console.log('\nREVIEW SUBMISSIONS');
const subs = await get(`/v1/apps/${app.id}/reviewSubmissions?limit=5`);
if (!subs?.data?.length) console.log('  (none returned)');
for (const s of subs?.data ?? []) {
  const a = s.attributes ?? {};
  console.log(`  state=${a.state ?? '?'}  platform=${a.platform ?? '-'}  submitted=${a.submittedDate ?? '-'}`);

  /*
    What is actually IN the submission — which this endpoint cannot tell you.

    Read this before trusting anything printed below it. On 8 September this
    check reported

      items: (none returned)
      !! no in-app purchase is part of this submission.

    for a submission that App Store Connect showed, in the browser, as
    holding five items: the version, the subscription group, both
    subscriptions and the one-off purchase. The App Review page listed the
    rejected submission as "5 Items" too. The purchases were there the whole
    time. This endpoint returns items whose relationships arrive without
    `data`, and the script read that silence as an answer.

    It cost a wrong diagnosis: the 2.1(b) rejection was blamed on unattached
    products for four days, and the real cause — the app chaining its two
    product fetches, so either one failing blanked the paywall — went
    unexamined while the wrong theory was written into this script, into
    docs/APP_STORE.md, and into three attempts to fix it over the API. One of
    those attempts cancelled a healthy submission and dropped all three
    products to Developer Rejected.

    So this block now reports what came back and says plainly when that is
    nothing. Submission contents are read in the browser, on the app's App
    Review page, and nowhere else.
  */
  const items = await get(`/v1/reviewSubmissions/${s.id}/items?limit=25`);
  const kinds = new Map();
  for (const item of items?.data ?? []) {
    for (const [rel, value] of Object.entries(item.relationships ?? {})) {
      if (!value?.data) continue;
      kinds.set(rel, (kinds.get(rel) ?? 0) + 1);
    }
  }
  const itemCount = items?.data?.length ?? 0;
  if (kinds.size > 0) {
    for (const [rel, n] of kinds) console.log(`      items: ${rel} × ${n}`);
  } else if (itemCount > 0) {
    console.log(`      items: ${itemCount} returned, none carrying relationship data.`);
    console.log('         What they are is not readable here. Open the app’s App Review');
    console.log('         page in App Store Connect to see the contents.');
  } else {
    console.log('      items: the API returned none.');
    console.log('         This has been empty for a submission the browser showed as');
    console.log('         holding five items, so it is not evidence of anything. Open');
    console.log('         the app’s App Review page to see the contents.');
  }

  /*
    Only an answer counts as an answer. When the relationships resolve and
    carry no purchase, that is a finding. When nothing resolves, the script
    knows nothing and must not fail the run on it — the earlier version did,
    and a check that manufactures findings out of missing data is worse than
    no check at all.
  */
  const iapItems = (kinds.get('inAppPurchaseV2') ?? 0) + (kinds.get('subscription') ?? 0);
  if (kinds.size > 0 && iapItems === 0 && a.state !== 'COMPLETE' && a.state !== 'CANCELING') {
    submissionMissingPurchases = true;
    console.log('      !! items resolved, and no in-app purchase is among them.');
    console.log('         Add each product from its own page in App Store Connect');
    console.log('         (Add for Review), then submit the draft that collects them.');
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
} else if (submissionMissingPurchases) {
  /*
    Configured is not the same as submitted, and this is the gap the 2.1(b)
    rejection fell into: three products with prices, localisations and a
    clean state, none of them attached to the version under review. On a
    first release that is what leaves a reviewer looking at an empty
    paywall while every check above says the products are fine.

    Loud, and a non-zero exit, because "all products configured" read as
    "nothing to fix here" once already.
  */
  console.log(`\nAll ${EXPECTED_IDS.length} products are configured, and the submission's own`);
  console.log('items came back without any of them. Configured is not submitted: add');
  console.log('each product from its page in App Store Connect with Add for Review,');
  console.log('then submit the draft that collects them alongside the version.');
  process.exitCode = 1;
} else {
  console.log(`\nAll ${EXPECTED_IDS.length} products are configured and would reach the paywall.`);
  console.log('Whether they are IN the submission is not something this script can');
  console.log('read — see REVIEW SUBMISSIONS above. Confirm it on the app’s App');
  console.log('Review page in App Store Connect.');
}
