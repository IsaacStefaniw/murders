import { BREATH_PROTOCOLS, protocolDurationSec } from '@/features/modalities/breath/protocols';
import { buildWorkout } from '@/features/modalities/gym/program';
import { sessionForItem } from '@/features/modalities/registry';
import type { Goal, PlanItem } from '@/types/domain';

function item(overrides: Partial<PlanItem>): PlanItem {
  return {
    id: 'i1',
    date: '2026-09-07',
    start: '12:05',
    end: '12:50',
    title: 'Strength workout',
    area: 'health',
    tier: 'should',
    status: 'planned',
    fixed: false,
    ...overrides,
  };
}

describe('breath protocols', () => {
  it('every protocol runs in one to two minutes', () => {
    for (const p of BREATH_PROTOCOLS) {
      const sec = protocolDurationSec(p);
      expect(sec).toBeGreaterThanOrEqual(50);
      expect(sec).toBeLessThanOrEqual(150);
    }
  });
});

describe('buildWorkout', () => {
  it('builds a full gym session that fits the available time', () => {
    const session = buildWorkout(45, 'gym')!;
    expect(session.exercises.length).toBeGreaterThanOrEqual(3);
    expect(session.estimatedMin).toBeLessThanOrEqual(45);
    expect(session.note).toBeUndefined();
  });

  it('shrinks intelligently when time is short — main work survives', () => {
    const session = buildWorkout(20, 'gym')!;
    expect(session.estimatedMin).toBeLessThanOrEqual(20);
    expect(session.note).toContain('Condensed');
    // Accessories cut before main lifts.
    expect(session.exercises.some((e) => e.name === 'Squat')).toBe(true);
    expect(session.exercises.every((e) => !e.accessory || session.estimatedMin <= 20)).toBe(true);
  });

  it('refuses sessions under 15 minutes', () => {
    expect(buildWorkout(10, 'gym')).toBeNull();
  });

  it('rotates main blocks across days', () => {
    const a = buildWorkout(60, 'gym', 0)!;
    const b = buildWorkout(60, 'gym', 1)!;
    expect(a.exercises[0].name).not.toBe(b.exercises[0].name);
  });
});

describe('sessionForItem', () => {
  it('resolves through the explicit sessionType first — titles are irrelevant', () => {
    const launch = sessionForItem(item({ title: 'Anything at all', sessionType: 'breathe' }));
    expect(launch!.route).toBe('/session/breathe');
  });

  it('routes business_review sessions to the goal-scoped review', () => {
    const launch = sessionForItem(
      item({ sessionType: 'business_review', goalId: 'g9', title: 'Growth block' }),
    );
    expect(launch!.route).toBe('/session/review/g9');
  });

  it('falls back to legacy title inference only for items without a sessionType', () => {
    expect(sessionForItem(item({}))!.route).toBe('/session/workout');
  });

  it('maps wind-down to breathwork', () => {
    expect(sessionForItem(item({ title: 'Wind down, screens away' }))!.route).toBe(
      '/session/breathe',
    );
  });

  it('maps business goal blocks to the weekly review', () => {
    const goal: Goal = {
      id: 'g1',
      title: 'Grow the business',
      area: 'work',
      domain: 'business',
      status: 'active',
      createdAt: '',
      routineIds: [],
    };
    const launch = sessionForItem(
      item({ title: 'Growth block: Grow the business', area: 'work', goalId: 'g1' }),
      [goal],
    );
    expect(launch!.route).toBe('/session/review/g1');
  });

  it('gives ordinary items no session', () => {
    expect(sessionForItem(item({ title: 'Family dinner', area: 'family' }))).toBeNull();
  });
});
