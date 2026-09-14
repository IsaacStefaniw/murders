import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { YourAnswers } from '@/features/onboarding/YourAnswers';

/**
 * The other half of the interview, on demand.
 *
 * Most of the questions the app can ask are deferred so that signup is not
 * forty screens long. Deferred meant "later, inside the pathway they
 * belong to" — and for anybody who never opens that pathway, later never
 * came. This is where later happens.
 */
export default function Answers() {
  return (
    <Screen>
      <AppText variant="label" color="textTertiary">
        About you
      </AppText>
      <AppText variant="title">What the app knows</AppText>
      <AppText variant="secondary">
        Nothing here is locked in. Answer what was never asked, and change anything that has stopped
        being true — the plan rebuilds from it.
      </AppText>
      <YourAnswers />
    </Screen>
  );
}
