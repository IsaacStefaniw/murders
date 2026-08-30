import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Radius, Spacing } from '@/constants/theme';
import { formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import type { PlanItem, PlanItemStatus } from '@/types/domain';

interface PlanItemRowProps {
  item: PlanItem;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (status: PlanItemStatus) => void;
  /** Valid alternative start times; enables the Move action when non-empty. */
  moveSlots?: string[];
  onMove?: (start: string) => void;
}

export function PlanItemRow({
  item,
  expanded,
  onToggle,
  onStatus,
  moveSlots,
  onMove,
}: PlanItemRowProps) {
  const theme = useTheme();
  const [showMove, setShowMove] = useState(false);
  const done = item.status === 'completed';
  const skipped = item.status === 'skipped';
  const canMove = !item.fixed && onMove && (moveSlots?.length ?? 0) > 0;

  const toggle = () => {
    setShowMove(false);
    onToggle();
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${formatTime(item.start)}${done ? ', completed' : ''}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed || expanded ? theme.surfacePressed : theme.surface,
          borderColor: theme.border,
        },
      ]}
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
        </AppText>
        {done ? (
          <AppText variant="caption" color="success">
            Done
          </AppText>
        ) : skipped ? (
          <AppText variant="caption" color="textTertiary">
            Skipped
          </AppText>
        ) : (
          <AppText variant="caption" color={item.tier}>
            {item.tier}
          </AppText>
        )}
      </View>

      {expanded && !showMove && item.status === 'planned' ? (
        <View style={styles.actions}>
          <Button title="Done" onPress={() => onStatus('completed')} style={styles.grow} />
          <Button title="Skip" variant="ghost" onPress={() => onStatus('skipped')} />
          {canMove ? (
            <Button title="Move" variant="secondary" onPress={() => setShowMove(true)} />
          ) : null}
        </View>
      ) : null}

      {expanded && showMove ? (
        <View style={styles.moveArea}>
          <AppText variant="caption" color="textTertiary">
            Move to…
          </AppText>
          <View style={styles.slots}>
            {moveSlots!.map((slot) => (
              <Chip
                key={slot}
                label={formatTime(slot)}
                onPress={() => {
                  setShowMove(false);
                  onMove!(slot);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {expanded && !showMove && item.status !== 'planned' ? (
        <View style={styles.actions}>
          <Button title="Undo" variant="ghost" onPress={() => onStatus('planned')} />
        </View>
      ) : null}
    </Pressable>
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
  time: { width: 62, fontVariant: ['tabular-nums'] },
  title: { flex: 1, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  grow: { flex: 1 },
  moveArea: { gap: Spacing.sm, paddingTop: Spacing.xs },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
