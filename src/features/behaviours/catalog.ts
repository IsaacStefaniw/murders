/**
 * Behaviour catalog — supportive, neutral, non-shaming.
 *
 * INTENT is a wellbeing product, not a diagnosis or treatment product.
 * Copy never moralises. Occurrences are data, not failures.
 */

import type { BehaviourKey } from '@/types/domain';

export interface BehaviourInfo {
  key: BehaviourKey;
  label: string;
  /** Neutral verb phrase used in intention text. */
  intentionTemplate: string;
  /** Shown when logging an occurrence. */
  logPrompt: string;
  /**
   * Safety note shown on selection and in the behaviour detail view.
   * Required for behaviours where abrupt cessation can be medically risky.
   */
  safetyNote?: string;
}

export const BEHAVIOUR_CATALOG: BehaviourInfo[] = [
  {
    key: 'doomscrolling',
    label: 'Doom scrolling',
    intentionTemplate: 'Less time lost to scrolling',
    logPrompt: 'What were you reaching for?',
  },
  {
    key: 'alcohol',
    label: 'Alcohol',
    intentionTemplate: 'Drink less, more deliberately',
    logPrompt: 'What was the context?',
    safetyNote:
      'If cutting down feels hard, or stopping suddenly causes shakes, sweating or anxiety, ' +
      'talk to a doctor before making big changes — stopping abruptly can be unsafe for some ' +
      'people. Support exists and it works. INTENT will pace changes gradually.',
  },
  {
    key: 'vaping',
    label: 'Vaping',
    intentionTemplate: 'Keep the vape down',
    logPrompt: 'What triggered it?',
  },
  {
    key: 'social_media',
    label: 'Social media',
    intentionTemplate: 'Less feed, more life',
    logPrompt: 'Which app pulled you in?',
  },
  {
    key: 'shopping',
    label: 'Impulse shopping',
    intentionTemplate: 'Buy on purpose, not on impulse',
    logPrompt: 'What almost (or actually) got bought?',
  },
  {
    key: 'junk_food',
    label: 'Junk food',
    intentionTemplate: 'Eat like it matters',
    logPrompt: 'What was going on?',
  },
  {
    key: 'late_nights',
    label: 'Late nights',
    intentionTemplate: 'Protect the bedtime',
    logPrompt: 'What kept you up?',
  },
];

export function behaviourInfo(key: BehaviourKey): BehaviourInfo {
  const info = BEHAVIOUR_CATALOG.find((b) => b.key === key);
  if (!info) throw new Error(`Unknown behaviour: ${key}`);
  return info;
}
