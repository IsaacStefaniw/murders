import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { BUILD_TAG } from '@/lib/build';
import { nowDate } from '@/lib/dates';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  BEHAVIOUR_CATALOG,
  BEHAVIOUR_FAMILY_LABELS,
  behavioursInFamily,
  type BehaviourFamily,
} from '@/features/behaviours/catalog';
import {
  connectAppleHealth,
  healthAvailable,
  syncAppleHealth,
} from '@/features/health/healthkit';
import {
  notificationPermission,
  requestNotificationPermission,
  type PermissionState,
} from '@/lib/notifications';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/state/store';

const STORE_KEY = 'intent-os-store';

export default function Settings() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const foodPreferences = useAppStore((s) => s.foodPreferences);
  const notifications = useAppStore((s) => s.notifications);
  const setNotificationSettings = useAppStore((s) => s.setNotificationSettings);
  const [notifPermission, setNotifPermission] = useState<PermissionState>('undetermined');
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const addBehaviourIntention = useAppStore((s) => s.addBehaviourIntention);
  const setBehaviourIntentionActive = useAppStore((s) => s.setBehaviourIntentionActive);
  const resetAll = useAppStore((s) => s.resetAll);
  const seedDemoHistory = useAppStore((s) => s.seedDemoHistory);
  const advanceToNextMorning = useAppStore((s) => s.advanceToNextMorning);
  const jumpToEvening = useAppStore((s) => s.jumpToEvening);
  const resetClock = useAppStore((s) => s.resetClock);
  const clockOffsetMs = useAppStore((s) => s.clockOffsetMs);

  const healthConnectedAt = useAppStore((s) => s.healthConnectedAt);
  const healthLastSyncAt = useAppStore((s) => s.healthLastSyncAt);

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [canUseHealth, setCanUseHealth] = useState(false);
  const [connectingHealth, setConnectingHealth] = useState(false);

  useEffect(() => {
    healthAvailable().then(setCanUseHealth);
    // Read-only: knowing the state lets the screen explain itself without
    // triggering the one prompt iOS will ever show.
    notificationPermission().then(setNotifPermission);
  }, []);

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

  /**
   * Permission is asked here, at the moment someone opts in — never on
   * launch. iOS offers the prompt once, and a prompt before anyone has seen
   * what the app would say is the fastest route to a permanent no.
   */
  const toggleNotification = async (key: 'interventions' | 'sessions' | 'windDown') => {
    const turningOn = !(notifications.enabled && notifications[key]);
    if (turningOn) {
      const state = await requestNotificationPermission();
      setNotifPermission(state);
      if (state !== 'granted') return;
    }
    const next = { ...notifications, [key]: turningOn };
    setNotificationSettings({
      ...next,
      // Enabled is derived: the master switch is just "is anything on".
      enabled: next.interventions || next.sessions || next.windDown,
    });
  };

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
      <View style={styles.topRow}>
        <AppText variant="title" style={styles.grow}>
          Settings
        </AppText>
        <Button
          title="Done"
          variant="ghost"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/today'))}
        />
      </View>

      <SectionHeader title="Profile" />
      <Card>
        <AppText variant="heading">{profile.firstName}</AppText>
        <AppText variant="caption" color="textTertiary">
          Day runs {profile.wakeTime} – {profile.sleepTime} · training{' '}
          {profile.trainingDaysPerWeek}× a week
        </AppText>
      </Card>

      <SectionHeader title="INTENT Plus" />
      <Card onPress={() => router.push('/upgrade' as never)}>
        <AppText variant="heading">Your whole life, one co-pilot</AppText>
        <AppText variant="caption" color="textTertiary">
          Preview what Plus will include — and what stays free forever.
        </AppText>
      </Card>

      <SectionHeader title="Practice library" />
      <Card onPress={() => router.push('/library' as never)}>
        <AppText variant="heading">Evidence-based practices</AppText>
        <AppText variant="caption" color="textTertiary">
          Protocols from the public work of Ferriss, Huberman, Attia, Patrick, Peterson and
          Sinclair — one tap adds them to your plan.
        </AppText>
      </Card>

      <SectionHeader title="Apple Health" />
      {healthConnectedAt ? (
        <Card>
          <AppText variant="heading">Connected ✓</AppText>
          <AppText variant="caption" color="textTertiary">
            Sleep, resting heart rate, heart-rate variability, cardio fitness, weight, height and
            waist flow into your metrics — read-only, on-device, and your own entries always win.
            {healthLastSyncAt
              ? ` Last synced ${new Date(healthLastSyncAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}.`
              : ''}
          </AppText>
          <Button
            title="Sync now"
            variant="secondary"
            onPress={() => syncAppleHealth(true)}
            style={styles.note}
          />
        </Card>
      ) : canUseHealth ? (
        <Card>
          <AppText variant="heading">Let your vitals shape the plan</AppText>
          <AppText variant="caption" color="textTertiary">
            Connect Apple Health and a short night automatically adjusts today&apos;s workout,
            weigh-ins feed the nutrition trend, and resting heart rate adds recovery context.
            Read-only — INTENT never writes to Health.
          </AppText>
          <Button
            title={connectingHealth ? 'Waiting for permission…' : 'Connect Apple Health'}
            disabled={connectingHealth}
            onPress={async () => {
              setConnectingHealth(true);
              await connectAppleHealth();
              setConnectingHealth(false);
            }}
            style={styles.note}
          />
        </Card>
      ) : (
        <AppText variant="caption" color="textTertiary">
          {Platform.OS === 'ios'
            ? 'Apple Health is not available on this device.'
            : 'Available in the iPhone app — connect it there and your vitals shape the plan automatically.'}
        </AppText>
      )}

      <SectionHeader title="Food" />
      <Card
        onPress={() => router.push('/nutrition/preferences' as never)}
        accessibilityLabel="Food preferences"
      >
        <AppText variant="heading">Allergies, intolerances, favourites</AppText>
        <AppText variant="caption" color="textTertiary">
          {foodPreferences.allergies.length > 0
            ? `${foodPreferences.allergies.length} declared — dishes are only suggested when we know they are free of them.`
            : 'Nothing declared. Worth a minute before the app suggests any food.'}
        </AppText>
      </Card>

      <SectionHeader title="Notifications" />
      <AppText variant="caption" color="textTertiary">
        {notifPermission === 'denied'
          ? 'Turned off for INTENT in iOS Settings. Enable them there first, then come back.'
          : notifPermission === 'unavailable'
            ? 'Not available in this build.'
            : `At most ${notifications.dailyCap} a day, never during your quiet hours, and nothing at all until you turn one of these on. An app that says four things a day gets muted in a fortnight.`}
      </AppText>
      <View style={styles.chips}>
        <Chip
          label="Habit interventions"
          selected={notifications.enabled && notifications.interventions}
          onPress={() => void toggleNotification('interventions')}
        />
        <Chip
          label="Session reminders"
          selected={notifications.enabled && notifications.sessions}
          onPress={() => void toggleNotification('sessions')}
        />
        <Chip
          label="Wind-down"
          selected={notifications.enabled && notifications.windDown}
          onPress={() => void toggleNotification('windDown')}
        />
      </View>
      <AppText variant="caption" color="textTertiary" style={styles.note}>
        A habit intervention arrives BEFORE the window your own logs say it usually happens in —
        the hour when a different plan still lands. It stays quiet until there is a pattern to
        work from.
      </AppText>

      <SectionHeader title="Behaviours you're working on" />
      {/* Grouped rather than listed: sixteen undifferentiated chips is a wall,
          and the families are how people actually think about these. */}
      {(Object.keys(BEHAVIOUR_FAMILY_LABELS) as BehaviourFamily[]).map((family) => (
        <View key={family}>
          <AppText variant="caption" color="textTertiary" style={styles.familyLabel}>
            {BEHAVIOUR_FAMILY_LABELS[family]}
          </AppText>
          <View style={styles.chips}>
            {behavioursInFamily(family).map((b) => (
              <Chip
                key={b.key}
                label={b.label}
                selected={trackedKeys.has(b.key)}
                onPress={() => toggleBehaviour(b.key)}
              />
            ))}
          </View>
        </View>
      ))}
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
          <Field
            label="Backup to restore"
            hint="Paste the whole backup. Restoring replaces everything currently on this device."
            value={restoreText}
            onChangeText={setRestoreText}
            placeholder="Paste a backup here"
            multiline
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

      <AppText variant="caption" color="textTertiary" style={styles.note}>
        Build {BUILD_TAG}
      </AppText>
      <Button title="Done" variant="secondary" onPress={() => router.back()} style={styles.done} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  familyLabel: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  note: { marginTop: Spacing.md },
  resetCard: { marginTop: Spacing.md, gap: Spacing.md },
  resetActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  grow: { flexGrow: 1 },
  labRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  labColumn: { gap: Spacing.sm, marginTop: Spacing.md },
  restoreArea: { gap: Spacing.sm, marginTop: Spacing.md },
  done: { marginTop: Spacing.xxl },
});
