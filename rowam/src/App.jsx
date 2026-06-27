import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth, RequireAdmin } from './components/RouteGuards'

import SiteLayout from './components/SiteLayout'
import HomePage from './pages/HomePage'
import TimetablePage from './pages/TimetablePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import ApplyPage from './pages/ApplyPage'
import DashboardPage from './pages/DashboardPage'

import AdminLayout from './admin/AdminLayout'
import AdminApplicationsPage from './admin/AdminApplicationsPage'
import AdminStudentDetailPage from './admin/AdminStudentDetailPage'
import AdminTimetablePage from './admin/AdminTimetablePage'
import AdminNotificationsPage from './admin/AdminNotificationsPage'
import AdminResourcesPage from './admin/AdminResourcesPage'
import AdminCourseRequestsPage from './admin/AdminCourseRequestsPage'
import AdminLiveSessionsPage from './admin/AdminLiveSessionsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminApplicationsPage />} />
            <Route path="students/:id" element={<AdminStudentDetailPage />} />
            <Route path="timetable" element={<AdminTimetablePage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="resources" element={<AdminResourcesPage />} />
            <Route path="course-requests" element={<AdminCourseRequestsPage />} />
            <Route path="live" element={<AdminLiveSessionsPage />} />
            <Route path="live" element={<AdminLiveSessionsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-navy-900">Page not found</h1>
      <p className="mt-3 text-navy-600">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary mt-6 inline-flex">Back to home</a>
    </div>
  )
}
