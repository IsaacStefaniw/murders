import {
  knowledgeContext,
  PROTOCOLS,
  protocolById,
  protocolsForDomain,
  toRoutine,
} from '@/features/knowledge/protocols';
import { MODALITIES } from '@/features/modalities/registry';
import { toMinutes } from '@/lib/dates';
import type { LifeProfile } from '@/types/domain';

const profile: LifeProfile = {
  firstName: 'Sam',
  priorities: ['health', 'work', 'family'],
  people: [],
  workDays: [1, 2, 3, 4, 5],
  workStart: '09:00',
  workEnd: '17:30',
  wakeTime: '06:30',
  sleepTime: '22:30',
  energyProfile: 'morning',
  capacity: 'steady',
  trainingDaysPerWeek: 3,
  trainingDurationMin: 45,
  trainingPreference: 'gym',
  moreOf: [],
  lessOf: [],
  createdAt: '',
  updatedAt: '',
};

describe('knowledge base integrity', () => {
  it('every protocol is complete: unique id, summary, why, attribution', () => {
    const ids = new Set(PROTOCOLS.map((p) => p.id));
    expect(ids.size).toBe(PROTOCOLS.length);
    for (const p of PROTOCOLS) {
      expect(p.summary.length).toBeGreaterThan(10);
      expect(p.why.length).toBeGreaterThan(30);
      expect(p.attribution.length).toBeGreaterThan(0);
      expect(p.days.length).toBeGreaterThan(0);
      expect(p.durationMin).toBeGreaterThanOrEqual(5);
    }
  });

  it('health-adjacent protocols carry a plain-words safety note', () => {
    for (const p of PROTOCOLS.filter((x) =>
      ['training', 'longevity'].includes(x.pillar),
    )) {
      if (p.id === 'post-meal-walk') continue; // walking needs no caution
      expect(p.safety).toBeTruthy();
    }
  });

  /**
   * Money content is education, never financial advice, and the line is
   * easiest to cross by omission. Anything touching debt, investing or a
   * position number must name a licensed professional as the next step.
   */
  it('money protocols that touch advice territory route to a professional', () => {
    const adviceAdjacent = ['payday-automation', 'raise-precommit', 'debt-order-review', 'net-worth-check'];
    for (const id of adviceAdjacent) {
      const p = PROTOCOLS.find((x) => x.id === id);
      expect(p).toBeDefined();
      expect(p!.safety).toBeTruthy();
      expect(p!.safety!.toLowerCase()).toMatch(/adviser|professional|accountant|charity/);
    }
  });

  /** No protocol may name a product, platform, ticker or return figure. */
  it('never names a financial product or promises a return', () => {
    const text = JSON.stringify(PROTOCOLS.filter((p) => p.pillar === 'wealth')).toLowerCase();
    for (const banned of ['etf', 'index fund', 's&p', 'bitcoin', 'crypto', '% return', 'guaranteed']) {
      expect(text).not.toContain(banned);
    }
  });

  /**
   * Grades must stay spread. Relationship, family and leadership research is
   * mostly observational; a library where everything is A/B would mean the
   * grading had stopped meaning anything.
   */
  it('keeps evidence grading honest across the library', () => {
    const grades = new Set(PROTOCOLS.map((p) => p.evidenceLevel));
    expect(grades.size).toBeGreaterThanOrEqual(4);
    const strong = PROTOCOLS.filter((p) => p.evidenceLevel === 'A' || p.evidenceLevel === 'B');
    expect(strong.length).toBeLessThan(PROTOCOLS.length / 2);
    // Connection protocols rest on observational work — none should claim A.
    for (const p of PROTOCOLS.filter((x) => x.pillar === 'connection')) {
      expect(p.evidenceLevel).not.toBe('A');
    }
  });

  it('session-linked protocols respect their modality contract', () => {
    for (const p of PROTOCOLS.filter((x) => x.sessionType)) {
      const modality = MODALITIES[p.sessionType!];
      expect(modality).toBeDefined();
      expect(p.durationMin).toBeGreaterThanOrEqual(modality.shorteningFloorMin ?? 1);
    }
  });

  it('never claims cures or prescribes substances', () => {
    const text = JSON.stringify(PROTOCOLS).toLowerCase();
    for (const banned of ['cure', 'treats ', 'prescrib', 'dose', 'supplement stack']) {
      expect(text).not.toContain(banned);
    }
  });
});

describe('toRoutine', () => {
  it('anchors wake/sleep protocols to the real day', () => {
    const light = toRoutine(protocolById('morning-light')!, profile);
    expect(light.preferredStart).toBe('06:50'); // wake 06:30 + 20
    expect(light.protocolId).toBe('morning-light');
    const windDown = toRoutine(protocolById('wind-down')!, profile);
    expect(windDown.preferredStart).toBe('21:55'); // sleep 22:30 − 35
  });

  it('produces a schedulable, valid routine', () => {
    for (const p of PROTOCOLS) {
      const r = toRoutine(p, profile);
      expect(toMinutes(r.preferredEnd)).not.toBe(toMinutes(r.preferredStart));
      expect(r.active).toBe(true);
      expect(r.days.length).toBeGreaterThan(0);
    }
  });

  it('minimal capacity trims nice-to-have cadence', () => {
    const tired = { ...profile, capacity: 'minimal' as const };
    const walk = toRoutine(protocolById('post-meal-walk')!, tired);
    expect(walk.days.length).toBeLessThanOrEqual(2);
  });
});

describe('domain pathways', () => {
  it('each core goal domain has at least one protocol behind it', () => {
    for (const domain of [
      'fitness',
      'health',
      'business',
      'finance',
      'friends',
      // Filled by the pathway research round — these were empty before.
      'relationship',
      'family',
      'experience',
    ] as const) {
      expect(protocolsForDomain(domain).length).toBeGreaterThan(0);
    }
  });

  it('knowledge context stays compact enough for a system prompt', () => {
    const ctx = knowledgeContext();
    expect(ctx).toContain('Zone 2');
    // ~2k tokens ceiling — small enough to ride along in every agent call.
    expect(ctx.length).toBeLessThan(9000);
  });
});
