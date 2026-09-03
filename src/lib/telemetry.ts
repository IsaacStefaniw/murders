/**
 * Funnel events — the one kind of data that leaves the phone, agreed
 * 2026-09-03 (docs/MONETISATION.md §7).
 *
 * The contract is the point of this file, and it is deliberately narrow:
 *
 *  - A closed list of event names. Adding one is a code change that shows
 *    up in review, never a string typed at a call site.
 *  - A payload of exactly four fields: event, an anonymous per-install id,
 *    the build tag, and a timestamp. No profile answer, no plan, no goal
 *    text, nothing derived from Apple Health. The type makes a fifth field
 *    a compile error; the test makes it a red test.
 *  - Off until an endpoint exists. EXPO_PUBLIC_TELEMETRY_URL is unset in
 *    every 1.0 build profile, so nothing is sent and nothing is queued.
 *    1.1 sets it in the same release that rewrites the privacy page and
 *    the App Privacy label — never before.
 *
 * Failures are silent by design: a person's day does not wait on a
 * telemetry request, and a network error is not their problem.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BUILD_TAG } from './build';

export const FUNNEL_EVENTS = [
  'interview_started',
  'interview_finished',
  'first_insight_seen',
  'week_ended',
  'paywall_shown',
  'product_chosen',
  'purchase_completed',
  'coach_opened',
] as const;

export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];

export type FunnelPayload = {
  event: FunnelEvent;
  /** Random per install. Not the device id, not the advertising id, and reset by reinstall. */
  install: string;
  build: string;
  at: string;
};

export const TELEMETRY_URL: string | undefined = process.env.EXPO_PUBLIC_TELEMETRY_URL || undefined;

const ID_KEY = 'intent-north-install-id';

/** RFC 4122-shaped random id; uniqueness is all that is asked of it. */
export function randomInstallId(rand: () => number = Math.random): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.floor(rand() * 16) & 0x3) | 0x8];
    else out += hex[Math.floor(rand() * 16)];
  }
  return out;
}

let cachedId: string | null = null;

export async function installId(): Promise<string> {
  if (cachedId) return cachedId;
  const stored = await AsyncStorage.getItem(ID_KEY);
  if (stored) {
    cachedId = stored;
    return stored;
  }
  const fresh = randomInstallId();
  await AsyncStorage.setItem(ID_KEY, fresh);
  cachedId = fresh;
  return fresh;
}

/** Test seam. */
export function _resetInstallId(): void {
  cachedId = null;
}

export function isTelemetryEnabled(url: string | undefined = TELEMETRY_URL): boolean {
  return typeof url === 'string' && url.startsWith('https://');
}

export function buildPayload(event: FunnelEvent, install: string, at: Date = new Date()): FunnelPayload {
  return { event, install, build: BUILD_TAG, at: at.toISOString() };
}

type Sender = (url: string, body: string) => Promise<unknown>;

const defaultSender: Sender = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });

/**
 * Record one funnel event. Resolves to true only when a request was
 * actually attempted; false means telemetry is off, which is every 1.0
 * build. Never throws.
 */
export async function track(
  event: FunnelEvent,
  opts: { url?: string; send?: Sender; now?: Date } = {},
): Promise<boolean> {
  const url = opts.url ?? TELEMETRY_URL;
  if (!isTelemetryEnabled(url)) return false;
  try {
    const payload = buildPayload(event, await installId(), opts.now);
    await (opts.send ?? defaultSender)(url as string, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}
