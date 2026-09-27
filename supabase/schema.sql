-- Foodicted - Supabase schema for households (shared accounts) and shared
-- favorite recipes. Paste this whole file into the Supabase SQL editor
-- (Dashboard -> SQL Editor -> New query) and run it once.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists favorite_recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null default '',
  prep_time_minutes int not null default 0,
  cook_time_minutes int not null default 0,
  servings int not null default 2,
  category text not null default 'sonstiges',
  difficulty text not null default 'medium',
  tags jsonb not null default '[]',
  ingredients jsonb not null default '[]',
  missing_ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  nutrition jsonb not null default '{"calories":0,"proteinGrams":0,"carbsGrams":0,"fatGrams":0}',
  created_at timestamptz not null default now()
);

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  text text not null,
  checked boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table households enable row level security;
alter table household_members enable row level security;
alter table favorite_recipes enable row level security;
alter table shopping_list_items enable row level security;

-- Bypasses RLS internally (security definer) to answer "is the current
-- user a member of this household" without recursive policy issues.
create or replace function is_household_member(hh_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid()
  );
$$;

create policy "select own households" on households
  for select using (is_household_member(id));

create policy "select own membership" on household_members
  for select using (user_id = auth.uid());

create policy "select household favorites" on favorite_recipes
  for select using (is_household_member(household_id));
create policy "insert household favorites" on favorite_recipes
  for insert with check (is_household_member(household_id));
create policy "update household favorites" on favorite_recipes
  for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "delete household favorites" on favorite_recipes
  for delete using (is_household_member(household_id));

create policy "select household shopping list" on shopping_list_items
  for select using (is_household_member(household_id));
create policy "insert household shopping list" on shopping_list_items
  for insert with check (is_household_member(household_id));
create policy "update household shopping list" on shopping_list_items
  for update using (is_household_member(household_id)) with check (is_household_member(household_id));
create policy "delete household shopping list" on shopping_list_items
  for delete using (is_household_member(household_id));

-- No direct insert/update/delete policies on households / household_members -
-- all writes go through the security-definer functions below, which run
-- with elevated privileges and enforce their own rules.

-- ---------------------------------------------------------------------
-- RPC functions used by the app
-- ---------------------------------------------------------------------

create or replace function generate_invite_code()
returns text
language sql
as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- Creates a new household with a fresh unique invite code and makes the
-- calling user its first member. Returns the new household's id and code.
create or replace function create_household(household_name text default null)
returns table (id uuid, invite_code text)
language plpgsql
security definer
as $$
declare
  new_id uuid;
  new_code text;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  loop
    new_code := generate_invite_code();
    exit when not exists (select 1 from households h where h.invite_code = new_code);
  end loop;

  insert into households (name, invite_code) values (household_name, new_code)
  returning households.id into new_id;

  insert into household_members (household_id, user_id) values (new_id, auth.uid());

  return query select new_id, new_code;
end;
$$;

-- Joins the calling user to the household identified by an invite code.
-- Returns the household's id and name.
create or replace function join_household(code text)
returns table (id uuid, name text)
language plpgsql
security definer
as $$
declare
  hh households%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select * into hh from households where invite_code = upper(trim(code));
  if not found then
    raise exception 'Ungültiger Einladungscode';
  end if;

  insert into household_members (household_id, user_id)
  values (hh.id, auth.uid())
  on conflict (household_id, user_id) do nothing;

  return query select hh.id, hh.name;
end;
$$;

-- ---------------------------------------------------------------------
-- Realtime (so household members see each other's changes live)
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table favorite_recipes;
alter publication supabase_realtime add table shopping_list_items;
