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
}

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
  // Same voice installed twice at different qualities is one choice.
  const seen = new Set<string>();
  const ordered = [...exact, ...rest].filter((v) => {
    const key = (v.name ?? v.identifier).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...ordered.filter(isMale), ...ordered.filter((v) => !isMale(v))].slice(0, limit);
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
  const lang = locale.split('-')[0]?.toLowerCase() ?? 'en';
  const sameLocale = voices.filter((v) => v.language?.toLowerCase() === locale.toLowerCase());
  const sameLang = voices.filter((v) => v.language?.toLowerCase().startsWith(lang));

  return (
    sameLocale.find(isMale)?.identifier ??
    sameLang.find(isMale)?.identifier ??
    sameLocale[0]?.identifier ??
    sameLang[0]?.identifier ??
    null
  );
}
