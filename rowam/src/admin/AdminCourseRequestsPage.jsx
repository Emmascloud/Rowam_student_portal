import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusPill from '../components/StatusPill'

export default function AdminCourseRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState('pending')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('course_requests')
      .select(`
        *,
        student:student_id (id, first_name, surname, track, student_ref),
        timetable:timetable_id (id, course_code, cohort_label, class_date)
      `)
      .order('created_at', { ascending: false })

    if (error) setError('Could not load course requests.')
    else setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateRequest(id, status) {
    setBusy(id)
    setNotice('')
    const { error } = await supabase
      .from('course_requests')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)

    setBusy(null)
    if (error) {
      setError(error.message)
    } else {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r))
      setNotice(`Request ${status}.`)
    }
  }

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter)

  const counts = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    declined: requests.filter((r) => r.status === 'declined').length,
  }

  return (
    <div>
      <p className="label-eyebrow">Enrollment management</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Course Requests</h1>
      <p className="mt-2 max-w-xl text-sm text-navy-600">
        Review and approve or decline student requests to join specific courses.
        Approving a request automatically enrolls the student in that course.
      </p>

      {/* Summary counts */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: counts.pending, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'Approved', value: counts.approved, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Declined', value: counts.declined, color: 'bg-rose-50 border-rose-200 text-rose-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border px-4 py-3 text-center ${s.color}`}>
            <div className="font-display text-2xl font-semibold">{s.value}</div>
            <div className="text-xs font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {notice && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}

      {/* Filter tabs */}
      <div className="mt-5 flex gap-1 rounded-xl bg-navy-50 p-1 w-fit">
        {['pending', 'approved', 'declined', 'all'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
              filter === f ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-navy-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card mt-5 p-10 text-center">
          <p className="text-navy-400">No {filter === 'all' ? '' : filter} requests found.</p>
        </div>
      ) : (
        <div className="card mt-5 overflow-hidden">
          <div className="divide-y divide-navy-50">
            {filtered.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/admin/students/${r.student?.id}`}
                        className="font-semibold text-navy-900 hover:text-indigo-600 transition-colors"
                      >
                        {r.student?.first_name} {r.student?.surname}
                      </Link>
                      {r.student?.student_ref && (
                        <span className="text-xs text-navy-400">{r.student.student_ref}</span>
                      )}
                      <StatusPill value={r.status} />
                    </div>
                    <div className="mt-1 text-sm text-navy-600">
                      Requesting: <span className="font-semibold">{r.timetable?.course_code}</span>
                      <span className="ml-1 text-navy-400">— {r.timetable?.cohort_label} ({r.timetable?.class_date})</span>
                    </div>
                    <div className="mt-0.5 text-xs text-navy-400">
                      Submitted {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {r.student_note && (
                      <div className="mt-2 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600">
                        Student note: {r.student_note}
                      </div>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => updateRequest(r.id, 'approved')}
                        disabled={busy === r.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateRequest(r.id, 'declined')}
                        disabled={busy === r.id}
                        className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
