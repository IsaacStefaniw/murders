# Document lifecycle

463,351 insertions against 1,765 deletions. Nothing was ever retired, so
`docs/` accumulated three competitive reviews, two monetisation models with
opposite conclusions, and nine review records describing open issues that had
long since been closed.

That is not clutter, it is a hazard. An agent grepping `docs/` for guidance
cannot tell a live model from a superseded one, and will act confidently on
whichever it reads first. The clearest case: `MONETIZATION.md` described a
free trial week and an AI coach. Revision 3 of `MONETISATION.md` had reversed
the first and `claims.test.ts` forbids the second — and both files sat in the
same directory, equally authoritative-looking, for four days.

## The rule

**One live document per question.**

1. **Before writing a new document in `docs/`, grep for one that already
   covers the question.** If one exists, extend it. Do not create a second.
2. **When a document's findings ship, disposition it in the same commit that
   ships them.** Not later. The commit that implements the last finding is the
   commit that retires the document.
3. **A document has exactly one of three states.**
   - **Live** — in `docs/`, currently true, safe to act on.
   - **Archived** — in `docs/archive/`, a record. Carries a header naming what
     superseded it and why. Never acted on.
   - **Deleted** — gone. Only for exact duplicates and documents fully
     restated elsewhere, where nothing is lost that git history cannot answer.
4. **Archive rather than delete anything carrying provenance.** Where a claim
   came from, what was considered and rejected, and what a later document is a
   diff against. `COMPETITIVE_REVIEW_3.md` says cell by cell where the first
   two sweeps were wrong; deleting them would make its section 5 unreadable.
5. **Archiving is three steps, all in one commit.** Move the file to
   `docs/archive/`, prepend the header, and rewrite every reference to it to
   the new path. `docLifecycle.test.ts` fails the build if any is skipped.
6. **Never leave two live documents answering the same question.** If that is
   discovered, fixing it is the next commit, not a backlog item.

## The header every archived document carries

```
> **ARCHIVED — a record, not guidance.**
> Superseded by `docs/<successor>.md`.
>
> <why, in one or two sentences>
>
> Do not act on this document. See `docs/DOC_LIFECYCLE.md`.
```

## Ledger

Archived 11 September 2026.

| Document | Superseded by | Why |
|---|---|---|
| `COMPETITIVE_REVIEW.md` | `docs/COMPETITIVE_REVIEW_3.md` | First sweep, 2026-09-04, unverified (the container could not reach vendor sites). The third sweep checked every cell against the Australian App Store  |
| `COMPETITIVE_REVIEW_2.md` | `docs/COMPETITIVE_REVIEW_3.md` | Second sweep, 2026-09-06, still unverified — egress blocked apps.apple.com and every vendor site. Section 5 of the third sweep corrects it cell by c |
| `COMPETITOR_REVIEW_BRIEF.md` | `docs/COMPETITIVE_REVIEW_3.md` | The brief that commissioned the third sweep. The sweep exists; the brief is spent. |
| `MONETIZATION.md` | `docs/MONETISATION.md` | CONTRADICTS CURRENT POLICY. Describes a long trial and a free "complete lived week". Revision 3 of MONETISATION.md reversed that: people pay from day  |
| `CEO_BRIEF.md` | `docs/MONETISATION.md` | August 2026 conversion research, consumed into the monetisation model and superseded by the revision 3 decision. |
| `POSITIONING_RESEARCH.md` | `docs/PROBLEM_STATEMENT.md` | Positioning input for the website session, consumed. The problem statement is the live reference. |
| `POSITIONING_REVIEW.md` | `docs/PROBLEM_STATEMENT.md` | Self-declared superseded in part on 2026-09-04. The problem statement and film script here were rewritten after review; the glossary and five-second t |
| `REVIEW_BRIEF.md` | `docs/DEVELOPMENT_PUSH.md` | The brief that commissioned Workstreams A, B and C. All three delivered; their reports are archived beside this. |
| `USABILITY_REVIEW.md` | `docs/DEVELOPMENT_PUSH.md` | Workstream B, walked 2026-09-06. Findings implemented; the screenshots it names never lived in the repo. |
| `QA_REPORT.md` | `docs/DEVELOPMENT_PUSH.md` | Workstream C, 2026-09-06. Every row was turned into a jest test, which is now the live record. Reading this for open issues will mislead — they are  |
| `OVERHAUL_REPORT.md` | `docs/DEVELOPMENT_PUSH.md` | Record of the thousand-reviewer overhaul loop, 2026-09-04. The changes shipped. The banned vocabulary it produced lives in src/features/copy/__tests__ |
| `AUDIENCE_REVIEW.md` | `docs/PROBLEM_STATEMENT.md` | Five cold readers, 2026-09-04. The findings drove the plain-language work and are enforced by web/tests/plain-language.test.mjs. |
| `COACH_VALUE_REVIEW.md` | `docs/DEVELOPMENT_PUSH.md` | Seven parallel coach audits, 2026-09-07. The top changes shipped on the branch; the open decisions moved into the development push. |
| `WEBSITE_REVIEW.md` | `web/CLAUDE.md` | App-session review of the deployed site at 88cb884. Its conclusions were folded into web/CLAUDE.md, which is the live website handoff. |
| `NIGHT_BRIEF.md` | `docs/DEVELOPMENT_PUSH.md` | A single night's worklist, 2026-09-07. Spent. |

Nothing has been deleted outright. Every document above is a record of what
was considered, which is worth keeping in a project whose guardrails are about
not making claims it cannot support.

## What stayed live, and why

The 37 documents remaining in `docs/` are there because something depends on
them now. Fourteen are referenced directly from `src/` or `web/` source —
`PRODUCT.md` is read from disk by `claims.test.ts` and fails the build on
drift; `KNOWLEDGE.md` is cited by six protocol files; `PATHWAY_HONING_BRIEF.md`
by four. The rest are the live reading list in `docs/STATE.md` §5.

If a document in `docs/` is not on that reading list and nothing in `src/` or
`web/` cites it, it is a candidate for the next pass.
