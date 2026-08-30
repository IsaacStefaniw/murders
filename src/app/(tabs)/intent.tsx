import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SuggestionCard } from '@/components/suggestion-card';
import { Spacing } from '@/constants/theme';
import { computeWeeklyStats } from '@/features/review/computeWeekly';
import { weeklyNarrative } from '@/lib/ai/agents';
import { isSupabaseConfigured } from '@/lib/supabase';
import { todayKey, weekStartOf } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/** INTENT's own surface: suggestions, the weekly review, system status. */
export default function Intent() {
  const plans = useAppStore((s) => s.plans);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const reflections = useAppStore((s) => s.reflections);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);

  const [reviewRequested, setReviewRequested] = useState(false);
  const weekStart = weekStartOf(todayKey());

  const review = useQuery({
    queryKey: ['weekly-review', weekStart],
    enabled: reviewRequested,
    queryFn: async () => {
      const { stats, highlights } = computeWeeklyStats({
        weekStart,
        plans,
        behaviourIntentions,
        behaviourEvents,
        reflections,
      });
      const narrative = await weeklyNarrative(stats, highlights);
      return { stats, narrative };
    },
  });

  const open = suggestions.filter((s) => s.status === 'open');

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Intent
      </AppText>
      <AppText variant="title">Working for you</AppText>

      <SectionHeader title="Suggestions" />
      {open.length === 0 ? (
        <AppText variant="secondary">
          Nothing right now. Suggestions appear when your plans and your reality drift apart —
          each one tells you why.
        </AppText>
      ) : (
        <View style={styles.stack}>
          {open.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => acceptSuggestion(s.id)}
              onDismiss={() => dismissSuggestion(s.id)}
            />
          ))}
        </View>
      )}

      <SectionHeader title="Weekly review" />
      {!reviewRequested ? (
        <Card>
          <AppText variant="secondary">
            A short, honest read on the week — what worked, what didn&apos;t, what to change. No
            scores.
          </AppText>
          <Button
            title="Review my week"
            variant="secondary"
            onPress={() => setReviewRequested(true)}
            style={styles.reviewButton}
          />
        </Card>
      ) : review.isLoading ? (
        <Card>
          <AppText variant="secondary">Reading your week…</AppText>
        </Card>
      ) : review.data ? (
        <Card>
          <AppText variant="body">{review.data.narrative.narrative}</AppText>
          {review.data.narrative.wentWell.length > 0 ? (
            <View style={styles.reviewSection}>
              <AppText variant="label" color="success">
                Went well
              </AppText>
              {review.data.narrative.wentWell.map((line) => (
                <AppText key={line} variant="secondary">
                  · {line}
                </AppText>
              ))}
            </View>
          ) : null}
          {review.data.narrative.proposedChanges.length > 0 ? (
            <View style={styles.reviewSection}>
              <AppText variant="label" color="must">
                Next week
              </AppText>
              {review.data.narrative.proposedChanges.map((line) => (
                <AppText key={line} variant="secondary">
                  · {line}
                </AppText>
              ))}
            </View>
          ) : null}
          <AppText variant="caption" color="textTertiary" style={styles.reviewSection}>
            {Math.round(review.data.stats.completionRate * 100)}% of planned activities happened ·{' '}
            {review.data.stats.checkInsCompleted} check-ins
          </AppText>
        </Card>
      ) : (
        <Card>
          <AppText variant="secondary">Couldn&apos;t build the review. Try again later.</AppText>
        </Card>
      )}

      <SectionHeader title="System" />
      <AppText variant="caption" color="textTertiary">
        {isSupabaseConfigured()
          ? 'Connected — data syncs to your account, AI insights enabled.'
          : 'Demo mode — everything runs on this device. Planning and adaptation are fully local; connect a backend to enable account sync and richer AI insights.'}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  reviewButton: { marginTop: Spacing.md },
  reviewSection: { marginTop: Spacing.lg, gap: Spacing.xs },
});
