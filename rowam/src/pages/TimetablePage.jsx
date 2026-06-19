import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

const TRACK_LABELS = {
  evangelists: 'Evangelists Track',
  pastors: 'Pastors Track',
  apostles: 'Apostles Track',
  all: 'All Tracks',
}

export default function TimetablePage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .order('class_date', { ascending: true })

      if (!active) return
      if (error) {
        setError('Could not load the timetable right now. Please try again shortly.')
      } else {
        setRows(data)
      }
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  const grouped = rows.reduce((acc, row) => {
    acc[row.cohort_label] = acc[row.cohort_label] || []
    acc[row.cohort_label].push(row)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="label-eyebrow">Class schedule</p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-navy-900 sm:text-4xl">Timetable</h1>
      <p className="mt-3 max-w-xl text-navy-600">
        Published class dates and course codes for each cohort. Your track's session falls on these dates,
        5:00 – 7:00 PM, at the ROWAM centre.
      </p>

      {loading && <p className="mt-10 text-sm text-navy-500">Loading timetable…</p>}
      {error && <p className="mt-10 text-sm text-rose-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-10 text-sm text-navy-500">No classes have been scheduled yet. Please check back soon.</p>
      )}

      {Object.entries(grouped).map(([cohort, items]) => (
        <div key={cohort} className="mt-10">
          <h2 className="section-tag inline-block">{cohort}</h2>
          <div className="card mt-4 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/60 text-xs uppercase tracking-wide text-navy-500">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Course code</th>
                  <th className="px-5 py-3 font-semibold">Track</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3.5 text-navy-800">{formatDate(row.class_date)}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">{row.course_code}</td>
                    <td className="px-5 py-3.5 text-navy-600">{TRACK_LABELS[row.track] || row.track}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
