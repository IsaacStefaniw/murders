/**
 * Whether the markers instrument is visible in this build.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 *
 * The app has been rejected twice — once under 2.1(b), once under 2.3.8 —
 * and the immediate job is getting 1.0 approved. The markers feature is
 * the highest-scrutiny thing in the whole product: it shows an age-shaped
 * number derived from mortality research, offers to share it, and sits in
 * the exact territory Apple looks hardest at for health apps. It is also
 * the feature with an open regulatory question against it (TGA, whether
 * software predicting disease risk is a medical device).
 *
 * Adding it to the resubmission would put the riskiest feature in front of
 * a reviewer who has already turned us down twice, on a version whose only
 * job is to get through. That is a bad trade on timing alone, entirely
 * separate from whether the feature is good.
 *
 * ── WHY A BUILD FLAG AND NOT A TOGGLE ───────────────────────────────────
 *
 * A hidden in-app switch that reveals health claims to whoever knows where
 * to look is a guideline 2.3.1 problem — apps must not contain hidden or
 * undocumented features — and a worse one than the thing it was trying to
 * avoid. So this is decided at BUILD time. A build either has the feature
 * or does not, and nothing is concealed inside a build that ships.
 *
 * Set EXPO_PUBLIC_MARKERS=1 for an internal TestFlight build to try it on.
 * Production builds for review leave it unset, and the feature is simply
 * not in them.
 */

export const MARKERS_ENABLED = process.env.EXPO_PUBLIC_MARKERS === '1';
