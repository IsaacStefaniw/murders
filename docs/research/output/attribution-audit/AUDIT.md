# Attribution audit — recovery and money rounds

Written 8 September 2026. Audits every name in every `attribution` array
across `docs/research/output/recovery/protocols.ts` (22 cards, 56 credits)
and `docs/research/output/money/protocols.ts` (25 cards, 60 credits).

The rule being tested is the roster's own: *"Credit them in `attribution`
if their public teaching genuinely popularised the practice. Not if it did
not — a false credit is worse than an empty one, and the recognition only
works while it is real."*

**Nothing below reproduces transcript, article or book text.** Everything
in the "what they actually say" column is written in IntentNorth's own
words from material read at the URL given.

## Verdict types

- **TRACED** — a specific episode, newsletter, topic page, book or article
  where that person publicly teaches *this* practice. Show/title, date
  where available, URL, one sentence in our words.
- **TRACED (adjacent)** — they teach the topic but not this specific
  practice, or they teach a materially different version of it. Candidate
  for rewording the credit, not removing it.
- **UNTRACED** — searched properly, found nothing. Candidate for removal.
- **RESEARCHER** — a scientist credited for the underlying work rather
  than a populariser. Legitimate, but a different kind of credit and it
  needs the person to actually be on the paper the card rests on.
  Sub-verdicts used below:
  - *RESEARCHER (verified)* — on the author list of the card's own source.
  - *RESEARCHER (lineage)* — a real authority on the topic, but **not an
    author of any source this card rests on**. The credit is asserted from
    field reputation, not from the card's evidence.
- **INSTITUTION** — the money round credits organisations (ASIC, ATO,
  Productivity Commission, Financial Counselling Australia) in the same
  array as people. Not a populariser credit at all; audited separately.

## The structural finding, up front

The two rounds did not do the same job.

The **money round built an attribution ledger** — `money/ledgers/behaviour.md`
carries a "Popularised by / Where (book, episode, URL)" table with dated
episodes and links (Rational Reminder 232, 256, 300; Tim Ferriss 371 and
576; Barefoot Investor step pages). Most of its person-credits are
traceable from the round's own files.

The **recovery round did not**. Its ledgers say plainly that podcasts were
used "for discovery only" and "none are cited", and there is not one
episode URL anywhere in `recovery/`. All 56 credits — Huberman 16, Attia
10, Patrick 8, Galpin 4 — were asserted from general knowledge. This audit
is the first time any of them has been checked.

---

## A. SUMMARY TABLE

### Recovery round — 22 cards, 56 credits

| Verdict | Credits | Notes |
|---|---|---|
| TRACED | 20 | Almost all of them Rhonda Patrick (8 of her 8), plus Huberman on cold, jet lag and dark glasses, Ferriss on sauna-then-cold, Altini on trackers, Galpin and Attia on strength. |
| TRACED (adjacent) | 17 | Overwhelmingly Huberman (11 of his 16) and Attia (6 of his 10). They cover the topic; the card's specific practice is usually someone else's. |
| UNTRACED | 4 | Huberman on `no-drive-after-nights` and `desk-day-offset`; Attia on `pre-nights-nap` and `jet-lag-light-direction`. |
| RESEARCHER (verified) | 11 | Eastman ×3, Boivin ×2, Czeisler, Waterhouse, Espie, Cohen, Roberts, Phillips. All confirmed on the author list of the card's own source. |
| RESEARCHER (lineage) | 4 | Laukkanen ×2, Leon Lack, Jonathan Peake — real authorities, but **not authors of anything these cards cite**. |

