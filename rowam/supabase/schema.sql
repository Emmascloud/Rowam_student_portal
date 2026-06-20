-- ============================================================================
-- ROWAM School of Ministry — Database Schema
-- Run this entire file in the Supabase SQL Editor (Project > SQL Editor > New query)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Mirrors auth.users, adds a `role` column so we can tell students from admins.
-- A row is auto-created here whenever someone signs up (see trigger below).
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each user can read their own profile row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Helper function: checks if the current user is an admin.
-- SECURITY DEFINER means this function runs with the privileges of its
-- owner (bypassing RLS internally), which is what lets it safely check
-- the profiles table without triggering profiles' own RLS policies again.
-- This is what avoids the "infinite recursion detected in policy for
-- relation profiles" error you'd get from a policy on `profiles` querying
-- `profiles` directly.
create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public stable;

-- Admins can read every profile (needed so the admin panel can tell who's who)
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'student');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 2. STUDENTS TABLE
-- One row per enrollment application — maps directly to the paper form.
-- ----------------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  -- Office use
  student_ref text unique,              -- e.g. ROWAM/2026/0001, assigned by admin on approval
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  payment_marked_by uuid references auth.users(id),
  payment_marked_at timestamptz,

  -- Programme / track selection
  track text not null check (track in ('evangelists', 'pastors', 'apostles')),

  -- Section A — Personal details
  surname text not null,
  first_name text not null,
  gender text not null check (gender in ('male', 'female')),
  age int not null,
  above_15 boolean not null,
  marital_status text not null check (marital_status in ('single', 'married', 'other')),
  marital_status_other text,
  nationality text not null,
  home_address text not null,
  state_lga text not null,
  occupation text,
  telephone text,
  mobile_number text not null,
  email_address text not null,

  -- Section B — Spiritual background
  born_again boolean not null,
  born_again_when text,
  born_again_where text,
  current_church text,
  church_address text,
  pastor_name text,
  pastor_phone text,
  ministry_role text,

  -- Section C — Educational background (stored as jsonb array of
  -- { level, school_name_address, dates_from_to, certificate_qualification })
  education jsonb not null default '[]'::jsonb,

  -- Section D — Emergency / next of kin
  kin_full_name text not null,
  kin_relationship text not null,
  kin_phone text not null,
  kin_email text,

  -- Section E — How did you hear about ROWAM
  heard_about text not null check (
    heard_about in ('social_media', 'church_announcement', 'flyer_poster', 'friend_family', 'website_online', 'other')
  ),
  heard_about_other text,

  -- Section F — Declaration
  declaration_agreed boolean not null default false,
  declaration_date date not null default current_date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students enable row level security;

-- Students can view their own application
create policy "Students can view own application"
  on public.students for select
  using (auth.uid() = user_id);

-- Students can insert their own application.
-- (The "unique" constraint on user_id above is what actually enforces
-- one application per account; this policy just scopes inserts to self.)
create policy "Students can insert own application"
  on public.students for insert
  with check (auth.uid() = user_id);

-- Students can update their own application ONLY while it is still pending
-- (prevents editing after admin has approved/declined)
create policy "Students can update own pending application"
  on public.students for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

-- Admins can view all applications
create policy "Admins can view all applications"
  on public.students for select
  using (
    public.is_admin()
  );

-- Admins can update any application (approve/decline/assign ref/mark payment)
create policy "Admins can update all applications"
  on public.students for update
  using (
    public.is_admin()
  );

-- Keep updated_at fresh
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger students_set_updated_at
  before update on public.students
  for each row execute procedure public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 3. CAPTURES TABLE
-- Passport photo + thumbprint photo, captured on-site by an admin.
-- Stores paths into the 'captures' storage bucket, not the files themselves.
-- ----------------------------------------------------------------------------
create table public.captures (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  photo_path text,
  thumbprint_path text,
  captured_by uuid references auth.users(id),
  captured_at timestamptz not null default now(),
  unique (student_id)
);

alter table public.captures enable row level security;

create policy "Students can view own capture"
  on public.captures for select
  using (
    exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
  );

create policy "Admins can view all captures"
  on public.captures for select
  using (
    public.is_admin()
  );

create policy "Admins can insert captures"
  on public.captures for insert
  with check (
    public.is_admin()
  );

create policy "Admins can update captures"
  on public.captures for update
  using (
    public.is_admin()
  );


-- ----------------------------------------------------------------------------
-- 4. TIMETABLE TABLE
-- Admin-editable schedule: date + course code + track + cohort label.
-- ----------------------------------------------------------------------------
create table public.timetable (
  id uuid primary key default gen_random_uuid(),
  cohort_label text not null default 'JUNE 2026',
  class_date date not null,
  course_code text not null,
  track text check (track in ('evangelists', 'pastors', 'apostles', 'all')) default 'all',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.timetable enable row level security;

-- Anyone (including anonymous visitors) can view the timetable — it's public info
create policy "Anyone can view timetable"
  on public.timetable for select
  using (true);

create policy "Admins can manage timetable"
  on public.timetable for all
  using (
    public.is_admin()
  )
  with check (
    public.is_admin()
  );

-- Seed the known June 2026 timetable from the original schedule
insert into public.timetable (cohort_label, class_date, course_code, track) values
  ('JUNE 2026', '2026-06-18', 'TSC 001', 'all'),
  ('JUNE 2026', '2026-06-21', 'PRC 001', 'all'),
  ('JUNE 2026', '2026-06-25', 'PFP 001', 'all'),
  ('JUNE 2026', '2026-06-28', 'CDC 001', 'all');


-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKET for captures (photo + thumbprint images)
-- Private bucket — only accessible via signed URLs / authenticated requests.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('captures', 'captures', false)
on conflict (id) do nothing;

-- Admins can upload/read/update files in the captures bucket
create policy "Admins can upload captures"
  on storage.objects for insert
  with check (
    bucket_id = 'captures'
    and public.is_admin()
  );

create policy "Admins can read captures"
  on storage.objects for select
  using (
    bucket_id = 'captures'
    and public.is_admin()
  );

create policy "Admins can update captures"
  on storage.objects for update
  using (
    bucket_id = 'captures'
    and public.is_admin()
  );

-- Students can view their own capture files (e.g. their own photo)
create policy "Students can read own capture files"
  on storage.objects for select
  using (
    bucket_id = 'captures'
    and exists (
      select 1 from public.captures c
      join public.students s on s.id = c.student_id
      where s.user_id = auth.uid()
      and (storage.foldername(name))[1] = c.student_id::text
    )
  );


-- ----------------------------------------------------------------------------
-- 6. PROMOTE YOUR FIRST ADMIN
-- After you sign up through the app once with the admin email
-- (admin@rowam.org), run this to promote that account to admin role:
--
--   update public.profiles set role = 'admin' where email = 'admin@rowam.org';
--
-- ----------------------------------------------------------------------------
