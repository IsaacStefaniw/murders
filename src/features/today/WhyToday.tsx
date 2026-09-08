import { AppText } from '@/components/text';
import { Disclosure } from '@/components/disclosure';

interface WhyTodayProps {
  /** What the arbitration decided, if it decided anything. */
  displaced: string | null;
  /** What this person's own peak and dip decided, if anything. */
  energyNote?: string | null;
}

/**
 * What the plan did with today, in one line that opens.
 *
 * These two sentences are the difference between seven coaches and one
 * product: deciding the evening goes to family rather than the gym,
 * because that is the order you gave, is a thing no single-domain app can
 * do. They used to sit above the day as two full cards, and the review's
 * first finding was that the opening screen answered "what has the system
 * learned?" before "what do I do now?" — the wrong question first, on the
 * screen a person opens twenty times a day.
 *
 * So the claim stays and the volume drops. The headline sentence is
 * always readable without a tap, because a differentiator behind a
 * disclosure is a differentiator nobody sees. The reassurance and the
 * second reason fold, because they are read once and understood.
 *
 * Renders nothing when the plan made no interesting call — which is most
 * days, and is what makes it worth reading on the days it appears.
 */
export function WhyToday({ displaced, energyNote }: WhyTodayProps) {
  const headline = displaced ?? energyNote ?? null;
  if (!headline) return null;
  const rest = displaced && energyNote ? energyNote : null;
  return (
    <Disclosure title={headline} hint="Open for what else went into today's order">
      {rest ? <AppText variant="secondary">{rest}</AppText> : null}
      {displaced ? (
        <AppText variant="secondary" color="textTertiary">
          Nothing is lost — it goes back in the running tomorrow.
        </AppText>
      ) : null}
      <AppText variant="caption" color="textTertiary">
        Your plan is built from the order you set across training, food, sleep, work,
        money and the people in your life. When two of them want the same hour, that
        order decides — and it says so rather than quietly dropping one.
      </AppText>
    </Disclosure>
  );
}
