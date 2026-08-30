/**
 * The knowledge base — evidence-informed practices, structured for planning.
 *
 * Each protocol is a practice distilled *in INTENT's own words* from the
 * public, evidence-based teaching of well-known communicators (Tim Ferriss,
 * Andrew Huberman, Peter Attia, Rhonda Patrick, Jordan Peterson, David
 * Sinclair) and the research they discuss. No transcript text is
 * reproduced; `attribution` credits whose public work popularised the
 * practice and implies no endorsement of INTENT. Sourcing policy:
 * docs/KNOWLEDGE.md.
 *
 * Protocols are machine-plannable: `toRoutine` turns one into a Routine
 * the scheduling engine places automatically, wake/sleep-anchored where it
 * matters. The goal wizard, interview and AI agents draw on the same list,
 * so every pathway in the app is enriched by one shared, reviewable base.
 *
 * All of it is educational structure — never medical advice.
 */

import { newId, toHHMM, toMinutes } from '@/lib/dates';
import type {
  GoalDomain,
  LifeArea,
  LifeProfile,
  PlanTier,
  Routine,
  SessionType,
  Weekday,
} from '@/types/domain';

export type Pillar =
  | 'sleep'
  | 'training'
  | 'nutrition'
  | 'longevity'
  | 'mind'
  | 'wealth'
  | 'leadership'
  | 'connection';

export const PILLAR_LABELS: Record<Pillar, string> = {
  sleep: 'Sleep & energy',
  training: 'Training',
  nutrition: 'Nutrition',
  longevity: 'Longevity',
  mind: 'Mind',
  wealth: 'Wealth',
  leadership: 'Leadership & work',
  connection: 'Connection',
};

/** Where in the day a protocol wants to live. */
interface Anchor {
  /** 'wake'/'sleep' offset in minutes, or a fixed start. */
  kind: 'wake' | 'sleep' | 'fixed';
  offsetMin?: number;
  start?: string;
  /** Latest acceptable start, minutes after preferred. */
  windowMin: number;
}

/**
 * Evidence quality — not all protocols are equally certain, and INTENT
 * says so. Expert communicators are discovery sources; the level grades
 * the underlying research, not the fame of the messenger.
 */
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D' | 'E';

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  A: 'Strong — meta-analyses / broad consensus',
  B: 'Good — multiple controlled studies',
  C: 'Moderate — observational evidence',
  D: 'Emerging — expert practice',
  E: 'Experimental — a heuristic worth testing on yourself',
};

export interface Protocol {
  id: string;
  evidenceLevel: EvidenceLevel;
  title: string;
  pillar: Pillar;
  area: LifeArea;
  /** Goal domains this practice serves — the goal wizard reads this. */
  goalDomains: GoalDomain[];
  /** What to do, one plain sentence. */
  summary: string;
  /** Why it works — the evidence story, in plain words, no overclaiming. */
  why: string;
  /** Whose public teaching popularised it. Credit, not endorsement. */
  attribution: string[];
  days: Weekday[];
  durationMin: number;
  anchor: Anchor;
  energy: Routine['energy'];
  tier: PlanTier;
  sessionType?: SessionType;
  duringWork?: boolean;
  /** Plain-words caution. Health protocols must have one. */
  safety?: string;
}

