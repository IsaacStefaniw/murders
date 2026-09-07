/**
 * Tonight, for the behaviour someone named — on Today from the first day.
 *
 * Three reviewers with a drinking or vaping goal found the coach through a
 * hub and asked for the thing itself on the day: the plan for tonight,
 * a visible count, and the urge tool one tap away. This is that card.
 *
 * What it shows: the if-then plan (their own words once they write them),
 * the wins counted so far and the days since the last one, the timing the
 * log has found in plain words, and three buttons — count tonight, urge
 * now, it happened. After a lapse tonight the count gives way to the next
 * hour's plan; nothing is reset and nothing says so twice.
 *
 * It renders nothing when there is no behaviour being worked on, so Today
 * can mount it unconditionally. Everything it keeps — the plan's words,
 * the counted nights — lives on the recovery path's answers, so it needs
 * no store change. The words are computed in tonight.ts and tested there.
 */

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { BehaviourLog } from '@/features/behaviours/BehaviourLog';
import { EnvironmentChecklist } from '@/features/behaviours/EnvironmentChecklist';
import { behaviourPattern } from '@/features/behaviours/patterns';
import {
  COUNT_FROM_MIN,
  canMarkClear,
  markClearDay,
  tonightModel,
  unmarkClearDay,
} from '@/features/behaviours/tonight';
import { formatTime, nowMinutes, toHHMM } from '@/lib/dates';
import { useAppStore } from '@/state/store';

interface Props {
  /** Today's date key. */
  date: string;
}

const NO_ANSWERS: Record<string, string> = {};

export function TonightCard({ date }: Props) {
  const router = useRouter();
  const recovery = useAppStore((s) => s.paths.recovery);
  const intentions = useAppStore((s) => s.behaviourIntentions);
  const events = useAppStore((s) => s.behaviourEvents);
  const metrics = useAppStore((s) => s.metrics);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);

  const answers = recovery?.answers ?? NO_ANSWERS;
  // The behaviour the coach is running, else the first one being worked on.
  const intention =
    (recovery ? intentions.find((b) => b.active && b.behaviour === answers.behaviour) : undefined) ??
    intentions.find((b) => b.active) ??
    null;
  // Wins and the plan's words persist on the coach's answers, which belong
  // to one behaviour; another intention gets the card without the count.
  const counting = !!recovery && !!intention && intention.behaviour === answers.behaviour;

  const pattern = useMemo(
    () => (intention ? behaviourPattern(intention, events, metrics) : null),
    [intention, events, metrics],
  );
  const model = useMemo(
    () =>
      intention && pattern
        ? tonightModel(intention, events, pattern, counting ? answers : NO_ANSWERS, date, counting)
        : null,
    [intention, pattern, events, answers, date, counting],
  );

  const [editing, setEditing] = useState(false);
  const [cue, setCue] = useState('');
  const [action, setAction] = useState('');
  const [logging, setLogging] = useState(false);
  const [setup, setSetup] = useState(false);
  const [standInShown, setStandInShown] = useState(false);

  // A night counted clear and then logged is not clear. The count comes
  // off quietly; the next-hour line takes its place.
  const uncount = !!model && counting && !!model.afterLapse && model.clearMarked;
  useEffect(() => {
    if (uncount) updatePathAnswers('recovery', { clearDays: unmarkClearDay(answers, date) });
  }, [uncount, answers, date, updatePathAnswers]);

  if (!intention || !model) return null;
  if (logging) return <BehaviourLog intention={intention} onDone={() => setLogging(false)} />;

  const savePlan = () => {
    updatePathAnswers('recovery', { ifThenCue: cue.trim(), ifThenAction: action.trim() });
    setEditing(false);
  };
  const startEditing = () => {
    setCue(model.plan.ownWords ? model.plan.cue : '');
    setAction(model.plan.ownWords ? model.plan.action : '');
    setEditing(true);
  };
  const urgeNow = () => {
    if (model.standIn.route) router.push(model.standIn.route as never);
    else setStandInShown(true);
  };
  const lateEnough = canMarkClear(nowMinutes());

  return (
    <View style={styles.stack}>
      <Card>
        <View style={styles.header}>
          <AppText variant="heading">{model.info.label}</AppText>
          <AppText variant="caption" color="textTertiary">
            Free, always
          </AppText>
        </View>

        {editing ? (
          <View style={styles.form}>
            <Field
              label="When"
              value={cue}
              onChangeText={setCue}
              placeholder={model.plan.cue}
              hint="The exact moment — the sofa at nine, the fourth round at the same table."
            />
            <Field
              label="Then"
              value={action}
              onChangeText={setAction}
              placeholder={`I ${model.plan.action}`}
              hint="Something you do, not something you avoid."
            />
            <View style={styles.actions}>
              <Button title="Keep it" onPress={savePlan} disabled={!cue.trim() || !action.trim()} />
              <Button title="Cancel" variant="ghost" onPress={() => setEditing(false)} />
            </View>
          </View>
        ) : (
          <>
            <AppText variant="body" style={styles.plan}>
              {model.plan.text}
            </AppText>
            {counting ? (
              <Button
                title={model.plan.ownWords ? 'Change the words' : 'Put it in your own words'}
                variant="ghost"
                onPress={startEditing}
              />
            ) : null}
          </>
        )}

        <AppText variant="secondary" style={styles.line}>
          {model.afterLapse ?? model.tally.line}
        </AppText>
        <AppText variant="caption" color="textTertiary" style={styles.line}>
          {model.timing}
        </AppText>

        {standInShown ? (
          <Card style={styles.inner}>
            <AppText variant="body">{model.standIn.line}</AppText>
          </Card>
        ) : null}

        <View style={styles.actions}>
          {counting && !model.afterLapse ? (
            model.clearMarked ? (
              <AppText variant="secondary" color="accent">
                Counted. Sleep well.
              </AppText>
            ) : lateEnough ? (
              <Button
                title={model.info.winLabel}
                onPress={() => updatePathAnswers('recovery', { clearDays: markClearDay(answers, date) })}
              />
            ) : null
          ) : null}
          <Button title="Urge now" variant="secondary" onPress={urgeNow} />
          <Button title="It happened" variant="ghost" onPress={() => setLogging(true)} />
        </View>
        {counting && !lateEnough && !model.clearMarked && !model.afterLapse ? (
          <AppText variant="caption" color="textTertiary" style={styles.line}>
            Tonight counts from {formatTime(toHHMM(COUNT_FROM_MIN))}.
          </AppText>
        ) : null}
        {!counting ? (
          <Button
            title="Start the Habits & urges coach to keep count"
            variant="ghost"
            onPress={() => router.push('/path/recovery' as never)}
          />
        ) : null}
        <Button
          title={setup ? 'Hide the setup' : 'The setup — change the room, not the person'}
          variant="ghost"
          onPress={() => setSetup(!setup)}
        />
      </Card>
      {setup ? <EnvironmentChecklist behaviour={intention.behaviour} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  plan: { marginTop: Spacing.sm },
  line: { marginTop: Spacing.sm },
  form: { marginTop: Spacing.sm, gap: Spacing.sm },
  inner: { marginTop: Spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md, alignItems: 'center' },
});
