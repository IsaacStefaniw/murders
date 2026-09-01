import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { ItemActions } from '@/features/today/item-actions';
import { ItemGuidanceView } from '@/features/today/item-guidance-view';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

interface PlanItemRowProps {
  item: PlanItem;
  plan: DailyPlan;
  profile: LifeProfile;
  date: string;
  expanded: boolean;
  onToggle: () => void;
}

/** A compact plan row. Tier is engine detail — the row shows time and title only. */
export function PlanItemRow({ item, plan, profile, date, expanded, onToggle }: PlanItemRowProps) {
  const theme = useTheme();
  const done = item.status === 'completed';
  const skipped = item.status === 'skipped';

  // Only the main line toggles — a fully-pressable row would swallow taps
  // meant for the action buttons inside it (and collapse mid-flow).
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: expanded ? theme.surfacePressed : theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${formatTime(item.start)}${done ? ', done' : ''}`}
      >
        <View style={styles.main}>
          <AppText variant="caption" color="textTertiary" style={styles.time}>
            {formatTime(item.start)}
          </AppText>
          <AppText
            variant="body"
            style={[
              styles.title,
              done && { color: theme.textTertiary, textDecorationLine: 'line-through' },
              skipped && { color: theme.textTertiary },
            ]}
          >
            {item.title}
            {item.shortenedFromMin ? ' · shortened' : ''}
          </AppText>
          {done ? (
            <AppText variant="caption" color="success">
              Done
            </AppText>
          ) : skipped ? (
            <AppText variant="caption" color="textTertiary">
              Skipped
            </AppText>
          ) : null}
        </View>

        {item.focus && !done && !skipped ? (
          <AppText variant="caption" color="textTertiary" style={styles.focus}>
            Next step: {item.focus}
          </AppText>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={styles.actions}>
          <ItemGuidanceView item={item} />
          <ItemActions item={item} plan={plan} profile={profile} date={date} onDone={onToggle} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  // minWidth so a scaled-up time is never cut off by its own column.
  time: { minWidth: 62, fontVariant: ['tabular-nums'] },
  title: { flex: 1, fontWeight: '500' },
  focus: { paddingLeft: 62 + Spacing.md },
  actions: { paddingTop: Spacing.xs },
});
