import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';
import { useAppStore } from '@/state/store';

export default function Settings() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const addBehaviourIntention = useAppStore((s) => s.addBehaviourIntention);
  const setBehaviourIntentionActive = useAppStore((s) => s.setBehaviourIntentionActive);
  const resetAll = useAppStore((s) => s.resetAll);

  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!profile) return <Screen />;

  const trackedKeys = new Set(
    behaviourIntentions.filter((b) => b.active).map((b) => b.behaviour),
  );

  const toggleBehaviour = (key: (typeof BEHAVIOUR_CATALOG)[number]['key']) => {
    const existing = behaviourIntentions.find((b) => b.behaviour === key);
    if (existing) {
      setBehaviourIntentionActive(existing.id, !existing.active);
    } else {
      const info = BEHAVIOUR_CATALOG.find((b) => b.key === key)!;
      addBehaviourIntention(key, info.intentionTemplate);
      if (info.safetyNote) {
        Alert.alert('A note on safety', info.safetyNote);
      }
    }
  };

  const reset = () => {
    resetAll();
    router.dismissAll();
    router.replace('/welcome');
  };

  return (
    <Screen>
      <AppText variant="title">Settings</AppText>

      <SectionHeader title="Profile" />
      <Card>
        <AppText variant="heading">{profile.firstName}</AppText>
        <AppText variant="caption" color="textTertiary">
          Day runs {profile.wakeTime} – {profile.sleepTime} · training{' '}
          {profile.trainingDaysPerWeek}× a week
        </AppText>
      </Card>

      <SectionHeader title="Behaviours you're working on" />
      <View style={styles.chips}>
        {BEHAVIOUR_CATALOG.map((b) => (
          <Chip
            key={b.key}
            label={b.label}
            selected={trackedKeys.has(b.key)}
            onPress={() => toggleBehaviour(b.key)}
          />
        ))}
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        INTENT tracks these supportively — occurrences are data, never failures. Nothing here is
        medical advice; if something feels bigger than a habit, professional support is the right
        tool.
      </AppText>

      <SectionHeader title="Data" />
      <AppText variant="caption" color="textTertiary">
        In demo mode everything lives on this device only. Nothing is shared with anyone —
        including partners — unless you explicitly choose to share it.
      </AppText>
      {confirmingReset ? (
        <Card style={styles.resetCard}>
          <AppText variant="body">Delete everything and start over? This cannot be undone.</AppText>
          <View style={styles.resetActions}>
            <Button title="Delete everything" variant="danger" onPress={reset} style={styles.grow} />
            <Button title="Keep my data" variant="ghost" onPress={() => setConfirmingReset(false)} />
          </View>
        </Card>
      ) : (
        <Button
          title="Reset all data"
          variant="ghost"
          onPress={() => setConfirmingReset(true)}
          style={styles.note}
        />
      )}

      <Button title="Done" variant="secondary" onPress={() => router.back()} style={styles.done} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  note: { marginTop: Spacing.md },
  resetCard: { marginTop: Spacing.md, gap: Spacing.md },
  resetActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  grow: { flexGrow: 1 },
  done: { marginTop: Spacing.xxl },
});
