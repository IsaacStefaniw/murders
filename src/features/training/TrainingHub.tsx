import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { effortWords } from '@/features/training/effort';
import { CONSTRAINT_OPTIONS, constraintNote } from '@/features/training/constraints';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { estimate1Rm, latest, metricDef, trend } from '@/features/model/metrics';
import { QuestionCard } from '@/features/model/QuestionCard';
import { LevelCard } from '@/features/paths/LevelCard';
import { HiitPicker } from '@/features/training/HiitPicker';
import { LogCardio } from '@/features/training/LogCardio';
import { weekOf } from '@/features/training/programme';
import { useAppStore } from '@/state/store';
import type { PhysicalConstraint } from '@/types/domain';
import { strengthBaseline } from '@/features/training/baseline';
import { latestMaxes } from '@/features/training/level';
import {
  assessStrength,
  participationLine,
  strengthProfile,
  type StrengthLift,
} from '@/features/training/standards';
import {
  answersForWant,
  describeChange,
  focusOptionsFor,
  WANT_OPTIONS,
  wantOf,
  type Want,
} from '@/features/training/want';

const LIFTS = [
  { label: 'Bench', key: 'strength.bench.e1rm' },
  { label: 'Squat', key: 'strength.squat.e1rm' },
  { label: 'Deadlift', key: 'strength.deadlift.e1rm' },
  { label: 'Press', key: 'strength.ohp.e1rm' },
];

/**
 * Training v2 hub section — complexity behind the glass. The user sees
 * their numbers, this week's prescription, and at most ONE question.
 */
const LIFT_LABEL: Record<StrengthLift, string> = {
  bench: 'bench',
  squat: 'squat',
  deadlift: 'deadlift',
  ohp: 'overhead press',
};

