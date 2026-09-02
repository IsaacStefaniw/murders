import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { useAppStore } from '@/state/store';
import type { LifeArea } from '@/types/domain';

/**
 * "I did this" — for the thing that happened without being asked.
 *
 * Everything a day could contain used to be something IntentNorth had
 * scheduled, which quietly made it a scoreboard for its own suggestions.
 * Someone who went for a run the app did not think of got no credit for
 * it, the day read emptier than it was, and next week was then planned
 * from that fiction. Over a month that is how an app becomes something
 * you are failing rather than something you use.
 *
 * The design constraint is that this has to be FASTER than lying. Two taps
 * for anything already in your routines, and one short sentence for
 * anything else. If logging what you did costs more than shrugging, people
 * shrug.
 */

const AREAS: { value: LifeArea; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'work', label: 'Work' },
  { value: 'family', label: 'Family' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'growth', label: 'Growth' },
  { value: 'enjoyment', label: 'Enjoyment' },
  { value: 'admin', label: 'Admin' },
];

/** Rough durations. Nobody remembers, and a stopwatch is not the point. */
const DURATIONS = [15, 30, 45, 60, 90];

export function LogDidIt({ date }: { date: string }) {
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<LifeArea>('health');
  const [durationMin, setDurationMin] = useState(30);
  const [saved, setSaved] = useState<string | null>(null);

  /**
   * Your own routines first, minus anything already on today's plan —
   * offering "Morning walk" when it is sitting completed above would be
   * an invitation to double-count it.
   */
  const shortcuts = useMemo(() => {
    const onPlan = new Set((plans[date]?.items ?? []).map((i) => i.title));
    return routines.filter((r) => r.active && !onPlan.has(r.title)).slice(0, 6);
  }, [routines, plans, date]);

  const commit = (
    itemTitle: string,
    itemArea: LifeArea,
    minutes: number,
    routineId?: string,
    goalId?: string,
    sessionType?: Parameters<typeof logCompletedActivity>[0]['sessionType'],
  ) => {
    logCompletedActivity({
      date,
      title: itemTitle,
      area: itemArea,
      durationMin: minutes,
      routineId,
      goalId,
      sessionType,
      note: 'logged after the fact',
    });
    setSaved(itemTitle);
    setTitle('');
    setOpen(false);
  };

  if (!open) {
    return (
      <View>
        {saved ? (
          <AppText variant="caption" color="success" style={styles.saved}>
            {saved} — added to today. It counts the same as a planned one.
          </AppText>
        ) : null}
        <Button
          title="I did something else"
          variant="secondary"
          hint="Add something that happened today but was not in the plan."
          onPress={() => setOpen(true)}
        />
      </View>
    );
  }

  return (
    <Card>
      <AppText variant="heading">What did you do?</AppText>

      {shortcuts.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="caption" color="textTertiary">
            One tap — these are already yours.
          </AppText>
          <View style={styles.chips}>
            {shortcuts.map((r) => (
              <Chip
                key={r.id}
                label={r.title}
                hint={`Logs ${r.durationMin} minutes of ${r.title}.`}
                onPress={() => commit(r.title, r.area, r.durationMin, r.id, r.goalId, r.sessionType)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Field
          label="What you did"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Walked the dog"
          returnKeyType="done"
        />
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          Which part of life?
        </AppText>
        <View style={styles.chips}>
          {AREAS.map((a) => (
            <Chip
              key={a.value}
              label={a.label}
              selected={area === a.value}
              onPress={() => setArea(a.value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          Roughly how long?
        </AppText>
        <View style={styles.chips}>
          {DURATIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} min`}
              selected={durationMin === d}
              onPress={() => setDurationMin(d)}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Add it"
          disabled={title.trim().length < 2}
          onPress={() => commit(title.trim(), area, durationMin)}
        />
        <Button title="Cancel" variant="ghost" onPress={() => { setTitle(''); setOpen(false); }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.lg, gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { marginTop: Spacing.xl, gap: Spacing.sm },
  saved: { marginBottom: Spacing.sm },
});
