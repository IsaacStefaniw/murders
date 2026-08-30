import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SuggestionCard } from '@/components/suggestion-card';
import { Spacing } from '@/constants/theme';
import { buildLookingAhead, ideasFor } from '@/features/anticipation/lookAhead';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { availableStartsFor } from '@/features/planner/generate';
import { ItemActions } from '@/features/today/item-actions';
import { PlanItemRow } from '@/features/today/plan-item-row';
import {
  addDays,
  formatDateLong,
  formatTime,
  nowMinutes,
  todayKey,
  toMinutes,
} from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';

const EVENING_START = 17 * 60;

/** Items worth a person's attention — generic work blocks are calendar noise. */
const meaningful = (i: PlanItem) => i.title !== 'Work';

export default function Today() {
  const router = useRouter();
  const theme = useTheme();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const routines = useAppStore((s) => s.routines);
  const goals = useAppStore((s) => s.goals);
  const plans = useAppStore((s) => s.plans);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const addPlanItem = useAppStore((s) => s.addPlanItem);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);
  const reflections = useAppStore((s) => s.reflections);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [planningGap, setPlanningGap] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Today plus the coming week, so Looking Ahead has real plans to read.
    for (let i = 0; i <= 6; i++) ensurePlan(addDays(date, i));
    refreshSuggestions();
  }, [profile, date, ensurePlan, refreshSuggestions]);

  const plan = plans[date];
  const openSuggestion = useMemo(() => suggestions.find((s) => s.status === 'open'), [suggestions]);
  const lookingAhead = useMemo(
    () => (profile ? buildLookingAhead(date, plans, routines, profile) : []),
    [date, plans, routines, profile],
  );

  const now = nowMinutes();
  const isEvening = now >= EVENING_START;
  const hasEveningReflection = reflections.some((r) => r.date === date && r.kind === 'evening');

  if (!profile || !plan) return <Screen tabbed />;

  const pending = plan.items.filter((i) => i.status === 'planned' && meaningful(i));
  const nowItem = pending.find((i) => toMinutes(i.end) > now) ?? null;
  const nextItems = pending
    .filter((i) => i.id !== nowItem?.id && toMinutes(i.start) < EVENING_START && toMinutes(i.start) >= now)
    .slice(0, 3);
  const tonightItems = plan.items.filter(
    (i) => meaningful(i) && i.id !== nowItem?.id && toMinutes(i.start) >= EVENING_START,
  );
  const doneCount = plan.items.filter((i) => i.status === 'completed').length;
  const meaningfulCount = plan.items.filter(meaningful).length;
  const needsApproval = !plan.approvedAt && !isEvening;

  const nowGoal = nowItem?.goalId ? goals.find((g) => g.id === nowItem.goalId) : undefined;
  const nowStarted = nowItem ? toMinutes(nowItem.start) <= now : false;
  const nowTimeLabel = nowItem
    ? nowStarted
      ? `${toMinutes(nowItem.end) - now} min left`
      : toMinutes(nowItem.start) - now <= 120
        ? `in ${toMinutes(nowItem.start) - now} min`
        : `${formatTime(nowItem.start)} – ${formatTime(nowItem.end)}`
    : '';

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
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Today
      </AppText>
      <AppText variant="title">{formatDateLong(date)}</AppText>
      {plan.summary ? (
        <AppText variant="secondary" style={styles.summary}>
          {plan.summary}
        </AppText>
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
          <View style={styles.nowActions}>
            <ItemActions item={nowItem} plan={plan} profile={profile} date={date} />
          </View>
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
        </Card>
      )}

      {nextItems.length > 0 ? (
        <View>
          <SectionHeader title="Next" />
          <View style={styles.stack}>
            {nextItems.map((item) => (
              <PlanItemRow
                key={item.id}
                item={item}
                plan={plan}
                profile={profile}
                date={date}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="Tonight" />
      <View style={styles.stack}>
        {tonightItems.map((item) => (
          <PlanItemRow
            key={item.id}
            item={item}
            plan={plan}
            profile={profile}
            date={date}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          />
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

      {lookingAhead.length > 0 ? (
        <View>
          <SectionHeader title="Looking ahead" />
          <Card>
            {lookingAhead.map((entry) => (
              <View key={entry.key}>
                <Pressable
                  accessibilityRole={entry.kind === 'gap' ? 'button' : undefined}
                  onPress={
                    entry.kind === 'gap'
                      ? () => setPlanningGap(planningGap === entry.date ? null : entry.date)
                      : undefined
                  }
                  style={styles.aheadRow}
                >
                  <AppText variant="secondary" color="textTertiary" style={styles.aheadDay}>
                    {entry.when}
                  </AppText>
                  <AppText
                    variant="body"
                    style={[styles.grow, entry.kind === 'gap' && { color: theme.textSecondary }]}
                  >
                    {entry.kind === 'gap' ? `${entry.title} — plan something?` : entry.title}
                  </AppText>
                  {entry.start ? (
                    <AppText variant="caption" color="textTertiary">
                      {formatTime(entry.start)}
                    </AppText>
                  ) : null}
                </Pressable>
                {planningGap === entry.date ? (
                  <View style={styles.ideaChips}>
                    {ideasFor(profile).map((idea) => (
                      <Chip key={idea} label={idea} onPress={() => scheduleGapIdea(entry.date, idea)} />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: Spacing.xs },
  suggestion: { marginTop: Spacing.lg },
  stack: { gap: Spacing.sm },
  nowCard: { borderWidth: 1.5, padding: Spacing.xl },
  nowTitle: { fontSize: 28, lineHeight: 34, marginTop: 2 },
  nowActions: { marginTop: Spacing.lg },
  tonightLine: { marginBottom: Spacing.xs },
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  aheadDay: { width: 96 },
  grow: { flex: 1 },
  ideaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
});
