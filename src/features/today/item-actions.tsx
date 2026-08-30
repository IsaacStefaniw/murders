import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Spacing } from '@/constants/theme';
import { sessionForItem } from '@/features/modalities/registry';
import { smartMoveOptions } from '@/features/planner/moveOptions';
import { addDays, formatTime, nowMinutes, toMinutes } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { DailyPlan, LifeProfile, PlanItem } from '@/types/domain';

interface ItemActionsProps {
  item: PlanItem;
  plan: DailyPlan;
  profile: LifeProfile;
  date: string;
  onDone?: () => void;
}

/**
 * The single action surface for a plan item: Done, intelligent Move,
 * Shorten where it makes sense, and Skip that offers recovery before
 * surrender. Optimises for recovery, never guilt.
 */
export function ItemActions({ item, plan, profile, date, onDone }: ItemActionsProps) {
  const router = useRouter();
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const moveItem = useAppStore((s) => s.moveItem);
  const moveItemToDate = useAppStore((s) => s.moveItemToDate);
  const shortenItem = useAppStore((s) => s.shortenItem);
  const goals = useAppStore((s) => s.goals);

  const [mode, setMode] = useState<'idle' | 'move' | 'choose' | 'skip'>('idle');
  const session = item.status === 'planned' ? sessionForItem(item, goals) : null;

  const duration = toMinutes(item.end) - toMinutes(item.start);
  const isEffort = item.area === 'health' && duration >= 40;
  const isTogether = item.area === 'relationship' || item.area === 'family';

  const finish = () => {
    setMode('idle');
    onDone?.();
  };

  if (item.status !== 'planned') {
    return (
      <View style={styles.row}>
        <Button title="Undo" variant="ghost" onPress={() => { setItemStatus(date, item.id, 'planned'); finish(); }} />
      </View>
    );
  }

  if (mode === 'move' || mode === 'choose') {
    const { options, allSlots } = smartMoveOptions(item, plan, profile, nowMinutes());
    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          Move to…
        </AppText>
        <View style={styles.chips}>
          {mode === 'move'
            ? options.map((o) => (
                <Chip
                  key={o.label}
                  label={o.kind === 'slot' ? `${o.label} (${formatTime(o.start!)})` : o.label}
                  onPress={() => {
                    if (o.kind === 'slot') {
                      moveItem(date, item.id, o.start!);
                      finish();
                    } else if (o.kind === 'tomorrow') {
                      moveItemToDate(date, item.id, addDays(date, 1));
                      finish();
                    } else {
                      setMode('choose');
                    }
                  }}
                />
              ))
            : allSlots.map((slot) => (
                <Chip
                  key={slot}
                  label={formatTime(slot)}
                  onPress={() => {
                    moveItem(date, item.id, slot);
                    finish();
                  }}
                />
              ))}
          <Chip label="Cancel" onPress={() => setMode('idle')} />
        </View>
      </View>
    );
  }

  if (mode === 'skip') {
    return (
      <View style={styles.column}>
        <AppText variant="caption" color="textTertiary">
          {isEffort ? `Can't fit ${duration} minutes?` : isTogether ? "Can't make it?" : 'Not today?'}
        </AppText>
        <View style={styles.chips}>
          {isEffort && duration > 20 ? (
            <Chip
              label="Shorten to 20 min"
              onPress={() => {
                shortenItem(date, item.id, 20);
                finish();
              }}
            />
          ) : null}
          {isTogether ? (
            <Chip
              label="Move to tomorrow"
              onPress={() => {
                moveItemToDate(date, item.id, addDays(date, 1));
                finish();
              }}
            />
          ) : null}
          <Chip label={isEffort ? 'Move it' : 'Find another time'} onPress={() => setMode('move')} />
          <Chip
            label={isTogether ? 'Skip this week' : 'Skip today'}
            onPress={() => {
              setItemStatus(date, item.id, 'skipped');
              finish();
            }}
          />
          <Chip label="Cancel" onPress={() => setMode('idle')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {session ? (
        <Button
          title="Start"
          onPress={() => {
            const query = new URLSearchParams(session.params).toString();
            router.push((query ? `${session.route}?${query}` : session.route) as never);
            onDone?.();
          }}
          style={styles.grow}
        />
      ) : null}
      <Button
        title="Done"
        variant={session ? 'secondary' : 'primary'}
        onPress={() => {
          setItemStatus(date, item.id, 'completed');
          finish();
        }}
        style={session ? undefined : styles.grow}
      />
      {!item.fixed ? (
        <Button title="Move" variant={session ? 'ghost' : 'secondary'} onPress={() => setMode('move')} />
      ) : null}
      {!item.fixed ? <Button title="Skip" variant="ghost" onPress={() => setMode('skip')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  column: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  grow: { flex: 1 },
});
