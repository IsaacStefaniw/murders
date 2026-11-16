import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/store';

/**
 * One line, with the minute on it.
 *
 * ── Why this exists ────────────────────────────────────────────────────
 *
 * Isaac, 10 Nov 2026: *"Sauna wasn't logged per time I mentioned. Neither
 * was my workout I don't believe? ... can you add a free text field time
 * stamped ... so I can chat and log things I've done."*
 *
 * He was right on both counts. The sauna and the fourteen-set session
 * went into markdown files in the repo, which is not his phone — the gap
 * `features/me/adopt.ts` has called `THE_LOG_GAP` since it was written.
 * This is the capture half of closing it.
 *
 * ── What it does NOT do yet, and why ───────────────────────────────────
 *
 * He asked for it to run through the Claude API. It does not, and the
 * honest reason is two-fold.
 *
 * First, there is no key: `isSupabaseConfigured()` is false, so
 * `getAiProvider()` returns null and no agent in this app reaches a model
 * today. Second, and more to the point, **he asked me this morning to
 * make sure his health data is stored privately**, and I spent that turn
 * closing the one path his journal text could leave by. Wiring his free
 * text to a model hours later, without him choosing it with the audit in
 * front of him, would undo that quietly.
 *
 * So: the capture lands first and it is useful on its own — a stamped
 * line is what `patterns.ts` and `sessionTiming.ts` can read and a
 * markdown file is not. Turning on the model is one flag
 * (`EXPO_PUBLIC_AI_JOURNAL`) plus a key, and it is his call to make with
 * `docs/PRIVACY.md` open, not mine to assume from a sentence.
 *
 * ── The time is editable, and that is the point ────────────────────────
 *
 * Nothing stamped the urge he reported on 10 Nov, so I recorded it at
 * ~16:20 from my own assumption and he corrected it to 15:21 — an hour
 * out, in the direction that had already been wrong three times.
 * `patterns.ts` reads the hour and nothing else, so an hour of drift
 * points the whole read at the wrong window. Typing it now stamps it;
 * typing it later lets him set it, and the entry records which happened.
 */
