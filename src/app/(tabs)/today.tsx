import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SuggestionCard } from '@/components/suggestion-card';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { PlanItemRow } from '@/features/today/plan-item-row';
import { formatDateLong, formatTime, nowMinutes, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { PlanTier } from '@/types/domain';

const TIERS: { tier: PlanTier; label: string; color: 'must' | 'should' | 'could' }[] = [
  { tier: 'must', label: 'Must', color: 'must' },
  { tier: 'should', label: 'Should', color: 'should' },
  { tier: 'could', label: 'Could', color: 'could' },
];

export default function Today() {
  const router = useRouter();
  const theme = useTheme();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plans[date]);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);
  const refreshSuggestions = useAppStore((s) => s.refreshSuggestions);
  const reflections = useAppStore((s) => s.reflections);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      ensurePlan(date);
      refreshSuggestions();
    }
  }, [profile, date, ensurePlan, refreshSuggestions]);

  const openSuggestion = useMemo(
    () => suggestions.find((s) => s.status === 'open'),
    [suggestions],
  );
  const isEvening = nowMinutes() >= 17 * 60;
  const hasEveningReflection = reflections.some((r) => r.date === date && r.kind === 'evening');

  if (!profile || !plan) return <Screen tabbed />;

  const needsApproval = !plan.approvedAt && !isEvening;

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

      {TIERS.map(({ tier, label, color }) => {
        const items = plan.items.filter((i) => i.tier === tier);
        if (items.length === 0) return null;
        return (
          <View key={tier}>
            <SectionHeader title={label} color={color} />
            <View style={styles.stack}>
              {items.map((item) => (
                <PlanItemRow
                  key={item.id}
                  item={item}
                  expanded={expandedId === item.id}
                  onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  onStatus={(status) => {
                    setItemStatus(date, item.id, status);
                    setExpandedId(null);
                  }}
                />
              ))}
            </View>
          </View>
        );
      })}

      {plan.intention || plan.protectBehaviour ? (
        <View>
          <SectionHeader title="Intention" />
          <Card>
            {plan.intention ? <AppText variant="heading">{plan.intention}</AppText> : null}
            {plan.protectBehaviour ? (
              <AppText variant="secondary" style={plan.intention ? styles.protect : undefined}>
                Protecting: {behaviourInfo(plan.protectBehaviour).intentionTemplate.toLowerCase()}.
              </AppText>
            ) : null}
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
          <AppText variant="secondary" color="accent" style={styles.protect}>
            Close the day — one-minute reflection
          </AppText>
        ) : null}
        {hasEveningReflection ? (
          <AppText variant="caption" color="textTertiary" style={styles.protect}>
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
  protect: { marginTop: Spacing.sm },
});
