# SEO goals and the schedule that checks them

Set 2026-09-07 from `docs/SEO_RESEARCH.md`, `docs/BROWSER_SETUP_REPORT.md`
and a live check of google.com.au and bing.com the same day. Every goal has
a number, a date and the page it depends on. The weekly scoreboard
(`docs/seo/scoreboard.md`, appended by the Monday task) is the only place
progress is recorded; nothing is claimed that is not on that sheet.

## Where we stand, 7 September 2026

| Check (google.com.au, gl=au, not signed in) | Result |
|---|---|
| `site:intentnorth.app` | 3 of 13 pages indexed: `/`, `/works-with-what-you-wear` (crawled within the hour), `/privacy` |
| `intentnorth` | #1, #2, #3 are ours; then Finding North Network, Healthdirect, findingnorth.org.au (mental-health charities that share the word) |
| `whoop alternative` (590 AU/mo) | Reddit r/whoop ×2, whoopalternatives.com, YouTube, bodly.app, myonpulse.com. We are not indexed for it. |
| `sleep debt` (1,600 AU/mo) | WebMD, Sleep Foundation, NIH, Wikipedia, Swisse, Harvard Health. AI Overview slot fires. `/sleep-debt` not indexed. |
| `cyclic sighing` (140 AU/mo) | Videos block, Stanford Medicine, Physiopedia, mindright.com.au, PMC. `/cyclic-sighing` not indexed. |
| `magnesium for sleep`, `sauna benefits`, `cold plunge benefits`, `what is zone 2`, `does creatine work` | Hospital and journal domains plus Reddit; AI Overview fires on all. None of ours indexed. |
| Bing `site:intentnorth.app` | Nothing (imported today; 48-hour lag) |
| App Store | Build in review; no listing, no ratings |

Baseline for every traffic number is zero.

## Goals

| # | Goal | Target | By | Depends on | Who currently holds it |
|---|---|---|---|---|---|
| G1 | Indexed | 13/13 in Google; 13/13 in Bing | 21 Sep 2026 (Google), 5 Oct (Bing) | Requests done 7 Sep; nothing else to do but wait and re-request stragglers | n/a |
| G2 | Brand | `intentnorth` #1 in AU and US, and the App Store listing on page one once live | Hold from now; App Store result by 30 days after approval | Listing live | Finding North charities on the AU SERP |
| G3 | Whoop | `whoop alternative` top 10 AU | 7 Nov 2026; top 5 by 7 Dec | `/whoop-alternative` (live) + Reddit r/whoop comments (drafted) | whoopalternatives.com (one-page affiliate), bodly.app, myonpulse.com |
| G4 | Cyclic sighing | `cyclic sighing` top 10 AU | 7 Nov 2026 | `/cyclic-sighing` (live) | Stanford, Physiopedia, mindright.com.au |
| G5 | Sleep debt | `sleep debt` top 20 AU, then top 10 | 7 Dec 2026, then 7 Mar 2027 | `/sleep-debt` plus a client-side calculator (see research §8) | WebMD, Sleep Foundation, NIH, Swisse |
| G6 | Evidence topics | `magnesium for sleep`, `sauna benefits`, `cold plunge benefits`, `what is zone 2`, `does creatine work` each top 20 AU; cited inside the AI Overview on at least 2 of the 5 | 7 Mar 2027 | The five pages (live), named studies on each | Mayo, Harvard, Cleveland, NIH, Healthline, Reddit |
| G7 | Evidence library | 30 topic pages live (research §3.1), client-side search over all 177 | 7 Nov 2026 | Website session | Nobody grades practices |
| G8 | Reddit | 3 comments a week in ranking threads from launch; the "104 of 177" post within 7 days of approval | Weekly from approval | `docs/REDDIT_DRAFTS.md` | Reddit holds top-3 on 8 of 10 evidence SERPs |
| G9 | Ratings | 50 AU App Store ratings | 8 Dec 2026 (the January shelf is searched from the last week of December) | Approval | Competitors on the "habit" shelf have 12k–30k |
| G10 | Search traffic | 100 organic clicks a week in Search Console; 500 organic sessions a month in GA4 | 7 Dec 2026 | G1–G6 | — |

What "top 10" means here: the page is in the first ten organic results on
google.com.au with `gl=au`, not signed in, on the Monday check. AI Overview
citation means our domain appears in the overview's sources list.

## The schedule

Four recurring tasks and one reminder, created 7 September in the desktop
app's scheduled tasks. Each run starts fresh and writes to the repo.

| Task | When (Brisbane) | What it does | Writes |
|---|---|---|---|
| seo-weekly-scoreboard | Monday 08:30 | Google AU and Bing positions for the 11 tracked queries, `site:` counts, sitemap and page health, GA tag check; compares to G1–G6 and says which goals moved | `docs/seo/scoreboard.md` (one row per week) |
| reddit-weekly-queue | Thursday 08:30 | Finds the week's new threads in the target subreddits that match our terms, ranks five to answer, drafts the angle for each. Posts nothing. | `docs/REDDIT_QUEUE.md` |
| competitor-monthly-watch | 1st of month 09:00 | Re-reads the 8 competitors' AU App Store fields and prices and Similarweb pages, diffs against the September baseline | `docs/research/seo/competitor_watch_YYYY-MM.md` |
| seo-monthly-goal-review | 1st of month 09:30 | Reads the scoreboard, marks each goal on track / at risk / missed, proposes the month's three moves | Appends to this file |
| january-shelf-deadline | Once, 8 Dec 2026 09:00 | Reminder: ratings count vs G9, New Year Reddit threads, App Store screenshots for the January shelf | Notification |

Tasks run while the desktop app is open; a missed run fires at next launch.

## Monthly reviews

(Appended by seo-monthly-goal-review.)
