/**
 * Telling the app what your week actually is.
 *
 * The scheduler has always handled a shift that crosses midnight. What it
 * could not do was be told about a week that is not the same every week —
 * a profile holds one set of work hours and one wake time — so anybody on
 * a rotation would have rebuilt their week by hand, every week, until they
 * stopped. That is where a scheduling advantage collapses under
 * maintenance, and it applies to about half of this audience.
 *
 * Two ways in, because rosters come in two kinds. Most are a run of days
 * on and a run of days off, which is two numbers and a shift. The rest are
 * an arbitrary pattern, which is the day-by-day editor underneath.
 *
 * Calendar import is deliberately not here. Reading the phone's calendar
 * needs a native permission, which means a new build rather than an update
 * people already have — a decision that belongs to Isaac and a release
 * cycle, not to this screen.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { describeCycle, rotationOf, shiftOn, type Roster, type RosterShift } from '@/features/roster/roster';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/** The shifts people actually work, so nobody types four times. */
const PRESETS: { label: string; shift: Omit<RosterShift, 'label'>; name: string }[] = [
  {
    name: 'Days',
    label: 'Days · 7am–7pm',
    shift: { start: '07:00', end: '19:00', wakeTime: '05:45', sleepTime: '21:30' },
  },
  {
    name: 'Nights',
    label: 'Nights · 7pm–7am',
    shift: { start: '19:00', end: '07:00', wakeTime: '15:00', sleepTime: '09:00' },
  },
  {
    name: 'Earlies',
    label: 'Earlies · 6am–2pm',
    shift: { start: '06:00', end: '14:00', wakeTime: '04:45', sleepTime: '21:00' },
  },
  {
    name: 'Lates',
    label: 'Lates · 2pm–10pm',
    shift: { start: '14:00', end: '22:00', wakeTime: '08:00', sleepTime: '00:30' },
  },
];

const RUNS = [2, 3, 4, 5, 7];

export default function WeekShape() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const today = todayKey();

  const [preset, setPreset] = useState(0);
  const [on, setOn] = useState(4);
  const [off, setOff] = useState(4);
  const [startDate, setStartDate] = useState(today);

  const roster = profile?.roster;
  const draft = useMemo(
    () => rotationOf(on, off, { ...PRESETS[preset].shift, label: PRESETS[preset].name }, startDate),
    [on, off, preset, startDate],
  );

  const save = (next: Roster | undefined) => {
    updateProfile({ roster: next });
    // The whole visible week, because a rotation changes every day of it.
    for (let i = 0; i <= 6; i++) regeneratePlan(addDays(today, i));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/plan' as never));

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Your week
        </AppText>
        <Button title="Close" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Does your week repeat?</AppText>
      <AppText variant="secondary" style={styles.intro}>
        If the same days work every week, there is nothing to do here — that is already how
        your plan is built. This is for a rotation: a run of shifts, then a run of days off,
        repeating on its own cycle rather than on the calendar&apos;s.
      </AppText>

      {roster ? (
        <Card style={styles.current}>
          <AppText variant="label" color="textTertiary">
            Set now
          </AppText>
          <AppText variant="body">{describeCycle(roster)}</AppText>
          <View style={styles.week}>
            {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
              <AppText key={d} variant="caption" color="textTertiary">
                {formatDateLong(d)} · {shiftOn(roster, d)?.label ?? 'Off'}
              </AppText>
            ))}
          </View>
          <Button
            title="Remove the rotation"
            variant="ghost"
            hint="Goes back to the same work days every week."
            onPress={() => save(undefined)}
          />
        </Card>
      ) : null}

      <SectionHeader title="Which shift?" />
      <View style={styles.row}>
        {PRESETS.map((p, i) => (
          <Chip key={p.name} label={p.label} selected={preset === i} onPress={() => setPreset(i)} />
        ))}
      </View>

      <SectionHeader title="How many on?" />
      <View style={styles.row}>
        {RUNS.map((n) => (
          <Chip key={`on${n}`} label={`${n}`} selected={on === n} onPress={() => setOn(n)} />
        ))}
      </View>

      <SectionHeader title="How many off?" />
      <View style={styles.row}>
        {RUNS.map((n) => (
          <Chip key={`off${n}`} label={`${n}`} selected={off === n} onPress={() => setOff(n)} />
        ))}
      </View>

      <Field
        label="First day of the run"
        hint="The next day you are on. Everything counts from there, backwards as well as forwards."
        value={startDate}
        onChangeText={setStartDate}
        placeholder={today}
      />

      <Card style={styles.preview}>
        <AppText variant="label" color="textTertiary">
          What that gives you
        </AppText>
        <AppText variant="body">{describeCycle(draft)}</AppText>
        <View style={styles.week}>
          {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => (
            <AppText key={d} variant="caption" color="textTertiary">
              {formatDateLong(d)} · {shiftOn(draft, d)?.label ?? 'Off'}
              {shiftOn(draft, d)?.start
                ? ` · ${formatTime(shiftOn(draft, d)!.start!)}–${formatTime(shiftOn(draft, d)!.end!)}`
                : ''}
            </AppText>
          ))}
        </View>
        <AppText variant="caption" color="textTertiary">
          Practices that hang off waking or bedtime move with the shift rather than sitting at
          a clock hour — so morning light lands after you actually get up, whenever that is.
        </AppText>
      </Card>

      <View style={styles.footer}>
        <Button
          title="Use this rotation"
          onPress={() => {
            save(draft);
            close();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  intro: { marginTop: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  current: { gap: Spacing.sm, marginTop: Spacing.md },
  preview: { gap: Spacing.sm, marginTop: Spacing.lg },
  week: { gap: Spacing.xs },
  footer: { marginTop: Spacing.lg, gap: Spacing.sm },
});
