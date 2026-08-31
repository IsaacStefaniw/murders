// Resolve the App Store Connect numeric app ID for our bundle id, using
// the ASC API key already present in the environment. eas submit
// --non-interactive requires ascAppId; the app RECORD itself must exist
// (created once in the App Store Connect UI — the API cannot create it).
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
const sig = crypto
  .sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' })
  .toString('base64url');

const res = await fetch(
  `https://api.appstoreconnect.apple.com/v1/apps?filter[bundleId]=${BUNDLE_ID}`,
  { headers: { Authorization: `Bearer ${unsigned}.${sig}` } },
);
if (!res.ok) {
  console.error(`App Store Connect API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const json = await res.json();
const app = json.data?.[0];
if (!app) {
  console.error(
    `No app record for ${BUNDLE_ID} in App Store Connect. One-time step: ` +
      'appstoreconnect.apple.com → My Apps → + → New App → iOS, pick the ' +
      `bundle ID ${BUNDLE_ID}, any name/SKU. Then re-run this workflow.`,
  );
  process.exit(2);
}
console.log(app.id);
