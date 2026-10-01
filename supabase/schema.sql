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
  image_url text,
  created_at timestamptz not null default now()
);

-- Safe to re-run against an already-deployed database that predates this column.
alter table favorite_recipes add column if not exists image_url text;

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

-- Lets every member of a household see who else is in it (not just their
-- own row) - needed to show a household member list in the app.
drop policy if exists "select own membership" on household_members;
create policy "select household membership" on household_members
  for select using (is_household_member(household_id));

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

-- ---------------------------------------------------------------------
-- Storage (photos users attach to their saved favorite recipes)
-- ---------------------------------------------------------------------

-- Public bucket - recipe photos aren't sensitive, and a public read URL lets
-- every household member's app load them directly without extra requests.
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

-- Objects are stored as "<household_id>/<recipe_id>-<timestamp>.jpg" - the
-- first path segment is used to check household membership for writes.
-- (A select policy is required too, not just insert/update/delete - upload
-- with upsert:true does an internal existence check that needs read access.)
create policy "household members can view recipe images" on storage.objects
  for select to authenticated
  using (bucket_id = 'recipe-images' and is_household_member((storage.foldername(name))[1]::uuid));

create policy "household members can upload recipe images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recipe-images' and is_household_member((storage.foldername(name))[1]::uuid));

create policy "household members can update recipe images" on storage.objects
  for update to authenticated
  using (bucket_id = 'recipe-images' and is_household_member((storage.foldername(name))[1]::uuid));

create policy "household members can delete recipe images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recipe-images' and is_household_member((storage.foldername(name))[1]::uuid));

-- =======================================================================
-- Foodicted Community - recipes any user can publish, rate, comment on
-- and browse, independent of household. Paste this section alone into the
-- SQL editor if you're adding Community to a database that already has
-- everything above (it's safe to re-run this section on its own).
-- =======================================================================

-- ---------------------------------------------------------------------
-- Public profiles (households/favorites never needed a public-readable
-- user identity; Community does, to show an author name on every recipe)
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  -- Opt-in: shows/hides the "all recipes by this author" profile page other
  -- users reach by tapping their name. Never hides the name itself on their
  -- individual recipes/comments - those are already public either way.
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Safe to re-run against an already-deployed database that predates this column.
alter table profiles add column if not exists is_public boolean not null default false;

alter table profiles enable row level security;

create policy "select all profiles" on profiles for select using (true);
create policy "update own profile" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-creates a profile row for every new signup.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill profiles for accounts that signed up before this table existed.
insert into profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- ---------------------------------------------------------------------
-- Community recipes, ratings, comments
-- ---------------------------------------------------------------------

create table if not exists community_recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  prep_time_minutes int not null default 0,
  cook_time_minutes int not null default 0,
  servings int not null default 2,
  category text not null default 'sonstiges',
  difficulty text not null default 'medium',
  tags jsonb not null default '[]',
  ingredients jsonb not null default '[]',
  instructions jsonb not null default '[]',
  nutrition jsonb not null default '{"calories":0,"proteinGrams":0,"carbsGrams":0,"fatGrams":0}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table community_recipes enable row level security;

create policy "select all community recipes" on community_recipes
  for select using (true);
create policy "insert own community recipes" on community_recipes
  for insert with check (author_id = auth.uid());
create policy "update own community recipes" on community_recipes
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "delete own community recipes" on community_recipes
  for delete using (author_id = auth.uid());

-- Links a favorite back to the Community post it was published as (if any),
-- so later edits to the favorite can be pushed to that post too. Nullable -
-- most favorites are never published. Declared here (not alongside
-- favorite_recipes above) since it references community_recipes, which
-- doesn't exist yet at that point in a fresh run of this file.
alter table favorite_recipes add column if not exists community_recipe_id uuid references community_recipes(id) on delete set null;

-- Kitchen equipment needed to cook a recipe (Pfanne, Ofen, Air Fryer, Ninja
-- Creami, ...), so Community can be filtered/sorted by it. Safe to re-run.
alter table favorite_recipes add column if not exists required_equipment jsonb not null default '[]';
alter table community_recipes add column if not exists required_equipment jsonb not null default '[]';

-- Set when a favorite was saved from someone else's Community recipe (the
-- original author's id) - lets the app block re-publishing someone else's
-- recipe as your own. Never set for the user's own creations.
alter table favorite_recipes add column if not exists community_author_id uuid references auth.users(id) on delete set null;

create table if not exists community_recipe_ratings (
  recipe_id uuid not null references community_recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (recipe_id, user_id)
);

alter table community_recipe_ratings enable row level security;

-- Authors can't rate their own recipe, even if the app's own UI is bypassed.
create or replace function is_not_own_community_recipe(target_recipe_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select not exists (
    select 1 from community_recipes where id = target_recipe_id and author_id = auth.uid()
  );
$$;

create policy "select all ratings" on community_recipe_ratings for select using (true);
drop policy if exists "insert own rating" on community_recipe_ratings;
create policy "insert own rating" on community_recipe_ratings
  for insert with check (user_id = auth.uid() and is_not_own_community_recipe(recipe_id));
drop policy if exists "update own rating" on community_recipe_ratings;
create policy "update own rating" on community_recipe_ratings
  for update using (user_id = auth.uid()) with check (user_id = auth.uid() and is_not_own_community_recipe(recipe_id));
create policy "delete own rating" on community_recipe_ratings
  for delete using (user_id = auth.uid());

create table if not exists community_recipe_comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references community_recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table community_recipe_comments enable row level security;

create policy "select all comments" on community_recipe_comments for select using (true);
create policy "insert own comment" on community_recipe_comments
  for insert with check (user_id = auth.uid());
create policy "delete own comment" on community_recipe_comments
  for delete using (user_id = auth.uid());

-- Recipes with their aggregated rating - lets the app sort/filter by rating
-- without pulling every individual rating row down to the client.
-- Dropped and recreated (not "or replace") because cr.* means any column
-- added to community_recipes later would land in the middle of this view's
-- column list, which "create or replace view" refuses to do.
drop view if exists community_recipes_with_stats;
create view community_recipes_with_stats as
select
  cr.*,
  coalesce(avg(crr.rating), 0)::numeric(3,2) as avg_rating,
  count(crr.rating) as rating_count
from community_recipes cr
left join community_recipe_ratings crr on crr.recipe_id = cr.id
group by cr.id;

-- ---------------------------------------------------------------------
-- Storage (photos attached to published community recipes)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('community-recipe-images', 'community-recipe-images', true)
on conflict (id) do nothing;

-- Objects are stored as "<author_id>/<recipe_id>-<timestamp>.jpg".
create policy "select community recipe images" on storage.objects
  for select using (bucket_id = 'community-recipe-images');

create policy "authors can upload own community recipe images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'community-recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "authors can update own community recipe images" on storage.objects
  for update to authenticated
  using (bucket_id = 'community-recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "authors can delete own community recipe images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'community-recipe-images' and (storage.foldername(name))[1] = auth.uid()::text);
