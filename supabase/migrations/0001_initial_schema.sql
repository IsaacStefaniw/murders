-- INTENT initial schema.
--
-- Design notes:
--  * Every user-owned row carries user_id and is protected by RLS.
--  * Households exist from day one; sharing is explicit via visibility.
--  * JSONB for flexible metadata, relational columns where relationships matter.
--  * AI observations carry confidence + evidence and are never treated as fact.

-- ─────────────────────────────────────────────── enums

create type life_area as enum
  ('family','relationship','health','work','growth','enjoyment','admin');

create type plan_tier as enum ('must','should','could');

create type plan_item_status as enum ('planned','completed','skipped','rescheduled');

create type goal_status as enum ('active','paused','achieved','dropped');

create type visibility as enum
  ('private','shared_with_partner','household','specific_people');

create type suggestion_status as enum ('open','accepted','dismissed','expired');

-- ─────────────────────────────────────────────── profiles & households

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  -- Stable profile: long-lived facts (priorities, work pattern, wake/sleep,
  -- training preferences, people). Mirrors the client LifeProfile type.
  life_profile jsonb not null default '{}'::jsonb,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Home',
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner','partner','member')),
  invited_by uuid references profiles (id),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- ─────────────────────────────────────────────── goals & routines

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  area life_area not null,
  why text,
  cadence_per_week smallint check (cadence_per_week between 1 and 14),
  status goal_status not null default 'active',
  visibility visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index goals_user_idx on goals (user_id, status);

create table goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals (id) on delete cascade,
  title text not null,
  due_date date,
  completed_at timestamptz,
  position smallint not null default 0
);
create index goal_milestones_goal_idx on goal_milestones (goal_id);

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  goal_id uuid references goals (id) on delete set null,
  title text not null,
  area life_area not null,
  days smallint[] not null default '{}',           -- 0=Sunday..6=Saturday
  duration_min smallint not null check (duration_min between 5 and 480),
  preferred_start time not null,
  preferred_end time not null,
  energy text not null default 'any' check (energy in ('morning','midday','evening','any')),
  flexible boolean not null default true,
  protected boolean not null default false,
  tier plan_tier not null default 'should',
  active boolean not null default true,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);
create index routines_user_idx on routines (user_id, active);

-- ─────────────────────────────────────────────── daily plans

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  plan_date date not null,
  summary text,
  intention text,
  protect_behaviour text,
  look_forward text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create table daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references daily_plans (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  routine_id uuid references routines (id) on delete set null,
  goal_id uuid references goals (id) on delete set null,
  title text not null,
  area life_area not null,
  tier plan_tier not null,
  status plan_item_status not null default 'planned',
  start_time time not null,
  end_time time not null,
  fixed boolean not null default false
);
create index daily_plan_items_plan_idx on daily_plan_items (plan_id);
create index daily_plan_items_user_idx on daily_plan_items (user_id, status);

-- ─────────────────────────────────────────────── behaviours

create table behaviour_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  behaviour text not null,                          -- catalog key
  intention_text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index behaviour_intentions_user_idx on behaviour_intentions (user_id, active);

create table behaviour_events (
  id uuid primary key default gen_random_uuid(),
  intention_id uuid not null references behaviour_intentions (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  trigger text,
  context text
);
create index behaviour_events_user_idx on behaviour_events (user_id, occurred_at);

-- ─────────────────────────────────────────────── reflections & journal

create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  reflection_date date not null,
  kind text not null check (kind in ('morning','evening')),
  mood smallint check (mood between 1 and 5),
  went_well text,
  got_in_the_way text,
  adjust_tomorrow text,
  created_at timestamptz not null default now(),
  unique (user_id, reflection_date, kind)
);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  prompt text,
  visibility visibility not null default 'private',  -- journals are never shared implicitly
  created_at timestamptz not null default now()
);
create index journal_entries_user_idx on journal_entries (user_id, created_at);

-- ─────────────────────────────────────────────── AI memory & suggestions

-- Derived insights: hypotheses, never facts. Expire and get reviewed.
create table ai_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null,
  content jsonb not null,
  confidence real not null check (confidence between 0 and 1),
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  review_after timestamptz
);
create index ai_observations_user_idx on ai_observations (user_id, kind);

create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  kind text not null,
  message text not null,
  reason text not null,                             -- always shown to the user
  payload jsonb,
  confidence real not null check (confidence between 0 and 1),
  status suggestion_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index ai_recommendations_user_idx on ai_recommendations (user_id, status);

-- Behavioural outcomes of suggestions feed future recommendations.
create table user_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  recommendation_id uuid references ai_recommendations (id) on delete set null,
  decision text not null check (decision in ('accepted','dismissed','rescheduled','ignored')),
  decided_at timestamptz not null default now()
);

create table notification_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  action_required boolean not null default true,
  upcoming_commitment boolean not null default true,
  behavioural_intervention boolean not null default true,
  relationship_family boolean not null default true,
  review boolean not null default true,
  optional_suggestion boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────── row level security

alter table profiles enable row level security;
alter table households enable row level security;
alter table household_members enable row level security;
alter table goals enable row level security;
alter table goal_milestones enable row level security;
alter table routines enable row level security;
alter table daily_plans enable row level security;
alter table daily_plan_items enable row level security;
alter table behaviour_intentions enable row level security;
alter table behaviour_events enable row level security;
alter table reflections enable row level security;
alter table journal_entries enable row level security;
alter table ai_observations enable row level security;
alter table ai_recommendations enable row level security;
alter table user_decisions enable row level security;
alter table notification_preferences enable row level security;

-- Own-row access. Sharing beyond the owner is a deliberate future policy
-- change per-table, driven by the visibility column — never a default.
create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own goals" on goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own goal milestones" on goal_milestones
  for all using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()))
  with check (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));

create policy "own routines" on routines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own daily plans" on daily_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own daily plan items" on daily_plan_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own behaviour intentions" on behaviour_intentions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own behaviour events" on behaviour_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own reflections" on reflections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own journal" on journal_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own ai observations" on ai_observations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own ai recommendations" on ai_recommendations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own decisions" on user_decisions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notification preferences" on notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Households: members can see the household and its member list; only the
-- creator manages the household row itself.
--
-- A security definer helper avoids the classic RLS pitfall: a policy on
-- household_members that selects from household_members recurses (42P17).
create or replace function is_household_member(hid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

create policy "household members read" on households
  for select using (is_household_member(id));
create policy "household creator manage" on households
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "household member list read" on household_members
  for select using (is_household_member(household_id));
create policy "household owner manages members" on household_members
  for insert with check (
    exists (select 1 from households h
            where h.id = household_id and h.created_by = auth.uid())
  );
create policy "leave household" on household_members
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────── triggers

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger goals_updated_at before update on goals
  for each row execute function set_updated_at();

-- Create an empty profile row when a user signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
