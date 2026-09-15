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
import { coachNote } from '@/features/today/coach';
import { availableStartsFor } from '@/features/planner/generate';
import { ItemActions } from '@/features/today/item-actions';
import { PlanItemRow } from '@/features/today/plan-item-row';
import { QuickAdd } from '@/features/today/QuickAdd';
import {
  addDays,
  dateKeyOfIso,
  durationMinutes,
  formatDateLong,
  formatTime,
  nowMinutes,
  todayKey,
  toMinutes,
  weekdayOf,
  weekStartOf,
} from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { LogCardio } from '@/features/training/LogCardio';
import { LogDidIt } from '@/features/today/LogDidIt';
import { WelcomeBack } from '@/features/today/WelcomeBack';
import { WhyToday } from '@/features/today/WhyToday';
import { BudgetCard } from '@/features/budget/BudgetCard';
import { TrialReview } from '@/features/knowledge/TrialReview';
import { commitmentBudget, mayOffer } from '@/features/budget/commitment';
import { nextInterrupt } from '@/features/coaches/interrupt';
import { nextRitual, statedPurpose } from '@/features/cadence/rituals';
import { nextCheckin } from '@/features/checkins/due';
import { dueExperiments } from '@/features/knowledge/experiments';
import { readinessFrom } from '@/features/health/readiness';
import { DEBT_SHOW_H, sleepDebt } from '@/features/health/sleepDebt';
import { returnSummary } from '@/features/today/returning';
import { distinctWeeks } from '@/features/paths/level';
import { claimAttention, shows, waiting } from '@/features/today/attention';
import { RitualCard } from '@/features/cadence/RitualCard';
import { displacedLine } from '@/features/planner/displaced';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';
import { LockedSessions } from '@/features/plus/LockedSessions';
import { freeCoachArea } from '@/features/plus/entitlement';
import { PlusNudge } from '@/features/plus/PlusNudge';
import { TonightCard } from '@/features/behaviours/TonightCard';
import { applicableRoutines } from '@/features/knowledge/protocols';
import { DragToMove } from '@/features/today/DragToMove';
import { knockOnLine } from '@/features/today/dragMath';

const EVENING_START = 17 * 60;

/**
 * How long a block stays startable after its window closes, in minutes.
 *
 * An hour, because that is roughly the span in which "I am running late"
 * is still true and "did it happen?" is still rude. Past it, the day has
 * moved on and the honest thing is to ask.
 */
