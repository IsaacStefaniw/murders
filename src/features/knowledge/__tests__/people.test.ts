import { PEOPLE_PROTOCOLS } from '@/features/knowledge/protocols.people';
import { PROTOCOLS, protocolById, toRoutine } from '@/features/knowledge/protocols';
import { MODALITIES } from '@/features/modalities/registry';
import type { LifeProfile } from '@/types/domain';

const profile = {
  wakeTime: '06:30',
  sleepTime: '22:30',
  capacity: 'steady',
  people: [],
} as unknown as LifeProfile;

describe('the people practices', () => {
  it('are in the library, once each, and every one builds a routine', () => {
    for (const p of PEOPLE_PROTOCOLS) {
      expect(PROTOCOLS.filter((x) => x.id === p.id)).toHaveLength(1);
      expect(protocolById(p.id)).toBe(p);
      const r = toRoutine(p, profile);
      expect(r.days.length).toBeGreaterThan(0);
      expect(r.durationMin).toBe(p.durationMin);
    }
  });

  it('claim no A, say why in plain words, and credit someone', () => {
    for (const p of PEOPLE_PROTOCOLS) {
      expect(p.pillar).toBe('connection');
      expect(p.evidenceLevel).not.toBe('A');
      expect(p.why.length).toBeGreaterThan(80);
      expect(p.attribution.length).toBeGreaterThan(0);
    }
  });

  it('the carer practices never nag and point past tired to a GP', () => {
    for (const id of ['carer-own-hours', 'carer-ask-for-cover', 'carer-ten-minutes']) {
      const p = protocolById(id)!;
      expect(p.neverNag).toBe(true);
      expect(p.safety).toBeTruthy();
    }
    expect(protocolById('carer-own-hours')!.safety).toMatch(/GP/);
  });

  it('the teenage practices name the line where a longer drive is the wrong answer', () => {
    expect(protocolById('teen-side-by-side')!.safety).toMatch(/GP|school/);
    expect(protocolById('teen-their-call')!.safety).toMatch(/safety calls stay yours/i);
  });

  it('the written reappraisal is a journal session above the modality floor and out of scope for abuse', () => {
    const p = protocolById('conflict-reappraisal-write')!;
    expect(p.sessionType).toBe('journal');
    expect(p.durationMin).toBeGreaterThanOrEqual(MODALITIES.journal.shorteningFloorMin ?? 1);
    expect(p.safety).toMatch(/abuse/);
  });

  it('never uses clinical language or names a service', () => {
    const text = JSON.stringify(PEOPLE_PROTOCOLS).toLowerCase();
    for (const banned of ['therapy', 'therapist', 'diagnos', 'prescrib', 'cure', 'respite', 'psychoeducation', 'lifeline', 'beyond blue']) {
      expect(text).not.toContain(banned);
    }
  });
});
