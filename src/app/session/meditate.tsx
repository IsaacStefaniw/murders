import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { EVIDENCE_LABELS } from '@/features/knowledge/protocols';
import { practiceState } from '@/features/mind/practice';
import { cueAt, scriptsForLevel, type MeditationScript } from '@/features/mind/scripts';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Guided meditation.
 *
 * Position in the script is derived from elapsed wall-clock time rather
 * than counted by a ticking timer — the same approach as `breathe.tsx`.
 * Nothing accumulates drift, and an app backgrounded mid-session comes back
 * to where the session actually is rather than where it stopped counting.
 */
export default function MeditateSession() {
  const router = useRouter();
  const theme = useTheme();
  const { itemId, date } = useLocalSearchParams<{ itemId?: string; date?: string }>();
  const setItemStatus = useAppStore((s) => s.setItemStatus);
  const logCompletedActivity = useAppStore((s) => s.logCompletedActivity);
  const addMetric = useAppStore((s) => s.addMetric);
  const metrics = useAppStore((s) => s.metrics);
  const profile = useAppStore((s) => s.profile);

  const level = practiceState(metrics, profile?.existingHabits?.includes('meditation')).level;
  const scripts = useMemo(() => scriptsForLevel(level.level), [level.level]);

  const [script, setScript] = useState<MeditationScript | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [startedAt]);

  const totalSec = (durationMin ?? 0) * 60;
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const finished = startedAt > 0 && elapsed >= totalSec;
  const remaining = Math.max(0, Math.ceil(totalSec - elapsed));

  const cues = useMemo(
    () => (script && durationMin ? script.build(durationMin) : []),
    [script, durationMin],
  );
  const cue = cueAt(cues, elapsed);

  const close = (completed: boolean) => {
    if (completed && durationMin) {
      // Minutes feed the stillness-practice progression (features/mind).
      addMetric('mind.minutes', durationMin, script ? script.title : 'meditation');
    }
    if (completed && itemId && date) {
      setItemStatus(date, itemId, 'completed', {
        source: 'manual',
        confidence: 1,
        at: new Date().toISOString(),
        note: script ? `${script.title} · ${durationMin} min` : 'meditation session',
      });
    } else if (completed && durationMin) {
      // Launched from "Any time" rather than a plan item — it still happened,
      // so it still belongs on the day.
      logCompletedActivity({
        title: script ? script.title : 'Meditation',
        area: 'health',
        durationMin,
        sessionType: 'meditate',
        note: 'meditation session',
      });
    }
    router.back();
  };

  /* ---- Choosing a practice ---- */
  if (!script) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          Sit
        </AppText>
        <AppText variant="title">What kind of practice?</AppText>
        <AppText variant="caption" color="textTertiary" style={styles.hint}>
          {level.title} · every practice is always available. The order just reflects where you
          are.
        </AppText>
        <View style={styles.stack}>
          {scripts.map((s) => (
            <Card key={s.id} onPress={() => setScript(s)} accessibilityLabel={s.title}>
              <AppText variant="heading">{s.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {s.summary}
              </AppText>
              <AppText variant="caption" color="textTertiary" style={styles.meta}>
                {s.durationsMin.join(', ')} min · {EVIDENCE_LABELS[s.evidenceLevel]}
              </AppText>
            </Card>
          ))}
        </View>
        <Button title="Not now" variant="ghost" onPress={() => close(false)} style={styles.hint} />
      </Screen>
    );
  }

  /* ---- Choosing a length ---- */
  if (!durationMin) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          {script.title}
        </AppText>
        <AppText variant="title">How long have you got?</AppText>
        <View style={styles.chips}>
          {script.durationsMin.map((min) => (
            <Chip key={min} label={`${min} min`} onPress={() => setDurationMin(min)} />
          ))}
        </View>
        {script.safety ? (
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            {script.safety}
          </AppText>
        ) : null}
        <AppText variant="caption" color="textTertiary" style={styles.meta}>
          {script.attribution}.
        </AppText>
        <Button title="Back" variant="ghost" onPress={() => setScript(null)} style={styles.hint} />
      </Screen>
    );
  }

  /* ---- Ready ---- */
  if (!startedAt) {
    return (
      <Screen>
        <AppText variant="label" color="accent">
          {script.title} · {durationMin} min
        </AppText>
        <AppText variant="title">Get comfortable.</AppText>
        <AppText variant="secondary" style={styles.hint}>
          The guidance appears on screen — no sound, so this works anywhere. You can put the phone
          face down and glance at it when you like.
        </AppText>
        <Button
          title="Begin"
          onPress={() => {
            const t = Date.now();
            setStartedAt(t);
            setNow(t);
          }}
        />
        <Button
          title="Back"
          variant="ghost"
          onPress={() => setDurationMin(null)}
          style={styles.hint}
        />
      </Screen>
    );
  }

  /* ---- Sitting ---- */
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        {finished ? (
          <>
            <AppText variant="title">Done.</AppText>
            <AppText variant="secondary">
              {durationMin} minutes. That counts, however it went.
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="heading" style={styles.cue}>
              {cue?.text ?? 'Settle.'}
            </AppText>
            {cue?.detail ? (
              <AppText variant="secondary" color="textSecondary" style={styles.cueDetail}>
                {cue.detail}
              </AppText>
            ) : null}
            <AppText style={[styles.clock, { color: theme.textTertiary }]}>
              {mm}:{ss}
            </AppText>
          </>
        )}
      </View>
      <Button
        title={finished ? 'Close' : 'End early — it still counts'}
        variant={finished ? 'primary' : 'ghost'}
        onPress={() => close(finished)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm, marginTop: Spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xl },
  hint: { marginTop: Spacing.xl },
  meta: { marginTop: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  cue: { textAlign: 'center', fontSize: 24, lineHeight: 34 },
  cueDetail: { textAlign: 'center' },
  clock: { fontSize: 28, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: Spacing.xxl },
});
