/**
 * Who gets shown what.
 *
 * The field report: a man opened the library and found pelvic floor
 * training, having never been asked anything that would make that make
 * sense. Labelling the section was the first attempt and it was not
 * enough — the practices were still in front of him, and content that
 * obviously does not apply is a reason to doubt everything beside it.
 */

import {
  PROTOCOLS,
  audiencesFor,
  listedProtocols,
  optInAudiencesFor,
} from '@/features/knowledge/protocols';

const anatomySpecific = PROTOCOLS.filter((p) => p.appliesTo);

describe('anatomy-specific practices reach only the people they are for', () => {
  it('has some to gate in the first place', () => {
    expect(anatomySpecific.length).toBeGreaterThan(0);
  });

  it('shows a man none of it, anywhere', () => {
    expect(audiencesFor('male')).toEqual([]);
    expect(optInAudiencesFor('male')).toEqual([]);
    expect(listedProtocols('male').filter((p) => p.appliesTo)).toEqual([]);
  });

  it('shows nobody any of it before the question has been asked', () => {
    expect(audiencesFor(undefined)).toEqual([]);
    expect(optInAudiencesFor(undefined)).toEqual([]);
    expect(listedProtocols(undefined).filter((p) => p.appliesTo)).toEqual([]);
  });

  it('puts female-anatomy practices in the ordinary lists for a woman', () => {
    const listed = listedProtocols('female');
    expect(listed.some((p) => p.id === 'pelvic-floor-training')).toBe(true);
    // Life stages stay opt-in even then — most women are in neither.
    expect(optInAudiencesFor('female')).toEqual(['pregnancy', 'menopause']);
  });

  it('leaves the choice open to someone who declined to say', () => {
    // Asked and answered is not the same as never asked: they get the
    // opt-ins, because withholding the answer should not withhold the
    // practices from someone who came looking for them.
    expect(optInAudiencesFor('preferNotToSay')).toEqual([
      'femaleAnatomy',
      'pregnancy',
      'menopause',
    ]);
    expect(listedProtocols('preferNotToSay').filter((p) => p.appliesTo)).toEqual([]);
  });
});
