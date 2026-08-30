import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SuggestionCard } from '@/components/suggestion-card';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { availableStartsFor } from '@/features/planner/generate';
import { PlanItemRow } from '@/features/today/plan-item-row';
import {
  addDays,
  dateKeyToDate,
  formatDateLong,
  formatTime,
  nowMinutes,
  todayKey,
  toMinutes,
} from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { PlanItem } from '@/types/domain';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Today behaves like a chief of staff: what matters now, what's next, and
 * nothing that demands a decision the plan already made.
 */
export default function Today() {
  const router = useRouter();
  const theme = useTheme();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const moveItem = useAppStore((s) => s.moveItem);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);
  const reflections = useAppStore((s) => s.reflections);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [moveTargetId, setMoveTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Today plus the coming week, so relationship/family items are visible.
    for (let i = 0; i <= 6; i++) ensurePlan(addDays(date, i));
    refreshSuggestions();
  }, [profile, date, ensurePlan, refreshSuggestions]);

  const plan = plans[date];
  const openSuggestion = useMemo(
    () => suggestions.find((s) => s.status === 'open'),
    [suggestions],
  );

  const now = nowMinutes();
  const isEvening = now >= 17 * 60;
  const hasEveningReflection = reflections.some((r) => r.date === date && r.kind === 'evening');

  const comingUp = useMemo(() => {
    // Only the special moments — daily anchors (dinner, wind-down) are noise here.
    const everyday = new Set(
      routines.filter((r) => r.days.length >= 6).map((r) => r.id),
    );
    const seen = new Set<string>();
    const upcoming: { weekday: string; item: PlanItem }[] = [];
    for (let i = 1; i <= 6 && upcoming.length < 3; i++) {
      const d = addDays(date, i);
      const items = plans[d]?.items ?? [];
      const highlight = items.find(
        (it) =>
          !it.fixed &&
          !seen.has(it.title) &&
          !(it.routineId && everyday.has(it.routineId)) &&
          (it.area === 'relationship' || it.area === 'family' || it.area === 'enjoyment'),
      );
      if (highlight) {
        seen.add(highlight.title);
        upcoming.push({ weekday: WEEKDAYS[dateKeyToDate(d).getDay()], item: highlight });
      }
    }
    return upcoming;
  }, [plans, routines, date]);

  if (!profile || !plan) return <Screen tabbed />;

  const pending = plan.items.filter((i) => i.status === 'planned');
  const nowItem = pending.find((i) => toMinutes(i.end) > now) ?? null;
  const nextItem = pending.find((i) => i.id !== nowItem?.id && toMinutes(i.start) >= (nowItem ? toMinutes(nowItem.end) : now)) ?? null;
  const rest = plan.items.filter((i) => i.id !== nowItem?.id && i.id !== nextItem?.id);
  const doneCount = plan.items.filter((i) => i.status === 'completed').length;
  const needsApproval = !plan.approvedAt && !isEvening;

  const focusCard = (item: PlanItem, label: 'Now' | 'Next') => {
    const started = toMinutes(item.start) <= now;
    const slots = moveTargetId === item.id ? availableStartsFor(item, plan, profile) : [];
    return (
      <View key={item.id}>
        <SectionHeader title={label} color={label === 'Now' ? 'must' : 'textTertiary'} />
        <Card>
          <AppText variant="caption" color="textTertiary">
            {formatTime(item.start)} – {formatTime(item.end)}
            {label === 'Now' && !started ? ' · coming up' : ''}
          </AppText>
          <AppText variant="heading" style={styles.focusTitle}>
            {item.title}
          </AppText>
          {moveTargetId === item.id ? (
            <View style={styles.slots}>
              {slots.map((slot) => (
                <Chip
                  key={slot}
                  label={formatTime(slot)}
                  onPress={() => {
                    setMoveTargetId(null);
                    moveItem(date, item.id, slot);
                  }}
                />
              ))}
              <Chip label="Cancel" onPress={() => setMoveTargetId(null)} />
            </View>
          ) : (
            <View style={styles.focusActions}>
              <Button title="Done" onPress={() => setItemStatus(date, item.id, 'completed')} style={styles.grow} />
              <Button title="Skip" variant="ghost" onPress={() => setItemStatus(date, item.id, 'skipped')} />
              {!item.fixed ? (
                <Button title="Move" variant="secondary" onPress={() => setMoveTargetId(item.id)} />
              ) : null}
            </View>
          )}
        </Card>
      </View>
    );
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

      {nowItem ? (
        focusCard(nowItem, 'Now')
      ) : (
        <View>
          <SectionHeader title="Now" />
          <Card>
            <AppText variant="heading">
              {plan.items.length === 0
                ? 'An open day.'
                : `Day complete — ${doneCount} of ${plan.items.length} done.`}
            </AppText>
            {plan.items.length > 0 ? (
              <AppText variant="secondary">Nothing left that needs you. Enjoy it.</AppText>
            ) : null}
          </Card>
        </View>
      )}
      {nextItem ? focusCard(nextItem, 'Next') : null}

      {rest.length > 0 ? (
        <View>
          <SectionHeader title="Rest of today" />
          <View style={styles.stack}>
            {rest.map((item) => (
              <PlanItemRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                moveSlots={expandedId === item.id ? availableStartsFor(item, plan, profile) : []}
                onMove={(slot) => {
                  moveItem(date, item.id, slot);
                  setExpandedId(null);
                }}
                onStatus={(status) => {
                  setItemStatus(date, item.id, status);
                  setExpandedId(null);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {plan.intention || plan.protectBehaviour ? (
        <View>
          <SectionHeader title="Intention" />
          <Card>
            {plan.intention ? <AppText variant="heading">{plan.intention}</AppText> : null}
            {plan.protectBehaviour ? (
              <AppText variant="secondary" style={plan.intention ? styles.spaced : undefined}>
                Protecting: {behaviourInfo(plan.protectBehaviour).intentionTemplate.toLowerCase()}.
              </AppText>
            ) : null}
          </Card>
        </View>
      ) : null}

      {comingUp.length > 0 ? (
        <View>
          <SectionHeader title="Coming up" />
          <Card>
            {comingUp.map(({ weekday, item }) => (
              <View key={item.id} style={styles.upcomingRow}>
                <AppText variant="secondary" color="textTertiary" style={styles.upcomingDay}>
                  {weekday}
                </AppText>
                <AppText variant="body" style={styles.grow}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color="textTertiary">
                  {formatTime(item.start)}
                </AppText>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <SectionHeader title="Tonight" />
      <Card
        onPress={isEvening && !hasEveningReflection ? () => router.push('/check-in/evening') : undefined}
        accessibilityLabel="Evening"
      >
        <AppText variant="body">Aim for bed by {formatTime(profile.sleepTime)}.</AppText>
        {isEvening && !hasEveningReflection ? (
          <AppText variant="secondary" color="accent" style={styles.spaced}>
            Close the day — one-minute reflection
          </AppText>
        ) : null}
        {hasEveningReflection ? (
          <AppText variant="caption" color="textTertiary" style={styles.spaced}>
            Reflection done. See you tomorrow.
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: Spacing.xs },
  suggestion: { marginTop: Spacing.lg },
  stack: { gap: Spacing.sm },
  spaced: { marginTop: Spacing.sm },
  focusTitle: { marginTop: 2 },
  focusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  grow: { flex: 1 },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  upcomingDay: { width: 82 },
});
