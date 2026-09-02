import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  babysitterReminderDate,
  buildTogetherWeek,
  nextDateNight,
  shareWeekText,
} from '@/features/household/week';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';

/** The household hub: the week you share, in one place. Local-first —
 * real partner sync arrives with accounts; nothing here leaves the phone
 * unless you copy it yourself. */
export default function Household() {
  const router = useRouter();
  const theme = useTheme();
  const today = todayKey();

  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const addPlanItem = useAppStore((s) => s.addPlanItem);

  const [copied, setCopied] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/life' as never));

  const together = useMemo(
    () => buildTogetherWeek(today, plans, routines),
    [today, plans, routines],
  );

  if (!profile) return <Screen />;

  const partner = profile.people.find((p) => p.relation === 'partner');
  const hasKids = profile.people.some((p) => p.relation === 'child');
  const dateNight = nextDateNight(together);

  // A babysitter reminder is offered once per date night, not nagged.
  const reminderExists = Object.values(plans).some(
    (p) =>
      p.date >= today &&
      p.date <= addDays(today, 6) &&
      p.items.some((i) => i.title === 'Message the babysitter'),
  );

  const copyWeek = async () => {
    try {
      await navigator.clipboard.writeText(shareWeekText(profile, together));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable — nothing to break.
    }
  };

  const addBabysitterReminder = () => {
    if (!dateNight) return;
    const date = babysitterReminderDate(today, dateNight.date);
    ensurePlan(date);
    addPlanItem(date, {
      title: 'Message the babysitter',
      area: 'family',
      start: '19:00',
      durationMin: 10,
    });
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Household
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">
        {partner ? `You & ${partner.name}` : 'Your household'}
        {hasKids ? (profile.kidsCount && profile.kidsCount > 1 ? ` + ${profile.kidsCount} kids` : ' + the kids') : ''}
      </AppText>
      <AppText variant="secondary" style={styles.sub}>
        The week you share, in one place. Nothing leaves this phone unless you copy it yourself.
      </AppText>

      <SectionHeader title="This week, together" />
      {together.length === 0 ? (
        <Card>
          <AppText variant="secondary">
            Nothing shared on the calendar yet. Date nights, family adventures and one-on-one time
            land here as they&apos;re planned.
          </AppText>
        </Card>
      ) : (
        <View style={styles.stack}>
          {together.map((e, i) => (
            <Card key={i} style={styles.entryRow}>
              <AppText variant="caption" color="textTertiary" style={styles.when}>
                {e.when}
              </AppText>
              <AppText variant="body" style={styles.entryTitle}>
                {e.title}
              </AppText>
              <AppText variant="caption" color="textTertiary">
                {formatTime(e.start)}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      <Button
        title={copied ? 'Copied — paste it to them ✓' : `Copy the week${partner ? ` for ${partner.name}` : ''}`}
        variant="secondary"
        onPress={copyWeek}
        style={styles.copy}
      />

      {hasKids && dateNight ? (
        <View>
          <SectionHeader title="Date night logistics" />
          <Card>
            <AppText variant="body">
              {dateNight.when} {formatTime(dateNight.start)} — date night is on the plan.
            </AppText>
            {reminderExists ? (
              <AppText variant="caption" color="success">
                Babysitter reminder is scheduled ✓
              </AppText>
            ) : (
              <Button
                title="Add a babysitter reminder"
                onPress={addBabysitterReminder}
                style={styles.copy}
              />
            )}
            {!reminderExists ? (
              <AppText variant="caption" color="textTertiary">
                Ten minutes, {formatDateLong(babysitterReminderDate(today, dateNight.date))} evening
                — booked sitters are what make date nights actually happen.
              </AppText>
            ) : null}
          </Card>
        </View>
      ) : null}

      <Card style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: theme.border, marginTop: Spacing.xl }}>
        <AppText variant="heading">Partner accounts — coming with sync</AppText>
        <AppText variant="caption" color="textTertiary">
          {partner ? `${partner.name} gets their own IntentNorth` : 'Your partner gets their own IntentNorth'}
          , date nights coordinate themselves, and shared plans stay in step. Private by default,
          shared only by explicit choice.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  // minWidth so a scaled-up time is never cut off by its own column.
  when: { minWidth: 76 },
  entryTitle: { flex: 1, fontWeight: '500' },
  copy: { marginTop: Spacing.md },
});
