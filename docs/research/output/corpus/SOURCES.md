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
| **podcasts.happyscribe.com** | Full transcripts with speaker labels and timestamps, searchable across every show it hosts. The site's own words: free to read, search and share. | `harvest.js search "<query>"` for cross-show search; `harvest.js fetch <url>` for a transcript. A plain fetch gets a Cloudflare interstitial; a browser user-agent gets the page (the tool sets one). | **Coverage is the venues, not the roster's own shows.** Joe Rogan, Lex Fridman, Rich Roll, Modern Wisdom, Diary of a CEO, Jay Shetty, Shawn Ryan and some of The Drive are here; Huberman Lab, Tim Ferriss, FoundMyFitness, Sigma, Rational Reminder are not. That is exactly the "tier the episode by its guest" case: Attia on Rogan, Galpin on Modern Wisdom, Perel everywhere. Terms of use (happyscribe.com/terms): personal use, one printed copy, extracts for personal use, no commercial use of site content without a licence, scraping not addressed. Reading to find papers is inside that; publishing transcript text would not be. Show pages list about 14 recent episodes and do not paginate; search is the way in. |
| **tim.blog** | Every Tim Ferriss Show transcript, in full, free, 850+ episodes. | `harvest.js tim "<guest>"` searches; `harvest.js fetch <url>` reads. Index: tim.blog/2018/09/20/all-transcripts-from-the-tim-ferriss-show/ | The single best free transcript archive for the roster: Attia, Huberman, Patrick, Sethi, Housel, Newport, Grant, Galpin, Walker, Harris and most of Tier 2 have long-form episodes here. |
| **hubermanlab.com** | Timestamps and a **references list with links to the papers** on every episode. Transcript is premium. | `harvest.js refs <episode-url>` pulls the DOIs and journal links. Episode index: hubermanlab.com/all-episodes, /guest-episodes, /topics/<slug> | The references list is more useful than the transcript would be: it is the papers he is pointing at, which is what has to be opened anyway. Verify hard, per the roster. |
| **foundmyfitness.com** | Full free transcripts, timestamped topic timelines, glossary, and PubMed or DOI links on interview episodes. Topic pages (e.g. /topics/sauna) are long-form articles with numbered references, 97 DOIs on the sauna page. | `harvest.js fetch` and `harvest.js refs` on /episodes/<slug> or /topics/<slug> | Premium is slides and the Aliquot segments only. The richest single source for heat, cold and micronutrients. |
| **peterattiamd.com** | Timestamps and a partial show-notes preview. Show notes, references and transcript are member-only. | Use happyscribe for the Drive episodes it carries, tim.blog for his Ferriss appearances, and JRE transcripts on happyscribe. | The Drive's own notes are the one paid thing on this list that might be worth it later; not yet. |
| **rationalreminder.ca** | Episode pages with show notes listing the papers discussed, with links. Transcripts on the site. | `harvest.js refs https://rationalreminder.ca/podcast/<n>` | The money pillar's best discovery source and free of product interest. |
| **sigmanutrition.com** | Timestamped outline and a short reference list with links per episode. Transcript premium. | `harvest.js refs https://sigmanutrition.com/podcast/episode<n>/` | The references are the useful part. |
| **strongerbyscience.com** | Articles and podcast notes, heavily cited, free. Returns 403 to the summariser tool but not to a plain fetch with a browser user-agent. | `harvest.js fetch` / `refs` | Publish their reasoning, which is the point. |
| **JRE, Lex Fridman, Rich Roll, Modern Wisdom, Diary of a CEO** | Via happyscribe, above. | `harvest.js search "<guest name>"` | Venues. Tier the episode by the guest. |
| **Waking Up / Making Sense (Sam Harris)** | Not on happyscribe; Making Sense publishes partial transcripts for subscribers. | Use his Ferriss and Huberman appearances (both free) and the papers those point at. | — |

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
3. **PubMed Central** full text where it exists (most NIH-funded work).
4. **NBER, SSRN, IDEAS/RePEc, J-PAL, IZA** for economics working papers
   and abstracts.
5. **Author pages and ResearchGate** for author copies.
6. **Retraction check**: the Crossref record's `update-to` and `relation`
   fields, plus Retraction Watch. Ariely & Wertenbroch 2002 was retracted
   six days before the money round; the check is not optional.

Government and regulator pages: MoneySmart, RBA, APRA, ASIC, ABS, PC,
Grattan all open. **ato.gov.au, studyassist.gov.au, education.gov.au,
servicesaustralia.gov.au, afca.org.au and the Melbourne Institute return
403 or time out**; rows that rest on them are marked UNVERIFIED and need a
human click-through.

## Books, free and legitimate

NCBI Bookshelf (StatPearls, Endotext, full clinical references), DOAB and
OAPEN for open-access academic books, publisher open-access programmes,
author-released chapters. Books orient; they never set a grade.

## What a round does with this

1. `harvest.js search` and `harvest.js tim` for every roster name the
   brief touches, plus the brief's topic words. Convergence across
   independent communicators decides what to verify first; it moves no
   grade.
2. `harvest.js fetch <url> "kw,kw"` to read the claim-shaped lines, then
   the cached text where a claim needs context.
3. `harvest.js refs` on the show's own page to get the papers the host
   listed.
4. `harvest.js crossref <doi>` and Europe PMC for every paper before it
   enters a ledger. Record where the episode overstates the paper.
5. The ledger row carries the episode (show, guest, date, URL) beside the
   paper, so the attribution on the card is traceable.
