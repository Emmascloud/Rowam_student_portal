import { NavLink, Outlet } from 'react-router-dom'
import RowamMark from '../components/RowamMark'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/admin', label: 'Applications', end: true },
  { to: '/admin/course-requests', label: 'Course Requests' },
  { to: '/admin/live', label: 'Live Sessions' },
  { to: '/admin/resources', label: 'Resources' },
  { to: '/admin/timetable', label: 'Timetable' },
  { to: '/admin/notifications', label: 'Notifications' },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="border-b border-charcoal-100 bg-charcoal-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <RowamMark className="h-9 w-9" />
            <div className="leading-tight">
              <div className="font-display text-base font-semibold text-white">ROWAM Admin</div>
              <div className="text-[10px] uppercase tracking-widest text-charcoal-500">Staff panel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-charcoal-400 sm:block">{profile?.email}</span>
            <button onClick={signOut} className="text-xs font-semibold text-charcoal-400 hover:text-white transition-colors">
              Sign out
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl overflow-x-auto px-5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-charcoal-500 hover:text-charcoal-200'
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