export function TrainingHub() {
  const router = useRouter();

  const metrics = useAppStore((s) => s.metrics);
  const programme = useAppStore((s) => s.trainingProgramme);
  const addMetric = useAppStore((s) => s.addMetric);
  const buildTrainingBlock = useAppStore((s) => s.buildTrainingBlock);
  const trainingLevelState = useAppStore((s) => s.trainingLevelState);
  const setPathLevelStepBack = useAppStore((s) => s.setPathLevelStepBack);
  const setPathIntensityPush = useAppStore((s) => s.setPathIntensityPush);
  // Recomputed whenever a log or a metric lands, which is exactly when the
  // ladder can have moved.
  const logCount = useAppStore((s) => s.workoutLogs.length);
  const metricCount = useAppStore((s) => s.metrics.length);
  const stepBack = useAppStore((s) => s.pathLevelStepBack.training);
  const levelState = useMemo(
    () => trainingLevelState(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trainingLevelState, logCount, metricCount, stepBack],
  );

  const [logLift, setLogLift] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');

  // "Change what I'm training for": the two intake questions again, then
  // the block rebuilt from the current numbers. The goal, the logged
  // sessions and the lift history all stay; only the block changes, and
  // one sentence says what did.
  const trainingPath = useAppStore((s) => s.paths.training);
  const updatePathAnswers = useAppStore((s) => s.updatePathAnswers);
  const [changing, setChanging] = useState(false);
  const [want, setWant] = useState<Want | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [changed, setChanged] = useState<string | null>(null);
  const focusOptions = want ? focusOptionsFor(want) : [];
  const openChange = () => {
    setWant(programme ? wantOf(programme.inputs.goal) : null);
    setFocus(trainingPath?.answers.focus ?? null);
    setChanged(null);
    setChanging(true);
  };
  const applyChange = () => {
    if (!want) return;
    const before = programme;
    updatePathAnswers('training', answersForWant(want, focus ?? undefined));
    buildTrainingBlock();
    const after = useAppStore.getState().trainingProgramme;
    if (after) setChanged(describeChange(before, after));
    setChanging(false);
  };

  const week = programme ? weekOf(programme) : null;
  const knownLifts = LIFTS.filter((l) => latest(metrics, l.key));

  const profile = useAppStore((s) => s.profile);

  /**
   * "Change what I am working around" — the injury the app could not hear.
   *
   * `constraints` decides whether the training coach prescribes a loaded
   * lift at all, and it could be given exactly once, during setup. It is a
   * `multi` step, so `YourAnswers` filtered it out; nothing deferred it;
   * and `profilePatchFor` had no case for it, so even a re-answer never
   * reached the profile. Meanwhile the interview promised "you can add
   * something here any time — the plan will adjust from that day".
   *
   * So a man who tore a shoulder in week six had nowhere to say so. The
   * app could hear "I moved to a home gym" and could not hear "my back
   * has gone", which is the most common reason people stop training.
   *
   * It lives behind the same affordance as "Change what I'm training for"
   * rather than as a standing line on this screen, because a permanent
   * "anything to work around?" asks a healthy person about injury every
   * single visit, and this screen already carries five asks.
   *
   * It does NOT rebuild the block. A rebuild mints a new programme id,
   * which resets `weekOf` to one and orphans every swap and drop — an
   * injury report must not cost somebody their block. The constraint
   * takes effect on the next session instead: `session/workout.tsx`
   * applies the same swap table over the programmed session as it is
   * read. Tomorrow's press is a kinder press, and week four is still
   * week four.
   */
  const updateProfile = useAppStore((s) => s.updateProfile);
  const [working, setWorking] = useState(false);
  const [around, setAround] = useState<PhysicalConstraint[]>([]);
  const [aroundNote, setAroundNote] = useState<string | null>(null);
  const openWorking = () => {
    setAround(profile?.constraints ?? []);
    setAroundNote(null);
    setWorking(true);
  };
  const applyWorking = () => {
    // The empty case is the point of the other direction: "the back is
    // better now" has to be sayable, or an injury becomes permanent the
    // moment it is reported.
    updateProfile({ constraints: around.length > 0 ? around : undefined });
    setAroundNote(
      constraintNote(around) ??
        'Nothing to work around now. The full range of movements comes back from your next session.',
    );
    setWorking(false);
  };

  // `band` is the conservative median, and it is what the PROGRAMME reads.
  // Nothing on this screen prints it: see strengthProfile.
  const { band } = useMemo(
    () => assessStrength(latestMaxes(metrics), profile ?? {}),
    [metrics, profile],
  );
  // The shape, not the median. `band` still drives the programme; this is
  // what the person reads. See strengthProfile for why they differ.
  const shape = useMemo(
    () => strengthProfile(latestMaxes(metrics), profile ?? {}),
    [metrics, profile],
  );
  // Named plainly, because "we cannot assess you" is only useful with the
  // reason attached.
  /**
   * The weight-and-reps form, defined once and rendered in two places:
   * beside the placement card when the app cannot place somebody yet, and
   * in its own section further down for everybody else.
   *
   * It used to exist only in the second place — below the whole programme
   * — while the card at the top said "add your lifts" with no way to. That
   * is how a 130 kg bench ended up on a foundation block.
   */
  const liftEntry = () => (
    <View style={styles.inputRow}>
      <Field
        label={`${LIFTS.find((l) => l.key === logLift)?.label ?? 'Lift'} weight in kilograms`}
        showLabel={false}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        placeholder="kg"
        width={84}
      />
      <Field
        label="Repetitions completed"
        showLabel={false}
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
        placeholder="reps"
        width={84}
      />
      <Button
        title="Save"
        hint="Estimates your one-rep max from this set and adds it to your numbers."
        disabled={!Number(weight) || !Number(reps)}
        onPress={() => {
          if (!logLift) return;
          const e1rm = saveLift(logLift, Number(weight), Number(reps));
          setWeight('');
          setReps('');
          setLogLift(null);
          void e1rm;
        }}
      />
    </View>
  );

  const missingForBand: string[] = [];
  if (!profile?.weightKg) missingForBand.push('your bodyweight');
  if (profile?.sexAtBirth !== 'male' && profile?.sexAtBirth !== 'female') {
    missingForBand.push('sex at birth');
  }
  if (Object.keys(latestMaxes(metrics)).length === 0) missingForBand.push('a main lift');

  const saveLift = (key: string, w: number, r: number) => {
    const e1rm = estimate1Rm(w, r);
    addMetric(key, e1rm, `${w} kg × ${r}`);
    return e1rm;
  };

  return (
    <View>
      {/* The ladder first: it explains why the block below looks the way
          it does, and it is the thing worth coming back for. */}
      <SectionHeader title="Where you are" />
      <LevelCard
        path="training"
        level={levelState.level}
        evidence={levelState.evidence}
        progress={levelState.progress}
        steppedBack={levelState.steppedBack}
        onStepBack={(l) => setPathLevelStepBack('training', l)}
        pushing={levelState.pushing}
        onPush={(push) => setPathIntensityPush('training', push)}
      />

      {/* Where the lifts put you, and — when the app cannot say — exactly
          what is missing. "Is my training program advanced or the same for
          every other user?" deserves an answer on the screen, and when the
          honest answer is "I cannot tell yet", so does that. */}
      <Card style={styles.bandCard}>
        {band ? (
          <>
            {/* The comparison class, in the label rather than buried in a
                caption. "Beginner" over a 130 kg bench is not wrong about
                the arithmetic — it is silent about "against whom", and the
                reader supplies the worst answer. */}
            <AppText variant="label" color="textTertiary">
              Your lifts
            </AppText>
            <AppText variant="heading">{shape.headline}</AppText>
            <AppText variant="secondary" style={styles.shapeDetail}>
              {shape.detail}
            </AppText>
            {/* Every lift, with its own band. One word for a whole person
                hides the only interesting thing in the numbers. */}
            <View style={styles.liftBands}>
              {shape.lifts.map((l) => (
                <View key={l.lift} style={styles.liftBandRow}>
                  <AppText variant="body">{LIFT_LABEL[l.lift]}</AppText>
                  <AppText variant="body">{l.ratio.toFixed(2)}× bodyweight</AppText>
                  {/* The lift described, not the person graded. */}
                  {l.context ? (
                    <AppText variant="caption" color="textTertiary">
                      {l.context.line}
                    </AppText>
                  ) : null}
                </View>
              ))}
            </View>
            {/* The one population fact that is actually measured, rather
                than a percentile nobody has the data to compute. */}
            {participationLine(profile ?? {}) ? (
              <AppText variant="caption" color="textTertiary">
                {participationLine(profile ?? {})}
              </AppText>
            ) : null}
            <AppText variant="caption" color="textTertiary" style={styles.shapeDetail}>
              There is no percentile here on purpose. Nobody has one-rep-max tested a
              representative sample of adults on these lifts, so every published figure
              comes from people who already lift and chose to record it. The marks above
              are theirs, and they are a description of a lift rather than a grade for
              you.
            </AppText>
          </>
        ) : (
          <>
            <AppText variant="label" color="textTertiary">
              Against the population tables
            </AppText>
            <AppText variant="heading">Not enough to say yet</AppText>
            <AppText variant="caption" color="textTertiary">
              {missingForBand.length > 0
                ? `Add ${missingForBand.join(' and ')} and IntentNorth can place your lifts and start you at the right level rather than the first one.`
                : 'Log a main lift and IntentNorth can place you.'}
            </AppText>
            {/* The copy above told people to add their lifts and then left
                them to find the form at the bottom of the page, under the
                whole programme. That is how an experienced lifter ends up
                on a foundation block: not a banding error, just a question
                nobody was given a way to answer. */}
            <View style={styles.liftEntryHere}>
              <AppText variant="caption" color="textTertiary">
                One normal set of each is enough — a weight and the reps you got.
              </AppText>
              <View style={styles.chips}>
                {LIFTS.map((l) => (
                  <Chip
                    key={l.key}
                    label={l.label}
                    selected={logLift === l.key}
                    onPress={() => setLogLift(logLift === l.key ? null : l.key)}
                  />
                ))}
              </View>
              {logLift ? liftEntry() : null}
            </View>
          </>
        )}
      </Card>

      {/* Your numbers — the simple, meaningful progress line. */}
      {knownLifts.length > 0 ? (
        <View>
          <SectionHeader title="Your strongest single lift" />
          <View style={styles.stack}>
            {knownLifts.map((l) => {
              const read = strengthBaseline(metrics, l.key)!;
              const t = trend(metrics, l.key, 90);
              return (
                <Card key={l.key} style={styles.row}>
                  <View style={styles.grow}>
                    <AppText variant="body">{l.label}</AppText>
                    <AppText variant="caption" color="textTertiary">
                      {read.fromRetest && read.observations === 1
                        ? 'From your retest'
                        : read.observations === 1
                          ? 'One session so far'
                          : `Best of ${read.observations} sessions, last 12 weeks`}
                    </AppText>
                  </View>
                  <AppText variant="heading">
                    {t && t.direction !== 'flat' ? `${t.from} → ${t.to}` : read.value}{' '}
                    {metricDef(l.key)?.unit}
                  </AppText>
                  {t?.direction === 'up' ? (
                    <AppText variant="caption" color="success">
                      ▲ {t.delta}
                    </AppText>
                  ) : null}
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* One question, not an assessment. */}
      <QuestionCard domain="training" />

      {/* The block. */}
      <SectionHeader
        title={programme && week ? `This block · Week ${week} — ${programme.weeks[week - 1].phase}` : 'Your programme'}
      />
      {programme && week ? (
        <View style={styles.stack}>
          <AppText variant="caption" color="textTertiary">
            {programme.weeks[week - 1].focus}
          </AppText>
          {programme.weeks[week - 1].sessions.map((s) => (
            <Card key={s.title}>
              <AppText variant="heading">{s.title}</AppText>
              <AppText variant="caption" color="textTertiary">
                {s.exercises[0].name} {s.exercises[0].sets} × {s.exercises[0].reps}
                {s.exercises[0].loadKg
                  ? ` @ ${s.exercises[0].loadKg} kg`
                  : s.exercises[0].rpe
                    ? ` · ${effortWords(s.exercises[0].rpe)}`
                    : ''}
                {' · ~'}
                {s.estimatedMin} min
              </AppText>
            </Card>
          ))}
          <Button
            title="Start today's session"
            onPress={() => router.push('/session/workout' as never)}
          />
          {/* Planned for you, changeable by you — both halves of what
              Isaac asked for. Only appears on a block that carries
              conditioning at all. */}
          {programme.inputs.goal === 'fitter' ? <HiitPicker /> : null}
          <LogCardio />
        </View>
      ) : (
        <View style={styles.stack}>
          {programme ? (
            <AppText variant="secondary">
              Block complete. Retest a lift below, then rebuild — the next block starts from your
              new numbers.
            </AppText>
          ) : (
            <AppText variant="secondary">
              Four weeks: two building, one peak, then an easier week to let it all catch up.
              Sized to your days, your equipment and your numbers.
            </AppText>
          )}
          <Button
            title={programme ? 'Rebuild from my new numbers' : 'Build my 4-week block'}
            onPress={buildTrainingBlock}
          />
        </View>
      )}

      {/* What the block is for, and the way to change it. Only once the
          path has been started, because that is where the answers live. */}
      {trainingPath ? (
        <View style={styles.changeBlock}>
          {changing ? (
            <Card style={styles.stack}>
              <AppText variant="heading">What do you want from training?</AppText>
              <View style={styles.chips}>
                {WANT_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={want === o.value}
                    onPress={() => {
                      setWant(o.value);
                      setFocus(null);
                    }}
                  />
                ))}
              </View>
              {want && focusOptions.length > 0 ? (
                <>
                  <AppText variant="body">Where first?</AppText>
                  <View style={styles.chips}>
                    {focusOptions.map((o) => (
                      <Chip
                        key={o.value}
                        label={o.label}
                        selected={focus === o.value}
                        onPress={() => setFocus(o.value)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
              <View style={styles.inputRow}>
                <Button
                  title="Rebuild the block"
                  hint="Rebuilds the four-week block from your current numbers. Your logged sessions stay."
                  disabled={!want || (focusOptions.length > 0 && !focus)}
                  onPress={applyChange}
                />
                <Button title="Keep it as it is" variant="ghost" onPress={() => setChanging(false)} />
              </View>
              <AppText variant="caption" color="textTertiary">
                Your logged sessions and your numbers stay. Only the block is rebuilt, from where your
                lifts are now.
              </AppText>
            </Card>
          ) : working ? (
            <Card style={styles.stack}>
              <AppText variant="heading">Anything the plan should work around?</AppText>
              <AppText variant="body" color="textSecondary">
                Nothing here is medical advice — it keeps the plan sensible. Take something off when it
                is better.
              </AppText>
              <View style={styles.chips}>
                {CONSTRAINT_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    selected={around.includes(o.value)}
                    onPress={() =>
                      setAround((cur) =>
                        cur.includes(o.value) ? cur.filter((c) => c !== o.value) : [...cur, o.value],
                      )
                    }
                  />
                ))}
              </View>
              <View style={styles.inputRow}>
                <Button
                  title="Save this"
                  hint="Changes your next session. Your block, your week and your logged sessions stay exactly as they are."
                  onPress={applyWorking}
                />
                <Button title="Cancel" variant="ghost" onPress={() => setWorking(false)} />
              </View>
              <AppText variant="caption" color="textTertiary">
                Movements that do not suit are replaced, not removed — the same pattern, a version that
                works. A swapped lift goes by effort rather than a weight, because the number was
                worked out for the other movement.
              </AppText>
            </Card>
          ) : (
            <>
              <Button title="Change what I'm training for" variant="ghost" onPress={openChange} />
              {/* The injury half. Behind the same affordance rather than
                  standing on the screen, so a healthy person is not asked
                  about injury on every visit. */}
              <Button title="Change what I am working around" variant="ghost" onPress={openWorking} />
            </>
          )}
          {changed ? (
            <AppText variant="caption" color="accent">
              {changed}
            </AppText>
          ) : null}
          {aroundNote ? (
            <AppText variant="caption" color="accent">
              {aroundNote}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {/* Log a lift — PRs feed everything. */}
      <SectionHeader title="Log a lift" />
      <View style={styles.chips}>
        {LIFTS.map((l) => (
          <Chip
            key={l.key}
            label={l.label}
            selected={logLift === l.key}
            onPress={() => setLogLift(logLift === l.key ? null : l.key)}
          />
        ))}
      </View>
      {logLift ? liftEntry() : null}
      <AppText variant="caption" color="textTertiary" style={styles.hint}>
        One normal set is enough. IntentNorth works out what you could lift once, and tracks
        whether it is going up.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  shapeDetail: { marginTop: Spacing.sm },
  liftBands: { gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.md },
  liftBandRow: { gap: 2 },
  bandCard: { gap: Spacing.xs },
  liftEntryHere: { marginTop: Spacing.md, gap: Spacing.xs },
  stack: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  changeBlock: { gap: Spacing.sm, marginTop: Spacing.md },
  hint: { marginTop: Spacing.sm },
});
