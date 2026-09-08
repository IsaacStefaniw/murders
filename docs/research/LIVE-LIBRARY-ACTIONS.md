# Findings in the shipped library — Isaac's calls

The research rounds have surfaced three things in `protocols.ts` itself,
not in their candidates. Verified independently here on 8 September 2026.
All are JavaScript-only and would ride the held OTA; none touches the
binary Apple is reviewing.

## 1. A shipped card rests on a retracted paper (urgent)

`ship-monthly` (`protocols.ts:1626`, skill, grade C) takes its reasoning
and **both** attribution credits — Dan Ariely and Klaus Wertenbroch — from
a 2002 paper retracted on 2 September 2026 after the data were found to
have been tampered with or fabricated.

Confirmed present and attributed exactly as described.

The card is not necessarily wrong; self-imposed deadlines may well hold up
on other evidence. But it currently cites, and credits, a retracted paper.

**Options:** re-source it to independent work and keep the practice;
regrade it down; or remove it. My view: try to re-source first, and remove
the two credits either way.

**The wider lesson the round drew is the sharper one:** that paper had been
in their retraction register since the money round found it, and nobody
swept the *already-shipped* cards against the register. They have since
written `retraction-sweep.js`, which finds this card in under a second and
reports the other 203 clean. Worth wiring into CI.

## 2. Six cards have Jordan Peterson as the sole attribution

`friend-reach-out` · `one-on-one-child` · `carer-ask-for-cover` ·
`teen-side-by-side` · `teen-their-call` · `adult-child-standing-call`

Four of the six are about children or caring.

This breaches the rule in `COMMUNICATORS.md` — keep the existing credits
where the practice stands on its own evidence, never expand them, and
never let his name stand alone on a card. The connection round found
tracing replacements for five of the six; `carer-ask-for-cover` has none,
because one carer episode exists in the entire corpus and it is
journalism, so an empty attribution is the honest answer there.

**Decision needed:** approve the five replacements and the one empty.

## 3. The most-used meditation card has a seven-word safety line

`meditation-10` is graded B, drives a guided voice session, and its whole
safety note is "Non-clinical; no therapeutic claims." A lower-use C-grade
card in the same pillar carries a full one naming distress, dissociation
and when to stop.

The mind round verified the underlying figures from primary literature:
roughly one in ten people who have meditated report a functionally
impairing adverse effect, about one in eighty an impairment lasting a
month or more, and 60% of those reporting difficulties were meditation
teachers — which removes the explanation that they were practising wrongly.

**The product change matters more than the copy change:** "you may stop at
any time" belongs inside the session player, not only on a card read
before the session starts. That is a small screen change, JavaScript only.

---

# CI: why the failure emails

Every failed run is `CI` on `claude/research-recovery`, and all of them
have the same single cause:

```
docs/research/output/money/protocols.ts(341,30):
  error TS2322: Type '"admin"' is not assignable to type 'GoalDomain'.
```

`bill-smoothing` sets `goalDomains: ['finance', 'admin']`. `'admin'` is a
valid `LifeArea` — which is why `area: 'admin'` on the same card passes —
but it is not a `GoalDomain`. The valid set is health, fitness, business,
career, finance, relationship, family, friends, personal, experience,
behaviour.

**Fix:** `goalDomains: ['finance']`.

`tsconfig.json` includes `**/*.ts` and excludes only `dist`,
`node_modules` and `web`, so every candidate file under
`docs/research/output/` is compiled by the gate. That is worth keeping —
it caught this — but it means **a round must run `npx tsc --noEmit -p .`
before pushing.** The round already has `check-round.js`; running it plus
the typecheck as a pre-push gate would have caught this and saved fifteen
red runs.

The card itself is good and was added in direct response to the money
review asking for income-variability coverage. Only the enum is wrong.

This branch is unaffected: the app branch merged the money round before
that card was written, and `tsc` is clean here.
