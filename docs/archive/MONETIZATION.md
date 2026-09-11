> **ARCHIVED — a record, not guidance.**
> Superseded by `docs/MONETISATION.md`.
>
> CONTRADICTS CURRENT POLICY. Describes a long trial and a free "complete lived week". Revision 3 of MONETISATION.md reversed that: people pay from day one, in 1.0. It also sells an "AI coach" that src/features/__tests__/claims.test.ts forbids, and calls /upgrade an unwired scaffold when StoreKit has shipped.
>
> Do not act on this document. See `docs/DOC_LIFECYCLE.md`.

# Monetization — the paywall arc

Grounded in the Aug-2026 research in docs/archive/CEO_BRIEF.md: long personalised
assessments before the paywall convert dramatically better than early
gates (Noom's quiz→program-build→paywall converts >10% of completers vs a
2.7% category median); value-first onboarding beats paywall-at-launch by
40–60%; long trials (17–32 days) convert at roughly double short ones.

## The arc

1. **Interview v4** is the assessment — commitment through effort, every
   answer visibly shaping the program.
2. **"Paths starting today"** on plan review is the program-build moment
   — the equivalent of Noom's animating projection. This is where the
   Plus offer appears, once.
3. **A long trial, not a hard gate.** The free tier is a *complete lived
   week*: interview, one active path, adaptive Today/Plan, all sessions.
   The product must prove itself in seven real days.

## Free forever (doctrine, not tactics)

- The plan, the sessions, the adaptation loop.
- **Every recovery feature.** Urge help, trigger interventions, the
  recovery path. We never charge for someone's hardest moment.

## Plus

All five paths concurrently · AI coach (briefs + weekly narratives) ·
household/partner layer · calendar + HealthKit integrations · full
history and weekly reports.

## Status

`/upgrade` is a SCAFFOLDED preview (linked from Settings; later shown
once post-plan-review). No billing SDK is wired; when the App Store
release lands, use RevenueCat-or-equivalent with the trial length A/B'd
in the 17–32-day band.
