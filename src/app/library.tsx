import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  EVIDENCE_LABELS,
  PILLAR_LABELS,
  AUDIENCE_LABEL,
  generalProtocols,
  protocolsFor,
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
  // A pillar missing from this array silently renders no section.
  'skill',
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
      <AppText variant="caption" color="textTertiary">
        Evidence {protocol.evidenceLevel} · {EVIDENCE_LABELS[protocol.evidenceLevel]}
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
          IntentNorth schedules this into your week automatically.
        </AppText>
      ) : null}
    </Card>
  );
}

/** The knowledge base as a browsable library: evidence-based practices the
 * engine can put straight onto the calendar. */
export default function Library() {
  const [openAudience, setOpenAudience] = useState<'femaleAnatomy' | 'pregnancy' | 'menopause' | null>(null);
  const theme = useTheme();
  const router = useRouter();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/life' as never));
  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Library
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Evidence-based practices</AppText>
      <AppText variant="secondary" style={styles.intro}>
        Practices distilled, in IntentNorth&apos;s own words, from the public evidence-based teaching
        of Tim Ferriss, Andrew Huberman, Peter Attia, Rhonda Patrick, Jordan Peterson and David
        Sinclair. Add one and IntentNorth plans it into your real week — and adapts it like anything
        else you do.
      </AppText>
      <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
        Educational structure, not medical advice. Attribution credits public work and implies no
        endorsement of IntentNorth.
      </AppText>

      {PILLAR_ORDER.map((pillar) => {
        const items = generalProtocols().filter((p) => p.pillar === pillar);
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
      {/* Practices for one body or life stage.
          They used to sit unlabelled in the general lists, so a single tap
          could put pelvic floor training into anybody's week — and the next
          morning the coach note handed it the most prominent slot on the
          Today screen. The app still does not ask anyone's sex and does not
          start now: these are named for who they are for and opened on
          purpose. Two taps for the person who wants one, none by accident. */}
      <SectionHeader title="Practices for particular bodies" />
      <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
        Kept separate because they apply to some people and not others. IntentNorth does not ask
        your sex and does not guess — open the one that is yours.
      </AppText>
      {(['femaleAnatomy', 'pregnancy', 'menopause'] as const).map((audience) => {
        const items = protocolsFor(audience);
        if (items.length === 0) return null;
        const open = openAudience === audience;
        return (
          <View key={audience}>
            <Button
              title={`${AUDIENCE_LABEL[audience]} · ${items.length}`}
              variant="secondary"
              onPress={() => setOpenAudience(open ? null : audience)}
              style={styles.audienceButton}
            />
            {open
              ? items.map((p) => <ProtocolCard key={p.id} protocol={p} />)
              : null}
          </View>
        );
      })}

      <Button title="Done" variant="secondary" onPress={close} style={styles.doneBottom} />
      <View style={{ height: Spacing.xl, backgroundColor: theme.background }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  doneBottom: { marginTop: Spacing.lg },
  intro: { marginTop: Spacing.sm },
  disclaimer: { marginTop: Spacing.sm },
  card: { marginBottom: Spacing.md, gap: Spacing.sm },
  audienceButton: { marginTop: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexShrink: 1 },
  why: { fontStyle: 'italic' },
  safety: {},
  button: { marginTop: Spacing.xs },
});
