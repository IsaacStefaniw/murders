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
  listedProtocols,
  optInAudiencesFor,
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
  // What this person's anatomy makes relevant. Unanswered or withheld means
  // the app does not know, and shows the opt-ins rather than deciding.
  const sexAtBirth = useAppStore((s) => s.profile?.sexAtBirth);
  const updateProfile = useAppStore((st) => st.updateProfile);
  const listed = listedProtocols(sexAtBirth);
  const optIn = optInAudiencesFor(sexAtBirth);
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
        const items = listed.filter((p) => p.pillar === pillar);
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
      {/* Life stages, not anatomy.
          These used to sit unlabelled in the general lists, so a single tap
          could put pelvic floor training into anybody's week — and the next
          morning the coach note handed it the most prominent slot on the
          Today screen. Labelling them was the first fix and it was not
          enough: a man still found them and reasonably wondered what else
          the app had wrong about him. Now the interview asks, and this
          section holds only what is a stage rather than a state — opened on
          purpose by the person it might apply to, and absent entirely for
          anyone it cannot. */}
      {/* Asked here rather than in the interview, because the scheduler can
          build a correct first week without it and the spine is reserved for
          what it cannot. One tap, and only for someone who came looking. */}
      {sexAtBirth === undefined ? (
        <View>
          <SectionHeader title="Anything that depends on anatomy" />
          <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
            A few practices here — pelvic floor, cycle and menopause guidance — only apply to
            some bodies, so IntentNorth holds them back until it knows. Nothing else changes.
          </AppText>
          <View style={styles.audienceRow}>
            {(
              [
                ['female', 'Female'],
                ['male', 'Male'],
                ['preferNotToSay', 'Rather not say'],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                title={label}
                variant="secondary"
                onPress={() => updateProfile({ sexAtBirth: value })}
                style={styles.audienceButton}
              />
            ))}
          </View>
        </View>
      ) : null}

      {optIn.length > 0 ? (
        <>
          <SectionHeader title="For a particular stage" />
          <AppText variant="caption" color="textTertiary" style={styles.disclaimer}>
            Kept separate because these apply during one stage of life rather than all of it.
            Open the one that is yours.
          </AppText>
        </>
      ) : null}
      {optIn.map((audience) => {
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
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  audienceButton: { marginTop: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexShrink: 1 },
  why: { fontStyle: 'italic' },
  safety: {},
  button: { marginTop: Spacing.xs },
});