export const PROTOCOLS: Protocol[] = [
  // ── Sleep & energy ────────────────────────────────────────────────────
  {
    id: 'morning-light',
    evidenceLevel: 'B',
    title: 'Morning light',
    pillar: 'sleep',
    area: 'health',
    goalDomains: ['health'],
    summary: 'Ten minutes of outdoor light within an hour of waking.',
    why: 'Bright morning light anchors the circadian clock — the single cheapest lever for falling asleep easier at night and feeling alert earlier in the day.',
    attribution: ['Andrew Huberman', 'Rhonda Patrick'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 10,
    anchor: { kind: 'wake', offsetMin: 20, windowMin: 45 },
    energy: 'morning',
    tier: 'could',
    safety: 'Never look at the sun directly; through-window light counts for less but still counts.',
  },
  {
    id: 'wind-down',
    evidenceLevel: 'B',
    title: 'Wind-down breathing',
    pillar: 'sleep',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary: 'A short screens-away wind-down with slow breathing before bed.',
    why: 'Long, slow exhales shift the nervous system toward rest; a consistent pre-sleep routine is one of the most reliable sleep-quality improvements there is.',
    attribution: ['Andrew Huberman', 'Tim Ferriss'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 20,
    anchor: { kind: 'sleep', offsetMin: 35, windowMin: 15 },
    energy: 'evening',
    tier: 'could',
    sessionType: 'breathe',
    safety: 'A steadying tool, not treatment for a sleep disorder.',
  },

  // ── Training ──────────────────────────────────────────────────────────
  {
    id: 'strength',
    evidenceLevel: 'A',
    title: 'Strength training',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary: 'Resistance training most days you can manage — compound lifts first.',
    why: 'Muscle mass and strength are among the strongest known predictors of healthy later life; strength work is the closest thing to a retirement account for the body.',
    attribution: ['Peter Attia', 'Andrew Huberman'],
    days: [1, 3, 5],
    durationMin: 45,
    anchor: { kind: 'fixed', start: '12:05', windowMin: 70 },
    energy: 'any',
    tier: 'should',
    sessionType: 'workout',
    safety: 'Conservative loading, full range you control. No pushing through joint pain.',
  },
  {
    id: 'zone2',
    evidenceLevel: 'B',
    title: 'Zone 2 cardio',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary: 'Steady "can still hold a conversation" cardio — brisk walk, easy ride, easy jog.',
    why: 'Easy aerobic volume builds the mitochondrial base tied to metabolic health and endurance — the biggest return per unmiserable minute for most people.',
    attribution: ['Peter Attia', 'Rhonda Patrick'],
    days: [2, 6],
    durationMin: 40,
    anchor: { kind: 'fixed', start: '17:45', windowMin: 90 },
    energy: 'any',
    tier: 'could',
    safety: 'If you can only gasp out words, ease off — conversational pace is the point.',
  },
  {
    id: 'vo2-intervals',
    evidenceLevel: 'B',
    title: 'VO₂ intervals',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness'],
    summary: 'Once a week: four rounds of ~4 minutes hard, ~4 minutes easy.',
    why: 'Peak aerobic capacity correlates with long-term health more strongly than almost any other fitness measure, and one weekly interval session moves it.',
    attribution: ['Peter Attia'],
    days: [4],
    durationMin: 35,
    anchor: { kind: 'fixed', start: '17:45', windowMin: 90 },
    energy: 'any',
    tier: 'could',
    safety: 'Build up over weeks; skip when unwell; hard means hard for you, not a number.',
  },
  {
    id: 'daily-walk',
    evidenceLevel: 'A',
    title: 'The daily walk',
    pillar: 'training',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary: 'A brisk 30–40 minute walk, most days — the most underrated training there is.',
    why: 'Walking is Zone 2 in disguise: it builds the same aerobic base, costs no willpower, and is the physical activity people actually sustain for decades.',
    attribution: ['Peter Attia', 'Andrew Huberman'],
    days: [1, 2, 3, 4, 5, 6],
    durationMin: 35,
    anchor: { kind: 'fixed', start: '17:45', windowMin: 90 },
    energy: 'any',
    tier: 'should',
    safety: 'Brisk means you can talk but you notice the pace. Weather is not a reason; clothing is a solution.',
  },
  {
    id: 'post-meal-walk',
    evidenceLevel: 'B',
    title: 'Post-meal walk',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary: 'A ten-to-fifteen-minute walk after the day’s biggest meal.',
    why: 'Light movement after eating blunts the glucose spike a meal produces — a tiny habit with an outsized metabolic effect.',
    attribution: ['Rhonda Patrick', 'Peter Attia'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '18:50', windowMin: 40 },
    energy: 'evening',
    tier: 'could',
  },

  {
    id: 'mobility-10',
    evidenceLevel: 'D',
    title: 'Ten-minute mobility',
    pillar: 'training',
    area: 'health',
    goalDomains: ['fitness', 'health'],
    summary: 'Ten minutes of hips, ankles and shoulders, twice a week.',
    why: 'Stability and range are what let every other kind of training continue into later decades — the piece that decides whether you can still get off the floor at 80.',
    attribution: ['Peter Attia'],
    days: [2, 6],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '07:15', windowMin: 60 },
    energy: 'morning',
    tier: 'could',
    safety: 'Range you control, never bounced into. Discomfort fine, pain no.',
  },
  {
    id: 'cold-finish',
    evidenceLevel: 'C',
    title: 'Cold-shower finish',
    pillar: 'training',
    area: 'health',
    goalDomains: ['health', 'behaviour'],
    summary: 'End the morning shower with 30–60 seconds cold.',
    why: 'Brief deliberate cold reliably spikes alertness and mood chemistry for hours — and practising the first uncomfortable minute is rehearsal for every urge you’ll surf later.',
    attribution: ['Andrew Huberman', 'Rhonda Patrick'],
    days: [1, 2, 3, 4, 5],
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 35, windowMin: 45 },
    energy: 'morning',
    tier: 'could',
    safety: 'Uncomfortable, never painful. Heart conditions → clinician first. Never combine cold water with open water alone.',
  },

  // ── Nutrition ─────────────────────────────────────────────────────────
  {
    id: 'protein-breakfast',
    evidenceLevel: 'B',
    title: 'Protein-first breakfast',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary: 'Roughly 30 g of protein within a couple of hours of waking.',
    why: 'A protein-anchored first meal steadies appetite and energy for the whole day and front-loads the daily protein target where it’s easiest to hit.',
    attribution: ['Rhonda Patrick', 'Peter Attia'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 15,
    anchor: { kind: 'wake', offsetMin: 60, windowMin: 75 },
    energy: 'morning',
    tier: 'could',
  },
  {
    id: 'caffeine-cutoff',
    evidenceLevel: 'B',
    title: 'Caffeine cutoff',
    pillar: 'sleep',
    area: 'health',
    goalDomains: ['health'],
    summary: 'Last coffee checkpoint — nothing caffeinated after early afternoon.',
    why: 'Caffeine’s half-life is 5–6 hours: a quarter of that afternoon coffee is still circulating at midnight, quietly shaving deep sleep you never see.',
    attribution: ['Andrew Huberman', 'Peter Attia'],
    days: [0, 1, 2, 3, 4, 5, 6],
    durationMin: 5,
    anchor: { kind: 'wake', offsetMin: 8 * 60, windowMin: 30 },
    energy: 'midday',
    tier: 'could',
  },
  {
    id: 'meal-sketch',
    evidenceLevel: 'B',
    title: 'Weekly meal sketch',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health', 'fitness'],
    summary: 'Fifteen Sunday minutes deciding the week’s dinners — protein first, mostly whole foods.',
    why: 'Deciding once removes seven days of willpower decisions. Anchoring each meal on protein (~1.6–2.2 g/kg/day across the day) protects muscle and keeps you full.',
    attribution: ['Peter Attia', 'Rhonda Patrick', 'Tim Ferriss'],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '16:00', windowMin: 60 },
    energy: 'any',
    tier: 'could',
    sessionType: 'meal_plan',
  },
  {
    id: 'kitchen-closed',
    evidenceLevel: 'C',
    title: 'Kitchen closes',
    pillar: 'nutrition',
    area: 'health',
    goalDomains: ['health'],
    summary: 'A consistent last bite ~3 hours before bed; eat within a daylight window.',
    why: 'A steady, earlier eating window supports sleep and metabolic rhythm; late eating works against both.',
    attribution: ['David Sinclair', 'Rhonda Patrick'],
    days: [0, 1, 2, 3, 4],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 180, windowMin: 30 },
    energy: 'evening',
    tier: 'could',
    safety: 'Structure, not restriction — skip this protocol entirely if eating windows are a fraught topic for you.',
  },

  // ── Longevity ─────────────────────────────────────────────────────────
  {
    id: 'sauna',
    evidenceLevel: 'C',
    title: 'Sauna sessions',
    pillar: 'longevity',
    area: 'health',
    goalDomains: ['health'],
    summary: 'Two to four sauna sessions a week, ~15–20 minutes at a heat you tolerate well.',
    why: 'Regular sauna use is associated in long-running Finnish cohort studies with lower cardiovascular risk, and reliably helps relaxation and sleep.',
    attribution: ['Rhonda Patrick', 'David Sinclair'],
    days: [3, 6],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '18:45', windowMin: 60 },
    energy: 'evening',
    tier: 'could',
    safety: 'Hydrate; no alcohol around sessions; heart conditions or pregnancy → talk to a clinician first.',
  },

  // ── Mind ──────────────────────────────────────────────────────────────
  {
    id: 'meditation-10',
    evidenceLevel: 'B',
    title: 'Ten minutes of stillness',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health', 'personal'],
    summary: 'A short daily sit — breath as the anchor, thoughts allowed to pass.',
    why: 'The single most common daily practice among the high performers Ferriss has interviewed; short consistent sessions measurably improve attention and stress recovery.',
    attribution: ['Tim Ferriss', 'Andrew Huberman'],
    days: [0, 2, 4],
    durationMin: 10,
    anchor: { kind: 'fixed', start: '13:00', windowMin: 45 },
    energy: 'midday',
    tier: 'could',
    sessionType: 'meditate',
    safety: 'Non-clinical; no therapeutic claims.',
  },
  {
    id: 'nsdr',
    evidenceLevel: 'D',
    title: 'NSDR reset',
    pillar: 'mind',
    area: 'health',
    goalDomains: ['health'],
    summary: 'Ten to twenty minutes of non-sleep deep rest in the afternoon dip.',
    why: 'A guided deep-rest protocol restores alertness and lowers stress without a nap’s grogginess — a legal performance enhancer for the second half of the day.',
    attribution: ['Andrew Huberman'],
    days: [1, 3],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '14:30', windowMin: 60 },
    energy: 'midday',
    tier: 'could',
    sessionType: 'meditate',
  },
  {
    id: 'evening-journal',
    evidenceLevel: 'B',
    title: 'Five-minute journal',
    pillar: 'mind',
    area: 'growth',
    goalDomains: ['personal'],
    summary: 'Five written minutes: what went well, what you’re grateful for, one line for tomorrow.',
    why: 'Brief written gratitude and reflection reliably improve mood and sleep quality, and writing forces the clarity that vague rumination never reaches.',
    attribution: ['Tim Ferriss', 'Jordan Peterson', 'Andrew Huberman'],
    days: [0, 1, 2, 3, 4],
    durationMin: 5,
    anchor: { kind: 'sleep', offsetMin: 60, windowMin: 30 },
    energy: 'evening',
    tier: 'could',
    sessionType: 'journal',
  },

  {
    id: 'creative-block',
    evidenceLevel: 'D',
    title: 'Creative block',
    pillar: 'mind',
    area: 'growth',
    goalDomains: ['personal'],
    summary: 'Two protected sessions a week for the creative thing — making, not consuming.',
    why: 'Creative practice is the most common thread among people who describe their weeks as good ones — and it only happens when it has a defended place on the calendar.',
    attribution: ['Tim Ferriss', 'Jordan Peterson'],
    days: [2, 6],
    durationMin: 45,
    anchor: { kind: 'fixed', start: '19:45', windowMin: 60 },
    energy: 'evening',
    tier: 'could',
  },

  // ── Wealth ────────────────────────────────────────────────────────────
  {
    id: 'money-checkin',
    evidenceLevel: 'D',
    title: 'Weekly money check-in',
    pillar: 'wealth',
    area: 'admin',
    goalDomains: ['finance'],
    summary: 'Thirty Sunday minutes: automate the transfer first, then review the week’s money.',
    why: 'Automation beats willpower budgeting — pay the goal first and the review becomes observation, not judgement. A weekly cadence catches drift while it’s still small.',
    attribution: ['Tim Ferriss'],
    days: [0],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '19:30', windowMin: 60 },
    energy: 'evening',
    tier: 'could',
  },
  {
    id: 'fear-setting',
    evidenceLevel: 'E',
    title: 'Fear-setting',
    pillar: 'wealth',
    area: 'growth',
    goalDomains: ['business', 'career', 'personal', 'finance'],
    summary: 'Define the decision you’re avoiding: worst case, how you’d prevent it, how you’d repair it.',
    why: 'Stalled decisions are usually unexamined fears. Writing the worst case down shrinks it to actual size — the exercise Ferriss credits for his biggest moves. Monthly is plenty.',
    attribution: ['Tim Ferriss'],
    days: [6],
    durationMin: 30,
    anchor: { kind: 'fixed', start: '09:30', windowMin: 120 },
    energy: 'morning',
    tier: 'could',
  },

  // ── Leadership & work ─────────────────────────────────────────────────
  {
    id: 'deep-work',
    evidenceLevel: 'D',
    title: 'Deep work block',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary: 'A protected 60–90 minute single-task block before the day fragments.',
    why: 'The highest-leverage work is the kind interruptions kill. One protected morning block routinely outproduces a scattered afternoon.',
    attribution: ['Tim Ferriss'],
    days: [1, 2],
    durationMin: 60,
    anchor: { kind: 'fixed', start: '09:15', windowMin: 60 },
    energy: 'morning',
    tier: 'must',
    duringWork: true,
  },
  {
    id: 'weekly-business-review',
    evidenceLevel: 'D',
    title: 'Weekly business review',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary: 'A weekly structured review: what moved, what stalled, the one lever for next week.',
    why: 'Aim, articulate, adjust: writing down what you’re actually aiming at — and confronting what happened — is the core discipline both Peterson and Ferriss teach for any serious goal.',
    attribution: ['Jordan Peterson', 'Tim Ferriss'],
    days: [1],
    durationMin: 90,
    anchor: { kind: 'fixed', start: '09:15', windowMin: 60 },
    energy: 'morning',
    tier: 'must',
    duringWork: true,
    sessionType: 'business_review',
  },
  {
    id: 'eighty-twenty-audit',
    evidenceLevel: 'E',
    title: '80/20 audit',
    pillar: 'leadership',
    area: 'work',
    goalDomains: ['business', 'career'],
    summary: 'Roughly monthly: name the 20% producing most of the results — and the 20% producing most of the drag.',
    why: 'A small share of activities produces most of the outcome; naming and cutting the drag is where leverage actually comes from.',
    attribution: ['Tim Ferriss'],
    days: [5],
    durationMin: 45,
    anchor: { kind: 'fixed', start: '14:00', windowMin: 90 },
    energy: 'midday',
    tier: 'could',
    duringWork: true,
  },

  {
    id: 'week-preview',
    evidenceLevel: 'E',
    title: 'Sunday week preview',
    pillar: 'leadership',
    area: 'growth',
    goalDomains: ['personal', 'business', 'career'],
    summary: 'Fifteen Sunday-evening minutes looking at the week ahead: the three things that matter, the one conflict to defuse now.',
    why: 'The Sunday reset — meals decided, money checked, week previewed — is the ritual stack that makes Monday start already-won instead of already-behind.',
    attribution: ['Tim Ferriss', 'Jordan Peterson'],
    days: [0],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '20:15', windowMin: 45 },
    energy: 'evening',
    tier: 'could',
  },

  // ── Connection ────────────────────────────────────────────────────────
  {
    id: 'friend-reach-out',
    evidenceLevel: 'C',
    title: 'Reach out, make a plan',
    pillar: 'connection',
    area: 'enjoyment',
    goalDomains: ['friends'],
    summary: 'One message a week that turns into a concrete plan with someone you like.',
    why: 'Strong relationships are the most consistent predictor of long-term wellbeing in the research — and they run on logistics, not sentiment.',
    attribution: ['Jordan Peterson'],
    days: [3],
    durationMin: 15,
    anchor: { kind: 'fixed', start: '12:45', windowMin: 30 },
    energy: 'midday',
    tier: 'could',
  },
];

