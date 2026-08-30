# INTENT — Product

**Promise: reduce the distance between intention and action.**

INTENT is an AI-powered Personal Operating System. It helps people do more of
what makes life meaningful, less of what they regret, and spend less time
managing their life so they can live it.

## The loop

INTENT → PLAN → SCHEDULE → ACT → OBSERVE → REFLECT → ADAPT

Everything in the product serves this loop. The core hypothesis: people don't
need another place to record what they should do — they need a system that
helps the right behaviour happen at the right moment.

## Principles

- **Behaviour change over functionality.** Every feature must change what the
  user does, or it goes.
- **Minimum screen time, maximum real-world action.** A successful interaction
  lasts 10–30 seconds. No feeds, no engagement mechanics, no vanity dashboards.
- **Specific over inspirational.** "You have 35 minutes before your next
  meeting. Train now?" — never "Crush your goals!"
- **No shame loops.** Behaviour occurrences are data, not failures.
- **Days need slack.** The planner refuses to fill every minute.

## MVP modules and current status

| Module | Status |
| --- | --- |
| Life Interview (structured conversational onboarding) | IMPLEMENTED |
| Life Operating Plan (review & approve) | IMPLEMENTED |
| Today screen (Must/Should/Could, complete/skip) | IMPLEMENTED |
| Deterministic daily planner with buffers & protected time | IMPLEMENTED + tested |
| Morning check-in | IMPLEMENTED |
| Evening reflection | IMPLEMENTED |
| Adaptation engine (move routines that don't stick) | IMPLEMENTED + tested |
| Goals → routines → schedule | IMPLEMENTED |
| Behaviour intentions (supportive tracking, alcohol safety note) | IMPLEMENTED |
| Weekly review (deterministic stats + narrative) | IMPLEMENTED (AI narrative needs backend) |
| AI structured-output layer (Zod, retry, fallback) | IMPLEMENTED + tested |
| Supabase schema, RLS, seed | IMPLEMENTED (migrations written; not yet deployed) |
| Account sync / auth screens | SCAFFOLDED (client + schema ready, demo mode default) |
| Partner/household sharing | SCAFFOLDED (schema + permissions model; no UI) |
| Calendar integration | FUTURE (work hours modelled from profile for now) |
| Fitness program generation | FUTURE (workout shortening logic exists) |
| Commerce / supplement reordering | FUTURE |

## North Star metric

Percentage of user-defined intentions translated into completed real-world
actions (Weekly Intent Completion Rate). Never daily minutes in app.

## The killer feature bet

**Adaptive Day Planning** — INTENT understands calendar, goals, routines,
priorities and recent behaviour, and continuously builds a realistic daily
plan. The adaptation engine already demonstrates the differentiator: when a
5:30am workout keeps getting skipped and lunchtime activities keep completing,
INTENT proposes moving the default — with its reasoning shown.