**Headline problems.**
- **Andrew Huberman is over-credited.** 16 credits; 3 are exact, 11 are
  adjacent, 2 are untraceable. The roster warned about exactly this
  ("already the single most-credited name in the recovery round… trace
  every claim"), and the round did not.
- **Peter Attia is over-credited.** 10 credits; 3 exact, 5 adjacent, 2
  untraceable. On `tracker-stages-are-estimates` his public position runs
  the other way from the card's.
- **Rhonda Patrick is exactly right, and under-used.** All 8 of her
  credits trace to a specific FoundMyFitness page, several of them to the
  precise number on the card. She should lead the heat block.
- **Four researcher credits rest on nothing in the card.** Laukkanen twice
  is the clearest: neither sauna card he is on uses any of his work.
- **Zero episode references in the round's own ledgers.** The recovery
  ledgers state plainly that podcasts were discovery-only and none are
  cited, so nothing in `attribution` was checkable before this audit.

### Money round — 25 cards, 60 credits (37 people, 23 institutions)

| Verdict | Credits | Notes |
|---|---|---|
| TRACED | 11 | Sethi ×5, Pape ×3, Hershfield ×2, Milkman. |
| TRACED (adjacent) | 7 | Ben Felix ×4 (hosting, not teaching), Sethi and Pape on `pay-yourself-a-salary`, Pape on `tax-set-aside`. |
| UNTRACED | 0 | Nothing in the money round is wholly unsupported. |
| RESEARCHER (verified) | 19 | All confirmed against the card's own source. Eight of them (Milkman, Benartzi ×2, Lusardi, Thaler ×2, Sussman, Rick) are also genuine popularisers with a book or a dated episode. |
| RESEARCHER (lineage) | 0 | — |
| INSTITUTION | 23 | Moneysmart (ASIC) ×15, ATO ×5, Productivity Commission ×2, Financial Counselling Australia ×1. |

**Headline problems.**
- **Twelve of twenty-five cards credit no person at all.** The entire
  Australian block reads as government agencies. That is honest and it
  recognises nobody, which is the one thing `attribution` exists to do.
- **Ben Felix ×4 is a host credit, not a teaching credit.** In all four
  cases the guest — Hershfield, Sussman, Rick, Lusardi — is the person the
  listener associates with the practice, and in three of the four that
  guest is already on the card.
- **Scott Pape is under-credited.** Five credits, and he demonstrably
  teaches at least three more of these cards (super settings, insurance
  inside super, offset accounts) on his own free pages.
- **Morgan Housel has zero credits** despite being on the roster and in
  the round's own discovery ledger.
- **`money-worry-to-paper` carries one name and it is a laboratory
  psychologist.** Correct, and worth nothing as recognition.


---

## B. RECOVERY ROUND AUDIT — 22 cards, 56 credits

Columns: card | name | verdict | evidence | what they actually say (our words) | recommendation.

### Heat

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `sauna-after-endurance` | Rhonda Patrick | **TRACED** | FoundMyFitness, "Hyperthermic Conditioning" — https://www.foundmyfitness.com/episodes/hyperthermic-conditioning ; topic page https://www.foundmyfitness.com/topics/sauna | This is her signature piece. She walks through the same runner studies the card rests on — the ~32% improvement in run-to-exhaustion, the ~7% plasma-volume expansion, the reduced glycogen reliance — and frames sauna after a workout as heat acclimation you can buy without a training camp. | **Keep.** The best-earned credit in the heat block. |
| `sauna-after-endurance` | Jari Laukkanen | **RESEARCHER (lineage)** | Not an author of Scoon 2007, Stanley 2015, Kirby 2021 or Ahokas 2025 — the card's whole source set (Crossref author lists; Scoon = Scoon, Hopkins, Mayhew, Cotter). His own work is the Finnish KIHD cohort on sauna frequency and cardiovascular mortality, which this card does not use. | He teaches that frequent, hot, long sauna sessions track lower cardiovascular and all-cause death in Finnish men. That is a different practice from post-run heat acclimation. | **Remove** from this card. If the round wants him, he belongs on a sauna-frequency card that does not yet exist. |
| `sauna-recovery-low-heat` | Rhonda Patrick | **TRACED** | FoundMyFitness Q&A clip, "Does contrast therapy reduce the benefits of sauna?" — https://www.foundmyfitness.com/episodes/does-contrast-therapy-reduce-the-benefits-of-sauna-rhonda-patrick | She reports post-exercise infrared sauna improving jump height and peak power in female athletes, and separately that regular infrared raises capillary density in ageing muscle while leaving muscle size, strength and protein synthesis unchanged — exactly the card's "it helps you feel human, it does not add muscle". | **Keep.** |
| `sauna-recovery-low-heat` | Andrew Huberman | **TRACED (adjacent)** | Huberman Lab, "The Science & Health Benefits of Deliberate Heat Exposure" — https://www.hubermanlab.com/episode/the-science-and-health-benefits-of-deliberate-heat-exposure ; newsletter https://www.hubermanlab.com/newsletter/deliberate-heat-exposure-protocols-for-health-and-performance | He teaches sauna after a cardio or weights session, and a separate multi-round protocol aimed at growth hormone. Neither episode nor newsletter addresses next-day soreness or jump performance, which is what this card is about. | **Reword** to heat-after-training generally, or drop behind Patrick. |
| `sauna-recovery-low-heat` | Andy Galpin | **TRACED (adjacent)** | Huberman Lab Guest Series with Galpin, "Maximize Recovery to Achieve Fitness & Performance Goals" | Heat and cold sit inside his broader recovery framework, under sleep, nutrition and training load. He does not teach a 20-minute mild-heat post-lift protocol as such. | **Keep, rewritten** as a recovery-framework credit, or remove. |
| `sauna-rehydrate` | Rhonda Patrick | **TRACED** | FoundMyFitness topic page "Sauna", section *Hydration and electrolytes* — https://www.foundmyfitness.com/topics/sauna | She gives the same ~0.5 kg average fluid loss per session the card uses, tells people to drink before and after and to eat electrolyte-rich food, and singles out alcohol around sauna as genuinely dangerous. | **Keep.** Card and page agree on the number. |
| `sauna-rehydrate` | Jari Laukkanen | **RESEARCHER (lineage)** | Not an author of Podstawski 2014 (Podstawski, Boraczyński, Boraczyński, Choszcz, Mańkowski, Markowski) nor Kenttämies & Karkola 2008. | As above — his teaching is sauna frequency and cardiovascular risk, not fluid replacement. | **Remove.** |
| `heat-before-bed-gap` | Rhonda Patrick | **TRACED (exact)** | FoundMyFitness Q&A #47 clip, "How Evening Sauna Use May Support Sleep" — https://www.foundmyfitness.com/episodes/sauna-growth-hormone-sleep | She describes her own routine of a sauna or hot tub about two hours before bed, and says plainly that going to bed still overheated can do the opposite and disturb sleep — the card's practice, with a slightly longer gap than the card's ninety minutes. | **Keep, and list her first.** This is the person who actually teaches this. |
| `heat-before-bed-gap` | Andrew Huberman | **TRACED (adjacent)** — teaches a different rule | Huberman Lab heat episode and heat newsletter (above) | He teaches evening heat *because* of the post-sauna cooling effect, which is the card's mechanism. But he says the second half of the day works and that people can sauna even right before sleep — he teaches no gap at all, and on this point he and Patrick publicly disagree. | **Keep, reworded** to the cooling-effect teaching. Do not imply he endorses the ninety-minute gap. Worth a line in `findings.md`. |
| `infrared-counted-separately` | Rhonda Patrick | **TRACED** | FoundMyFitness "Sauna" topic page, infrared section and FAQ — https://www.foundmyfitness.com/topics/sauna | She separates infrared cabins (45–60 °C, radiant) from Finnish sauna, and her own FAQ answer says the infrared research base is limited and mostly clinical. That is the card's whole argument. | **Keep.** |
| `infrared-counted-separately` | Marc Cohen | **RESEARCHER (verified)** | Hussain J, **Cohen M**. 2018. *Clinical effects of regular dry sauna bathing: a systematic review.* DOI 10.1155/2018/1857413 — the card's own primary source. | Author of the review the card leans on, the one that says the evidence cannot yet separate infrared from Finnish sauna. He is also an Australian professor who writes publicly on bathing and heat, so the name does double duty. | **Keep.** Label as a researcher credit wherever the UI distinguishes them. |

### Sleep — the number, the ledger

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `sleep-need-calibration` | Peter Attia | **TRACED (adjacent)** | The Drive #221, "Understanding sleep and how to improve it" — https://peterattiamd.com/understanding-sleep/ ; AMA #2 with Matthew Walker | His sleep catalogue is largely his Matthew Walker series, covering how much sleep adults need, chronotype, and how rare genuine short sleepers are. He does not teach the alarm-free calibration method the card describes. | **Keep, reworded** to sleep need generally. |
| `sleep-need-calibration` | Andrew Huberman | **TRACED (adjacent)** | Newsletter "Improve Your Sleep" — https://www.hubermanlab.com/newsletter/improve-your-sleep ; guest series https://www.hubermanlab.com/episode/guest-series-dr-matthew-walker-the-biology-of-sleep-your-unique-sleep-needs | He teaches 7–9 hours as the adult range and says plainly some need six and others nine or ten. He gives no method for finding your own figure. | **Keep, reworded.** |
| `sleep-opportunity-tally` | Peter Attia | **TRACED (adjacent)** | The Drive, Matthew Walker series parts I–III; AMA #2 | He covers sleep debt, that it is not repaid on a weekend, and what chronic short sleep costs. The weekly written tally is not his. | **Keep, reworded.** |
| `sleep-opportunity-tally` | Andrew Huberman | **TRACED (adjacent)** | Newsletter "Your Top Questions on Sleep, Answered" — https://www.hubermanlab.com/newsletter/your-top-questions-on-sleep-answered | He teaches that lost sleep cannot be paid back later and that the body recovers only a fraction of it, and that people in irregular-hours jobs should bank sleep before a known loss. Same facts as the card, no tally. | **Keep, reworded.** |
| `sleep-opportunity-tally` | Colin Espie | **RESEARCHER (verified)** — and a genuine populariser | Espie CA et al. 2019, *JAMA Psychiatry* 76(1):21–30, DOI 10.1001/jamapsychiatry.2018.2745, listed in the card's own source row. He also founded Sleepio and writes on CBT-I for a general audience. | His trial is part of why the card can say CBT-I is the best-evidenced thing in the pillar. | **Keep.** One of the few names here that is both researcher and populariser. |

### Sleep — shift work, travel, the instrument

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `night-anchor-sleep` | Andrew Huberman | **TRACED (adjacent)** | "How to Defeat Jet Lag, Shift Work & Sleeplessness" — https://www.hubermanlab.com/episode/find-your-temperature-minimum-to-defeat-jetlag-shift-work-and-sleeplessness | His one rule of thumb for shift work is to hold a single schedule for at least fourteen days including weekends. Same instinct as the card — one thing that never moves — but not the four-hour anchor block. | **Keep, reworded** to schedule consistency. |
| `night-anchor-sleep` | Jim Waterhouse | **RESEARCHER (verified)** | Minors DS, **Waterhouse JM**. 1981. *Anchor sleep as a synchronizer of rhythms on abnormal routines.* PMID 7239725 — the card's primary source and the origin of the term. | The anchor-sleep idea is his. | **Keep.** |
| `night-shift-light` | Charmane Eastman | **RESEARCHER (verified)** | Crowley SJ, Lee C, Tseng CY, Fogg LF, **Eastman CI**. 2003, DOI 10.1177/0748730403258422 — the card's primary source. | Her laboratory built and tested the bright-light-plus-dark-glasses-plus-fixed-day-sleep package. | **Keep.** |
| `night-shift-light` | Diane Boivin | **RESEARCHER (verified)** | **Boivin DB**, James FO. 2002, DOI 10.1177/0748730402238238 — the card's supporting field trial in nurses. | Independent replication of the same package in real nurses. | **Keep.** |
| `night-shift-light` | Andrew Huberman | **TRACED (adjacent)** | Jet lag and shift work episode (above); newsletter https://www.hubermanlab.com/newsletter/using-light-for-health | His light rule is anchored on the body's temperature minimum — seek light while temperature is rising, avoid it while falling. He does not teach intermittent bright light through the first half of a shift. | **Keep, reworded** to "light is what moves the clock", or remove and let the two researchers carry it. |
| `dark-glasses-home` | Charmane Eastman | **RESEARCHER (verified)** | Crowley 2003 — the glasses were a randomised factor (2% vs 15% transmission). | As above. | **Keep.** |
| `dark-glasses-home` | Diane Boivin | **RESEARCHER (verified)** | Boivin & James 2002; Boivin, Boudreau & Tremblay 2012, DOI 10.3109/07420528.2012.675252. | Field trials in nurses and police officers used the glasses as part of the package. | **Keep.** |
| `dark-glasses-home` | Andrew Huberman | **TRACED** | Jet lag and shift work episode (above) | He says a night worker should wear sunglasses or otherwise avoid bright light before going to sleep — the card's practice, in his framing of an inverted schedule. | **Keep.** The best-supported Huberman credit in the shift-work block. |
| `no-drive-after-nights` | Charles Czeisler | **RESEARCHER (verified)** | Lee ML, Howard ME, Horrey WJ, Liang Y, Anderson C, Shreeve MS, O'Brien CS, **Czeisler CA**. 2016 *PNAS* 113(1):176–181, DOI 10.1073/pnas.1510383112 — senior author of the card's only source (full author list confirmed via Europe PMC). | The closed-track study is from his group, and he has spent a career putting drowsy driving and resident work hours in front of regulators. | **Keep.** |
| `no-drive-after-nights` | Andrew Huberman | **UNTRACED** | Searched his jet lag and shift work episode in full (no driving, crash, wheel or accident content anywhere in it), the light, sleep and fitness newsletters, and the open web for any Huberman teaching on driving home after a night shift. Nothing. | — | **Remove**, or replace with someone who does teach it. |
| `pre-nights-nap` | Andrew Huberman | **TRACED (adjacent)** | "Your Top Questions on Sleep, Answered" newsletter | He teaches banking sleep *before* an anticipated loss and names doctors and emergency responders as the case for it. Same idea as a prophylactic nap before the first night, at a coarser grain. | **Keep, reworded.** |
| `pre-nights-nap` | Peter Attia | **UNTRACED** | Searched The Drive's sleep catalogue, his public sleep material and the open web. Found sleep debt, chronotype and hygiene; nothing on a nap before a night shift. | — | **Remove.** |
| `on-shift-nap` | Leon Lack | **RESEARCHER (lineage)** | Not an author of Zion & Shochat 2019 or Hilditch 2016 (Hilditch, Centofanti, Dorrian, Banks — Crossref). The ten-versus-thirty-minute nap-duration literature the card's advice actually turns on is his (Brooks & Lack, Flinders). | The finding that a very short nap buys alertness without the fog is genuinely his lineage; the papers this card cites are other people's. | **Keep only if the round adds one of his own papers to the source row.** Otherwise replace with Hilditch or Shochat. |
| `on-shift-nap` | Andrew Huberman | **TRACED (adjacent)** | "Improve Your Sleep" newsletter | He teaches keeping naps to twenty or thirty minutes, no later than early-to-mid afternoon. Right duration, wrong part of the clock — the card's nap is at 03:30 on a night shift. | **Keep, reworded** to nap length, or remove. |
| `caffeine-on-nights` | Andrew Huberman | **TRACED (adjacent)** | "Improve Your Sleep" newsletter | His rule is front-load caffeine and take none within eight to ten hours of bed, with an explicit note that tolerance varies. The card's rule is dose-based at about seven hours, which is more generous than his. | **Keep, reworded.** Record in `findings.md` that the card is looser than the version listeners recognise. |
| `caffeine-on-nights` | Peter Attia | **TRACED (adjacent)** | The Drive #221 with Matthew Walker, which covers caffeine and sleep | Caffeine masks sleepiness rather than removing the need for sleep; timing matters. Nothing shift-specific. | **Keep, reworded**, or remove — the card would lose nothing. |
| `jet-lag-light-direction` | Charmane Eastman | **RESEARCHER (verified)** | **Eastman CI**, Burgess HJ. 2009. *How to travel the world without jet lag.* DOI 10.1016/j.jsmc.2009.02.006 — the card's primary source. | The direction-of-light schedules on the card are hers. | **Keep.** |
| `jet-lag-light-direction` | Andrew Huberman | **TRACED** | "How to Defeat Jet Lag, Shift Work & Sleeplessness" — https://www.hubermanlab.com/episode/find-your-temperature-minimum-to-defeat-jetlag-shift-work-and-sleeplessness | This is the episode that put the practice in front of a mass audience. He reduces it to one rule anchored on the temperature minimum — light while temperature is rising, none while it is falling — and teaches that eastward is the harder direction. Both are on the card. | **Keep.** After the cold newsletter, the strongest Huberman credit in the round. |
| `jet-lag-light-direction` | Peter Attia | **UNTRACED** | Searched his sleep catalogue and the open web for Attia on jet lag or timed light after flights. Nothing found. | — | **Remove.** |
| `tracker-stages-are-estimates` | Marco Altini | **TRACED (exact)** | Marco Altini's Substack — https://marcoaltini.substack.com/p/wearables-and-sleep-time and https://marcoaltini.substack.com/p/q-and-a-how-do-you-track-sleep | He teaches precisely this card: sleep-versus-wake classification from a wearable is trustworthy, per-night stage estimates are not useful at the individual level, and he logs his own sleep time by glancing at the clock rather than pretending a device is precise. | **Keep, and list him first.** The most exactly-earned credit anywhere in this round. |
| `tracker-stages-are-estimates` | Andrew Huberman | **TRACED (adjacent)** | "Improve Your Sleep" newsletter | Wearables appear mainly as a way to set a sleep-efficiency target of about 85%. He does not teach scepticism about stage scoring. | **Keep, reworded**, or remove. |
| `tracker-stages-are-estimates` | Peter Attia | **TRACED (adjacent)** — with a contradiction | Shawn Ryan Show #181, transcript read at https://podcasts.happyscribe.com/shawn-ryan-show/181-peter-attia-the-science-of-longevity-nutrition-myths-and-medicine-3 | In that conversation he describes tracking devices as measuring how you slept, staging included, with reasonable accuracy — the opposite of what this card teaches. He is a heavy wearable user and talks about them often, but not as an instrument to distrust. | **Remove, or reword with care.** Putting his name beside "stages are a slot machine" attaches him to a caution he has not given. |

### Cold

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `cold-on-non-lifting-days` | Andrew Huberman | **TRACED (exact)** | Newsletter, "The Science & Use of Cold Exposure for Health & Performance" — https://www.hubermanlab.com/newsletter/the-science-and-use-of-cold-exposure-for-health-and-performance | He states the interference effect directly: cold water immersion within about four hours of training limits strength, size and endurance gains, so wait six to eight hours or more, or plunge before training — unless the goal is recovery without adaptation. That is this card, almost line for line. | **Keep, list him first.** |
| `cold-on-non-lifting-days` | Llion Roberts | **RESEARCHER (verified)** | **Roberts LA** et al. 2015, *J Physiol* 593(18):4285–4301, DOI 10.1113/JP270570 — first author of the card's primary source. | The twelve-week trial that established the interference effect is his. | **Keep.** |
| `cold-on-non-lifting-days` | Andy Galpin | **TRACED** | Huberman Lab Guest Series hypertrophy episode — https://www.hubermanlab.com/episode/dr-andy-galpin-optimal-protocols-to-build-strength-and-grow-muscles ; his own Q&A archive at https://ask.andygalpin.com (clip: cold exposure and hypertrophy) | He teaches not to put cold immediately after a hypertrophy session because it blunts the growth signal, and to leave roughly four hours or move it off the day entirely. | **Keep.** |
| `cold-for-tomorrow` | Peter Attia | **TRACED** | The Drive AMA #47 / episode #254, "Cold therapy: pros, cons, and its impact on longevity" — https://peterattiamd.com/cold-therapy/ (the article itself is member-only; the AMA is listed publicly) | He teaches cold for soreness and recovery while being explicit that it can cost hypertrophy and that nothing shows it extends life — the trade-off framing this card uses. | **Keep.** |
| `cold-for-tomorrow` | Jonathan Peake | **RESEARCHER (lineage)** | Not an author of Bleakley 2012 (Bleakley, McDonough, Gardner, Baxter, Hopkins, Davison) or Moore 2022 (Moore, Fuller, Buckley, Saunders, Halson, Broatch) — Crossref author lists. He is a genuine authority on cold-water immersion and inflammation, but on other papers. | — | **Replace with Shona Halson**, an author of the card's own meta-analysis, Australian, and a public voice on recovery. Or keep Peake and put one of his papers in the source row. |
| `cold-for-tomorrow` | Andy Galpin | **TRACED (adjacent)** | Galpin hypertrophy and recovery material (above) | The same trade-off from the other side: cold is the tool for when tomorrow's performance matters more than this session's adaptation. | **Keep.** |
| `sauna-then-cold` | Rhonda Patrick | **TRACED** | FoundMyFitness Q&A, "Does contrast therapy reduce the benefits of sauna?" — https://www.foundmyfitness.com/episodes/does-contrast-therapy-reduce-the-benefits-of-sauna-rhonda-patrick | She answers a listener asking about cold showers between sauna rounds, notes the small studies that ran sauna, then cold, then sauna and still measured some effects, and is careful not to claim more. | **Keep.** |
| `sauna-then-cold` | Andrew Huberman | **TRACED** | Cold exposure newsletter (above); episode with Susanna Søberg — https://www.hubermanlab.com/episode/dr-susanna-soberg-how-to-use-cold-and-heat-exposure-to-improve-your-health | He popularised "end with cold", naming it after Søberg's work, and teaches letting the body rewarm on its own rather than towelling off. This is the practice the card grades E. | **Keep**, and say in copy that the card and the popular version diverge on how much is settled. |
| `sauna-then-cold` | Tim Ferriss | **TRACED** | The Tim Ferriss Show with Andy Galpin (Jan 2024), transcript — https://tim.blog/2024/01/20/andy-galpin-transcript/ | He describes his own routine on air: a hot round of fifteen to twenty minutes, a few minutes in the cold plunge, a shorter second heat round, cold again, usually early evening. Exactly the ritual this card is written for. | **Keep.** |

### Longevity

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `strength-minimum-weekly` | Peter Attia | **TRACED** | Shawn Ryan Show #181 transcript (above); the "Centenarian Decathlon" framing in *Outlive* | He teaches that muscle mass and strength decide the last decade, that nobody in their final years wishes they had less muscle, and he lifts three times a week himself. His own prescription is far larger than the card's floor. | **Keep.** Note that the card is a floor and his teaching is a programme. |
| `strength-minimum-weekly` | Rhonda Patrick | **TRACED** | FoundMyFitness topic page, "Muscle Power" — https://www.foundmyfitness.com/topics/muscle-power | She covers resistance training and all-cause mortality with a weekly-minutes dose-response. Her headline band is 90–119 minutes a week, with the association plateauing around 120 — noticeably above the card's 30–60. | **Keep.** Record the discrepancy: a reader who knows her figure will find the card's floor surprisingly low. |
| `strength-minimum-weekly` | Andy Galpin | **TRACED** | *Perform with Dr Andy Galpin*, "Why Muscle Matters & How to Build It" — https://podcasts.happyscribe.com/perform-with-dr-andy-galpin/why-muscle-matters-how-to-build-it | He argues skeletal muscle is the organ that predicts everything else, gives a minimum-frequency rule (work each muscle group every 72 hours; even once a week grows muscle), and says the mortality association keeps improving with more strength rather than plateauing. | **Keep.** |
| `desk-day-offset` | Peter Attia | **TRACED (adjacent)** | Shawn Ryan #181; his zone 2 and VO2 max material | He teaches structured cardio volume for longevity. He does not teach the sitting-offset practice or the standing-desk caveat. | **Keep, reworded**, or remove. |
| `desk-day-offset` | Andrew Huberman | **UNTRACED** | Searched the Foundational Fitness Protocol newsletter (nothing on sitting, sedentary time or desks beyond "get outside at midday"), the fitness topic page, and the sleep and light newsletters. | — | **Remove.** |
| `desk-day-offset` | Rhonda Patrick | **TRACED** | FoundMyFitness topic page, "Exercise Snacks" — https://www.foundmyfitness.com/topics/exercise-snacks | She teaches breaking a long sitting day with short repeated bouts, and reports a crossover in which ten three-minute walks through eight and a half hours of sitting beat one continuous thirty-minute walk for glucose control. | **Keep, list her first.** Note the divergence: her evidence favours breaking movement up, the card lets you bank it in one go. |
| `protein-after-sixty-five` | Peter Attia | **TRACED** | Shawn Ryan Show #181 transcript (above) | Adequate protein and adequate calories are the two pillars he names; sarcopenia and osteopenia are what he is trying to prevent. Protein for later life is one of his most repeated themes. | **Keep.** |
| `protein-after-sixty-five` | Stuart Phillips | **RESEARCHER (verified)** | Co-author of PROT-AGE (Bauer 2013, DOI 10.1016/j.jamda.2013.05.021) and senior author of Morton 2018 (DOI 10.1136/bjsports-2017-097608) — both in the card's source row. | Both the target on the card and the protein-plus-lifting finding beside it are his work. | **Keep.** |
| `protein-after-sixty-five` | Layne Norton | **TRACED** | *Dr Layne Norton Podcast*, "Protein Deep Dive" (ep. 29) — https://biolayne.com/podcasts/dr-layne-norton-podcast/protein-deep-dive-episode-29/ ; "Protein Masterclass" with Donald Layman (ep. 4) | He teaches the anabolic-resistance argument the card rests on: older muscle needs a bigger per-meal protein and leucine dose to trigger the same response — roughly 65% more leucine at 68 than at 28. That is why the card says "at every meal". | **Keep.** |

---

## C. MONEY ROUND AUDIT — 25 cards, 60 credits

The money round did much better than the recovery round, because it built
an attribution table as it went (`money/ledgers/behaviour.md`, section
"Popularised by / Where"). Four Rational Reminder episodes (232, 256, 288,
300) and Tim Ferriss #371 were re-opened for this audit and all check out.

Two problems are structural rather than per-name, and they are the
headline findings:

1. **Twelve of the twenty-five cards carry no person at all** — only
   institutions. The whole Australian-calendar block (super, receipts,
   offset, insurance, HELP, overtime, bills, round-ups) reads
   *Moneysmart (ASIC) · Australian Taxation Office*, which is accurate and
   recognises nobody. Scott Pape — the roster's "single most relevant
   money voice for this audience" — is credited five times and teaches at
   least four more of these cards publicly.
2. **Ben Felix is credited four times for hosting, not teaching.** In
   every case the practice belongs to that episode's guest (Hershfield,
   Sussman, Rick, Lusardi), and the roster is explicit that attribution
   follows the guest. See the four rows below.

