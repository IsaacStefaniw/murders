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
  onAddSet: (reps: number, weightKg?: number, rpe?: number) => void;
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

  /**
   * ── How hard it was, which is what moves the weight ──────────────
   *
   * Isaac's screen, mid-session on 11 Nov 2026: *"Last time: 10/6/7/7 (no
   * effort noted, so the load stays)."*
   *
   * That sentence was true and it was a dead end. `progression.ts`
   * progresses only when the top set made its reps **and** had something
   * left — `reserveOf` returns null for a set with no `rpe`, and the
   * rule treats the condition as unmet rather than met, deliberately,
   * because *"an absent RPE is not a zero — it is silence."*
   *
   * **And this component had no way to record it.** `onAddSet` took reps
   * and a weight. `makeSet` has always accepted an `rpe` and nothing ever
   * passed one. So the load could never move, on any lift, for anybody,
   * and the app said so on screen every session without the sentence
   * being actionable.
   *
   * I wrote the rule, wrote the comment about silence, wired it to the
   * screen, and never checked the screen could answer it.
   *
   * ── Why three words rather than a number ─────────────────────
   *
   * "RPE 8" is jargon that drifts between people and within one person
   * over a year. `reserveLine` already speaks the other language — *"stop
   * with 1–2 reps left"* — so the control asks the same question in the
   * same words, and the mapping to a number happens here.
   *
   * Staying unanswered is a real option and the default. Silence is
   * meaningful to the rule, and a control that forced a guess would feed
   * it worse data than no data.
   */
  const [left, setLeft] = useState<number | undefined>();

  const complete = sets.length >= prescribedSets;

  const add = () => {
    const r = Number(reps);
    if (!Number.isFinite(r) || r <= 0) return;
    const w = Number(weight);
    onAddSet(
      r,
      Number.isFinite(w) && w > 0 ? w : undefined,
      left === undefined ? undefined : 10 - left,
    );
    // Cleared so the next set is answered on its own merits. Carrying the
    // last answer forward would turn one tap into a default.
    setLeft(undefined);
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
        <>
          <View style={styles.effortRow}>
            <AppText variant="caption" color="textTertiary">
              Left in the tank:
            </AppText>
            {[
              { label: '2+', value: 2 },
              { label: '1', value: 1 },
              { label: 'none', value: 0 },
            ].map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={left === o.value}
                hint={
                  o.value === 0
                    ? 'Taken to the limit. The weight holds — reps at zero reserve are not evidence it is ready to move.'
                    : 'Enough left that the weight can move next time.'
                }
                onPress={() => setLeft(left === o.value ? undefined : o.value)}
              />
            ))}
          </View>
          <View style={styles.addRow}>
            {numberField(weight, setWeight, 'kg', `${exercise} weight`)}
            {numberField(reps, setReps, 'reps', `${exercise} reps`)}
            <Chip label={sets.length === 0 ? 'Log set' : 'Log another'} selected onPress={add} />
          </View>
        </>
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
  effortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  field: { gap: 2 },
});
