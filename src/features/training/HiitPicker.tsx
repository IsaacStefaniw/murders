import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Disclosure } from '@/components/disclosure';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { defaultHiit, hiitById, hiitOptions, whyNoIntervals } from '@/features/training/hiit';
import { useAppStore } from '@/state/store';

/**
 * The interval session, planned for you and changeable by you.
 *
 * Isaac: "I think HIIT should be planned but then also selectable or
 * changeable. Have different HIIT options as well."
 *
 * Both halves matter and they pull in opposite directions. A block that
 * plans nothing makes you decide every week, and deciding is the step
 * people skip. A block that plans one thing and will not budge gets
 * abandoned the first week the knee hurts or the gym bike is taken. So:
 * one is chosen, it is named, and every alternative is one tap away with
 * its own reasoning attached.
 *
 * What the picker will not do is present them as interchangeable. Each
 * carries where it came from, who it suits and what most often goes wrong
 * with it, because choosing between eight protocols with nothing to go on
 * is not a choice, it is a menu. And the all-out ones are simply absent
 * until there is a base behind them — a person cannot pick their way into
 * a maximal protocol here.
 */
export function HiitPicker() {
  const profile = useAppStore((s) => s.profile);
  const programme = useAppStore((s) => s.trainingProgramme);
  const workoutLogs = useAppStore((s) => s.workoutLogs);
  const cardioLogs = useAppStore((s) => s.cardioLogs);
  const chosenId = useAppStore((s) => s.hiitChoice);
  const setHiitChoice = useAppStore((s) => s.setHiitChoice);
  const [expanded, setExpanded] = useState<string | null>(null);

  const constraints = profile?.constraints;
  const sessionMin = programme?.inputs.sessionMin;

  /**
   * "A base behind them" measured rather than asserted: a dozen sessions
   * of any kind on the books. It is a low bar on purpose — the point is to
   * keep somebody's first week out of a maximal protocol, not to gate the
   * library behind months of logging.
   */
  const hasBase = workoutLogs.length + cardioLogs.length >= 12;

  const options = useMemo(
    () => hiitOptions(constraints, { hasBase, minutesAvailable: sessionMin }),
    [constraints, hasBase, sessionMin],
  );
  const planned = useMemo(
    () =>
      (chosenId ? hiitById(chosenId) : null) ??
      defaultHiit(constraints, { hasBase, minutesAvailable: sessionMin }),
    [chosenId, constraints, hasBase, sessionMin],
  );

  const vetoed = whyNoIntervals(constraints);
  if (vetoed) {
    return (
      <Card>
        <AppText variant="heading">Intervals</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          {vetoed}
        </AppText>
      </Card>
    );
  }

  if (!planned) {
    return (
      <Card>
        <AppText variant="heading">Intervals</AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          {sessionMin
            ? `None of these fit ${sessionMin} minutes. Give a session a little more room in your training answers and they come back.`
            : 'Build your block first and the interval session gets planned with it.'}
        </AppText>
      </Card>
    );
  }

  return (
    <Card>
      <AppText variant="label" color="textSecondary">
        Your interval session
      </AppText>
      <AppText variant="heading" style={styles.gap}>
        {planned.name}
      </AppText>
      <AppText variant="body" color="textSecondary">
        {planned.shape}
      </AppText>
      <AppText variant="caption" color="textTertiary" style={styles.gap}>
        About {planned.totalMin} minutes, warm-up and cool-down included.
        {chosenId ? ' Your choice.' : ' Planned for you — change it any time.'}
      </AppText>

      <View style={styles.block}>
        <AppText variant="caption" color="textSecondary">
          <AppText variant="caption">How hard: </AppText>
          {planned.effort}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          <AppText variant="caption">Between rounds: </AppText>
          {planned.recovery}
        </AppText>
        <AppText variant="caption" color="textSecondary" style={styles.gap}>
          <AppText variant="caption">Watch for: </AppText>
          {planned.watchFor}
        </AppText>
      </View>

      <Disclosure title="Where this one comes from">
        <AppText variant="caption" color="textSecondary">
          {planned.origin}
        </AppText>
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          Evidence grade {planned.evidenceLevel}.
        </AppText>
      </Disclosure>

      {options.length > 1 ? (
        <View style={styles.block}>
          <AppText variant="caption" color="textTertiary">
            Or pick another. Tap one to read what it is for.
          </AppText>
          <View style={styles.chips}>
            {options.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                selected={s.id === planned.id}
                hint={`${s.shape}. About ${s.totalMin} minutes.`}
                onPress={() => setExpanded(expanded === s.id ? null : s.id)}
              />
            ))}
          </View>
          {expanded ? (
            <View style={styles.expanded}>
              {(() => {
                const s = hiitById(expanded)!;
                return (
                  <>
                    <AppText variant="body">{s.name}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {s.shape} · about {s.totalMin} min
                    </AppText>
                    <AppText variant="caption" color="textSecondary" style={styles.gap}>
                      {s.suits}
                    </AppText>
                    {s.id === planned.id ? (
                      <AppText variant="caption" color="textTertiary" style={styles.gap}>
                        This is the one you are doing.
                      </AppText>
                    ) : (
                      <Button
                        title={`Do ${s.name.toLowerCase()} instead`}
                        variant="secondary"
                        onPress={() => {
                          setHiitChoice(s.id);
                          setExpanded(null);
                        }}
                      />
                    )}
                  </>
                );
              })()}
            </View>
          ) : null}
          {chosenId ? (
            <Button
              title="Go back to the planned one"
              variant="ghost"
              onPress={() => setHiitChoice(null)}
            />
          ) : null}
        </View>
      ) : null}

      {!hasBase ? (
        <AppText variant="caption" color="textTertiary" style={styles.block}>
          The all-out protocols — Tabata, sprint intervals — appear once there are a dozen sessions
          behind you. They are genuinely maximal efforts studied in trained people, and they are not
          a harder version of the ones above so much as a different thing.
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.xs },
  block: { marginTop: Spacing.md, gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  expanded: { marginTop: Spacing.sm, gap: Spacing.xs },
});
