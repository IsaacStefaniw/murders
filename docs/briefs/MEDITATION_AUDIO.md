# Brief: recorded meditation audio

For a session with a good text-to-speech service. Written 8 September 2026
against the live code.

## What exists now

Guidance is spoken by **`expo-speech`** — the phone's own text-to-speech,
reading cue lines aloud as they arrive. There is no audio file anywhere in
the app.

- `src/features/mind/scripts.ts` — **7 scripts, one per practice**
  (breath, body-scan, noting, kindness, nsdr, sleep, open), **33 cues**
  between them, 18 of which carry a second `detail` line.
- Each cue is `{ atSec, text, detail? }`. **Timing is a second-offset from
  session start**, not a timer — nothing accumulates drift and a
  backgrounded app resumes in the right place.
- `src/features/mind/voice.ts` — shortlists the device's voices, prefers
  enhanced/premium over compact, male-first, locale before gender.
- `src/app/session/meditate.tsx` — plays it, at `rate: 0.82, pitch: 0.92`.

Isaac's verdict: too robotic, mispronounces words, and buggy. He is right
on all three, and the bugs are listed at the end for the app session rather
than for you.

## Why it sounds robotic, honestly

Two causes, and only one of them is your problem.

**iOS ships a compact voice by default** and installs the enhanced or
premium version only when someone downloads it. The compact voices are the
robotic ones. The code already prefers the better version *if it is on the
phone* — but most phones do not have one, and nothing currently tells the
user they can get one free in Settings. That is an app fix and it is the
cheapest quality win available.

**Beyond that, device TTS has a ceiling.** No rate or pitch tuning makes a
concatenative voice sound like a person breathing slowly in a quiet room.
Recorded audio from a modern neural voice is a different category of thing,
and that is what this brief is for.

## The ask

**25 sessions per practice, rotated**, so somebody sitting daily does not
hear the same ten minutes twice in a month. Seven practices, so **175
sessions**. Plus a small set of **selectable voices**.

## Generate the cue lines, not the sessions

This is the most important instruction in the brief, so it gets its own
section.

**Do not render 175 ten-minute audio files.** A guided meditation is mostly
silence: a ten-minute session is five or six spoken lines with long gaps
between them, and the app already knows exactly when each line belongs.

Render **one short clip per cue line**. The app plays each clip at its
`atSec` offset against real silence, exactly as it drives the text today.

The difference is not marginal:

| Approach | Per session | 175 sessions |
|---|---|---|
| Whole-session audio, 48 kbps mono | ~3.6 MB | **~630 MB** |
| Cue clips only (~60 s of speech) | ~400 KB | **~70 MB** |

That is roughly a 90% reduction, and it is the difference between
infeasible and routine. A user downloads about 400 KB for a session — a
second on any connection — and then it works offline forever.

It also preserves everything that already works: the drift-free timing, the
resume-after-backgrounding behaviour, and the on-screen text staying in
sync with the voice.

## Deliverables

**1. The scripts.** 175 sessions as structured data, matching the existing
shape exactly:

```ts
{
  id: string;            // unique, kebab-case, e.g. 'breath-morning-04'
  title: string;
  practice: 'breath' | 'body-scan' | 'noting' | 'kindness' | 'nsdr' | 'sleep' | 'open';
  blurb: string;         // one line for the chooser
  build: (durationMin: number) => GuidanceCue[];   // cues scaled to length
}
```

Read `src/features/mind/scripts.ts` first and match its voice. Three rules
it holds that you must keep:

- **Never instruct anyone to clear their mind.** It is not achievable and
  it teaches people they are bad at something they are doing correctly.
  Every script treats the wandering *as* the repetition, which is what the
  traditions these come from actually teach.
- **Cues are short enough to read at a glance with eyes half open**, with
  the `detail` line carrying any reason.
- Sessions scale by duration — `build(durationMin)` must produce sensible
  cues for anything from 3 to 30 minutes.

**2. The audio.** One clip per cue line — and per `detail` line, as a
separate clip, because the app should be able to speak the detail after a
beat rather than running the two together.

