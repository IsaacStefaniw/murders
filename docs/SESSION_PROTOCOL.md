# How sessions split, and what they hand over

The app work ran as one session from 29 August to 10 September. It cost
$2,497, held 554k of a 1,000k context window, and changed permission mode
twenty-one times. The work was real. The shape was not.

`docs/research/WORKFLOW.md` already solved this for the research rounds — a
branch as the delivery channel, a review written back, picked up on the next
merge. That protocol was never applied to app work. This is it, applied.

## Why a long session costs more than it looks

Three separate costs, largest first.

1. **Re-reading.** Every turn re-reads the whole context before it thinks.
   Cost grows as context × turns. The app session read 1.97 billion cached
   tokens to produce 9.3 million — 211 read for every 1 written.
2. **Recall decay.** A full window evicts and summarises early turns. A
   decision survives as a paraphrase, and a paraphrase keeps the *what* while
   losing the *why*. That is how a settled question gets re-argued 200 turns
   later. `docs/DECISIONS.md` exists because this happened.
3. **Dilution.** The relevant 2k competes with 550k of noise.

Splitting a session without writing the state down does not fix any of this.
It loses the state instead of compacting it. **The handoff file is the point;
the new session is just what follows it.**

## When to split

Split at the next natural boundary after any of these:

- **Context passes ~50% of the window.** Past halfway the re-read cost per
  useful turn climbs steeply and recall starts to soften.
- **A release ships or a submission is queued.** The state is coherent and
  nameable, which is exactly when it is cheap to write down.
- **The subject changes.** App internals, store submission, website copy and
  research rounds are four different working sets. Sharing one window means
  every turn of each pays to re-read the other three.
- **The session is blocked on a person.** A blocked session is a context
  window decaying at full price. Write the state, close it, reopen on the
  answer.

Do not split mid-debugging. A half-diagnosed fault is the one thing that does
not survive a handoff, because the useful part is the ruled-out hypotheses,
and those are rarely written down.

## What a handoff must carry

`docs/STATE.md` is the living snapshot, rewritten — not appended to — at every
split. One file, always current, because two files named something like
"handoff" reproduce the problem this protocol exists to solve.

It carries five things and nothing else:

1. **Where the work is.** Branch, head commit, what is deployed and what is held.
2. **What is true now.** The state of the world a new session would otherwise
   have to rediscover by reading code.
3. **What is in flight, and who it waits on.** Named. A blocked item with no
   named owner is not a blocked item, it is a forgotten one.
4. **What is decided and must not be re-argued.** A pointer into
   `docs/DECISIONS.md`, plus anything decided since that has not been written up.
5. **What to read, in order — and what not to read.** The reading list is the
   highest-value line in the file. `docs/` holds over 150 documents. A new
   session that reads the wrong six is worse off than one that read none,
   because it will act confidently on a superseded review.

## The loop

1. The outgoing session rewrites `docs/STATE.md` and commits it **before** it
   runs out of room, not after.
2. It names, in the commit subject, that the state was handed over:
   `state: handover at <what just finished>`.
3. The new session reads `docs/STATE.md` first, then only the documents its
   reading list names.
4. The new session deletes anything in `STATE.md` that has stopped being true
   as it goes. `STATE.md` is never a log. It has no history section. Git holds
   the history, and `docs/DECISIONS.md` holds the reasons.

## What this does not change

The standing branch rule holds: app work pushes to
`claude/rename-murders-folder-goh5q0` and nowhere else. A session split is not
a branch split. Four sessions in sequence on one branch is the normal case.