export const protocolById = (id: string): Protocol | undefined =>
  PROTOCOLS.find((p) => p.id === id);

/** Protocols that serve a goal domain, most relevant first. */
export function protocolsForDomain(domain: GoalDomain): Protocol[] {
  return PROTOCOLS.filter((p) => p.goalDomains.includes(domain));
}

function startFor(p: Protocol, profile: LifeProfile | null): string {
  const a = p.anchor;
  if (a.kind === 'wake' && profile) {
    return toHHMM(toMinutes(profile.wakeTime) + (a.offsetMin ?? 0));
  }
  if (a.kind === 'sleep' && profile) {
    return toHHMM((toMinutes(profile.sleepTime) - (a.offsetMin ?? 0) + 1440) % 1440);
  }
  return a.start ?? '12:05';
}

/** A protocol as a schedulable routine, anchored to the user's real day. */
export function toRoutine(p: Protocol, profile: LifeProfile | null, goalId?: string): Routine {
  const start = startFor(p, profile);
  const days =
    profile?.capacity === 'minimal' && p.tier === 'could' && p.days.length > 2
      ? p.days.slice(0, 2)
      : [...p.days];
  return {
    id: newId('r'),
    title: p.title,
    area: p.area,
    goalId,
    protocolId: p.id,
    days,
    durationMin: p.durationMin,
    preferredStart: start,
    preferredEnd: toHHMM((toMinutes(start) + p.anchor.windowMin) % 1440),
    energy: p.energy,
    flexible: !p.duringWork,
    protected: false,
    duringWork: p.duringWork,
    sessionType: p.sessionType,
    tier: p.tier,
    active: true,
  };
}

/**
 * Compact grounding for the AI agents: the whole base in a few hundred
 * tokens, so suggestions the model writes stay anchored to the same
 * evidence-based library the deterministic engine plans from.
 */
export function knowledgeContext(): string {
  return PROTOCOLS.map(
    (p) => `- ${p.title} (${PILLAR_LABELS[p.pillar]}): ${p.summary} Why: ${p.why}`,
  ).join('\n');
}
