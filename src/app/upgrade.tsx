import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/text';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { Spacing } from '@/constants/theme';
import {
  FREE_ALWAYS,
  FREE_ALWAYS_HEADING,
  FREE_FOREVER_PROMISE,
  PLUS_RUNS,
} from '@/features/plus/entitlement';
import { useTheme } from '@/hooks/use-theme';
import {
  PRIVACY_URL,
  TERMS_URL,
  buy,
  describeNoOffers,
  loadOffers,
  restore,
  type OfferResult,
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
 *
 * What stays free is stated above the prices rather than under them, and
 * every line of it is read from FREE_ALWAYS, so this screen cannot promise
 * something the entitlement code does not give.
 *
 * When Apple has nothing to say, this screen used to say one sentence for
 * every possible reason — which is what App Review saw in build 16, and
 * which told nobody anything. The empty state now names the reason it was
 * given, offers the ask again, keeps restore and the free list in reach,
 * and asks once more whenever the app comes back to the foreground, which
 * is where somebody lands after signing into a sandbox Apple Account.
 */
export default function Upgrade() {
  const router = useRouter();
  const theme = useTheme();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const entitlement = useAppStore((s) => s.entitlement);
  const firstName = useAppStore((s) => s.profile?.firstName);

  const [load, setLoad] = useState<OfferResult | null>(null);
  /** Read by the foreground listener, which must not re-ask once prices are up. */
  const hasOffers = useRef(false);
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
    const ask = () => {
      loadOffers().then((r) => {
        if (!live) return;
        hasOffers.current = r.offers.length > 0;
        setLoad(r);
      });
    };
    ask();
    // Signing into a sandbox Apple Account happens in Settings, so the
    // reviewer leaves the app and comes back to a paywall that asked once
    // and gave up. Coming back to the foreground asks again, but only
    // while there is still nothing to show.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && live && !hasOffers.current) ask();
    });
    return () => {
      live = false;
      sub.remove();
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

  const perMonth = (displayPrice: string): string | null => {
    const m = /([\d]+(?:[.,]\d+)?)/.exec(displayPrice);
    if (!m) return null;
    const n = Number(m[1].replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return displayPrice.replace(m[1], (n / 12).toFixed(2));
  };

  /** The empty-state copy, decided once and beside the code that caused it. */
  const empty = load && load.offers.length === 0 ? describeNoOffers(load) : null;

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

      {/* What stays free comes before the prices, because that is where the
          question is asked. Round three of the persona review still tagged
          "free tier unclear" on 18% of reviews with this list sitting under
          the price cards, and the most direct ask was to say up front that
          the urge tool is free forever. Every line is read from
          FREE_ALWAYS, beside the code that enforces it. */}
      <SectionHeader title={FREE_ALWAYS_HEADING} />
      <Card>
        <AppText variant="body">{FREE_FOREVER_PROMISE}</AppText>
        <View style={styles.freeList}>
          {FREE_ALWAYS.map((line) => (
            <AppText key={line} variant="body" style={styles.freeLine}>
              · {line}
            </AppText>
          ))}
        </View>
        <AppText variant="caption" color="textTertiary">
          No account. Nothing you enter leaves your phone. Paid or not, that does not change.
        </AppText>
      </Card>

      {!entitlement.plus ? (
        <>
          <SectionHeader title="Choose how to pay" />
          {load === null ? (
            <Card>
              <AppText variant="heading">Getting prices from the App Store…</AppText>
              <AppText variant="caption" color="textTertiary">
                Prices are set by Apple in your country and shown here as they are.
              </AppText>
            </Card>
          ) : empty ? (
            /* The wording and the retry both come from describeNoOffers, so
               what the reviewer reads is the branch a test asserts. The
               detail line is StoreKit's own answer: on a screenshot it is
               the difference between a guess and a diagnosis. */
            <Card>
              <AppText variant="heading">{empty.heading}</AppText>
              <AppText variant="caption" color="textTertiary">
                {empty.body}
              </AppText>
              {load.detail ? (
                <AppText variant="caption" color="textTertiary" style={styles.detail}>
                  {load.detail}
                </AppText>
              ) : null}
              {empty.canRetry ? (
                <Button
                  title={busy === 'offers' ? 'Asking again…' : 'Try again'}
                  variant="secondary"
                  onPress={() => {
                    if (busy) return;
                    setBusy('offers');
                    void loadOffers().then((r) => {
                      hasOffers.current = r.offers.length > 0;
                      setLoad(r);
                      setBusy(null);
                    });
                  }}
                  style={styles.retry}
                />
              ) : null}
            </Card>
          ) : (
            <View style={styles.stack}>
              {load.offers.map((o) => (
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
                  {o.kind === 'annual' && perMonth(o.displayPrice) ? (
                    <AppText variant="caption" color="accent">
                      About {perMonth(o.displayPrice)} a month, billed once a year.
                    </AppText>
                  ) : null}
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
  detail: { marginTop: Spacing.xs },
  note: { marginTop: Spacing.md },
  freeList: { marginVertical: Spacing.sm },
  freeLine: { marginBottom: Spacing.xs },
  legal: { marginTop: Spacing.lg, gap: Spacing.xs },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  legalNote: { textAlign: 'center', marginTop: Spacing.sm },
});
