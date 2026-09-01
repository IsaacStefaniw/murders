import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Field } from '@/components/field';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { formatDateLong, todayKey } from '@/lib/dates';
import { useAppStore } from '@/state/store';

/**
 * The five-minute journal, in the app: what went well, gratitude, one line
 * for tomorrow. Brief written reflection reliably improves mood and sleep
 * quality — and writing forces clarity rumination never reaches. Entries
 * stay on-device with everything else; past entries live right below.
 */
export default function JournalSession() {
  const router = useRouter();
  const date = todayKey();

  const reflections = useAppStore((s) => s.reflections);
  const saveReflection = useAppStore((s) => s.saveReflection);

  const existing = reflections.find((r) => r.date === date && r.kind === 'journal');
  const [wentWell, setWentWell] = useState(existing?.wentWell ?? '');
  const [gratefulFor, setGratefulFor] = useState(existing?.gratefulFor ?? '');
  const [tomorrow, setTomorrow] = useState(existing?.adjustTomorrow ?? '');
  const [saved, setSaved] = useState(false);

  const past = reflections
    .filter((r) => r.kind === 'journal' && r.date !== date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/today' as never));

  const save = () => {
    saveReflection({
      date,
      kind: 'journal',
      wentWell: wentWell.trim() || undefined,
      gratefulFor: gratefulFor.trim() || undefined,
      adjustTomorrow: tomorrow.trim() || undefined,
    });
    setSaved(true);
  };

  const hasContent = Boolean(wentWell.trim() || gratefulFor.trim() || tomorrow.trim());

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          Journal
        </AppText>
        <Button title="Done" variant="ghost" onPress={close} />
      </View>
      <AppText variant="title">{formatDateLong(date)}</AppText>
      <AppText variant="secondary" style={styles.sub}>
        Five minutes. Short and honest beats long and perfect.
      </AppText>

      <SectionHeader title="What went well today?" />
      <Field
        label="What went well today?"
        showLabel={false}
        value={wentWell}
        onChangeText={(t) => {
          setWentWell(t);
          setSaved(false);
        }}
        placeholder="One thing counts."
        multiline
      />

      <SectionHeader title="What are you grateful for?" />
      <Field
        label="What are you grateful for?"
        showLabel={false}
        value={gratefulFor}
        onChangeText={(t) => {
          setGratefulFor(t);
          setSaved(false);
        }}
        placeholder="Small and specific works best."
        multiline
      />

      <SectionHeader title="One line for tomorrow" />
      <Field
        label="One line for tomorrow"
        showLabel={false}
        value={tomorrow}
        onChangeText={(t) => {
          setTomorrow(t);
          setSaved(false);
        }}
        placeholder="The single thing that would make tomorrow good."
        multiline
      />

      <Button
        title={saved ? 'Saved ✓' : 'Save entry'}
        disabled={!hasContent || saved}
        onPress={save}
        style={styles.save}
      />

      {past.length > 0 ? (
        <View>
          <SectionHeader title="Past entries" />
          <View style={styles.stack}>
            {past.map((r) => (
              <Card key={r.id}>
                <AppText variant="caption" color="textTertiary">
                  {formatDateLong(r.date)}
                </AppText>
                {r.wentWell ? <AppText variant="body">{r.wentWell}</AppText> : null}
                {r.gratefulFor ? (
                  <AppText variant="secondary">Grateful: {r.gratefulFor}</AppText>
                ) : null}
                {r.adjustTomorrow ? (
                  <AppText variant="caption" color="textTertiary">
                    Tomorrow: {r.adjustTomorrow}
                  </AppText>
                ) : null}
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1 },
  sub: { marginTop: Spacing.sm },
  save: { marginTop: Spacing.xl },
  stack: { gap: Spacing.sm },
});
