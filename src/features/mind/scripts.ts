/**
 * Guided meditation — scripts as data, timing derived from elapsed seconds.
 *
 * The old session was a countdown and a number, which is a timer, not
 * guidance. Isaac's note was simply "the meditation should be guided".
 *
 * Three constraints shaped this:
 *
 * No audio. There is no audio dependency in the app, and adding one to ship
 * guidance would mean recording or licensing a voice before a single user
 * could sit down. Text cues on a quiet screen work, and they work offline,
 * silently, and next to a sleeping child.
 *
 * No timers of its own. Every cue is a second offset from the session
 * start, and the screen reads the elapsed clock — the same approach
 * `breathe.tsx` already uses. Nothing accumulates drift, and a
 * backgrounded app resumes at the right place instead of the place it
 * stopped counting.
 *
 * No instruction to clear the mind. It is not achievable and it teaches
 * people they are bad at something they are doing correctly. Every script
 * here treats the wandering as the repetition, because that is what the
 * traditions these come from actually teach.
 */

import type { EvidenceLevel } from '@/features/knowledge/protocols';

export interface GuidanceCue {
  /** Seconds from session start. */
  atSec: number;
  /** The instruction, short enough to read at a glance with eyes half open. */
  text: string;
  /** A quieter second line, when the instruction needs a reason. */
  detail?: string;
}

export type PracticeKind =
  | 'breath'
  | 'body-scan'
  | 'noting'
  | 'kindness'
  | 'nsdr'
  | 'sleep'
  | 'open';

export interface MeditationScript {
  id: string;
  title: string;
  practice: PracticeKind;
  /** One line, shown on the chooser. */
  summary: string;
  /** Durations this script is written for, shortest first. */
  durationsMin: number[];
  evidenceLevel: EvidenceLevel;
  attribution: string;
  /**
   * Present where the practice can surface difficult material. Shown before
   * the session starts, not after.
   */
  safety?: string;
  /** The cue track for a chosen duration. */
  build: (durationMin: number) => GuidanceCue[];
}

/**
 * Spread instructions evenly across a stretch of the session.
 *
 * Guidance that arrives in a clump at the start and then abandons you is
 * the most common failure of written meditation scripts; so is a cue every
 * fifteen seconds, which is a lecture. This keeps the spacing honest to the
 * length actually chosen.
 */
export function spaceCues(
  lines: { text: string; detail?: string }[],
  fromSec: number,
  toSec: number,
): GuidanceCue[] {
  if (lines.length === 0) return [];
  const span = Math.max(0, toSec - fromSec);
  const step = lines.length === 1 ? span : span / lines.length;
  return lines.map((line, i) => ({
    atSec: Math.round(fromSec + i * step),
    text: line.text,
    detail: line.detail,
  }));
}

/**
 * Settle / practice / close.
 *
 * Proportional, but with floors. Twelve percent of a two-minute sit is
 * fourteen seconds, which is not a close — it is a jolt — and the fixed
 * fifteen-second tail the scripts want would then land BEFORE the widening
 * cue, showing the wrong line for the rest of the session. Floors keep the
 * three sections in order at every duration offered.
 */
const sections = (totalSec: number) => {
  const tail = Math.max(25, Math.round(totalSec * 0.12));
  return {
    settleEnd: Math.max(15, Math.round(totalSec * 0.12)),
    practiceEnd: totalSec - tail,
    /** The final line, always after the close begins and before the end. */
    endAt: totalSec - Math.max(10, Math.round(tail * 0.4)),
    totalSec,
  };
};

const BODY_PARTS = [
  'the soles of your feet',
  'your ankles and shins',
  'your knees and thighs',
  'your hips, and the weight of you on the chair',
  'your belly, rising and falling',
  'your chest',
  'your hands — palms, then each finger',
  'your arms, up to the shoulders',
  'your shoulders, and whatever they are holding',
  'your throat and jaw',
  'your face — the small muscles around the eyes',
  'the top of your head',
];

