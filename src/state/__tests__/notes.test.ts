/**
 * Timestamped free text — the capture that was missing.
 *
 * Isaac, 10 Nov 2026: "Sauna wasn't logged per time I mentioned. Neither
 * was my workout I don't believe?" Both true: they went into markdown in
 * the repo, which is not his phone.
 */

import { useAppStore } from '@/state/store';

const s = () => useAppStore.getState();

beforeEach(() => {
  useAppStore.setState({ notes: [] });
});

describe('what the capture keeps', () => {
  it('stamps the minute, which is the whole reason it exists', () => {
    s().addNote('Sauna, 20 minutes');
    const [n] = s().notes;
    expect(n.text).toBe('Sauna, 20 minutes');
    expect(Number.isFinite(Date.parse(n.at))).toBe(true);
    expect(n.source).toBe('typed');
  });

  it('marks a remembered time as backdated rather than passing it off as stamped', () => {
    // patterns.ts reads the hour and nothing else, and the urge on 10 Nov
    // was logged an hour out. A remembered minute is weaker evidence than
    // a stamped one and the record should say which it is.
    const anHourAgo = new Date(Date.now() - 3600_000).toISOString();
    s().addNote('Finished the session', anHourAgo);
    expect(s().notes[0].source).toBe('backdated');
    expect(s().notes[0].at).toBe(anHourAgo);
  });

  it('does not call it backdated when the given time is this minute', () => {
    s().addNote('Just now', new Date().toISOString());
    expect(s().notes[0].source).toBe('typed');
  });

  it('refuses an empty line instead of storing a blank entry', () => {
    s().addNote('   ');
    s().addNote('');
    expect(s().notes).toHaveLength(0);
  });

  it('trims, so a stray newline is not part of the record', () => {
    s().addNote('  Vaped, two small  \n');
    expect(s().notes[0].text).toBe('Vaped, two small');
  });
});

describe('correcting one', () => {
  it('edits the text without touching the stamp', () => {
    s().addNote('Suana');
    const { id, at } = s().notes[0];
    s().editNote(id, { text: 'Sauna, 20 minutes' });
    expect(s().notes[0].text).toBe('Sauna, 20 minutes');
    expect(s().notes[0].at).toBe(at);
    expect(s().notes[0].source).toBe('typed');
  });

  it('marks it backdated once the time is corrected by hand', () => {
    s().addNote('Urge at the desk');
    const { id } = s().notes[0];
    s().editNote(id, { at: '2026-11-10T05:21:00.000Z' });
    expect(s().notes[0].at).toBe('2026-11-10T05:21:00.000Z');
    expect(s().notes[0].source).toBe('backdated');
  });

  it('removes one without disturbing the others', () => {
    s().addNote('one');
    s().addNote('two');
    s().removeNote(s().notes[0].id);
    expect(s().notes.map((n) => n.text)).toEqual(['two']);
  });
});

describe('reaching back past days, which is the whole point', () => {
  it('takes a timestamp two days old without complaint', () => {
    // Isaac, 16 Nov: "It's very difficult to log activities past in the
    // app... I trained on Saturday lunch back routine." The first
    // when-picker offered Just now through 4 hours ago, so the one thing
    // he needed to record was the one thing it could not take.
    const saturdayLunch = '2026-11-14T12:00:00.000Z';
    s().addNote('Back routine — lat pulldown 80x15x4', saturdayLunch);
    expect(s().notes[0].at).toBe(saturdayLunch);
    expect(s().notes[0].source).toBe('backdated');
  });

  it('keeps each past day separate rather than collapsing them onto today', () => {
    for (const [day, text] of [
      ['2026-11-14T12:00:00.000Z', 'Saturday, back'],
      ['2026-11-11T02:05:00.000Z', 'Wednesday, squat and deadlift'],
      ['2026-11-09T09:15:00.000Z', 'Monday, futsal'],
    ] as const) {
      s().addNote(text, day);
    }
    const days = s().notes.map((n) => n.at.slice(0, 10));
    expect(new Set(days).size).toBe(3);
    expect(days).toContain('2026-11-14');
  });

  it('still refuses to call a hand-set past time a stamped one', () => {
    // patterns.ts reads the hour and nothing else, so a remembered hour
    // has to be distinguishable from one the clock supplied.
    s().addNote('Saturday lunch', '2026-11-14T12:00:00.000Z');
    expect(s().notes[0].source).toBe('backdated');
  });
});

describe('several a day, which a Reflection cannot hold', () => {
  it('keeps every entry rather than one per date', () => {
    // The reason this is not a Reflection: that is keyed by date and holds
    // one evening. A day has a sauna, a session, a meal and an urge in it.
    for (const t of ['Bench 120x3', 'Sauna', 'Urge at the desk', 'Lasagne']) s().addNote(t);
    expect(s().notes).toHaveLength(4);
    const times = s().notes.map((n) => Date.parse(n.at));
    expect(times.every((t) => Number.isFinite(t))).toBe(true);
  });
});
