import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { AppText } from '@/components/text';
import { Spacing } from '@/constants/theme';
import { EVIDENCE_LABELS, protocolById } from '@/features/knowledge/protocols';
import { liveProtocols } from '@/features/paths/ladder';
import { nextRungForPath } from '@/features/paths/nextRung';
import type { PathId } from '@/features/paths/definitions';
import { useAppStore } from '@/state/store';

/**
 * The one thing to do next, and why nothing above it yet.
 *
 * This is the ladders made visible. Before it, every hub showed the same
 * flat list of practices no matter what the person had already made stick,
 * so somebody with a solid week and somebody who had never started saw
 * identical advice — and the ordering research that says which comes first
 * sat in Markdown that nothing read.
 *
 * Three things it refuses to do:
 *
 * It does not show rungs above the current one. That is the entire point:
 * rung four is not withheld to be stingy, it is withheld because it does
 * not work until rung three holds, and a person who has read forty hours of
 * this material and still cannot start is usually being offered rung four.
 *
 * It does not go quiet at the top. Reaching the end of a ladder is a
 * result, and the person earned hearing it said.
 *
 * It does not present the gate as advice. Where a ladder has one — the
 * safety question on every connection ladder, the sleep question on mind —
 * it is asked first and framed as a question, because a gate that reads as
 * a tip is a gate nobody stops at.
 */
export function NextRungCard({
  path,
  answers,
}: {
  path: PathId;
  /** The intake, held by the hub — which ladder someone is on depends on it. */
  answers: Record<string, string>;
}) {
  const profile = useAppStore((s) => s.profile);
  const routines = useAppStore((s) => s.routines);
  const plans = useAppStore((s) => s.plans);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);

  const next = nextRungForPath(path, answers, profile, routines, plans);
  // Money has no researched ladder. Showing an empty card would be worse
  // than showing none, and inventing an order would be worse than both.
  if (!next) return null;

  const practices = next.rung ? liveProtocols(next.rung) : [];

  return (
    <Card>
      <AppText variant="label" color="accent">
        Next on {next.ladder.variant.toLowerCase()}
      </AppText>

      {next.gate ? (
        <AppText variant="secondary" style={styles.gap}>
          {next.gate.ask}
          {next.gate.routeTo.match(/\d/) ? ` If yes, this is the number: ${next.gate.routeTo}.` : ''}
        </AppText>
      ) : null}

      {next.rung ? (
        <>
          <AppText variant="heading" style={styles.gap}>
            {next.rung.title}
          </AppText>
          <AppText variant="secondary" style={styles.gap}>
            {next.line}
          </AppText>
          {next.rung.why && next.rung.why !== next.line ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {next.rung.why}
            </AppText>
          ) : null}
          <View style={styles.chips}>
            {practices.map((id) => {
              const protocol = protocolById(id)!;
              return (
                <Chip
                  key={id}
                  label={`Add: ${protocol.title}`}
                  onPress={() => toggleProtocol(id)}
                />
              );
            })}
          </View>
          {practices.length > 1 ? (
            <AppText variant="caption" color="textTertiary">
              Any one of these counts for this rung — they are alternatives, not a checklist.
            </AppText>
          ) : null}
          {practices[0] ? (
            <AppText variant="caption" color="textTertiary" style={styles.gap}>
              {EVIDENCE_LABELS[protocolById(practices[0])!.evidenceLevel]}
            </AppText>
          ) : null}
        </>
      ) : (
        <AppText variant="secondary" style={styles.gap}>
          {next.line}
        </AppText>
      )}

      <AppText variant="caption" color="textTertiary" style={styles.stuck}>
        {next.ladder.whenStuck}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  stuck: { marginTop: Spacing.lg },
});
