import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { pickVoice, voiceShortlist, VOICE_SAMPLE, type VoiceOption } from '@/features/mind/voice';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/**
 * Guided meditation.
 *
 * Position in the script is derived from elapsed wall-clock time rather
 * than counted by a ticking timer — the same approach as `breathe.tsx`.
 * Nothing accumulates drift, and an app backgrounded mid-session comes back
 * to where the session actually is rather than where it stopped counting.
 *
 * ── Why this speaks ─────────────────────────────────────────────────────
 *
 * The session was text-only and told the person to open their eyes at the
 * end — which only makes sense if they were closed — while the setup screen
 * invited them to "glance at it when you like". Both cannot be true, and
 * the one that loses is the practice: every glance at a screen is the
 * attention leaving the thing it was asked to rest on.
 *
 * The cues are now spoken. The silence between them is the practice and is
 * left alone — nothing is said just to fill it. Text stays on screen for
 * anyone who wants it, for a muted phone, and for anyone who cannot hear
 * the audio; the voice is the default, not the only channel.
 *
 * Synthesis rather than recordings: it works offline, adds no megabytes,
 * ships in every language the device speaks, and — the part that matters
 * here — never sends a word off the phone.
 */
/**
 * The device's locale, without pulling in another native module — every
 * added dependency changes the build fingerprint and cuts installed apps
 * off from over-the-air updates until they take a new binary.
 */
function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-AU';
  } catch {
    return 'en-AU';
  }
}

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
  const [voiceOn, setVoiceOn] = useState(true);
  const [autoVoiceId, setAutoVoiceId] = useState<string | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const chosenVoiceId = useAppStore((s) => s.voicePreference);
  const setVoicePreference = useAppStore((s) => s.setVoicePreference);
  // A stored voice that no longer exists — after a restore, or an OS update
  // that removed it — falls back rather than failing silent.
  const available = voices.some((v) => v.identifier === chosenVoiceId);
  const preferredVoiceId = (available ? chosenVoiceId : null) ?? autoVoiceId;
  /** The last cue spoken, so a re-render never repeats a line mid-breath. */
  const spokenRef = useRef<string | null>(null);

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
  const shortlist = useMemo(() => voiceShortlist(voices, deviceLocale()), [voices]);

  // Asked once, not per cue: enumerating voices is a bridge call, and the
  // installed set does not change mid-session.
  useEffect(() => {
    let live = true;
    void Speech.getAvailableVoicesAsync()
      .then((voices) => {
        if (!live) return;
        setVoices(voices);
        setAutoVoiceId(pickVoice(voices, deviceLocale()));
      })
      // A device with no enumerable voices still speaks with the default.
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  // Speak each cue once, as it arrives. A lower rate and pitch than the
  // system default: guidance read at conversational speed pulls attention
  // forward, which is the opposite of the job.
  useEffect(() => {
    if (!startedAt || !voiceOn || !cue?.text) return;
    if (spokenRef.current === cue.text) return;
    spokenRef.current = cue.text;
    Speech.speak(cue.text, { rate: 0.82, pitch: 0.92, voice: preferredVoiceId ?? undefined });
  }, [cue?.text, startedAt, voiceOn, preferredVoiceId]);

  // Leaving mid-session must not leave a voice talking to an empty room.
  useEffect(() => () => { void Speech.stop(); }, []);

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
          {voiceOn
            ? 'The guidance is spoken, so you can close your eyes and leave them closed. Put the phone down — the words are also on screen if you ever want them.'
            : 'Sound is off, so the guidance stays on screen. Glance at it when a new cue is due.'}
        </AppText>
        <View style={styles.voiceRow}>
          <Chip
            label={voiceOn ? 'Voice on' : 'Voice off'}
            selected={voiceOn}
            onPress={() => setVoiceOn((v) => !v)}
          />
        </View>
        {voiceOn && shortlist.length > 1 ? (
          <View style={styles.voicePick}>
            <AppText variant="caption" color="textTertiary">
              Tap a voice to hear it. The one you pick is remembered.
            </AppText>
            <View style={styles.voiceRow}>
              {shortlist.map((v) => (
                <Chip
                  key={v.identifier}
                  label={v.name || v.language}
                  selected={preferredVoiceId === v.identifier}
                  onPress={() => {
                    setVoicePreference(v.identifier);
                    // Speak on tap: a name tells you nothing, and choosing a
                    // voice you have not heard is not choosing.
                    void Speech.stop();
                    Speech.speak(VOICE_SAMPLE, { rate: 0.82, pitch: 0.92, voice: v.identifier });
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}
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
  voiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  voicePick: { gap: Spacing.sm, marginBottom: Spacing.md },
  hint: { marginTop: Spacing.xl },
  meta: { marginTop: Spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  cue: { textAlign: 'center', fontSize: 24, lineHeight: 34 },
  cueDetail: { textAlign: 'center' },
  clock: { fontSize: 28, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: Spacing.xxl },
});
