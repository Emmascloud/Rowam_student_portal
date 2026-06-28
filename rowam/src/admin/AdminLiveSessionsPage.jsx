import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const TRACKS = [
  { value: 'all', label: 'All tracks' },
  { value: 'evangelists', label: 'Evangelists' },
  { value: 'pastors', label: 'Pastors' },
  { value: 'apostles', label: 'Apostles' },
]

const emptyForm = {
  title: '', description: '', scheduled_at: '',
  room_name: '', room_password: '', track: 'all',
}

function slugify(text) {
  return 'rowam-' + text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function buildJitsiUrl(session, isHost) {
  const base = `https://meet.jit.si/${encodeURIComponent(session.room_name)}`
  const config = [
    isHost ? 'config.startWithAudioMuted=false' : 'config.startWithAudioMuted=true',
    isHost ? 'config.startWithVideoMuted=false' : 'config.startWithVideoMuted=true',
    'config.prejoinPageEnabled=false',
    'config.disableDeepLinking=true',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.MOBILE_APP_PROMO=false',
  ].join('&')
  return `${base}#${config}`
}

export default function AdminLiveSessionsPage() {
  const { user, profile } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [inputs, setInputs] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('live_sessions').select('*').order('scheduled_at', { ascending: false })
    if (error) setError('Could not load sessions.')
    else setSessions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function update(k, v) {
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === 'title' && !f._roomEdited) next.room_name = slugify(v)
      return next
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.room_name.trim()) { setError('Room name is required.'); return }
    setSaving(true); setError(''); setNotice('')

    const { data, error: err } = await supabase.from('live_sessions').insert({
      title: form.title.trim(),
      description: form.description.trim() || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      room_name: form.room_name.trim().toLowerCase().replace(/\s+/g, '-'),
      room_password: form.room_password.trim() || null,
      track: form.track,
      created_by: user.id,
    }).select('*').single()

    setSaving(false)
    if (err) {
      setError(err.code === '23505'
        ? 'That room name is already in use. Please choose a different name.'
        : err.message)
      return
    }
    setSessions((prev) => [data, ...prev])
    setForm(emptyForm)
    setNotice('Session scheduled.')
  }

  async function toggleLive(s) {
    const next = !s.is_live
    const { error } = await supabase.from('live_sessions').update({ is_live: next }).eq('id', s.id)
    if (error) { setError(error.message); return }
    setSessions((prev) => prev.map((r) => r.id === s.id ? { ...r, is_live: next } : r))

    if (next) {
      // Open the Jitsi room in a new tab for the admin/teacher
      window.open(buildJitsiUrl(s, true), '_blank', 'noopener,noreferrer')
      setNotice(`"${s.title}" is now live — students can join. Your class room opened in a new tab.`)
    } else {
      setNotice(`"${s.title}" session ended.`)
    }
  }

  async function saveField(s, field, value) {
    const val = value?.trim() || null
    const { error } = await supabase.from('live_sessions').update({ [field]: val }).eq('id', s.id)
    if (error) { setError(error.message); return }
    setSessions((prev) => prev.map((r) => r.id === s.id ? { ...r, [field]: val } : r))
    setNotice('Saved.')
  }

  async function deleteSession(id) {
    await supabase.from('live_sessions').delete().eq('id', id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setNotice('Session deleted.')
  }

  const liveSessions = sessions.filter(s => s.is_live)

  return (
    <div>
      <p className="label-eyebrow">Live classes</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-navy-900">Live Sessions</h1>
      <p className="mt-2 max-w-xl text-sm text-navy-600">
        Schedule Jitsi video sessions. On class day, click <strong>Start & Go Live</strong> —
        your class room opens in a new browser tab with your camera ready, and students
        can join from their portal instantly. No apps or accounts needed.
      </p>

      {/* How it works */}
      <div className="card mt-5 p-5 border-indigo-200 bg-indigo-50">
        <p className="text-sm font-semibold text-indigo-900">How live sessions work</p>
        <ol className="mt-2 list-decimal list-inside space-y-1 text-sm text-indigo-800">
          <li>Schedule a session below with a title, date and room password.</li>
          <li>On class day, click <strong>Start & Go Live</strong> on that session.</li>
          <li>Your class room opens in a <strong>new browser tab</strong> with your camera on — you are the teacher.</li>
          <li>Students see a "Join Class" button in their Live tab — it opens the same room in their browser.</li>
          <li>When class ends, close the tab, click <strong>End Session</strong>, and optionally add a recording link.</li>
        </ol>
      </div>

      {/* Live now indicator */}
      {liveSessions.length > 0 && (
        <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-sm font-bold text-rose-700">
              {liveSessions.map(s => `"${s.title}"`).join(', ')} is live now
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveSessions.map(s => (
              <a
                key={s.id}
                href={buildJitsiUrl(s, true)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
              >
                🎓 Rejoin teaching room →
              </a>
            ))}
          </div>
        </div>
      )}

      {notice && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}

      {/* Create form */}
      <form onSubmit={handleCreate} className="card mt-5 p-6 space-y-4">
        <h2 className="font-semibold text-navy-900">Schedule a new session</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label">Session title</label>
            <input className="field-input" required
              placeholder="e.g. Week 3 — The Call to Ministry"
              value={form.title} onChange={(e) => update('title', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Description (optional)</label>
            <input className="field-input" placeholder="Brief description"
              value={form.description} onChange={(e) => update('description', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Date &amp; time</label>
            <input type="datetime-local" className="field-input" required
              value={form.scheduled_at} onChange={(e) => update('scheduled_at', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Track</label>
            <select className="field-select" value={form.track}
              onChange={(e) => update('track', e.target.value)}>
              {TRACKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Room name (auto-generated)</label>
            <input className="field-input font-mono text-sm" required
              placeholder="rowam-week3"
              value={form.room_name}
              onChange={(e) => setForm((f) => ({ ...f, room_name: e.target.value, _roomEdited: true }))} />
            <p className="mt-1 text-xs text-navy-400">Unique ID for this session's video room.</p>
          </div>
          <div>
            <label className="field-label">Room password (recommended)</label>
            <input className="field-input" placeholder="e.g. rowam2026"
              value={form.room_password} onChange={(e) => update('room_password', e.target.value)} />
            <p className="mt-1 text-xs text-navy-400">Students on the portal get this automatically.</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? 'Saving…' : 'Schedule session'}
        </button>
      </form>

      {/* Sessions list */}
      {loading ? (
        <p className="mt-8 text-sm text-navy-400">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-sm text-navy-400">No sessions scheduled yet.</div>
      ) : (
        <div className="mt-5 space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className={`card p-5 ${s.is_live ? 'border-rose-300' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.is_live && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        Live
                      </span>
                    )}
                    <span className="font-semibold text-navy-900">{s.title}</span>
                    <span className="text-xs text-navy-400 font-mono">#{s.room_name}</span>
                  </div>
                  {s.description && <p className="text-xs text-navy-500 mt-0.5">{s.description}</p>}
                  <p className="text-xs text-navy-400 mt-1">
                    {new Date(s.scheduled_at).toLocaleDateString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'short',
                      year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} · {s.track}
                  </p>
                  {s.room_password && (
                    <p className="text-xs text-navy-400 mt-0.5">
                      Password: <span className="font-mono font-semibold text-navy-700">{s.room_password}</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => toggleLive(s)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                      s.is_live
                        ? 'bg-rose-600 text-white hover:bg-rose-500'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {s.is_live ? 'End session' : 'Start & Go Live'}
                  </button>
                  {s.is_live && (
                    <a
                      href={buildJitsiUrl(s, true)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      Rejoin room →
                    </a>
                  )}
                  <button onClick={() => deleteSession(s.id)}
                    className="rounded-xl border border-navy-200 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-navy-100">
                <label className="field-label">Recording link (after class — Google Drive, YouTube, etc.)</label>
                <div className="flex gap-2">
                  <input className="field-input text-sm"
                    placeholder="Paste a link to the class recording…"
                    defaultValue={s.recording_url || ''}
                    onChange={(e) => setInputs((p) => ({ ...p, [`rec_${s.id}`]: e.target.value }))} />
                  <button type="button"
                    onClick={() => saveField(s, 'recording_url', inputs[`rec_${s.id}`] ?? s.recording_url ?? '')}
                    className="btn-primary !px-3 !py-2 text-xs shrink-0">Save</button>
                </div>
                {s.recording_url && <p className="mt-1 text-xs text-emerald-600">✓ Recording saved — students can rewatch</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
