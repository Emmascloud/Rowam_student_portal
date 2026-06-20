-- ============================================================================
-- ROWAM School of Ministry — Migration 2
-- Adds: student course enrollment, profile self-edit support, and
-- admin-to-student notifications (targeted or broadcast).
--
-- This is a standalone migration — run it AFTER schema.sql in the Supabase
-- SQL Editor. It does not repeat anything from schema.sql, so it's safe to
-- run on a project that already has the original schema applied.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STUDENT_COURSES TABLE
-- Links a student to one or more timetable entries (their assigned course
-- codes). A student can be enrolled in multiple courses over their track.
-- ----------------------------------------------------------------------------
create table public.student_courses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  timetable_id uuid not null references public.timetable(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  unique (student_id, timetable_id)
);

alter table public.student_courses enable row level security;

create policy "Students can view own courses"
  on public.student_courses for select
  using (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Admins can view all student courses"
  on public.student_courses for select
  using (public.is_admin());

create policy "Admins can assign courses"
  on public.student_courses for insert
  with check (public.is_admin());

create policy "Admins can remove course assignments"
  on public.student_courses for delete
  using (public.is_admin());


-- ----------------------------------------------------------------------------
-- 2. ALLOW STUDENTS TO EDIT LIMITED CONTACT FIELDS
-- The original "Students can update own pending application" policy only
-- allowed edits while status = 'pending'. We now allow students to update
-- contact fields at any time (pending, approved, or declined), since this
-- is just keeping their contact details current — not re-editing their
-- application content. Column-level restriction (which fields they may
-- change) is enforced in the application layer, not in SQL.
-- ----------------------------------------------------------------------------
drop policy "Students can update own pending application" on public.students;

create policy "Students can update own contact details"
  on public.students for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. NOTIFICATIONS TABLE
-- Messages sent by admin. student_id = a specific student; null = broadcast
-- to all students.
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade, -- null = broadcast to all
  title text not null,
  body text not null,
  sent_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Students can see notifications addressed to them OR broadcast (student_id is null)
create policy "Students can view own and broadcast notifications"
  on public.notifications for select
  using (
    student_id is null
    or exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Admins can view all notifications"
  on public.notifications for select
  using (public.is_admin());

create policy "Admins can send notifications"
  on public.notifications for insert
  with check (public.is_admin());

create policy "Admins can delete notifications"
  on public.notifications for delete
  using (public.is_admin());


-- ----------------------------------------------------------------------------
-- 4. READ TRACKING (optional but useful) — per-student read state for
-- broadcast notifications, since a single broadcast row is shared by everyone
-- and we can't mark the row itself "read" without affecting all students.
-- ----------------------------------------------------------------------------
create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, student_id)
);

alter table public.notification_reads enable row level security;

create policy "Students can view own read receipts"
  on public.notification_reads for select
  using (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Students can mark own notifications read"
  on public.notification_reads for insert
  with check (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Admins can view all read receipts"
  on public.notification_reads for select
  using (public.is_admin());

-- ============================================================================
-- End of Migration 2
-- ============================================================================
