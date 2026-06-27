-- ============================================================================
-- ROWAM School of Ministry — Migration 4 (Jitsi version)
-- Adds: live_sessions table using Jitsi Meet for embedded video calls
--
-- Run AFTER migration_3_resources_course_requests.sql
-- If you already ran a previous version of migration_4, run this first:
--   drop table if exists public.live_sessions cascade;
-- Then run this file.
-- ============================================================================

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  scheduled_at timestamptz not null,

  -- Jitsi room settings
  room_name text not null unique,     -- e.g. "rowam-week3-pastors" (no spaces)
  room_password text,                 -- optional password for the room

  is_live boolean not null default false,  -- admin flips this to open the room to students
  track text check (track in ('evangelists', 'pastors', 'apostles', 'all')) default 'all',

  -- After class: admin pastes a recording link (Google Drive, YouTube, etc.)
  recording_url text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.live_sessions enable row level security;

-- Approved students can see sessions for their track
create policy "Approved students can view live sessions"
  on public.live_sessions for select
  using (
    exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
      and s.status = 'approved'
      and (live_sessions.track = 'all' or live_sessions.track = s.track)
    )
  );

create policy "Admins can manage live sessions"
  on public.live_sessions for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger live_sessions_set_updated_at
  before update on public.live_sessions
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- End of Migration 4
-- ============================================================================
