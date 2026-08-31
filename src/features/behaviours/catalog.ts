/**
 * Behaviour catalog — supportive, neutral, non-shaming.
 *
 * INTENT is a wellbeing product, not a diagnosis or treatment product.
 * Copy never moralises. Occurrences are data, not failures.
 *
 * The hard rule in this file is about `proximateEffect`. A user who logs
 * something at 8:45pm deserves to know what it actually does — but only
 * where real evidence says it does something, and only inside the window
 * where that mechanism applies. Most behaviours here carry NO proximate
 * effect, and that absence is deliberate: one piece of chocolate in the
 * evening has no established acute harm, and inventing one to make the
 * moment feel weightier would be a lie that also happens to be shaming.
 * Where there is no mechanism, the app has the pattern to offer instead,
 * which is both true and more useful.
 */

import type { EvidenceLevel } from '@/features/knowledge/protocols';
import type { BehaviourKey } from '@/types/domain';

/**
 * A mechanism — what this behaviour measurably does, in the hours it does
 * it. Never a verdict, never a number about this person, never a
 * prediction. It says what happens in a body, not what happened to theirs.
 */
export interface ProximateEffect {
  /**
   * The mechanism only applies within this many hours before sleep. Events
   * outside the window get no mechanism note at all — a coffee at 8am is
   * not the caffeine finding, and saying so anyway would be noise the user
   * learns to ignore.
   */
  withinHoursOfSleep: number;
  /** Plain words, mechanism only. No 'you', no 'your sleep', no should. */
  text: string;
  evidenceLevel: EvidenceLevel;
  attribution: string;
}

export type BehaviourFamily = 'digital' | 'substance' | 'food' | 'money' | 'rhythm';

export interface BehaviourInfo {
  key: BehaviourKey;
  label: string;
  family: BehaviourFamily;
  /** Neutral verb phrase used in intention text. */
  intentionTemplate: string;
  /** Shown when logging an occurrence. */
  logPrompt: string;
  /**
   * Placeholder for the free-text detail field, e.g. "one piece of Kit Kat".
   * Concrete examples matter: they teach the user that detail is a note,
   * not a confession.
   */
  detailHint: string;
  /**
   * Safety note shown on selection and in the behaviour detail view.
   * Required for behaviours where abrupt cessation can be medically risky,
   * or where the right next step is a professional rather than an app.
   */
  safetyNote?: string;
  /**
   * What the evidence supports about the hours right after, if anything.
   * Absent for most behaviours on purpose — see the file header.
   */
  proximateEffect?: ProximateEffect;
  /**
   * Never turn this into a streak, count-down or adherence percentage.
   * Food and body-image adjacent behaviours are scored nowhere in this app:
   * a running tally of sweets eaten is a restriction mechanic wearing a
   * progress bar, and it hurts exactly the people most likely to log it.
   */
  neverScore?: boolean;
}

