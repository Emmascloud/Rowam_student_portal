import { useEffect, useState, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import { TextField, SelectField, TextAreaField } from '../components/FormFields'

const TRACK_LABELS = { evangelists: 'Evangelists Track', pastors: 'Pastors Track', apostles: 'Apostles Track' }
const STATUS_COPY = {
  pending:  'Your application is under review. We will be in touch once a decision is made.',
  approved: 'Congratulations — your application has been approved! Please visit the ROWAM centre to complete your photo capture and registration payment.',
  declined: 'Your application was not approved at this time. Please call 0816 472 0718 for more information.',
}
const EDITABLE_FIELDS = [
  { key: 'surname', label: 'Surname', required: true },
  { key: 'first_name', label: 'First name', required: true },
  { key: 'telephone', label: 'Telephone', type: 'tel' },
  { key: 'mobile_number', label: 'Mobile number', required: true, type: 'tel' },
  { key: 'email_address', label: 'Email address', required: true, type: 'email' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'state_lga', label: 'State / LGA' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'home_address', label: 'Home address', type: 'textarea', span: 2 },
  { key: 'current_church', label: 'Current church', span: 2 },
  { key: 'pastor_name', label: 'Pastor / overseer name' },
  { key: 'pastor_phone', label: "Pastor's phone" },
]

const TABS = ['Overview', 'Courses', 'Resources', 'Inbox']

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [tab, setTab] = useState('Overview')
  const [student, setStudent] = useState(null)
  const [courses, setCourses] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [courseRequests, setCourseRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(new Set())
  const [resources, setResources] = useState([])
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: studentData, error: studentError } = await supabase
      .from('students').select('*').eq('user_id', user.id).maybeSingle()

    if (studentError) { setError('Could not load your application.'); setLoading(false); return }
    setStudent(studentData)

    if (studentData) {
      const [
        { data: courseRows }, { data: allCourseRows }, { data: requestRows },
        { data: notifRows }, { data: readRows }, { data: captureRow }, { data: resourceRows }
      ] = await Promise.all([
        supabase.from('student_courses')
          .select('id, timetable_id, timetable:timetable_id (id, class_date, course_code, cohort_label, track)')
          .eq('student_id', studentData.id),
        supabase.from('timetable').select('*').order('class_date', { ascending: true }),
        supabase.from('course_requests').select('*').eq('student_id', studentData.id),
        supabase.from('notifications').select('*')
          .or(`student_id.eq.${studentData.id},student_id.is.null`)
          .order('created_at', { ascending: false }),
        supabase.from('notification_reads').select('notification_id').eq('student_id', studentData.id),
        supabase.from('captures').select('photo_path').eq('student_id', studentData.id).maybeSingle(),
        studentData.status === 'approved'
          ? supabase.from('resources').select('*').order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ])

      setCourses(courseRows || [])
      setAllCourses(allCourseRows || [])
      setCourseRequests(requestRows || [])
      setNotifications(notifRows || [])
      setReadIds(new Set((readRows || []).map((r) => r.notification_id)))
      setResources(resourceRows || [])

      if (captureRow?.photo_path) {
        const { data: signed } = await supabase.storage.from('captures').createSignedUrl(captureRow.photo_path, 3600)
        setAvatarUrl(signed?.signedUrl || null)
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function markRead(notificationId) {
    if (!student || readIds.has(notificationId)) return
    const { error } = await supabase.from('notification_reads')
      .insert({ notification_id: notificationId, student_id: student.id })
    if (!error) setReadIds((prev) => new Set(prev).add(notificationId))
  }

  async function requestCourse(timetableId) {
    if (!student) return
    const { data, error } = await supabase.from('course_requests')
      .insert({ student_id: student.id, timetable_id: timetableId })
      .select('*').single()
    if (!error) setCourseRequests((prev) => [...prev, data])
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-4 text-charcoal-400">Loading your portal…</p>
      </div>
    )
  }

  if (error) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-rose-500">{error}</div>

  if (!student) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <div className="font-display text-5xl text-charcoal-200 mb-4">✦</div>
        <h1 className="font-display text-2xl font-semibold text-charcoal-900">No application yet</h1>
        <p className="mt-3 text-charcoal-500">You haven't started your ROWAM enrollment application.</p>
        <Link to="/apply" className="btn-indigo mt-6 inline-flex">Start application →</Link>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length
  const enrolledIds = new Set(courses.map((c) => c.timetable_id))
  const requestedIds = new Set(courseRequests.map((r) => r.timetable_id))
  const availableCourses = allCourses.filter((t) => !enrolledIds.has(t.id) && !requestedIds.has(t.id))

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero header */}
      <div className="bg-charcoal-950 pb-0">
        <div className="mx-auto max-w-4xl px-5 pt-10 pb-16">
          {location.state?.justSubmitted && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-400">
              ✓ Application submitted successfully.
            </div>
          )}

          <div className="flex items-end gap-5">
            <Avatar url={avatarUrl} firstName={student.first_name} surname={student.surname} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="eyebrow text-indigo-400">Student Portal</div>
              <h1 className="mt-1.5 font-display text-3xl font-semibold text-white truncate">
                {student.first_name} {student.surname}
              </h1>
              <p className="mt-1 text-charcoal-400 text-sm">{TRACK_LABELS[student.track]}</p>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="mt-7 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-charcoal-900 p-4">
              <div className="text-[10px] uppercase tracking-widest text-charcoal-500">Status</div>
              <div className="mt-1.5"><StatusPill value={student.status} /></div>
            </div>
            <div className="rounded-2xl bg-charcoal-900 p-4">
              <div className="text-[10px] uppercase tracking-widest text-charcoal-500">Payment</div>
              <div className="mt-1.5"><StatusPill value={student.payment_status} /></div>
            </div>
            <div className="rounded-2xl bg-charcoal-900 p-4">
              <div className="text-[10px] uppercase tracking-widest text-charcoal-500">Ref. No.</div>
              <div className="mt-1.5 font-display text-sm font-semibold text-white truncate">
                {student.student_ref || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar — overlaps into cream section */}
        <div className="mx-auto max-w-4xl px-5">
          <div className="flex gap-0 border-b border-charcoal-800">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500'
                    : 'text-charcoal-500 hover:text-charcoal-300'
                }`}
              >
                {t}
                {t === 'Inbox' && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-4xl px-5 py-8">
        {tab === 'Overview' && (
          <OverviewTab student={student} statusCopy={STATUS_COPY} onSaved={setStudent} />
        )}
        {tab === 'Courses' && (
          <CoursesTab
            courses={courses}
            courseRequests={courseRequests}
            availableCourses={availableCourses}
            onRequest={requestCourse}
          />
        )}
        {tab === 'Resources' && <ResourcesTab resources={resources} approved={student.status === 'approved'} />}
        {tab === 'Inbox' && (
          <InboxTab notifications={notifications} readIds={readIds} onOpen={markRead} />
        )}
      </div>
    </div>
  )
}

// ---------- Overview tab ----------
function OverviewTab({ student, statusCopy, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(buildForm(student))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function buildForm(s) {
    const f = {}
    EDITABLE_FIELDS.forEach(({ key }) => { f[key] = s[key] ?? '' })
    return f
  }

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSave() {
    setSaving(true); setError('')
    const payload = {}
    EDITABLE_FIELDS.forEach(({ key }) => { payload[key] = form[key]?.toString().trim() || null })
    const { data, error: e } = await supabase.from('students')
      .update(payload).eq('id', student.id).select('*').single()
    setSaving(false)
    if (e) { setError(e.message); return }
    onSaved(data); setEditing(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-2xl p-5 ${
        student.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' :
        student.status === 'declined' ? 'bg-rose-50 border border-rose-200' :
        'bg-amber-50 border border-amber-200'
      }`}>
        <p className={`text-sm leading-relaxed ${
          student.status === 'approved' ? 'text-emerald-800' :
          student.status === 'declined' ? 'text-rose-800' : 'text-amber-800'
        }`}>{statusCopy[student.status]}</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-charcoal-900">Profile details</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-ghost !py-1.5 !px-3 text-xs">
              Edit profile
            </button>
          )}
        </div>

        {saved && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
            ✓ Profile updated successfully.
          </div>
        )}

        {!editing ? (
          <dl className="grid gap-y-1 text-sm divide-y divide-charcoal-50">
            {[
              ['Full name', `${student.first_name} ${student.surname}`],
              ['Track', TRACK_LABELS[student.track]],
              ['Telephone', student.telephone],
              ['Mobile number', student.mobile_number],
              ['Email address', student.email_address],
              ['Occupation', student.occupation],
              ['State / LGA', student.state_lga],
              ['Nationality', student.nationality],
              ['Home address', student.home_address],
              ['Current church', student.current_church],
              ['Pastor', student.pastor_name],
              ["Pastor's phone", student.pastor_phone],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-charcoal-400 shrink-0">{label}</dt>
                <dd className="font-medium text-charcoal-900 text-right">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {EDITABLE_FIELDS.map(({ key, label, type, span, required }) => (
              <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                {type === 'textarea' ? (
                  <TextAreaField label={label} required={required} value={form[key]} onChange={(e) => update(key, e.target.value)} />
                ) : (
                  <TextField label={label} type={type || 'text'} required={required} value={form[key]} onChange={(e) => update(key, e.target.value)} />
                )}
              </div>
            ))}
            {error && <p className="sm:col-span-2 text-sm text-rose-500">{error}</p>}
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-indigo">{saving ? 'Saving…' : 'Save changes'}</button>
              <button onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-charcoal-400">
        Questions? Call <a href="tel:+2348164720718" className="font-semibold text-charcoal-700">0816 472 0718</a>
      </p>
    </div>
  )
}

// ---------- Courses tab ----------
function CoursesTab({ courses, courseRequests, availableCourses, onRequest }) {
  const [requesting, setRequesting] = useState(null)

  async function handleRequest(timetableId) {
    setRequesting(timetableId)
    await onRequest(timetableId)
    setRequesting(null)
  }

  return (
    <div className="space-y-5">
      {/* Enrolled courses */}
      <div className="card p-6">
        <h2 className="font-semibold text-charcoal-900 mb-4">My enrolled courses</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-charcoal-400">No courses assigned yet. Courses are assigned by ROWAM staff or you can request them below.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
                <div>
                  <div className="font-semibold text-charcoal-900">{c.timetable?.course_code}</div>
                  <div className="text-xs text-charcoal-400 mt-0.5">{c.timetable?.cohort_label}</div>
                </div>
                <div className="text-sm text-charcoal-500">
                  {c.timetable?.class_date && new Date(c.timetable.class_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {courseRequests.filter(r => r.status === 'pending').length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-4">Pending requests</h2>
          <div className="space-y-2">
            {courseRequests.filter(r => r.status === 'pending').map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
                <span className="text-sm text-charcoal-700">Awaiting admin approval</span>
                <StatusPill value="pending" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available to request */}
      {availableCourses.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-1">Request a course</h2>
          <p className="text-sm text-charcoal-400 mb-4">Browse available courses and submit a request. Admin will review and confirm.</p>
          <div className="space-y-2">
            {availableCourses.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-charcoal-100 bg-charcoal-50 px-4 py-3">
                <div>
                  <div className="font-semibold text-charcoal-900">{t.course_code}</div>
                  <div className="text-xs text-charcoal-400 mt-0.5">{t.cohort_label} · {t.class_date}</div>
                </div>
                <button
                  onClick={() => handleRequest(t.id)}
                  disabled={requesting === t.id}
                  className="btn-outline !py-1.5 !px-3 text-xs shrink-0"
                >
                  {requesting === t.id ? '…' : 'Request'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Resources tab ----------
function ResourcesTab({ resources, approved }) {
  if (!approved) {
    return (
      <div className="card p-10 text-center">
        <div className="font-display text-4xl text-charcoal-200 mb-3">🔒</div>
        <h3 className="font-semibold text-charcoal-900">Resources unlocked after approval</h3>
        <p className="mt-2 text-sm text-charcoal-400">Resources are available to enrolled students once your application is approved.</p>
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-charcoal-400">No resources published yet. Check back soon.</p>
      </div>
    )
  }

  const files = resources.filter(r => r.type === 'file')
  const links = resources.filter(r => r.type === 'link')

  return (
    <div className="space-y-5">
      {files.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-4">Documents & Files</h2>
          <div className="space-y-2">
            {files.map((r) => (
              <ResourceFileItem key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}
      {links.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-4">External Links</h2>
          <div className="space-y-2">
            {links.map((r) => (
              <a key={r.id} href={r.url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-charcoal-100 bg-charcoal-50 px-4 py-3 hover:bg-charcoal-100 transition-colors">
                <div>
                  <div className="font-semibold text-charcoal-900 text-sm">{r.title}</div>
                  {r.description && <div className="text-xs text-charcoal-400 mt-0.5">{r.description}</div>}
                </div>
                <span className="text-indigo-500 text-sm ml-3">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResourceFileItem({ resource }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)

  async function download() {
    if (url) { window.open(url, '_blank'); return }
    setLoading(true)
    const { data } = await supabase.storage.from('resources').createSignedUrl(resource.file_path, 300)
    setLoading(false)
    if (data?.signedUrl) { setUrl(data.signedUrl); window.open(data.signedUrl, '_blank') }
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-charcoal-100 bg-charcoal-50 px-4 py-3">
      <div>
        <div className="font-semibold text-charcoal-900 text-sm">{resource.title}</div>
        {resource.description && <div className="text-xs text-charcoal-400 mt-0.5">{resource.description}</div>}
      </div>
      <button onClick={download} disabled={loading} className="btn-indigo !py-1.5 !px-3 text-xs shrink-0 ml-3">
        {loading ? '…' : '↓ Download'}
      </button>
    </div>
  )
}

// ---------- Inbox tab ----------
function InboxTab({ notifications, readIds, onOpen }) {
  const [expandedId, setExpandedId] = useState(null)

  function toggle(n) {
    const opening = expandedId !== n.id
    setExpandedId(opening ? n.id : null)
    if (opening) onOpen(n.id)
  }

  if (notifications.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-charcoal-400">No messages yet.</p>
      </div>
    )
  }

  return (
    <div className="card divide-y divide-charcoal-50 overflow-hidden">
      {notifications.map((n) => {
        const isRead = readIds.has(n.id)
        const isOpen = expandedId === n.id
        return (
          <button key={n.id} onClick={() => toggle(n)} className="block w-full px-5 py-4 text-left hover:bg-charcoal-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                <div className={isRead ? 'pl-5' : ''}>
                  <div className={`text-sm ${isRead ? 'font-medium text-charcoal-600' : 'font-semibold text-charcoal-900'}`}>
                    {n.title}
                  </div>
                  {n.student_id === null && (
                    <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Broadcast</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-charcoal-400">
                {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            </div>
            {isOpen && (
              <p className="mt-3 pl-5 text-sm leading-relaxed text-charcoal-600">{n.body}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}
