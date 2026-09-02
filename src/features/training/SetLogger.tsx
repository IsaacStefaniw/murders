/**
 * Per-set capture: weight and reps, as performed.
 *
 * The old player counted taps, which is why `strength.*.e1rm` had never been
 * fed by a real session. It also meant a mistyped or misremembered set could
 * not be corrected, because nothing had been written down to correct.
 *
 * Both numbers are prefilled — from what the programme prescribed, or from
 * what you did last time, whichever exists — so the common case is still one
 * tap. Typing is for the day the common case is wrong, which in a gym is
 * most days.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LoggedSet } from '@/types/domain';

import { defaultRepsFrom } from './log';
export { defaultRepsFrom, topRepsFrom } from './log';

interface Props {
  exercise: string;
  /** How many sets the session prescribes. */
  prescribedSets: number;
  /** Prescribed reps as written ("6–10", "5", "45 sec"). */
  prescribedReps: string;
  /** Sets already recorded for this exercise, in order. */
  sets: LoggedSet[];
  /** Prefill for the next set's weight, from the programme or from last time. */
  suggestedWeightKg?: number;
  suggestedReps?: number;
  /** One line of context: what happened last time, or why the load moved. */
  reference?: string;
  onAddSet: (reps: number, weightKg?: number) => void;
  onEditSet: (setId: string, patch: Partial<LoggedSet>) => void;
  onRemoveSet: (setId: string) => void;
}

export function SetLogger({
  exercise,
  prescribedSets,
  prescribedReps,
  sets,
  suggestedWeightKg,
  suggestedReps,
  reference,
  onAddSet,
  onEditSet,
  onRemoveSet,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftWeight, setDraftWeight] = useState('');
  const [draftReps, setDraftReps] = useState('');

  const fallbackReps = suggestedReps ?? defaultRepsFrom(prescribedReps);
  const lastSet = sets[sets.length - 1];
  const [reps, setReps] = useState(String(lastSet?.reps ?? fallbackReps ?? ''));
  const [weight, setWeight] = useState(
    String(lastSet?.weightKg ?? suggestedWeightKg ?? ''),
  );

  const complete = sets.length >= prescribedSets;

  const add = () => {
    const r = Number(reps);
    if (!Number.isFinite(r) || r <= 0) return;
    const w = Number(weight);
    onAddSet(r, Number.isFinite(w) && w > 0 ? w : undefined);
  };

  const numberField = (
    value: string,
    onChange: (v: string) => void,
    label: string,
    accessibilityLabel: string,
  ) => (
    <View style={styles.field}>
      <Field
        label={accessibilityLabel}
        showLabel={false}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        // Compact and fixed, the way the row read before — but now on a
        // 44pt-tall control instead of the 34pt one it used to be.
        width={72}
      />
      <AppText variant="caption" color="textTertiary">
        {label}
      </AppText>
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: complete ? theme.accent : theme.border },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${exercise}, ${sets.length} of ${prescribedSets} sets recorded`}
        onPress={() => setOpen(!open)}
        style={styles.header}
      >
        <View style={styles.headerInfo}>
          <AppText variant="body" style={styles.name}>
            {exercise}
          </AppText>
          <AppText variant="caption" color="textTertiary">
            {prescribedReps}
            {reference ? ` · ${reference}` : ''}
          </AppText>
        </View>
        <AppText variant="heading" color={complete ? 'success' : 'textSecondary'}>
          {sets.length}/{prescribedSets}
        </AppText>
      </Pressable>

      {sets.length > 0 ? (
        <View style={styles.setList}>
          {sets.map((s) =>
            editing === s.id ? (
              <View key={s.id} style={styles.editRow}>
                {/*
                  Edits are held locally and committed on Done rather than
                  written per keystroke. Every write re-derives the session's
                  e1RM and re-runs the whole evidence pass, so typing "125"
                  used to do that three times — and the field's value coming
                  back from the store mid-keystroke is how cursors jump.
                */}
                {numberField(draftWeight, setDraftWeight, 'kg', `Set ${s.index} weight`)}
                {numberField(draftReps, setDraftReps, 'reps', `Set ${s.index} reps`)}
                <Chip
                  label="Done"
                  selected
                  onPress={() => {
                    const r = Number(draftReps);
                    const w = Number(draftWeight);
                    onEditSet(s.id, {
                      reps: Number.isFinite(r) && r > 0 ? r : s.reps,
                      weightKg: draftWeight.trim() === '' || !Number.isFinite(w) || w <= 0
                        ? undefined
                        : w,
                    });
                    setEditing(null);
                  }}
                />
                <Chip label="Delete" onPress={() => onRemoveSet(s.id)} />
              </View>
            ) : (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`Edit set ${s.index}`}
                onPress={() => {
                  setDraftWeight(String(s.weightKg ?? ''));
                  setDraftReps(String(s.reps));
                  setEditing(s.id);
                }}
                style={styles.setRow}
              >
                <AppText variant="caption" color="textTertiary">
                  Set {s.index}
                </AppText>
                <AppText variant="body">
                  {s.weightKg ? `${s.weightKg} kg × ${s.reps}` : `${s.reps} reps`}
                </AppText>
              </Pressable>
            ),
          )}
        </View>
      ) : null}

      {open || sets.length > 0 ? (
        <View style={styles.addRow}>
          {numberField(weight, setWeight, 'kg', `${exercise} weight`)}
          {numberField(reps, setReps, 'reps', `${exercise} reps`)}
          <Chip label={sets.length === 0 ? 'Log set' : 'Log another'} selected onPress={add} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  headerInfo: { flexShrink: 1, gap: 2 },
  name: { fontWeight: '600' },
  setList: { gap: Spacing.xs },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: Spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: Spacing.sm },
  field: { gap: 2 },
});
