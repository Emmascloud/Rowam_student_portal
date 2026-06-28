import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

function Countdown({ scheduledAt }) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    const target = new Date(scheduledAt).getTime()
    const tick = () => setDiff(Math.max(0, target - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [scheduledAt])

  if (diff <= 0) return <span className="text-indigo-400 font-semibold text-sm">Starting soon…</span>

  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {d > 0 && (
        <div className="text-center">
          <div className="font-display text-3xl font-semibold text-white">{d}</div>
          <div className="text-[10px] uppercase tracking-widest text-charcoal-400">days</div>
        </div>
      )}
      {[['hrs', pad(h)], ['min', pad(m)], ['sec', pad(sec)]].map(([label, val], i) => (
        <div key={label} className="flex items-center gap-3">
          {i > 0 && <div className="font-display text-2xl text-charcoal-600">:</div>}
          <div className="text-center">
            <div className="font-display text-3xl font-semibold text-white">{val}</div>
            <div className="text-[10px] uppercase tracking-widest text-charcoal-400">{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Build the Jitsi URL that opens directly with room name and optional password.
// Opening in a new tab bypasses Chrome Android's iframe camera/mic restrictions.
function buildJitsiUrl(session, displayName) {
  const base = `https://meet.jit.si/${encodeURIComponent(session.room_name)}`
  const params = new URLSearchParams()
  if (displayName) params.set('userInfo.displayName', displayName)
  // Pass config overrides via URL hash fragment (Jitsi URL config format)
  const config = [
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=true',
    'config.prejoinPageEnabled=false',
    'config.disableDeepLinking=true',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.MOBILE_APP_PROMO=false',
  ].join('&')
  return `${base}#${config}`
}

export default function LiveTab({ student }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .order('scheduled_at', { ascending: false })
    if (error) setError('Could not load live sessions.')
    else setSessions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Poll every 20s so is_live changes appear quickly
  useEffect(() => {
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [load])

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (error) return <div className="card p-8 text-center text-rose-500 text-sm">{error}</div>

  const liveNow  = sessions.find(s => s.is_live)
  const upcoming = sessions
    .filter(s => !s.is_live && new Date(s.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
  const pastRecs = sessions
    .filter(s => s.recording_url)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

  const displayName = student ? `${student.first_name} ${student.surname}` : 'Student'

  return (
    <div className="space-y-5">

      {/* LIVE NOW */}
      {liveNow ? (
        <div className="rounded-3xl overflow-hidden border border-rose-500/30 bg-charcoal-950">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Class is live now</span>
            </div>

            <h2 className="font-display text-2xl font-semibold text-white">{liveNow.title}</h2>
            {liveNow.description && (
              <p className="mt-1 text-sm text-charcoal-300">{liveNow.description}</p>
            )}
            <p className="mt-2 text-xs text-charcoal-500">
              {new Date(liveNow.scheduled_at).toLocaleDateString('en-GB', {
                weekday: 'long', day: '2-digit', month: 'long',
                year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* Join instructions */}
          <div className="mx-5 mb-5 rounded-2xl bg-charcoal-900 p-5">
            <p className="text-sm text-charcoal-300 leading-relaxed">
              Your class is in session. Tap the button below to join with your camera and microphone.
              The class opens in a new tab — come back here when class ends.
            </p>

            <a
              href={buildJitsiUrl(liveNow, displayName)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white hover:bg-indigo-500 transition-colors active:scale-[0.98]"
            >
              <span>🎓</span>
              Join class now →
            </a>

            {liveNow.room_password && (
              <p className="mt-3 text-center text-xs text-charcoal-500">
                Room password: <span className="font-mono font-semibold text-charcoal-300">{liveNow.room_password}</span>
              </p>
            )}
          </div>
        </div>
      ) : upcoming.length > 0 ? (
        /* Next scheduled class with countdown */
        <div className="rounded-3xl bg-charcoal-950 border border-charcoal-800 p-7">
          <div className="eyebrow text-indigo-400">Next class</div>
          <h2 className="mt-2 font-display text-xl font-semibold text-white">{upcoming[0].title}</h2>
          {upcoming[0].description && (
            <p className="mt-1 text-sm text-charcoal-400">{upcoming[0].description}</p>
          )}
          <p className="mt-2 text-xs text-charcoal-500">
            {new Date(upcoming[0].scheduled_at).toLocaleDateString('en-GB', {
              weekday: 'long', day: '2-digit', month: 'long',
              year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-widest text-charcoal-500 mb-3">Starts in</div>
            <Countdown scheduledAt={upcoming[0].scheduled_at} />
          </div>
          <p className="mt-5 text-xs text-charcoal-600">
            A "Join Class" button will appear here when your teacher starts the session.
          </p>
        </div>
      ) : (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <h3 className="font-semibold text-charcoal-900">No live session scheduled yet</h3>
          <p className="mt-2 text-sm text-charcoal-500">
            Check back soon — your next class will appear here when scheduled.
          </p>
        </div>
      )}

      {/* More upcoming sessions */}
      {upcoming.length > 1 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-4">Upcoming classes</h2>
          <div className="space-y-2">
            {upcoming.slice(1).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl bg-charcoal-50 border border-charcoal-100 px-4 py-3">
                <div>
                  <div className="font-semibold text-charcoal-900 text-sm">{s.title}</div>
                  <div className="text-xs text-charcoal-400 mt-0.5">
                    {new Date(s.scheduled_at).toLocaleDateString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400">Scheduled</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past recordings */}
      {pastRecs.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-charcoal-900 mb-4">Past recordings</h2>
          <div className="space-y-2">
            {pastRecs.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-charcoal-100 bg-charcoal-50 px-4 py-3">
                <div>
                  <div className="font-semibold text-charcoal-900 text-sm">{s.title}</div>
                  <div className="text-xs text-charcoal-400 mt-0.5">
                    {new Date(s.scheduled_at).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </div>
                </div>
                <a href={s.recording_url} target="_blank" rel="noreferrer"
                  className="btn-outline !py-1.5 !px-3 text-xs shrink-0 ml-3">
                  Watch →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
