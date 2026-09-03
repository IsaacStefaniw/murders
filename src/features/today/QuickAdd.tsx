/**
 * Put something on a day, without leaving the day.
 *
 * "Can you add things in easily?" No — the plan was something the app
 * built and the person edited around the edges. Every route to a new block
 * went through a routine, a goal or a pathway, so the ordinary case (a
 * thing, on a day, at a time) had no door at all.
 *
 * Times come from the same picker a move uses, so an added block obeys the
 * same rules: nothing offered in a window that has already closed, nothing
 * past midnight, and what it displaces is named rather than done quietly.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Spacing } from '@/constants/theme';
import { candidateStartsFor } from '@/features/planner/moveWithBump';
import { formatTime, nowMinutes, todayKey, toHHMM, toMinutes } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { LifeArea, LifeProfile } from '@/types/domain';

interface QuickAddProps {
  date: string;
  profile: LifeProfile;
}

/**
 * The areas people actually add things to, in the order they reach for
 * them. Not the full LifeArea list: 'admin' and 'growth' exist for the
 * engine's benefit and asking someone to classify a coffee with a friend
 * as one of seven categories is a form, not an app.
 */
const AREAS: { value: LifeArea; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'work', label: 'Work' },
  { value: 'family', label: 'Family' },
  { value: 'relationship', label: 'Together' },
  { value: 'enjoyment', label: 'For me' },
];

const DURATIONS = [15, 30, 45, 60, 90];

export function QuickAdd({ date, profile }: QuickAddProps) {
  const addPlanItem = useAppStore((s) => s.addPlanItem);
  const plan = useAppStore((s) => s.plans[date]);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<LifeArea>('health');
  const [durationMin, setDuration] = useState(30);

  const reset = () => {
    setTitle('');
    setArea('health');
    setDuration(30);
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        title="Add something"
        variant="secondary"
        hint="A one-off block on this day. It does not become a routine."
        onPress={() => setOpen(true)}
        style={styles.opener}
      />
    );
  }

  // The picker needs an item to size the gaps against, and the thing being
  // added does not exist yet — so it is measured as a placeholder of the
  // chosen length that is not on the day.
  const probeStart = toHHMM(Math.max(toMinutes(profile.wakeTime), 0));
  const probePlan = {
    date,
    items: [
      ...(plan?.items ?? []),
      {
        id: '__probe__',
        date,
        start: probeStart,
        end: toHHMM(toMinutes(probeStart) + durationMin),
        title: '',
        area,
        tier: 'should' as const,
        status: 'planned' as const,
        fixed: false,
      },
    ],
  };
  const candidates = candidateStartsFor(probePlan, '__probe__', {
    wakeTime: profile.wakeTime,
    sleepTime: profile.sleepTime,
    notBefore: date === todayKey() ? nowMinutes() : undefined,
  });

  return (
    <View style={styles.column}>
      <Field
        label="What is it?"
        value={title}
        onChangeText={setTitle}
        placeholder="Coffee with Dan"
      />

      <AppText variant="caption" color="textTertiary">
        Part of…
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

      <AppText variant="caption" color="textTertiary">
        How long?
      </AppText>
      <View style={styles.chips}>
        {DURATIONS.map((d) => (
          <Chip
            key={d}
            label={d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}
            selected={durationMin === d}
            onPress={() => setDuration(d)}
          />
        ))}
      </View>

      {title.trim() ? (
        <>
          <AppText variant="caption" color="textTertiary">
            When?
          </AppText>
          <View style={styles.chips}>
            {candidates.length === 0 ? (
              <AppText variant="caption" color="textTertiary">
                No time left on this day that fits {durationMin} minutes. A shorter version
                might, or tomorrow will.
              </AppText>
            ) : (
              candidates.map((c) => (
                <Chip
                  key={c.start}
                  label={
                    c.bumps > 0
                      ? `${formatTime(c.start)} · moves ${c.bumps}`
                      : c.hitsFixed
                        ? `${formatTime(c.start)} · during work`
                        : formatTime(c.start)
                  }
                  hint={
                    c.bumps > 0
                      ? 'Takes this time and shifts what is there to the nearest free slot.'
                      : c.hitsFixed
                        ? 'Overlaps a fixed commitment. Yours to choose.'
                        : undefined
                  }
                  onPress={() => {
                    addPlanItem(date, {
                      title: title.trim(),
                      area,
                      start: c.start,
                      durationMin,
                    });
                    reset();
                  }}
                />
              ))
            )}
          </View>
        </>
      ) : null}

      <Button title="Cancel" variant="ghost" onPress={reset} />
    </View>
  );
}

const styles = StyleSheet.create({
  opener: { marginTop: Spacing.md },
  column: { gap: Spacing.sm, marginTop: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
