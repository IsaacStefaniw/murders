/**
 * Backup and restore, the part that can be tested.
 *
 * Everything lives only on the phone, so the backup is the only copy that
 * exists anywhere. Restoring used to accept anything that parsed as JSON
 * and had a `state` key — a payload of `{"state":{"goals":"oops"}}` was
 * written straight over the current store and hydrated, and the next
 * render fell over on `goals.filter`. The person had just replaced a
 * working state with a broken one and had no way back except the backup
 * they had, if they had one. A restore either replaces everything with a
 * state the app can open, or it touches nothing.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { PERSIST_VERSION } from '@/state/hygiene';
import { useAppStore } from '@/state/store';

export const STORE_KEY = 'intent-os-store';

const LIST_KEYS = [
  'goals', 'routines', 'planEvents', 'behaviourIntentions', 'behaviourEvents',
  'reflections', 'suggestions', 'metrics', 'workoutLogs',
] as const;

export type BackupCheck =
  | { ok: true; text: string; version: number }
  | { ok: false; reason: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Whether a pasted backup is one the store can open.
 *
 * A backup written by an older build carries an older version and is
 * migrated on the way in, so the check is only for the shape the migration
 * itself cannot repair: the envelope, a profile that is not a profile, and
 * the current build's lists. Anything it cannot vouch for is refused with a
 * reason a person can act on.
 */
export function checkBackup(raw: string): BackupCheck {
  const text = raw.trim();
  if (!text) return { ok: false, reason: 'Nothing was pasted.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That is not a complete backup. Paste the whole thing, from the first { to the last }.' };
  }
  if (!isRecord(parsed) || !isRecord(parsed.state)) {
    return { ok: false, reason: 'That is not an IntentNorth backup.' };
  }
  const { state } = parsed;
  const version = parsed.version === undefined ? 0 : parsed.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0 || version > PERSIST_VERSION) {
    return { ok: false, reason: 'This backup comes from a newer version of the app. Update first, then restore.' };
  }
  if (state.profile !== undefined && state.profile !== null) {
    if (!isRecord(state.profile) || typeof state.profile.firstName !== 'string') {
      return { ok: false, reason: 'The profile in this backup is damaged.' };
    }
  }
  // A blob from before the versioning is repaired by the migration; one
  // that claims to be current has to be current.
  if (version === PERSIST_VERSION) {
    for (const key of LIST_KEYS) {
      if (state[key] !== undefined && !Array.isArray(state[key])) {
        return { ok: false, reason: `The backup is damaged (${key} is not a list).` };
      }
    }
    if (state.plans !== undefined && !isRecord(state.plans)) {
      return { ok: false, reason: 'The backup is damaged (plans is not a record).' };
    }
  }
  // Written back with the version it will be read under, so a backup with
  // the version stripped is still migrated rather than trusted as current.
  const out = parsed.version === version ? text : JSON.stringify({ ...parsed, version });
  return { ok: true, text: out, version };
}

/** The whole persisted state, as the phone has it. Null before anything was saved. */
export async function exportBackup(): Promise<string | null> {
  return AsyncStorage.getItem(STORE_KEY);
}

/**
 * Replace everything with the backup, or change nothing. The store is
 * told to read storage again: on the phone there is no page to reload,
 * and without this the restore is invisible until the next cold start.
 */
export async function restoreBackup(raw: string): Promise<BackupCheck> {
  const check = checkBackup(raw);
  if (!check.ok) return check;
  await AsyncStorage.setItem(STORE_KEY, check.text);
  await useAppStore.persist.rehydrate();
  return check;
}
