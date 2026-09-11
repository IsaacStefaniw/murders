# IntentNorth — working agreement

The app is IntentNorth. The GitHub repo is still named `murders` for the
reason in `docs/DECISIONS.md` ADR-001. Code says `intent-os`.

**Read `docs/STATE.md` first, every session.** It says what is true right now,
what is blocked and on whom, and — most importantly — which of the 170
documents in `docs/` to read and which to leave alone.

Website work has its own handoff in `web/CLAUDE.md`.

---

## Guardrails for Isaac

Isaac asked to be pulled up on these. They are drift patterns measured from
his own history, not general advice. **Say it in one line, name the specific
action, then carry on** — do not hint, do not soften it into a question, and
do not raise the same one twice in a session.

### 1. Context past half the window → "write to STATE.md and start fresh"

The long app session reached 554k of 1,000k and cost $2,497, of which most
was re-reading: 1.97 billion cached tokens read to produce 9.3 million. Past
halfway, cost per useful turn climbs steeply and early decisions decay into
paraphrases that have lost their reasons.

At ~50%, say plainly: **"We're at N% of context. Let me write the state to
`docs/STATE.md` and you start a fresh session."** Then actually write it,
per `docs/SESSION_PROTOCOL.md`. Do not wait to be asked twice.

Exception: never split mid-diagnosis. The ruled-out hypotheses are the
valuable part and they are the part that does not survive a handover.

### 2. A session blocked on Isaac → name it, with its cost

Two sessions sat blocked for three days on answers that took a minute: an
App Store Connect API key, and which of four sections to cut. A blocked
session is a context window decaying at full price.

If `docs/STATE.md` §3 has an open item and Isaac starts something new, say
so before starting: **"Two things are waiting on you: X and Y. Both are
one-line answers. Shall I do those first?"**

### 3. A new document that overlaps an existing one → do not create it

The repo has `MONETISATION.md` and `MONETIZATION.md`, three competitive
reviews, and nine review documents with overlapping scope. 463,351
insertions against 1,765 deletions.

Before writing any new document in `docs/`, grep for one that already covers
it. If one exists: extend it, or supersede it **in the same commit** per
`docs/DOC_LIFECYCLE.md`. Never leave two live documents answering the same
question — an agent grepping `docs/` cannot tell which one is current, and
will act confidently on whichever it reads first.

### 4. Findings that have shipped → disposition the document that holds them

A review document is live until its findings are implemented, and a hazard
afterwards, because it describes open issues that are closed and copy that
has been rewritten. The commit that implements the last finding is the
commit that retires the document. Do not leave it for later.

### 5. Reporting a check as run when it was not

If a check could not run — no browser, no credentials, no device — **say it
did not run.** Never report the change as verified. This rule is in
`web/CLAUDE.md` because it was broken once, and it applies everywhere.

### 6. Work landing anywhere but the trunk

App work goes to `claude/rename-murders-folder-goh5q0`. `master` is a 2020
commit with unrelated history — never target it. If work is sitting unmerged
on a side branch, say which branch and how many commits, because that has
happened and nobody noticed for three days.

---

## Before any push

```bash
npm run lint && npm run typecheck && npm test     # app
cd web && npm run lint && npm test                # website
cd web && npm run test:layout                     # only if layout changed
```

## House style

Commit subjects name the defect, not the change. `paths: three rungs promised
a change and delivered a duplicate`, not `fix duplicate rung`. The log reads
as a record of what was actually wrong.