const OVERDUE_GRACE_MIN = 60;

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
  // The coach that runs free, from their own top priority — see
  // entitlement.freeCoachArea for why one has to run without paying, and
  // why it is keyed on the area rather than on a started pathway.
  const freeArea = profile ? freeCoachArea(profile.priorities) : undefined;
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
  const previousOpenAt = useAppStore((s) => s.previousOpenAt);
  // Read here rather than inside each card, so the arbiter below can ask
  // the same questions the cards ask without mounting them.
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const rituals = useAppStore((s) => s.rituals);
  const experiments = useAppStore((s) => s.experiments);
  const dismissedCheckins = useAppStore((s) => s.dismissedCheckins);
  const plusNudgeDismissedAt = useAppStore((s) => s.plusNudgeDismissedAt);

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
  const firstDay = !!profile && dateKeyOfIso(profile.createdAt) === date;
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
  // Timings computed from the person's own logged distribution, filtered to
  // the days the pattern actually lives on. Nothing fires without a pattern.
  const interventions = useMemo(
    () => dueInterventions(behaviourIntentions, behaviourEvents, metrics, date),
    [behaviourIntentions, behaviourEvents, metrics, date],
  );
  /*
    How much new is reasonable this week.

    Every signal here already existed and was read by a different feature
    for a different purpose — adherence for the weekly report, moves for
    learned placement, sleep for auto-regulation, capacity for plan size.
    This is where they become one decision, which had been getting made
    implicitly, by default, as "offer all of it".
  */
  const budget = useMemo(
    () =>
      commitmentBudget({
        routines,
        plans,
        metrics,
        profile: profile ?? null,
        lastOpenedAt: previousOpenAt,
        today: date,
      }),
    [routines, plans, metrics, profile, previousOpenAt, date],
  );

  /*
    A coach with something to say.

    The sketch is explicit that an interruption is a full screen rather
    than a card: a card is something you scroll past. It is recorded the
    moment it appears, so backing out of it does not re-trap you the next
    time Today mounts, and `nextInterrupt` returns at most one. See
    features/coaches/interrupt.ts.

    Never on the first day. A coach that interrupts somebody before it has
    watched them do anything is guessing out loud.
  */
  const coachInterruptLog = useAppStore((s) => s.coachInterrupts);
  const seeInterrupt = useAppStore((s) => s.seeInterrupt);
  const interrupt = useMemo(
    () =>
      firstDay || !plan
        ? null
        : nextInterrupt({
            routines,
            plans,
            metrics,
            profile: profile ?? null,
            budget,
            today: date,
            nowMinutes: nowMinutes(),
            seen: coachInterruptLog,
          }),
     
    [firstDay, plan, routines, plans, metrics, profile, budget, date, coachInterruptLog],
  );

  useEffect(() => {
    if (!interrupt) return;
    seeInterrupt(interrupt.id);
    router.push(`/coach/interrupt?id=${encodeURIComponent(interrupt.id)}` as never);
  }, [interrupt, seeInterrupt, router]);

  const todayNote = useMemo(
    () => (plans[date] ? coachNote(date, plans[date].items, routines, nowMinutes()) : null),
    [date, plans, routines],
  );
  const now = nowMinutes();
  const isEvening = now >= EVENING_START;
  const tonightDinner = mealPlan?.dinners?.[weekdayOf(date)];
  const hasEveningReflection = reflections.some((r) => r.date === date && r.kind === 'evening');

  /*
    One job, and one thing asking for it.

    Eleven blocks could render here at once, each silent most days, so
    nobody building one ever saw four of them fire together — and on the
    morning they did, the screen answered "what now?" fifth. Every
    condition below is the same pure function the block itself uses, so a
    slot is never claimed by something that then renders nothing.

    See features/today/attention.ts for the order and the reasoning.
  */
  const available = useMemo(() => {
    const goalTitles = goals.filter((g) => g.status === 'active').map((g) => g.title);
    const debt = sleepDebt(metrics);
    return {
      welcomeBack: Boolean(
        returnSummary({
          lastOpenedAt: previousOpenAt,
          sessionsLogged: workoutLogs.filter((l) => l.sets.length > 0).length,
          weeksLogged: distinctWeeks(
            workoutLogs.filter((l) => l.sets.length > 0).map((l) => l.date),
          ),
          today: plans[date],
        }),
      ),
      setupDay: Boolean(plans[date]) && !plans[date]?.approvedAt && !isEvening,
      readiness: Boolean(readinessFrom(metrics)) || Boolean(debt && debt.debtH >= DEBT_SHOW_H),
      ritual: Boolean(
        nextRitual(date, rituals, goalTitles) ??
          statedPurpose('week-setup', weekStartOf(date), rituals) ??
          statedPurpose('month-setup', date.slice(0, 7), rituals),
      ),
      trial: dueExperiments(experiments, date).length > 0,
      checkin: Boolean(nextCheckin(goals, metrics, dismissedCheckins)),
      plus: !plus && !plusNudgeDismissedAt && !firstDay,
      budget: budget.state !== 'stable',
      suggestion: Boolean(openSuggestion) && mayOffer(budget),
    };
  }, [
    goals,
    metrics,
    previousOpenAt,
    workoutLogs,
    plans,
    date,
    isEvening,
    rituals,
    experiments,
    dismissedCheckins,
    plus,
    plusNudgeDismissedAt,
    firstDay,
    budget,
    openSuggestion,
  ]);
  const claimed = claimAttention(available);
  const heldBack = waiting(available);

  if (!profile || !plan) return <Screen tabbed />;

  const pending = plan.items.filter((i) => i.status === 'planned' && meaningful(i));
  // NOW means now: only an item whose window contains this minute. A future
  // item is never manufactured into urgency — "nothing needs you right now"
  // is a real, deliberate state.
  const nowItem =
    // Measured by length, not by the end time: a block that ends at
    // midnight has an end of 00:00, which is never after now.
    pending.find(
      (i) => toMinutes(i.start) <= now && toMinutes(i.start) + durationMinutes(i.start, i.end) > now,
    ) ?? null;
  // The day's ledger: items whose window has passed, resolved or not.
  // Unresolved ones need an honest answer (the adaptation engine needs the
  // skip data as much as the user needs closure); resolved ones stay put so
  // follow-ups — like the milestone write-back — have somewhere to live.
  const pastWindow = plan.items.filter(
    (i) =>
      meaningful(i) &&
      i.id !== nowItem?.id &&
      toMinutes(i.end) <= now &&
      toMinutes(i.start) < EVENING_START,
  );
  /**
   * A thing you can still do is not a thing to account for.
   *
   * Isaac, on his own phone at 7:00am, looking at a 6:40am habit: "what
   * does this mean?" The block had run out of its window ten minutes
   * earlier and the app had already moved it under "EARLIER — DID IT
   * HAPPEN?", at the top of the screen, with a Start button underneath.
   * Past tense in the header and a present-tense action in the card.
   *
   * There is no honest reason a ten-minute practice at 6:40 is a matter of
   * record at 6:51. So a block that has only just slipped stays a block:
   * it keeps its actions and says it is still open. It becomes a ledger
   * question once the day has genuinely moved on.
   *
   * The card sitting under that header said, in its own evidence line,
   * "missing one day did not measurably set people back". The app should
   * not be harder on somebody than the research it is quoting at them.
   */
  const slippedItems = pastWindow.filter(
    (i) => i.status === 'planned' && now - toMinutes(i.end) < OVERDUE_GRACE_MIN,
  );
  const slipped = new Set(slippedItems.map((i) => i.id));
  const overdueItems = pastWindow.filter((i) => !slipped.has(i.id));
  const upcoming = pending.filter((i) => i.id !== nowItem?.id && toMinutes(i.start) > now);
  const nextItems = upcoming.filter((i) => toMinutes(i.start) < EVENING_START).slice(0, 3);
  const tonightItems = plan.items.filter(
    (i) => meaningful(i) && i.id !== nowItem?.id && toMinutes(i.start) >= EVENING_START,
  );
  const doneCount = plan.items.filter((i) => i.status === 'completed').length;
  // Items whose window has passed with no answer either way. The day is
  // not "complete" while these are sitting there being asked about.
  const unresolvedCount = overdueItems.filter((i) => i.status === 'planned').length;
  // The tap-a-row hint is only true when there is a row. On a free day, or
  // on the free tier where the sessions are shown locked, it pointed at
  // nothing and read as a bug.
  const hasTappableRow =
    !!nowItem ||
    slippedItems.length > 0 ||
    overdueItems.length > 0 ||
    nextItems.length > 0 ||
    tonightItems.length > 0;
  // True only until the very first thing is ever ticked off, across every
  // day the app has planned.
  // Not memoised: it sits after an early return, and `.some()` stops at
  // the first completed item, which for anyone past their first day is the
  // first item it looks at.
  const neverCompletedAnything = !Object.values(plans).some((p) =>
    p.items.some((i) => i.status === 'completed' || i.status === 'skipped'),
  );
  const meaningfulCount = plan.items.filter(meaningful).length;

  const nowGoal = nowItem?.goalId ? goals.find((g) => g.id === nowItem.goalId) : undefined;
  const nextUp = upcoming[0] ?? null;
  const nowTimeLabel = nowItem ? `${toMinutes(nowItem.end) - now} min left` : '';

  /** One section, rendered in one of two places. Never both. */
  const anyTime = (
    <View>
      <SectionHeader title="Any time" />
      <View style={styles.chipsRow}>
        <Chip label="Breathe" onPress={() => router.push('/session/breathe' as never)} />
        <Chip label="Journal" onPress={() => router.push('/session/journal' as never)} />
        <Chip label="Meditate" onPress={() => router.push('/session/meditate' as never)} />
        <Chip label="Plan meals" onPress={() => router.push('/session/meals' as never)} />
        <Chip label="Train" onPress={() => router.push('/session/workout' as never)} />
      </View>
    </View>
  );

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
      {plan.summary ? (
        <AppText variant="secondary" style={styles.summary}>
          {plan.summary}
        </AppText>
      ) : null}

      {/*
        The one interruption, chosen by features/today/attention.ts.

        Everything from here to the "Now" header used to render together,
        all of it good and none of it aware of the others. What the week
        has done so far went with them: it is the week's business, and the
        Week tab and the end-of-week grid both report it properly.
      */}
      {shows(claimed, 'setupDay') ? (
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

      {shows(claimed, 'ritual') ? <RitualCard /> : null}

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
          {/*
            "Complete" has to mean complete.

            This branch fires whenever nothing is running and nothing is
            still ahead — which includes the evening of a day whose items
            came and went untouched. It used to say "Day complete — 0 of 1
            done. Nothing left that needs you." directly above an "Earlier
            — did it happen?" section asking about that very item. Two
            blocks on one screen, contradicting each other, and the one in
            the larger type was the one that was wrong.

            Nothing here scolds. An unanswered day is reported as
            unanswered, which is also the honest prompt for the section
            below it.
          */}
          <AppText variant="heading">
            {meaningfulCount === 0
              ? 'An open day.'
              : unresolvedCount > 0
                ? `${doneCount} of ${meaningfulCount} done.`
                : `Day complete — ${doneCount} of ${meaningfulCount} done.`}
          </AppText>
          {meaningfulCount > 0 ? (
            <AppText variant="secondary">
              {unresolvedCount > 0
                ? `${unresolvedCount} ${unresolvedCount === 1 ? 'thing is' : 'things are'} still unanswered below.`
                : 'Nothing left that needs you.'}
            </AppText>
          ) : null}
          {/* The moment someone most wants to put something on the day is
              the moment the day is clear. There was no way to. */}
          <QuickAdd date={date} profile={profile} />
        </Card>
      )}

      {/*
        The one thing a new person needs told, told once.

        Every row here is tappable and opens three actions, and there is no
        way to discover that by looking at it. That is exactly the gap a
        user manual exists to fill — so the app fills it instead, in a
        sentence, at the moment it is useful.

        It is derived rather than stored: it disappears the moment anything
        has ever been completed. Nobody has to dismiss it, it cannot come
        back, and there is no flag to migrate or get wrong.

        It sits directly under the row it is about, rather than three cards
        above it, because an instruction the reader has to hold in their
        head until they scroll to the thing is not an instruction.
      */}
      {neverCompletedAnything && hasTappableRow ? (
        <Card style={styles.firstRun}>
          <AppText variant="secondary">
            Tap a row to start it, finish it or move it. Move one thing and the rest
            shuffles around it.
          </AppText>
        </Card>
      ) : null}

      {/* What the plan did with today, in one line that opens. Below the
          current action rather than above it: the screen answers "what
          now?" first and "what did the system decide?" second. */}
      <WhyToday displaced={displacedLine(plan.displaced ?? [])} energyNote={plan.energyNote} />

      {/* The rest of the one interruption. Each of these is gated on the
          same condition it uses internally, so a claimed slot is never a
          blank one. */}
      {shows(claimed, 'budget') ? <BudgetCard budget={budget} /> : null}
      {shows(claimed, 'trial') ? <TrialReview /> : null}
      {shows(claimed, 'suggestion') && openSuggestion ? (
        <View style={styles.suggestion}>
          <SuggestionCard
            suggestion={openSuggestion}
            onAccept={() => acceptSuggestion(openSuggestion.id)}
            onDismiss={() => dismissSuggestion(openSuggestion.id)}
          />
        </View>
      ) : null}
      {shows(claimed, 'checkin') ? <CheckinCard /> : null}
      {shows(claimed, 'welcomeBack') ? <WelcomeBack date={date} /> : null}
      {shows(claimed, 'readiness') ? <ReadinessCard /> : null}
      {shows(claimed, 'plus') ? <PlusNudge firstDay={firstDay} /> : null}

      {/* Said once, in a caption, rather than swallowed. Nobody gets a
          badge with a number on it, and nothing is lost — whatever was
          behind today's winner claims the slot on a day when nothing above
          it does. */}
      {heldBack > 0 ? (
        <AppText variant="caption" color="textTertiary" style={styles.summary}>
          {heldBack === 1 ? 'One more thing' : `${heldBack} more things`} to look at, tomorrow.
        </AppText>
      ) : null}

      {/* After eight, the reset comes before everything else on the page:
          at 9pm it was five sections down, two screens on a small phone,
          which is not "two taps to the breath reset". The whole section
          MOVES rather than splitting — the evening used to hoist three of
          these chips to the top and leave a second header lower down for
          the other two, so one idea carried two headings. */}
      {isEvening ? anyTime : null}

      {!plus ? (
        <LockedSessions
          routines={applicableRoutines(routines, profile.sexAtBirth)}
          date={date}
          recoveryGoalId={recoveryGoalId}
          freeArea={freeArea}
        />
      ) : null}

      {/*
        The ledger moved to the end of the day, where it belongs.

        This was a second copy of the day's items, in the same rows with
        the same three actions, asking the same question the end-of-day
        review asks with a grid — and the review does it in three taps
        against every item at once, not one row at a time on a screen whose
        job is what to do NOW. So Today points at it and stops carrying it.

        "Still open" below stays: those are inside the grace window and are
        genuinely still doable, which is a different thing from a ledger.
      */}
      {overdueItems.length > 0 ? (
        <Card
          onPress={() => router.push('/review/day' as never)}
          accessibilityLabel="Close the day"
          style={styles.firstRun}
        >
          <AppText variant="heading">
            {overdueItems.length === 1
              ? 'One thing from earlier'
              : `${overdueItems.length} things from earlier`}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            Mark them off in one go when you close the day.
          </AppText>
        </Card>
      ) : null}

      {/* Just slipped, still yours to do. Above Next, because it is the
          nearest thing in time and the one most likely to still happen. */}
      {slippedItems.length > 0 ? (
        <View>
          <SectionHeader title="Still open" />
          <View style={styles.stack}>
            {slippedItems.map((item) => (
              <DragToMove
                key={item.id}
                item={item}
                profile={profile}
                enabled={!item.fixed}
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
      {/* The named habit's own card, from day one: the if-then plan, the
          wins so far, and the next hour if tonight goes wrong. Renders
          nothing when there is no active intention. */}
      <TonightCard date={date} />
      {interventions.map((iv) => (
        <Card key={iv.intention.id}>
          <AppText variant="heading">
            {formatTime(iv.at)} — ahead of it
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
            onPress={() => router.push('/session/breathe?urge=1' as never)}
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
          onPress={isEvening && !hasEveningReflection ? () => router.push('/review/day') : undefined}
          accessibilityLabel="Tonight"
        >
          {plan.intention ? (
            // Labelled: on its own, the morning's intention read as a
            // stray sentence under "Tonight".
            <AppText variant="caption" color="textTertiary">
              Your intention for today
            </AppText>
          ) : null}
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
            {todayNote.itemTitle} at {todayNote.startsAt} · {todayNote.attribution}
          </AppText>
        </View>
      ) : null}

      {isEvening ? null : anyTime}

      {/*
        And the other direction: recording what already happened.

        The 56-chip habit wall moved to the end-of-day review, where it is
        what the "+" column opens — "I did something else" is the most-used
        answer in any honest review, and it belongs beside the question
        rather than four screens down a page whose job is what to do now.

        Two entries stay here, because both are things somebody wants to
        record in the moment rather than at nine at night: a run, which
        needs its distance and effort while they remember them, and the
        general one, which is the escape hatch for everything the plan did
        not contain.
      */}
      <SectionHeader title="Already done" />
      <View style={styles.didIt}>
        <LogDidIt date={date} />
      </View>
      {/* Cardio is its own entry rather than a title in the general one:
          a run without its distance and its effort is a list of the word
          "Run", and six months of that tells nobody anything. */}
      <View style={styles.didIt}>
        <LogCardio date={date} />
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
