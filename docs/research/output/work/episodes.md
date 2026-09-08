# Work & Leadership round — episodes and the credit ledger

The artefact `METHOD.md` now requires of every round: every episode
actually opened, and a verdict on every attribution credit. This is the
first round to produce one, and it is the round that most needed it.

## The headline, and it is uncomfortable

**Podcast discovery could not lead this brief.** The four researchers
whose work is the best-evidenced material in this pillar return **zero
episodes between them** across the whole transcript aggregator index and
the whole free Tim Ferriss archive:

| Researcher | What they are load-bearing for | Episodes found |
|---|---|---|
| Sabine Sonnentag | psychological detachment, recovery from work | 0 |
| Christina Maslach | the burnout construct, the six areas | 0 |
| Teresa Amabile | the progress principle | 0 |
| Amy Edmondson | psychological safety | 0 |
| Gloria Mark | attention and interruption | 1, as a guest on an economics show |

Meanwhile a search for "burnout" returned **twenty episodes, none of them
by a burnout researcher**.

So a podcast-first funnel run strictly would have captured twenty
episodes of people discussing burnout and missed the meta-analyses that
say what actually shifts it. For this brief the papers led and the
transcripts followed, which is the reverse of the recovery and money
rounds. The brief predicted it — "business podcasts are the weakest
discovery source of any area in this project" — and the measurement
confirms it. This finding is now recorded in `../corpus/PIPELINE.md` as
the reason Gate 1 has a literature inlet as well as a podcast one.

**The consequence for the cards: 20 of 26 ship with an empty
`attribution`.** That is the correct call, not a gap. Crediting Cal
Newport or Andrew Huberman for Sonnentag's work because the name is
recognisable is precisely the failure the contract warns about, and a
false credit is worse than an empty one.

## Method

Queries run through `../corpus/tools/harvest.js`: 26 name and topic
searches across the aggregator, 15 across the Tim Ferriss archive, plus
reference-list extraction from hubermanlab.com episode pages. 68 episodes
found, 33 mined. 54 distinct DOIs were run through the Crossref checker;
66 lookups in total, and the 12 mis-keyed ones are disclosed in the
ledger rather than hidden.

Copyright rule verified mechanically rather than only by construction:
every seven-word sequence in the transcript ledger was diffed against
every cached transcript. Only titles, show names, URLs and paper titles
matched. One line that had drifted close to a speaker's phrasing was
rewritten.

## Episodes opened

Full index with topics and per-episode notes is in
`ledgers/transcripts.md`, section A. Summary by venue:

| Venue | Episodes mined | What it was good for |
|---|---|---|
| The Tim Ferriss Show (own archive, free transcripts) | 11 | Newport, Duckworth, McKeown, Willink, Clear |
| Ten Percent Happier | 5 | the mind-adjacent side of work stress |
| The Diary of a CEO | 4 | high reach, low citation density |
| Rich Roll | 3 | the Adam Grant episode, which carried the round's best team-level find |
| Modern Wisdom | 3 | Newport and Duckworth again |
| Lex Fridman | 3 | including the Sinek episode, see flags |
| Freakonomics | 2 | the single Gloria Mark appearance |
| hubermanlab.com (reference lists, not transcripts) | 2 | his cortisol and burnout episode carries **no reference list at all** |

Two episodes central to the burnout thread were **withdrawn from the
transcript host between the search and the fetch** and are recorded as
withdrawn rather than dropped. Two aggregator Huberman slugs resolve to
the site homepage and serve no transcript; those went to hubermanlab.com
instead. Both facts are now warnings in `../corpus/SOURCES.md`.

## Credit ledger

Verdicts per `METHOD.md`: **TRACED** (a specific episode, chapter or
article where that person teaches this practice), **TRACED (adjacent)**
(covers the topic, not this practice), **RESEARCHER** (credited for the
underlying work, verified at the author list), **UNTRACED** (searched
properly, found nothing — the credit comes off).