| Card | Name | Verdict | Evidence | What they actually say | Recommendation |
|---|---|---|---|---|---|
| `refund-precommit` | Stephen Roll | **RESEARCHER (verified)** | First author, Roll, Grinstein-Weiss, Gallagher & Cryder 2020, *J Econ Behav Organ* 180:357–380, DOI 10.1016/j.jebo.2020.10.011 — the card's primary source. | The tax-time pre-commitment trial is his. | **Keep** as a researcher credit. |
| `refund-precommit` | Michal Grinstein-Weiss | **RESEARCHER (verified)** | Second author of the same paper; she runs the research programme the trial sat inside. | As above. | **Keep.** |
| `refund-precommit` | Moneysmart (ASIC) | **INSTITUTION** | moneysmart.gov.au lodging-a-tax-return page, opened by the round 18 Jun 2026. | Regulator guidance on lodging, not a teaching about pre-committing a refund. | **Keep**, but see section D — this card has no recognisable name on it. |
| `fresh-start-date` | Katy Milkman | **RESEARCHER (verified)** *and* **TRACED** | Author of Beshears, Dai, Milkman & Benartzi 2021, DOI 10.1016/j.obhdp.2021.06.005 — the card's primary source. Also *How to Change* (2021) and the Choiceology podcast, where fresh starts are a signature topic. | She both ran the trial and is the person who put "fresh start effect" into general circulation. | **Keep, list her first.** The only credit on this card a normal reader might recognise. |
| `fresh-start-date` | Hengchen Dai | **RESEARCHER (verified)** | Co-author of the 2021 trial and of Dai, Milkman & Riis 2014, DOI 10.1287/mnsc.2014.1901, the archival fresh-start paper. | The effect is hers and Milkman's jointly. | **Keep.** |
| `fresh-start-date` | John Beshears | **RESEARCHER (verified)** | First author of the 2021 trial; also first author of the 12%-default paper the card uses to justify keeping the step small. | Both halves of the card's advice trace to his papers. | **Keep.** |
| `fresh-start-date` | Shlomo Benartzi | **RESEARCHER (verified)** *and* **TRACED** | Co-author of the 2021 trial; co-author of Save More Tomorrow (Thaler & Benartzi 2004); his TED talk on saving for tomorrow is one of the most-watched pieces of behavioural-finance teaching there is. | Escalate-later is the idea he popularised. | **Keep.** |
| `per-day-framing` | Hal Hershfield | **TRACED (exact)** *and* **RESEARCHER (verified)** | Rational Reminder 256, "Your Future Self" (8 Jun 2023) — https://rationalreminder.ca/podcast/256 ; paper: Hershfield, Shu & Benartzi 2020, DOI 10.1287/mksc.2019.1177 | On that episode he explains the intervention in his own words: the identical automatic-savings offer framed as a few dollars a day rather than a larger monthly figure, and why the daily unit feels affordable when the monthly one does not. | **Keep, list him first.** |
| `per-day-framing` | Shlomo Benartzi | **RESEARCHER (verified)** | Co-author of the same paper. | As above. | **Keep.** |
| `per-day-framing` | Ben Felix | **TRACED (adjacent)** — host, not teacher | RR 256: Felix is the interviewer; Hershfield is the one describing the finding. Nothing located where Felix teaches per-day framing himself. | He asks the questions. | **Remove.** The roster's own rule sends this credit to the guest, who is already on the card. |
| `day-after-payday-glance` | Benjamin Harkin | **RESEARCHER (verified)** | First author, Harkin et al. 2016, *Psychol Bull* 142(2), DOI 10.1037/bul0000025 — the 138-trial monitoring meta-analysis the card rests on. | The finding that recorded monitoring beats unrecorded is his meta-analysis. | **Keep.** Not a public communicator; label it. |
| `day-after-payday-glance` | Antonio Gargano | **RESEARCHER (verified)** | Co-author, Gargano & Rossi 2024, *J Finance* 79(3):1931–1976, DOI 10.1111/jofi.13339. | The in-app goal-visibility result is theirs. | **Keep.** |
| `day-after-payday-glance` | Alberto Rossi | **RESEARCHER (verified)** | Co-author of the same paper. | As above. | **Keep.** |
| `two-thousand-first` | Scott Pape | **TRACED** | Barefoot Steps, Step 6 "Boost Mojo" — https://www.barefootinvestor.com/barefoot-steps/step-6-boost-mojo ; Q&A "Mojo or Offset?" — https://www.barefootinvestor.com/articles/qna/mojo-or-offset | Mojo is his name for safety money held deliberately away from day-to-day banking, built in steps, and he argues the point of it is being able to reach it when life goes wrong. That is this card's ladder. | **Keep, list him first.** |
| `two-thousand-first` | Annamaria Lusardi | **RESEARCHER (verified)** *and* **TRACED** | Lusardi, Schneider & Tufano 2011, *Financially Fragile Households*, NBER WP 17072 — the source of the "could you raise $2,000" measure. Also Rational Reminder 232 (22 Dec 2022) — https://rationalreminder.ca/podcast/232 | The $2,000-in-a-month question the ABS now asks Australians is hers; on RR 232 she teaches financial fragility to a general audience. | **Keep.** |
| `two-thousand-first` | Moneysmart (ASIC) | **INSTITUTION** | moneysmart.gov.au emergency-fund page (opened by the round). | Three months as a target. | **Keep.** |
| `two-thousand-first` | Ben Felix | **TRACED (adjacent)** | He does teach emergency-fund sizing publicly (three-to-six months, and the cash-versus-invest question), but nothing on a $2,000-first ladder, which is built on an Australian survey threshold he has no connection to. | — | **Remove or reword.** With Pape and Lusardi on the card it adds nothing. |
| `two-accounts-one-label` | Scott Pape | **TRACED** | Barefoot buckets — https://www.barefootinvestor.com/barefoot-steps/step-2-set-up-buckets/ | Blow, Mojo, Grow: separate named accounts, with the safety money deliberately at a different bank. His own site says the percentage splits do not really matter, which is why the card says the same. | **Keep.** |
| `two-accounts-one-label` | Richard Thaler | **RESEARCHER (verified)** *and* **TRACED** | Thaler 1985, DOI 10.1287/mksc.4.3.199 and Thaler 1999 — the card's theory base. Also *Nudge* and *Misbehaving* for a general audience. | Mental accounting is his. | **Keep.** |
| `two-accounts-one-label` | Abigail Sussman | **RESEARCHER (verified)** *and* **TRACED** | Sussman & O'Brien 2016, DOI 10.1509/jmr.14.0455 (the card's earmarking-downside source); Rational Reminder 300 (11 Apr 2024) — https://rationalreminder.ca/podcast/300, where she is the guest teaching her own work. | The "too many sacred labels make people borrow instead" caution on the card is hers. | **Keep.** |
| `two-accounts-one-label` | Ramit Sethi | **TRACED** | *I Will Teach You to Be Rich*; The Tim Ferriss Show #371, "Automating Finances" — https://tim.blog/2019/05/07/ramit-sethi/ (show notes list sub-accounts and why some parts of life should not have a budget). | Sub-accounts with names, and money moving between them automatically on pay day, is the core of his system. | **Keep.** |
| `two-accounts-one-label` | Moneysmart (ASIC) | **INSTITUTION** | moneysmart.gov.au managing-on-a-casual-income page (opened 30 Jul 2026). | Separate accounts for spending, bills and savings. | **Keep.** Five names is a lot for one card; consider trimming to Pape, Thaler, Sethi. |
| `future-self-ten-minutes` | Hal Hershfield | **TRACED (exact)** | Rational Reminder 256 — https://rationalreminder.ca/podcast/256 ; book *Your Future Self* (2023) | On that episode he describes the letter-writing task specifically: people who write to their future self behave differently afterwards, and newer work has them write the reply back as well. The card's practice is his, almost exactly — and the reply-letter variant is a free improvement the card could take. | **Keep.** |
| `future-self-ten-minutes` | Ben Felix | **TRACED (adjacent)** — host, not teacher | RR 256, as above. | — | **Remove.** |
| `super-four-settings` | Productivity Commission | **INSTITUTION** | PC Inquiry Report 91 (2018) — the duplicate-account and duplicate-fee finding on the card. | — | **Keep.** |
| `super-four-settings` | Moneysmart (ASIC) / Australian Taxation Office | **INSTITUTION** | Regulator and revenue-office pages. | — | **Keep.** |
| `super-four-settings` | *(no person credited)* | **MISSING** | See section D: Scott Pape teaches all four settings on his own site. | — | **Add Scott Pape.** |
| `super-before-june` | Moneysmart (ASIC) / Australian Taxation Office | **INSTITUTION** | Rules of the system. | — | **Keep.** |
| `receipts-as-you-go` | Australian Taxation Office / Moneysmart (ASIC) | **INSTITUTION** | ATO record-keeping pages (marked UNVERIFIED 403 in the round's own ledger; re-checkable per `corpus/SOURCES.md`, which says ato.gov.au 403s are a user-agent block). | — | **Keep**, and re-verify the ATO pages with a browser user-agent. |
| `offset-is-linked` | Moneysmart (ASIC) | **INSTITUTION** | moneysmart.gov.au mortgage-offset-accounts page (opened 28 Jul 2026), including the ASIC finding that some lenders had not linked the accounts. | — | **Keep.** |
| `offset-is-linked` | *(no person credited)* | **MISSING** | Scott Pape, "Mojo or Offset?" — https://www.barefootinvestor.com/articles/qna/mojo-or-offset ; Step 7, "Get the Banker Off Your Back" — https://www.barefootinvestor.com/barefoot-steps/step-7-banker-off-back | He teaches offsets against a mortgage and where the safety money should sit relative to one. Not the "check the link is live" step, but he is the reason an Australian reader knows what an offset is. | **Add Scott Pape**, worded as offsets generally. |
| `cover-inventory` | Moneysmart (ASIC) / Productivity Commission | **INSTITUTION** | MoneySmart life-cover, TPD, income-protection and insurance-through-super pages; PC Report 91. | — | **Keep.** |
| `cover-inventory` | *(no person credited)* | **MISSING** | Scott Pape's insurance guide — https://www.barefootinvestor.com/insurance | He teaches holding life, TPD and income-protection cover inside super so premiums come out of the balance rather than the pay packet, which is exactly what this card asks people to go and look at. | **Add Scott Pape.** The strongest single missing credit in the round. |
| `hardship-number-known` | Moneysmart (ASIC) | **INSTITUTION** | ASIC credit FAQs (National Credit Code s72, 21-day response) and MoneySmart hardship pages. | — | **Keep.** |
| `hardship-number-known` | Financial Counselling Australia | **INSTITUTION** | financialcounsellingaustralia.org.au; ndh.org.au. | The two-thirds resolution figure is their own client survey. | **Keep.** Appropriate: this card is a signpost to a service, and the service is the right credit. |
| `help-in-the-picture` | Australian Taxation Office / Moneysmart (ASIC) | **INSTITUTION** | ATO study-and-training-loan pages (UNVERIFIED 403 in the round's ledger). | — | **Keep**; re-verify the ATO pages. |
| `overtime-to-the-transfer` | Moneysmart (ASIC) | **INSTITUTION** | MoneySmart managing-on-a-casual-income page. | Save in the higher-earning weeks for the lower ones. | **Keep.** |
| `bill-smoothing` | Moneysmart (ASIC) | **INSTITUTION** | Same page. | Ask providers for fortnightly or monthly payments instead of a quarterly lump. | **Keep.** |
| `money-worry-to-paper` | Michael Scullin | **RESEARCHER (verified)** | First author, Scullin et al. 2018, *J Exp Psychol Gen* 147(1):139–146, DOI 10.1037/xge0000374 — the card's only source and its only credit. | The bedtime to-do-list polysomnography trial is his. | **Keep** — but this card carries one name and that name is a laboratory psychologist. See section D. |
| `shared-money-agreement` | Jenny Olson | **RESEARCHER (verified)** | First author, Olson, Rick, Small, Finkel, Cotte & Ratner 2023, *J Consum Res* 50(4):704–721, DOI 10.1093/jcr/ucad020 — the card's primary source. | The two-year randomised joint-account trial is hers. | **Keep.** |
| `shared-money-agreement` | Scott Rick | **RESEARCHER (verified)** *and* **TRACED** | Co-author of the same trial; Rational Reminder 288 — https://rationalreminder.ca/podcast/288, where he is the guest, and his book on tightwads and spendthrifts is written for a general audience. | On RR 288 he walks through his own four-question spender/saver measure and what it does to couples. | **Keep.** |
| `shared-money-agreement` | Ramit Sethi | **TRACED** | His couples material (iwillteachyoutoberich.com couples pages, opened by the round) and *Money for Couples*. | A shared hub plus an agreed no-questions amount each is his version of this, and it is the version on the card. | **Keep.** |
| `shared-money-agreement` | Ben Felix | **TRACED (adjacent)** — host, not teacher | RR 288, as above. | — | **Remove.** |
| `money-date` | Scott Pape | **TRACED** | "Barefoot Date Night" — his own named practice, on barefootinvestor.com. | A monthly conversation about money over something nice to drink is literally his ritual; the card is a restatement of it. | **Keep, list him first.** |
| `money-date` | Ramit Sethi | **TRACED** | His monthly money meeting for couples (iwillteachyoutoberich.com, opened by the round). | Same practice, with an agenda. | **Keep.** |
| `pay-yourself-a-salary` | Ramit Sethi | **TRACED (adjacent)** | Ferriss #371 (above); his automation system. | He teaches automating a salary *into* buckets. The holding-account-then-salary version for lumpy income is not his framing — that belongs to the small-business literature (Mike Michalowicz's *Profit First* is the popular source). | **Keep, reworded**, or replace. |
| `pay-yourself-a-salary` | Scott Pape | **TRACED (adjacent)** | Barefoot buckets (above). | The bucket structure is his; the low-month salary rule is not stated on his pages. | **Keep, reworded.** |
| `pay-yourself-a-salary` | Moneysmart (ASIC) | **INSTITUTION** | Managing-on-a-casual-income page. | — | **Keep.** |
| `tax-set-aside` | Australian Taxation Office | **INSTITUTION** | PAYG-instalment and GST pages (UNVERIFIED 403 in the round's ledger). | — | **Keep**; re-verify. |
| `tax-set-aside` | Scott Pape | **TRACED (adjacent)** | The round's own ledger cites him with no URL ("Scott Pape; every accountant"). He writes for small business and sole traders, but no page teaching same-day tax quarantining was located. | — | **Keep only with a URL in the source row**, otherwise remove. This is the one money credit that is currently as unevidenced as the recovery round's. |
| `latte-maths-retired` | Ramit Sethi | **TRACED (exact)** | *I Will Teach You to Be Rich*; his standing public argument that people should stop asking small-dollar questions and start asking large ones. | Mocking latte arithmetic and redirecting attention to the few large recurring costs is one of his defining public positions — this card is his argument. | **Keep, list him first.** |
| `latte-maths-retired` | Abigail Sussman | **RESEARCHER (verified)** | Sussman & Alter 2012, *The exception is the rule*, DOI 10.1086/665833 — the card's source for people under-estimating exceptional spending. | The finding that replaces the latte is hers. | **Keep.** |
| `tracking-is-a-mirror` | Moneysmart (ASIC) | **INSTITUTION** | MoneySmart how-to-do-a-budget (five steps ending in a pay-day transfer) and track-your-spending pages. | The regulator's own budget ends in automation, which is the card's point. | **Keep.** |
| `tracking-is-a-mirror` | Ramit Sethi | **TRACED** | Ferriss #371 show notes — https://tim.blog/2019/05/07/ramit-sethi/ — include why some parts of life should not have a budget. | His position is that budgets fail and systems do not; track to notice, automate to save. | **Keep.** |
| `willpower-retired` | Richard Thaler | **RESEARCHER (verified)** *and* **TRACED** | Thaler & Benartzi 2004, *Save More Tomorrow*, DOI 10.1086/380085 — the card's replacement evidence; *Nudge* for the general audience. | Defaults and pre-commitment instead of self-control is the argument he made famous. | **Keep.** |
| `willpower-retired` | Shlomo Benartzi | **RESEARCHER (verified)** *and* **TRACED** | Same paper; his TED talk on saving tomorrow. | As above. | **Keep.** |
| `willpower-retired` | Ramit Sethi | **TRACED (exact)** | Ferriss #371, "Automating Finances" — https://tim.blog/2019/05/07/ramit-sethi/ ; the episode notes describe using systems to remove decisions rather than relying on discipline. | "A decision you keep having to win is one you have not automated" is his thesis in a sentence. | **Keep.** |
| `round-ups-are-a-starter` | Moneysmart (ASIC) | **INSTITUTION** | MoneySmart micro-investing page (opened 5 Aug 2026): fees weigh more on small balances, some providers hold the assets, switching can force a sale, round-ups can start a habit. | Every claim on the card comes from this page. | **Keep.** Appropriate as the only credit — the card is a regulator-guidance card. |

---

## D. MISSING CREDITS — where a well-known communicator demonstrably teaches the practice and is not on the card

This is the upside of the audit. Every one of these was read at the URL
given.

### Recovery round

| Card | Add | Evidence | What they teach |
|---|---|---|---|
| `sauna-rehydrate` | **Andrew Huberman** | Newsletter, "Deliberate Heat Exposure Protocols for Health and Performance" — https://www.hubermanlab.com/newsletter/deliberate-heat-exposure-protocols-for-health-and-performance | He gives a fluid-replacement rule by the clock: roughly a pint of water for every ten minutes in the sauna. Worth noting the divergence — that is about twice the measured loss the card is built on, so the card is the more accurate of the two. |
| `sauna-rehydrate` | **Andy Galpin** | The Tim Ferriss Show, Jan 2024 — https://tim.blog/2024/01/20/andy-galpin-transcript/ | He teaches a do-it-yourself sweat-rate test (weigh yourself dry before and after a thirty-minute sauna) and, more importantly, that replacing sweat with plain water alone can backfire — what goes back in has to roughly match what came out. The card currently says plain water covers it. |
| `sleep-need-calibration` | **Matthew Walker** | Huberman Lab guest series — https://www.hubermanlab.com/episode/guest-series-dr-matthew-walker-the-biology-of-sleep-your-unique-sleep-needs ; The Drive #221 — https://peterattiamd.com/understanding-sleep/ | The episode is literally about working out your own sleep need rather than assuming eight hours. Both of the communicators currently credited on this card are, on this topic, relaying him. See the named-risk flag in section E. |
| `no-drive-after-nights` | **Matthew Walker** | *Why We Sleep*, and his repeated public teaching on microsleeps and drowsy driving | He is the person who put "drowsy driving is worse than drunk driving" and the microsleep mechanism into general circulation. Grade stays with the Czeisler paper already on the card, which is exactly the roster's condition for using Walker at all. |
| `sauna-then-cold` | **Susanna Søberg** | Huberman Lab — https://www.hubermanlab.com/episode/dr-susanna-soberg-how-to-use-cold-and-heat-exposure-to-improve-your-health | "End with cold" is her principle by name, and her 2021 study of winter swimmers is already the nearest thing to evidence in the card's own source row. Crediting Huberman for it and not her is backwards. |
| `cold-for-tomorrow` | **Andrew Huberman** | Cold exposure newsletter — https://www.hubermanlab.com/newsletter/the-science-and-use-of-cold-exposure-for-health-and-performance | The card's exact trade-off is in his newsletter: cold after training is fine when the goal is recovery rather than adaptation, i.e. competition mode. He is credited on the sibling card and not on this one. |
| `cold-for-tomorrow` | **Shona Halson** | Co-author of Moore et al. 2022, *Sports Medicine* 52(7):1667–1688, DOI 10.1007/s40279-022-01644-9 — the card's own meta-analysis | An Australian recovery scientist who speaks publicly on cold water immersion, and unlike Jonathan Peake she is actually on the paper. Straight swap. |
| `protein-after-sixty-five` | **Eric Helms** (roster Tier 2) or **Brad Schoenfeld** | Both are co-authors of Morton et al. 2018, DOI 10.1136/bjsports-2017-097608, the protein-plus-lifting meta-analysis in the card's source row (Crossref author list). | Helms is already on the roster and is one of the most-followed evidence-based training educators. A roster name is sitting inside the card's own citation, uncredited. |
| `desk-day-offset` | *(nothing to add)* | — | Rhonda Patrick is the only communicator located who teaches this practice; she is already credited, and should lead. |

### Money round

| Card | Add | Evidence | What they teach |
|---|---|---|---|
| `super-four-settings` | **Scott Pape** | https://www.barefootinvestor.com/articles/category/Superannuation | Consolidating duplicate accounts, a hard fee ceiling, checking which investment option you are in, and what the insurance inside the fund is costing — the four settings on this card, taught by the most-read money writer in Australia. Currently the card credits three government agencies and no one. |
| `cover-inventory` | **Scott Pape** | https://www.barefootinvestor.com/insurance | He teaches holding life, TPD and income-protection cover inside super so the premiums come from the balance rather than the pay packet, and knowing what you actually hold. This is the card. |
| `offset-is-linked` | **Scott Pape** | https://www.barefootinvestor.com/articles/qna/mojo-or-offset ; Step 7 — https://www.barefootinvestor.com/barefoot-steps/step-7-banker-off-back | He is the reason most Australian readers know what an offset account is and where the safety money should sit relative to one. He does not teach the "check the link" step, so word the credit to offsets generally. |
| `money-worry-to-paper` | **Cal Newport** (roster Tier 2) | *Deep Work*, the shutdown ritual; his own site and *Deep Questions* podcast | His end-of-day ritual is precisely this card's mechanism: write the next action for anything unresolved so the mind can stop rehearsing it, then close the day deliberately. It also gives the card a second name beside a laboratory psychologist. |
| `two-thousand-first` or `willpower-retired` | **Morgan Housel** | *The Psychology of Money* (2020); The Tim Ferriss Show #576 — https://tim.blog/2022/03/01/morgan-housel-the-psychology-of-money/ | Saving without a specific reason, and room for error as the point of a buffer, is his best-known argument. He is on the roster, he is in the money round's own discovery ledger, and he is credited nowhere. |
| `pay-yourself-a-salary` | **Mike Michalowicz** *(not on the roster — flagging for Isaac)* | *Profit First* | The holding-account-then-fixed-salary practice on this card is his, not Sethi's or Pape's. If the round wants a real credit here rather than an adjacent one, this is the name. |

---

## E. NAMED-RISK FLAGS

Per `COMMUNICATORS.md`, "Handle with care".

**David Sinclair — clear.** No Sinclair credit appears anywhere in either
round. The recovery round has seven longevity cards and none names him.
The policy ("do not add new Sinclair attributions in longevity or
supplements") is being followed.

**Jordan Peterson — clear.** No Peterson credit in either round, so the
"never the only name on a card" rule is not engaged.

**Tony Robbins — clear.** No Robbins credit in either round. Note the money
round explicitly records "no Ramsey attribution anywhere" as well, which is
the same instinct applied to a name the roster does not list.

**Matthew Walker — flag, and it points the other way.** He has **zero**
credits across both rounds. The roster says his existing three library
credits are "about right", so this is not a breach — but the recovery
round wrote **twelve sleep cards** while crediting Huberman sixteen times
and Attia ten, and on several of those cards what Huberman and Attia are
publicly relaying is Walker's guest series on their own shows. Two
specific additions are defensible under the roster's own condition, that
anything tracing to his popular book is verified against primary
literature:
- `sleep-need-calibration` — the Huberman guest-series episode is
  explicitly about determining your own sleep need. The card's grade rests
  on Kitamura 2016, not on his book.
- `no-drive-after-nights` — he is the popular voice on microsleeps and
  drowsy driving; the card's grade rests on the Czeisler PNAS study.
That would take him from three library credits to five. **Isaac's call**,
not the round's.

**Anyone selling the thing they describe** — two worth noting, neither
disqualifying:
- **Ben Felix** and his co-host are licensed advisers at a fee-based firm.
  The money round's own ledger says so. The four Felix credits should come
  off for the host-versus-guest reason anyway, which resolves this too.
- **Scott Pape** sells books and a paid newsletter and has historically
  named specific bank products on his site. The money round already
  handled this correctly — attribute the structure, never his product
  picks — and the three additions proposed in section D keep to that.

**One risk the roster does not name, and should.** Four recovery credits
are *RESEARCHER (lineage)*: a scientist credited on a card that cites none
of their work. Laukkanen ×2, Leon Lack, Jonathan Peake. This is a quieter
failure than a false populariser credit but it is the same failure — the
name is doing recognition work the evidence does not support — and it is
harder to spot because the person really is an authority on the topic. A
one-line rule would fix it: *a researcher credit requires that person on
the author list of a source in that card's row.*

---

## F. EPISODE INDEX

Everything actually opened for this audit. This is the artefact the
recovery round should have produced.

### Recovery

| Show / site | Guest or author | URL | Bears on |
|---|---|---|---|
| FoundMyFitness topic page | Rhonda Patrick | https://www.foundmyfitness.com/topics/sauna | `sauna-after-endurance`, `sauna-rehydrate`, `infrared-counted-separately` |
| FoundMyFitness | Rhonda Patrick, "Hyperthermic Conditioning" | https://www.foundmyfitness.com/episodes/hyperthermic-conditioning | `sauna-after-endurance` |
| FoundMyFitness Q&A | Rhonda Patrick, "Does contrast therapy reduce the benefits of sauna?" | https://www.foundmyfitness.com/episodes/does-contrast-therapy-reduce-the-benefits-of-sauna-rhonda-patrick | `sauna-recovery-low-heat`, `sauna-then-cold` |
| FoundMyFitness Q&A #47 clip | Rhonda Patrick, "How Evening Sauna Use May Support Sleep" | https://www.foundmyfitness.com/episodes/sauna-growth-hormone-sleep | `heat-before-bed-gap` |
| FoundMyFitness | Ashley Mason (sauna, depression, insomnia) | https://www.foundmyfitness.com/episodes/ashley-mason | `heat-before-bed-gap` (checked; no timing teaching), `sleep-opportunity-tally` background |
| FoundMyFitness topic page | Rhonda Patrick, "Muscle Power" | https://www.foundmyfitness.com/topics/muscle-power | `strength-minimum-weekly` |
| FoundMyFitness topic page | Rhonda Patrick, "Aerobic Exercise" | https://www.foundmyfitness.com/topics/aerobic-exercise | `desk-day-offset` (checked; negative) |
| FoundMyFitness topic page | Rhonda Patrick, "Exercise Snacks" | https://www.foundmyfitness.com/topics/exercise-snacks | `desk-day-offset` |
| Huberman Lab newsletter | Andrew Huberman, deliberate heat protocols | https://www.hubermanlab.com/newsletter/deliberate-heat-exposure-protocols-for-health-and-performance | `heat-before-bed-gap`, `sauna-recovery-low-heat`, `sauna-rehydrate` (missing credit) |
| Huberman Lab episode | Andrew Huberman, deliberate heat exposure | https://www.hubermanlab.com/episode/the-science-and-health-benefits-of-deliberate-heat-exposure | `heat-before-bed-gap`, `sauna-recovery-low-heat` |
| Huberman Lab newsletter | Andrew Huberman, cold exposure | https://www.hubermanlab.com/newsletter/the-science-and-use-of-cold-exposure-for-health-and-performance | `cold-on-non-lifting-days`, `cold-for-tomorrow`, `sauna-then-cold` |
| Huberman Lab episode | Andrew Huberman, jet lag, shift work and sleeplessness | https://www.hubermanlab.com/episode/find-your-temperature-minimum-to-defeat-jetlag-shift-work-and-sleeplessness | `jet-lag-light-direction`, `dark-glasses-home`, `night-shift-light`, `night-anchor-sleep`, `no-drive-after-nights` (negative) |
| Huberman Lab newsletter | Andrew Huberman, "Improve Your Sleep" | https://www.hubermanlab.com/newsletter/improve-your-sleep | `sleep-need-calibration`, `caffeine-on-nights`, `on-shift-nap`, `tracker-stages-are-estimates` |
| Huberman Lab newsletter | Andrew Huberman, top sleep questions | https://www.hubermanlab.com/newsletter/your-top-questions-on-sleep-answered | `sleep-opportunity-tally`, `pre-nights-nap` |
| Huberman Lab newsletter | Andrew Huberman, using light for health | https://www.hubermanlab.com/newsletter/using-light-for-health | `night-shift-light`, `dark-glasses-home` |
| Huberman Lab newsletter | Andrew Huberman, foundational fitness | https://www.hubermanlab.com/newsletter/foundational-fitness-protocol | `desk-day-offset` (checked; negative) |
| Huberman Lab episode page | Andy Galpin, strength and muscle | https://www.hubermanlab.com/episode/dr-andy-galpin-optimal-protocols-to-build-strength-and-grow-muscles | `cold-on-non-lifting-days` |
| Huberman Lab episode page | Matthew Walker, biology of sleep and your sleep needs | https://www.hubermanlab.com/episode/guest-series-dr-matthew-walker-the-biology-of-sleep-your-unique-sleep-needs | `sleep-need-calibration` (missing credit) |
| Huberman Lab episode page | Susanna Søberg, cold and heat | https://www.hubermanlab.com/episode/dr-susanna-soberg-how-to-use-cold-and-heat-exposure-to-improve-your-health | `sauna-then-cold` (missing credit) |
| The Tim Ferriss Show (Jan 2024) | Andy Galpin, full transcript | https://tim.blog/2024/01/20/andy-galpin-transcript/ | `sauna-then-cold`, `sauna-rehydrate` (missing credits), `heat-before-bed-gap` |
| Perform with Dr Andy Galpin | "Why Muscle Matters & How to Build It" | https://podcasts.happyscribe.com/perform-with-dr-andy-galpin/why-muscle-matters-how-to-build-it | `strength-minimum-weekly` |
| Shawn Ryan Show #181 | Peter Attia | https://podcasts.happyscribe.com/shawn-ryan-show/181-peter-attia-the-science-of-longevity-nutrition-myths-and-medicine-3 | `strength-minimum-weekly`, `protein-after-sixty-five`, `tracker-stages-are-estimates` (contradiction), `desk-day-offset` |
| Diary of a CEO clip | Peter Attia, seven-day training blueprint | https://podcasts.happyscribe.com/the-diary-of-a-ceo-with-steven-bartlett/most-replayed-moment-the-7-day-training-blueprint-to-live-longer-peter-attia | `strength-minimum-weekly` |
| Marco Altini's Substack | Marco Altini, wearables and sleep time; how he tracks sleep | https://marcoaltini.substack.com/p/wearables-and-sleep-time ; https://marcoaltini.substack.com/p/q-and-a-how-do-you-track-sleep | `tracker-stages-are-estimates` |
| The Peter Attia Drive | #221, understanding sleep (with Matthew Walker) | https://peterattiamd.com/understanding-sleep/ | `sleep-need-calibration`, `sleep-opportunity-tally`, `caffeine-on-nights` |
| The Peter Attia Drive | AMA #47 / #254, cold therapy | https://peterattiamd.com/cold-therapy/ (landing page; article member-only) | `cold-for-tomorrow` |
| Dr Layne Norton Podcast | ep. 29, "Protein Deep Dive"; ep. 4, "Protein Masterclass" with Donald Layman | https://biolayne.com/podcasts/dr-layne-norton-podcast/protein-deep-dive-episode-29/ | `protein-after-sixty-five` |
| Ask Dr Andy Galpin (clip archive) | Andy Galpin, cold exposure and hypertrophy | https://ask.andygalpin.com | `cold-on-non-lifting-days`, `cold-for-tomorrow` |

### Money

| Show / site | Guest or author | URL | Bears on |
|---|---|---|---|
| Rational Reminder 256 (8 Jun 2023) | Hal Hershfield | https://rationalreminder.ca/podcast/256 | `per-day-framing`, `future-self-ten-minutes` |
| Rational Reminder 288 | Scott Rick | https://rationalreminder.ca/podcast/288 | `shared-money-agreement` |
| Rational Reminder 300 (11 Apr 2024) | Abigail Sussman | https://rationalreminder.ca/podcast/300 | `two-accounts-one-label`, `latte-maths-retired` |
| Rational Reminder 232 (22 Dec 2022) | Annamaria Lusardi | https://rationalreminder.ca/podcast/232 | `two-thousand-first` |
| The Tim Ferriss Show #371 (May 2019) | Ramit Sethi, "Automating Finances" | https://tim.blog/2019/05/07/ramit-sethi/ | `willpower-retired`, `two-accounts-one-label`, `tracking-is-a-mirror`, `latte-maths-retired` |
| barefootinvestor.com | Scott Pape, Step 2 (buckets) | https://www.barefootinvestor.com/barefoot-steps/step-2-set-up-buckets/ | `two-accounts-one-label`, `pay-yourself-a-salary` |
| barefootinvestor.com | Scott Pape, Step 6 (Mojo) | https://www.barefootinvestor.com/barefoot-steps/step-6-boost-mojo | `two-thousand-first` |
| barefootinvestor.com | Scott Pape, Step 7 and "Mojo or Offset?" | https://www.barefootinvestor.com/barefoot-steps/step-7-banker-off-back ; https://www.barefootinvestor.com/articles/qna/mojo-or-offset | `offset-is-linked` (missing credit) |
| barefootinvestor.com | Scott Pape, superannuation articles | https://www.barefootinvestor.com/articles/category/Superannuation | `super-four-settings` (missing credit) |
| barefootinvestor.com | Scott Pape, insurance guide | https://www.barefootinvestor.com/insurance | `cover-inventory` (missing credit) |

### Registry checks run (Crossref / Europe PMC), to settle researcher credits

`10.1073/pnas.1510383112` (Czeisler senior author, confirmed) ·
`10.5665/sleep.5550` (no Lack) · `10.1111/jan.14031` (no Lack) ·
`10.1002/14651858.CD008262.pub2` (no Peake) ·
`10.1007/s40279-022-01644-9` (no Peake; Halson present) ·
`10.1093/sleep/zsaa291` (no Altini) ·
`10.1016/j.jsams.2006.06.009` (no Laukkanen) ·
`10.1155/2014/307421` (no Laukkanen) ·
`10.1136/bjsports-2017-097608` (Helms and Schoenfeld present; Phillips senior) ·
`10.1016/j.jamda.2013.05.021` (PROT-AGE; Phillips a co-author).

---

## One-paragraph recommendation

Delete four credits (Huberman on `no-drive-after-nights` and
`desk-day-offset`; Attia on `pre-nights-nap` and `jet-lag-light-direction`),
delete or move four researcher-lineage credits (Laukkanen ×2, Lack, Peake),
delete the four Ben Felix host credits, reword the seventeen adjacent
recovery credits so they claim only what the person actually teaches, and
add the ten missing credits in section D — of which the three Scott Pape
additions and the two sauna-rehydration additions are the highest value,
because they put a recognisable name on cards that currently have none.
Then adopt the one-line rule in section E: *a researcher credit requires
that person on the author list of a source in that card's row.* Applied to
these two rounds it catches every error found here.
