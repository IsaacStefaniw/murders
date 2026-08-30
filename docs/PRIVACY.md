# Privacy & data handling

INTENT deals with journals, health patterns, behaviour struggles and family
life. Treat every row as sensitive.

## Standing rules

- **Private by default.** Every shareable table has a `visibility` column
  defaulting to `private`. Journal entries, behaviour tracking, health data,
  private goals and financial data are never visible to a partner or
  household unless the user explicitly shares that specific resource.
  Relationship status never implies permission.
- **RLS everywhere.** Every table enables row level security with own-row
  policies (`supabase/migrations/0001_initial_schema.sql`). Household read
  access exists only for household/member metadata.
- **No secrets in the client.** Only the Supabase anon key ships in the app.
  Model API keys live in edge-function secrets. `.env` is git-ignored.
- **Data minimisation to AI.** Requests to the model contain the minimum
  structured data the task needs (see AI_SYSTEM.md). No names, no emails, no
  tokens.
- **Never log** access tokens, journal content, health details or auth
  secrets — in app code or edge functions. The `ai-proxy` function returns
  generic errors so vendor error bodies (which can echo requests) never
  propagate.
- **Demo mode is local-only.** Without a configured backend, all data stays
  in AsyncStorage on the device and is deletable in Settings → Reset.

## Built into the schema

- Account deletion: all user tables cascade from `profiles`/`auth.users`.
- Auditability: `user_decisions` records what the user accepted/dismissed;
  `ai_recommendations.reason` preserves why something was suggested.
- Export: all user data is addressable by `user_id` — an export function can
  select per-table without joins across other users.

## Health & safety guardrails

- Wellbeing guidance, never medical advice. No diagnoses, no prescription
  recommendations.
- Alcohol: supportive framing; the catalog carries a safety note advising
  medical guidance before abrupt cessation, surfaced at selection and on the
  behaviour card. Escalation copy points to professional support.
- Safety messaging is calm, not alarmist, for ordinary behaviour.
