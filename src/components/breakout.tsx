import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * The frame the app uses when it needs to stop being a list.
 *
 * ── Why there is a component for this ───────────────────────────────────
 *
 * Isaac: "I think these 'intervention' type screens should break out of
 * the usual UI a bit more often."
 *
 * The app already had three unrelated implementations of the same idea —
 * `coach/interrupt`, the guided sessions, the two reviews — each one a
 * modal that happened to look different, and no shared rule about what
 * earns one. So the moments that most needed a breakout (a logged slip,
 * a week that fell apart) got a `Card` on a tab instead, because writing
 * a fourth bespoke screen is expensive and dropping a card is free.
 *
 * This is the frame, so that the next one is the cheap option.
 *
 * ── The grammar ─────────────────────────────────────────────────────────
 *
 * A breakout is: one thing, at a time, that a person can leave at any
 * point. Concretely —
 *
 *   - It takes the whole screen. No tab bar, no other content, nothing
 *     competing. The moment is the screen.
 *   - It says who is talking and why, in the eyebrow, before it says
 *     anything else. An interruption that does not explain itself is an
 *     advert.
 *   - The exit is always visible and never styled as a failure. "Close",
 *     top right, at the touch floor, on every step. Anything that has to
 *     trap somebody to work is not working.
 *   - Steps are dots, not "3 of 5". A count invites the person to price
 *     the screen before reading it, and this is short enough not to need
 *     one.
 *   - One primary action per step, and the secondary is always a way out
 *     rather than a second commitment.
 *
 * ── When it is the wrong answer ─────────────────────────────────────────
 *
 * A breakout is earned by a moment the person created — they logged
 * something, they opened the review, they finished a week. It is never
 * earned by the app noticing something on its own timetable: that is what
 * `features/today/attention.ts` arbitrates, and it resolves to at most one
 * quiet block. Using this frame for anything the person did not initiate
 * is how an app becomes the one people delete.
 */

export interface BreakoutAction {
  label: string;
  onPress: () => void;
  /** Rendered quietly, under the primary. Always a way onward or out. */
  secondary?: boolean;
  disabled?: boolean;
}

interface Props {
  /** Who is talking and why — the eyebrow. Kept short and unsensational. */
  eyebrow: string;
  /** How many steps this breakout has. One means no dots. */
  steps?: number;
  /** Zero-based. */
  step?: number;
  /** The way out, on every step. */
  onClose: () => void;
  /** Label for the exit — "Close" unless the moment has a better word. */
  closeLabel?: string;
  children: ReactNode;
  /** Pinned under the content: the primary first, then any secondaries. */
  actions?: BreakoutAction[];
}

export function Breakout({
  eyebrow,
  steps = 1,
  step = 0,
  onClose,
  closeLabel = 'Close',
  children,
  actions = [],
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.head, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.eyebrowWrap}>
          <AppText variant="label" color="textTertiary">
            {eyebrow}
          </AppText>
          {steps > 1 ? (
            <View style={styles.dots} accessibilityLabel={`Step ${step + 1} of ${steps}`}>
              {Array.from({ length: steps }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i <= step ? theme.accent : theme.border },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>
        {/* Always here, never styled as giving up. */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          style={styles.close}
        >
          <AppText variant="caption" color="textSecondary">
            {closeLabel}
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      {actions.length > 0 ? (
        <View
          style={[
            styles.foot,
            {
              borderTopColor: theme.border,
              paddingBottom: insets.bottom + Spacing.lg,
            },
          ]}
        >
          {actions.map((a) => (
            <Button
              key={a.label}
              title={a.label}
              variant={a.secondary ? 'ghost' : 'primary'}
              disabled={a.disabled}
              onPress={a.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  eyebrowWrap: { flex: 1, gap: Spacing.sm },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 18, height: 3, borderRadius: Radius.sm },
  close: { minHeight: 44, minWidth: 56, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { flex: 1 },
  body: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  foot: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
