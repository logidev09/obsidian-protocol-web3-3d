-- OBSIDIAN Protocol — initial schema
-- Jalankan di SQL Editor project Supabase BARU (jangan di project lain).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text,
  chain text check (chain in ('ethereum','solana','email')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by owner" on public.profiles;
create policy "profiles readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles updatable by owner" on public.profiles;
create policy "profiles updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles insertable by owner" on public.profiles;
create policy "profiles insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Waitlist / early access (public insert, tidak bisa dibaca publik)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wallet_address text,
  chain text,
  source text default 'site',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "anyone can join waitlist" on public.waitlist;
create policy "anyone can join waitlist"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Auto-provision profile saat user baru dibuat (termasuk login via wallet)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, wallet_address, chain)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'address', new.raw_user_meta_data ->> 'custom_claims'),
    case
      when new.raw_user_meta_data ->> 'chain' is not null then new.raw_user_meta_data ->> 'chain'
      when new.email is not null then 'email'
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
