import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import type { BehaviourEvent } from '@/types/domain';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { DeferredQuestions } from '@/features/onboarding/DeferredQuestions';
import { Spacing } from '@/constants/theme';
import { BehaviourLog } from '@/features/behaviours/BehaviourLog';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { behaviourPattern, weekNote } from '@/features/behaviours/patterns';
import { goalTrajectory } from '@/features/model/trajectory';
import { GoalProgress } from '@/features/goals/GoalProgress';
import { PATH_ORDER, PATHS } from '@/features/paths/definitions';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const TRIGGERS = ['Stress', 'Boredom', 'Social', 'After a meal', 'Work', 'Habit', 'Other'];

/** Trigger-appropriate next move — not always "breathe". */
const TRIGGER_INTERVENTIONS: Record<string, { text: string; label?: string; route?: string }> = {
  Stress: {
    text: 'Stress urges fall fastest to a physiological sigh — two minutes, right now.',
    label: 'Breathe it through',
    route: '/session/breathe',
  },
  Boredom: {
    text: 'Boredom wants stimulation, not sedation. Ten minutes of your replacement — a walk, a page, a message.',
    label: 'Journal one line instead',
    route: '/session/journal',
  },
  Social: {
    text: 'Social triggers are won in advance: decide your drink, your line, and your exit before the next one.',
  },
  'After a meal': {
    text: 'Pair the moment with a 10-minute walk — same cue, better payoff.',
  },
  Work: {
    text: 'Work spikes pass. Two minutes of slow exhales, then one small next action.',
    label: 'Breathe it through',
    route: '/session/breathe',
  },
  Habit: {
    text: 'Pure habit runs on cues — change the scene for two minutes and the loop loses its footing.',
    label: 'Breathe it through',
    route: '/session/breathe',
  },
  Other: { text: 'Noted. The pattern will show itself — keep logging, one tap at a time.' },
};

