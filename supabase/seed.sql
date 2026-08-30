-- Development seed data. Entirely fictional — never put real personal data here.
--
-- Creates "Sam", a COO with a partner (Alex), two kids, fitness goals and
-- behaviour intentions, plus two weeks of realistic plan history so the
-- adaptation engine has something to learn from.
--
-- Usage: supabase db reset   (applies migrations then this seed)

-- A fixed UUID so re-running the seed is idempotent in local dev.
do $$
declare
  sam uuid := '00000000-0000-4000-8000-000000000001';
  house uuid := '00000000-0000-4000-8000-00000000000a';
  g_train uuid; g_date uuid; g_business uuid;
  r_gym uuid; r_dinner uuid; r_date uuid;
  bi_alcohol uuid; bi_scroll uuid;
  plan_id uuid;
  d date;
begin
  -- Local development only: create the auth user directly.
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values (sam, 'sam@example.dev', now(), '{"seed": true}'::jsonb)
  on conflict (id) do nothing;

  insert into profiles (id, first_name, life_profile, onboarded_at)
  values (
    sam,
    'Sam',
    jsonb_build_object(
      'priorities', jsonb_build_array('family','health','work'),
      'workDays', jsonb_build_array(1,2,3,4,5),
      'workStart', '09:00', 'workEnd', '17:30',
      'wakeTime', '06:00', 'sleepTime', '22:15',
      'energyProfile', 'midday',
      'trainingDaysPerWeek', 4,
      'trainingDurationMin', 45,
      'trainingPreference', 'gym',
      'moreOf', jsonb_build_array('Date nights','Seeing friends'),
      'lessOf', jsonb_build_array('alcohol','doomscrolling')
    ),
    now()
  )
  on conflict (id) do update set first_name = excluded.first_name;

  insert into households (id, name, created_by) values (house, 'Home', sam)
  on conflict (id) do nothing;
  insert into household_members (household_id, user_id, role) values (house, sam, 'owner')
  on conflict do nothing;

  -- Goals.
  insert into goals (user_id, title, area, cadence_per_week)
  values (sam, 'Train 4× a week', 'health', 4) returning id into g_train;
  insert into goals (user_id, title, area, cadence_per_week)
  values (sam, 'Regular date nights with Alex', 'relationship', 1) returning id into g_date;
  insert into goals (user_id, title, area)
  values (sam, 'Grow the side business', 'growth') returning id into g_business;

  -- Routines.
  insert into routines (user_id, goal_id, title, area, days, duration_min,
                        preferred_start, preferred_end, energy, flexible, protected, tier)
  values
    (sam, g_train, 'Strength workout', 'health', '{1,2,4,6}', 45,
     '12:05', '13:15', 'midday', true, false, 'should')
  returning id into r_gym;
  insert into routines (user_id, title, area, days, duration_min,
                        preferred_start, preferred_end, energy, flexible, protected, tier)
  values
    (sam, 'Family dinner', 'family', '{0,1,2,3,4,5,6}', 45,
     '18:00', '18:45', 'evening', false, true, 'must')
  returning id into r_dinner;
  insert into routines (user_id, goal_id, title, area, days, duration_min,
                        preferred_start, preferred_end, energy, flexible, protected, tier)
  values
    (sam, g_date, 'Date night', 'relationship', '{5}', 120,
     '19:30', '20:15', 'evening', true, false, 'should')
  returning id into r_date;

  -- Behaviour intentions.
  insert into behaviour_intentions (user_id, behaviour, intention_text)
  values (sam, 'alcohol', 'Drink less, more deliberately') returning id into bi_alcohol;
  insert into behaviour_intentions (user_id, behaviour, intention_text)
  values (sam, 'doomscrolling', 'Less time lost to scrolling') returning id into bi_scroll;

  -- Two weeks of history: workouts completed at lunch, evenings mixed.
  for d in select generate_series(current_date - 13, current_date - 1, interval '1 day')::date loop
    insert into daily_plans (user_id, plan_date, summary, approved_at)
    values (sam, d, 'Seeded history', d + time '07:00')
    returning id into plan_id;

    insert into daily_plan_items (plan_id, user_id, routine_id, title, area, tier, status,
                                  start_time, end_time, fixed)
    values
      (plan_id, sam, r_gym, 'Strength workout', 'health', 'should',
       case when extract(dow from d) in (1,2,4,6)
            then (case when random() < 0.8 then 'completed' else 'skipped' end)::plan_item_status
            else 'skipped'::plan_item_status end,
       '12:05', '12:50', false),
      (plan_id, sam, r_dinner, 'Family dinner', 'family', 'must',
       (case when random() < 0.9 then 'completed' else 'skipped' end)::plan_item_status,
       '18:00', '18:45', false);
  end loop;

  -- A few behaviour events.
  insert into behaviour_events (intention_id, user_id, occurred_at, trigger)
  values
    (bi_alcohol, sam, now() - interval '5 days', 'Work dinner'),
    (bi_scroll, sam, now() - interval '2 days', 'Woke up early'),
    (bi_scroll, sam, now() - interval '1 day', 'Waiting for the kids');

  -- Reflections.
  insert into reflections (user_id, reflection_date, kind, mood, went_well, got_in_the_way)
  values
    (sam, current_date - 1, 'evening', 4, 'Lunch workout happened again', 'Late emails ate the evening'),
    (sam, current_date - 2, 'evening', 3, null, 'Scrolled instead of reading');
end $$;
