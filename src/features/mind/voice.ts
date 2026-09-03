/**
 * Choosing the voice that reads a meditation.
 *
 * Isaac asked for a male voice, and the honest engineering answer is that
 * a device may not have one. iOS exposes a `gender` field on some voices
 * and omits it on others, and the set installed varies by device, locale
 * and what the person has downloaded. So this is a PREFERENCE with a
 * documented fallback chain, never a guarantee — returning null means "use
 * whatever the system reads with", which is always better than silence.
 *
 * Locale is matched before gender on purpose. A male voice reading English
 * guidance to someone whose phone is set to French is worse than a French
 * voice of any gender: the words have to be understood before the tone of
 * them matters.
 */

export interface VoiceOption {
  identifier: string;
  name: string;
  language: string;
  /** Present on some platforms only; absent is common, not exceptional. */
  gender?: string;
  /** iOS reports 'Default' or 'Enhanced'; absent on other platforms. */
  quality?: string;
}

/**
 * How good a voice actually sounds, on a scale the device decides.
 *
 * "The voices are a little robotic but OK. Are there any more natural
 * options?" There are, and they were already on the phone. iOS ships a
 * compact version of most voices and installs an enhanced or premium
 * version alongside it once somebody downloads one — same name, same
 * language, wildly different quality. The shortlist deduplicated by name
 * and kept whichever came back first, which is the compact one, so the
 * better voice was filtered out before anybody could hear it.
 *
 * Quality is read from the `quality` field where the platform sets it and
 * from the identifier where it does not: iOS encodes it as
 * com.apple.voice.<quality>.<lang>.<Name>, and the older bundles end
 * -compact or -premium.
 */
export type VoiceQuality = 'compact' | 'enhanced' | 'premium';

const QUALITY_RANK: Record<VoiceQuality, number> = {
  compact: 0,
  enhanced: 1,
  premium: 2,
};

export function qualityOf(v: VoiceOption): VoiceQuality {
  const id = v.identifier?.toLowerCase() ?? '';
  if (id.includes('premium')) return 'premium';
  if (id.includes('enhanced')) return 'enhanced';
  if (v.quality && v.quality.toLowerCase() === 'enhanced') return 'enhanced';
  return 'compact';
}

/** True when a better version of this voice exists on the device. */
export const isHighQuality = (v: VoiceOption): boolean => qualityOf(v) !== 'compact';

/** Names that identify a male voice on platforms that omit `gender`. */
const MALE_NAME_HINTS = [
  'aaron', 'alex', 'arthur', 'daniel', 'fred', 'gordon', 'lee', 'oliver',
  'reed', 'rishi', 'rocko', 'tom', 'male',
];

function isMale(v: VoiceOption): boolean {
  if (v.gender) return v.gender.toLowerCase() === 'male';
  const name = v.name?.toLowerCase() ?? '';
  return MALE_NAME_HINTS.some((h) => name.includes(h));
}

/**
 * The voices worth putting in front of somebody.
 *
 * A device can expose eighty or more, most of them other languages, several
 * of them the same voice at different qualities. A list that long is not a
 * choice, it is a chore — so this narrows to the ones that can actually
 * read this session, orders male first because that is the house default,
 * and stops at a number a person will genuinely audition.
 */
export function voiceShortlist(voices: VoiceOption[], locale: string, limit = 6): VoiceOption[] {
  const lang = locale.split('-')[0]?.toLowerCase() ?? 'en';
  const speakable = voices.filter((v) => v.language?.toLowerCase().startsWith(lang));
  const exact = speakable.filter((v) => v.language?.toLowerCase() === locale.toLowerCase());
  const rest = speakable.filter((v) => v.language?.toLowerCase() !== locale.toLowerCase());
  // Same voice installed twice at different qualities is one choice — and
  // it must be the BEST one. Keeping whichever came back first kept the
  // compact version, which is the robotic one, and hid the enhanced voice
  // sitting right beside it on the same phone.
  const best = new Map<string, VoiceOption>();
  for (const v of [...exact, ...rest]) {
    const key = (v.name ?? v.identifier).toLowerCase();
    const held = best.get(key);
    if (!held || QUALITY_RANK[qualityOf(v)] > QUALITY_RANK[qualityOf(held)]) best.set(key, v);
  }
  const ordered = [...best.values()];
  // Quality first, then the house preference for a male voice. Someone who
  // asked for a more natural voice cares more about that than about which
  // of two natural voices they get.
  const byQuality = (a: VoiceOption, b: VoiceOption) =>
    QUALITY_RANK[qualityOf(b)] - QUALITY_RANK[qualityOf(a)];
  return [
    ...ordered.filter(isMale).sort(byQuality),
    ...ordered.filter((v) => !isMale(v)).sort(byQuality),
  ].slice(0, limit);
}

/** A line worth judging a voice on — the shape of real guidance, not "hello". */
export const VOICE_SAMPLE =
  'Settle. Let the shoulders drop, and let the breath find its own pace.';

/**
 * The best available voice for a spoken practice.
 *
 * Order: a male voice in the exact locale, then a male voice in the same
 * language, then any voice in the exact locale, then null. Each step down
 * gives up the smaller thing.
 */
export function pickVoice(voices: VoiceOption[], locale: string): string | null {
  if (voices.length === 0) return null;
  // The shortlist already does the work: locale before gender, one entry
  // per voice at its best available quality, quality ordered first. Taking
  // the first match by hand here was how the automatic choice landed on a
  // compact voice even when an enhanced one was installed.
  const shortlist = voiceShortlist(voices, locale, 1);
  if (shortlist.length > 0) return shortlist[0].identifier;
  // Nothing speaks this language. Anything is better than silence.
  return voices[0]?.identifier ?? null;
}
