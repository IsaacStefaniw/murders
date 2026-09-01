/**
 * "Did it update?" — answered by the app rather than by counting launches.
 *
 * An over-the-air update downloads in the background and applies on the
 * NEXT launch, which means the honest instruction has been "close it and
 * open it twice, then look for something you might not recognise". That is
 * not something anyone should have to do, and it leaves no way to tell a
 * failed update from an impatient one.
 *
 * `BUILD_TAG` cannot answer it: it is inlined at export time and says
 * which binary you are on, not which JavaScript is running inside it.
 *
 * Loaded dynamically for the same reason notifications are — a web build,
 * a simulator, or a binary without the module all end at "unavailable"
 * rather than a crash.
 */

export interface UpdateInfo {
  /** The EAS channel this build listens on — 'production' or 'preview'. */
  channel: string | null;
  /** Fingerprint of the native project. Updates only reach a match. */
  runtimeVersion: string | null;
  /** Null while running the bundle that shipped inside the binary. */
  updateId: string | null;
  /** When that update was published. */
  createdAt: Date | null;
  /** True when no update has been applied — the original TestFlight build. */
  isEmbedded: boolean;
}

export type CheckResult = 'applied' | 'up-to-date' | 'unavailable' | 'failed';

interface UpdatesModule {
  channel?: string | null;
  runtimeVersion?: string | null;
  updateId?: string | null;
  createdAt?: Date | null;
  isEmbeddedLaunch?: boolean;
  isEnabled?: boolean;
  checkForUpdateAsync: () => Promise<{ isAvailable: boolean }>;
  fetchUpdateAsync: () => Promise<{ isNew: boolean }>;
  reloadAsync: () => Promise<void>;
}

let cached: UpdatesModule | null | undefined;

async function load(): Promise<UpdatesModule | null> {
  if (cached !== undefined) return cached;
  try {
    cached = (await import('expo-updates')) as unknown as UpdatesModule;
  } catch {
    cached = null;
  }
  return cached;
}

export async function currentUpdate(): Promise<UpdateInfo | null> {
  const mod = await load();
  if (!mod || mod.isEnabled === false) return null;
  return {
    channel: mod.channel ?? null,
    runtimeVersion: mod.runtimeVersion ?? null,
    updateId: mod.updateId ?? null,
    createdAt: mod.createdAt ?? null,
    isEmbedded: mod.isEmbeddedLaunch ?? mod.updateId == null,
  };
}

/**
 * Check, download and restart into the new version now.
 *
 * The restart is the point. Without it the answer to "is it updated?" is
 * "yes, on your next launch", which is the ambiguity this whole file
 * exists to remove.
 */
export async function checkAndApply(): Promise<CheckResult> {
  const mod = await load();
  if (!mod || mod.isEnabled === false) return 'unavailable';
  try {
    const { isAvailable } = await mod.checkForUpdateAsync();
    if (!isAvailable) return 'up-to-date';
    const { isNew } = await mod.fetchUpdateAsync();
    if (!isNew) return 'up-to-date';
    await mod.reloadAsync();
    return 'applied';
  } catch {
    // No network, or a runtime version that does not match this binary —
    // which is the update system correctly refusing, not a fault.
    return 'failed';
  }
}

/** How the running version reads to a person, in one line. */
export function describeUpdate(info: UpdateInfo | null): string {
  if (!info) return 'Updates are not available in this build.';
  if (info.isEmbedded || !info.createdAt) {
    return 'Running the version that shipped with this build. No update has been applied yet.';
  }
  const when = info.createdAt.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `Updated ${when}.`;
}
