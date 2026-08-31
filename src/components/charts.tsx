/**
 * Charts, built from views.
 *
 * The app has no chart library and no `react-native-svg` — not even
 * transitively, since the icon set is SF Symbols. Adding one to draw a
 * sparkline would mean a native dependency and a fresh build for the sake
 * of a line, so these are plain flexbox: heights as percentages, colours
 * from the theme, no canvas and no path data.
 *
 * That constraint chose bars over lines, which turns out to be the better
 * answer anyway at this size. A line chart four hundred pixels wide invites
 * people to read a slope off eight noisy points; bars read as "these are
 * the readings", which is what they are. The slope, where one is
 * trustworthy, is stated in words by the trajectory engine instead.
 */

import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SeriesPoint {
  value: number;
  /** Short label under the bar. Omitted labels leave the axis clean. */
  label?: string;
}

interface BarsProps {
  data: SeriesPoint[];
  height?: number;
  /** Emphasise the final bar — the reading that is current. */
  highlightLast?: boolean;
  /**
   * Force the baseline to zero. Off by default: for body weight or resting
   * heart rate a zero baseline compresses every real change into invisibility,
   * and the honest view is the range the readings actually occupy.
   */
  fromZero?: boolean;
  accessibilityLabel?: string;
}

/**
 * A bar per reading.
 *
 * The scale is stated by whatever renders this, because a bar chart without
 * its range is a decoration. `Sparkbars` is deliberately paired with the
 * current value and delta in `MetricRow` for exactly that reason.
 */
export function Sparkbars({
  data,
  height = 44,
  highlightLast = true,
  fromZero = false,
  accessibilityLabel,
}: BarsProps) {
  const theme = useTheme();
  if (data.length === 0) return null;

  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = fromZero ? 0 : Math.min(...values);
  // A flat series would divide by zero and render nothing; show it as a
  // consistent mid-height row, which is what "unchanged" looks like.
  const span = max - min || 1;

  return (
    <View
      style={[styles.barsRow, { height }]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {data.map((point, i) => {
        const ratio = (point.value - min) / span;
        const last = i === data.length - 1;
        return (
          <View key={i} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                {
                  // A floor of 8% keeps the smallest reading visible as a
                  // reading rather than as an absence of one.
                  height: `${Math.max(8, ratio * 100)}%`,
                  backgroundColor:
                    last && highlightLast ? theme.accent : theme.textTertiary,
                  opacity: last && highlightLast ? 1 : 0.45,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

interface LabelledBarsProps extends BarsProps {
  /** Formats the value shown above the tallest bar. */
  format?: (n: number) => string;
}

/** Bars with their labels — for weekly volume and other counted series. */
export function BarChart({ data, height = 90, format }: LabelledBarsProps) {
  const theme = useTheme();
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value));

  return (
    <View>
      <View style={[styles.barsRow, { height }]}>
        {data.map((point, i) => (
          <View key={i} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                {
                  height: max === 0 ? '2%' : `${Math.max(2, (point.value / max) * 100)}%`,
                  backgroundColor: theme.accent,
                  opacity: point.value === 0 ? 0.2 : 0.35 + 0.65 * (point.value / (max || 1)),
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.barsRow}>
        {data.map((point, i) => (
          <View key={i} style={styles.barSlot}>
            <AppText variant="caption" color="textTertiary" style={styles.tick}>
              {point.label ?? ''}
            </AppText>
          </View>
        ))}
      </View>
      {format ? (
        <AppText variant="caption" color="textTertiary" style={styles.scale}>
          peak {format(max)}
        </AppText>
      ) : null}
    </View>
  );
}

export interface DotGridProps {
  /** One entry per day, oldest first. */
  days: { done: boolean; label?: string }[];
  accessibilityLabel?: string;
}

/**
 * Filled and empty dots, one per day.
 *
 * Deliberately not a streak. A streak counts consecutive days and turns one
 * missed Tuesday into a reset to zero, which punishes the ordinary shape of
 * a life; a grid shows the same information without the cliff — you can see
 * a good fortnight with one gap in it and read it as a good fortnight.
 */
export function DotGrid({ days, accessibilityLabel }: DotGridProps) {
  const theme = useTheme();
  return (
    <View
      style={styles.dots}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {days.map((day, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: day.done ? theme.accent : 'transparent',
              borderColor: day.done ? theme.accent : theme.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  /** Signed change over the window, already formatted, or null when unknown. */
  delta?: string | null;
  deltaGood?: boolean;
  data: SeriesPoint[];
  note?: string;
}

/** A metric's current value, its movement, and its readings, in one row. */
export function MetricRow({ label, value, delta, deltaGood, data, note }: MetricRowProps) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHead}>
        <View style={styles.metricLabel}>
          <AppText variant="body">{label}</AppText>
          {note ? (
            <AppText variant="caption" color="textTertiary">
              {note}
            </AppText>
          ) : null}
        </View>
        <View style={styles.metricValue}>
          <AppText variant="heading">{value}</AppText>
          {delta ? (
            <AppText variant="caption" color={deltaGood ? 'success' : 'textTertiary'}>
              {delta}
            </AppText>
          ) : null}
        </View>
      </View>
      <Sparkbars data={data} accessibilityLabel={`${label}: ${data.length} readings`} />
    </View>
  );
}

const styles = StyleSheet.create({
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 2, minHeight: 2 },
  tick: { textAlign: 'center', fontSize: 9 },
  scale: { marginTop: 2 },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  metricRow: { gap: Spacing.xs, paddingVertical: Spacing.sm },
  metricHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.md },
  metricLabel: { flexShrink: 1 },
  metricValue: { alignItems: 'flex-end' },
});
