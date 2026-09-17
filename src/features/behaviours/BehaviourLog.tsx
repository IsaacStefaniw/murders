/**
 * Logging a non-conforming moment — "one piece of Kit Kat at 8:45pm".
 *
 * Three things this screen refuses to do, all of them deliberate:
 *
 * It does not stamp the log with `now`. People reach for the app after the
 * moment, not during it, and the time is the single most valuable field —
 * the whole pattern engine is built on it. So the first question is when,
 * and it reaches back a week rather than three hours. It used to offer
 * nothing older than three hours, which contradicted this very paragraph:
 * a drink on Tuesday could not be recorded on Thursday, so Tuesday simply
 * never happened as far as the app was concerned. See `whenPicker.ts` for
 * why an older day is chosen as a part of the day rather than a clock time.
 *
 * It does not ask for a quantity. Detail is free text. A number here would
 * become a total, a total would become a chart, and the chart would be a
 * restriction scoreboard aimed at the people least well served by one.
 *
 * It records several at a sitting. Somebody catching up on Wednesday,
 * Friday and Saturday should not walk the whole aftermath three times to
 * do it, and the first attempt at this — a deep link from the aftermath
 * back into the tab — was dead on the second tap, because the tab only
 * reacted when the URL parameter CHANGED and it never did. The repeat
 * belongs here, where the day and time chips already are: log it, and the
 * sheet offers to take another before it hands over.
 *
 * It does not judge, and it no longer answers. What happened after "Log it"
 * used to be this component's job: a Card headed "Logged", one sentence
 * from `momentNote`, a Close button. That is a caption where the moment
 * needs a screen, so the response moved out to `/moment/[eventId]` — see
 * `features/moments/aftermath.ts` for what a person actually needs in the
 * ten minutes after a slip, and why in that order. This component's job
 * ends at recording an accurate event and handing over.
 */

import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { effectsFor, hoursBeforeSleep } from '@/features/behaviours/patterns';
import {
  dayChoices,
  occurredAtFrom,
  timeChoicesFor,
  whenSummary,
  type TimeChoice,
} from '@/features/behaviours/whenPicker';
import { useAppStore } from '@/state/store';
import type { BehaviourEvent, BehaviourIntention } from '@/types/domain';

const SIZES: { value: NonNullable<BehaviourEvent['size']>; label: string }[] = [
  { value: 'small', label: 'Less than usual' },
  { value: 'usual', label: 'About usual' },
  { value: 'more', label: 'More than usual' },
];

interface Props {
  intention: BehaviourIntention;
  onDone: () => void;
}

