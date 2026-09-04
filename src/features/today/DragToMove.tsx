import { useState, type PropsWithChildren } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { isDrag, targetStartFor } from '@/features/today/dragMath';
import { durationMinutes, formatTime } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import type { LifeProfile, PlanItem } from '@/types/domain';

/**
 * Press and hold a row, and it lifts and follows the finger; a label rides
 * with it saying where it will land; let go and the day re-lays around it.
 * The long-press picker still exists for a hold that does not travel.
 *
 * The gesture activates only after the hold, so a scroll that starts
 * moving straight away is still a scroll. While a row is lifted the
 * screen's scroll view is switched off through onDragging, because two
 * things following one finger is how a day ends up in the wrong order.
 */
export function DragToMove({
  item,
  profile,
  enabled,
  onDragging,
  onDrop,
  onHold,
  children,
}: PropsWithChildren<{
  item: PlanItem;
  profile: LifeProfile;
  enabled: boolean;
  onDragging: (dragging: boolean) => void;
  /** The chosen start, snapped and clamped. */
  onDrop: (start: string) => void;
  /** A hold that never travelled: open the picker instead. */
  onHold: () => void;
}>) {
  const theme = useTheme();
  // Created once; an Animated value is a handle, not state that re-renders.
  const [translateY] = useState(() => new Animated.Value(0));
  const [label, setLabel] = useState<string | null>(null);
  const duration = durationMinutes(item.start, item.end);
  const bounds = { dayStart: profile.wakeTime, dayEnd: profile.sleepTime };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activateAfterLongPress(250)
    .runOnJS(true)
    .onStart(() => {
      onDragging(true);
      setLabel(formatTime(item.start));
    })
    .onUpdate((e) => {
      translateY.setValue(e.translationY);
      setLabel(formatTime(targetStartFor(item.start, duration, e.translationY, bounds)));
    })
    .onEnd((e) => {
      const dy = e.translationY;
      translateY.setValue(0);
      setLabel(null);
      onDragging(false);
      if (!isDrag(dy)) {
        onHold();
        return;
      }
      const start = targetStartFor(item.start, duration, dy, bounds);
      if (start !== item.start) onDrop(start);
    })
    .onFinalize(() => {
      translateY.setValue(0);
      setLabel(null);
      onDragging(false);
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          { transform: [{ translateY }] },
          label ? [styles.lifted, { shadowColor: theme.text }] : null,
        ]}
      >
        {label ? (
          <View style={[styles.badge, { backgroundColor: theme.accent }]} pointerEvents="none">
            <AppText variant="caption" style={styles.badgeText}>
              Move to {label}
            </AppText>
          </View>
        ) : null}
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  lifted: {
    zIndex: 10,
    elevation: 6,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  badge: {
    position: 'absolute',
    top: -14,
    right: Spacing.md,
    zIndex: 11,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
  },
  badgeText: { color: '#FFFFFF' },
});
