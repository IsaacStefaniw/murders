/**
 * Editing routines — the when of the plan.
 *
 * The scheduler is good at placing things and had no way to be told it was
 * wrong. A routine's days, time and length were set at creation and only
 * the adaptation engine could move them, which meant the one person who
 * definitely knows that Tuesday does not work could not say so.
 *
 * Changes regenerate the whole visible week rather than today alone: Today
 * caches seven days ahead, and regenerating one day left a Mon/Wed/Fri
 * routine looking unsaved all week — the same defect that made added goals
 * appear not to save.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { protocolById } from '@/features/knowledge/protocols';
import { formatTime, toHHMM, toMinutes } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { Weekday } from '@/types/domain';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

export default function EditRoutines() {
  const router = useRouter();
  const routines = useAppStore((s) => s.routines);
  const updateRoutine = useAppStore((s) => s.updateRoutine);
  const [openId, setOpenId] = useState<string | null>(null);

  const active = routines.filter((r) => r.active);
  const paused = routines.filter((r) => !r.active);

  if (routines.length === 0) {
    return (
      <Screen>
        <AppText variant="title">Nothing scheduled yet</AppText>
        <EmptyState
          title="No routines"
          message="Start a path or add a goal, and the routines behind it show up here to adjust."
          actionTitle="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const shift = (id: string, currentStart: string, currentEnd: string, deltaMin: number) => {
    const start = toMinutes(currentStart) + deltaMin;
    const end = toMinutes(currentEnd) + deltaMin;
    // Wrapping past midnight would silently move a morning routine to the
    // previous night, so the ends of the day are walls rather than seams.
    if (start < 0 || end > 24 * 60 - 1) return;
    updateRoutine(id, { preferredStart: toHHMM(start), preferredEnd: toHHMM(end) });
  };

  const renderRoutine = (id: string) => {
    const routine = routines.find((r) => r.id === id)!;
    const open = openId === routine.id;
    const protocol = routine.protocolId ? protocolById(routine.protocolId) : undefined;

    return (
      <Card key={routine.id}>
        <View style={styles.head}>
          <View style={styles.grow}>
            <AppText variant="heading">{routine.title}</AppText>
            <AppText variant="caption" color="textTertiary">
              {routine.days.length === 7
                ? 'Every day'
                : routine.days.map((d) => DAY_LETTERS[d]).join(' ')}
              {' · '}
              {formatTime(routine.preferredStart)} · {routine.durationMin} min
              {routine.duringWork ? ' · inside work hours' : ''}
            </AppText>
          </View>
          <Chip
            label={open ? 'Close' : 'Adjust'}
            selected={open}
            onPress={() => setOpenId(open ? null : routine.id)}
          />
        </View>

        {open ? (
          <View style={styles.editor}>
            {protocol ? (
              <AppText variant="caption" color="textTertiary">
                {protocol.summary}
              </AppText>
            ) : null}

            <AppText variant="caption" color="textTertiary" style={styles.label}>
              Days
            </AppText>
            <View style={styles.chips}>
              {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((d) => (
                <Chip
                  key={d}
                  label={DAY_LETTERS[d]}
                  selected={routine.days.includes(d)}
                  onPress={() => {
                    const days = routine.days.includes(d)
                      ? routine.days.filter((x) => x !== d)
                      : [...routine.days, d].sort((a, b) => a - b);
                    // A routine on no days is a routine that has been turned
                    // off, and saying so is clearer than an empty week.
                    if (days.length === 0) updateRoutine(routine.id, { active: false });
                    else updateRoutine(routine.id, { days });
                  }}
                />
              ))}
            </View>

            <AppText variant="caption" color="textTertiary" style={styles.label}>
              Time — {formatTime(routine.preferredStart)} to{' '}
              {formatTime(routine.preferredEnd)}
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="− 30 min"
                onPress={() => shift(routine.id, routine.preferredStart, routine.preferredEnd, -30)}
              />
              <Chip
                label="− 15"
                onPress={() => shift(routine.id, routine.preferredStart, routine.preferredEnd, -15)}
              />
              <Chip
                label="+ 15"
                onPress={() => shift(routine.id, routine.preferredStart, routine.preferredEnd, 15)}
              />
              <Chip
                label="+ 30 min"
                onPress={() => shift(routine.id, routine.preferredStart, routine.preferredEnd, 30)}
              />
            </View>
            <AppText variant="caption" color="textTertiary" style={styles.hint}>
              {routine.flexible
                ? 'The window is a preference — the scheduler may move it to fit the day.'
                : 'This one is a deadline: it can be brought earlier, never pushed later.'}
            </AppText>

            <AppText variant="caption" color="textTertiary" style={styles.label}>
              Length
            </AppText>
            <View style={styles.chips}>
              {DURATIONS.map((min) => (
                <Chip
                  key={min}
                  label={`${min}`}
                  selected={routine.durationMin === min}
                  onPress={() => updateRoutine(routine.id, { durationMin: min })}
                />
              ))}
            </View>

            <View style={styles.chips}>
              <Chip
                label={routine.protected ? 'Protected' : 'Protect this'}
                selected={routine.protected}
                onPress={() => updateRoutine(routine.id, { protected: !routine.protected })}
              />
              <Chip
                label="Turn off"
                onPress={() => {
                  updateRoutine(routine.id, { active: false });
                  setOpenId(null);
                }}
              />
            </View>
            <AppText variant="caption" color="textTertiary" style={styles.hint}>
              Protected means nothing displaces it — the family dinner, the wind-down.
            </AppText>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <Screen>
      <AppText variant="label" color="accent">
        Plan
      </AppText>
      <AppText variant="title">When things happen</AppText>
      <AppText variant="secondary" style={styles.sub}>
        You know your week better than the scheduler does. Everything here takes effect across the
        whole visible week, not just today.
      </AppText>

      <SectionHeader title="Running" />
      <View style={styles.stack}>{active.map((r) => renderRoutine(r.id))}</View>

      {paused.length > 0 ? (
        <>
          <SectionHeader title="Turned off" />
          <View style={styles.stack}>
            {paused.map((r) => (
              <Card key={r.id}>
                <View style={styles.head}>
                  <AppText variant="body" style={styles.grow}>
                    {r.title}
                  </AppText>
                  <Chip
                    label="Turn back on"
                    onPress={() =>
                      updateRoutine(r.id, {
                        active: true,
                        // A routine turned off by clearing its days needs a
                        // week again, or it comes back invisible.
                        days: r.days.length > 0 ? r.days : [1, 3, 5],
                      })
                    }
                  />
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Button title="Done" onPress={() => router.back()} style={styles.footer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  grow: { flexShrink: 1, flexGrow: 1 },
  editor: { marginTop: Spacing.md, gap: Spacing.xs },
  label: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  hint: { marginTop: Spacing.xs },
  footer: { marginTop: Spacing.xxl },
});
