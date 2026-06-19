import { Link, NavLink } from 'react-router-dom'
import RowamMark from './RowamMark'
import { useAuth } from '../context/AuthContext'

export default function SiteHeader() {
  const { user, profile, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-[#f7f6f2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-3">
          <RowamMark className="h-10 w-10 shrink-0" />
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold text-navy-900">ROWAM</div>
            <div className="text-[11px] uppercase tracking-wider text-navy-500">School of Ministry</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-medium text-navy-700 sm:flex">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'text-navy-900' : 'hover:text-navy-900'}>
            Home
          </NavLink>
          <NavLink to="/timetable" className={({ isActive }) => isActive ? 'text-navy-900' : 'hover:text-navy-900'}>
            Timetable
          </NavLink>
          {user && profile?.role !== 'admin' && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'text-navy-900' : 'hover:text-navy-900'}>
              My application
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {profile?.role === 'admin' ? (
                <Link to="/admin" className="btn-outline !px-4 !py-2 text-sm">Admin panel</Link>
              ) : (
                <Link to="/dashboard" className="btn-outline !px-4 !py-2 text-sm sm:hidden">My application</Link>
              )}
              <button onClick={signOut} className="text-sm font-medium text-navy-500 hover:text-navy-800">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-medium text-navy-700 hover:text-navy-900 sm:block">
                Sign in
              </Link>
              <Link to="/apply" className="btn-gold !px-4 !py-2.5 text-sm">Apply now</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
