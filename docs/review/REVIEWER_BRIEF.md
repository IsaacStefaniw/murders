# Reviewer brief

You are running a user-research session on an iPhone app called IntentNorth, which is about to launch. You will play twenty different people, one at a time, each described in your batch file. For each person you read the app exactly as they would encounter it, in order, and report honestly what they understood, where they got stuck, what they wanted, and whether they would pay.

## The material

- `PACK.md` — every screen of two journeys, as the app's own text. Journey A is a fresh install on the free tier: the first screen, the twelve-step interview, the plan review, the paywall, then Today, Coaches, a coach, the library, Week, Progress, Settings on the free tier. Journey B is a paying subscriber six weeks in: Today, Week, Coaches, all seven coaches, the library, a workout, breathing, meditation, the weekly report, Progress, the morning check-in, Settings.
- `shots/*.png` — screenshots of the key screens, named in PACK.md. Look at at least the first screen, one interview step, the plan review, the paywall, Today (free and Plus), one coach, the library and the workout.
- Facts you may rely on: it is iPhone-only; the free tier includes the interview, the profile, the first insight, the day's shape, every urge and reset tool, breathing and two-minute practices, backup, and a full view of every coach and practice by name; Plus is A$14.99 a month, A$89.99 a year or A$249 once and runs the programs; nothing entered leaves the phone; there is no account; Apple Health is read only, optional; it is Australian-made.

## How to play each person

Be that person, not a UX expert. Use their tech comfort, budget, attitude, health and goal. Read Journey A in order as if installing it for the first time. Stop where they would stop. Then, if they would have paid, read Journey B as their sixth week. A wary person judges in ninety seconds; a data lover reads everything; a person with a bad knee looks for whether the app noticed.

Do not be polite. Do not be uniformly negative either. Report what this specific person would say to a friend afterwards.

## What to return

Write one JSON file: `OUTPUT_PATH` (given in your instructions). It must be a JSON array of exactly twenty objects, one per persona, in batch order, each with these keys:

```
{
  "id": "P0001",
  "understood_what_it_is": true | false,            // after the first screen and the interview, could they say what the app is and does?
  "one_sentence_description": "what they think the app is, in their words",
  "first_impression": "one or two sentences",
  "stopped_at": "screen id where they would have quit, or null",
  "confusions": ["specific things that confused them, quoting the app's words"],
  "friction": ["things that slowed or annoyed them"],
  "missing": ["things they looked for and could not find"],
  "liked": ["things that landed"],
  "jargon_flagged": ["words or phrases they did not understand"],
  "would_pay": "yes" | "maybe" | "no",
  "price_reaction": "one sentence",
  "paywall_reaction": "one sentence on when and how the paywall appeared",
  "top_changes": ["the three changes that would most move them to use it", "...", "..."],
  "tags": ["from the taxonomy below only"],
  "severity": 1 | 2 | 3 | 4 | 5                      // 5 = would delete immediately, 1 = would keep and recommend
}
```

## Tag taxonomy (use these strings exactly; pick every one that applies)

unclear_what_it_is · jargon · interview_too_long · interview_question_unclear · interview_missing_option · plan_review_confusing · paywall_too_early · paywall_unclear_value · price_too_high · free_tier_unclear · today_overwhelming · today_unclear_next_step · reasons_helpful · reasons_confusing · coaches_naming_confusing · hub_overwhelming · hub_intake_questions_odd · library_hard_to_scan · library_grades_helpful · evidence_names_offputting · workout_clear · workout_unclear · health_condition_ignored · sex_gating_question_uncomfortable · tone_preachy · tone_good · copy_too_long · copy_too_clever · privacy_trust_good · privacy_unclear · no_account_confusing · notifications_unclear · settings_confusing · progress_unclear · report_unhelpful · family_features_thin · money_features_thin · work_features_thin · wants_android · wants_watch · wants_calendar_sync · wants_partner_sharing · accessibility_small_text · would_recommend

## Rules

- Only quote text that is actually in PACK.md.
- Every persona gets its own answers; do not copy between them.
- Finish all twenty. If the file would be long, that is fine.
- Write the JSON file with the Write tool; do not print it.
