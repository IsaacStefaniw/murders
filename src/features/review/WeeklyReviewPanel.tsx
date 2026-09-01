import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { SectionHeader } from '@/components/section-header';
import { SuggestionCard } from '@/components/suggestion-card';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { computeWeeklyStats } from '@/features/review/computeWeekly';
import { buildWeeklyChanges } from '@/features/review/weeklyChanges';
import { weeklyNarrative } from '@/lib/ai/agents';
import { todayKey, weekStartOf } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The week's read, and what INTENT would change about the next one.
 *
 * This used to be its own tab, called "Intent" — the app's own name, which
 * told nobody what was behind it. It was also the thinnest of the five, and
 * everything on it answered the same question the Progress tab already
 * asks: how did that go, and what should change. So it lives here now, and
 * the tab bar lost the word that needed explaining.
 */
export function WeeklyReviewPanel() {
  const router = useRouter();
  const plans = useAppStore((s) => s.plans);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const reflections = useAppStore((s) => s.reflections);
  const suggestions = useAppStore((s) => s.suggestions);
  const acceptSuggestion = useAppStore((s) => s.acceptSuggestion);
  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);

  const applyWeeklyChanges = useAppStore((s) => s.applyWeeklyChanges);
  const routines = useAppStore((s) => s.routines);

  const [reviewRequested, setReviewRequested] = useState(false);
  const [applied, setApplied] = useState(false);
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
      const proposal = buildWeeklyChanges({ weekStart, plans, routines });
      return { stats, narrative, proposal };
    },
  });

  const open = suggestions.filter((s) => s.status === 'open');

  return (
    <View>
      <SectionHeader title="This week" />
      <Card
        onPress={() => router.push('/report' as never)}
        accessibilityLabel="Open this week's report"
      >
        <AppText variant="heading">This week, in evidence</AppText>
        <AppText variant="caption" color="textTertiary">
          What happened, which goals moved, and what carried the week.
        </AppText>
      </Card>

      {open.length > 0 ? (
        <>
          <SectionHeader title="Suggestions" />
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
        </>
      ) : null}

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

          {review.data.proposal.changes.length > 0 ? (
            <View style={styles.reviewSection}>
              {review.data.proposal.noticed.length > 0 ? (
                <View style={styles.reviewBlock}>
                  <AppText variant="label" color="textTertiary">
                    I noticed
                  </AppText>
                  {review.data.proposal.noticed.map((line) => (
                    <AppText key={line} variant="secondary">
                      {line}
                    </AppText>
                  ))}
                </View>
              ) : null}
              <View style={styles.reviewBlock}>
                <AppText variant="label" color="accent">
                  I&apos;d change
                </AppText>
                {review.data.proposal.changes.map((change) => (
                  <AppText key={change.id} variant="secondary">
                    · {change.description}
                  </AppText>
                ))}
              </View>
              {applied ? (
                <AppText variant="caption" color="success">
                  Done — next week is rebuilt around it.
                </AppText>
              ) : (
                <Button
                  title="Apply to next week"
                  onPress={() => {
                    applyWeeklyChanges(review.data.proposal.changes);
                    setApplied(true);
                  }}
                />
              )}
            </View>
          ) : null}
        </Card>
      ) : (
        <Card>
          <AppText variant="secondary">Couldn&apos;t build the review. Try again later.</AppText>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  reviewButton: { marginTop: Spacing.md },
  reviewSection: { marginTop: Spacing.lg, gap: Spacing.sm },
  reviewBlock: { gap: Spacing.xs },
});
