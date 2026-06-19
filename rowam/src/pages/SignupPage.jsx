import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SignupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo || '/apply'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <p className="label-eyebrow">Create your account</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">Sign up to apply</h1>
      <p className="mt-2 text-sm text-navy-600">
        You'll use this account to fill out your enrollment form and check your application status later.
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
            minLength={6}
            className="field-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-gold w-full !py-3">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-navy-600">
        Already have an account?{' '}
        <Link to="/login" state={{ redirectTo }} className="font-semibold text-navy-900 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
