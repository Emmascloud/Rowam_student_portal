import { useEffect, useState, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'
import { TextField, TextAreaField } from '../components/FormFields'

const TRACK_LABELS = {
  evangelists: 'Evangelists Track',
  pastors: 'Pastors Track',
  apostles: 'Apostles Track',
}

const STATUS_COPY = {
  pending: 'Your application is being reviewed by ROWAM staff. We will be in touch once a decision is made.',
  approved: 'Your application has been approved. Please visit the ROWAM centre to complete your photo capture and registration payment if you haven\'t already.',
  declined: 'Your application was not approved at this time. Please contact ROWAM on 0816 472 0718 for more information.',
}

const EDITABLE_FIELDS = ['telephone', 'mobile_number', 'email_address', 'home_address', 'state_lga']

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [student, setStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (studentError) {
      setError('Could not load your application. Please refresh the page.')
      setLoading(false)
      return
    }

    setStudent(studentData)

    if (studentData) {
      const [{ data: courseRows }, { data: notifRows }, { data: readRows }] = await Promise.all([
        supabase
          .from('student_courses')
          .select('id, timetable:timetable_id (id, class_date, course_code, cohort_label, track)')
          .eq('student_id', studentData.id),
        supabase
          .from('notifications')
          .select('*')
          .or(`student_id.eq.${studentData.id},student_id.is.null`)
          .order('created_at', { ascending: false }),
        supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('student_id', studentData.id),
      ])

      setCourses(courseRows || [])
      setNotifications(notifRows || [])
      setReadIds(new Set((readRows || []).map((r) => r.notification_id)))
    }

    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function markRead(notificationId) {
    if (!student || readIds.has(notificationId)) return
    const { error } = await supabase
      .from('notification_reads')
      .insert({ notification_id: notificationId, student_id: student.id })
    if (!error) {
      setReadIds((prev) => new Set(prev).add(notificationId))
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-navy-500">Loading…</div>
  }

  if (error) {
    return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-rose-600">{error}</div>
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-navy-900">No application yet</h1>
        <p className="mt-3 text-navy-600">You haven't started your ROWAM enrollment application.</p>
        <Link to="/apply" className="btn-gold mt-6 inline-flex">Start application</Link>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      {location.state?.justSubmitted && (
        <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your application has been submitted successfully.
        </div>
      )}

      <p className="label-eyebrow">My application</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">
        {student.first_name} {student.surname}
      </h1>

      <div className="card mt-7 p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-navy-500">Status</div>
            <div className="mt-1.5"><StatusPill value={student.status} /></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-navy-500">Payment</div>
            <div className="mt-1.5"><StatusPill value={student.payment_status} /></div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-navy-500">Student ref.</div>
            <div className="mt-1.5 font-display text-lg text-navy-900">
              {student.student_ref || 'Not yet assigned'}
            </div>
          </div>
        </div>

        <p className="mt-6 border-t border-navy-100 pt-5 text-sm leading-relaxed text-navy-600">
          {STATUS_COPY[student.status]}
        </p>
      </div>

      <MyCourses courses={courses} />

      <Inbox notifications={notifications} readIds={readIds} onOpen={markRead} unreadCount={unreadCount} />

      <ProfileSummaryAndEdit student={student} onSaved={(updated) => setStudent(updated)} />

      <p className="mt-6 text-center text-sm text-navy-500">
        Questions about your application? Call <a href="tel:+2348164720718" className="font-semibold text-navy-800">0816 472 0718</a>.
      </p>
    </div>
  )
}

function MyCourses({ courses }) {
  return (
    <div className="card mt-6 p-7">
      <h2 className="font-display text-lg font-semibold text-navy-900">My courses</h2>
      {courses.length === 0 ? (
        <p className="mt-3 text-sm text-navy-500">
          No courses have been assigned to you yet. Courses are assigned by ROWAM staff once your
          enrollment is confirmed.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-navy-50">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <div className="font-semibold text-navy-900">{c.timetable?.course_code}</div>
                <div className="text-navy-500">{c.timetable?.cohort_label}</div>
              </div>
              <div className="text-right text-navy-600">
                {c.timetable?.class_date && new Date(c.timetable.class_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Inbox({ notifications, readIds, onOpen, unreadCount }) {
  const [expandedId, setExpandedId] = useState(null)

  function toggle(n) {
    const opening = expandedId !== n.id
    setExpandedId(opening ? n.id : null)
    if (opening) onOpen(n.id)
  }

  return (
    <div className="card mt-6 p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-navy-900">Inbox</h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-gold-500 px-2.5 py-0.5 text-xs font-semibold text-navy-900">
            {unreadCount} new
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-3 text-sm text-navy-500">No messages yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-navy-50">
          {notifications.map((n) => {
            const isRead = readIds.has(n.id)
            const isOpen = expandedId === n.id
            return (
              <button
                key={n.id}
                onClick={() => toggle(n)}
                className="block w-full py-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />}
                    <div>
                      <div className={`text-sm ${isRead ? 'font-medium text-navy-700' : 'font-semibold text-navy-900'}`}>
                        {n.title}
                      </div>
                      {n.student_id === null && (
                        <span className="text-[11px] uppercase tracking-wide text-navy-400">Broadcast</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-navy-400">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-2 pl-4 text-sm leading-relaxed text-navy-600">{n.body}</p>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProfileSummaryAndEdit({ student, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    telephone: student.telephone || '',
    mobile_number: student.mobile_number || '',
    email_address: student.email_address || '',
    home_address: student.home_address || '',
    state_lga: student.state_lga || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedNotice, setSavedNotice] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const payload = {}
    EDITABLE_FIELDS.forEach((f) => { payload[f] = form[f]?.trim() || null })

    const { data, error: updateError } = await supabase
      .from('students')
      .update(payload)
      .eq('id', student.id)
      .select('*')
      .single()

    setSaving(false)

    if (updateError) {
      setError(updateError.message || 'Could not save your changes. Please try again.')
      return
    }

    onSaved(data)
    setEditing(false)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 3000)
  }

  return (
    <div className="card mt-6 p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-navy-900">Application summary</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-navy-700 hover:text-navy-900">
            Edit contact info
          </button>
        )}
      </div>

      {savedNotice && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Your contact details have been updated.
        </div>
      )}

      {!editing ? (
        <dl className="mt-4 divide-y divide-navy-50 text-sm">
          <Row label="Track" value={TRACK_LABELS[student.track]} />
          <Row label="Telephone" value={student.telephone} />
          <Row label="Mobile number" value={student.mobile_number} />
          <Row label="Email" value={student.email_address} />
          <Row label="State / LGA" value={student.state_lga} />
          <Row label="Home address" value={student.home_address} />
          <Row label="Submitted" value={new Date(student.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
        </dl>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-navy-500">
            You can update your contact details below. Your name, track, and other application details
            can only be changed by ROWAM staff.
          </p>
          <TextField label="Telephone" type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} />
          <TextField label="Mobile number" required type="tel" value={form.mobile_number} onChange={(e) => update('mobile_number', e.target.value)} />
          <TextField label="Email address" required type="email" value={form.email_address} onChange={(e) => update('email_address', e.target.value)} />
          <TextField label="State / LGA" value={form.state_lga} onChange={(e) => update('state_lga', e.target.value)} />
          <TextAreaField label="Home address" value={form.home_address} onChange={(e) => update('home_address', e.target.value)} />

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-navy-500">{label}</dt>
      <dd className="font-medium text-navy-900">{value || '—'}</dd>
    </div>
  )
}