/** The dominant trigger once there's enough signal (≥3 of the same). */
function commonTrigger(events: BehaviourEvent[]): string | null {
  const counts = new Map<string, number>();
  for (const e of events) {
    if (e.trigger) counts.set(e.trigger, (counts.get(e.trigger) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= 3 ? top[0] : null;
}

/** Life: goals, behaviour intentions, people. The slower-moving layer. */
export default function Life() {
  const router = useRouter();
  const theme = useTheme();

  const profile = useAppStore((s) => s.profile);
  const goals = useAppStore((s) => s.goals);
  const paths = useAppStore((s) => s.paths);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const setBehaviourEventTrigger = useAppStore((s) => s.setBehaviourEventTrigger);
  const metrics = useAppStore((s) => s.metrics);
  const assessGoals = useAppStore((s) => s.assessGoals);

  // Evidence pass on open: rungs satisfied by metrics or completed sessions
  // get checked off before the cards render their verdicts.
  useEffect(() => {
    assessGoals();
  }, [assessGoals]);

  /** The intention whose logging sheet is open, if any. */
  const [logging, setLogging] = useState<string | null>(null);
  /** Event awaiting an optional one-tap trigger. */
  const [pendingTrigger, setPendingTrigger] = useState<{
    intentionId: string;
    eventId: string;
  } | null>(null);
  /** After a trigger is named, offer the move that fits it. */
  const [intervention, setIntervention] = useState<{ intentionId: string; trigger: string } | null>(
    null,
  );

  // Rolling 7-day window. The clock read is deliberate and the computation
  // trivial; a stable-per-render anchor would only make counts staler.
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  if (!profile) return <Screen tabbed />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeIntentions = behaviourIntentions.filter((b) => b.active);

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Coaches
      </AppText>
      <AppText variant="title">What you&apos;re building</AppText>
      {profile.lifeVision ? (
        <AppText variant="secondary" style={styles.vision}>
          “{profile.lifeVision}”
        </AppText>
      ) : null}

      {/* Questions that belong to no single coach. Disappears once
          answered rather than sitting there as a permanent chore. */}
      <DeferredQuestions
        target="coaches"
        promise="One more thing INTENT can use across every coach."
      />

      <SectionHeader title="Paths" />
      <AppText variant="caption" color="textTertiary">
        Guided programs. A few questions each — every answer changes what gets built.
      </AppText>
      <View style={styles.stack}>
        {PATH_ORDER.map((pathId) => {
          const def = PATHS[pathId];
          const entry = paths[pathId];
          const pathGoal = entry ? goals.find((g) => g.id === entry.goalId) : undefined;
          const done = pathGoal?.milestones?.filter((m) => m.done).length ?? 0;
          const total = pathGoal?.milestones?.length ?? 0;
          return (
            <Card
              key={pathId}
              onPress={() => router.push(`/path/${pathId}` as never)}
              accessibilityLabel={`${def.title} path`}
            >
              <View style={styles.pathRow}>
                <AppText variant="heading" style={styles.pathTitle}>
                  {def.title}
                </AppText>
                <AppText variant="caption" color={entry ? 'success' : 'accent'}>
                  {entry
                    ? total > 0
                      ? `Active · ${done}/${total} milestones`
                      : 'Active'
                    : `${def.questions.length} questions → your program`}
                </AppText>
              </View>
              {!entry ? (
                <AppText variant="caption" color="textTertiary">
                  {def.promise}
                </AppText>
              ) : null}
            </Card>
          );
        })}
        <Card
          onPress={() => router.push('/library' as never)}
          accessibilityLabel="Open the evidence-based practice library"
        >
          <AppText variant="heading">Practice library</AppText>
          <AppText variant="caption" color="textTertiary">
            All the evidence-based protocols behind the paths, à la carte.
          </AppText>
        </Card>
      </View>

      <SectionHeader title="Goals" />
      {activeGoals.length === 0 ? (
        <EmptyState
          title="No active goals"
          message="A goal becomes a routine, a routine becomes your days."
          actionTitle="Add a goal"
          onAction={() => router.push('/goals/new')}
        />
      ) : (
        <View style={styles.stack}>
          {activeGoals.map((goal) => {
            const reviewable = goal.domain === 'business' || goal.domain === 'career';
            const milestonesDone = goal.milestones?.filter((m) => m.done).length ?? 0;
            // Where this is actually heading, when there is enough to say.
            const trajectory = goalTrajectory(goal, metrics);
            return (
              <Card key={goal.id}>
                <View style={styles.goalHead}>
                  <AppText variant="heading" style={styles.goalTitle}>
                    {goal.title}
                  </AppText>
                  <Chip label="Edit" onPress={() => router.push(`/goals/${goal.id}` as never)} />
                </View>
                <AppText variant="caption" color="textTertiary">
                  {goal.milestones?.length
                    ? `${milestonesDone} of ${goal.milestones.length} milestones`
                    : goal.cadencePerWeek
                      ? `${goal.cadencePerWeek}× a week · ${goal.routineIds.length > 0 ? 'scheduled automatically' : 'not scheduled yet'}`
                      : 'Ambition — break it down when ready'}
                </AppText>
                {goal.nextFocus ? (
                  <AppText variant="secondary" style={styles.nextFocus}>
                    This week: {goal.nextFocus}
                  </AppText>
                ) : null}
                {trajectory && trajectory.verdict !== 'not-enough-data' ? (
                  <AppText
                    variant="secondary"
                    color={
                      trajectory.verdict === 'behind' || trajectory.verdict === 'wrong-way'
                        ? 'accent'
                        : 'textSecondary'
                    }
                    style={styles.nextFocus}
                  >
                    {trajectory.headline}
                  </AppText>
                ) : null}
                <GoalProgress goal={goal} />
                {reviewable ? (
                  <Button
                    title="Weekly review"
                    variant="secondary"
                    onPress={() => router.push(`/session/review/${goal.id}` as never)}
                    style={styles.reviewButton}
                  />
                ) : null}
              </Card>
            );
          })}
          <Button title="Add a goal" variant="secondary" onPress={() => router.push('/goals/new')} />
        </View>
      )}

      <SectionHeader title="Working on" />
      {activeIntentions.length === 0 ? (
        // Telling someone where to go is a manual. Taking them there is a
        // product. This was the only place left in the app that still gave
        // directions instead of a button.
        <EmptyState
          title="Nothing you're cutting back on"
          message="Drinking, scrolling, late nights — naming one is how INTENT knows to help at the moment it usually happens, rather than reporting on it afterwards."
          actionTitle="Choose something"
          onAction={() => router.push('/settings')}
        />
      ) : (
        <View style={styles.stack}>
          {activeIntentions.map((intention) => {
            const info = behaviourInfo(intention.behaviour);
            const own = behaviourEvents.filter((e) => e.intentionId === intention.id);
            const count = own.filter((e) => e.occurredAt >= weekAgo).length;
            const topTrigger = commonTrigger(own);
            const pattern = behaviourPattern(intention, behaviourEvents, metrics);

            if (logging === intention.id) {
              return (
                <BehaviourLog
                  key={intention.id}
                  intention={intention}
                  onDone={() => setLogging(null)}
                />
              );
            }

            return (
              <Card key={intention.id}>
                <View style={styles.intentionRow}>
                  <View style={styles.intentionInfo}>
                    <AppText variant="heading">{intention.intentionText}</AppText>
                    <AppText variant="caption" color="textTertiary">
                      {info.label} · {count === 0 ? 'clear this week' : `${count} this week`}
                      {topTrigger ? ` · usually: ${topTrigger.toLowerCase()}` : ''}
                    </AppText>
                  </View>
                  <View style={styles.intentionActions}>
                    <Button
                      title="Urge? Breathe"
                      variant="secondary"
                      onPress={() => router.push('/session/breathe')}
                    />
                    <Button
                      title="It happened"
                      variant="ghost"
                      onPress={() => setLogging(intention.id)}
                    />
                  </View>
                </View>
                {weekNote(pattern) ? (
                  <AppText variant="secondary" style={styles.patternLine}>
                    {weekNote(pattern)}
                  </AppText>
                ) : null}
                {pattern.intervention ? (
                  <AppText variant="caption" color="textTertiary" style={styles.patternLine}>
                    Best moment to change the evening: {pattern.intervention.at}, ahead of the
                    window rather than inside it.
                  </AppText>
                ) : null}
                {pendingTrigger?.intentionId === intention.id ? (
                  <View style={styles.triggerArea}>
                    <AppText variant="caption" color="textTertiary">
                      Noted. What triggered it?
                    </AppText>
                    <View style={styles.triggerChips}>
                      {TRIGGERS.map((t) => (
                        <Chip
                          key={t}
                          label={t}
                          onPress={() => {
                            setBehaviourEventTrigger(pendingTrigger.eventId, t);
                            setPendingTrigger(null);
                            setIntervention({ intentionId: intention.id, trigger: t });
                          }}
                        />
                      ))}
                      <Chip label="Skip" onPress={() => setPendingTrigger(null)} />
                    </View>
                  </View>
                ) : null}
                {intervention?.intentionId === intention.id ? (
                  <View style={styles.triggerArea}>
                    <AppText variant="secondary">
                      {TRIGGER_INTERVENTIONS[intervention.trigger]?.text}
                    </AppText>
                    <View style={styles.triggerChips}>
                      {TRIGGER_INTERVENTIONS[intervention.trigger]?.route ? (
                        <Chip
                          label={TRIGGER_INTERVENTIONS[intervention.trigger].label!}
                          selected
                          onPress={() => {
                            const route = TRIGGER_INTERVENTIONS[intervention.trigger].route!;
                            setIntervention(null);
                            router.push(route as never);
                          }}
                        />
                      ) : null}
                      <Chip label="Got it" onPress={() => setIntervention(null)} />
                    </View>
                  </View>
                ) : null}
                {info.safetyNote ? (
                  <AppText variant="caption" color="textTertiary" style={styles.safety}>
                    {info.safetyNote}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
          <AppText variant="caption" color="textTertiary" style={styles.note}>
            Logging is data, not judgement. Trends show up in your weekly review.
          </AppText>
        </View>
      )}

      <SectionHeader title="People" />
      <Card
        onPress={() => router.push('/household' as never)}
        accessibilityLabel="Open your household"
        style={{ borderColor: theme.border }}
      >
        <AppText variant="heading">
          {profile.people.find((p) => p.relation === 'partner')?.name ?? 'Your household'}
        </AppText>
        <AppText variant="secondary">
          The week you share — date nights, family time, babysitter logistics, and a copy-ready
          plan to send them.
        </AppText>
      </Card>

      <Button
        title="Settings"
        variant="ghost"
        onPress={() => router.push('/settings')}
        style={styles.settings}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  vision: { marginTop: Spacing.sm, fontStyle: 'italic' },
  pathRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: Spacing.sm },
  pathTitle: { flexShrink: 1 },
  intentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  intentionInfo: { flexShrink: 1, gap: 2 },
  intentionActions: { gap: Spacing.xs, alignItems: 'flex-end' },
  nextFocus: { marginTop: Spacing.sm, fontWeight: '600' },
  reviewButton: { marginTop: Spacing.md, alignSelf: 'flex-start' },
  safety: { marginTop: Spacing.md },
  triggerArea: { marginTop: Spacing.md, gap: Spacing.sm },
  triggerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  note: { marginTop: Spacing.xs },
  patternLine: { marginTop: Spacing.sm },
  goalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  goalTitle: { flexShrink: 1 },
  settings: { marginTop: Spacing.xxl },
});