export const BEHAVIOUR_CATALOG: BehaviourInfo[] = [
  {
    key: 'doomscrolling',
    label: 'Doom scrolling',
    family: 'digital',
    intentionTemplate: 'Less time lost to scrolling',
    logPrompt: 'What were you reaching for?',
    detailHint: 'e.g. forty minutes on the news',
    proximateEffect: {
      withinHoursOfSleep: 2,
      text: 'Emotionally charged reading close to bed lengthens how long it takes to fall asleep. The arousal does more of that than the screen light does.',
      evidenceLevel: 'C',
      attribution: 'Sleep-onset and pre-sleep cognitive arousal research',
    },
  },
  {
    key: 'alcohol',
    label: 'Alcohol',
    family: 'substance',
    intentionTemplate: 'Drink less, more deliberately',
    logPrompt: 'What was the context?',
    detailHint: 'e.g. two beers after work',
    safetyNote:
      'If cutting down feels hard, or stopping suddenly causes shakes, sweating or anxiety, ' +
      'talk to a doctor before making big changes — stopping abruptly can be unsafe for some ' +
      'people. Support exists and it works. INTENT will pace changes gradually.',
    proximateEffect: {
      withinHoursOfSleep: 4,
      text: 'Alcohol shortens the night, not the sleep. It speeds falling asleep and then suppresses REM and fragments the second half.',
      evidenceLevel: 'B',
      attribution: 'Meta-analyses of alcohol and sleep architecture',
    },
  },
  {
    key: 'vaping',
    label: 'Vaping',
    family: 'substance',
    intentionTemplate: 'Keep the vape down',
    logPrompt: 'What triggered it?',
    detailHint: 'e.g. stepped outside with the team',
    proximateEffect: {
      withinHoursOfSleep: 3,
      text: 'Nicotine is a stimulant with a half-life around two hours, and it lightens sleep in the hours after it.',
      evidenceLevel: 'C',
      attribution: 'Nicotine pharmacology; vaping-specific sleep evidence is still thin',
    },
  },
  {
    key: 'smoking',
    label: 'Smoking',
    family: 'substance',
    intentionTemplate: 'Fewer, then none',
    logPrompt: 'What triggered it?',
    detailHint: 'e.g. one after dinner',
    safetyNote:
      'Quitting is far easier with support than alone. Your GP or a national quitline can ' +
      'offer nicotine replacement and a plan — both roughly double the odds of it sticking. ' +
      'INTENT is here for the pattern, not instead of that.',
    proximateEffect: {
      withinHoursOfSleep: 3,
      text: 'Nicotine is a stimulant with a half-life around two hours, and it lightens sleep in the hours after it.',
      evidenceLevel: 'B',
      attribution: 'Nicotine pharmacology and smoking–sleep cohort studies',
    },
  },
  {
    key: 'social_media',
    label: 'Social media',
    family: 'digital',
    intentionTemplate: 'Less feed, more life',
    logPrompt: 'Which app pulled you in?',
    detailHint: 'e.g. half an hour on Instagram',
  },
  {
    key: 'gaming',
    label: 'Gaming',
    family: 'digital',
    intentionTemplate: 'Play on purpose, stop on time',
    logPrompt: 'What were you playing?',
    detailHint: 'e.g. two hours, meant to be one',
    proximateEffect: {
      withinHoursOfSleep: 2,
      text: 'Competitive or fast-paced play keeps heart rate and alertness up past the session, which pushes sleep onset later.',
      evidenceLevel: 'C',
      attribution: 'Pre-sleep arousal and gaming studies',
    },
  },
  {
    key: 'porn',
    label: 'Porn',
    family: 'digital',
    intentionTemplate: 'Take back the hour',
    logPrompt: 'What was going on beforehand?',
    detailHint: 'e.g. late, alone, restless',
    safetyNote:
      'This one carries a lot of shame for a lot of people, and shame is the part that makes ' +
      'it harder to change. INTENT logs it flatly and says nothing about what it means about ' +
      'you. If it is affecting your relationship or your work, a therapist is a better tool ' +
      'than an app.',
  },
  {
    key: 'shopping',
    label: 'Impulse shopping',
    family: 'money',
    intentionTemplate: 'Buy on purpose, not on impulse',
    logPrompt: 'What almost (or actually) got bought?',
    detailHint: 'e.g. $80 of things I had not thought about that morning',
  },
  {
    key: 'gambling',
    label: 'Gambling',
    family: 'money',
    intentionTemplate: 'Step back from the bet',
    logPrompt: 'What was going on?',
    detailHint: 'e.g. a bet on the game with mates',
    safetyNote:
      'Gambling is the one habit in this list where the right next step is usually a person, ' +
      'not an app. Free, confidential help exists in most countries — in Australia, Gambling ' +
      'Help Online (1800 858 858) is 24/7. Bank card gambling blocks and self-exclusion ' +
      'schemes work better than intention alone. INTENT will not track amounts or losses.',
    neverScore: true,
  },
  {
    key: 'junk_food',
    label: 'Junk food',
    family: 'food',
    intentionTemplate: 'Eat like it matters',
    logPrompt: 'What was going on?',
    detailHint: 'e.g. takeaway instead of the plan',
    neverScore: true,
  },
  {
    key: 'sugar',
    label: 'Sweets and snacking',
    family: 'food',
    intentionTemplate: 'Snack when it is worth it',
    logPrompt: 'What was going on?',
    detailHint: 'e.g. one piece of Kit Kat',
    neverScore: true,
  },
  {
    key: 'late_caffeine',
    label: 'Late caffeine',
    family: 'substance',
    intentionTemplate: 'Last coffee earlier',
    logPrompt: 'What was it, and what was it for?',
    detailHint: 'e.g. a flat white at 4pm to get through',
    proximateEffect: {
      withinHoursOfSleep: 8,
      text: 'Caffeine has a half-life around five hours, so a late one is still half-present at bedtime. In controlled trials it cut total sleep even when taken six hours before bed and even when people did not notice.',
      evidenceLevel: 'A',
      attribution: 'Drake et al. 2013, Journal of Clinical Sleep Medicine',
    },
  },
  {
    key: 'late_nights',
    label: 'Late nights',
    family: 'rhythm',
    intentionTemplate: 'Protect the bedtime',
    logPrompt: 'What kept you up?',
    detailHint: 'e.g. up past one for no particular reason',
  },
  {
    key: 'phone_in_bed',
    label: 'Phone in bed',
    family: 'digital',
    intentionTemplate: 'Keep the bed for sleep',
    logPrompt: 'What did you pick it up for?',
    detailHint: 'e.g. checked one thing, stayed forty minutes',
    proximateEffect: {
      withinHoursOfSleep: 1,
      text: 'The bed stops being a sleep cue when it doubles as a screen. Sleep-onset time drifts later over weeks of it, which is why the standard insomnia protocol moves the phone out of the room first.',
      evidenceLevel: 'B',
      attribution: 'Stimulus-control therapy, the core component of CBT-I',
    },
  },
  {
    key: 'overworking',
    label: 'Working too late',
    family: 'rhythm',
    intentionTemplate: 'Close the laptop earlier',
    logPrompt: 'What made tonight the night?',
    detailHint: 'e.g. back on email until eleven',
    proximateEffect: {
      withinHoursOfSleep: 2,
      text: 'Work in the last hour before bed keeps the problem loaded, and unfinished-task rumination is one of the best-established reasons falling asleep takes longer.',
      evidenceLevel: 'C',
      attribution: 'Work-related rumination and sleep-onset research',
    },
  },
  {
    key: 'procrastination',
    label: 'Putting things off',
    family: 'rhythm',
    intentionTemplate: 'Start the thing sooner',
    logPrompt: 'What got pushed?',
    detailHint: 'e.g. the board pack, again',
  },
];

export function behaviourInfo(key: BehaviourKey): BehaviourInfo {
  const info = BEHAVIOUR_CATALOG.find((b) => b.key === key);
  if (!info) throw new Error(`Unknown behaviour: ${key}`);
  return info;
}

export const behavioursInFamily = (family: BehaviourFamily): BehaviourInfo[] =>
  BEHAVIOUR_CATALOG.filter((b) => b.family === family);

export const BEHAVIOUR_FAMILY_LABELS: Record<BehaviourFamily, string> = {
  digital: 'Screens',
  substance: 'Substances',
  food: 'Food and drink',
  money: 'Money',
  rhythm: 'Time and rhythm',
};
