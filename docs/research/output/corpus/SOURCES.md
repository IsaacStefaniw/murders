# Research corpus — where the transcripts, papers and books actually are

Written 8 September 2026 by the research session, after testing every
source below by hand. This is the access map that `COMMUNICATORS.md`
asked for: which shows publish what for free, how to get at it, and what
the terms allow. `tools/harvest.js` does the fetching. `coverage.md`
beside this file is the roster-by-source sweep it produced.

Lives under `docs/research/output/` because that is the only place the
research session writes. Promote it to `docs/research/` if it earns it.

## The rule, restated

Transcripts are read, never reproduced. Not a sentence. The cache of
downloaded pages stays in the OS temp directory, outside the repository,
and what enters `docs/research/output/` is the index: episode, claim in
our own words, the paper it points at, the DOI, the grade the paper
earns. Podcasts set no grade. Attribution credits the person whose public
teaching popularised the practice, which is almost always the guest.

## Transcript sources, tested

| Source | What is free | How to get it | Notes |
|---|---|---|---|
| **podcasts.happyscribe.com** | Full transcripts with speaker labels and timestamps, searchable across every show it hosts. The site's own words: free to read, search and share. | `harvest.js search "<query>"` for cross-show search; `harvest.js fetch <url>` for a transcript. A plain fetch gets a Cloudflare interstitial; a browser user-agent gets the page (the tool sets one). **Episode URLs returned by search are not stable**: the Work round found two Huberman slugs that resolve to the homepage and serve no transcript, and two episodes withdrawn from the host between the search and the fetch. Check the word count after fetching — a few hundred words means a stub, not a transcript — and record a withdrawal rather than silently dropping the row. | **Coverage is the venues, not the roster's own shows.** Joe Rogan, Lex Fridman, Rich Roll, Modern Wisdom, Diary of a CEO, Jay Shetty, Shawn Ryan and some of The Drive are here; Huberman Lab, Tim Ferriss, FoundMyFitness, Sigma, Rational Reminder are not. That is exactly the "tier the episode by its guest" case: Attia on Rogan, Galpin on Modern Wisdom, Perel everywhere. Terms of use (happyscribe.com/terms): personal use, one printed copy, extracts for personal use, no commercial use of site content without a licence, scraping not addressed. Reading to find papers is inside that; publishing transcript text would not be. Show pages list about 14 recent episodes and do not paginate; search is the way in. |
| **tim.blog** | Every Tim Ferriss Show transcript, in full, free, 850+ episodes. | `harvest.js tim "<guest>"` searches; `harvest.js fetch <url>` reads. Index: tim.blog/2018/09/20/all-transcripts-from-the-tim-ferriss-show/ | The single best free transcript archive for the roster: Attia, Huberman, Patrick, Sethi, Housel, Newport, Grant, Galpin, Walker, Harris and most of Tier 2 have long-form episodes here. |
| **hubermanlab.com** | Timestamps and a **references list with links to the papers** on every episode. Transcript is premium. | `harvest.js refs <episode-url>` pulls the DOIs and journal links. Episode index: hubermanlab.com/all-episodes, /guest-episodes, /topics/<slug> | The references list is more useful than the transcript would be: it is the papers he is pointing at, which is what has to be opened anyway. Verify hard, per the roster. |
| **foundmyfitness.com** | Full free transcripts, timestamped topic timelines, glossary, and PubMed or DOI links on interview episodes. Topic pages (e.g. /topics/sauna) are long-form articles with numbered references, 97 DOIs on the sauna page. | `harvest.js fetch` and `harvest.js refs` on /episodes/<slug> or /topics/<slug> | Premium is slides and the Aliquot segments only. The richest single source for heat, cold and micronutrients. |
| **peterattiamd.com** | Timestamps and a partial show-notes preview. Show notes, references and transcript are member-only. | Use happyscribe for the Drive episodes it carries, tim.blog for his Ferriss appearances, and JRE transcripts on happyscribe. | The Drive's own notes are the one paid thing on this list that might be worth it later; not yet. |
| **rationalreminder.ca** | Episode pages with show notes listing the papers discussed, with links. Transcripts on the site. | `harvest.js refs https://rationalreminder.ca/podcast/<n>` | The money pillar's best discovery source and free of product interest. |
| **sigmanutrition.com** | Timestamped outline and a short reference list with links per episode. Transcript premium. | `harvest.js refs https://sigmanutrition.com/podcast/episode<n>/` | The references are the useful part. |
| **strongerbyscience.com** | Articles and podcast notes, heavily cited, free. Returns 403 to the summariser tool but not to a plain fetch with a browser user-agent. | `harvest.js fetch` / `refs` | Publish their reasoning, which is the point. |
| **JRE, Lex Fridman, Rich Roll, Modern Wisdom, Diary of a CEO** | Via happyscribe, above. | `harvest.js search "<guest name>"` | Venues. Tier the episode by the guest. |
| **Waking Up / Making Sense (Sam Harris)** | Not on happyscribe; Making Sense publishes partial transcripts for subscribers. | Use his Ferriss and Huberman appearances (both free) and the papers those point at. | — |

## Finding the papers in the first place

Until now rounds found papers through a general web search, which is slow
and biased toward whatever is popular this month. Europe PMC has a free
REST search over roughly 45 million records with no key, and it is far
better for this job because it filters by publication type and sorts by
citation count.

`harvest.js lit "<phrase>" [meta|review|rct|oa|any]` runs it. It searches
the exact phrase first and, if that returns nothing, ANDs the words
inside title-and-abstract so a match has to be about the topic. Results
come back most-cited first with year, DOI, journal, open-access flag and
citation count, which is close to a landmark-paper finder:

