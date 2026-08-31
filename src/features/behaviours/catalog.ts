/**
 * Behaviour catalog — supportive, neutral, non-shaming.
 *
 * INTENT is a wellbeing product, not a diagnosis or treatment product.
 * Copy never moralises. Occurrences are data, not failures.
 *
 * The hard rule in this file is about `effects`. Someone who logs something
 * at 8:45pm deserves to know what it actually does — stated as a mechanism,
 * graded by how well it is evidenced, and only inside the window where it
 * applies.
 *
 * An earlier version of this file withheld the mechanism for food entirely,
 * on the reasoning that a snack has no established acute harm and inventing
 * one would be shaming. That was wrong twice over. It is not true — a
 * chocolate bar produces a real glucose and insulin response, and insulin
 * sensitivity runs on a body clock that makes the evening the expensive
 * time for it — and the reasoning conflated *don't shame* with *don't
 * inform*, which is a different and worse failure. Withholding something
 * true because a reader might mishear it is condescension, not care.
 *
 * The line that does hold: say what the behaviour DOES, never that it IS
 * bad. Not squeamishness — "bad" carries no information and a mechanism
 * carries all of it, and only one of the two tells you what to change.
 * Every effect that can name a specific counter-move does, because knowing
 * that a ten-minute walk flattens most of the curve is the part that
 * changes a Tuesday.
 */

import type { EvidenceLevel } from '@/features/knowledge/protocols';
import type { BehaviourKey } from '@/types/domain';

/**
 * A mechanism — what this behaviour measurably does. Never a verdict, never
 * a number about this person, never a prediction. It says what happens in a
 * body, not what happened to theirs.
 *
 * A behaviour usually has more than one, at different strengths and in
 * different windows: late caffeine has a sleep mechanism graded A, evening
 * sugar has a metabolic one graded B and a sleep one graded C. Collapsing
 * those into a single line would force one grade onto claims that do not
 * share it, which is how a strong finding ends up laundering a weak one.
 */
export interface ProximateEffect {
  /**
   * Applies only within this many hours before sleep. Undefined means the
   * mechanism holds whenever it happens.
   *
   * Events outside the window get nothing — a coffee at 8am is not the
   * caffeine finding, and saying it anyway is noise people learn to ignore,
   * which costs the times it mattered.
   */
  withinHoursOfSleep?: number;
  /** Plain words, mechanism only. */
  text: string;
  evidenceLevel: EvidenceLevel;
  attribution: string;
  /**
   * The protocol that actually addresses this, where one exists. This is
   * the difference between telling someone a fact and handing them the
   * lever — "a ten-minute walk flattens most of that curve" is the part
   * that changes a Tuesday.
   */
  counterProtocolId?: string;
  /** One line naming the counter-move, for when the protocol is offered. */
  counterText?: string;
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
   * What the evidence supports about what this does, strongest first.
   * Absent only where there genuinely is no physiological mechanism to
   * teach — impulse shopping is a money problem, not a metabolic one.
   */
  effects?: ProximateEffect[];
}