- Format: **mono AAC or Opus, 44.1 kHz, ~48 kbps.** Loudness normalised to
  about **-19 LUFS** so no line is louder than the one before it.
- **Leading and trailing silence trimmed to under 100 ms.** The app owns
  the gaps; a clip that carries its own padding fights the timing engine.
- Naming: `<voice-id>/<script-id>/<cue-index>[-detail].m4a`.
- A **manifest JSON** per script: cue index, `atSec`, the exact text, the
  file, its duration in ms, and a checksum.

**3. The voices.** Three or four, generated across the whole library so a
person can actually choose. Suggested spread: two lower-register (one
male-sounding, one female-sounding), one brighter, one specifically for
the sleep and NSDR practices where slower and quieter is the point.

Per voice, also render a **15-second sample line** for the picker.

## How the voice should perform

This matters more than which service you use.

- **Pace: slow.** Meaningfully slower than conversational. The existing TTS
  runs at 0.82 of default and is still too quick.
- **Long pauses inside lines**, not just between them. Where the text has a
  comma, take a real breath.
- **Falling intonation.** Guidance that rises at the end of a phrase sounds
  like a question and pulls attention forward, which is the opposite of the
  job.
- **Quiet, close-mic warmth.** Someone speaking gently in the same room,
  not announcing.
- **No music, no bells, no ambience.** The app owns silence and some people
  sit next to a sleeping child.

Use SSML where the service supports it — `<break>` and prosody rate are
where most of the quality lives.

## Pronunciation

Isaac specifically flagged mispronunciation. Build a **pronunciation
list** as you go: any word the engine gets wrong, with the phonetic
respelling or SSML `<phoneme>` that fixes it. Deliver it as a JSON map.

It has value beyond the recordings — the app will keep falling back to
device TTS for anything not yet downloaded, and the same map can fix that
path too.

Likely candidates: *NSDR*, *yoga nidra*, *diaphragm*, *sacrum*, *supine*,
*metta*, *vipassana*, and any Sanskrit or Pali that appears.

## Service choice

Yours to make. Judge candidates on: how good the slow, quiet register
sounds (many voices are tuned for narration and get eerie when slowed),
SSML pause control, pronunciation override support, and the **licence for
commercial use in a paid app** — which is not optional and should be
confirmed in writing before you generate 175 sessions.

Record what you chose and why, and keep the licence terms with the files.

## Two things to check with Isaac before you start

**Hosting.** 70 MB across four voices is too much to ship inside the app.
It needs somewhere to live and an on-demand download. The app today has
**no server and no account** — local-first is a deliberate design and a
selling point — so adding a download path is a real decision, not a detail.
The cheapest version is static files on the existing domain or a CDN
bucket, fetched by URL, cached on device. Get his call before building
around it.

**Scope.** 175 sessions × 4 voices is a large first order. A sensible first
slice is **one practice (breath), 25 sessions, two voices** — enough to
hear whether the quality justifies the infrastructure, at roughly 3% of the
cost. Recommend that unless Isaac wants the lot.

## Bugs for the app session, not for you

Found while reading the code. Listed here so they travel with the work.

1. **`cue.detail` is never spoken.** It renders on screen
   (`meditate.tsx:345`) and is absent from the `Speech.speak` call
   (`:139`), which only passes `cue.text`. **18 of 33 cues carry a detail
   line**, so more than half the guidance is silent — for a feature whose
   own copy says "close your eyes and leave them closed". This is the big
   one.
2. **Turning the voice off mid-line does not stop it.** The effect returns
   early on `!voiceOn` without calling `Speech.stop()`, so the sentence in
   flight keeps talking.
3. **`spokenRef` never resets.** It holds the last spoken line for the life
   of the screen, so a repeated line is skipped, and restarting a session
   can silently swallow its first cue.
4. **The voice picker calls `Speech.stop()`** (`:289`) — opening it during
   a session kills the guidance, and the sample then speaks over the top.
