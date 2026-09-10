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
 * It does not judge. The response after logging comes from `momentNote`,
 * which offers a mechanism only where evidence supports one and otherwise
 * shows the person their own pattern.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import {
  behaviourPattern,
  effectsFor,
  hoursBeforeSleep,
  momentNote,
  type MomentNote,
} from '@/features/behaviours/patterns';
import { EVIDENCE_LABELS, protocolById } from '@/features/knowledge/protocols';
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
  const profile = useAppStore((s) => s.profile);
  const events = useAppStore((s) => s.behaviourEvents);
  const metrics = useAppStore((s) => s.metrics);
  const logPastBehaviourEvent = useAppStore((s) => s.logPastBehaviourEvent);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);

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
  const [note, setNote] = useState<MomentNote | null>(null);

  const occurredAt = useMemo(
    () => occurredAtFrom(now, offsetDays, time),
    [now, offsetDays, time],
  );

  // The pattern as it stands BEFORE this log, so the response describes the
  // history the person already has rather than counting the tap they just made.
  const pattern = useMemo(
    () => behaviourPattern(intention, events, metrics, now),
    [intention, events, metrics, now],
  );

  const gap = hoursBeforeSleep(occurredAt, profile?.sleepTime ?? null);

  const submit = () => {
    const trimmed = detail.trim();
    logPastBehaviourEvent(intention.id, occurredAt, trimmed || undefined, size);
    setNote(
      momentNote(
        { id: 'pending', intentionId: intention.id, occurredAt, detail: trimmed || undefined, size },
        pattern,
        profile?.sleepTime ?? null,
      ),
    );
  };

  if (note) {
    return (
      <Card>
        <AppText variant="heading">Logged</AppText>
        <AppText variant="secondary" style={styles.gap}>
          {note.text}
        </AppText>
        {note.kind === 'mechanism' ? (
          <>
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {EVIDENCE_LABELS[note.evidenceLevel]} · {note.attribution}
            </AppText>
            {note.also ? (
              <AppText variant="caption" color="textTertiary" style={styles.gap}>
                Also, less firmly: {note.also.text} ({EVIDENCE_LABELS[note.also.evidenceLevel]})
              </AppText>
            ) : null}
            {/*
              The lever, not just the fact. Knowing that a ten-minute walk
              flattens most of the curve is the half of this that changes
              anything.
            */}
            {note.counterText ? (
              <Card style={styles.counter}>
                <AppText variant="body">{note.counterText}</AppText>
                {note.counterProtocolId && protocolById(note.counterProtocolId) ? (
                  <Chip
                    label={`Add: ${protocolById(note.counterProtocolId)!.title}`}
                    onPress={() => {
                      toggleProtocol(note.counterProtocolId!);
                      onDone();
                    }}
                  />
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}
        {pattern.intervention ? (
          <AppText variant="caption" color="textTertiary" style={styles.gap}>
            {pattern.intervention.line} That is where IntentNorth will put something else in front of
            you, rather than a message after the fact.
          </AppText>
        ) : null}
        <Button title="Close" variant="secondary" onPress={onDone} style={styles.gap} />
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