export const BEHAVIOUR_CATALOG: BehaviourInfo[] = [
  {
    key: 'doomscrolling',
    label: 'Doom scrolling',
    family: 'digital',
    intentionTemplate: 'Less time lost to scrolling',
    logPrompt: 'What were you reaching for?',
    detailHint: 'e.g. forty minutes on the news',
    effects: [
      {
        withinHoursOfSleep: 2,
        text: 'Emotionally charged reading close to bed lengthens how long it takes to fall asleep. The arousal does more of that than the screen light does — which is why night mode alone changes little.',
        evidenceLevel: 'C',
        attribution: 'Pre-sleep cognitive arousal and sleep-onset research',
        counterProtocolId: 'wind-down',
        counterText: 'A wind-down that starts before the phone does is the reliable fix.',
      },
    ],
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
    effects: [
      {
        withinHoursOfSleep: 4,
        text: 'Alcohol shortens the night, not the sleep. It speeds falling asleep, then suppresses REM and fragments the second half as it clears — which is why a drink can feel like it helped and still cost you the morning.',
        evidenceLevel: 'B',
        attribution: 'Meta-analyses of alcohol and sleep architecture; the effect grows with the amount',
        counterProtocolId: 'alcohol-cutoff',
        counterText: 'Most of it comes back if the last drink lands three or more hours before bed.',
      },
      {
        text: 'It also blunts the next day’s training. Alcohol interferes with the muscle protein synthesis that follows a session, and with the glycogen you replace overnight.',
        evidenceLevel: 'C',
        attribution: 'Controlled studies of post-exercise alcohol and recovery, mostly small',
      },
    ],
  },
  {
    key: 'vaping',
    label: 'Vaping',
    family: 'substance',
    intentionTemplate: 'Keep the vape down',
    logPrompt: 'What triggered it?',
    detailHint: 'e.g. stepped outside with the team',
    effects: [
      {
        withinHoursOfSleep: 3,
        text: 'Nicotine is a stimulant with a half-life around two hours. It raises heart rate and lightens sleep across the hours it takes to clear.',
        evidenceLevel: 'C',
        attribution: 'Nicotine pharmacology; vaping-specific sleep evidence is still thin',
        counterProtocolId: 'wind-down',
        counterText: 'The last one of the evening is the one that costs the most — moving it earlier buys the night back.',
      },
      {
        text: 'Nicotine reaches peak blood levels within about ten minutes and falls away over roughly two hours, which is the interval the next craving arrives on. The cycle is pharmacological, not a matter of resolve.',
        evidenceLevel: 'B',
        attribution: 'Nicotine pharmacokinetics',
      },
    ],
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
    effects: [
      {
        withinHoursOfSleep: 3,
        text: 'Nicotine is a stimulant with a half-life around two hours. Smokers spend measurably more of the night in light sleep and less in deep sleep than non-smokers.',
        evidenceLevel: 'B',
        attribution: 'Nicotine pharmacology and polysomnography cohort studies',
        counterProtocolId: 'wind-down',
        counterText: 'The evening ones cost the most sleep. Moving the last one earlier is the cheapest change available.',
      },
      {
        text: 'Overnight withdrawal is part of why early waking is common in heavy smokers — blood nicotine falls through the night and the body notices before you do.',
        evidenceLevel: 'C',
        attribution: 'Smoking-cessation and sleep-continuity literature',
      },
    ],
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
    effects: [
      {
        withinHoursOfSleep: 2,
        text: 'Competitive or fast-paced play keeps heart rate and alertness elevated past the session itself, pushing sleep onset later than the clock suggests.',
        evidenceLevel: 'C',
        attribution: 'Pre-sleep arousal and gaming studies',
        counterProtocolId: 'wind-down',
        counterText: 'The arousal outlasts the game by a while — a real gap between the last match and bed does the work.',
      },
    ],
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
    effects: [
      {
        text: 'Near-misses activate the same reward circuitry as wins, which is why machines and apps are designed to produce them. The pull after a near-miss is engineered, not a personal failing.',
        evidenceLevel: 'B',
        attribution: 'Imaging studies of near-miss reward response in gambling',
      },
      {
        withinHoursOfSleep: 3,
        text: 'Late betting keeps arousal and heart rate up well past the last bet, and the sleep that follows is shorter and lighter.',
        evidenceLevel: 'D',
        attribution: 'Extrapolated from general pre-sleep arousal research; gambling-specific sleep evidence is thin',
      },
    ],
  },
  {
    key: 'junk_food',
    label: 'Junk food',
    family: 'food',
    intentionTemplate: 'Eat like it matters',
    logPrompt: 'What was going on?',
    detailHint: 'e.g. takeaway instead of the plan',
    safetyNote:
      'A count is information, not a verdict. If tracking meals starts to feel compulsive rather ' +
      'than useful, switch it off — and if food is already a hard subject, a GP or dietitian is ' +
      'the right place for it.',
    effects: [
      {
        withinHoursOfSleep: 3,
        text: 'A large meal close to bed keeps digestion and core temperature up when both need to fall for sleep to start. Lying down within a couple of hours of it also makes reflux considerably more likely.',
        evidenceLevel: 'C',
        attribution: 'Late-meal timing and sleep-quality studies; reflux positioning evidence is stronger than the sleep-architecture evidence',
        counterProtocolId: 'kitchen-closed',
        counterText: 'A kitchen that closes about three hours before bed removes the decision rather than requiring one.',
      },
      {
        withinHoursOfSleep: 5,
        text: 'Evening insulin sensitivity is lower than morning insulin sensitivity, so the same meal produces a larger and longer glucose rise at night.',
        evidenceLevel: 'B',
        attribution: 'Circadian metabolism research',
        counterProtocolId: 'post-meal-walk',
        counterText: 'A ten-minute walk after eating blunts most of the spike.',
      },
    ],
  },
  {
    key: 'sugar',
    label: 'Sweets and snacking',
    family: 'food',
    intentionTemplate: 'Snack when it is worth it',
    logPrompt: 'What was going on?',
    detailHint: 'e.g. one piece of Kit Kat',
    safetyNote:
      'Counting anything you eat can tip from useful into preoccupying, and it does that fastest ' +
      'for people who have been there before. If logging this starts to feel compulsive, or if ' +
      'food is already a hard subject, turn it off here and talk to a GP or a dietitian — that ' +
      'is the right tool, and this is not it.',
    effects: [
      {
        // The finding that makes this worth saying at all. It is about the
        // CLOCK, not the food: the same bar, eaten twelve hours apart, is
        // two different metabolic events.
        withinHoursOfSleep: 5,
        text: 'Insulin sensitivity runs on a body clock and is at its lowest in the evening. The same bar produces a higher and longer glucose rise at nine at night than the identical one at nine in the morning.',
        evidenceLevel: 'B',
        attribution: 'Circadian metabolism research — the evening glucose response is well replicated in controlled feeding studies',
        counterProtocolId: 'post-meal-walk',
        counterText: 'Ten minutes of walking flattens most of that curve. It is the highest-return ten minutes in nutrition.',
      },
      {
        withinHoursOfSleep: 3,
        text: 'The rise is followed by a dip a few hours later, and the hormones that correct a nocturnal dip — cortisol and adrenaline among them — are the ones that wake people around three.',
        evidenceLevel: 'C',
        attribution: 'Glycaemic variability and sleep-fragmentation studies; the link is consistent but the trials are small',
      },
      {
        text: 'Sugar eaten on its own hits the bloodstream faster than the same sugar alongside protein, fat or fibre, which slow absorption and blunt the peak.',
        evidenceLevel: 'B',
        attribution: 'Nutrient-order and mixed-meal glycaemic research',
      },
    ],
  },
  {
    key: 'late_caffeine',
    label: 'Late caffeine',
    family: 'substance',
    intentionTemplate: 'Last coffee earlier',
    logPrompt: 'What was it, and what was it for?',
    detailHint: 'e.g. a flat white at 4pm to get through',
    effects: [
      {
        withinHoursOfSleep: 8,
        text: 'Caffeine has a half-life around five hours, so a four o’clock coffee is still half-present at bedtime. In controlled trials it cut total sleep even when taken six hours before bed — and even when people reported noticing nothing.',
        evidenceLevel: 'A',
        attribution: 'Drake et al. 2013, Journal of Clinical Sleep Medicine',
        counterProtocolId: 'caffeine-cutoff',
        counterText: 'A cutoff eight to ten hours before bed is the whole intervention. Nothing else about coffee needs changing.',
      },
      {
        text: 'It works by blocking adenosine rather than adding energy — the tiredness is still accumulating underneath and arrives all at once when the caffeine clears.',
        evidenceLevel: 'B',
        attribution: 'Adenosine-receptor pharmacology',
      },
    ],
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
    effects: [
      {
        withinHoursOfSleep: 1,
        text: 'The bed stops working as a sleep cue when it doubles as a screen. Sleep onset drifts later over weeks of it, which is why the standard insomnia protocol moves the phone out of the room before it changes anything else.',
        evidenceLevel: 'B',
        attribution: 'Stimulus-control therapy, the core component of CBT-I',
        counterProtocolId: 'wind-down',
        counterText: 'Charging it in another room is the single change with the best evidence behind it.',
      },
    ],
  },
  {
    key: 'overworking',
    label: 'Working too late',
    family: 'rhythm',
    intentionTemplate: 'Close the laptop earlier',
    logPrompt: 'What made tonight the night?',
    detailHint: 'e.g. back on email until eleven',
    effects: [
      {
        withinHoursOfSleep: 2,
        text: 'Work in the last hour before bed keeps the problem loaded. Unfinished-task rumination is among the best-established reasons falling asleep takes longer, and the mind does not stop working just because the laptop has closed.',
        evidenceLevel: 'C',
        attribution: 'Work-related rumination and sleep-onset research',
        counterProtocolId: 'wind-down',
        counterText: 'Writing down the unfinished thing is what lets you stop holding it — the effect is on the loop, not the task.',
      },
    ],
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
