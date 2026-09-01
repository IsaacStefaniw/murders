import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { PlanItemRow } from '@/features/today/plan-item-row';
import { addDays, formatDateLong, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/** The week ahead. Deterministic plans for the next seven days, editable in place. */
export default function Plan() {
  const router = useRouter();
  const today = todayKey();
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);

  const [openDate, setOpenDate] = useState(today);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rebuiltDate, setRebuiltDate] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    for (const date of dates) ensurePlan(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, today]);

  if (!profile) return <Screen tabbed />;

  return (
    <Screen tabbed>
      <AppText variant="label" color="textTertiary">
        Week
      </AppText>
      <AppText variant="title">The week ahead</AppText>

      <Card
        onPress={() => router.push('/plan/routines' as never)}
        style={styles.routinesCard}
        accessibilityLabel="Adjust your routines"
      >
        <AppText variant="heading">Adjust when things happen</AppText>
        <AppText variant="caption" color="textTertiary">
          Days, times and lengths. You know your week better than the scheduler does.
        </AppText>
      </Card>

      <View style={styles.stack}>
        {dates.map((date) => {
          const plan = plans[date];
          const items = plan?.items ?? [];
          const open = openDate === date;
          return (
            // Only the header toggles the day — a pressable card would
            // swallow taps meant for the item rows and buttons inside it.
            <Card key={date}>
              <Pressable
                onPress={() => setOpenDate(open ? '' : date)}
                accessibilityRole="button"
                accessibilityLabel={formatDateLong(date)}
              >
                <View style={styles.dayHeader}>
                  <AppText variant="heading">
                    {date === today ? 'Today' : formatDateLong(date)}
                  </AppText>
                  <AppText variant="caption" color="textTertiary">
                    {items.length} planned
                  </AppText>
                </View>
              </Pressable>

              {open ? (
                <View style={styles.items}>
                  {items.length === 0 ? (
                    <AppText variant="secondary">Nothing planned. A rest day is a plan too.</AppText>
                  ) : (
                    items.map((item) =>
                      plan ? (
                        <PlanItemRow
                          key={item.id}
                          item={item}
                          plan={plan}
                          profile={profile}
                          date={date}
                          expanded={expandedId === item.id}
                          onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        />
                      ) : null,
                    )
                  )}
                  <Button
                    title="Rebuild this day"
                    variant="secondary"
                    onPress={() => {
                      regeneratePlan(date);
                      setRebuiltDate(date);
                    }}
                    style={styles.rebuild}
                  />
                  {rebuiltDate === date ? (
                    <AppText variant="caption" color="success">
                      Rebuilt from your current routines — statuses reset.
                    </AppText>
                  ) : null}
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  routinesCard: { marginTop: Spacing.lg, marginBottom: Spacing.md },
  stack: { gap: Spacing.sm, marginTop: Spacing.lg },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  items: { marginTop: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  // minWidth so a scaled-up time is never cut off by its own column.
  time: { minWidth: 56, fontVariant: ['tabular-nums'] },
  itemTitle: { flex: 1 },
  rebuild: { marginTop: Spacing.sm },
});