export function BehaviourLog({ intention, onDone }: Props) {
  const info = behaviourInfo(intention.behaviour);
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const logPastBehaviourEvent = useAppStore((s) => s.logPastBehaviourEvent);
  const removeBehaviourEvent = useAppStore((s) => s.removeBehaviourEvent);

  const [now] = useState(() => new Date());
  const [offsetDays, setOffsetDays] = useState(0);
  const days = useMemo(() => dayChoices(now), [now]);
  const times = useMemo(() => timeChoicesFor(offsetDays, now), [offsetDays, now]);
  // Held by key rather than by object so switching days keeps the choice
  // where the new day offers the same one, and falls back where it does not.
  const [timeKey, setTimeKey] = useState<string>(() => timeChoicesFor(0, now)[0]?.key ?? 'recent-0');
  const time: TimeChoice = times.find((t) => t.key === timeKey) ?? times[0];
  const [detail, setDetail] = useState('');
  const [size, setSize] = useState<BehaviourEvent['size']>();
  /**
   * What was recorded in this sitting, in the order it was typed.
   *
   * The time is carried alongside the id because typing order is not time
   * order. The day chips let somebody log Thursday, then remember Monday —
   * and "the last one I entered" would then hand the aftermath to a night
   * four days gone.
   */
  const [logged, setLogged] = useState<{ id: string; occurredAt: string }[]>([]);

  const occurredAt = useMemo(
    () => occurredAtFrom(now, offsetDays, time),
    [now, offsetDays, time],
  );

  const gap = hoursBeforeSleep(occurredAt, profile?.sleepTime ?? null);

  /**
   * Record it, then hand the moment over.
   *
   * The screen that follows is the reason this one can stay a plain form:
   * nothing here has to soften the act of logging, because nothing here is
   * the response. See `app/moment/[eventId].tsx`.
   */
  const submit = () => {
    const trimmed = detail.trim();
    const id = logPastBehaviourEvent(intention.id, occurredAt, trimmed || undefined, size);
    setLogged((prev) => [...prev, { id, occurredAt }]);
  };

  /** Clear the answers, keep the day list, stay in the sheet. */
  const another = () => {
    setDetail('');
    setSize(undefined);
    setLogged((prev) => prev);
  };

  /**
   * One aftermath, for the most recent NIGHT — not the last thing typed.
   *
   * Not one per event: the breakout is a de-escalation and a plan, and
   * running it three times for three nights logged in one sitting would
   * turn it into a form, which is the thing it was built to stop being.
   *
   * Which one it runs on is the part that was wrong. This took the last
   * entry in the list, which is typing order, and the day chips make
   * typing order arbitrary — somebody catching up usually starts with the
   * night they remember best. Isaac's own case was "I have drank a few
   * times this week and could only log yesterday", and logging yesterday
   * first and Monday second handed the aftermath to Monday.
   *
   * That is not a cosmetic mismatch. Everything the breakout says is about
   * what happens NEXT: `steady()` counts the week, `rightNow()` reads the
   * hours to the next window, and the plan it produces is delivered ahead
   * of it. Anchored to a Tuesday four days gone, all three are answering a
   * question nobody asked.
   */
  const finish = () => {
    const latest = logged.reduce<{ id: string; occurredAt: string } | null>(
      (best, e) => (best === null || e.occurredAt > best.occurredAt ? e : best),
      null,
    );
    onDone();
    if (latest) router.push(`/moment/${encodeURIComponent(latest.id)}` as never);
  };

  if (logged.length > 0) {
    return (
      <Card>
        <AppText variant="heading">
          {logged.length === 1 ? 'Logged.' : `${logged.length} logged.`}
        </AppText>
        <AppText variant="secondary" style={styles.gap}>
          {logged.length === 1
            ? `${whenSummary(days[offsetDays], time)}. Was there another one this week?`
            : 'Anything else from this week?'}
        </AppText>
        <View style={styles.actions}>
          <Button title="Add another" variant="secondary" onPress={another} />
          <Button title="That is all" onPress={finish} />
        </View>
        {/* Undoes the mis-tap where the mis-tap was made. The pattern engine
            is built on occurredAt, so a wrong entry moves the window every
            later interruption is computed from. */}
        <Button
          title="Remove the last one"
          variant="ghost"
          onPress={() => {
            // Typing order is the right order HERE, unlike `finish`: this
            // undoes the last thing they did, not the latest night.
            const last = logged[logged.length - 1];
            if (last) removeBehaviourEvent(last.id);
            setLogged((prev) => prev.slice(0, -1));
          }}
          style={styles.gap}
        />
      </Card>
    );
  }

  return (
    <Card>
      <AppText variant="heading">{info.label}</AppText>
      <AppText variant="caption" color="textTertiary">
        No score, no streak. The time is the part that helps.
      </AppText>

      <AppText variant="caption" color="textTertiary" style={styles.label}>
        Which day?
      </AppText>
      <View style={styles.chips}>
        {days.map((d) => (
          <Chip
            key={d.offsetDays}
            label={d.label}
            selected={offsetDays === d.offsetDays}
            onPress={() => {
              setOffsetDays(d.offsetDays);
              // The new day may not offer the chosen time — an exact clock
              // time only exists for today — so land on something valid
              // rather than silently recording the first chip in the list.
              const next = timeChoicesFor(d.offsetDays, now);
              if (!next.some((t) => t.key === timeKey)) setTimeKey(next[0].key);
            }}
          />
        ))}
      </View>

      <AppText variant="caption" color="textTertiary" style={styles.label}>
        {offsetDays === 0 ? 'When?' : 'Roughly when?'}
      </AppText>
      <View style={styles.chips}>
        {times.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            selected={time?.key === t.key}
            onPress={() => setTimeKey(t.key)}
          />
        ))}
      </View>
      <AppText variant="caption" color="textTertiary">
        {`Recording: ${whenSummary(days[offsetDays], time)}.`}
        {time?.approximate ? ' Near enough is fine — the pattern is what matters.' : ''}
      </AppText>

      <AppText variant="caption" color="textTertiary" style={styles.label}>
        What was it? (optional)
      </AppText>
      <Field
        label="What was it, optional"
        showLabel={false}
        hint="Stays on this device and is never sent anywhere. Only the count is ever used."
        value={detail}
        onChangeText={setDetail}
        placeholder={info.detailHint}
        multiline
      />

      <AppText variant="caption" color="textTertiary" style={styles.label}>
        Compared with your usual? (optional)
      </AppText>
      <View style={styles.chips}>
        {SIZES.map((s) => (
          <Chip
            key={s.value}
            label={s.label}
            selected={size === s.value}
            onPress={() => setSize(size === s.value ? undefined : s.value)}
          />
        ))}
      </View>

      {effectsFor(info, gap).length > 0 ? (
        <AppText variant="caption" color="textTertiary" style={styles.label}>
          That timing has a known effect — you&apos;ll get the detail once it&apos;s logged.
        </AppText>
      ) : null}

      <View style={styles.actions}>
        <Button title="Log it" onPress={submit} />
        <Button title="Cancel" variant="ghost" onPress={onDone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.sm },
  counter: { marginTop: Spacing.md, gap: Spacing.sm },
  label: { marginTop: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' },
});
