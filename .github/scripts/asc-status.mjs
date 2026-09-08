// Read-only App Store Connect status. GETs only — this script never
// submits, releases, or changes anything, so it is safe to run while a
// version is in review.
//
// Answers the question Isaac keeps asking: where is 1.0, which build is
// attached to it, and has a reviewer picked it up yet.
import { readFileSync } from 'fs';
import crypto from 'crypto';

const BUNDLE_ID = 'com.isaacstefaniw.intentos';

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
