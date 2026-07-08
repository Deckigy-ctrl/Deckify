-- Deckify: per-user server persistence for presentations.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- Safe to re-run: everything is IF NOT EXISTS / DROP-then-CREATE.

create table if not exists public.decks (
  id          text        not null,             -- client deck id, e.g. 'deck_1699...'
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text,
  theme       text,
  data        jsonb       not null,             -- the full SavedDeck (slides, tray, imageMeta, ...)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists decks_user_updated_idx on public.decks (user_id, updated_at desc);

alter table public.decks enable row level security;

-- Each user can only see and mutate their own decks.
drop policy if exists decks_select_own on public.decks;
create policy decks_select_own on public.decks for select using (auth.uid() = user_id);

drop policy if exists decks_insert_own on public.decks;
create policy decks_insert_own on public.decks for insert with check (auth.uid() = user_id);

drop policy if exists decks_update_own on public.decks;
create policy decks_update_own on public.decks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists decks_delete_own on public.decks;
create policy decks_delete_own on public.decks for delete using (auth.uid() = user_id);
