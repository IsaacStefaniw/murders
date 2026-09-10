import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { nextRitual, statedPurpose } from '@/features/cadence/rituals';
import { todayKey, weekStartOf } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * Two minutes on what a week or a month is for.
 *
 * The app could plan a week and could review one, and had no way for
 * somebody to say what the week was actually FOR. A generated week nobody
 * chose is a week nobody defends, and the first thing to go on a bad
 * Tuesday is the block whose purpose was the app's rather than theirs.
 *
 * The day is deliberately absent: `check-in/morning` already owns it.
 *
 * One at a time, never more. At the turn of a month four things are due at
 * once and showing four cards is how none of them get answered; the most
 * significant is offered and the rest wait until it is done or passed on.
 *
 * Passing on is a first-class answer with its own button. A ritual declined
 * does not come back for that period — this is optional in the sense that
 * the app actually behaves as though it is optional, rather than in the
 * sense of a nag with a dismiss.
 */
export function RitualCard() {
  const goals = useAppStore((s) => s.goals);
  const rituals = useAppStore((s) => s.rituals);
  const answerRitual = useAppStore((s) => s.answerRitual);
  const skipRitual = useAppStore((s) => s.skipRitual);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const today = todayKey();
  const goalTitles = useMemo(
    () => goals.filter((g) => g.status === 'active').map((g) => g.title),
    [goals],
  );
  const ritual = nextRitual(today, rituals, goalTitles);

  // What they said this week and today were for, whether or not anything is
  // due — an intention nobody repeats back is one you have forgotten by
  // Wednesday, which is the entire reason for writing it down.
  const weekFor = statedPurpose('week-setup', weekStartOf(today), rituals);
  const monthFor = statedPurpose('month-setup', today.slice(0, 7), rituals);

  if (!ritual) {
    if (!weekFor && !monthFor) return null;
    return (
      <Card>
        <AppText variant="label" color="accent">
          What this is for
        </AppText>
        {weekFor ? (
          <AppText variant="heading" style={styles.gap}>
            This week: {weekFor}
          </AppText>
        ) : null}
        {monthFor ? (
          <AppText variant="secondary" style={styles.gap}>
            This month: {monthFor}
          </AppText>
        ) : null}
      </Card>
    );
  }

  const done = () => {
    answerRitual(ritual.kind, ritual.periodKey, draft);
    setDraft({});
    setOpen(false);
  };

  return (
    <Card>
      <AppText variant="label" color="accent">
        {ritual.periodLabel} · {ritual.minutes} min
      </AppText>
      <AppText variant="heading" style={styles.gap}>
        {ritual.title}
      </AppText>
      <AppText variant="secondary" style={styles.gap}>
        {ritual.why}
      </AppText>

      {open ? (
        <View style={styles.form}>
          {ritual.questions.map((q) =>
            q.goalPick ? (
              <View key={q.key}>
                <AppText variant="caption" color="textTertiary">
                  {q.prompt}
                </AppText>
                <View style={styles.chips}>
                  {goalTitles.map((title) => (
                    <Chip
                      key={title}
                      label={title}
                      selected={draft[q.key] === title}
                      onPress={() =>
                        setDraft((d) => ({ ...d, [q.key]: d[q.key] === title ? '' : title }))
                      }
                    />
                  ))}
                </View>
              </View>
            ) : (
              <Field
                key={q.key}
                label={q.prompt}
                hint={q.hint}
                value={draft[q.key] ?? ''}
                onChangeText={(v) => setDraft((d) => ({ ...d, [q.key]: v }))}
                multiline
              />
            ),
          )}
          <Button title="Done" onPress={done} />
          <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
        </View>
      ) : (
        <View style={styles.row}>
          <Button title="Start" onPress={() => setOpen(true)} />
          {/* Not "later". Later is a nag with a delay, and this is optional. */}
          <Button
            title="Not this time"
            variant="ghost"
            onPress={() => skipRitual(ritual.kind, ritual.periodKey)}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.sm },
  form: { gap: Spacing.sm, marginTop: Spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
});
