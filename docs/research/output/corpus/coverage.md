# Corpus coverage — what we can actually reach, measured

Measured 8 September 2026 by crawling the transcript aggregator's 38
sitemaps and sweeping every name on `COMMUNICATORS.md` across both free
transcript sources. Numbers here are counts, not estimates. Method and
terms are in `SOURCES.md`; the tool is `tools/harvest.js`.

## The headline

**36,198 episode transcripts across 1,018 shows** are free to read on
podcasts.happyscribe.com, and **850+ full Tim Ferriss Show transcripts**
are free on tim.blog. Together with reference lists published by the shows
themselves, that is a far larger corpus than the rounds have been using.

But the shape of it matters more than the size, and it is the opposite of
what you would guess.

## The aggregator carries venues, not the roster's own shows

This is the single most important finding, and it vindicates the roster's
"tier the episode by its guest" rule rather than undermining it.

**Not on the aggregator at all:** Huberman Lab, FoundMyFitness, The Tim
Ferriss Show, Sigma Nutrition Radio, Stronger By Science, Rational
Reminder, WorkLife, Deep Questions, Nutrition Made Simple. Huberman Lab
episode URLs appear in the search index but redirect to the homepage and
serve no transcript; that index entry is stale.

**On the aggregator, with episode counts:**

| Show | Episodes | Why it matters to us |
|---|---|---|
| The Joe Rogan Experience | 481 | Attia, Huberman, Galpin, Patrick, Kaeberlein, Norton have all done long-form episodes |
| Armchair Expert | 355 | Mind, relationships, behaviour change |
| The Diary of a CEO | 242 | Huberman, Perel, work and money guests |
| The Mel Robbins Podcast (two slugs) | 723 | Mind and behaviour; treat as Tier 3 venue |
| On Purpose (Jay Shetty) | 172 | Mind, relationships; verify hard |
| Lex Fridman | 160 | Huberman, Sapolsky, Barrett, long and technical |
| The School of Greatness | 159 | Tier 3 venue |
| Shawn Ryan Show (two slugs) | 202 | Huberman sleep and mental-health episodes |
| Ten Percent Happier (Dan Harris) | 73 | Mind: Brewer, Neff, Hanson, Kabat-Zinn |
| Freakonomics Radio | 61 | Behavioural economics, money |
| The Rich Roll Podcast | 47 | Health, nutrition, longevity |
| The Money Mondays / NerdWallet / Money Rehab | 355 | Money, mostly US and product-adjacent |
| Modern Wisdom | 19 | Huberman, Galpin, Norton |
| Zoe Science & Nutrition | 17 | Nutrition, UK cohort science |
| The Peter Attia Drive | 14 | Recent episodes only |

The rest of the 1,018 shows are news, politics, true crime and
entertainment. The corpus is enormous and mostly irrelevant; the useful
slice is about 2,500 episodes across roughly twenty shows.

## Roster sweep: hits per person

Left column is episodes found on the aggregator (guest appearances across
all venues). Right column is free full Tim Ferriss Show transcripts on
tim.blog mentioning them. Zero on the left means "not a podcast guest in
this index", never "not worth mining" — several of the best-cited people
on the roster are researchers who publish rather than tour.

| Communicator | Aggregator | tim.blog | Route in |
|---|---|---|---|
| Andrew Huberman | 20 | 12 | Both, richly. Verify hard per the roster. |
| Esther Perel | 20 | 10 | Both. Best-covered relationships voice. |
| Tim Ferriss (as guest) | 15 | — | His own archive is the source. |
| Jordan Peterson | 14 | 12 | Do not expand, per the roster. |
| Adam Grant | 9 | 13 | Both. Work pillar. |
| Morgan Housel | 8 | 10 | Both. Money. |
| Peter Attia | 7 | 13 | Both, plus 14 Drive episodes. |
| Andy Galpin | 7 | 6 | Both. Training and recovery. |
| Sam Harris | 7 | 12 | Both. Mind. |
| David Sinclair | 6 | 8 | Named risk. Do not add longevity credits. |
| Dan Harris | 5 | 13 | Both, plus his own show's 73 episodes. |
| Lisa Feldman Barrett | 5 | 1 | Aggregator (Lex). Mind. |
| Cal Newport | 4 | 11 | Mostly tim.blog. Work. |
| Matthew Walker | 4 | 10 | Both. Verify against primary literature. |
| Tony Robbins | 4 | 12 | Tier 3. Never alone on a card. |
| James Clear | 4 | 13 | Both. Habits. |
| Sue Johnson | 4 | 9 | Both. Relationships. |
| Rhonda Patrick | 3 | 11 | Both, plus her own site's free transcripts. |
| Ramit Sethi | 3 | 12 | Both. Money. |
| Michael Pollan | 3 | 13 | Both. |
| Layne Norton, Mike Israetel, Pavel Tsatsouline | 2 each | 1–8 | Mixed; tim.blog better. |
| Judson Brewer, Kristin Neff, Rick Hanson, Barbara Oakley, Robert Sapolsky, Jon Kabat-Zinn, BJ Fogg, Luc van Loon | 1 each | 1–13 | tim.blog and Dan Harris's show. |
| Ben Felix | 0 | 10 | rationalreminder.ca directly. |
| Scott Pape | 0 | 13 | barefootinvestor.com. Australian, no podcast index. |
| Matt Kaeberlein | 0 | 6 | tim.blog and JRE. |
| Danny Lennon, Gil Carvalho, Eric Helms | 0 | 1–5 | Their own sites' reference lists. |
| Greg Nuckols, Eric Trexler | 0 | 1 | strongerbyscience.com articles. |
| Kirk Parsley, Scott Young, Gloria Mark | 0 | 5–13 | tim.blog. |
| Amy Edmondson, Sabine Sonnentag, Christina Maslach, Teresa Amabile, Katy Milkman, Anders Ericsson, Stuart Phillips, Brad Schoenfeld, Satchin Panda, John Gottman, Jari Laukkanen | 0–1 | 1–8 | **Researchers, not broadcasters. Go to the papers.** |

