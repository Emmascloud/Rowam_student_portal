import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StatusPill from '../components/StatusPill'
import Avatar from '../components/Avatar'

const TRACK_LABELS = {
  evangelists: 'Evangelists',
  pastors: 'Pastors',
  apostles: 'Apostles',
}

export default function AdminApplicationsPage() {
  const [students, setStudents] = useState([])
  const [avatarUrls, setAvatarUrls] = useState({}) // student_id -> signed url
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [trackFilter, setTrackFilter] = useState('all')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError('Could not load applications.')
      setLoading(false)
      return
    }

    setStudents(data)

    // Fetch every captured passport photo path in one query, then request
    // signed URLs for all of them in a single batched call rather than one
    // request per student.
    const { data: captureRows } = await supabase
      .from('captures')
      .select('student_id, photo_path')
      .not('photo_path', 'is', null)

    if (captureRows && captureRows.length > 0) {
      const paths = captureRows.map((c) => c.photo_path)
      const { data: signedBatch } = await supabase.storage
        .from('captures')
        .createSignedUrls(paths, 3600)

      if (signedBatch) {
        const urlByPath = {}
        signedBatch.forEach((entry) => {
          if (entry.signedUrl) urlByPath[entry.path] = entry.signedUrl
        })
        const map = {}
        captureRows.forEach((c) => {
          if (urlByPath[c.photo_path]) map[c.student_id] = urlByPath[c.photo_path]
        })
        setAvatarUrls(map)
      }
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (trackFilter !== 'all' && s.track !== trackFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${s.first_name} ${s.surname} ${s.email_address} ${s.mobile_number} ${s.student_ref || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [students, search, statusFilter, trackFilter])

  const counts = useMemo(() => ({
    total: students.length,
    pending: students.filter((s) => s.status === 'pending').length,
    approved: students.filter((s) => s.status === 'approved').length,
    declined: students.filter((s) => s.status === 'declined').length,
  }), [students])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow">Student records</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Applications</h1>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <StatBox label="Total" value={counts.total} />
          <StatBox label="Pending" value={counts.pending} />
          <StatBox label="Approved" value={counts.approved} />
          <StatBox label="Declined" value={counts.declined} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name, email, phone, or ref no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input max-w-xs"
        />
        <select className="field-select max-w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="declined">Declined</option>
        </select>
        <select className="field-select max-w-[180px]" value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}>
          <option value="all">All tracks</option>
          <option value="evangelists">Evangelists</option>
          <option value="pastors">Pastors</option>
          <option value="apostles">Apostles</option>
        </select>
      </div>

      {loading && <p className="mt-8 text-sm text-navy-500">Loading applications…</p>}
      {error && <p className="mt-8 text-sm text-rose-600">{error}</p>}

      {!loading && !error && (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/60 text-xs uppercase tracking-wide text-navy-500">
                <th className="px-5 py-3 font-semibold"></th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Track</th>
                <th className="px-5 py-3 font-semibold">Ref. No.</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Submitted</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/40">
                  <td className="px-5 py-3.5">
                    <Avatar url={avatarUrls[s.id]} firstName={s.first_name} surname={s.surname} size="sm" />
                  </td>
                  <td className="px-5 py-3.5 font-medium text-navy-900">{s.first_name} {s.surname}</td>
                  <td className="px-5 py-3.5 text-navy-600">{TRACK_LABELS[s.track]}</td>
                  <td className="px-5 py-3.5 text-navy-600">{s.student_ref || '—'}</td>
                  <td className="px-5 py-3.5"><StatusPill value={s.status} /></td>
                  <td className="px-5 py-3.5"><StatusPill value={s.payment_status} /></td>
                  <td className="px-5 py-3.5 text-navy-500">
                    {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/admin/students/${s.id}`} className="font-semibold text-navy-700 hover:text-navy-900">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-navy-400">No applications match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="card px-4 py-2.5">
      <div className="text-xs uppercase tracking-wide text-navy-400">{label}</div>
      <div className="font-display text-xl font-semibold text-navy-900">{value}</div>
    </div>
  )
}
