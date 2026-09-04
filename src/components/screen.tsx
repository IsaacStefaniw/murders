import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ScreenProps extends PropsWithChildren {
  /** Scrollable content (default) or a fixed layout. */
  scroll?: boolean;
  /** Extra bottom padding for screens under the tab bar. */
  tabbed?: boolean;
  /** Off while a row is being dragged, so one finger moves one thing. */
  scrollEnabled?: boolean;
}

export function Screen({ children, scroll = true, tabbed = false, scrollEnabled = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + Spacing.md,
    paddingBottom: (tabbed ? 96 : insets.bottom + Spacing.xl) + Spacing.md,
    paddingHorizontal: Spacing.lg,
  };

  if (!scroll) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.content, padding]}>{children}</View>
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
