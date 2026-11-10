/**
 * Whether the journal analyst may send free text off the device.
 *
 * ── The request, and what the audit actually found ─────────────────────
 *
 * Isaac, 10 Nov 2026: *"please ensure all of my health data is stored
 * privately for our analysis."*
 *
 * Almost all of it is already on-device and stays there. The profile, the
 * metrics stream, the workout logs, the behaviour events and the
 * reflections all live in one AsyncStorage key (`intent-os-store`), and
 * nothing in the app uploads them. `syncAppleHealth` reads from Health
 * and writes nothing back out. The docs in this repo are in git, which he
 * decided himself: *"Push it all — it's my private repo."*
 *
 * **One path was not like the others.** `lib/ai/agents.ts` says it plainly
 * in its own header — *"raw journal text goes only to the reflection
 * analyst, which exists to analyse it"* — and `analyseReflection` is
 * called from the evening check-in on every save. `lib/ai/provider.ts`
 * sends it to a Supabase Edge Function. So the free-text answers to
 * *"what got in the way"* and *"what went well"*, plus the mood score,
 * leave the phone.
 *
 * ── Why it was not leaking, and why that is not good enough ───────────
 *
 * There is no `.env` in this repo, only `.env.example`, so
 * `isSupabaseConfigured()` is false, `getAiProvider()` returns null, and
 * `analyseReflection` has always taken its deterministic fallback.
 * **Nothing has ever left the device.**
 *
 * That is an accident of configuration, not a decision. Setting two
 * environment variables in an EAS build — which is a thing somebody does
 * to turn on an unrelated feature — would start uploading his journal
 * with no further change and no prompt. A privacy property that holds
 * because a key is missing is not a privacy property.
 *
 * ── A build flag, for the reason `features/health/flag.ts` gives ───────
 *
 * The same pattern and the same argument as the markers flag:
 *
 *  > *"A hidden in-app switch that reveals health claims to whoever knows
 *  > where to look is a guideline 2.3.1 problem... So this is decided at
 *  > BUILD time. A build either has the feature or does not, and nothing
 *  > is concealed inside a build that ships."*
 *
 * An in-app toggle would be the wrong shape here too, for a second
 * reason: a toggle that is off by default and sends data when on is one
 * mis-tap from an upload that cannot be taken back. A build either sends
 * journal text or it cannot.
 *
 * **Default off.** `EXPO_PUBLIC_AI_JOURNAL=1` turns it on, deliberately,
 * for a build made to use it. Everything else about the app works
 * unchanged, because the analyst already had to degrade gracefully for
 * the case where AI was unavailable — so there is no second code path
 * here, only the existing one, reached on purpose rather than by luck.
 *
 * ── What this does NOT cover, said so nobody reads it as more ─────────
 *
 * Structured plan data (titles, areas, times, counts) still goes to the
 * planner and weekly-narrative agents when AI is configured. That is
 * minimised by design — see `minifyPlan` — and it is not his journal, but
 * it is also not nothing: a list of routine titles and times says
 * something about a person. It is left as it is because the ask was about
 * health data and the free text is the sensitive part; naming it here so
 * the gap is on the record rather than implied shut.
 */

/**
 * True only in a build explicitly made to send journal text for analysis.
 *
 * Read by `analyseReflection`, which returns its deterministic signals
 * instead when this is false.
 */
export const AI_JOURNAL_ENABLED = process.env.EXPO_PUBLIC_AI_JOURNAL === '1';
