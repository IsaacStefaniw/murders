import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import type { TrainingEquipment } from '@/features/training/programme';
import type { AddedExercise } from '@/features/training/sessionEdits';
import { muscleGroupOf } from '@/features/training/sessionName';
import { PATTERNS } from '@/features/training/swap';

/**
 * "Log any lift."
 *
 * Two ways in, because people arrive here for two different reasons. The
 * rack was free and they did chin-ups — that is in the library, one tap.
 * Or they did something the library has never heard of, in which case they
 * type it, and the app takes their word for it rather than refusing a lift
 * because it is not on a list.
 *
 * Nothing added here carries a prescribed load. The programme's numbers
 * come from a tested baseline for a specific lift; a number beside a
 * movement the app has never measured would be a guess in the same
 * typeface as a calculation. Added lifts go by effort until they have a
 * history, which is the rule a swapped lift already follows.
 */

const SETS = [2, 3, 4];
const REPS = ['5', '8–10', '10–12', '12–15', 'AMRAP'];

export function AddALift({
  onAdd,
  equipment,
  alreadyHere,
}: {
  onAdd: (exercise: AddedExercise) => void;
  equipment: TrainingEquipment;
  alreadyHere: string[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [typed, setTyped] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8–10');

  /** Everything in the swap library that works on this equipment. */
  const library = useMemo(() => {
    const here = new Set(alreadyHere);
    const out: { name: string; group: string }[] = [];
    for (const pattern of PATTERNS) {
      for (const m of pattern.movements) {
        if (!m.equipment.includes(equipment) || here.has(m.name)) continue;
        if (out.some((o) => o.name === m.name)) continue;
        out.push({ name: m.name, group: muscleGroupOf(m.name) ?? 'Other' });
      }
    }
    return out;
  }, [equipment, alreadyHere]);

  const chosen = typed.trim() || name;

  if (!open) {
    return (
      <Button
        title="Add a lift"
        variant="secondary"
        hint="Put another movement into this session."
        onPress={() => setOpen(true)}
      />
    );
  }

  return (
    <Card>
      <AppText variant="heading">Add a lift</AppText>
      <AppText variant="caption" color="textSecondary" style={styles.gap}>
        It goes on the end of today&apos;s session, and only today&apos;s. Go by effort — the app
        will not put a number beside a lift it has never measured.
      </AppText>

      {library.length > 0 ? (
        <View style={styles.section}>
          <AppText variant="caption" color="textTertiary">
            From your library
          </AppText>
          <View style={styles.chips}>
            {library.slice(0, 14).map((m) => (
              <Chip
                key={m.name}
                label={m.name}
                hint={m.group}
                selected={name === m.name && !typed.trim()}
                onPress={() => {
                  setName(m.name);
                  setTyped('');
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Field
          label="Or type anything"
          hint="Whatever you did. The app takes your word for it."
          value={typed}
          onChangeText={setTyped}
          placeholder="e.g. Sled push"
          returnKeyType="done"
        />
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          How many sets?
        </AppText>
        <View style={styles.chips}>
          {SETS.map((n) => (
            <Chip key={n} label={`${n}`} selected={sets === n} onPress={() => setSets(n)} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="caption" color="textTertiary">
          Reps
        </AppText>
        <View style={styles.chips}>
          {REPS.map((r) => (
            <Chip key={r} label={r} selected={reps === r} onPress={() => setReps(r)} />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={chosen ? `Add ${chosen}` : 'Add it'}
          disabled={!chosen}
          onPress={() => {
            onAdd({ name: chosen, sets, reps });
            setName('');
            setTyped('');
            setOpen(false);
          }}
        />
        <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.xs },
  section: { marginTop: Spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  actions: { marginTop: Spacing.md, gap: Spacing.xs },
});
