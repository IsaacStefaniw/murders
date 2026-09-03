/**
 * Getting text out of the app and into somewhere useful.
 *
 * The household hub called `navigator.clipboard.writeText`, which is a web
 * API. On a real iPhone `navigator.clipboard` is undefined, the TypeError
 * was swallowed by a catch commented "clipboard unavailable — nothing to
 * break", and the button did nothing at all. Nothing broke; the feature
 * simply never worked on the platform the app ships to.
 *
 * React Native's own Share is the right tool and needs no new dependency —
 * which matters, because a native module would change the expo-updates
 * fingerprint and cut every installed build off from updates. It opens the
 * OS sheet, so the same call reaches Mail, Messages, Notes or anything
 * else the person has.
 *
 * That also answers "can the work review be emailed through, given it
 * fires while I'm at work": the sheet has Mail in it.
 */

import { Share } from 'react-native';

export interface ShareResult {
  /** False when the sheet could not open at all — not when it was cancelled. */
  ok: boolean;
  /** True when the person picked a destination rather than dismissing. */
  shared: boolean;
}

/**
 * Offer `message` to the OS share sheet.
 *
 * Dismissing the sheet is a normal outcome, not a failure — the caller
 * gets `ok: true, shared: false` so it can stay quiet rather than
 * reporting an error at somebody who simply changed their mind.
 */
export async function shareText(message: string, title?: string): Promise<ShareResult> {
  try {
    const result = await Share.share(title ? { message, title } : { message });
    return { ok: true, shared: result.action === Share.sharedAction };
  } catch {
    // A sheet that cannot open is worth knowing about; the caller decides
    // whether to say so.
    return { ok: false, shared: false };
  }
}
