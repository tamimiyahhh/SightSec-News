-- Run this in the Supabase SQL Editor
create table if not exists favorites (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  source text,
  image text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- Upgrade the original shared favorites table without deleting existing rows.
alter table favorites
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table favorites drop constraint if exists favorites_url_key;
create unique index if not exists favorites_user_id_url_key on favorites (user_id, url);

alter table favorites enable row level security;
drop policy if exists "demo full access" on favorites;
drop policy if exists "users read own favorites" on favorites;
drop policy if exists "users add own favorites" on favorites;
drop policy if exists "users update own favorites" on favorites;
drop policy if exists "users delete own favorites" on favorites;

create policy "users read own favorites" on favorites
  for select to authenticated using (auth.uid() = user_id);
create policy "users add own favorites" on favorites
  for insert to authenticated with check (auth.uid() = user_id);
create policy "users update own favorites" on favorites
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own favorites" on favorites
  for delete to authenticated using (auth.uid() = user_id);
