import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-navy-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function RequireAdmin({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="mx-auto max-w-2xl px-5 py-24 text-center text-navy-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}