export default function NoteCapture() {
  const router = useRouter();
  const addNote = useAppStore((s) => s.addNote);
  const removeNote = useAppStore((s) => s.removeNote);
  const notes = useAppStore((s) => s.notes);

  const [text, setText] = useState('');
  /**
   * ── Days back, not minutes back ─────────────────────────────
   *
   * Isaac, 16 Nov 2026: *"It's very difficult to log activities past in
   * the app... I trained on Saturday lunch back routine."*
   *
   * The first version of this offered Just now, 30 minutes, 1, 2 and 4
   * hours. **Four hours was the whole range.** It was built to catch a
   * sauna he had finished an hour ago and it could not reach yesterday,
   * let alone Saturday — so the one thing he actually needed to log, two
   * days later, was the one thing it could not take.
   *
   * A screen for recording what happened that cannot reach last weekend
   * is a screen for recording what is happening, which is a different and
   * much less useful thing. Somebody at a bench does not stop to type.
   * They type on the sofa afterwards, or two days later when asked.
   *
   * So: a day, then a time of day. That is the granularity he thinks in —
   * he wrote *"Saturday lunch"*, not a timestamp — and `patterns.ts`
   * needs an hour it can read, which a named part of the day supplies
   * honestly while a typed clock time invites false precision about
   * something remembered.
   */
  const [daysBack, setDaysBack] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  /**
   * The clock, read on mount and refreshed on every touch.
   *
   * Reading `Date.now()` during render is impure and the lint rule is
   * right to stop it. Refreshing on interaction rather than on a timer is
   * also the correct behaviour here: the only moments the minute has to
   * be accurate are when he picks a "when" and when he saves, and a
   * ticking clock on this screen would re-render it every second for no
   * reader.
   */
  const [now, setNow] = useState(() => Date.now());

  /** The chosen moment: that day, at that hour, or now where neither moved. */
  const stampOf = (ms: number, days: number, h: number | null) => {
    const d = new Date(ms);
    d.setDate(d.getDate() - days);
    if (h !== null) d.setHours(h, days === 0 && h === new Date(ms).getHours() ? d.getMinutes() : 0, 0, 0);
    return d;
  };
  const stamp = stampOf(now, daysBack, hour);
  const untouched = daysBack === 0 && hour === null;

  const dayKeyOf = (ms: number) => new Date(ms).toDateString();
  const shown = notes
    .filter((n) => dayKeyOf(Date.parse(n.at)) === dayKeyOf(stamp.getTime()))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  /** Today, Yesterday, then weekday names back a week. */
  const dayOptions = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    return {
      value: i,
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString(undefined, { weekday: 'short' }),
    };
  });

  // Wrapped so the clock reads are unambiguously handlers rather than
  // render work. None of these runs outside a touch.
  const pickDay = useCallback((value: number) => {
    setNow(Date.now());
    setDaysBack(value);
  }, []);

  const pickHour = useCallback((value: number) => {
    setNow(Date.now());
    setHour((h) => (h === value ? null : value));
  }, []);

  const save = useCallback(() => {
    if (!text.trim()) return;
    const ms = Date.now();
    setNow(ms);
    const at = stampOf(ms, daysBack, hour);
    addNote(text, daysBack === 0 && hour === null ? undefined : at.toISOString());
    setText('');
    setDaysBack(0);
    setHour(null);
  }, [addNote, daysBack, hour, text]);

  const clock = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <Screen>
      <AppText variant="title">What happened?</AppText>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        One line, stamped. The sauna, the session, an urge, what you ate — whatever you
        would otherwise have told somebody later and then not.
      </AppText>

      <Field
        label="What happened?"
        showLabel={false}
        value={text}
        onChangeText={setText}
        placeholder="Sauna, 20 minutes"
        multiline
      />

      {/* Day first, then time of day — the order somebody remembers in.
          "Saturday lunch" is how he described it, so the controls take it
          in that shape rather than asking for a timestamp. */}
      <SectionHeader title="Which day" />
      <View style={styles.row}>
        {dayOptions.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={daysBack === o.value}
            onPress={() => pickDay(o.value)}
          />
        ))}
      </View>

      <SectionHeader title="Time of day" />
      <View style={styles.row}>
        {[
          { label: 'Morning', value: 8 },
          { label: 'Lunch', value: 12 },
          { label: 'Afternoon', value: 15 },
          { label: 'Evening', value: 19 },
          { label: 'Night', value: 22 },
        ].map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={hour === o.value}
            hint="An hour the pattern read can use. Tap the entry afterwards to set it exactly."
            onPress={() => pickHour(o.value)}
          />
        ))}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        {untouched
          ? `Stamping it now — ${clock(stamp)} today.`
          : `Stamping it ${stamp.toLocaleDateString(undefined, { weekday: 'long' })} at ${clock(stamp)}, set by hand.`}
      </AppText>

      <View style={styles.footer}>
        <Button title="Log it" onPress={save} disabled={!text.trim()} />
      </View>

      {/* A session has sets in it, and a line of prose does not. Offered
          only for a past day, because today's Train chip already goes
          here — and `/session/workout` has always accepted a date, with
          nothing in the app ever passing one. */}
      {daysBack > 0 ? (
        <View style={styles.footer}>
          <Button
            title={`Log sets for ${stamp.toLocaleDateString(undefined, { weekday: 'long' })}`}
            variant="secondary"
            onPress={() =>
              router.push(
                `/session/workout?date=${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}` as never,
              )
            }
          />
        </View>
      ) : null}

      {shown.length > 0 ? (
        <>
          <SectionHeader
            title={`${untouched ? 'Today' : stamp.toLocaleDateString(undefined, { weekday: 'long' })} — ${shown.length}`}
          />
          <View style={styles.stack}>
            {shown.map((n) => (
              <View key={n.id} style={styles.entry}>
                <AppText variant="label" color="accent">
                  {clock(new Date(n.at))}
                  {n.source === 'backdated' ? ' · set by hand' : ''}
                </AppText>
                <AppText variant="body" color="text">
                  {n.text}
                </AppText>
                <Chip label="Remove" onPress={() => removeNote(n.id)} />
              </View>
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.footer}>
        <Button title="Done" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  footer: { marginTop: Spacing.xl },
  stack: { gap: Spacing.lg, marginTop: Spacing.md },
  entry: { gap: Spacing.xs },
});