The tim.blog counts are search hits, not guaranteed dedicated episodes;
`harvest.js tim "<name>"` now filters to transcript slugs containing a
query word, so a count above about five usually means a real episode.

## Corrections to the table above, found by using it

The counts are raw search hits. Three failure modes turned up once rounds
started working from them, and all three are now checked rather than
assumed.

**A name can match something else entirely.** The **Sue Johnson** row
says 4. All four are BBC News items about people *suing Johnson &
Johnson* over talcum powder. She has **zero** aggregator episodes. Her
one real conversation is on tim.blog and turned out to be the most
protocol-dense source in the connection round. Spot-checks of Adam Grant,
James Clear, Rick Hanson and Sam Harris came back genuine, so this is a
name-collision failure rather than a general one — but it means a count
is a starting point, not a finding.

**A listed episode may serve no transcript.** **Esther Perel** shows 20
and only **11** carry a real transcript. The rest are stubs, including
the Huberman Lab one, which is the episode most worth having. Always
check the word count after fetching: a few hundred words is a stub.

**An episode title can misname the guest.** The connection round found
three, including its single most important family-block source, which the
index attributes to the wrong Harvard psychologist. It also found one
conversation published twice under different titles, which reads as
convergence and is not.

None of this changes the shape of the corpus or the conclusions below.
It changes how a count should be treated: as a place to look.

## What this changes about how a round runs

1. **Search the practice across venues, not the show for practices.** The
   aggregator's value is that one query hits 481 Rogan episodes plus every
   other venue at once. `harvest.js search "psychological detachment"`.
2. **Go to the show's own site for its own episodes.** tim.blog for
   Ferriss, foundmyfitness.com for Patrick (free full transcripts plus
   97-DOI topic pages), hubermanlab.com for Huberman's reference lists,
   rationalreminder.ca and sigmanutrition.com for their paper lists.
3. **For the researchers, skip the podcast layer entirely.** Sonnentag,
   Maslach, Amabile, Edmondson, Milkman, Laukkanen, Phillips and
   Schoenfeld are cited by the communicators; the communicators are the
   route to their names, and the papers are the source. Attribution still
   goes to whoever popularised the practice.
4. **Convergence is a search key.** When a query returns the same practice
   from six independent credible people, verify that one first. It moves
   no grade and it can be six people citing one weak study, which is worth
   discovering.

## Honest limits

- The aggregator's terms allow personal-use reading and extracts, not
  commercial reuse of site content. We read to find papers and write
  everything in our own words. Nothing is reproduced, and the download
  cache lives outside the repository.
- Search returns few results per query (three for "sauna"), so it finds
  episodes by name and phrase, not exhaustively by topic. Combine it with
  the direct sites.
- **The corpus is more concentrated than the totals suggest.** In the
  connection pillar, 155 of 183 routed rows come from five shows, and 69
  from one host across two feeds. Twenty-eight titles assert a prediction
  or a secret the guest does not actually make. A pillar can look
  well-covered and be one venue's editorial voice repeated.
- Show pages list about 14 recent episodes and do not paginate; the
  sitemaps are the complete index and that is what was crawled here.
- 403s remain on Elsevier, Wiley, Springer, SAGE, OUP, Science, PNAS and
  every ato.gov.au page. Crossref, Europe PMC, PMC, NBER and RePEc are the
  working chain, and Australian tax figures still need a human
  click-through.
