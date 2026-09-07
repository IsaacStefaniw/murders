import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { QuestionCard } from '@/features/model/QuestionCard';
import { summariseFocus, weeklyFocus } from '@/features/work/focus';
import {
  assessWork,
  deepHoursTarget,
  retargetBlock,
  weekOfBlock,
} from '@/features/work/programme';
import {
  EATER_OPTIONS,
  HELD_OPTIONS,
  REVIEW_KEYS,
  weekReviewChanges,
  type BlockHeld,
  type Eater,
  type WeekChange,
} from '@/features/work/review';
import {
  WEEK_LEVER_KEY,
  closeDay,
  pendingFirstThing,
  restoreLever,
} from '@/features/work/shutdown';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDateLong, todayKey, weekStartOf } from '@/lib/dates';
import { deriveWorkInputs, useAppStore } from '@/state/store';

/**
 * Work & leadership hub — your focus block.
 *
 * Four things, in the order a work day meets them: the focus number the
 * app already knows (blocks held, hours, against the honest target), the
 * close of the day (tomorrow's first thing, carried to tomorrow's first
 * block), the three questions that change next week, and the four-week
 * block with this week's one practice.
 */
export function WorkHub() {
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const paths = useAppStore((s) => s.paths);
  const goals = useAppStore((s) => s.goals);
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const metrics = useAppStore((s) => s.metrics);
  const block = useAppStore((s) => s.workBlock);
  const addMetric = useAppStore((s) => s.addMetric);
  const buildWorkBlock = useAppStore((s) => s.buildWorkBlock);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);
  const setGoalNextFocus = useAppStore((s) => s.setGoalNextFocus);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const updateRoutine = useAppStore((s) => s.updateRoutine);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);

  const [hoursLog, setHoursLog] = useState('');
  const [firstThing, setFirstThing] = useState('');
  const [held, setHeld] = useState<BlockHeld | null>(null);
  const [ate, setAte] = useState<Eater | null>(null);
  const [lever, setLever] = useState('');
  const [applied, setApplied] = useState<WeekChange[] | null>(null);

  const today = todayKey();
  const entry = paths.work;
  const answers = entry?.answers;
  const goal = goals.find((g) => g.id === entry?.goalId);

  const inputs = useMemo(
    () => (profile ? deriveWorkInputs(profile, answers) : null),
    [profile, answers],
  );
  const target = inputs ? deepHoursTarget(inputs) : 0;
  // Re-aimed at the live answers so a meeting-load answer given after the
  // block started changes the target without restarting the block.
  const liveBlock = block && inputs ? retargetBlock(block, inputs) : block;
  const assessment = useMemo(
    () => (inputs ? assessWork(inputs, metrics) : null),
    [inputs, metrics],
  );
  const week = liveBlock ? weekOfBlock(liveBlock) : null;
  const wk = liveBlock && week ? liveBlock.weeks[week - 1] : null;

  const focusWeeks = useMemo(
    () => weeklyFocus(plans, routines, metrics, today, 8),
    [plans, routines, metrics, today],
  );
  const focus = useMemo(() => summariseFocus(focusWeeks, target), [focusWeeks, target]);

  const pending = pendingFirstThing(answers, today);
  const reviewedThisWeek = answers?.[REVIEW_KEYS.week] === weekStartOf(today);

  // The first thing's day has passed: the week's lever goes back on the
  // goal. restoreLever is null once it has been done, so this cannot loop.
  useEffect(() => {
    if (!entry || !goal) return;
    const restore = restoreLever({ today, answers, currentFocus: goal.nextFocus });
    if (!restore) return;
    updatePathAnswers('work', restore.answersPatch);
    setGoalNextFocus(goal.id, restore.nextFocus);
  }, [entry, goal, answers, today, updatePathAnswers, setGoalNextFocus]);

  const close = () => {
    if (!entry || !goal || !profile) return;
    const result = closeDay({
      firstThing,
      today,
      workDays: profile.workDays,
      answers,
      currentFocus: goal.nextFocus,
    });
    if (!result) return;
    updatePathAnswers('work', result.answersPatch);
    setGoalNextFocus(goal.id, result.nextFocus);
    // The day it is for is re-laid so its first block carries the line.
    regeneratePlan(result.forDate);
    setFirstThing('');
  };

  const applyReview = () => {
    if (!entry || !held || !ate) return;
    const changes = weekReviewChanges(
      { held, ate, lever },
      { routines, profile, goalId: entry.goalId },
    );
    // The lever first: the calendar changes below re-lay the week, and the
    // blocks they lay down carry whatever the goal's next step is at that
    // moment. Set afterwards, it would not show until the next re-lay.
    const leverChange = changes.find((c) => c.kind === 'set_lever');
    if (leverChange?.kind === 'set_lever') {
      // A first thing already on the goal for tomorrow keeps its place;
      // the lever waits in the answers and is restored after that day.
      if (pending) updatePathAnswers('work', { [WEEK_LEVER_KEY]: leverChange.text });
      else if (goal) setGoalNextFocus(goal.id, leverChange.text);
    }
    let relaid = false;
    for (const change of changes) {
      switch (change.kind) {
        case 'move_block':
          updateRoutine(change.routineId, {
            preferredStart: change.preferredStart,
            preferredEnd: change.preferredEnd,
          });
          relaid = true;
          break;
        case 'shorten_block':
          updateRoutine(change.routineId, { durationMin: change.durationMin });
          relaid = true;
          break;
        case 'add_practice':
          toggleProtocol(change.protocolId);
          relaid = true;
          break;
        case 'set_lever':
        case 'keep':
          break;
      }
    }
    // Setting the goal's next step does not re-lay the week by itself.
    if (leverChange && !pending && !relaid) {
      for (let i = 0; i <= 6; i++) regeneratePlan(addDays(today, i));
    }
    updatePathAnswers('work', {
      [REVIEW_KEYS.held]: held,
      [REVIEW_KEYS.ate]: ate,
      [REVIEW_KEYS.week]: weekStartOf(today),
    });
    setApplied(changes);
    setHeld(null);
    setAte(null);
    setLever('');
  };

  return (
    <View>
      <SectionHeader title="Your focus time" />
      <Card>
        <View style={styles.row}>
          <AppText variant="body" style={styles.grow}>
            This week
          </AppText>
          <AppText variant="heading">{focus.thisWeek} h</AppText>
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.line}>
          {focus.line}
          {focus.priorMean !== null ? ` Earlier weeks: about ${focus.priorMean} h.` : ''}
        </AppText>
      </Card>
      <View style={styles.inputRow}>
        <Field
          label="This week's focus hours"
          showLabel={false}
          value={hoursLog}
          onChangeText={setHoursLog}
          keyboardType="numeric"
          placeholder="h"
          width={84}
        />
        <Button
          title="Log this week's focus hours"
          variant="secondary"
          hint="Only needed when the ticked-off blocks undercount the real hours."
          disabled={!Number(hoursLog)}
          onPress={() => {
            addMetric('work.deepHours', Number(hoursLog));
            setHoursLog('');
          }}
        />
      </View>

      {assessment ? (
        <Card
          style={{
            marginTop: Spacing.lg,
            borderColor: assessment.verdict === 'on-track' ? theme.accent : theme.border,
          }}
        >
          <AppText variant="body">{assessment.message}</AppText>
        </Card>
      ) : null}

      {entry && goal ? (
        <>
          <SectionHeader title="Close the day" />
          <Card>
            {pending ? (
              <View style={styles.pending}>
                <AppText variant="caption" color="accent">
                  {pending.forDate === today ? 'Today starts with' : `${formatDateLong(pending.forDate)} starts with`}
                </AppText>
                <AppText variant="heading">{pending.text}</AppText>
              </View>
            ) : null}
            <AppText variant="secondary">
              Loose ends written down, tomorrow&apos;s first thing named. It shows on your first
              work block tomorrow, so the morning starts already decided.
            </AppText>
            <View style={styles.stackTop}>
              <Field
                label="Tomorrow's first thing"
                showLabel={false}
                value={firstThing}
                onChangeText={setFirstThing}
                placeholder="Tomorrow's first thing"
                returnKeyType="done"
                onSubmitEditing={close}
              />
              <Button title="Close the day" disabled={!firstThing.trim()} onPress={close} />
            </View>
          </Card>
        </>
      ) : null}

      {entry ? (
        <>
          <SectionHeader title="Three questions for next week" />
          <Card>
            {reviewedThisWeek && !applied ? (
              <AppText variant="caption" color="textTertiary">
                Answered this week already. Answer again if the week changed.
              </AppText>
            ) : null}
            {applied ? (
              <View style={styles.pending}>
                <AppText variant="caption" color="accent">
                  Changed for next week
                </AppText>
                {applied.map((c, i) => (
                  <AppText key={i} variant="body" style={styles.line}>
                    {c.description}
                  </AppText>
                ))}
              </View>
            ) : null}
            <AppText variant="body">Did the focus block survive this week?</AppText>
            <View style={styles.chips}>
              {HELD_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={held === o.value}
                  onPress={() => setHeld(o.value)}
                />
              ))}
            </View>
            <AppText variant="body" style={styles.stackTop}>
              What ate it?
            </AppText>
            <View style={styles.chips}>
              {EATER_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={ate === o.value}
                  onPress={() => setAte(o.value)}
                />
              ))}
            </View>
            <AppText variant="body" style={styles.stackTop}>
              The one lever for next week
            </AppText>
            <Field
              label="The one lever for next week"
              showLabel={false}
              value={lever}
              onChangeText={setLever}
              placeholder="One line. It shows on every work block."
            />
            <Button
              title="Change next week"
              hint="Moves, shortens or adds to next week from these answers, and says what it did."
              disabled={!held || !ate}
              onPress={applyReview}
              style={styles.stackTop}
            />
          </Card>
        </>
      ) : null}

      <QuestionCard domain="work" />

      <SectionHeader
        title={wk && week ? `Your focus block · Week ${week} — ${wk.theme}` : 'Your focus block'}
      />
      {wk ? (
        <View style={styles.stack}>
          <Card>
            <AppText variant="body">{wk.focus}</AppText>
            <AppText variant="caption" color="textTertiary" style={styles.line}>
              Focus target: ~{wk.deepHoursTarget} h this week.
            </AppText>
          </Card>
          <Card style={{ borderColor: theme.accent }}>
            <AppText variant="heading">This week&apos;s practice: {wk.practice.title}</AppText>
            <AppText variant="caption" color="textTertiary" style={styles.line}>
              {wk.practice.detail}
            </AppText>
          </Card>
        </View>
      ) : (
        <View style={styles.stack}>
          {block ? (
            <AppText variant="secondary">
              Block complete — the Friday note closes it. Start the next four weeks and they
              begin from what the numbers said.
            </AppText>
          ) : (
            <AppText variant="secondary">
              Four weeks, one theme each: audit &amp; protect → the one lever → subtract → review.
              One practice a week and a focus target your real calendar can honour.
            </AppText>
          )}
          <Button
            title={block ? 'Start the next block' : 'Start my focus block'}
            onPress={buildWorkBlock}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  stackTop: { marginTop: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  line: { marginTop: Spacing.xs },
  pending: { marginBottom: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
});
