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
import { WeeklyCountCard } from '@/features/behaviours/WeeklyCountCard';
import { COUNTABLE } from '@/features/behaviours/weekly';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { behaviourPattern, weekNote } from '@/features/behaviours/patterns';
import { goalTrajectory } from '@/features/model/trajectory';
import { GoalProgress } from '@/features/goals/GoalProgress';
import { coachLine, voiceFor } from '@/features/coaches/voices';
import { PATH_AREA, PATH_ORDER, PATHS } from '@/features/paths/definitions';
import { freeCoachArea } from '@/features/plus/entitlement';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/*
 * The second trigger vocabulary used to live here.
 *
 * Seven capitalised strings ('Stress', 'Boredom', 'After a meal'...) stored
 * as free text on the event, each mapped to a one-line intervention — a
 * complete parallel implementation of `features/behaviours/tonight.ts`,
 * which has its own seven keys written to compose an if-then sentence. The
 * two lists disagreed about what the triggers even were, so a trigger
 * captured here could never build a plan.
 *
 * Both jobs moved to the breakout that now follows a log: one vocabulary in
 * `features/moments/aftermath.ts`, asked while the moment is fresh instead
 * of in a chip row further down a tab, and answered with a plan rather than
 * a sentence. Old events keep their labels — `triggerKeyOf` reads them.
 */

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
  const plus = useAppStore((s) => s.entitlement.plus);
  const goals = useAppStore((s) => s.goals);
  const paths = useAppStore((s) => s.paths);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const metrics = useAppStore((s) => s.metrics);
  const assessGoals = useAppStore((s) => s.assessGoals);

  // Evidence pass on open: rungs satisfied by metrics or completed sessions
  // get checked off before the cards render their verdicts.
  useEffect(() => {
    assessGoals();
  }, [assessGoals]);

  /** The intention whose logging sheet is open, if any. */
  const [logging, setLogging] = useState<string | null>(null);
  // Rolling 7-day window. The clock read is deliberate and the computation
  // trivial; a stable-per-render anchor would only make counts staler.
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  if (!profile) return <Screen tabbed />;

  const freeArea = freeCoachArea(profile.priorities);
  const activeGoals = goals.filter((g) => g.status === 'active');
  const activeIntentions = behaviourIntentions.filter((b) => b.active);

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Coaches
      </AppText>
      <AppText variant="title">What you&apos;re building</AppText>
      <AppText variant="caption" color="textTertiary">
        Seven specialists, each one building and running a plan for one part of your life from the
        same answers. They tell you what they need and what they will never do.
      </AppText>
      {profile.lifeVision ? (
        <AppText variant="secondary" style={styles.vision}>
          “{profile.lifeVision}”
        </AppText>
      ) : null}

      {/* Questions that belong to no single coach. Disappears once
          answered rather than sitting there as a permanent chore. */}
      <DeferredQuestions
        target="coaches"
        promise="One more thing IntentNorth can use across every coach."
      />

      <SectionHeader title="Your coaches" />
      <AppText variant="caption" color="textTertiary">
        A few questions each — every answer changes what gets built.
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
                      ? `Active · ${done}/${total} steps`
                      : 'Active'
                    : `${def.questions.length} questions`}
                </AppText>
              </View>
              <AppText variant="caption" color="textTertiary">
                {coachLine(pathId)}
              </AppText>
              {/* The refusal rather than the promise. A list of seven
                  promises is a feature matrix; nobody picks a person from
                  one. See features/coaches/voices.ts. */}
              {!entry ? (
                <AppText variant="secondary" style={styles.pathVoice}>
                  {voiceFor(pathId).refusal}
                </AppText>
              ) : null}
              {/* The card says what Today does. The free coach is chosen
                  by the area the person ranked first, and until this read
                  the same rule the tab advertised a lock that was not
                  there. */}
              {!plus && pathId === 'recovery' ? (
                <AppText variant="caption" color="success">
                  Always free — we never charge for someone’s hardest moment
                </AppText>
              ) : !plus && PATH_AREA[pathId] === freeArea ? (
                <AppText variant="caption" color="success">
                  Yours free — you said this matters most
                </AppText>
              ) : !plus ? (
                <AppText variant="caption" color="accent">
                  Built and waiting · Plus puts its sessions into your days
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
            Every practice behind the programs, graded A to E for how strong the evidence is, one
            tap into your week.
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
          message="Drinking, scrolling, late nights — naming one is how IntentNorth knows to help at the moment it usually happens, rather than reporting on it afterwards."
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
              <View key={intention.id} style={styles.stack}>
                {/* One number for the week that finished, where a count means
                    something published. Occasions answer "when does it win";
                    a weekly figure answers "how much", which is the question
                    the guideline and the markers instrument are both in. */}
                {COUNTABLE[intention.behaviour] ? (
                  <WeeklyCountCard intention={intention} />
                ) : null}
              <Card>
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
                {/* The if-then written after the last slip, said back.
                    An implementation intention works by being recalled in
                    the situation it names, so a plan the app takes and
                    never repeats is a plan that did nothing. Written in
                    the breakout — see features/moments/aftermath.ts. */}
                {intention.plan ? (
                  <View style={[styles.planLine, { borderLeftColor: theme.accent }]}>
                    <AppText variant="label" color="textTertiary">
                      Your plan
                    </AppText>
                    <AppText variant="body">{intention.plan.text}</AppText>
                  </View>
                ) : null}
                {info.safetyNote ? (
                  <AppText variant="caption" color="textTertiary" style={styles.safety}>
                    {info.safetyNote}
                  </AppText>
                ) : null}
              </Card>
              </View>
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
  pathVoice: { marginTop: Spacing.sm },
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
  planLine: {
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    borderLeftWidth: 3,
    gap: Spacing.xs,
  },
  patternLine: { marginTop: Spacing.sm },
  goalHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  goalTitle: { flexShrink: 1 },
  settings: { marginTop: Spacing.xxl },
});
