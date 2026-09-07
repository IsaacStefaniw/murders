import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TARGET } from '@/components/field';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DisclosureProps extends PropsWithChildren {
  /** The question, in the words the person would ask it. */
  title: string;
  /** What pressing it does, when the title alone does not say. */
  hint?: string;
  startOpen?: boolean;
}

/**
 * A short explanation the person can open, beside the thing it explains.
 *
 * Written for the evidence grades: reviewers asked what the letters mean
 * the first time they saw one, and the answer is five lines — too much for
 * a caption under every card and too little for a screen of its own. So it
 * folds. Closed, it is one line; open, it is the whole answer, in place,
 * with nothing sent to somewhere else to read.
 *
 * Accessible by construction: the header is a button that announces
 * whether it is expanded, and it is a full-size target at any type size,
 * because the person who most needs the explanation is the one most likely
 * to be using large text.
 */
export function Disclosure({ title, hint, startOpen = false, children }: DisclosureProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(startOpen);
  return (
    <View style={[styles.wrap, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={hint}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((was) => !was)}
        style={({ pressed }) => [
          styles.header,
          pressed ? { backgroundColor: theme.surfacePressed } : null,
        ]}
      >
        <AppText variant="heading" style={styles.grow}>
          {title}
        </AppText>
        <AppText variant="heading" color="accent">
          {open ? '−' : '+'}
        </AppText>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: MIN_TARGET,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  grow: { flexGrow: 1, flexShrink: 1 },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
});
