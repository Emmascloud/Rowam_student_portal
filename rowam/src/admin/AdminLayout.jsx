import { NavLink, Outlet } from 'react-router-dom'
import RowamMark from '../components/RowamMark'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/admin', label: 'Applications', end: true },
  { to: '/admin/timetable', label: 'Timetable' },
  { to: '/admin/notifications', label: 'Notifications' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <header className="border-b border-navy-100 bg-navy-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <RowamMark className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-base font-semibold text-white">ROWAM Admin</div>
              <div className="text-[11px] uppercase tracking-wider text-navy-400">Staff panel</div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-navy-300 sm:block">{profile?.email}</span>
            <button onClick={signOut} className="text-sm font-medium text-navy-200 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 px-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-gold-500 text-white'
                    : 'border-transparent text-navy-400 hover:text-navy-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  )
}
