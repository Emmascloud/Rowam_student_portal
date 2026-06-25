import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (signInError) {
      setError('Incorrect email or password. Please try again.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', data.user.id).single()

    navigate(profile?.role === 'admin' ? '/admin' : redirectTo, { replace: true })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="eyebrow">Welcome back</div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal-900">Sign in</h1>
          <p className="mt-2 text-sm text-charcoal-500">Access your student portal or staff panel.</p>
        </div>

        <div className="card p-7 space-y-5">
          <div>
            <label className="field-label">Email address</label>
            <input id="email" type="email" required className="field-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input id="password" type="password" required className="field-input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="btn-indigo w-full !py-3.5">
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-charcoal-500">
          Don't have an account?{' '}
          <Link to="/signup" state={{ redirectTo }} className="font-semibold text-charcoal-900 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
