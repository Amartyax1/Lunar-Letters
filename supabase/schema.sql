-- Lunar Letters mailbox.
-- Run this whole script in the Supabase SQL editor.
--
-- Authors can create, read, update, and delete their own letters and circles.
-- A signed-in user can also read a sent letter when their email is listed in
-- that letter's circle member_emails and they did not write the letter.
--
-- scheduleLetter stores scheduled_for as the 1st of the next UTC month
-- (the next calendar day-1). Each list call marks that author's scheduled
-- letters as sent when scheduled_for is today or earlier in UTC.

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  member_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_id uuid references public.circles (id) on delete set null,
  title text not null default '',
  body text not null default '',
  paper_color text not null default '#fafaf8',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  scheduled_for date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint letters_schedule_shape check (
    (status = 'draft' and scheduled_for is null and sent_at is null)
    or (status = 'scheduled' and scheduled_for is not null and sent_at is null)
    or (status = 'sent' and sent_at is not null)
  )
);

create index if not exists circles_owner_idx on public.circles (owner_id);
create index if not exists circles_member_emails_idx on public.circles using gin (member_emails);
create index if not exists letters_user_status_idx on public.letters (user_id, status);
create index if not exists letters_due_idx on public.letters (scheduled_for) where status = 'scheduled';

create or replace function public.normalize_circle_emails()
returns trigger
language plpgsql
as $$
begin
  new.member_emails := coalesce(
    (
      select array_agg(distinct lower(btrim(email)))
      from unnest(coalesce(new.member_emails, array[]::text[])) as email
      where btrim(email) <> ''
    ),
    array[]::text[]
  );
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.set_letter_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists circles_normalize_emails on public.circles;
create trigger circles_normalize_emails
before insert or update on public.circles
for each row
execute function public.normalize_circle_emails();

drop trigger if exists letters_set_updated_at on public.letters;
create trigger letters_set_updated_at
before update on public.letters
for each row
execute function public.set_letter_updated_at();

alter table public.circles enable row level security;
alter table public.letters enable row level security;

drop policy if exists "authors manage own circles" on public.circles;
create policy "authors manage own circles"
on public.circles
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "members read their circles" on public.circles;
create policy "members read their circles"
on public.circles
for select
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = any (
    select lower(email) from unnest(member_emails) as email
  )
);

-- Checks the caller's email against a circle without depending on circles RLS,
-- so a recipient can match a letter even though they do not own the circle.
create or replace function public.circle_includes_viewer(target_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circles as c
    where c.id = target_circle
      and lower(coalesce(auth.jwt() ->> 'email', '')) = any (
        select lower(email) from unnest(c.member_emails) as email
      )
  );
$$;

revoke all on function public.circle_includes_viewer(uuid) from public;
revoke all on function public.circle_includes_viewer(uuid) from anon;
grant execute on function public.circle_includes_viewer(uuid) to authenticated;

drop policy if exists "authors manage own letters" on public.letters;
create policy "authors manage own letters"
on public.letters
for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    circle_id is null
    or exists (
      select 1
      from public.circles as owned
      where owned.id = letters.circle_id
        and owned.owner_id = auth.uid()
    )
  )
);

drop policy if exists "recipients read sent letters" on public.letters;
create policy "recipients read sent letters"
on public.letters
for select
to authenticated
using (
  status = 'sent'
  and user_id is distinct from auth.uid()
  and circle_id is not null
  and public.circle_includes_viewer(circle_id)
);

revoke all on table public.circles from anon;
revoke all on table public.letters from anon;
grant select, insert, update, delete on table public.circles to authenticated;
grant select, insert, update, delete on table public.letters to authenticated;

notify pgrst, 'reload schema';
