# Film brief — the hero film, rebuilt around the positioning

> **Revision 2, 2026-09-04.** User feedback: nobody could tell what we sell.
> `docs/POSITIONING_REVIEW.md` replaces §6 with a thirty-second script that
> opens on the problem in plain words. The masters for it are
> `docs/film/film9-30s-plain.py`; the films are `intentnorth-week-30s` and
> `-vertical`. §1–§5, §7 and §8 still hold.


Written 2026-09-04 as the brief an agency would be handed, and then worked
to. It replaces the 45s "coaching spine" cut (`film5`) and the 16s vertical
(`film6`) as the reference for anything that moves on the site or in the
store. The masters that implement it live beside this file under
`docs/film/`; the render pipeline is at the end.

## 1. Why the current film is not working

Watched cold, as a first-time visitor, the 45s cut has five problems:

- **It opens on ideas, not the product.** Three abstract lines ("A coach
  asks before they prescribe…") take six seconds before a screen appears.
  Every competitor puts the product on screen inside the first second.
- **It is dark.** A near-black stage with a mint accent, on a site that is
  warm ivory, eucalyptus and charcoal. The film reads as a different brand
  from the page around it.
- **The product is small.** The phone sits at 88% scale on the right; the
  copy column carries the film. The thing we are selling is the thing that
  is hardest to see.
- **It argues the wrong three things.** The spine is "asks, builds, shows
  its working", which is how the app behaves. The positioning we have now
  agreed is what the app *is*: proven protocols synthesised and rated,
  programs that live with you, seven coaches that build a life with
  intent. None of those three is stated.
- **48 seconds with seven text-led beats** is long for a hero. Attention on
  a landing page is decided in the first ten.

## 2. What the field does (checked 2026-09-04)

- **Whoop.** Hundreds of live ads; the video ones average about 16 seconds,
  aspirational ("See where WHOOP can take you"), mobile-first, a trial CTA
  on nearly every placement. Emotion over feature. Lifestyle footage with
  the app's numbers overlaid.
- **Rise.** One number carried the whole product: sleep debt. The hero is
  the app screen with that number, and the copy is the number's meaning.
- **Headspace.** Soft colour, gentle motion, generous space. The film
  *feels* like the outcome it sells. Motion as tone, not as explanation.
- **Sunsama.** Calm, real UI, the daily ritual shown as the product. No
  device theatre; the screen is the film.
- **App Store previews** (Apple's rules, current): 15–30 seconds, real
  in-app footage only, no device frames, no hands, no recreated scenes,
  886×1920 for iPhone, H.264, up to three per locale.

What we take from that: **product in the first second, one idea per beat,
the screen large, the tone of the page, and a number only where the number
is the point.** What we do not take: lifestyle footage of people we have
not filmed, claims about outcomes we have not measured, and a trial we do
not offer.

## 3. Positioning — the three things the film must land, in order

1. **Proven protocols, synthesised and rated.** 177 practices distilled
   from public evidence-based teaching, each graded A to E, each credited,
   145 with a plain-words safety line. Nobody else shows the grade.
2. **Programs that live with you.** Not a plan you found: a program placed
   into the days you actually have, that moves when your day moves, tells
   you why, and changes when your own numbers change.
3. **Seven coaches that build your life with intent.** Training, nutrition,
   money, work and leadership, habits and urges, relationship, family and
   adventure — from one profile, each with a level you earn and a ladder
   you climb.

The line that closes the film and the site: **Built with intent.**

## 4. The creative idea

**One phone, three chapters, nothing that is not the app.** The phone is
centred and large from the first frame and never leaves. The film's only
invented elements are the chapter titles and one sentence per beat; every
other word on screen is the application's own output. Chapter one is
*selecting a protocol* and seeing it land in the plan. Chapter two is *the
plan growing and moving*: the day filling row by row, the line that says
what moved and why, a short night changing the session. Chapter three is
*the seven coaches*, one after another, each with the level card that
shows where you are and the ladder that shows where you are going, ending
on the Coaches screen with all seven active.

The audience is a sceptical, time-poor professional with a family. They
have deleted three apps this year. The film has to prove, not promise.

## 5. Visual system — the page's own

- **Ground** paper `#f4f1e9`, deep paper `#e9e5da`. **Ink** `#111512`,
  soft ink `#263029`, muted `#59635b`. **Green** `#4c6353` (accent, the
  app's own), sage `#c7d2c3`. **Ember** `#ab5f40` for exactly one moment:
  the chapter counter.
- **Type.** Display in a humanist serif (the site's h1 stack: Iowan Old
  Style, Palatino, Georgia; the render container substitutes Charter).
  Captions in a plain system sans. Chapter eyebrows in small caps with
  letter-spacing. Nothing bold and shouting; the app is calm and the film
  should be.
- **Motion.** One move per beat. 400–800ms, ease-out, never a bounce. The
  phone's screen pans as a real scroll would. Taps are a soft ring that
  expands once. Copy enters by rising 16px and fading; it leaves by
  fading only. A thin rail at the foot shows time passing.
- **Layout (16:9).** Copy column left, 40% of the frame, baseline-aligned
  to the phone's screen top. Phone right of centre, screen 380 CSS px wide
  at 1080p, rendered from 3× captures so it is crisp. Under the phone, one
  line of small text for anything the law or the app's own rules require
  in frame (the attribution line, the education disclaimer).
- **Layout (9:16).** Copy above, phone below, the same rules.

## 6. Script and storyboard — 45s hero, 16:9

| Time | On the phone (real screen) | Copy (left) | Note |
|---|---|---|---|
| 0.0–2.6 | Today, rising into frame | *A week built with intent.* | Product on screen at 0.4s |
| 2.6–4.6 | Library, top | 01 · PROVEN PROTOCOLS, SYNTHESISED AND RATED — *177 practices. Graded A to E. Every one credited.* | Attribution line under the phone, verbatim from the app |
| 4.6–9.0 | Library panning slowly through Morning light, Wind-down breathing, Caffeine cutoff | *Where it came from, how good the evidence is, and where it stops.* then *145 carry a plain-words safety line.* | Evidence grades and ⚠ lines visible as they pass |
| 9.0–12.6 | Pan stops on Morning light; tap ring on *Add to my plan*; button becomes *On your plan — pause it* | *One tap. It is in your week.* | The state change is the app's |
| 12.6–15.2 | Today, the rows revealing top to bottom | 02 · PROGRAMS THAT LIVE WITH YOU — *Placed into the days you actually have.* | Soft wipe reveals the day |
| 15.2–19.4 | Today, ring on the top card | Quote, verbatim: *"Name one thing moved to 8:50pm — health had the hour it wanted, and that is the order you set."* | The arbitration, in the app's words |
| 19.4–23.6 | Workout; tap *Under 6h*; line changes to *Short night — main work stays, accessories rest today.* | *A short night changed today's session.* | Before/after, same screen |
| 23.6–26.2 | Today, panning to Tonight | *It moves when your day moves. It tells you why.* | |
| 26.2–28.4 | Coaches, all seven | 03 · SEVEN COACHES THAT BUILD YOUR LIFE WITH INTENT — *One profile. Seven programs.* | |
| 28.4–40.0 | Seven hubs, 1.6s each, each panning to its level card | The seven names, lighting in turn, each with one line: Training — *Sets, reps, rest and load. Decided.* · Nutrition — *No diet, no logging. Your own protein number.* · Money — *Automation first. The goal paid before the month starts.* · Work & leadership — *Protected thinking time. A review that changes next week.* · Habits & urges — *Not willpower. Engineering.* · Relationship — *Small, repeatable attention.* · Family & adventure — *The weekend that actually happens.* | Every line is a fragment of the coach's own promise text |
| 40.0–42.4 | Coaches screen, the list with every path *Active* | *Each with a level you earn and a ladder you climb.* | |
| 42.4–46.0 | Phone settles; end card | **IntentNorth** — *Seven coaches. One profile. Built with intent.* — `intentnorth.app` — *Australian-developed. Nothing you enter leaves your phone.* | Education disclaimer in small text |

The 9:16 cut (16–20s, for social) keeps beats 1, 3, 4, 7 and 12: protocol
chosen, in the week, short night, seven coaches, end card. The App Store
preview (15–30s, 886×1920) is the same sequence with **no phone frame and
no copy column**: real screens only, captions as light overlays, because
that is what Apple permits.

## 7. Rules the film obeys (non-negotiable)

- Every sentence on the phone is the shipped app's output. Nothing is
  mocked, retouched or typed for the camera.
- Numbers, counted from the code on the day: 177 practices; 13 A, 60 B,
  63 C, 33 D, 8 E; 145 with a safety line; 188 named researchers and
  practitioners; seven pathways, four levels. Never "clinically proven",
  never user numbers, never outcomes.
- Named educators appear only as the app shows them, and the app's own
  line — *Attribution credits public work and implies no endorsement of
  IntentNorth.* — is in frame whenever a name is.
- "Program", "plan", "protocol". Never "prescription".
- The education disclaimer is on the end card: *Education and structured
  planning, not medical, psychological or financial advice.*
- Recovery, urge and hardest-moment support is free; if the film mentions
  price it mentions that.
- Sleep debt appears on Today. It ships over the air on approval of 1.0;
  until then the site captions must not sell it as live.
- No music bed we do not own. The films ship silent and autoplay muted.

## 8. Deliverables and acceptance

| File | Size | Length | Use |
|---|---|---|---|
| `intentnorth-intent-45s.mp4` / `.webm` | 1920×1080 | ~46s | Site hero, muted autoplay, poster beside it |
| `intentnorth-intent-16s-vertical.mp4` / `.webm` | 1080×1920 | ~18s | Social |
| App Store preview | 886×1920 | 15–30s | Derived from the same masters without the frame; only after 1.0 is live |

Accepted when: the product is on screen by 0.5s; each of the three
positioning lines is on screen for at least 2.5s; no frame carries a claim
the code does not support; the film is legible with the sound off at
phone width; the end card resolves to a page that exists.

## 9. Production

Masters are Python scripts under `docs/film/` that write a single HTML file
with the screens inlined; the HTML animates itself on a fixed timeline and
is recorded by headless Chromium at the declared size, then encoded with
ffmpeg to H.264 (`crf 20`, `yuv420p`, `+faststart`) and VP9. Screens are
captured from a web export of the current commit with the film seed
(seven coaches started, Plus on, twelve logged workouts), at 420×900 CSS
px and 3× scale, plus 420×2400 for the hubs and the library so the phone
can pan. The capture and record scripts are checked in beside the masters;
the screenshots are not, because they are regenerated from the build.
