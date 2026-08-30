import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { newId } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import type { Goal, LifeArea, Routine, Weekday } from '@/types/domain';

const AREAS: { value: LifeArea; label: string }[] = [
  { value: 'health', label: 'Health' },
  { value: 'family', label: 'Family' },
  { value: 'relationship', label: 'Relationship' },
  { value: 'work', label: 'Work & business' },
  { value: 'growth', label: 'Growth' },
  { value: 'enjoyment', label: 'Enjoyment' },
];

const CADENCES = [1, 2, 3, 4, 5];
const DEEP_WORK_OPTIONS = [1, 2, 3];

const RITUALS: { key: string; label: string; build: (goalId: string) => Routine }[] = [
  {
    key: 'date_night',
    label: 'Weekly date night',
    build: (goalId) => ({
      id: newId('r'),
      title: 'Date night',
      area: 'relationship',
      goalId,
      days: [5],
      durationMin: 120,
      preferredStart: '19:30',
      preferredEnd: '20:15',
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'should',
      active: true,
    }),
  },
  {
    key: 'walk',
    label: 'Evening walk together',
    build: (goalId) => ({
      id: newId('r'),
      title: 'Evening walk together',
      area: 'relationship',
      goalId,
      days: [2, 4],
      durationMin: 30,
      preferredStart: '19:15',
      preferredEnd: '20:00',
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    }),
  },
  {
    key: 'checkin',
    label: 'Sunday check-in chat',
    build: (goalId) => ({
      id: newId('r'),
      title: 'Check-in chat',
      area: 'relationship',
      goalId,
      days: [0],
      durationMin: 30,
      preferredStart: '20:00',
      preferredEnd: '20:45',
      energy: 'evening',
      flexible: true,
      protected: false,
      tier: 'could',
      active: true,
    }),
  },
];

/**
 * Goal wizard. A goal is only real once it owns time: work goals claim
 * deep-work blocks inside work hours, relationship goals become rituals,
 * everything else becomes a weekly cadence the planner schedules.
 */
export default function NewGoal() {
  const router = useRouter();
  const theme = useTheme();
  const addGoal = useAppStore((s) => s.addGoal);
  const profile = useAppStore((s) => s.profile);

  const [title, setTitle] = useState('');
  const [why, setWhy] = useState('');
  const [area, setArea] = useState<LifeArea>('health');
  const [cadence, setCadence] = useState<number | undefined>();
  const [deepWork, setDeepWork] = useState<number | undefined>();
  const [milestone, setMilestone] = useState('');
  const [rituals, setRituals] = useState<Set<string>>(new Set());

  const isWork = area === 'work' || area === 'growth';
  const isRelationship = area === 'relationship';

  const save = () => {
    const goalId = newId('g');
    const routines: Routine[] = [];

    if (isRelationship) {
      for (const ritual of RITUALS) {
        if (rituals.has(ritual.key)) routines.push(ritual.build(goalId));
      }
    } else if (isWork && deepWork) {
      const workDays: Weekday[] = profile?.workDays?.length ? profile.workDays : [1, 2, 3, 4, 5];
      routines.push({
        id: newId('r'),
        title: `Deep work: ${title.trim()}`,
        area: 'work',
        goalId,
        days: workDays.slice(0, deepWork),
        durationMin: 60,
        preferredStart: '09:15',
        preferredEnd: '10:15',
        energy: 'morning',
        flexible: false,
        protected: false,
        duringWork: true,
        tier: 'must',
        active: true,
      });
    } else if (!isRelationship && !isWork && cadence) {
      const spread: Weekday[] = [1, 3, 5, 6, 2, 4, 0];
      routines.push({
        id: newId('r'),
        title: title.trim(),
        area,
        goalId,
        days: spread.slice(0, cadence).sort((a, b) => a - b),
        durationMin: 45,
        preferredStart: '12:05',
        preferredEnd: '13:30',
        energy: 'any',
        flexible: true,
        protected: false,
        tier: 'should',
        active: true,
      });
    }

    const goal: Goal = {
      id: goalId,
      title: title.trim(),
      area,
      why: why.trim() || undefined,
      cadencePerWeek: isRelationship || isWork ? undefined : cadence,
      firstMilestone: milestone.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString(),
      routineIds: routines.map((r) => r.id),
    };
    addGoal(goal, routines);
    router.back();
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
  ];

  return (
    <Screen>
      <AppText variant="title">New goal</AppText>

      <SectionHeader title="What do you want?" />
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={isWork ? 'e.g. Launch the new offer' : 'e.g. Read 20 minutes a day'}
        placeholderTextColor={theme.textTertiary}
        autoFocus
        style={inputStyle}
      />

      <SectionHeader title="Why does it matter?" />
      <TextInput
        value={why}
        onChangeText={setWhy}
        placeholder="Optional — INTENT uses this to keep the goal honest"
        placeholderTextColor={theme.textTertiary}
        style={inputStyle}
      />

      <SectionHeader title="Life area" />
      <View style={styles.chips}>
        {AREAS.map((a) => (
          <Chip key={a.value} label={a.label} selected={area === a.value} onPress={() => setArea(a.value)} />
        ))}
      </View>

      {isWork ? (
        <View>
          <SectionHeader title="Protected deep-work blocks" />
          <View style={styles.chips}>
            {DEEP_WORK_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={`${n}× 60 min`}
                selected={deepWork === n}
                onPress={() => setDeepWork(deepWork === n ? undefined : n)}
              />
            ))}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            Carved out of your work mornings as fixed blocks — the goal owns that time, meetings
            don&apos;t.
          </AppText>
          <SectionHeader title="First milestone" />
          <TextInput
            value={milestone}
            onChangeText={setMilestone}
            placeholder="Optional — the first concrete step"
            placeholderTextColor={theme.textTertiary}
            style={inputStyle}
          />
        </View>
      ) : isRelationship ? (
        <View>
          <SectionHeader title="Pick your rituals" />
          <View style={styles.chips}>
            {RITUALS.map((r) => (
              <Chip
                key={r.key}
                label={r.label}
                selected={rituals.has(r.key)}
                onPress={() =>
                  setRituals((prev) => {
                    const next = new Set(prev);
                    if (next.has(r.key)) {
                      next.delete(r.key);
                    } else {
                      next.add(r.key);
                    }
                    return next;
                  })
                }
              />
            ))}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            Relationships grow on rhythm, not intention. Each ritual gets scheduled automatically.
          </AppText>
        </View>
      ) : (
        <View>
          <SectionHeader title="Schedule it weekly?" />
          <View style={styles.chips}>
            {CADENCES.map((c) => (
              <Chip
                key={c}
                label={`${c}×`}
                selected={cadence === c}
                onPress={() => setCadence(cadence === c ? undefined : c)}
              />
            ))}
          </View>
          <AppText variant="caption" color="textTertiary" style={styles.hint}>
            {cadence
              ? `INTENT will place ${cadence} session${cadence > 1 ? 's' : ''} into your week and adapt the timing to what you actually complete.`
              : 'Without a cadence this stays an ambition — you can break it down later.'}
          </AppText>
        </View>
      )}

      <View style={styles.footer}>
        <Button title="Add goal" onPress={save} disabled={title.trim().length < 3} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 17,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  hint: { marginTop: Spacing.md },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