export const MEDITATION_SCRIPTS: MeditationScript[] = [
  {
    id: 'breath-anchor',
    title: 'Breath anchor',
    practice: 'breath',
    summary: 'The standard practice. One thing to return to, over and over.',
    durationsMin: [2, 5, 10, 20],
    evidenceLevel: 'B',
    attribution: 'Focused-attention practice as taught in MBSR',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Sit so your back holds itself.', detail: 'Eyes closed, or resting a metre or so ahead.' },
        { atSec: 10, text: 'Three slower breaths. Let the out-breath be the longer one.' },
        {
          atSec: settleEnd,
          text: 'Now let the breath do what it does.',
          detail: 'You are not managing it. You are watching it.',
        },
        ...spaceCues(
          [
            { text: 'Find where you feel it most clearly — nostrils, chest, or belly. Stay there.' },
            {
              text: 'When you notice you have wandered off, that noticing is the repetition.',
              detail: 'Not a failure. The whole exercise, arriving.',
            },
            { text: 'Come back to the same spot. No commentary about having left.' },
            { text: 'Notice the small pause at the end of the out-breath.' },
            { text: 'Thoughts will keep arriving. Let them pass behind the breath rather than through it.' },
            { text: 'Back to the breath. Again. This is what the practice is made of.' },
            { text: 'If you are restless, name it — "restless" — and return.' },
            { text: 'Nothing to achieve in the time that is left.' },
          ],
          settleEnd + 20,
          practiceEnd,
        ),
        {
          atSec: practiceEnd,
          text: 'Let the attention widen. Sounds in the room, the chair, the light.',
        },
        {
          atSec: endAt,
          text: 'When you are ready, open your eyes.',
          detail: 'Carry a little of that pace into the next thing you do.',
        },
      ];
    },
  },

  {
    id: 'body-scan',
    title: 'Body scan',
    practice: 'body-scan',
    summary: 'Attention travels the body, slowly. Good for a mind that will not sit still.',
    durationsMin: [10, 20],
    evidenceLevel: 'B',
    attribution: 'Body scan as taught in MBSR',
    safety:
      'Close attention to the body can bring up more than expected — old pain, tension that turns ' +
      'out to be emotion. If it becomes uncomfortable, open your eyes and stop. That is a sound ' +
      'decision, not a failed session.',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Lie down or sit back. Let the surface underneath take your weight.' },
        { atSec: 12, text: 'Two long breaths. Nothing to fix yet.' },
        {
          atSec: settleEnd,
          text: 'We will move through the body slowly.',
          detail: 'You are not relaxing each part. You are visiting it.',
        },
        ...spaceCues(
          BODY_PARTS.map((part, i) => ({
            text: `Attention to ${part}.`,
            detail: i === 3 ? 'Whatever is there is what you are looking for — including nothing.' : undefined,
          })),
          settleEnd + 15,
          practiceEnd,
        ),
        { atSec: practiceEnd, text: 'The whole body at once, breathing.' },
        {
          atSec: endAt,
          text: 'Move your fingers. Open your eyes when you want to.',
        },
      ];
    },
  },

  {
    id: 'noting',
    title: 'Noting',
    practice: 'noting',
    summary: 'Name what shows up — thinking, hearing, feeling — and let it go.',
    durationsMin: [5, 10, 20],
    evidenceLevel: 'C',
    attribution: 'Noting practice from the Mahasi vipassana tradition',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Settle. Back straight, hands wherever they are comfortable.' },
        {
          atSec: settleEnd,
          text: 'Whatever takes your attention, name it in one word.',
          detail: 'Silently. "Thinking." "Hearing." "Aching." Then let it be.',
        },
        ...spaceCues(
          [
            { text: 'A thought arrives — "thinking" — and back to the breath.' },
            { text: 'A sound — "hearing". No story about the sound.' },
            {
              text: 'The naming is deliberately flat.',
              detail: 'One word does less than a sentence, which is the point.',
            },
            { text: 'A feeling in the body — "tension", "warmth". Name it and move on.' },
            { text: 'Planning counts as thinking. So does remembering.' },
            { text: 'Notice that whatever you named has already changed.' },
            { text: 'If several things arrive at once, take one. The others will wait.' },
            { text: 'Keep going. Name, release, breath.' },
          ],
          settleEnd + 20,
          practiceEnd,
        ),
        { atSec: practiceEnd, text: 'Stop naming. Just sit for the last stretch.' },
        { atSec: endAt, text: 'Open your eyes.' },
      ];
    },
  },

  {
    id: 'kindness',
    title: 'Kindness',
    practice: 'kindness',
    summary: 'Wishing people well, on purpose. The one that shifts a hard mood.',
    durationsMin: [5, 10],
    evidenceLevel: 'C',
    attribution: 'Metta practice, as taught across contemplative traditions',
    safety:
      'Directing kindness at yourself is the hard part for most people, and it can feel false at ' +
      'first. That is common and not a sign you are doing it wrong. If a particular person is too ' +
      'much today, leave them out — the practice still works.',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Settle. Let the face soften — jaw, and around the eyes.' },
        {
          atSec: settleEnd,
          text: 'Bring yourself to mind, as you are today.',
          detail: 'The phrases can feel hollow at first. Say them anyway.',
        },
        ...spaceCues(
          [
            { text: '"May I be well. May I be at ease. May I be free from struggle."' },
            {
              text: 'Now someone easy to love. Picture their face.',
              detail: 'Same three lines, aimed at them.',
            },
            { text: '"May you be well. May you be at ease. May you be free from struggle."' },
            {
              text: 'Now someone you barely know — a neighbour, someone from this morning.',
              detail: 'The stretch is the point.',
            },
            { text: '"May you be well. May you be at ease."' },
            {
              text: 'If you can, someone you are finding difficult.',
              detail: 'Not forgiveness. Just the wish that their life goes well.',
            },
            { text: 'And everyone else, all at once. The whole noisy lot.' },
          ],
          settleEnd + 20,
          practiceEnd,
        ),
        { atSec: practiceEnd, text: 'Let the phrases go. Sit with whatever is left.' },
        { atSec: endAt, text: 'Open your eyes.' },
      ];
    },
  },

  {
    id: 'nsdr',
    title: 'Deep rest',
    practice: 'nsdr',
    summary: 'Non-sleep deep rest for the afternoon dip. Lie down for this one.',
    durationsMin: [10, 20],
    evidenceLevel: 'C',
    attribution: 'Non-sleep deep rest, drawn from yoga nidra protocols',
    safety: 'Not while driving or operating anything. People do fall asleep in this one.',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Lie flat. Arms at your sides, palms up.' },
        {
          atSec: 15,
          text: 'Long, slow out-breaths for a minute or so.',
          detail: 'Twice as long out as in, roughly. No strain.',
        },
        {
          atSec: settleEnd,
          text: 'You are aiming for rested, not asleep.',
          detail: 'If sleep comes anyway, that is fine.',
        },
        ...spaceCues(
          [
            { text: 'Feel the points where your body touches the floor or bed.' },
            { text: 'Attention to the right side of the body, from the hand upward.' },
            { text: 'Now the left side, the same way.' },
            { text: 'Both legs, heavy.' },
            { text: 'The whole back, released into the surface.' },
            { text: 'Let the breath find its own rhythm. Nothing to manage.' },
            { text: 'A sense of the whole body at once, still.' },
            { text: 'Stay here. Nothing to do for a while.' },
          ],
          settleEnd + 20,
          practiceEnd,
        ),
        {
          atSec: practiceEnd,
          text: 'Start to come back. Deepen the breath.',
        },
        {
          atSec: endAt,
          text: 'Move your fingers and toes. Roll to one side before sitting up.',
        },
      ];
    },
  },

  {
    id: 'wind-down',
    title: 'Wind-down',
    practice: 'sleep',
    summary: 'For the last half hour of the day. Ends quietly, no bell.',
    durationsMin: [5, 10],
    evidenceLevel: 'C',
    attribution: 'Progressive relaxation and stimulus-control principles from CBT-I',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'In bed, lights low. Phone face down and out of reach after this.' },
        {
          atSec: settleEnd,
          text: 'Out-breaths longer than in-breaths. Let them get slower on their own.',
        },
        ...spaceCues(
          [
            { text: 'Unclench the jaw. Most people are holding it without knowing.' },
            { text: 'Drop the shoulders away from the ears.' },
            { text: 'Soften the hands. Then the belly.' },
            {
              text: 'If tomorrow arrives in your head, it is not a problem to solve now.',
              detail: 'Name it "tomorrow", and put it down.',
            },
            { text: 'The legs, heavy. The whole back, heavy.' },
            { text: 'Nothing required of you for the rest of tonight.' },
            { text: 'Let the counting and the noticing go.' },
          ],
          settleEnd + 15,
          practiceEnd,
        ),
        {
          atSec: practiceEnd,
          text: 'Stay here as long as you like.',
          detail: 'The session will end without a sound.',
        },
        { atSec: endAt, text: 'Goodnight.' },
      ];
    },
  },

  {
    id: 'open-awareness',
    title: 'Open awareness',
    practice: 'open',
    summary: 'No anchor. For a practice that already has some hours in it.',
    durationsMin: [10, 20],
    evidenceLevel: 'D',
    attribution: 'Open-monitoring practice; less studied than focused attention',
    build: (min) => {
      const { settleEnd, practiceEnd, endAt } = sections(min * 60);
      return [
        { atSec: 0, text: 'Sit. A few breaths to arrive.' },
        {
          atSec: settleEnd,
          text: 'Let go of the breath as an anchor.',
          detail: 'Nothing to hold on to now. Attention stays wide.',
        },
        ...spaceCues(
          [
            { text: 'Let whatever arrives arrive. Do not go looking.' },
            { text: 'Sounds, sensations, thoughts — all the same size.' },
            {
              text: 'Notice the space they appear in rather than the things themselves.',
            },
            { text: 'If you find yourself gripping something, loosen and stay wide.' },
            { text: 'Nothing here needs your response.' },
            { text: 'Thoughts about the practice are also just thoughts.' },
            { text: 'Rest as the awareness rather than the contents.' },
            { text: 'Nowhere to get to.' },
          ],
          settleEnd + 20,
          practiceEnd,
        ),
        { atSec: practiceEnd, text: 'Let the room come back.' },
        { atSec: endAt, text: 'Open your eyes.' },
      ];
    },
  },
];

