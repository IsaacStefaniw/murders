# How research rounds get delivered — no more zips

## The change

Rounds have been arriving as zip files, exported and re-uploaded by hand.
That is unnecessary: the research session already commits and pushes, and
its branch is visible to everyone.

**`origin/claude/research-recovery` is the delivery channel.** Push there;
the review happens against the branch.

## The loop

1. **Research session** works on `claude/research-recovery`, writing only
   under `docs/research/output/<area>/`, and pushes when a round is done.
   Say so in the commit subject — `research: <area> round — N candidates`.
2. **Before starting a round**, merge `origin/claude/rename-murders-folder-goh5q0`
   into the research branch. That is where the contract
   (`docs/research/README.md`), the roster (`COMMUNICATORS.md`), the briefs
   and every `REVIEW.md` live. The round on 8 September did this correctly.
3. **App session** fetches, reviews, and writes `REVIEW.md` into
   `docs/research/output/<area>/` on `claude/rename-murders-folder-goh5q0`.
4. **Research session** picks the review up on its next merge in step 2.

No zips, no re-upload, and every review is versioned beside the work it
reviews.

## Why the review is written to the app branch

The app session pushes only to `claude/rename-murders-folder-goh5q0` —
that is a standing rule and it does not bend for convenience. Since the
research branch merges that branch in before each round, writing the
review there reaches the research session anyway, one merge later.

## What the app session checks, every round

Mechanical, and worth knowing in advance so a round can self-check:

- typechecks against the real `Protocol` interface, zero errors
- no id collisions with the live library
- safety note on every health entry; the word "prescription" nowhere
- money entries route to a licensed professional and name no product,
  platform, ticker or return figure
- every protocol has a `sources.md` row with a resolvable DOI or PMID and
  two sentences of grade reasoning
- grade spread against the library's own balance — a round that runs hot
  gets asked why
- scheduling shape matches the copy: a card that says "after a competition"
  must not be scheduled every Saturday
- attribution populated, and drawn from `COMMUNICATORS.md`

## Order

Recovery ✅ · Money ✅ (pending two additions) · **Work next**, then
nutrition, training, relationships, mind, supplements, skill. The order and
the reasoning are in `docs/research/README.md`.
