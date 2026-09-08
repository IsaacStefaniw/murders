import { PEOPLE_PROTOCOLS } from '@/features/knowledge/protocols.people';
import { PROTOCOLS, protocolById, sourceLine, toRoutine } from '@/features/knowledge/protocols';
import { MODALITIES } from '@/features/modalities/registry';
import { VIOLENCE_ROUTE } from '@/features/knowledge/safetyLines';
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

  it('claim no A, say why in plain words, and say where each came from', () => {
    for (const p of PEOPLE_PROTOCOLS) {
      expect(p.pillar).toBe('connection');
      expect(p.evidenceLevel).not.toBe('A');
      expect(p.why.length).toBeGreaterThan(80);
      // Two cards here have an empty attribution on purpose. Jordan
      // Peterson was the only name on six connection cards, which the
      // roster forbids, and for `teen-side-by-side` and
      // `carer-ask-for-cover` the verification round found no honest
      // replacement — one carer episode exists in an 836-episode corpus
      // and it is journalism. Empty is the accurate answer there, and
      // sourceLine() says so in words on the card.
      expect(sourceLine(p).trim().length).toBeGreaterThan(0);
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

  it('the written reappraisal is a journal session above the modality floor, and routes past the app', () => {
    const p = protocolById('conflict-reappraisal-write')!;
    expect(p.sessionType).toBe('journal');
    expect(p.durationMin).toBeGreaterThanOrEqual(MODALITIES.journal.shorteningFloorMin ?? 1);
    // It used to be enough that the word "abuse" appeared. It is not: a
    // person being controlled often would not use that word about their
    // own situation, which is exactly why the shared carve-out describes
    // the behaviour — afraid of the person, being controlled, money or
    // contact used against you — and names a number instead.
    expect(p.safety).toContain(VIOLENCE_ROUTE);
    expect(p.safety).toContain('1800 737 732');
  });

  it('never uses clinical language or names a service', () => {
    const text = JSON.stringify(PEOPLE_PROTOCOLS).toLowerCase();
    for (const banned of ['therapy', 'therapist', 'diagnos', 'prescrib', 'cure', 'respite', 'psychoeducation', 'lifeline', 'beyond blue']) {
      expect(text).not.toContain(banned);
    }
  });
});
