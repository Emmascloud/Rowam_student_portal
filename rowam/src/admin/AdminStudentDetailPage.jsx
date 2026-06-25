import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'
import CameraCapture from './CameraCapture'
import { TextField, SelectField, TextAreaField } from '../components/FormFields'

const TRACK_LABELS = {
  evangelists: 'Evangelists Track',
  pastors: 'Pastors Track',
  apostles: 'Apostles Track',
}

const HEARD_LABELS = {
  social_media: 'Social Media',
  church_announcement: 'Church Announcement',
  flyer_poster: 'Flyer / Poster',
  friend_family: 'A Friend / Family Member',
  website_online: 'Website / Online',
  other: 'Other',
}

const PROFILE_FIELDS = [
  { key: 'surname', label: 'Surname' },
  { key: 'first_name', label: 'First name' },
  { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female'] },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'marital_status', label: 'Marital status', type: 'select', options: ['single', 'married', 'other'] },
  { key: 'marital_status_other', label: 'Marital status (if other)' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'state_lga', label: 'State / LGA' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'telephone', label: 'Telephone' },
  { key: 'mobile_number', label: 'Mobile number' },
  { key: 'email_address', label: 'Email address', type: 'email' },
  { key: 'home_address', label: 'Home address', type: 'textarea', span: 2 },
  { key: 'current_church', label: 'Current church' },
  { key: 'church_address', label: 'Church address' },
  { key: 'pastor_name', label: 'Pastor / overseer' },
  { key: 'pastor_phone', label: "Pastor's phone" },
  { key: 'ministry_role', label: 'Ministry role', span: 2 },
  { key: 'kin_full_name', label: 'Emergency contact name' },
  { key: 'kin_relationship', label: 'Relationship' },
  { key: 'kin_phone', label: 'Emergency contact phone' },
  { key: 'kin_email', label: 'Emergency contact email', type: 'email' },
]

export default function AdminStudentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [student, setStudent] = useState(null)
  const [capture, setCapture] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [assignedCourses, setAssignedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingRef, setSavingRef] = useState(false)
  const [refInput, setRefInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [thumbprintUrl, setThumbprintUrl] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (studentError) {
      setError('Could not load this application.')
      setLoading(false)
      return
    }

    setStudent(studentData)
    setRefInput(studentData.student_ref || '')

    const [{ data: captureData }, { data: timetableData }, { data: courseData }] = await Promise.all([
      supabase.from('captures').select('*').eq('student_id', id).maybeSingle(),
      supabase.from('timetable').select('*').order('class_date', { ascending: true }),
      supabase
        .from('student_courses')
        .select('id, timetable_id, timetable:timetable_id (id, class_date, course_code, cohort_label)')
        .eq('student_id', id),
    ])

    setCapture(captureData || null)
    setTimetable(timetableData || [])
    setAssignedCourses(courseData || [])

    if (captureData?.photo_path) {
      const { data } = await supabase.storage.from('captures').createSignedUrl(captureData.photo_path, 3600)
      setPhotoUrl(data?.signedUrl || null)
    }
    if (captureData?.thumbprint_path) {
      const { data } = await supabase.storage.from('captures').createSignedUrl(captureData.thumbprint_path, 3600)
      setThumbprintUrl(data?.signedUrl || null)
    }

    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function updateStatus(status) {
    setBusy(true)
    setNotice('')
    const { error } = await supabase.from('students').update({ status }).eq('id', id)
    setBusy(false)
    if (error) {
      setError(error.message)
    } else {
      setStudent((s) => ({ ...s, status }))
      setNotice(`Application marked as ${status}.`)
    }
  }

  async function togglePayment() {
    setBusy(true)
    setNotice('')
    const next = student.payment_status === 'paid' ? 'unpaid' : 'paid'
    const { error } = await supabase
      .from('students')
      .update({
        payment_status: next,
        payment_marked_by: user.id,
        payment_marked_at: new Date().toISOString(),
      })
      .eq('id', id)
    setBusy(false)
    if (error) {
      setError(error.message)
    } else {
      setStudent((s) => ({ ...s, payment_status: next }))
      setNotice(`Payment marked as ${next}.`)
    }
  }

  async function saveRef() {
    if (!refInput.trim()) return
    setSavingRef(true)
    setNotice('')
    const { error } = await supabase
      .from('students')
      .update({ student_ref: refInput.trim() })
      .eq('id', id)
    setSavingRef(false)
    if (error) {
      setError(error.code === '23505' ? 'That reference number is already in use.' : error.message)
    } else {
      setStudent((s) => ({ ...s, student_ref: refInput.trim() }))
      setNotice('Student reference number saved.')
    }
  }

  async function uploadCapture(kind, blob) {
    setBusy(true)
    setNotice('')
    const path = `${id}/${kind}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('captures')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) {
      setBusy(false)
      setError(uploadError.message)
      return
    }

    const updates = {
      student_id: id,
      captured_by: user.id,
      captured_at: new Date().toISOString(),
      ...(kind === 'photo' ? { photo_path: path } : { thumbprint_path: path }),
    }

    const { data: upserted, error: upsertError } = await supabase
      .from('captures')
      .upsert(updates, { onConflict: 'student_id' })
      .select()
      .single()

    setBusy(false)

    if (upsertError) {
      setError(upsertError.message)
      return
    }

    setCapture(upserted)
    const { data: signed } = await supabase.storage.from('captures').createSignedUrl(path, 3600)
    if (kind === 'photo') setPhotoUrl(signed?.signedUrl || null)
    else setThumbprintUrl(signed?.signedUrl || null)
    setNotice(`${kind === 'photo' ? 'Passport photo' : 'Thumbprint'} saved.`)
  }

  async function assignCourse(timetableId) {
    if (!timetableId) return
    setBusy(true)
    setNotice('')
    const { data, error } = await supabase
      .from('student_courses')
      .insert({ student_id: id, timetable_id: timetableId, assigned_by: user.id })
      .select('id, timetable_id, timetable:timetable_id (id, class_date, course_code, cohort_label)')
      .single()
    setBusy(false)
    if (error) {
      setError(error.code === '23505' ? 'This course is already assigned to the student.' : error.message)
    } else {
      setAssignedCourses((prev) => [...prev, data])
      setNotice('Course assigned.')
    }
  }

  async function removeCourse(studentCourseId) {
    setBusy(true)
    setNotice('')
    const { error } = await supabase.from('student_courses').delete().eq('id', studentCourseId)
    setBusy(false)
    if (error) {
      setError(error.message)
    } else {
      setAssignedCourses((prev) => prev.filter((c) => c.id !== studentCourseId))
      setNotice('Course removed.')
    }
  }

  async function saveProfile(updates) {
    setBusy(true)
    setNotice('')
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    setBusy(false)
    if (error) {
      setError(error.message)
      return false
    }
    setStudent(data)
    setNotice('Profile updated.')
    return true
  }

  async function sendNotification(title, body) {
    setBusy(true)
    setNotice('')
    const { error } = await supabase
      .from('notifications')
      .insert({ student_id: id, title, body, sent_by: user.id })
    setBusy(false)
    if (error) {
      setError(error.message)
      return false
    }
    setNotice('Message sent to student.')
    return true
  }

  if (loading) return <div className="py-20 text-center text-navy-500">Loading…</div>
  if (error && !student) return <div className="py-20 text-center text-rose-600">{error}</div>
  if (!student) return null

  const unassignedTimetable = timetable.filter(
    (t) => !assignedCourses.some((c) => c.timetable_id === t.id)
  )

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin" className="text-sm font-medium text-navy-500 hover:text-navy-800">← Back to applications</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar url={photoUrl} firstName={student.first_name} surname={student.surname} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              {student.first_name} {student.surname}
            </h1>
            <p className="mt-1 text-sm text-navy-500">{TRACK_LABELS[student.track]} · Submitted {new Date(student.created_at).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <StatusPill value={student.status} />
          <StatusPill value={student.payment_status} />
        </div>
      </div>

      {notice && <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div>}
      {error && <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Review actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button disabled={busy} onClick={() => updateStatus('approved')} className="btn-primary !bg-emerald-700 hover:!bg-emerald-600">Approve</button>
          <button disabled={busy} onClick={() => updateStatus('declined')} className="btn-primary !bg-rose-700 hover:!bg-rose-600">Decline</button>
          <button disabled={busy} onClick={() => updateStatus('pending')} className="btn-outline">Reset to pending</button>
          <button disabled={busy} onClick={togglePayment} className="btn-outline">
            Mark as {student.payment_status === 'paid' ? 'unpaid' : 'paid'}
          </button>
        </div>

        <div className="mt-5 flex items-end gap-3 border-t border-navy-100 pt-5">
          <div className="flex-1 max-w-xs">
            <label className="field-label">Student reference number</label>
            <input
              className="field-input"
              placeholder="ROWAM/2026/0001"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
            />
          </div>
          <button disabled={savingRef} onClick={saveRef} className="btn-gold">
            {savingRef ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <CoursesPanel
        assignedCourses={assignedCourses}
        unassignedTimetable={unassignedTimetable}
        busy={busy}
        onAssign={assignCourse}
        onRemove={removeCourse}
      />

      <NotificationPanel busy={busy} onSend={sendNotification} />

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">On-site capture</h2>
        <p className="mt-1 text-sm text-navy-500">Use this device's camera to capture the student's passport photo and thumbprint while they're at the centre.</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <CameraCapture
            label="Passport photo"
            existingUrl={photoUrl}
            onCapture={(blob) => uploadCapture('photo', blob)}
            facingMode="user"
          />
          <CameraCapture
            label="Thumbprint"
            existingUrl={thumbprintUrl}
            onCapture={(blob) => uploadCapture('thumbprint', blob)}
            facingMode="environment"
          />
        </div>
        {capture?.captured_at && (
          <p className="mt-4 text-xs text-navy-400">
            Last captured: {new Date(capture.captured_at).toLocaleString('en-GB')}
          </p>
        )}
      </div>

      <ProfileEditor student={student} busy={busy} onSave={saveProfile} />

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Section C — Educational background</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-500">
                <th className="py-2 pr-4 font-semibold">Level</th>
                <th className="py-2 pr-4 font-semibold">School</th>
                <th className="py-2 pr-4 font-semibold">Dates</th>
                <th className="py-2 font-semibold">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {(student.education || []).map((row, i) => (
                <tr key={i} className="border-b border-navy-50 last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-navy-800">{row.level}</td>
                  <td className="py-2.5 pr-4 text-navy-600">{row.school_name_address || '—'}</td>
                  <td className="py-2.5 pr-4 text-navy-600">{row.dates_from_to || '—'}</td>
                  <td className="py-2.5 text-navy-600">{row.certificate_qualification || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6 mb-10 p-6">
        <h2 className="font-semibold text-navy-900">Section E — Referral source</h2>
        <p className="mt-3 text-sm text-navy-700">
          {student.heard_about === 'other' ? student.heard_about_other : HEARD_LABELS[student.heard_about]}
        </p>
      </div>
    </div>
  )
}

function CoursesPanel({ assignedCourses, unassignedTimetable, busy, onAssign, onRemove }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="card mt-6 p-6">
      <h2 className="font-semibold text-navy-900">Registered courses</h2>
      <p className="mt-1 text-sm text-navy-500">Assign course codes from the timetable to this student.</p>

      {assignedCourses.length === 0 ? (
        <p className="mt-4 text-sm text-navy-400">No courses assigned yet.</p>
      ) : (
        <div className="mt-4 divide-y divide-navy-50">
          {assignedCourses.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div>
                <span className="font-semibold text-navy-900">{c.timetable?.course_code}</span>
                <span className="ml-2 text-navy-500">{c.timetable?.cohort_label}</span>
              </div>
              <button onClick={() => onRemove(c.id)} disabled={busy} className="text-xs font-medium text-rose-600 hover:text-rose-800">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-navy-100 pt-5">
        <div className="min-w-[220px] flex-1">
          <label className="field-label">Add a course</label>
          <select className="field-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Select a course code…</option>
            {unassignedTimetable.map((t) => (
              <option key={t.id} value={t.id}>{t.course_code} — {t.cohort_label} ({t.class_date})</option>
            ))}
          </select>
        </div>
        <button
          disabled={busy || !selected}
          onClick={() => { onAssign(selected); setSelected('') }}
          className="btn-gold"
        >
          Assign
        </button>
      </div>
    </div>
  )
}

function NotificationPanel({ busy, onSend }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    const ok = await onSend(title.trim(), body.trim())
    if (ok) {
      setTitle('')
      setBody('')
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    }
  }

  return (
    <div className="card mt-6 p-6">
      <h2 className="font-semibold text-navy-900">Send a message to this student</h2>
      <p className="mt-1 text-sm text-navy-500">This appears in the student's inbox on their dashboard.</p>

      <div className="mt-4 space-y-4">
        <TextField label="Subject" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Payment reminder" />
        <TextAreaField label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
        {sent && <p className="text-sm text-emerald-700">Message sent.</p>}
        <button disabled={busy || !title.trim() || !body.trim()} onClick={handleSend} className="btn-gold">
          Send message
        </button>
      </div>
    </div>
  )
}

function ProfileEditor({ student, busy, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(buildInitialForm(student))
  const [saving, setSaving] = useState(false)

  function buildInitialForm(s) {
    const f = {}
    PROFILE_FIELDS.forEach(({ key }) => { f[key] = s[key] ?? '' })
    return f
  }

  function startEditing() {
    setForm(buildInitialForm(student))
    setEditing(true)
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const payload = {}
    PROFILE_FIELDS.forEach(({ key, type }) => {
      const raw = form[key]
      payload[key] = type === 'number' ? (raw === '' ? null : parseInt(raw, 10)) : (raw?.toString().trim() || null)
    })
    const ok = await onSave(payload)
    setSaving(false)
    if (ok) setEditing(false)
  }

  return (
    <div className="card mt-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-navy-900">Section A &amp; B — Personal &amp; spiritual details</h2>
        {!editing && (
          <button onClick={startEditing} className="text-sm font-semibold text-navy-700 hover:text-navy-900">
            Edit profile
          </button>
        )}
      </div>

      {!editing ? (
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Gender" value={student.gender} />
          <Row label="Age" value={student.age} />
          <Row label="Above 15" value={student.above_15 ? 'Yes' : 'No'} />
          <Row label="Marital status" value={student.marital_status === 'other' ? student.marital_status_other : student.marital_status} />
          <Row label="Nationality" value={student.nationality} />
          <Row label="State / LGA" value={student.state_lga} />
          <Row label="Occupation" value={student.occupation} />
          <Row label="Telephone" value={student.telephone} />
          <Row label="Mobile" value={student.mobile_number} />
          <Row label="Email" value={student.email_address} />
          <div className="sm:col-span-2"><Row label="Home address" value={student.home_address} /></div>
          <Row label="Current church" value={student.current_church} />
          <Row label="Church address" value={student.church_address} />
          <Row label="Pastor / overseer" value={student.pastor_name} />
          <Row label="Pastor's phone" value={student.pastor_phone} />
          <div className="sm:col-span-2"><Row label="Ministry role" value={student.ministry_role} /></div>
          <Row label="Emergency contact" value={student.kin_full_name} />
          <Row label="Relationship" value={student.kin_relationship} />
          <Row label="Emergency phone" value={student.kin_phone} />
          <Row label="Emergency email" value={student.kin_email} />
        </dl>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PROFILE_FIELDS.map(({ key, label, type, options, span }) => (
            <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
              {type === 'select' ? (
                <SelectField label={label} value={form[key]} onChange={(e) => update(key, e.target.value)}>
                  {options.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectField>
              ) : type === 'textarea' ? (
                <TextAreaField label={label} value={form[key]} onChange={(e) => update(key, e.target.value)} />
              ) : (
                <TextField label={label} type={type || 'text'} value={form[key]} onChange={(e) => update(key, e.target.value)} />
              )}
            </div>
          ))}
          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button disabled={saving || busy} onClick={handleSave} className="btn-gold">
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
    <div className="flex justify-between gap-4 border-b border-navy-50 py-2">
      <dt className="text-navy-500">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value || '—'}</dd>
    </div>
  )
}
