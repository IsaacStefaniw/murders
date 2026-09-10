import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { EVIDENCE_LABELS, protocolById } from '@/features/knowledge/protocols';
import {
  afterTheFact,
  markCollected,
  nextToPromise,
  promiseKey,
  rewardDue,
  stageFor,
  STOP_STAGES,
} from '@/features/behaviours/programme';
import { clearDaysOf } from '@/features/behaviours/tonight';
import { todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The programme, as opposed to tonight.
 *
 * TonightCard answers "what do I do in the next hour". This answers "what
 * am I actually doing about this", which is the question somebody asks
 * after a week where it happened four times — and which the coach had no
 * answer to at all.
 *
 * Three things on it: the shape of the week across every behaviour at
 * once, the stage of the arc and what opens the next one, and the reward
 * ladder, which is chosen in advance because choosing it in advance is the
 * commitment rather than the prize.
 *
 * Renders nothing without a behaviour being worked on, so a hub can mount
 * it unconditionally.
 */
export function StopProgramme() {
  const intentions = useAppStore((s) => s.behaviourIntentions);
  const events = useAppStore((s) => s.behaviourEvents);
  const recovery = useAppStore((s) => s.paths.recovery);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);

  const answers = recovery?.answers ?? {};
  const active = intentions.filter((i) => i.active);
  const [promise, setPromise] = useState('');

  if (active.length === 0) return null;

  const today = todayKey();
  const nights = clearDaysOf(answers).length;
  const { current, next, nightsToNext } = stageFor(nights);
  const week = afterTheFact(active, events, answers, today);
  const due = rewardDue(nights, answers);
  const toPromise = nextToPromise(nights, answers);
  const protocol = current.protocolId ? protocolById(current.protocolId) : undefined;

  return (
    <Card>
      <AppText variant="label" color="accent">
        The programme
      </AppText>

      <AppText variant="secondary" style={styles.gap}>
        {week.shape.line}
      </AppText>

      {/* The stage. Nights accumulated, never consecutive — a lapse in the
          middle of ten clear nights is still ten clear nights, and the
          number the stages read only ever goes up. */}
      <AppText variant="heading" style={styles.gap}>
        {current.n}. {current.title}
      </AppText>
      <AppText variant="secondary" style={styles.gap}>
        {current.focus}
      </AppText>
      <AppText variant="body" color="accent" style={styles.gap}>
        {current.coachLine}
      </AppText>

      {protocol ? (
        <View style={styles.chips}>
          <Chip label={`Add: ${protocol.title}`} onPress={() => toggleProtocol(protocol.id)} />
          <AppText variant="caption" color="textTertiary">
            {EVIDENCE_LABELS[protocol.evidenceLevel]}
          </AppText>
        </View>
      ) : null}

      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        {nights} clear {nights === 1 ? 'night' : 'nights'} counted
        {next && nightsToNext !== null
          ? ` · ${nightsToNext} more opens “${next.title.toLowerCase()}”`
          : ' · you are at the last stage, which is mostly nothing happening'}
      </AppText>

      {/* The reward. Escalating with what has accumulated, never reset by a
          lapse — the divergence from textbook contingency management is
          deliberate and argued in programme.ts. */}
      {due ? (
        <Card style={styles.reward}>
          <AppText variant="heading">Due</AppText>
          <AppText variant="secondary" style={styles.gap}>
            {due.line}
          </AppText>
          <Button
            title="Taken"
            variant="secondary"
            style={styles.gap}
            onPress={() =>
              updatePathAnswers('recovery', { rewardsTaken: markCollected(answers, due.nights) })
            }
          />
        </Card>
      ) : toPromise ? (
        <View style={styles.promise}>
          <AppText variant="caption" color="textTertiary">
            What is {toPromise} clear nights worth? Name it now — deciding in advance is the part
            that does the work, and it is waiting for you rather than hanging over you.
          </AppText>
          <Field
            label={`Reward at ${toPromise} nights`}
            showLabel={false}
            value={promise}
            onChangeText={setPromise}
            placeholder="The good coffee beans. A day off. Something you would not otherwise buy."
          />
          <Button
            title="Set it"
            variant="secondary"
            onPress={() => {
              if (!promise.trim()) return;
              updatePathAnswers('recovery', { [promiseKey(toPromise)]: promise.trim() });
              setPromise('');
            }}
          />
        </View>
      ) : null}

      <AppText variant="caption" color="textTertiary" style={styles.stages}>
        {STOP_STAGES.map((s) => `${s.n}. ${s.title}`).join('  ·  ')}
      </AppText>
      <AppText variant="caption" color="textTertiary">
        Nothing here resets. A night that went badly is one night, and every clear one you have
        counted stays counted.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' },
  reward: { marginTop: Spacing.md },
  promise: { gap: Spacing.sm, marginTop: Spacing.md },
  stages: { marginTop: Spacing.lg },
});