| card | name | verdict | evidence |
|---|---|---|---|
| `burnout-is-not-a-personal-failing` | Christina Maslach | RESEARCHER | Author of the construct and the six-areas model; Maslach, Schaufeli & Leiter 2001, Annu Rev Psychol 52:397–422. Author list verified. |
| `burnout-is-not-a-personal-failing` | Adam Grant | TRACED | *WorkLife*, "Burnout Is Everyone's Problem", 17 Mar 2020. The episode's framing — redesign the job, do not repair the person — is what the meta-analyses support. A rare case where the podcast and the pooled evidence agree. |
| `keep-it-about-the-work` | Adam Grant | TRACED | *WorkLife*, "How to Love Criticism", 28 Feb 2018. Credited for the practice of actively seeking critical feedback, not for the Kluger & DeNisi mechanism. |
| `a-rating-is-one-persons-view` | Marcus Buckingham | TRACED (adjacent) | HBR, "The Feedback Fallacy", March–April 2019, which popularised the idiosyncratic-rater finding. The article's wider conclusions go further than Scullen 2000 supports; the credit is for bringing the finding to a general audience, and the card states only what the paper shows. |
| `job-crafting-two-columns` | Amy Wrzesniewski, Jane Dutton | RESEARCHER | Originators of the construct, Acad Manage Rev 2001. Author list verified. |
| `job-crafting-two-columns` | Adam Grant | TRACED | Rich Roll episode; the round's best team-level find came from it, and Grant is the main route by which crafting reached a general audience. |
| `start-at-the-minute` | Steven Rogelberg | TRACED | The meeting-science literature is his, and he is already credited on the library's existing `meeting-trim`. |
| `stop-building-sandwiches` | Kim Scott | TRACED | *Radical Candor* and the site's own piece on why the sandwich does not work. Scott is right about the sandwich for roughly the right reasons; her own framework is not itself tested, so the credit is for the critique only. |
| every other card (20 of 26) | — | **empty, deliberately** | See the headline above. No communicator teaches these practices. |

## Credits considered and refused

| Name | Why not |
|---|---|
| **Andrew Huberman**, on burnout | His cortisol-and-burnout episode frames burnout physiologically. Nothing in this round's burnout literature supports that: the pooled meta-analysis found **no significant relationship between detachment and physiological stress markers**, and the intervention evidence is organisational. His down-regulation practices are graded elsewhere in the library on their own evidence. **Do not attribute him on burnout.** Flagged for Isaac. |
| **Andrew Huberman**, on shift work | He advises holding a fixed schedule for fourteen days to adapt the clock. Folkard 2008 (DOI 10.1080/07420520802106835) finds most permanent night workers show little circadian adjustment. Consistency should ship as harm reduction, explicitly not as adaptation — otherwise a shift worker who does everything right and still feels wrecked concludes they failed. That episode also carries no reference list. |
| **Simon Sinek** | The Lex Fridman episode contains **zero occurrences** of "study", "research" or "data" across 7,209 words. No Sinek credit anywhere. |
| **Steven Kotler** | "Flow makes you five times more productive" traces to a consulting firm's self-report survey, not peer-reviewed work. Tier 3 confirmed. |
| **Tim Ferriss** | No episode could be verified as the popular origin of any practice in this round, so no credit was invented for him. |
| **Jordan Peterson**, **David Sinclair** | Neither has a claim in this territory; roster guidance is keep and do not expand. Not considered. |

## Convergence

Seven genuine convergences and five false ones are in
`ledgers/transcripts.md` section C. The two worth carrying:

**Genuine.** *Change the situation, not your willpower.* Angela Duckworth
and James Clear arrive at it independently and from opposite directions,
and Duckworth walks back her own headline on the way. That lets the coach
say "build the environment, not the grit" without contradicting the
person whose name is most associated with grit.

**False.** Five practices are repeated by many voices resting on one thin
source. Convergence told us where to look and then told us the looking
was the point, which is exactly what the contract says it is for.
