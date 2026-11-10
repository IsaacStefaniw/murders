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
  /** Minutes to subtract from now. Zero is "just now". */
  const [minutesAgo, setMinutesAgo] = useState(0);
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

  const stamp = new Date(now - minutesAgo * 60000);
  const todayKeyOf = (ms: number) => new Date(ms).toDateString();
  const todays = notes
    .filter((n) => todayKeyOf(Date.parse(n.at)) === todayKeyOf(now))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  // Wrapped so the clock read is unambiguously a handler rather than
  // render work. Both of these only ever run on a touch.
  const pick = useCallback((value: number) => {
    setNow(Date.now());
    setMinutesAgo(value);
  }, []);

  const save = useCallback(() => {
    if (!text.trim()) return;
    const at = Date.now() - minutesAgo * 60000;
    setNow(Date.now());
    addNote(text, minutesAgo === 0 ? undefined : new Date(at).toISOString());
    setText('');
    setMinutesAgo(0);
  }, [addNote, minutesAgo, text]);

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

      {/* Offered before saving rather than as a correction afterwards,
          because the minute is the field most often wrong and it is
          cheapest to fix while the memory is still in the room. */}
      <SectionHeader title="When" />
      <View style={styles.row}>
        {[
          { label: 'Just now', value: 0 },
          { label: '30 min ago', value: 30 },
          { label: '1 hr ago', value: 60 },
          { label: '2 hrs ago', value: 120 },
          { label: '4 hrs ago', value: 240 },
        ].map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            selected={minutesAgo === o.value}
            onPress={() => pick(o.value)}
          />
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Stamping it {clock(stamp)}.
      </AppText>

      <View style={styles.footer}>
        <Button title="Log it" onPress={save} disabled={!text.trim()} />
      </View>

      {todays.length > 0 ? (
        <>
          <SectionHeader title={`Today — ${todays.length}`} />
          <View style={styles.stack}>
            {todays.map((n) => (
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
