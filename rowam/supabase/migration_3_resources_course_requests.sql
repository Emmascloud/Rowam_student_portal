-- ============================================================================
-- ROWAM School of Ministry — Migration 3
-- Adds: resources (files + links) and student course self-registration requests
--
-- Run AFTER migration_2_courses_notifications.sql in the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RESOURCES TABLE
-- Admin can publish resources: PDF files (stored in Supabase Storage) or
-- external links (YouTube, Google Drive, etc.). Each resource is optionally
-- scoped to one or more tracks, or visible to all students.
-- ----------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null check (type in ('file', 'link')),
  url text,                           -- for type = 'link'
  file_path text,                     -- for type = 'file', path in 'resources' storage bucket
  track text check (track in ('evangelists', 'pastors', 'apostles', 'all')) default 'all',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

-- All enrolled (approved) students can view resources
create policy "Approved students can view resources"
  on public.resources for select
  using (
    exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
      and s.status = 'approved'
      and (public.resources.track = 'all' or public.resources.track = s.track)
    )
  );

create policy "Admins can manage resources"
  on public.resources for all
  using (public.is_admin())
  with check (public.is_admin());


-- ----------------------------------------------------------------------------
-- 2. COURSE_REQUESTS TABLE
-- Students can request to be enrolled in a course. Admin approves/declines.
-- When approved, a matching student_courses row is automatically created
-- via a trigger, so approval is the single source of truth.
-- ----------------------------------------------------------------------------
create table public.course_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  timetable_id uuid not null references public.timetable(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  student_note text,
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, timetable_id)
);

alter table public.course_requests enable row level security;

create policy "Students can view own course requests"
  on public.course_requests for select
  using (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Students can submit course requests"
  on public.course_requests for insert
  with check (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Admins can view all course requests"
  on public.course_requests for select
  using (public.is_admin());

create policy "Admins can update course requests"
  on public.course_requests for update
  using (public.is_admin());

-- When admin approves a course request, automatically create the
-- student_courses enrollment row (if it doesn't already exist).
create function public.handle_course_request_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status != 'approved' then
    insert into public.student_courses (student_id, timetable_id, assigned_by)
    values (new.student_id, new.timetable_id, new.reviewed_by)
    on conflict (student_id, timetable_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_course_request_approved
  after update on public.course_requests
  for each row execute procedure public.handle_course_request_approval();


-- ----------------------------------------------------------------------------
-- 3. STORAGE BUCKET for resources (PDF files)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

create policy "Admins can upload resources"
  on storage.objects for insert
  with check (bucket_id = 'resources' and public.is_admin());

create policy "Admins can read resources"
  on storage.objects for select
  using (bucket_id = 'resources' and public.is_admin());

create policy "Admins can delete resources"
  on storage.objects for delete
  using (bucket_id = 'resources' and public.is_admin());

-- Approved students can read resource files scoped to their track or 'all'
create policy "Approved students can read resource files"
  on storage.objects for select
  using (
    bucket_id = 'resources'
    and exists (
      select 1 from public.students s
      where s.user_id = auth.uid()
      and s.status = 'approved'
    )
  );

-- ============================================================================
-- End of Migration 3
-- ============================================================================
