import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { behaviourInfo } from '@/features/behaviours/catalog';
import { proposeIntention } from '@/features/checkins/propose';
import { formatTime, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';
import type { BehaviourKey } from '@/types/domain';

/** The 30-second morning check-in. Approve the day almost immediately. */
export default function MorningCheckIn() {
  const router = useRouter();
  const date = todayKey();

  const profile = useAppStore((s) => s.profile);
  const plan = useAppStore((s) => s.plans[date]);
  const approvePlan = useAppStore((s) => s.approvePlan);
  const saveReflection = useAppStore((s) => s.saveReflection);
  const behaviourIntentions = useAppStore((s) => s.behaviourIntentions);
  const behaviourEvents = useAppStore((s) => s.behaviourEvents);
  const goals = useAppStore((s) => s.goals);

  // INTENT proposes the intention; the user approves or overrides.
  const [proposal] = useState(() =>
    plan
      ? proposeIntention({ plan, behaviourIntentions, behaviourEvents, goals })
      : { text: 'One thing at a time today.' },
  );
  const [editing, setEditing] = useState(false);
  const [intention, setIntention] = useState('');
  const [protect, setProtect] = useState<BehaviourKey | undefined>(
    proposal.protect ?? behaviourIntentions.find((b) => b.active)?.behaviour,
  );

  if (!profile || !plan) return <Screen />;

  const commitments = plan.items.filter((i) => i.fixed).slice(0, 3);
  const priorities = plan.items.filter((i) => !i.fixed && i.tier !== 'could').slice(0, 3);
  const activeIntentions = behaviourIntentions.filter((b) => b.active);

  const approve = () => {
    const chosen = editing ? intention.trim() : proposal.text;
    approvePlan(date, chosen || undefined, protect);
    saveReflection({ date, kind: 'morning' });
    router.back();
  };

  return (
    <Screen>
      <AppText variant="title">Good morning, {profile.firstName}.</AppText>
      {plan.summary ? <AppText variant="secondary">{plan.summary}</AppText> : null}

      {commitments.length > 0 ? (
        <View>
          <SectionHeader title="Committed" />
          <View style={styles.stack}>
            {commitments.map((c) => (
              <AppText key={c.id} variant="body">
                <AppText variant="body" color="textTertiary">
                  {formatTime(c.start)}
                </AppText>
                {'   '}
                {c.title}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      {priorities.length > 0 ? (
        <View>
          <SectionHeader title="Make these happen" />
          <View style={styles.stack}>
            {priorities.map((p) => (
              <AppText key={p.id} variant="body" style={styles.priority}>
                <AppText variant="body" color="textTertiary">
                  {formatTime(p.start)}
                </AppText>
                {'   '}
                {p.title}
              </AppText>
            ))}
          </View>
        </View>
      ) : null}

      <SectionHeader title="One intention" />
      {!editing ? (
        <View>
          <AppText variant="heading">{proposal.text}</AppText>
          <View style={styles.intentionActions}>
            <Button title="Change" variant="ghost" onPress={() => setEditing(true)} />
          </View>
        </View>
      ) : (
        <Field
          label="One intention"
          showLabel={false}
          hint="One sentence. The suggestion in grey is a starting point, not a requirement."
          value={intention}
          onChangeText={setIntention}
          placeholder={proposal.text}
          autoFocus
        />
      )}

      {activeIntentions.length > 0 ? (
        <View>
          <SectionHeader title="Protect against" />
          <View style={styles.chips}>
            {activeIntentions.map((b) => (
              <Chip
                key={b.id}
                label={behaviourInfo(b.behaviour).label}
                selected={protect === b.behaviour}
                onPress={() =>
                  setProtect(protect === b.behaviour ? undefined : b.behaviour)
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Button title="Looks good" onPress={approve} />
        <Button
          title="Adjust my day"
          variant="ghost"
          onPress={() => {
            router.back();
            router.push('/(tabs)/plan');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.sm },
  priority: { fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  intentionActions: { flexDirection: 'row', marginTop: Spacing.xs },
  footer: { marginTop: Spacing.xxl, gap: Spacing.sm },
});
