import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Spacing } from '@/constants/theme';
import { voiceFor } from '@/features/coaches/voices';
import type { PathId } from '@/features/paths/definitions';

/**
 * Meeting a coach, before it builds anything.
 *
 * Four lines in the coach's own voice: who I am, what I will do, what I
 * need from you, and the one thing I will never do. The last one is the
 * point — see `features/coaches/voices.ts`.
 *
 * It sits above the intake rather than after it, because a person who has
 * just answered nine questions has already committed and is no longer
 * choosing. The choice has to come first for it to be a choice.
 */
export function CoachIntro({ pathId }: { pathId: PathId }) {
  const v = voiceFor(pathId);
  return (
    <Card>
      <AppText variant="heading">{v.opener}</AppText>
      <AppText variant="secondary" style={styles.line}>
        {v.promise}
      </AppText>
      <View style={styles.block}>
        <AppText variant="label" color="textTertiary">
          What I need
        </AppText>
        <AppText variant="secondary">{v.ask}</AppText>
      </View>
      <View style={styles.block}>
        <AppText variant="label" color="textTertiary">
          What I won&apos;t do
        </AppText>
        <AppText variant="secondary">{v.refusal}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  line: { marginTop: Spacing.sm },
  block: { marginTop: Spacing.md, gap: Spacing.xs },
});
