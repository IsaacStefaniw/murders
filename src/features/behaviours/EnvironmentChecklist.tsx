/**
 * The setup for one behaviour: what to move, delete, switch off or put
 * away, done once in daylight. Items and the alcohol guard live in
 * environment.ts; ticks persist on the recovery path's answers when the
 * coach is running for this behaviour, and otherwise for the screen only.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import {
  ENVIRONMENT_CHECKLIST,
  ENVIRONMENT_GUARD,
  environmentDone,
  toggleEnvironmentItem,
} from '@/features/behaviours/environment';
import { useAppStore } from '@/state/store';
import type { BehaviourKey } from '@/types/domain';

interface Props {
  behaviour: BehaviourKey;
}

export function EnvironmentChecklist({ behaviour }: Props) {
  const recovery = useAppStore((s) => s.paths.recovery);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);
  const persisted = !!recovery && recovery.answers.behaviour === behaviour;
  const [local, setLocal] = useState<Record<string, string>>({});
  const answers = persisted ? recovery.answers : local;
  const done = environmentDone(answers);
  const items = ENVIRONMENT_CHECKLIST[behaviour];
  const guard = ENVIRONMENT_GUARD[behaviour];

  const toggle = (id: string) => {
    const next = toggleEnvironmentItem(answers, id);
    if (persisted) updatePathAnswers('recovery', { environmentDone: next });
    else setLocal({ environmentDone: next });
  };

  return (
    <Card>
      <AppText variant="heading">The setup</AppText>
      <AppText variant="caption" color="textTertiary">
        Change the room, not the person. Done once in daylight, it works every night without a
        decision.
      </AppText>
      {guard ? (
        <AppText variant="secondary" style={styles.guard}>
          {guard}
        </AppText>
      ) : null}
      <View style={styles.list}>
        {items.map((item) => (
          <Chip
            key={item.id}
            label={item.text}
            selected={done.has(item.id)}
            hint={done.has(item.id) ? 'Done. Tap to undo.' : 'Tap when it is done.'}
            onPress={() => toggle(item.id)}
          />
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.count}>
        {done.size} of {items.length} done.
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  guard: { marginTop: Spacing.sm },
  list: { gap: Spacing.xs, marginTop: Spacing.md },
  count: { marginTop: Spacing.sm },
});
