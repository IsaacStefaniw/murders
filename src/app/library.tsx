import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  PILLAR_LABELS,
  PROTOCOLS,
  type Pillar,
  type Protocol,
} from '@/features/knowledge/protocols';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

const PILLAR_ORDER: Pillar[] = [
  'sleep',
  'training',
  'nutrition',
  'longevity',
  'mind',
  'wealth',
  'leadership',
  'connection',
];

const DAY_LABEL = (p: Protocol) =>
  p.days.length >= 6 ? 'daily' : `${p.days.length}× a week · ${p.durationMin} min`;

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const routines = useAppStore((s) => s.routines);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);
  const active = routines.some((r) => r.protocolId === protocol.id && r.active);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <AppText variant="heading" style={styles.grow}>
          {protocol.title}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          {DAY_LABEL(protocol)}
        </AppText>
      </View>
      <AppText variant="secondary">{protocol.summary}</AppText>
      <AppText variant="caption" style={styles.why}>
        {protocol.why}
      </AppText>
      <AppText variant="caption" color="textTertiary">
        From the public work of {protocol.attribution.join(' · ')}
      </AppText>
      {protocol.safety ? (
        <AppText variant="caption" color="textTertiary" style={styles.safety}>
          ⚠︎ {protocol.safety}
        </AppText>
      ) : null}
      <Button
        title={active ? 'On your plan — pause it' : 'Add to my plan'}
        variant={active ? 'ghost' : 'primary'}
        onPress={() => toggleProtocol(protocol.id)}
        style={styles.button}
      />
      {active ? (
        <AppText variant="caption" color="success">
          INTENT schedules this into your week automatically.
        </AppText>
      ) : null}
    </Card>
  );
}

/** The knowledge base as a browsable library: evidence-based practices the
 * engine can put straight onto the calendar. */
export default function Library() {
  const theme = useTheme();
  return (
    <Screen>
      <AppText variant="label" color="textTertiary">
        Library
      </AppText>
      <AppText variant="title">Evidence-based practices</AppText>
      <AppText variant="secondary" style={styles.intro}>
        Practices distilled, in INTENT&apos;s own words, from the public evidence-based teaching
        of Tim Ferriss, Andrew Huberman, Peter Attia, Rhonda Patrick, Jordan Peterson and David
        Sinclair. Add one and INTENT plans it into your real week — and adapts it like anything
        else you do.
      </AppText>
      <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
        Educational structure, not medical advice. Attribution credits public work and implies no
        endorsement of INTENT.
      </AppText>

      {PILLAR_ORDER.map((pillar) => {
        const items = PROTOCOLS.filter((p) => p.pillar === pillar);
        if (items.length === 0) return null;
        return (
          <View key={pillar}>
            <SectionHeader title={PILLAR_LABELS[pillar]} />
            {items.map((p) => (
              <ProtocolCard key={p.id} protocol={p} />
            ))}
          </View>
        );
      })}
      <View style={{ height: Spacing.xl, backgroundColor: theme.background }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: Spacing.sm },
  disclaimer: { marginTop: Spacing.sm },
  card: { marginBottom: Spacing.md, gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexShrink: 1 },
  why: { fontStyle: 'italic' },
  safety: {},
  button: { marginTop: Spacing.xs },
});
