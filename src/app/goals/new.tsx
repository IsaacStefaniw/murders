import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import {
  buildGoalPlan,
  DOMAIN_LABELS,
  parseGoal,
} from '@/features/goals/goalPlanner';
import { DOMAIN_QUESTIONS } from '@/features/knowledge/questionBank';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Conversational goal creation: the user writes one sentence, INTENT does
 * the structuring — domain, milestones, the recurring behaviour — and asks
 * only what it genuinely needs (the why). The user edits and approves.
 */
export default function NewGoal() {
  const router = useRouter();
  const theme = useTheme();
  const addGoal = useAppStore((s) => s.addGoal);
  const profile = useAppStore((s) => s.profile);

  const [step, setStep] = useState<'describe' | 'why' | 'tailor' | 'review'>('describe');
  const [text, setText] = useState('');
  const [why, setWhy] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [droppedMilestones, setDroppedMilestones] = useState<Set<string>>(new Set());

  const parsed = useMemo(() => (text.trim() ? parseGoal(text) : null), [text]);
  const questions = parsed ? (DOMAIN_QUESTIONS[parsed.domain] ?? []) : [];
  const plan = useMemo(
    () => (parsed && step === 'review' ? buildGoalPlan(parsed, profile, why, answers) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsed, step],
  );
  const afterWhy = () => setStep(questions.length > 0 ? 'tailor' : 'review');

  const save = () => {
    if (!plan) return;
    const milestones = plan.goal.milestones?.filter((m) => !droppedMilestones.has(m.id));
    addGoal(
      { ...plan.goal, why: why.trim() || undefined, milestones: milestones?.length ? milestones : undefined },
      plan.routines,
    );
    router.back();
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  if (step === 'describe') {
    return (
      <Screen>
        <AppText variant="title">What do you want?</AppText>
        <AppText variant="secondary" style={styles.sub}>
          One sentence. I&apos;ll do the structuring.
        </AppText>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="e.g. Grow the business to $2m revenue"
          placeholderTextColor={theme.textTertiary}
          autoFocus
          multiline
          style={[...inputStyle, styles.bigInput]}
        />
        {parsed ? (
          <AppText variant="caption" color="textTertiary" style={styles.sub}>
            Reading this as: {DOMAIN_LABELS[parsed.domain]}
            {parsed.target ? ` · target ${parsed.target}` : ''}
            {parsed.timeframe ? ` · ${parsed.timeframe}` : ''}
          </AppText>
        ) : null}
        <View style={styles.footer}>
          <Button title="Continue" disabled={text.trim().length < 4} onPress={() => setStep('why')} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (step === 'why') {
    return (
      <Screen>
        <AppText variant="title">Why does this matter enough to make room for it?</AppText>
        <AppText variant="secondary" style={styles.sub}>
          Your words. When motivation dips, they&apos;ll do the arguing.
        </AppText>
        <TextInput
          value={why}
          onChangeText={setWhy}
          placeholder="Optional — but the goals with a why are the ones that happen"
          placeholderTextColor={theme.textTertiary}
          autoFocus
          multiline
          style={[...inputStyle, styles.bigInput]}
        />
        <View style={styles.footer}>
          <Button title={why.trim() ? 'Continue' : 'Skip'} onPress={afterWhy} />
          <Button title="Back" variant="ghost" onPress={() => setStep('describe')} />
        </View>
      </Screen>
    );
  }

  if (step === 'tailor') {
    // Evidence-based intake: every answer changes the plan that gets built.
    return (
      <Screen>
        <AppText variant="label" color="accent">
          {parsed ? DOMAIN_LABELS[parsed.domain] : ''}
        </AppText>
        <AppText variant="title">A couple of questions, then the plan.</AppText>
        {questions.map((q) => (
          <View key={q.key}>
            <SectionHeader title={q.question} />
            <View style={styles.chipsRow}>
              {q.options.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={answers[q.key] === o.value}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.key]: o.value }))}
                />
              ))}
            </View>
          </View>
        ))}
        <View style={styles.footer}>
          <Button
            title={questions.every((q) => answers[q.key]) ? 'Build my plan' : 'Skip — use defaults'}
            onPress={() => setStep('review')}
          />
          <Button title="Back" variant="ghost" onPress={() => setStep('why')} />
        </View>
      </Screen>
    );
  }

  if (!plan) return <Screen />;

  return (
    <Screen>
      <AppText variant="label" color="accent">
        {DOMAIN_LABELS[plan.goal.domain ?? 'personal']}
      </AppText>
      <AppText variant="title">{plan.goal.title}</AppText>
      {why.trim() ? (
        <AppText variant="secondary" style={styles.sub}>
          Because: {why.trim()}
        </AppText>
      ) : null}

      {plan.goal.milestones?.length ? (
        <View>
          <SectionHeader title="Milestones" />
          <View style={styles.stack}>
            {plan.goal.milestones.map((m) => (
              <Chip
                key={m.id}
                label={m.title}
                selected={!droppedMilestones.has(m.id)}
                onPress={() =>
                  setDroppedMilestones((prev) => {
                    const next = new Set(prev);
                    if (next.has(m.id)) {
                      next.delete(m.id);
                    } else {
                      next.add(m.id);
                    }
                    return next;
                  })
                }
              />
            ))}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.sub}>
            Tap to drop any that don&apos;t fit.
          </AppText>
        </View>
      ) : null}

      <SectionHeader title="The behaviour that makes it real" />
      {plan.routines.length === 0 ? (
        <Card>
          <AppText variant="body">
            This one runs through behaviour tracking rather than the calendar — add it under
            Settings → behaviours, and INTENT will help you protect against it daily.
          </AppText>
        </Card>
      ) : (
        <View style={styles.stack}>
          {plan.routines.map((r) => (
            <Card key={r.id}>
              <AppText variant="heading">{r.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {r.days.length === 7 ? 'Every day' : r.days.map((d) => DAY_LETTERS[d]).join(' ')}
                {' · around '}
                {formatTime(r.preferredStart)} · {r.durationMin} min
                {r.duringWork ? ' · carved out of work hours' : ''}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Button title="Make it real" onPress={save} />
        <Button
          title="Back"
          variant="ghost"
          onPress={() => setStep(questions.length > 0 ? 'tailor' : 'why')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 17,
  },
  bigInput: { marginTop: Spacing.xl, minHeight: 76 },
  stack: { flexDirection: 'column', gap: Spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
