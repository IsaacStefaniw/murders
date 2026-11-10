# Where Isaac's health data actually is

*"Please ensure all of my health data is stored privately for our
analysis."* — 10 Nov 2026

This is an audit, not a reassurance. Every row was checked against the
code on the date below, and the one thing that was not private by
decision is named and fixed.

---

## The summary, in one table

| what | where it lives | leaves the device? |
| --- | --- | --- |
| profile (name, hours, lifts, weight) | `src/features/me/profile.ts`, compiled in | **no** |
| metrics stream (`body.weight`, `sleep.hours`, `mind.mood`, e1RMs) | AsyncStorage, key `intent-os-store` | **no** |
| workout logs, every set and its timestamp | same key | **no** |
| behaviour events (vaping, alcohol, urges) | same key | **no** |
| reflections (mood, "what got in the way") | same key | **no** — see §2 |
| Apple Health readings | read in, written to the metrics stream | **no** |
| the docs in this repo | git, GitHub, private repo | **yes, by his decision** |

---

## 1. The store is one key on the phone, and nothing uploads it

The whole app state persists through Zustand's `persist` into
AsyncStorage under **`intent-os-store`**. There is no sync, no account,
no backup target and no telemetry: nothing in the codebase reads that
store and sends it anywhere.

`syncAppleHealth` in `features/health/healthkit.ts` runs one way. It
reads from Apple Health and writes into the metrics stream. It does not
write back to Health and does not send readings out.

**What this costs him, said plainly:** a wiped phone is a wiped record.
On-device-only and durable are different properties, and this app has
the first one. The repo holds the profile and the plan, so those
survive; the logs would not.

## 2. The one path out, which is now closed by default

`lib/ai/agents.ts` says it in its own header: *"raw journal text goes
only to the reflection analyst, which exists to analyse it."*

`analyseReflection` is called from the evening check-in **on every
save**, and `lib/ai/provider.ts` sends its input to a Supabase Edge
Function. Its input is the mood score and the free-text answers to *what
got in the way* and *what went well*.

**It was not leaking.** There is no `.env` in this repo, only
`.env.example`, so `isSupabaseConfigured()` is false,
`getAiProvider()` returns null, and the analyst has always taken its
deterministic fallback. Nothing has ever left the phone.

**And that was luck, not a decision.** Setting two environment variables
in an EAS build — something somebody does to turn on an unrelated
feature — would have started uploading his journal with no further
change and no prompt. A privacy property that holds because a key is
missing is not a privacy property.

Now gated on `EXPO_PUBLIC_AI_JOURNAL`, **default off**, in
`lib/ai/consent.ts`. A build flag rather than an in-app toggle, for the
reason `features/health/flag.ts` already argues, plus one more: a toggle
that uploads when on is one mis-tap from something that cannot be taken
back. The test asserts the strong version — that the code **never asks
for a provider** while the flag is off, so a key appearing later changes
nothing.

### What this does not cover

Structured plan data — routine titles, areas, times, counts — still goes
to the planner and weekly-narrative agents **if** Supabase is ever
configured. It is minimised by design (`minifyPlan`) and it is not his
journal. It is also not nothing: a list of routine titles and times says
something about a person. Left as it is because the ask was about health
data and the free text is the sensitive part. Named here so the gap is
on the record rather than implied shut.

## 3. The repo, which was his call

`docs/LOG.md`, `docs/DAILY.md`, `docs/IF_THENS.md`,
`docs/ISAAC_WEEK.md` and `docs/ISAAC_NUTRITION_9NOV.md` hold the
sensitive material: the drinking and vaping log, the concealment, the
moods, the weights. `src/features/me/profile.ts` holds his hours, his
lifts and his household.

Asked before any of it was pushed, he said: *"Push it all — it's my
private repo."* That is the decision and this file does not reopen it.

Two things worth knowing about it anyway:

- **Private is not deleted.** Git keeps history, so a line removed later
  stays in earlier commits. Anything that must be unrecoverable needs the
  history rewritten, not a follow-up commit.
- **His email is not in the repo** and is not sent anywhere. It is used
  only to identify him as the author of this work.

## 4. The markers instrument is not in his build

`MARKERS_ENABLED = process.env.EXPO_PUBLIC_MARKERS === '1'`, unset. The
age-shaped number, its sharing affordance and the blood-panel entry are
simply not in a build made without that flag — `features/health/flag.ts`
has the full argument, including the open TGA question about whether
software predicting disease risk is a medical device.

This matters for anything he asks the markers to tell him: **the feature
exists in the repo and is not in the app on his phone.**

---

## What to check if this is ever reread

1. `ls .env*` — a real `.env` with Supabase keys changes §2's conclusion
   for the planner agents (not for the journal, which is flag-gated).
2. `grep -rn "EXPO_PUBLIC_AI_JOURNAL\|EXPO_PUBLIC_MARKERS" eas.json app.json`
   — a build profile setting either one turns that feature on.
3. `npx jest src/lib/ai/__tests__/consent.test.ts` — the journal gate.
4. Any new `fetch(`, `supabase.functions.invoke` or analytics SDK is a
   new path out and belongs in the table above.

*Audited 10 Nov 2026 against the working tree. Nothing here is a
guarantee about Apple, GitHub or AsyncStorage themselves — only about
what this app's own code does with his data.*
