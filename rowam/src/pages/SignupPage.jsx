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

    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (signUpError) { setError(signUpError.message); return }
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="eyebrow">New student</div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal-900">Create account</h1>
          <p className="mt-2 text-sm text-charcoal-500">
            You'll use this account to fill out your application and access your student portal.
          </p>
        </div>

        <div className="card p-7 space-y-5">
          <div>
            <label className="field-label">Email address</label>
            <input type="email" required className="field-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input type="password" required minLength={6} className="field-input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="field-label">Confirm password</label>
            <input type="password" required minLength={6} className="field-input" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-indigo w-full !py-3.5">
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-charcoal-500">
          Already have an account?{' '}
          <Link to="/login" state={{ redirectTo }} className="font-semibold text-charcoal-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
