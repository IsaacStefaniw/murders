import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { ReadinessCard } from '@/features/health/ReadinessCard';
import { SuggestionCard } from '@/components/suggestion-card';
import { Spacing } from '@/constants/theme';
import { buildLookingAhead, ideasFor } from '@/features/anticipation/lookAhead';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { dueInterventions } from '@/features/behaviours/patterns';
import { CheckinCard } from '@/features/checkins/CheckinCard';
import { coachNote, weekMomentum } from '@/features/today/coach';
import { availableStartsFor } from '@/features/planner/generate';
import { ItemActions } from '@/features/today/item-actions';
import { PlanItemRow } from '@/features/today/plan-item-row';
import { QuickAdd } from '@/features/today/QuickAdd';
import {
  addDays,
  formatDateLong,
  formatTime,
  nowMinutes,
  todayKey,
  toMinutes,
  weekdayOf,
} from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { LogDidIt } from '@/features/today/LogDidIt';
import { WelcomeBack } from '@/features/today/WelcomeBack';
import { QuickLog } from '@/features/today/QuickLog';
import { displacedLine } from '@/features/planner/displaced';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';
import { LockedSessions } from '@/features/plus/LockedSessions';
import { PlusNudge } from '@/features/plus/PlusNudge';
import { applicableRoutines } from '@/features/knowledge/protocols';
import { DragToMove } from '@/features/today/DragToMove';
import { knockOnLine } from '@/features/today/dragMath';

const EVENING_START = 17 * 60;

/** Items worth a person's attention — generic work blocks are calendar noise. */
const meaningful = (i: PlanItem) => i.title !== 'Work';

