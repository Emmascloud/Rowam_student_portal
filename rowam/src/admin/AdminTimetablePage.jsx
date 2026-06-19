import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const TRACK_OPTIONS = [
  { value: 'all', label: 'All tracks' },
  { value: 'evangelists', label: 'Evangelists' },
  { value: 'pastors', label: 'Pastors' },
  { value: 'apostles', label: 'Apostles' },
]

const emptyForm = { cohort_label: '', class_date: '', course_code: '', track: 'all' }

export default function AdminTimetablePage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('timetable')
      .select('*')
      .order('class_date', { ascending: true })

    if (error) setError('Could not load the timetable.')
    else setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.cohort_label || !form.class_date || !form.course_code) return

    setSaving(true)
    setError('')
    const { error } = await supabase.from('timetable').insert({
      ...form,
      created_by: user.id,
    })
    setSaving(false)

    if (error) {
      setError(error.message)
    } else {
      setForm(emptyForm)
      load()
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('timetable').delete().eq('id', id)
    if (error) setError(error.message)
    else setRows((r) => r.filter((row) => row.id !== id))
  }

  return (
    <div>
      <p className="label-eyebrow">Schedule management</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Timetable</h1>
      <p className="mt-2 max-w-xl text-sm text-navy-600">
        Add or remove class dates and course codes. Changes appear on the public timetable page immediately.
      </p>

      <form onSubmit={handleAdd} className="card mt-6 grid gap-4 p-6 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label className="field-label">Cohort label</label>
          <input
            className="field-input"
            placeholder="e.g. JUNE 2026"
            value={form.cohort_label}
            onChange={(e) => setForm((f) => ({ ...f, cohort_label: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="field-label">Class date</label>
          <input
            type="date"
            className="field-input"
            value={form.class_date}
            onChange={(e) => setForm((f) => ({ ...f, class_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="field-label">Course code</label>
          <input
            className="field-input"
            placeholder="e.g. TSC 001"
            value={form.course_code}
            onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="field-label">Track</label>
          <select
            className="field-select"
            value={form.track}
            onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}
          >
            {TRACK_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-5">
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? 'Adding…' : 'Add to timetable'}
          </button>
        </div>
      </form>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      {loading ? (
        <p className="mt-8 text-sm text-navy-500">Loading…</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/60 text-xs uppercase tracking-wide text-navy-500">
                <th className="px-5 py-3 font-semibold">Cohort</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Course code</th>
                <th className="px-5 py-3 font-semibold">Track</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3.5 text-navy-700">{row.cohort_label}</td>
                  <td className="px-5 py-3.5 text-navy-700">{row.class_date}</td>
                  <td className="px-5 py-3.5 font-semibold text-navy-900">{row.course_code}</td>
                  <td className="px-5 py-3.5 text-navy-600">{row.track}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => handleDelete(row.id)} className="text-sm font-medium text-rose-600 hover:text-rose-800">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-navy-400">No timetable entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
