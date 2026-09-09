import type { EvidenceLevel, Pillar } from '@/features/knowledge/protocols';

/**
 * One thing you can stop doing, and what it buys you back.
 *
 * Every library in this category only ever adds. That is the shape of the
 * problem the product exists to solve — a person with nine podcasts and
 * forty saved protocols does not need a fortieth-first — and it is also
 * the one thing none of the competitors will ever say, because a practice
 * you drop is a practice they cannot sell you.
 *
 * Each entry is a claim the verification rounds went looking for and did
 * not find, written the way the round wrote it: what people believe, what
 * the evidence actually says, and roughly what it costs to keep believing
 * it. The minutes are honest estimates of the practice, never of the
 * benefit — nobody is claiming a number for what you gain.
 */
export interface TimeBack {
  id: string;
  pillar: Pillar;
  /** The practice, in the words somebody would use for it. */
  claim: string;
  /** What the evidence turned out to say. Plain, never smug. */
  finding: string;
  /** What it cost to keep doing, per week, where that is knowable. */
  minutesPerWeek?: number;
  /** How good the evidence AGAINST it is — the same scale as everything else. */
  evidenceLevel: EvidenceLevel;
  /** The round that found it, so the reasoning is traceable. */
  source: string;
}

export const TIME_BACK: TimeBack[] = [
  {
    id: 'hydration-thinking',
    pillar: 'nutrition',
    claim: 'Staying ahead of your water so your thinking does not slip.',
    finding:
      'Two meta-analyses find no measurable cognitive effect until about 2% of body mass is lost, which is far more dehydration than being a bit behind on the bottle. Drink when you are thirsty. What you get back is the low-grade anxiety about the bottle, which is most of what this practice actually was.',
    evidenceLevel: 'B',
    source: 'Nutrition round, September 2026',
  },
  {
    id: 'per-meal-protein',
    pillar: 'nutrition',
    claim: 'Hitting a protein number at every meal, spaced through the day.',
    finding:
      'The per-meal ceiling and the leucine threshold underneath it do not survive: the systematic review finds no threshold in either age group. The daily total is the thing worth caring about, and distributing it as carefully as you have been told is effort without a finding behind it.',
    minutesPerWeek: 60,
    evidenceLevel: 'B',
    source: 'Nutrition round, September 2026',
  },
  {
    id: 'growth-mindset-selftalk',
    pillar: 'skill',
    claim: 'Talking yourself into a growth mindset before you perform.',
    finding:
      '63 studies and nearly 98,000 people give an overall effect of 0.05, which is not significant after bias correction and falls to 0.02 in the highest-quality subset. Larger effects come from authors with a financial interest in the programme. Believing you can improve is fine and worth having; the pre-performance ritual is not the thing that does it.',
    evidenceLevel: 'B',
    source: 'Skill round, September 2026',
  },
  {
    id: 'planner-for-procrastination',
    pillar: 'skill',
    claim: 'Buying a better planner to fix procrastination.',
    finding:
      'Two meta-analyses find the cognitive-behavioural approach outperforms the alternatives and no scheduling approach came out on top. The lever is the first two minutes and how you feel about them, not the calendar. Stated carefully: neither paper says time management is the least effective thing, only that it is not the most.',
    evidenceLevel: 'C',
    source: 'Skill round, September 2026',
  },
  {
    id: 'self-controlled-practice',
    pillar: 'skill',
    claim: 'Choosing your own feedback schedule to learn faster.',
    finding:
      'A naive effect of 0.44 collapses to 0.02 once unpublished experiments are included, with publication status explaining nearly half the variation between studies. Practise how you like; the choosing is not what makes it work.',
    evidenceLevel: 'B',
    source: 'Skill round, September 2026',
  },
  {
    id: 'reduce-social-media-for-mood',
    pillar: 'mind',
    claim: 'Cutting social media to feel better.',
    finding:
      'A 2025 preregistered meta-analysis across 4,674 people is null on every outcome and null on dose. The widely quoted tally of positive experiments is a self-maintained document rather than a peer-reviewed one. The attention and notification practices in this library keep their grade, because they rest on a different literature about divided attention — the same behaviour, two rationales, one of them supported.',
    evidenceLevel: 'B',
    source: 'Mind round, September 2026',
  },
  {
    id: 'stretching-before-lifting',
    pillar: 'training',
    claim: 'Cutting static stretching out of your warm-up.',
    finding:
      'This one goes the other way, and it is the round’s clearest near-miss. Across 83 studies and 2,012 participants the cost appears only at holds of 60 seconds or more, and there is nothing at all on jumping or sprinting. The authors explicitly reject excluding stretching from warm-ups. Long holds cost a little, short ones cost nothing, keep your warm-up.',
    evidenceLevel: 'B',
    source: 'Training round, September 2026',
  },
  {
    id: 'daily-hrv-verdict',
    pillar: 'longevity',
    claim: 'Reading this morning’s heart-rate variability as a verdict on today.',
    finding:
      'Healthy people differ several-fold in absolute values, a single reading swings on posture, breathing rate and which algorithm your device uses, and alcohol or a coming illness moves a night more than training does. A weekly direction against your own baseline is about as much as the number carries. Checking it daily costs a minute and buys a mood.',
    minutesPerWeek: 7,
    evidenceLevel: 'C',
    source: 'Recovery round, September 2026',
  },
];

/** The one worth showing this week, rotated so it is never the same one. */
export function timeBackFor(weekKey: string, pillars?: Pillar[]): TimeBack | null {
  const pool = pillars?.length ? TIME_BACK.filter((t) => pillars.includes(t.pillar)) : TIME_BACK;
  if (pool.length === 0) return null;
  const seed = Array.from(weekKey).reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}
