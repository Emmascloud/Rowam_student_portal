import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'
import CameraCapture from './CameraCapture'

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

export default function AdminStudentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [student, setStudent] = useState(null)
  const [capture, setCapture] = useState(null)
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

    const { data: captureData } = await supabase
      .from('captures')
      .select('*')
      .eq('student_id', id)
      .maybeSingle()

    setCapture(captureData || null)

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

  if (loading) return <div className="py-20 text-center text-navy-500">Loading…</div>
  if (error && !student) return <div className="py-20 text-center text-rose-600">{error}</div>
  if (!student) return null

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/admin" className="text-sm font-medium text-navy-500 hover:text-navy-800">← Back to applications</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">
            {student.first_name} {student.surname}
          </h1>
          <p className="mt-1 text-sm text-navy-500">{TRACK_LABELS[student.track]} · Submitted {new Date(student.created_at).toLocaleDateString('en-GB')}</p>
        </div>
        <div className="flex gap-2">
          <StatusPill value={student.status} />
          <StatusPill value={student.payment_status} />
        </div>
      </div>

      {notice && <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div>}
      {error && <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}

      {/* Action panel */}
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

      {/* Capture panel */}
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

      {/* Full record */}
      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Section A — Personal details</h2>
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
        </dl>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Section B — Spiritual background</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Born again" value={student.born_again ? 'Yes' : 'No'} />
          <Row label="When" value={student.born_again_when} />
          <Row label="Where" value={student.born_again_where} />
          <Row label="Current church" value={student.current_church} />
          <Row label="Church address" value={student.church_address} />
          <Row label="Pastor / overseer" value={student.pastor_name} />
          <Row label="Pastor's phone" value={student.pastor_phone} />
          <Row label="Ministry role" value={student.ministry_role} />
        </dl>
      </div>

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

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Section D — Emergency contact</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Row label="Full name" value={student.kin_full_name} />
          <Row label="Relationship" value={student.kin_relationship} />
          <Row label="Phone" value={student.kin_phone} />
          <Row label="Email" value={student.kin_email} />
        </dl>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy-50 py-2">
      <dt className="text-navy-500">{label}</dt>
      <dd className="text-right font-medium text-navy-900">{value || '—'}</dd>
    </div>
  )
}