export const scriptById = (id: string): MeditationScript | undefined =>
  MEDITATION_SCRIPTS.find((s) => s.id === id);

/** The cue showing at a given moment — the last one whose time has passed. */
export function cueAt(cues: GuidanceCue[], elapsedSec: number): GuidanceCue | null {
  let current: GuidanceCue | null = null;
  for (const cue of cues) {
    if (cue.atSec <= elapsedSec) current = cue;
    else break;
  }
  return current;
}

/**
 * Scripts worth offering at a practice level.
 *
 * Nothing is locked — every script is always runnable, matching how
 * `practice.ts` treats levels as a mirror rather than a gate. This only
 * decides what to show first, so a beginner is not handed open awareness on
 * day one and a ten-year meditator is not handed a two-minute reset.
 */
export function scriptsForLevel(level: number): MeditationScript[] {
  const ordering: Record<number, PracticeKind[]> = {
    1: ['breath', 'sleep', 'body-scan', 'kindness'],
    2: ['breath', 'body-scan', 'kindness', 'sleep', 'nsdr'],
    3: ['noting', 'breath', 'body-scan', 'nsdr', 'kindness', 'sleep'],
    4: ['noting', 'open', 'nsdr', 'breath', 'kindness', 'body-scan', 'sleep'],
  };
  const preferred = ordering[level] ?? ordering[1];
  return [...MEDITATION_SCRIPTS].sort((a, b) => {
    const ai = preferred.indexOf(a.practice);
    const bi = preferred.indexOf(b.practice);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}
