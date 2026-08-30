import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import type { ThemeColor } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  color?: ThemeColor;
}

export function SectionHeader({ title, color = 'textTertiary' }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText variant="label" color={color}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
});
