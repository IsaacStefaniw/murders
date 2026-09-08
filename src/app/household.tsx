import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  householdShareText,
  householdWeek,
  nextDateNight,
  whoHasWhat,
} from '@/features/family/householdWeek';
import { babysitterReminderDate } from '@/features/household/week';
import {
  CHECKIN_QUESTIONS,
  checkinHasAnswers,
  checkinPlanItems,
  checkinShareText,
  nextCheckinDate,
  type CheckinAnswers,
} from '@/features/relationship/checkin';
import { addDays, formatDateLong, formatTime, todayKey } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/state/store';
import { shareText } from '@/lib/share';

/** The household hub: the week you share, in one place. Local-first —
 * real partner sync arrives with accounts; nothing here leaves the phone
 * unless you send it yourself. */
export default function Household() {
  const router = useRouter();
  const theme = useTheme();
  const today = todayKey();

  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const routines = useAppStore((s) => s.routines);
  const ensurePlan = useAppStore((s) => s.ensurePlan);
  const addPlanItem = useAppStore((s) => s.addPlanItem);

  const [sent, setSent] = useState(false);
  const [checkin, setCheckin] = useState<CheckinAnswers>({});
  const [checkinPlaced, setCheckinPlaced] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/life' as never));

  const week = useMemo(() => householdWeek(today, plans, routines), [today, plans, routines]);

  if (!profile) return <Screen />;

  const partner = profile.people.find((p) => p.relation === 'partner');
  const hasKids = profile.people.some((p) => p.relation === 'child');
  const groups = whoHasWhat(week, partner?.name);
  const dateNight = nextDateNight(week);

  // A babysitter reminder is offered once per date night, not nagged.
  const reminderExists = Object.values(plans).some(
    (p) =>
      p.date >= today &&
      p.date <= addDays(today, 6) &&
      p.items.some((i) => i.title === 'Message the babysitter'),
  );

  const sendWeek = async () => {
    // Was navigator.clipboard, which does not exist on iOS: the TypeError
    // was caught and the button did nothing, on every device the app
    // actually ships to.
    const { shared } = await shareText(householdShareText(profile, week), 'This week');
    if (!shared) return;
    setSent(true);
    setTimeout(() => setSent(false), 2500);
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

  // The check-in's answers become next week's plan: the swap on Monday
  // evening, the thing they asked for mid-week with their name on it.
  const placeCheckin = () => {
    for (const item of checkinPlanItems(checkin, today, partner?.name)) {
      ensurePlan(item.date);
      addPlanItem(item.date, {
        title: item.title,
        area: item.area,
        start: item.start,
        durationMin: item.durationMin,
      });
    }
    setCheckinPlaced(true);
  };

  const sendCheckin = async () => {
    await shareText(checkinShareText(checkin, partner?.name), 'Our check-in');
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Household
        </AppText>
        <Button title="Close" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">
        {partner ? `You & ${partner.name}` : 'Your household'}
        {hasKids ? (profile.kidsCount && profile.kidsCount > 1 ? ` + ${profile.kidsCount} kids` : ' + the kids') : ''}
      </AppText>
      <AppText variant="secondary" style={styles.sub}>
        Who has what this week, in one place. Nothing leaves this phone unless you send it yourself.
      </AppText>

      {week.length === 0 ? (
        <>
          <SectionHeader title="This week" />
          <Card>
            <AppText variant="secondary">
              Nothing shared on the calendar yet. Date nights, family time, one-on-ones and your own
              hours land here as they&apos;re planned.
            </AppText>
          </Card>
        </>
      ) : (
        groups.map((g) => (
          <View key={g.who}>
            <SectionHeader title={g.label} />
            <View style={styles.stack}>
              {g.entries.map((e, i) => (
                <Card key={`${g.who}-${i}`} style={styles.entryRow}>
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
          </View>
        ))
      )}

      <Button
        title={sent ? 'Sent ✓' : `Send the week${partner ? ` to ${partner.name}` : ''}`}
        variant="secondary"
        onPress={sendWeek}
        style={styles.copy}
      />

      {partner ? (
        <View>
          <SectionHeader title="The two of you, this week" />
          <Card>
            <AppText variant="caption" color="textTertiary">
              Twenty minutes, {formatDateLong(nextCheckinDate(today))}. Three questions; two of the
              answers go on next week.
            </AppText>
            <View style={styles.stack}>
              {CHECKIN_QUESTIONS.map((q) => (
                <Field
                  key={q.key}
                  label={q.question}
                  value={checkin[q.key] ?? ''}
                  onChangeText={(text) => {
                    setCheckin((prev) => ({ ...prev, [q.key]: text }));
                    setCheckinPlaced(false);
                  }}
                  placeholder={q.placeholder}
                  returnKeyType="done"
                />
              ))}
            </View>
            {checkinPlaced ? (
              <AppText variant="caption" color="success" style={styles.copy}>
                On next week&apos;s plan ✓
              </AppText>
            ) : (
              <Button
                title="Put it on next week"
                onPress={placeCheckin}
                disabled={!checkinHasAnswers(checkin)}
                style={styles.copy}
              />
            )}
            {checkinHasAnswers(checkin) ? (
              <Button
                title={`Send the check-in to ${partner.name}`}
                variant="ghost"
                onPress={sendCheckin}
                style={styles.copy}
              />
            ) : null}
          </Card>
        </View>
      ) : null}

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
  stack: { gap: Spacing.sm, marginTop: Spacing.sm },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  // minWidth so a scaled-up time is never cut off by its own column.
  when: { minWidth: 76 },
  entryTitle: { flex: 1, fontWeight: '500' },
  copy: { marginTop: Spacing.md },
});