- `lit "psychological detachment"` returns Sonnentag & Fritz's 2007
  Recovery Experience Questionnaire at the top, 477 citations.
- `lit "burnout intervention physicians" meta` returns the 2017 JAMA
  Internal Medicine controlled-intervention meta-analysis, 866 citations.
- `lit "sauna cardiovascular mortality"` returns the 2015 JAMA Internal
  Medicine Finnish cohort and the 2018 Mayo review.

`harvest.js abstract <doi-or-pmid>` then returns the structured record:
title, authors, journal, volume, pages, publication types, open-access
status, citation count, any sample sizes stated in the abstract, and the
abstract itself where the record carries one. That is most of a ledger
row in one call. Closed-access psychology and economics records often
have no abstract, and the tool says so and points at PMC or Crossref.

Caveat worth knowing: sorting by citations favours older work, so a
2025 trial that overturns a 2005 classic will sit below it. Run the
search twice, once by citations and once reading the recent end.

## Paper verification, tested

Publisher landing pages (Elsevier, Wiley, Springer, SAGE, OUP, UChicago,
Science, PNAS) return 403 to automated fetches on most days. The chain
that works, in order:

1. **Crossref registry record** for the DOI: `harvest.js crossref <doi>`
   gives title, journal, year, volume, pages, first authors and any
   retraction or update relation. This is the system of record and it is
   what the recovery and money rounds used for every row.
2. **Europe PMC REST** by DOI or PMID for the abstract and MeSH:
   `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:<doi>&resultType=core&format=json`
2b. **OpenAlex** when the abstract is missing above, which is routine for
   APA journals — Journal of Applied Psychology, Psychological Bulletin,
   Group Dynamics and the rest elide their abstracts from both Crossref
   and Europe PMC. OpenAlex stores them as an inverted index and
   `harvest.js abstract` now rebuilds the text automatically. This route
   rescued seven papers in the Work round. It also carries its own
   `is_retracted` boolean, which is a third retraction signal.
3. **PubMed Central** full text where it exists (most NIH-funded work).
4. **NBER, SSRN, IDEAS/RePEc, J-PAL, IZA** for economics working papers
   and abstracts.
5. **Author pages and ResearchGate** for author copies.
6. **Retraction check**: see `RETRACTIONS.md`, which is the standing
   register and the first thing a round should read. The short version is
   that the Crossref `update-to` and `relation` fields **are not
   reliable**: JAMA, PNAS and SAGE mark a retraction by prefixing the
   title and leave the relation empty, so all three retracted papers
   found so far read "none" there. `harvest.js crossref` now checks the
   title too and prints a `DO_NOT_CITE` flag. Use that, the OpenAlex
   `is_retracted` boolean, and Retraction Watch. Three rounds have each
   found a retraction in scope; the check is not optional.

Government and regulator pages: MoneySmart, RBA, APRA, ASIC, ABS, PC,
Grattan all open.

**ato.gov.au 403s are a user-agent block, not a real one.** The money
round flagged a dozen rows UNVERIFIED on the strength of those 403s. The
same URLs return the full page to a request carrying an ordinary browser
user-agent and an Australian language header, which `harvest.js fetch`
sets. Re-verified figures are in `../money/ATO-VERIFIED.md`, and two of
them had gone stale in the meantime. Treat a 403 as a header problem
first and a real block second.

Some ATO pages still render client-side and return a near-empty document
to any fetcher; use MoneySmart for those. afca.org.au and the Melbourne
Institute 403 for real. studyassist.gov.au, education.gov.au and
servicesaustralia.gov.au time out rather than 403, which is a different
problem and unsolved.

## Books, free and legitimate

**NCBI Bookshelf** is searchable through the same free NCBI API, and
`harvest.js book "<query>"` runs it: relevance-ordered, with the
drug-reimbursement reviews that dominate Bookshelf by volume filtered
out. A search for shift work and circadian rhythm returns the National
Academies sleep-deprivation volume's chapters on need for sleep, recovery
sleep and preventing chronic sleep loss, plus the circadian
sleep-wake-disorder references. Good for mechanism and background.

DOAB and OAPEN for open-access academic books, publisher open-access
programmes, and author-released chapters round it out. Books orient; they
never set a grade, and a five-year-old chapter loses to a current
meta-analysis every time.

## What a round does with this

Two passes, and the order matters: the literature decides what is true,
the communicators decide what gets written on the card and whose name
goes on it.

**Pass one, the literature.**
1. `harvest.js lit "<topic phrase>" meta` for every topic in the brief,
   then again with `any` and read the recent end.
2. `harvest.js abstract <doi>` for each candidate: design, n, journal,
   publication type, citation count, abstract.
3. `harvest.js crossref <doi>` for the registry record and the retraction
   or update relation. This is not optional; a landmark paper in the money
   round had been retracted six days earlier.
4. `harvest.js book "<topic>"` where mechanism or background is thin.

**Pass two, the communicators.**
5. `harvest.js search` and `harvest.js tim` for every roster name the
   brief touches, plus the brief's topic words. Convergence across
   independent communicators decides what to verify first; it moves no
   grade.
6. `harvest.js fetch <url> "kw,kw"` to read the claim-shaped lines, then
   the cached text where a claim needs context.
7. `harvest.js refs` on the show's own page to get the papers the host
   listed, and check them against what pass one already found. Where the
   episode overstates the paper, record it.
8. The ledger row carries the episode (show, guest, date, URL) beside the
   paper, so the attribution on the card is traceable and the credit is
   real.
