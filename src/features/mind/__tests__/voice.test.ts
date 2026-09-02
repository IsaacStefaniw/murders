import { pickVoice, type VoiceOption } from '@/features/mind/voice';

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
