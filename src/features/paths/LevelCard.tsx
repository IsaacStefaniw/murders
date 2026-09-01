import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  LEVEL_BLURB,
  LEVEL_GATES,
  LEVEL_LABEL,
  LEVEL_ORDER,
  levelRank,
  type LevelEvidence,
  type LevelProgress,
  type PathLevel,
} from './level';
import type { PathId } from './definitions';

interface LevelCardProps {
  path: PathId;
  level: PathLevel;
  evidence: LevelEvidence;
  progress: LevelProgress;
  steppedBack: boolean;
  onStepBack: (level: PathLevel | null) => void;
}

/**
 * The ladder, made visible.
 *
 * A level that changes without warning is a bug report. A level you can
 * watch yourself climbing is a reason to come back — and unlike a streak,
 * it is not destroyed by one missed week, because the two things it counts
 * (sessions and weeks) only ever go up.
 *
 * The step-back control is deliberately as prominent as the progress. An
 * app that only offers a way up is one people quietly fail out of.
 */
export function LevelCard({
  path,
  level,
  evidence,
  progress,
  steppedBack,
  onStepBack,
}: LevelCardProps) {
  const theme = useTheme();
  const [adjusting, setAdjusting] = useState(false);

  const next = progress.next;
  const gate = next ? LEVEL_GATES[path][next] : null;
  // Two bars rather than one: they measure different things, and a single
  // merged number would hide which half is actually outstanding.
  const sessionFrac = gate?.sessions ? Math.min(1, evidence.sessions / gate.sessions) : 1;
  const weekFrac = gate?.weeks ? Math.min(1, evidence.weeks / gate.weeks) : 1;

  const lower = LEVEL_ORDER.filter((l) => levelRank(l) < levelRank(level));

  return (
    <Card>
      <View style={styles.head}>
        <AppText variant="label" color="textSecondary">
          Level
        </AppText>
        <AppText variant="heading">{LEVEL_LABEL[level]}</AppText>
      </View>

      <AppText variant="secondary" style={styles.blurb}>
        {LEVEL_BLURB[path][level]}
      </AppText>

      {next ? (
        <View
          style={styles.progress}
          accessible
          accessibilityLabel={`Progress to ${LEVEL_LABEL[next]}. ${progress.text}`}
        >
          <Meter
            label="Sessions"
            have={evidence.sessions}
            need={gate!.sessions}
            frac={sessionFrac}
            color={theme.accent}
            track={theme.border}
          />
          <Meter
            label="Weeks"
            have={evidence.weeks}
            need={gate!.weeks}
            frac={weekFrac}
            color={theme.accent}
            track={theme.border}
          />
          <AppText variant="caption" color="textTertiary">
            {progress.text}
          </AppText>
        </View>
      ) : (
        <AppText variant="caption" color="textTertiary" style={styles.blurb}>
          {progress.text}
        </AppText>
      )}

      {steppedBack ? (
        <AppText variant="caption" color="textTertiary" style={styles.blurb}>
          You stepped this back yourself. Undo it whenever you want more.
        </AppText>
      ) : null}

      {adjusting ? (
        <View style={styles.adjust}>
          <AppText variant="caption" color="textTertiary">
            Pick the level you want to train at. You can change it back any time, and it never
            costs you the sessions you have already logged.
          </AppText>
          <View style={styles.chips}>
            {lower.map((l) => (
              <Chip
                key={l}
                label={LEVEL_LABEL[l]}
                hint={LEVEL_BLURB[path][l]}
                onPress={() => {
                  onStepBack(l);
                  setAdjusting(false);
                }}
              />
            ))}
            {steppedBack ? (
              <Chip
                label="Back to earned level"
                hint="Return to the level your log supports."
                onPress={() => {
                  onStepBack(null);
                  setAdjusting(false);
                }}
              />
            ) : null}
          </View>
          <Button title="Cancel" variant="ghost" onPress={() => setAdjusting(false)} />
        </View>
      ) : lower.length > 0 || steppedBack ? (
        <Button
          title="This is too hard"
          variant="ghost"
          hint="Choose an easier level. Nothing you have logged is lost."
          onPress={() => setAdjusting(true)}
          style={styles.adjustButton}
        />
      ) : null}
    </Card>
  );
}

function Meter({
  label,
  have,
  need,
  frac,
  color,
  track,
}: {
  label: string;
  have: number;
  need: number;
  frac: number;
  color: string;
  track: string;
}) {
  return (
    <View style={styles.meter}>
      <View style={styles.meterHead}>
        <AppText variant="caption" color="textSecondary">
          {label}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          {Math.min(have, need)} / {need}
        </AppText>
      </View>
      {/* Decorative: the numbers above already carry this for VoiceOver. */}
      <View style={[styles.track, { backgroundColor: track }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.fill, { backgroundColor: color, width: `${Math.round(frac * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  blurb: { marginTop: Spacing.sm },
  progress: { marginTop: Spacing.md, gap: Spacing.sm },
  meter: { gap: 4 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.full },
  adjust: { marginTop: Spacing.md, gap: Spacing.sm },
  adjustButton: { marginTop: Spacing.sm, alignSelf: 'flex-start', paddingHorizontal: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
