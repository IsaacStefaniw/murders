# INTENT

> An AI-powered Personal Operating System. Reduce the distance between
> intention and action.

INTENT plans your days around what you say matters — schedule, training,
family, relationships, behaviour change — then watches what actually happens
and adapts. Minimum screen time, maximum real-world action.

**Docs:** [Product](docs/PRODUCT.md) · [Architecture](docs/ARCHITECTURE.md) ·
[Data model](docs/DATA_MODEL.md) · [AI system](docs/AI_SYSTEM.md) ·
[Privacy](docs/PRIVACY.md) · [Build plan](docs/BUILD_PLAN.md) ·
[Decisions](docs/DECISIONS.md)

> **Note on the repo name:** this repository predates the project and is still
> named `murders` on GitHub. Renaming it to `intent-os` is a 10-second owner
> action (GitHub → Settings → Repository name); see ADR-001. Nothing in the
> code references the old name.

## Quick start

```bash
npm install
npm run ios        # or: npm start, then press i
```

That's it — the app runs in **local demo mode** with no backend: onboarding,
daily planning, check-ins, goals, behaviour tracking and adaptation all work
on-device.

## Development

```bash
npm run typecheck   # strict TypeScript
npm test            # jest — scheduling, adaptation, onboarding, AI parsing
npm run lint        # eslint (expo config)
npm run format      # prettier
```

## Backend (optional, enables sync + AI narratives)

1. Create a Supabase project, then:
   ```bash
   supabase link --project-ref <ref>
   supabase db push                 # applies supabase/migrations
   supabase db reset                # local dev: migrations + seed.sql
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy ai-proxy
   ```
2. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

Model API keys live only in edge-function secrets — never in the app.

## Project shape

```
src/app         screens (Expo Router)     src/lib/scheduling  deterministic engine
src/features    feature logic (tested)    src/lib/ai          Zod-validated agents
src/components  design system             supabase/           schema, RLS, ai-proxy
```
