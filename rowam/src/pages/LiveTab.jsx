import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Jitsi external API loader — loads the Jitsi Meet External API script
// from the public meet.jit.si server on demand (not bundled).
function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

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
    <div className="flex items-center gap-3">
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

function JitsiRoom({ session, displayName, isAdmin }) {
  const containerRef = useRef(null)
  const apiRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        await loadJitsiScript()
        if (!mounted || !containerRef.current) return

        // Clean up any previous instance
        if (apiRef.current) {
          apiRef.current.dispose()
          apiRef.current = null
        }

        const options = {
          roomName: session.room_name,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: displayName || 'Student' },
          configOverwrite: {
            startWithAudioMuted: !isAdmin,   // students join muted
            startWithVideoMuted: !isAdmin,   // students join camera off
            disableDeepLinking: true,
            prejoinPageEnabled: false,       // skip the pre-join screen
            enableWelcomePage: false,
            toolbarButtons: isAdmin
              ? ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'hangup']
              : ['microphone', 'camera', 'chat', 'raisehand', 'tileview', 'hangup'],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            DEFAULT_BACKGROUND: '#0f0f0f',
            DISABLE_VIDEO_BACKGROUND: false,
            MOBILE_APP_PROMO: false,
          },
        }

        const api = new window.JitsiMeetExternalAPI('meet.jit.si', options)
        apiRef.current = api

        // Set room password after joining
        if (session.room_password) {
          api.addEventListener('videoConferenceJoined', () => {
            if (isAdmin) {
              api.executeCommand('password', session.room_password)
            } else {
              api.addEventListener('passwordRequired', () => {
                api.executeCommand('password', session.room_password)
              })
            }
          })
        }

        api.addEventListener('videoConferenceJoined', () => {
          if (mounted) setLoading(false)
        })

        api.addEventListener('readyToClose', () => {
          if (apiRef.current) {
            apiRef.current.dispose()
            apiRef.current = null
          }
        })

      } catch (err) {
        if (mounted) setError('Could not load the video call. Please refresh and try again.')
        setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
      if (apiRef.current) {
        apiRef.current.dispose()
        apiRef.current = null
      }
    }
  }, [session.room_name, session.room_password, displayName, isAdmin])

  return (
    <div className="relative rounded-2xl overflow-hidden bg-charcoal-950" style={{ height: '520px' }}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal-950 z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-3 text-sm text-charcoal-400">Connecting to class room…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-charcoal-950 z-10">
          <p className="text-sm text-rose-400 text-center px-8">{error}</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export default function LiveTab({ student }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joinedSession, setJoinedSession] = useState(null)

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

  // Poll every 20 seconds so is_live changes appear quickly without manual refresh
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
  const pastRecs = sessions.filter(s => s.recording_url)
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

  const displayName = student ? `${student.first_name} ${student.surname}` : 'Student'

  return (
    <div className="space-y-5">

      {/* LIVE NOW */}
      {liveNow ? (
        <div className="rounded-3xl overflow-hidden border border-rose-500/30 bg-charcoal-950">
          <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Class is live now</span>
              </div>
              <h2 className="mt-1 font-display text-lg font-semibold text-white">{liveNow.title}</h2>
              {liveNow.description && <p className="text-xs text-charcoal-400 mt-0.5">{liveNow.description}</p>}
            </div>
            {joinedSession?.id !== liveNow.id && (
              <button
                onClick={() => setJoinedSession(liveNow)}
                className="shrink-0 btn-indigo !px-5 !py-2.5 text-sm ml-4"
              >
                Join class →
              </button>
            )}
          </div>

          {joinedSession?.id === liveNow.id ? (
            <div className="p-4">
              <JitsiRoom
                session={liveNow}
                displayName={displayName}
                isAdmin={false}
              />
              <button
                onClick={() => setJoinedSession(null)}
                className="mt-3 w-full btn-outline text-sm text-rose-500 border-rose-200 hover:bg-rose-50"
              >
                Leave class
              </button>
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <p className="text-charcoal-400 text-sm mb-4">
                Your class is in session. Click "Join class" to enter with your camera and microphone.
              </p>
              <p className="text-xs text-charcoal-600">
                You will join with your camera and microphone off by default.
              </p>
            </div>
          )}
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
        </div>
      ) : (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">🎓</div>
          <h3 className="font-semibold text-charcoal-900">No live session scheduled yet</h3>
          <p className="mt-2 text-sm text-charcoal-500">Check back soon — your next class will appear here when scheduled.</p>
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
                    {new Date(s.scheduled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
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
