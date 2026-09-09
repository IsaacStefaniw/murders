import type { EvidenceLevel } from '@/features/knowledge/protocols';

export interface Regrade {
  from: EvidenceLevel;
  to: EvidenceLevel;
  /** ISO date the change shipped. */
  on: string;
  /** Why, in the words a reader can check. */
  why: string;
}

/**
 * What each grade used to be, and why it moved.
 *
 * A grade with no history is an opinion. A grade that has moved, in public,
 * with a reason attached, is a claim somebody can check — and the direction
 * it moved is the part that costs us something to publish: of the seventeen
 * changes below, fourteen went down.
 *
 * That is the point of keeping this. Any app can print a letter beside a
 * practice. Very few will show you the letter they used to print, on the
 * same screen, with the reason they were wrong.
 */
export const REGRADES: Record<string, Regrade[]> = {
  'stimulus-control': [
    {
      from: 'A',
      to: 'B',
      on: '2026-09-08',
      why: 'The 2021 guideline gives multicomponent therapy a strong recommendation and this component a conditional one. A component with a conditional recommendation is "tested and held up", not "repeatedly tested with results that agree". The practice is unchanged and still excellent.',
    },
  ],
  'payday-automation': [
    {
      from: 'A',
      to: 'B',
      on: '2026-09-08',
      why: 'No meta-analysis, one landmark natural experiment replicated in national policy, and a 2022 bias-corrected reanalysis calling default-type nudges inconclusive. The card asks for a personal standing transfer, which is not what any of those trials tested.',
    },
  ],
  'alcohol-cutoff': [
    {
      from: 'B',
      to: 'C',
      on: '2026-09-08',
      why: 'The card told you to move the hour. The only controlled timing study found a moderate amount six hours before bed, fully cleared by lights out, still doubled second-half wakefulness — the amount is the lever, not the hour. The instruction changed with the grade.',
    },
  ],
  'protein-breakfast': [
    {
      from: 'B',
      to: 'C',
      on: '2026-09-08',
      why: 'The per-meal ceiling and the leucine threshold underneath it do not survive: the systematic review finds no threshold in either age group.',
    },
  ],
  'meditation-10': [
    {
      from: 'B',
      to: 'C',
      on: '2026-09-08',
      why: 'Across 65 trials and 5,489 people the effect is small, publication bias is detectable, and it shrinks further against an active control. Nothing about the practice changed, and the reason to do it was never the size of the effect.',
    },
  ],
  'body-scan-sleep': [
    {
      from: 'C',
      to: 'D',
      on: '2026-09-08',
      why: 'Six trials, 330 people, most sleep outcomes null, and one measure of arousal pointing the wrong way. It stays because it is pleasant and harmless and expecting something to help is itself part of why things help — but it stopped claiming a sleep-onset benefit.',
    },
  ],
  'skill-one-external-cue': [
    {
      from: 'B',
      to: 'D',
      on: '2026-09-08',
      why: 'Two grades, on a 2024 robust Bayesian reanalysis of the field’s own dataset: moderate-to-strong publication bias in every analysis, bias-corrected effects between roughly zero and 0.15, and Bayes factors favouring the null on all five outcomes.',
    },
  ],
  'ship-monthly': [
    {
      from: 'C',
      to: 'E',
      on: '2026-09-08',
      why: 'The study this rested on was retracted in September 2026 after its data were found to have been tampered with, and a replication failed. Nothing replaces it. The practice is kept on experience, which is what an E means, and both credits came off.',
    },
  ],
  'money-checkin': [
    {
      from: 'D',
      to: 'C',
      on: '2026-09-08',
      why: 'The monitoring evidence supports a light fixed cadence, which is better than the card had claimed for itself — and it also says thirty weekly minutes is heavier than the finding asks for, so the practice shrank as the grade rose.',
    },
  ],
  'shutdown-ritual': [
    {
      from: 'D',
      to: 'C',
      on: '2026-09-08',
      why: 'There is a direct experiment on this exact practice the card never cited: 103 employees and 1,127 loose ends, where writing where and when each one gets picked up raised detachment, most in the people who find detaching hardest.',
    },
  ],
  'good-news-response': [
    {
      from: 'C',
      to: 'B',
      on: '2026-09-08',
      why: 'Four experiments on how you answer someone’s good news, and the best-supported single behaviour in a pillar where nothing reaches an A.',
    },
  ],
  'one-small-act': [
    {
      from: 'C',
      to: 'B',
      on: '2026-09-08',
      why: 'Behavioural activation is now shown non-inferior to cognitive therapy across two independent meta-analyses seven years apart, while being far simpler.',
    },
  ],
  'best-possible-self': [
    {
      from: 'C',
      to: 'B',
      on: '2026-09-08',
      why: 'It has a dedicated meta-analysis it did not have when it was first graded, and that analysis endorses the shorter version.',
    },
  ],
  'gratitude-letter': [
    {
      from: 'C',
      to: 'B',
      on: '2026-09-08',
      why: 'A preregistered analysis across 24,804 people in 28 countries, with publication-bias correction, which turns a small effect into a tested one.',
    },
  ],
  'carer-own-hours': [
    {
      from: 'C',
      to: 'D',
      on: '2026-09-08',
      why: 'Pooled trials of respite found no significant effect on any carer outcome across four randomised trials and 753 participants. The practice stays and its claim shrank.',
    },
  ],
  'state-of-us': [
    {
      from: 'C',
      to: 'D',
      on: '2026-09-08',
      why: 'Re-checked against the connection round’s own ceiling: nothing about couple behaviour is supported at the level this grade implied.',
    },
  ],
  'family-adventure': [
    {
      from: 'C',
      to: 'D',
      on: '2026-09-08',
      why: 'Re-checked against the connection round’s own ceiling: nothing about family behaviour is supported at the level this grade implied.',
    },
  ],
};

/** How many grades have moved, and which way. The costly half is the down. */
export function regradeTally(): { total: number; down: number; up: number } {
  const ORDER: EvidenceLevel[] = ['A', 'B', 'C', 'D', 'E'];
  let down = 0;
  let up = 0;
  for (const list of Object.values(REGRADES)) {
    for (const r of list) {
      if (ORDER.indexOf(r.to) > ORDER.indexOf(r.from)) down += 1;
      else up += 1;
    }
  }
  return { total: down + up, down, up };
}

export const regradesFor = (protocolId: string): Regrade[] => REGRADES[protocolId] ?? [];
