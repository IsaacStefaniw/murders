import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import { FREE_ALWAYS, PLUS_RUNS } from '@/features/plus/entitlement';
import { useTheme } from '@/hooks/use-theme';
import {
  PRIVACY_URL,
  STOREKIT_AVAILABLE,
  TERMS_URL,
  buy,
  loadOffers,
  restore,
  type PlusOffer,
} from '@/lib/purchases';
import { track } from '@/lib/telemetry';
import { useAppStore } from '@/state/store';

/**
 * IntentNorth Plus — the paywall.
 *
 * Shown once, right after the first insight (plan-review → here), and
 * from every lock in the app. Prices are Apple's, fetched live; nothing
 * on this screen is typed in code, because a price in code and a price in
 * App Store Connect drift, and App Review reads the sheet. What a
 * subscription is — its period, that it renews, where to cancel — is said
 * in words next to the price, with the terms and the privacy policy a tap
 * away, which is what guideline 3.1.2 asks for. Restore is always here.
 */
export default function Upgrade() {
  const router = useRouter();
  const theme = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const entitlement = useAppStore((s) => s.entitlement);
  const firstName = useAppStore((s) => s.profile?.firstName);

  const [offers, setOffers] = useState<PlusOffer[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const close = () => {
    if (from === 'onboarding') router.replace('/(tabs)/today');
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/today');
  };

  useEffect(() => {
    void track('paywall_shown');
    let live = true;
    loadOffers().then((o) => {
      if (live) setOffers(o);
    });
    return () => {
      live = false;
    };
  }, []);

  const onBuy = async (offer: PlusOffer) => {
    setBusy(offer.productId);
    setNote(null);
    const result = await buy(offer.productId);
    setBusy(null);
    if (result.ok) {
      setNote('Plus is on. Your coaches are running today.');
      return;
    }
    if (!result.cancelled) setNote(result.message ?? 'The purchase did not go through. Nothing was charged.');
  };

  const onRestore = async () => {
    setBusy('restore');
    setNote(null);
    const e = await restore();
    setBusy(null);
    setNote(e.plus ? 'Restored. Plus is on.' : 'No Plus purchase found on this Apple ID.');
  };

  const period = (kind: PlusOffer['kind']) =>
    kind === 'annual' ? 'a year' : kind === 'monthly' ? 'a month' : 'once';

  const explain = (kind: PlusOffer['kind']) =>
    kind === 'lifetime'
      ? 'One payment. Yours on this Apple ID for good — no renewal.'
      : `Renews automatically every ${kind === 'annual' ? 'year' : 'month'} until cancelled. Cancel any time in Settings → Apple ID → Subscriptions, at least a day before the renewal.`;

  return (
    <Screen>
      <View style={styles.topRow}>
        <AppText variant="label" color="textTertiary" style={styles.grow}>
          IntentNorth Plus
        </AppText>
        <Button title={entitlement.plus ? 'Done' : 'Not now'} variant="ghost" onPress={close} />
      </View>

      {entitlement.plus ? (
        <>
          <AppText variant="title">Plus is on.</AppText>
          <AppText variant="secondary" style={styles.sub}>
            {entitlement.expiresAt
              ? `Renews or ends ${new Date(entitlement.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Manage it in Settings.`
              : entitlement.source === 'dev'
                ? 'Granted for development.'
                : 'Lifetime — no renewal, nothing more to pay.'}
          </AppText>
        </>
      ) : (
        <>
          <AppText variant="title">
            {firstName ? `${firstName}, your coaches are ready.` : 'Your coaches are ready.'}
          </AppText>
          <AppText variant="secondary" style={styles.sub}>
            The interview built your profile and your plan. Plus is what runs it — seven coaches
            placing real sessions into your real days, and re-placing them when the day changes.
          </AppText>
        </>
      )}

      {!entitlement.plus ? (
        <>
          <SectionHeader title="Choose how to pay" />
          {offers === null ? (
            <Card>
              <AppText variant="heading">Getting prices from the App Store…</AppText>
              <AppText variant="caption" color="textTertiary">
                Prices are set by Apple in your country and shown here as they are.
              </AppText>
            </Card>
          ) : offers.length === 0 ? (
            <Card>
              <AppText variant="heading">
                {STOREKIT_AVAILABLE ? 'The App Store did not answer.' : 'Purchases happen in the iPhone app.'}
              </AppText>
              <AppText variant="caption" color="textTertiary">
                {STOREKIT_AVAILABLE
                  ? 'Check the connection and try again. Nothing has been charged.'
                  : 'This build cannot reach the App Store, so there is nothing to buy here.'}
              </AppText>
              {STOREKIT_AVAILABLE ? (
                <Button title="Try again" variant="secondary" onPress={() => loadOffers().then(setOffers)} style={styles.retry} />
              ) : null}
            </Card>
          ) : (
            <View style={styles.stack}>
              {offers.map((o) => (
                <Card
                  key={o.productId}
                  onPress={busy ? undefined : () => onBuy(o)}
                  accessibilityLabel={`Plus, ${o.kind}, ${o.displayPrice} ${period(o.kind)}`}
                  style={o.kind === 'annual' ? { borderColor: theme.accent, backgroundColor: theme.accentSoft } : undefined}
                >
                  <View style={styles.priceRow}>
                    <AppText variant="heading" style={styles.grow}>
                      {o.kind === 'annual' ? 'Yearly' : o.kind === 'monthly' ? 'Monthly' : 'Lifetime'}
                    </AppText>
                    <AppText variant="heading">
                      {o.displayPrice}
                      <AppText variant="caption" color="textTertiary">
                        {' '}
                        {period(o.kind)}
                      </AppText>
                    </AppText>
                  </View>
                  <AppText variant="caption" color="textTertiary">
                    {explain(o.kind)}
                  </AppText>
                  {busy === o.productId ? (
                    <AppText variant="caption" color="accent" style={styles.busy}>
                      Waiting for the App Store…
                    </AppText>
                  ) : null}
                </Card>
              ))}
            </View>
          )}
          {note ? (
            <AppText variant="secondary" color="accent" style={styles.note}>
              {note}
            </AppText>
          ) : null}
        </>
      ) : note ? (
        <AppText variant="secondary" color="accent" style={styles.note}>
          {note}
        </AppText>
      ) : null}

      <SectionHeader title="What Plus runs" />
      <View style={styles.stack}>
        {PLUS_RUNS.map(([title, body]) => (
          <Card key={title}>
            <AppText variant="heading">{title}</AppText>
            <AppText variant="caption" color="textTertiary">
              {body}
            </AppText>
          </Card>
        ))}
      </View>

      <SectionHeader title="Free, always" />
      <Card>
        {FREE_ALWAYS.map((line) => (
          <AppText key={line} variant="body" style={styles.freeLine}>
            · {line}
          </AppText>
        ))}
        <AppText variant="caption" color="textTertiary" style={styles.freeNote}>
          We never charge for someone&apos;s hardest moment.
        </AppText>
      </Card>

      <View style={styles.legal}>
        <Button
          title={busy === 'restore' ? 'Restoring…' : 'Restore purchases'}
          variant="ghost"
          onPress={() => {
            if (!busy) void onRestore();
          }}
          hint="Re-checks this Apple ID with the App Store"
        />
        <View style={styles.legalRow}>
          <Button title="Terms of use" variant="ghost" onPress={() => Linking.openURL(TERMS_URL)} />
          <Button title="Privacy policy" variant="ghost" onPress={() => Linking.openURL(PRIVACY_URL)} />
        </View>
        <AppText variant="caption" color="textTertiary" style={styles.legalNote}>
          Payment is taken by Apple through your Apple ID at confirmation. Subscriptions renew
          automatically unless cancelled at least 24 hours before the end of the current period;
          manage or cancel in Settings → Apple ID → Subscriptions. IntentNorth receives nothing
          about you from the purchase.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  grow: { flexGrow: 1, flexShrink: 1 },
  sub: { marginTop: Spacing.sm },
  stack: { gap: Spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  busy: { marginTop: Spacing.xs },
  retry: { marginTop: Spacing.sm },
  note: { marginTop: Spacing.md },
  freeLine: { marginBottom: Spacing.xs },
  freeNote: { marginTop: Spacing.sm },
  legal: { marginTop: Spacing.lg, gap: Spacing.xs },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  legalNote: { textAlign: 'center', marginTop: Spacing.sm },
});
