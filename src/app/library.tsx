import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { Disclosure } from '@/components/disclosure';
import {
  EVIDENCE_LABELS,
  EVIDENCE_NOTE,
  EVIDENCE_ORDER,
  PILLAR_LABELS,
  evidenceLine,
  AUDIENCE_LABEL,
  listedProtocols,
  optInAudiencesFor,
  protocolsFor,
  sourceLine,
  type Pillar,
  type Protocol,
} from '@/features/knowledge/protocols';
import { useTheme } from '@/hooks/use-theme';
import { placementFor, placementLine, type Placement } from '@/features/planner/placement';
import { useAppStore } from '@/state/store';
import { FREE_PROTOCOLS_PER_PILLAR, splitLibrary } from '@/features/plus/entitlement';
import { LockedCard, LockedRow } from '@/features/plus/Locked';

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

/**
 * One practice, and the three lines nobody else prints.
 *
 * Verified across 44 App Store listings and every vendor site that could
 * be read: no competitor shows an evidence grade on the screen that hands
 * you the practice. Four of them list studies on a marketing page. So the
 * grade, the source and where it stops are kept together in one block
 * here, under one heading, rather than scattered among the captions —
 * three lines that are one claim.
 */
function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const theme = useTheme();
  const routines = useAppStore((s) => s.routines);
  const toggleProtocol = useAppStore((s) => s.toggleProtocol);
  const plus = useAppStore((s) => s.entitlement.plus);
  const active = routines.some((r) => r.protocolId === protocol.id && r.active);

  // The scheduling reveal. Set only by this card's own Add, so it never
  // appears on a screen the person did not just act on, and cleared the
  // moment they undo — a confirmation that outlives the thing it confirms
  // is worse than none.
  const [justPlaced, setJustPlaced] = useState<Placement | null>(null);

  const add = () => {
    const nowActive = toggleProtocol(protocol.id);
    if (!nowActive) { setJustPlaced(null); return; }
    // Read after the toggle: it regenerates the week synchronously, so the
    // placement is already in the store by the time this runs.
    const st = useAppStore.getState();
    setJustPlaced(placementFor(protocol.id, st.routines, st.plans));
  };

  const undo = () => {
    if (active) toggleProtocol(protocol.id);
    setJustPlaced(null);
  };

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
      <View style={[styles.evidence, { borderColor: theme.border }]}>
        <AppText variant="caption" color="text">
          Evidence {protocol.evidenceLevel} · {EVIDENCE_LABELS[protocol.evidenceLevel]}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          Source · {sourceLine(protocol)}
        </AppText>
        <AppText variant="caption" color="textTertiary">
          {protocol.safety
            ? `Where it stops · ⚠︎ ${protocol.safety}`
            : 'Where it stops · no particular caution on this one, and it is still educational structure rather than advice.'}
        </AppText>
      </View>
      <Button
        title={active ? 'On your plan — pause it' : 'Add to my plan'}
        variant={active ? 'ghost' : 'primary'}
        onPress={add}
        style={styles.button}
      />
      {/*
        The one moment the scheduling is visible.

        Adding a practice used to change a button and nothing else. The
        arbitration, the anchor, the gap it found — all of it happened on
        a tab the person was not looking at, and the review's word for it
        was that the intelligence "has no reveal moment". This is the
        reveal: where it went, what it went between, an undo while the
        decision is still fresh, and the reason on request.
      */}
      {justPlaced ? (
        <View style={[styles.placement, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}>
          <AppText variant="body">{placementLine(justPlaced)}</AppText>
          <Disclosure title="Why here?">
            <AppText variant="secondary">{justPlaced.reason}</AppText>
            <AppText variant="caption" color="textTertiary">
              Press and hold it on Today or Week to move it, and everything else
              shuffles around where you put it.
            </AppText>
          </Disclosure>
          <Button title="Undo" variant="ghost" onPress={undo} />
        </View>
      ) : active ? (
        <AppText variant="caption" color="success">
          {plus
            ? 'IntentNorth schedules this into your week automatically.'
            : 'On your plan. Plus places it into your days; until then it is listed on its coach’s hub.'}
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
  // Answered as the interview step it is, so the profile and the interview
  // record agree and the training hub does not ask a second time.
  const answerDeferredQuestion = useAppStore((st) => st.answerDeferredQuestion);
  const listed = listedProtocols(sexAtBirth);
  const plus = useAppStore((s) => s.entitlement.plus);
  const { open, openCount, total } = splitLibrary(listed, plus);
  const optIn = optInAudiencesFor(sexAtBirth);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/life' as never));
  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Library
        </AppText>
        <Button title="Close" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">Evidence-based practices</AppText>
      <AppText variant="secondary" style={styles.intro}>
        Practices distilled, in IntentNorth&apos;s own words, from public, evidence-based teaching.
        Each one names its sources, shows how good the evidence is and says where it stops. Add one
        and it is planned into your real week.
      </AppText>
      {/* The grades, explained where they first appear rather than in a
          help screen nobody opens. The grade sentence was the most-flagged
          jargon in the third persona round after "Zone 2", and the ask was
          for the letters in plain words the first time they are seen. It
          ends on the honest line, which is the one no competitor can copy:
          most of this library is not an A. */}
      <Disclosure title="What these letters mean" hint="Opens a short explanation of the A to E grades">
        {EVIDENCE_ORDER.map((level) => (
          <AppText key={level} variant="caption" color="textSecondary">
            {evidenceLine(level)}
          </AppText>
        ))}
        <AppText variant="caption" color="text" style={styles.evidenceNote}>
          {EVIDENCE_NOTE}
        </AppText>
      </Disclosure>
      {!plus ? (
        <LockedCard
          title={`${openCount} of ${total} open`}
          body={`The first ${FREE_PROTOCOLS_PER_PILLAR} in every area are open to read and add. The other ${total - openCount} are listed by name and run with Plus.`}
        />
      ) : null}
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
            {items.map((p) =>
              open.has(p.id) ? (
                <ProtocolCard key={p.id} protocol={p} />
              ) : (
                <LockedRow key={p.id} title={p.title} meta={`${p.durationMin} min`} />
              ),
            )}
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
                onPress={() => answerDeferredQuestion('sexAtBirth', value)}
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
        const openHere = openAudience === audience;
        return (
          <View key={audience}>
            <Button
              title={`${AUDIENCE_LABEL[audience]} · ${items.length}`}
              variant="secondary"
              onPress={() => setOpenAudience(openHere ? null : audience)}
              style={styles.audienceButton}
            />
            {openHere
              ? items.map((p) =>
                  plus ? <ProtocolCard key={p.id} protocol={p} /> : <LockedRow key={p.id} title={p.title} meta={`${p.durationMin} min`} />,
                )
              : null}
          </View>
        );
      })}

      <Button title="Close" variant="secondary" onPress={close} style={styles.doneBottom} />
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
  placement: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  audienceButton: { marginTop: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  grow: { flexShrink: 1 },
  why: { fontStyle: 'italic' },
  evidence: {
    borderLeftWidth: 2,
    paddingLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  evidenceNote: { marginTop: Spacing.sm },
  button: { marginTop: Spacing.xs },
});
