import { Link, NavLink } from 'react-router-dom'
import RowamMark from './RowamMark'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <RowamMark className="h-9 w-9 shrink-0" />
          <div className="leading-tight">
            <div className="font-display text-base font-semibold text-charcoal-900">ROWAM</div>
            <div className="text-[10px] uppercase tracking-widest text-charcoal-400">School of Ministry</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink to="/" end className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-charcoal-100 text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800 hover:bg-charcoal-50'}`
          }>Home</NavLink>
          <NavLink to="/timetable" className={({ isActive }) =>
            `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-charcoal-100 text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800 hover:bg-charcoal-50'}`
          }>Timetable</NavLink>
          {user && profile?.role !== 'admin' && (
            <NavLink to="/dashboard" className={({ isActive }) =>
              `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-charcoal-100 text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-800 hover:bg-charcoal-50'}`
            }>My Portal</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {profile?.role === 'admin' ? (
                <Link to="/admin" className="btn-indigo !px-4 !py-2 text-sm">Admin panel</Link>
              ) : (
                <Link to="/dashboard" className="btn-ghost !px-4 !py-2 text-sm sm:hidden">My Portal</Link>
              )}
              <button onClick={signOut} className="btn-ghost !px-4 !py-2 text-sm">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost hidden !px-4 !py-2 text-sm sm:inline-flex">Sign in</Link>
              <Link to="/apply" className="btn-indigo !px-4 !py-2.5 text-sm">Apply now</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
