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

    // Check role to decide where to send them
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="label-eyebrow">Welcome back</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">Sign in</h1>
      <p className="mt-2 text-sm text-navy-600">
        Sign in to continue your application or check its status.
      </p>

      <form onSubmit={handleSubmit} className="card mt-8 space-y-5 p-7">
        <div>
          <label className="field-label" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-gold w-full !py-3">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-600">
        Don't have an account?{' '}
        <Link to="/signup" state={{ redirectTo }} className="font-semibold text-navy-900 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
