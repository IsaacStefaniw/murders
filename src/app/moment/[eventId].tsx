import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Breakout, type BreakoutAction } from '@/components/breakout';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { behaviourPattern } from '@/features/behaviours/patterns';
import {
  TRIGGER_LABELS,
  TRIGGER_ORDER,
  aftermath,
  loggedToday,
  minuteOf,
  planFor,
  rightNow,
  type AftermathPlan,
} from '@/features/moments/aftermath';
import { EVIDENCE_LABELS } from '@/features/knowledge/protocols';
import { useAppStore } from '@/state/store';
import type { TriggerKey } from '@/features/behaviours/tonight';

/**
 * The ten minutes after a slip, as a screen rather than a caption.
 *
 * Reached the instant something is logged. The reasoning for the order of
 * the four steps is in `features/moments/aftermath.ts` — steady, then the
 * trigger while it is fresh, then a plan for the situation that actually
 * happened, then what it costs and what does not change.
 *
 * Every step is leavable. Somebody who taps Close on step one has still
 * got the one sentence that matters, which is the point of putting it
 * first: the screen is designed so that quitting early is a partial
 * success rather than a failure.
 */

type Step = 'steady' | 'trigger' | 'plan' | 'cost';

export default function MomentScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const events = useAppStore((s) => s.behaviourEvents);
  const intentions = useAppStore((s) => s.behaviourIntentions);
  const metrics = useAppStore((s) => s.metrics);
  const profile = useAppStore((s) => s.profile);
  const setBehaviourEventTrigger = useAppStore((s) => s.setBehaviourEventTrigger);
  const setBehaviourPlan = useAppStore((s) => s.setBehaviourPlan);

  const [now] = useState(() => new Date());
  const event = events.find((e) => e.id === eventId);
  const intention = intentions.find((i) => i.id === event?.intentionId);

  const model = useMemo(() => {
    if (!event || !intention) return null;
    // The pattern as it stands BEFORE this event, so "three of your last
    // four" describes history rather than counting the tap just made.
    const prior = events.filter((e) => e.id !== event.id);
    return aftermath({
      event,
      pattern: behaviourPattern(intention, prior, metrics, now),
      events: prior,
      sleepTime: profile?.sleepTime ?? null,
      now,
    });
  }, [event, intention, events, metrics, profile?.sleepTime, now]);

  const [step, setStep] = useState<Step>('steady');
  const [trigger, setTrigger] = useState<TriggerKey | null>(() => model?.knownTrigger ?? null);
  const [plan, setPlanState] = useState<AftermathPlan | null>(null);

  /**
   * Written down the moment it is settled on, not when the screen ends.
   *
   * A plan held in component state is a plan that exists for ninety
   * seconds. This one has to survive so the app can say it back in the
   * situation it names — which is the entire mechanism by which an
   * implementation intention works.
   */
  const keepPlan = (next: AftermathPlan) => {
    setPlanState(next);
    if (!intention) return;
    setBehaviourPlan(intention.id, {
      trigger: next.trigger,
      replacement: next.replacement,
      text: next.text,
      writtenAt: now.toISOString(),
    });
  };

  const close = () => router.back();

  if (!model || !event || !intention) {
    return (
      <Breakout eyebrow="Logged" onClose={close}>
        <AppText variant="title" style={styles.lead}>
          Logged.
        </AppText>
        <AppText variant="secondary" style={styles.gap}>
          That one is recorded. The pattern reads it from here.
        </AppText>
      </Breakout>
    );
  }

  const order: Step[] = ['steady', 'trigger', 'plan', 'cost'];
  const index = order.indexOf(step);
  const eyebrow = `${model.behaviour.label} · just logged`;

  /* ── 1. Steady ────────────────────────────────────────────────────── */
  if (step === 'steady') {
    return (
      <Breakout
        eyebrow={eyebrow}
        steps={order.length}
        step={index}
        onClose={close}
        actions={[
          { label: 'What set it off?', onPress: () => setStep('trigger') },
          { label: 'Not now', secondary: true, onPress: close },
        ]}
      >
        <AppText variant="display" style={styles.lead}>
          {model.steady.line}
        </AppText>
        {model.steady.because ? (
          <AppText variant="body" style={styles.gap}>
            {model.steady.because}
          </AppText>
        ) : null}
        {/* The thing they cannot see and the app can. Kept to one line and
            kept below the steadying sentence, because a pattern read first
            is a case for the prosecution. */}
        {model.window ? (
          <AppText variant="secondary" color="textSecondary" style={styles.gapLg}>
            {model.window}
          </AppText>
        ) : null}
      </Breakout>
    );
  }

  /* ── 2. The trigger, while it is fresh ────────────────────────────── */
  if (step === 'trigger') {
    const choose = (key: TriggerKey) => {
      setTrigger(key);
      setBehaviourEventTrigger(event.id, key);
      keepPlan(planFor(key));
      setStep('plan');
    };
    return (
      <Breakout
        eyebrow={eyebrow}
        steps={order.length}
        step={index}
        onClose={close}
        actions={[{ label: 'Skip this', secondary: true, onPress: () => setStep('cost') }]}
      >
        <AppText variant="title" style={styles.lead}>
          What was going on just before?
        </AppText>
        <AppText variant="secondary" style={styles.gap}>
          One tap. This is the field that makes the next part specific rather than generic.
        </AppText>
        <View style={styles.chips}>
          {TRIGGER_ORDER.map((key) => (
            <Chip
              key={key}
              label={TRIGGER_LABELS[key]}
              selected={trigger === key}
              onPress={() => choose(key)}
            />
          ))}
        </View>
      </Breakout>
    );
  }

  /* ── 3. The plan, for the situation that actually happened ────────── */
  if (step === 'plan' && plan) {
    const doNow = rightNow(plan, minuteOf(now), loggedToday(event, now));
    const actions: BreakoutAction[] = [];
    if (doNow?.route) {
      actions.push({
        label: doNow.label,
        /*
          Pushed ON TOP of this screen rather than replacing it. The first
          version popped the moment first, so somebody who took the two
          minutes of breathing lost the plan they had just written, the
          mechanism, and the way to log the other nights — the whole
          screen, as a reward for doing the one thing on it.
        */
        onPress: () => router.push(doNow.route as never),
      });
    }
    actions.push({
      label: doNow?.route ? 'Not right now' : 'That is the one',
      secondary: Boolean(doNow?.route),
      onPress: () => setStep('cost'),
    });

    return (
      <Breakout
        eyebrow={eyebrow}
        steps={order.length}
        step={index}
        onClose={close}
        actions={actions}
      >
        <AppText variant="label" color="textTertiary">
          The plan for the next one
        </AppText>
        {/* The sentence is the deliverable. An if-then written minutes
            after the situation it is about is the best-evidenced thing
            this app can hand anybody — see aftermath.ts. */}
        <View
          style={[styles.plan, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
        >
          <AppText variant="heading">{plan.text}</AppText>
        </View>
        <AppText variant="secondary" style={styles.gap}>
          {plan.because}
        </AppText>

        {plan.alternatives.length > 0 ? (
          <View style={styles.gapLg}>
            <AppText variant="caption" color="textTertiary">
              Or something else, if that is not you:
            </AppText>
            <View style={styles.chips}>
              {plan.alternatives.map((alt) => (
                <Chip
                  key={alt.key}
                  label={alt.label}
                  onPress={() => keepPlan(planFor(plan.trigger, alt.key))}
                />
              ))}
            </View>
          </View>
        ) : null}
      </Breakout>
    );
  }

  /* ── 4. What it cost, and what does not change ────────────────────── */
  const { note, hoursBeforeSleep, tomorrow } = model.cost;
  return (
    <Breakout
      eyebrow={eyebrow}
      steps={order.length}
      step={order.length - 1}
      onClose={close}
      closeLabel="Done"
      actions={[
        {
          label: 'Done',
          onPress: close,
        },
        {
          // The gap Isaac hit: several occurrences in a week, and a flow
          // that makes you walk the whole way round for each one.
          label: 'Log another from this week',
          secondary: true,
          onPress: () => {
            router.back();
            router.push(`/(tabs)/life?log=${encodeURIComponent(intention.id)}` as never);
          },
        },
      ]}
    >
      <AppText variant="title" style={styles.lead}>
        {note.text}
      </AppText>
      {note.kind === 'mechanism' ? (
        <AppText variant="caption" color="textTertiary" style={styles.gap}>
          {EVIDENCE_LABELS[note.evidenceLevel]} · {note.attribution}
        </AppText>
      ) : null}

      {note.kind === 'mechanism' && note.counterText ? (
        <Card style={styles.gapLg}>
          <AppText variant="body">{note.counterText}</AppText>
        </Card>
      ) : null}

      {hoursBeforeSleep !== null && hoursBeforeSleep <= 4 ? (
        <AppText variant="secondary" style={styles.gapLg}>
          {hoursBeforeSleep < 1
            ? 'That was right on bedtime.'
            : `That was about ${Math.round(hoursBeforeSleep)} ${
                Math.round(hoursBeforeSleep) === 1 ? 'hour' : 'hours'
              } before your usual bedtime.`}
        </AppText>
      ) : null}

      {plan ? (
        <View style={[styles.kept, { borderTopColor: theme.border }]}>
          <AppText variant="label" color="textTertiary">
            Kept
          </AppText>
          <AppText variant="body" style={styles.gap}>
            {plan.text}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.kept, { borderTopColor: theme.border }]}>
        <AppText variant="label" color="textTertiary">
          Tomorrow
        </AppText>
        <AppText variant="body" style={styles.gap}>
          {tomorrow}
        </AppText>
      </View>

      {model.behaviour.safetyNote ? (
        <AppText variant="caption" color="must" style={styles.gapLg}>
          {model.behaviour.safetyNote}
        </AppText>
      ) : null}
    </Breakout>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: Spacing.lg },
  gap: { marginTop: Spacing.md },
  gapLg: { marginTop: Spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  plan: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
  },
  kept: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
