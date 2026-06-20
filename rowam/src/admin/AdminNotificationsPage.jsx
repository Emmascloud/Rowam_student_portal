import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadHistory() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, body, student_id, created_at, students:student_id (first_name, surname)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) setError('Could not load notification history.')
    else setHistory(data || [])
    setLoading(false)
  }

  useEffect(() => { loadHistory() }, [])

  async function handleBroadcast() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setNotice('')
    setError('')

    const { error } = await supabase
      .from('notifications')
      .insert({ student_id: null, title: title.trim(), body: body.trim(), sent_by: user.id })

    setSending(false)

    if (error) {
      setError(error.message)
    } else {
      setTitle('')
      setBody('')
      setNotice('Broadcast sent to all students.')
      loadHistory()
    }
  }

  return (
    <div>
      <p className="label-eyebrow">Communication</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Notifications</h1>
      <p className="mt-2 max-w-xl text-sm text-navy-600">
        Send a broadcast message to every student's inbox. To message a single student, open their
        application from the Applications list instead.
      </p>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Broadcast to all students</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="field-label">Subject</label>
            <input
              className="field-input"
              placeholder="e.g. Class schedule update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">Message</label>
            <textarea
              className="field-input min-h-[100px] resize-y"
              placeholder="Write your announcement…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            disabled={sending || !title.trim() || !body.trim()}
            onClick={handleBroadcast}
            className="btn-gold"
          >
            {sending ? 'Sending…' : 'Send to all students'}
          </button>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-navy-900">Recent messages</h2>
        {loading ? (
          <p className="mt-3 text-sm text-navy-500">Loading…</p>
        ) : history.length === 0 ? (
          <p className="mt-3 text-sm text-navy-400">No messages sent yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-navy-50">
            {history.map((n) => (
              <div key={n.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-navy-900">{n.title}</div>
                  <span className="text-xs text-navy-400">
                    {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-0.5 text-xs uppercase tracking-wide text-navy-400">
                  {n.student_id === null
                    ? 'Broadcast — all students'
                    : `To: ${n.students?.first_name || ''} ${n.students?.surname || ''}`.trim() || 'Unknown student'}
                </div>
                <p className="mt-1.5 text-sm text-navy-600">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