export default function Today() {
  const router = useRouter();
  const theme = useTheme();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const routines = useAppStore((s) => s.routines);
  const plus = useAppStore((s) => s.entitlement.plus);
  const recoveryGoalId = useAppStore((s) => s.paths.recovery?.goalId);
  const goals = useAppStore((s) => s.goals);
  const plans = useAppStore((s) => s.plans);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const addPlanItem = useAppStore((s) => s.addPlanItem);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);
  const reflections = useAppStore((s) => s.reflections);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const metrics = useAppStore((s) => s.metrics);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  /** Set by a long press, so the row opens on the move picker. */
  const [moveId, setMoveId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [moveNote, setMoveNote] = useState<string | null>(null);
  const moveItem = useAppStore((s) => s.moveItem);
  const dropAt = useCallback(
    (itemId: string, start: string) => setMoveNote(knockOnLine(moveItem(date, itemId, start))),
    [date, moveItem],
  );
  const [planningGap, setPlanningGap] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Today plus the coming week, so Looking Ahead has real plans to read.
    for (let i = 0; i <= 6; i++) ensurePlan(addDays(date, i));
    refreshSuggestions();
  }, [profile, date, ensurePlan, refreshSuggestions]);

  const plan = plans[date];
  // Nothing to suggest on the first day: a pattern needs days to exist,
  // and a card asking someone to "make the change" before they have done
  // anything reads as noise.
  const firstDay = !!profile && profile.createdAt.slice(0, 10) === date;
  const openSuggestion = useMemo(
    () => (firstDay ? undefined : suggestions.find((s) => s.status === 'open')),
    [suggestions, firstDay],
  );
  // Today leaks exactly one future moment; the Plan tab owns the week.
  const lookAheadHighlight = useMemo(() => {
    if (!profile) return null;
    const entries = buildLookingAhead(date, plans, routines, profile);
    return entries.find((e) => e.kind === 'moment') ?? entries[0] ?? null;
  }, [date, plans, routines, profile]);

  const mealPlan = useAppStore((s) => s.mealPlan);
  const momentum = useMemo(() => weekMomentum(date, plans, goals), [date, plans, goals]);
  // Timings computed from the person's own logged distribution, filtered to
  // the days the pattern actually lives on. Nothing fires without a pattern.
  const interventions = useMemo(
    () => dueInterventions(behaviourIntentions, behaviourEvents, metrics, date),
    [behaviourIntentions, behaviourEvents, metrics, date],
  );
  const todayNote = useMemo(
    () => (plans[date] ? coachNote(date, plans[date].items, routines, nowMinutes()) : null),
    [date, plans, routines],
  );
  const now = nowMinutes();
  const isEvening = now >= EVENING_START;
  const tonightDinner = mealPlan?.dinners?.[weekdayOf(date)];
  const hasEveningReflection = reflections.some((r) => r.date === date && r.kind === 'evening');

  if (!profile || !plan) return <Screen tabbed />;

  const pending = plan.items.filter((i) => i.status === 'planned' && meaningful(i));
  // NOW means now: only an item whose window contains this minute. A future
  // item is never manufactured into urgency — "nothing needs you right now"
  // is a real, deliberate state.
  const nowItem =
    pending.find((i) => toMinutes(i.start) <= now && toMinutes(i.end) > now) ?? null;
  // The day's ledger: items whose window has passed, resolved or not.
  // Unresolved ones need an honest answer (the adaptation engine needs the
  // skip data as much as the user needs closure); resolved ones stay put so
  // follow-ups — like the milestone write-back — have somewhere to live.
  const overdueItems = plan.items.filter(
    (i) =>
      meaningful(i) &&
      i.id !== nowItem?.id &&
      toMinutes(i.end) <= now &&
      toMinutes(i.start) < EVENING_START,
  );
  const upcoming = pending.filter((i) => i.id !== nowItem?.id && toMinutes(i.start) > now);
  const nextItems = upcoming.filter((i) => toMinutes(i.start) < EVENING_START).slice(0, 3);
  const tonightItems = plan.items.filter(
    (i) => meaningful(i) && i.id !== nowItem?.id && toMinutes(i.start) >= EVENING_START,
  );
  const doneCount = plan.items.filter((i) => i.status === 'completed').length;
  // True only until the very first thing is ever ticked off, across every
  // day the app has planned.
  // Not memoised: it sits after an early return, and `.some()` stops at
  // the first completed item, which for anyone past their first day is the
  // first item it looks at.
  const neverCompletedAnything = !Object.values(plans).some((p) =>
    p.items.some((i) => i.status === 'completed' || i.status === 'skipped'),
  );
  const meaningfulCount = plan.items.filter(meaningful).length;
  const needsApproval = !plan.approvedAt && !isEvening;

  const nowGoal = nowItem?.goalId ? goals.find((g) => g.id === nowItem.goalId) : undefined;
  const nextUp = upcoming[0] ?? null;
  const nowTimeLabel = nowItem ? `${toMinutes(nowItem.end) - now} min left` : '';

  const scheduleGapIdea = (gapDate: string, idea: string) => {
    const target = plans[gapDate] ?? ensurePlan(gapDate);
    const dummy: PlanItem = {
      id: '',
      date: gapDate,
      start: '09:30',
      end: '11:30',
      title: idea,
      area: 'enjoyment',
      tier: 'should',
      status: 'planned',
      fixed: false,
    };
    const slot = availableStartsFor(dummy, target, profile, 4)[0] ?? '09:30';
    addPlanItem(gapDate, { title: idea, area: 'enjoyment', start: slot, durationMin: 120 });
    setPlanningGap(null);
  };

  return (
    <Screen tabbed scrollEnabled={!dragging}>
      {moveNote ? (
        <Card onPress={() => setMoveNote(null)} accessibilityLabel="Dismiss">
          <AppText variant="caption" color="textTertiary">
            {moveNote}
          </AppText>
        </Card>
      ) : null}
      <AppText variant="label" color="textTertiary">
        Today
      </AppText>
      <AppText variant="title">{formatDateLong(date)}</AppText>
      <PlusNudge />
      {momentum.done > 0 || momentum.milestonesMoved > 0 ? (
        <AppText variant="caption" color="success" style={styles.summary}>
          This week: {momentum.done} done
          {momentum.milestonesMoved > 0
            ? ` · ${momentum.milestonesMoved} milestone${momentum.milestonesMoved > 1 ? 's' : ''} moved`
            : ''}
        </AppText>
      ) : null}
      {plan.summary ? (
        <AppText variant="secondary" style={styles.summary}>
          {plan.summary}
        </AppText>
      ) : null}

      {/*
        The one thing a new person needs told, told once.

        Every row here is tappable and opens three actions, and there is no
        way to discover that by looking at it. That is exactly the gap a
        user manual exists to fill — so the app fills it instead, in a
        sentence, at the moment it is useful.

        It is derived rather than stored: it disappears the moment anything
        has ever been completed. Nobody has to dismiss it, it cannot come
        back, and there is no flag to migrate or get wrong.
      */}
      {/*
        The arbitration, said out loud.

        This one sentence is the difference between seven coaches and one
        product. Everything else in the app can be found elsewhere and done
        well; deciding that the evening goes to family rather than the gym,
        because that is the order you gave, cannot — no single-domain app
        holds enough of your life to make the call.

        Placed above the day rather than below it: it is context for what
        follows, not a footnote apologising for it.
      */}
      {displacedLine(plan.displaced ?? []) ? (
        <Card style={styles.arbitration}>
          <AppText variant="body">{displacedLine(plan.displaced ?? [])}</AppText>
          <AppText variant="caption" color="textTertiary">
            Nothing is lost — it goes back in the running tomorrow.
          </AppText>
        </Card>
      ) : null}

      {neverCompletedAnything ? (
        <Card style={styles.firstRun}>
          <AppText variant="secondary">
            Tap a row to start it, finish it or move it. Move one thing and the rest
            shuffles around it.
          </AppText>
        </Card>
      ) : null}

      {needsApproval ? (
        <Card
          onPress={() => router.push('/check-in/morning')}
          style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent, marginTop: Spacing.lg }}
          accessibilityLabel="Start your morning check-in"
        >
          <AppText variant="heading" color="accent">
            Set up your day
          </AppText>
          <AppText variant="secondary">Thirty seconds. Three priorities, one intention.</AppText>
        </Card>
      ) : null}

      {openSuggestion ? (
        <View style={styles.suggestion}>
          <SuggestionCard
            suggestion={openSuggestion}
            onAccept={() => acceptSuggestion(openSuggestion.id)}
            onDismiss={() => dismissSuggestion(openSuggestion.id)}
          />
        </View>
      ) : null}

      {/*
        The input side of the measurement architecture. Renders nothing at
        all unless something is genuinely due, which is most days.
      */}
      <CheckinCard />

      {/* Both silent on an ordinary morning, which is what makes either
          one worth reading on the morning it appears. */}
      <WelcomeBack date={date} />
      <ReadinessCard />

      <SectionHeader title="Now" color="must" />
      {nowItem ? (
        <Card style={[styles.nowCard, { borderColor: theme.accent }]}>
          <AppText variant="caption" color="textTertiary">
            {nowTimeLabel}
            {nowItem.shortenedFromMin ? ' · shortened to fit' : ''}
          </AppText>
          <AppText variant="display" style={styles.nowTitle}>
            {nowItem.title}
          </AppText>
          {nowGoal ? (
            <AppText variant="caption" color="textTertiary">
              {nowGoal.title}
            </AppText>
          ) : null}
          {nowItem.focus ? (
            <AppText variant="caption" color="accent">
              Next step: {nowItem.focus}
            </AppText>
          ) : null}
          <View style={styles.nowActions}>
            <ItemActions item={nowItem} plan={plan} profile={profile} date={date} />
          </View>
        </Card>
      ) : nextUp ? (
        /* Permission to be free — a good chief of staff doesn't manufacture urgency. */
        <Card>
          <AppText variant="heading">Nothing needs you right now.</AppText>
          <AppText variant="secondary">
            {nextUp.title} at {formatTime(nextUp.start)}.
          </AppText>
        </Card>
      ) : (
        <Card>
          <AppText variant="heading">
            {meaningfulCount === 0
              ? 'An open day.'
              : `Day complete — ${doneCount} of ${meaningfulCount} done.`}
          </AppText>
          {meaningfulCount > 0 ? (
            <AppText variant="secondary">Nothing left that needs you.</AppText>
          ) : null}
          {/* The moment someone most wants to put something on the day is
              the moment the day is clear. There was no way to. */}
          <QuickAdd date={date} profile={profile} />
        </Card>
      )}

      {!plus ? (
        <LockedSessions
          routines={applicableRoutines(routines, profile.sexAtBirth)}
          date={date}
          recoveryGoalId={recoveryGoalId}
        />
      ) : null}

      {overdueItems.length > 0 ? (
        <View>
          <SectionHeader title="Earlier — did it happen?" />
          <View style={styles.stack}>
            {overdueItems.map((item) => (
              <DragToMove
                key={item.id}
                item={item}
                profile={profile}
                enabled={!item.fixed && item.status === 'planned'}
                onDragging={setDragging}
                onDrop={(start) => dropAt(item.id, start)}
                onHold={() => {
                  setExpandedId(item.id);
                  setMoveId(item.id);
                }}
              >
                <PlanItemRow
                  item={item}
                plan={plan}
                profile={profile}
                date={date}
                expanded={expandedId === item.id}
                onToggle={() => {
                setExpandedId(expandedId === item.id ? null : item.id);
                setMoveId(null);
                }}
                moveOnOpen={moveId === item.id}
                />
              </DragToMove>
            ))}
          </View>
        </View>
      ) : null}

      {nextItems.length > 0 ? (
        <View>
          <SectionHeader title="Next" />
          <View style={styles.stack}>
            {nextItems.map((item) => (
              <DragToMove
                key={item.id}
                item={item}
                profile={profile}
                enabled={!item.fixed && item.status === 'planned'}
                onDragging={setDragging}
                onDrop={(start) => dropAt(item.id, start)}
                onHold={() => {
                  setExpandedId(item.id);
                  setMoveId(item.id);
                }}
              >
                <PlanItemRow
                  item={item}
                plan={plan}
                profile={profile}
                date={date}
                expanded={expandedId === item.id}
                onToggle={() => {
                setExpandedId(expandedId === item.id ? null : item.id);
                setMoveId(null);
                }}
                moveOnOpen={moveId === item.id}
                />
              </DragToMove>
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="Tonight" />
      {interventions.map((iv) => (
        <Card key={iv.intention.id}>
          <AppText variant="heading">
            {iv.at} — ahead of it
          </AppText>
          <AppText variant="secondary" style={styles.tonightLine}>
            {behaviourInfo(iv.intention.behaviour).label} usually lands{' '}
            {iv.pattern.window!.label}. The hour before is where the evening still bends.
          </AppText>
          {iv.pattern.coFactor ? (
            <AppText variant="caption" color="textTertiary" style={styles.tonightLine}>
              {iv.pattern.coFactor.label}.
            </AppText>
          ) : null}
          <Button
            title="Line up something else"
            variant="secondary"
            onPress={() => router.push('/session/breathe')}
            style={styles.tonightLine}
          />
        </Card>
      ))}
      {tonightDinner ? (
        <AppText variant="caption" color="textTertiary">
          Dinner is decided: {tonightDinner}
        </AppText>
      ) : null}
      <View style={styles.stack}>
        {tonightItems.map((item) => (
          <DragToMove
            key={item.id}
            item={item}
            profile={profile}
            enabled={!item.fixed && item.status === 'planned'}
            onDragging={setDragging}
            onDrop={(start) => dropAt(item.id, start)}
            onHold={() => {
              setExpandedId(item.id);
              setMoveId(item.id);
            }}
          >
            <PlanItemRow
              item={item}
            plan={plan}
            profile={profile}
            date={date}
            expanded={expandedId === item.id}
            onToggle={() => {
            setExpandedId(expandedId === item.id ? null : item.id);
            setMoveId(null);
            }}
            moveOnOpen={moveId === item.id}
            />
          </DragToMove>
        ))}
        <Card
          onPress={isEvening && !hasEveningReflection ? () => router.push('/check-in/evening') : undefined}
          accessibilityLabel="Tonight"
        >
          {plan.intention || plan.protectBehaviour ? (
            <AppText variant="body" style={styles.tonightLine}>
              {plan.intention ??
                `Protecting: ${behaviourInfo(plan.protectBehaviour!).intentionTemplate.toLowerCase()}.`}
            </AppText>
          ) : null}
          <AppText variant="secondary" color="textSecondary">
            Bed by {formatTime(profile.sleepTime)}.
          </AppText>
          {isEvening && !hasEveningReflection ? (
            <AppText variant="secondary" color="accent" style={styles.tonightLine}>
              Close the day — one minute
            </AppText>
          ) : null}
          {hasEveningReflection ? (
            <AppText variant="caption" color="textTertiary" style={styles.tonightLine}>
              Day closed. See you tomorrow.
            </AppText>
          ) : null}
        </Card>
      </View>

      {todayNote ? (
        <View style={styles.coach}>
          <AppText variant="label" color="textTertiary">
            From the coach
          </AppText>
          <AppText variant="secondary" style={styles.coachWhy}>
            {todayNote.why}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            {todayNote.upcoming ? 'Behind ' : 'Behind today’s '}
            {todayNote.itemTitle} at {todayNote.startsAt} · after the public work of{' '}
            {todayNote.attribution}
          </AppText>
        </View>
      ) : null}

      {/* Always something to do — sessions run on demand, not only when scheduled. */}
      <SectionHeader title="Any time" />
      <View style={styles.chipsRow}>
        <Chip label="Breathe" onPress={() => router.push('/session/breathe' as never)} />
        <Chip label="Journal" onPress={() => router.push('/session/journal' as never)} />
        <Chip label="Plan meals" onPress={() => router.push('/session/meals' as never)} />
        <Chip label="Meditate" onPress={() => router.push('/session/meditate' as never)} />
        <Chip label="Train" onPress={() => router.push('/session/workout' as never)} />
      </View>

      {/* And the other direction: recording what already happened. The
          chips cover the eight common habits in one tap; anything else —
          including your own routines — goes through the fuller entry
          below, because the day has to be able to hold what actually
          happened and not only what IntentNorth suggested. */}
      <SectionHeader title="Already done" />
      <QuickLog />
      <View style={styles.didIt}>
        <LogDidIt date={date} />
      </View>

      {lookAheadHighlight ? (
        /* One emotionally useful future moment — Plan owns the full week. */
        <Pressable
          accessibilityRole={lookAheadHighlight.kind === 'gap' ? 'button' : undefined}
          onPress={
            lookAheadHighlight.kind === 'gap'
              ? () =>
                  setPlanningGap(
                    planningGap === lookAheadHighlight.date ? null : lookAheadHighlight.date,
                  )
              : undefined
          }
          style={styles.aheadLine}
        >
          <AppText variant="label" color={lookAheadHighlight.kind === 'gap' ? 'textTertiary' : 'accent'}>
            {lookAheadHighlight.when} · {lookAheadHighlight.kind === 'gap' ? 'wide open' : 'something to look forward to'}
          </AppText>
          <AppText variant="heading" style={styles.aheadTitle}>
            {lookAheadHighlight.kind === 'gap'
              ? 'Yours to spend — want to put something in it?'
              : `${lookAheadHighlight.title}${lookAheadHighlight.start ? ` · ${formatTime(lookAheadHighlight.start)}` : ''}`}
          </AppText>
          {planningGap === lookAheadHighlight.date ? (
            <View style={styles.ideaChips}>
              {ideasFor(profile).map((idea) => (
                <Chip
                  key={idea}
                  label={idea}
                  onPress={() => scheduleGapIdea(lookAheadHighlight.date, idea)}
                />
              ))}
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  didIt: { marginTop: Spacing.md },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  coach: { marginTop: Spacing.xl, gap: Spacing.xs },
  coachWhy: { fontStyle: 'italic' },
  summary: { marginTop: Spacing.xs },
  firstRun: { marginTop: Spacing.lg },
  arbitration: { marginTop: Spacing.lg, gap: Spacing.xs },
  suggestion: { marginTop: Spacing.lg },
  stack: { gap: Spacing.sm },
  nowCard: { borderWidth: 1.5, padding: Spacing.xl },
  nowTitle: { fontSize: 28, lineHeight: 34, marginTop: 2 },
  nowActions: { marginTop: Spacing.lg },
  tonightLine: { marginBottom: Spacing.xs },
  aheadLine: { marginTop: Spacing.xl, gap: Spacing.xs },
  aheadTitle: { fontWeight: '600' },
  ideaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
});
