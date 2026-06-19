# ROWAM School of Ministry — Enrollment Website

A student registration and admin management system for ROWAM (Raising Ordained World
Apostleship Missionaries). Built with React + Tailwind CSS on the frontend, and Supabase
(Postgres + Auth + Storage) on the backend.

## What's included

- **Public site** — home page, class timetable, and a multi-step enrollment application form
  matching the official ROWAM Student Enrollment Application Form (Sections A–F).
- **Student accounts** — applicants sign up with email + password, submit one application, and
  can return anytime to check their status, payment status, and reference number.
- **Admin panel** (hidden from students, not linked anywhere on the public site) — staff can:
  - Review every application in full detail
  - Approve / decline / reset application status
  - Assign a student reference number (e.g. `ROWAM/2026/0001`)
  - Mark registration payment as paid/unpaid
  - Capture a passport photo and thumbprint on-site using the device camera
  - Add/remove class timetable entries (date + course code + track)

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account/project.
2. Once your project is created, go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key
3. Go to the **SQL Editor** in the Supabase dashboard, open a new query, paste the **entire
   contents** of `supabase/schema.sql` from this project, and run it. This creates every table,
   security policy, and storage bucket needed, and seeds the June 2026 timetable.

## 2. Create the admin account

The admin login is **not a special account type during signup** — every signup becomes a
"student" by default, and you then manually promote one account to "admin" in the database.
This is intentional: it means there's no separate admin signup page that could be discovered or
abused.

1. Open your deployed (or locally running) site and go to `/signup`.
2. Sign up using the admin email and password you intend to use, for example:
   
   **⚠️ Change this password to something only you know before sharing the site publicly.**
3. In the Supabase **SQL Editor**, run:
   ```sql
   update public.profiles set role = 'admin' where email = 'admin@rowam.org';
   ```
4. Sign out and sign back in. You'll now be redirected to `/admin` automatically, and the
   "Admin panel" link will appear in your header instead of "My application".

You can promote additional staff accounts the same way later.

## 3. Configure environment variables

Copy `.env.example` to `.env` in the project root and fill in your Supabase values:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 4. Run locally

```bash
npm install
npm run dev
```

Visit the URL shown in your terminal (typically `http://localhost:5173`).

> **Note on camera capture:** browsers only allow camera access (`getUserMedia`) on `https://`
> or `localhost`. It will not work if you open the site over plain `http://` on a phone using
> your computer's local IP — use the deployed HTTPS URL for real on-site captures.

## 5. Deploy

The fastest path is **Vercel** (or Netlify — steps are nearly identical):

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New → Project**, then import
   your repository.
3. Vercel will auto-detect this as a Vite project. Before deploying, add your environment
   variables under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. You'll get a live `https://your-project.vercel.app` URL within a couple of
   minutes.
5. Repeat the admin promotion step (Section 2 above) against your live URL if you haven't
   already created the admin account.

### Optional: custom domain

Once deployed, you can attach a custom domain (e.g. `apply.rowam.org`) under your Vercel
project's **Settings → Domains** tab, following Vercel's DNS instructions.

## How the on-site capture works

Since you confirmed no dedicated fingerprint scanner hardware will be used, "thumbprint
capture" is implemented as a second photograph (e.g. of an inked or pressed thumbprint on
paper), taken the same way as the passport photo — using whatever device (phone, tablet,
laptop) the admin is using at the centre. Both images are stored privately in Supabase
Storage and linked to the student's record; only admins (and the student, for their own photo)
can view them.

If you later acquire dedicated fingerprint scanner hardware, that would require a different,
more involved integration (a scanner SDK/driver bridge) — let your developer know if that
becomes a requirement.

## Project structure

```
src/
  components/    Shared UI: header, footer, form fields, status pills, route guards
  context/       AuthContext — tracks signed-in user and student/admin role
  pages/         Public pages: home, timetable, signup, login, apply, dashboard
  admin/         Admin-only: layout, applications list, student detail + capture, timetable
  lib/           Supabase client setup
supabase/
  schema.sql     Full database schema, RLS policies, and storage bucket setup — run this once
```

## Known limitations / next steps

These were intentionally scoped out of the same-day build — see the chat for the original
discussion:

- **Payments** are manual only (admin marks paid/unpaid after WhatsApp/bank confirmation).
  Online payment (e.g. Paystack) can be added later.
- **No automated notifications** (email/SMS) are sent on status changes — students must check
  their dashboard manually.
- **No ID card / certificate generation** yet.
- Retaking a photo/thumbprint uploads a new file rather than deleting the old one from storage,
  so old captures become orphaned (harmless, but uses extra storage over time).
