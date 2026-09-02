import {
  pickVoice,
  voiceShortlist as pickShortlist,
  VOICE_SAMPLE as SAMPLE,
  type VoiceOption,
} from '@/features/mind/voice';

const v = (identifier: string, name: string, language: string, gender?: string): VoiceOption => ({
  identifier, name, language, gender,
});

describe('picking a voice for spoken guidance', () => {
  it('prefers a male voice in the exact locale', () => {
    const voices = [
      v('f-au', 'Karen', 'en-AU', 'female'),
      v('m-au', 'Lee', 'en-AU', 'male'),
      v('m-us', 'Alex', 'en-US', 'male'),
    ];
    expect(pickVoice(voices, 'en-AU')).toBe('m-au');
  });

  it('falls back to the same language before giving up on gender', () => {
    const voices = [v('f-au', 'Karen', 'en-AU', 'female'), v('m-gb', 'Daniel', 'en-GB', 'male')];
    expect(pickVoice(voices, 'en-AU')).toBe('m-gb');
  });

  it('reads gender from the name when the platform omits the field', () => {
    // iOS does not report gender for every installed voice.
    const voices = [v('a', 'Karen', 'en-AU'), v('b', 'Daniel', 'en-AU')];
    expect(pickVoice(voices, 'en-AU')).toBe('b');
  });

  it('puts being understood above the voice being male', () => {
    // A male English voice reading to a French phone is worse than a French
    // voice of any gender.
    const voices = [v('m-en', 'Alex', 'en-US', 'male'), v('f-fr', 'Amelie', 'fr-FR', 'female')];
    expect(pickVoice(voices, 'fr-FR')).toBe('f-fr');
  });

  it('returns null rather than guessing when nothing matches', () => {
    expect(pickVoice([], 'en-AU')).toBeNull();
  });
});

describe('the shortlist a person actually chooses from', () => {
  const many = [
    v('a', 'Karen', 'en-AU', 'female'),
    v('b', 'Lee', 'en-AU', 'male'),
    v('c', 'Lee', 'en-AU', 'male'), // same voice, second quality tier
    v('d', 'Daniel', 'en-GB', 'male'),
    v('e', 'Amelie', 'fr-FR', 'female'),
    v('f', 'Moira', 'en-IE', 'female'),
    v('g', 'Rishi', 'en-IN', 'male'),
    v('h', 'Samantha', 'en-US', 'female'),
  ];

  it('drops voices that cannot read this session', () => {
    // A French voice reading English guidance is not a choice, it is a bug.
    const list = pickShortlist(many, 'en-AU');
    expect(list.map((x) => x.identifier)).not.toContain('e');
  });

  it('does not offer the same voice twice', () => {
    // Installed at two quality tiers is one decision, not two.
    const names = pickShortlist(many, 'en-AU').map((x) => x.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('puts the local voices first', () => {
    expect(pickShortlist(many, 'en-AU')[0].language).toBe('en-AU');
  });

  it('stays short enough to audition', () => {
    // Eighty voices is a chore, not a choice.
    expect(pickShortlist(many, 'en-AU').length).toBeLessThanOrEqual(6);
  });

  it('gives a sample worth judging a voice on', () => {
    // "Hello" tells you nothing about how a voice reads guidance.
    expect(SAMPLE.split(' ').length).toBeGreaterThan(6);
    expect(SAMPLE).toMatch(/breath|settle/i);
  });
});
