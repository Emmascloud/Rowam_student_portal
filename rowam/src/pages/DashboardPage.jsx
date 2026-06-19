import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const location = useLocation()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !user) return

    async function load() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        setError('Could not load your application. Please refresh the page.')
      } else {
        setStudent(data)
      }
      setLoading(false)
    }
    load()
  }, [user, authLoading])

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

      <div className="card mt-6 p-7">
        <h2 className="font-display text-lg font-semibold text-navy-900">Application summary</h2>
        <dl className="mt-4 divide-y divide-navy-50 text-sm">
          <Row label="Track" value={TRACK_LABELS[student.track]} />
          <Row label="Mobile number" value={student.mobile_number} />
          <Row label="Email" value={student.email_address} />
          <Row label="Submitted" value={new Date(student.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
        </dl>
      </div>

      <p className="mt-6 text-center text-sm text-navy-500">
        Questions about your application? Call <a href="tel:+2348164720718" className="font-semibold text-navy-800">0816 472 0718</a>.
      </p>
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
