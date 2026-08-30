import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { nowDate } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { BEHAVIOUR_CATALOG } from '@/features/behaviours/catalog';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/state/store';

const STORE_KEY = 'intent-os-store';

export default function Settings() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAppStore((s) => s.profile);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const addBehaviourIntention = useAppStore((s) => s.addBehaviourIntention);
  const setBehaviourIntentionActive = useAppStore((s) => s.setBehaviourIntentionActive);
  const resetAll = useAppStore((s) => s.resetAll);
  const seedDemoHistory = useAppStore((s) => s.seedDemoHistory);
  const advanceToNextMorning = useAppStore((s) => s.advanceToNextMorning);
  const jumpToEvening = useAppStore((s) => s.jumpToEvening);
  const resetClock = useAppStore((s) => s.resetClock);
  const clockOffsetMs = useAppStore((s) => s.clockOffsetMs);

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreText, setRestoreText] = useState('');

  const simLabel =
    clockOffsetMs === 0
      ? 'real time'
      : nowDate().toLocaleString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });

  const copyBackup = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (!raw) return;
      await navigator.clipboard.writeText(raw);
      setBackupCopied(true);
      setTimeout(() => setBackupCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions) — nothing to break.
    }
  };

  const restoreBackup = async () => {
    try {
      const parsed = JSON.parse(restoreText.trim());
      if (!parsed?.state) return; // not a backup payload
      await AsyncStorage.setItem(STORE_KEY, restoreText.trim());
      if (typeof window !== 'undefined') window.location.reload();
    } catch {
      // Invalid JSON — leave the field for the user to fix.
    }
  };

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
        {isSupabaseConfigured()
          ? 'Connected — data syncs to your account.'
          : 'Demo mode — everything lives on this device only. Nothing is shared with anyone, including partners, unless you explicitly choose to share it.'}
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

      <SectionHeader title="Backup" />
      <AppText variant="caption" color="textTertiary">
        Browser storage on iPhone can be cleared without warning. Copy a backup after real use;
        restore it if the app comes up empty. (The native app won&apos;t need this.)
      </AppText>
      <View style={styles.labRow}>
        <Button
          title={backupCopied ? 'Copied' : 'Copy backup'}
          variant="secondary"
          onPress={copyBackup}
        />
        <Button title="Restore" variant="ghost" onPress={() => setRestoring(!restoring)} />
      </View>
      {restoring ? (
        <View style={styles.restoreArea}>
          <TextInput
            value={restoreText}
            onChangeText={setRestoreText}
            placeholder="Paste a backup here"
            placeholderTextColor={theme.textTertiary}
            multiline
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          />
          <Button title="Restore backup" onPress={restoreBackup} disabled={!restoreText.trim()} />
        </View>
      ) : null}

      <SectionHeader title="Preview lab" />
      <AppText variant="caption" color="textTertiary">
        Testing tools for the web preview: compress a week of the learning loop into minutes.
        Simulated time: {simLabel}.
      </AppText>
      <View style={styles.labColumn}>
        <Button title="Seed two weeks of history" variant="secondary" onPress={seedDemoHistory} />
        <View style={styles.labRow}>
          <Button title="Jump to evening" variant="ghost" onPress={jumpToEvening} />
          <Button title="Next morning" variant="ghost" onPress={advanceToNextMorning} />
          {clockOffsetMs !== 0 ? (
            <Button title="Real time" variant="ghost" onPress={resetClock} />
          ) : null}
        </View>
      </View>

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
  labRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  labColumn: { gap: Spacing.sm, marginTop: Spacing.md },
  restoreArea: { gap: Spacing.sm, marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 13,
    minHeight: 72,
  },
  done: { marginTop: Spacing.xxl },
});
