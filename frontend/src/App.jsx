import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OAuthCallback from './pages/OAuthCallback'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Workspaces from './pages/Workspaces'
import Companies from './pages/Companies'
import Applications from './pages/Applications'
import Contacts from './pages/Contacts'
import FollowUps from './pages/FollowUps'
import Referrals from './pages/Referrals'
import ActionItems from './pages/ActionItems'
import Timeline from './pages/Timeline'
import Deadlines from './pages/Deadlines'
import FollowUpRules from './pages/FollowUpRules'
import Today from './pages/Today'
import Goals from './pages/Goals'
import ResumeLibrary from './pages/ResumeLibrary'
import CoverLetterLibrary from './pages/CoverLetterLibrary'
import Opportunities from './pages/Opportunities'
import AdminDashboard from './pages/AdminDashboard'
import Activity from './pages/Activity'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? <ProfileProvider>{children}</ProfileProvider> : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return localStorage.getItem('role') === 'ADMIN' ? <ProfileProvider>{children}</ProfileProvider> : <Navigate to="/dashboard" replace />
}

function RootRoute() {
  const token = localStorage.getItem('token')
  return token ? <Navigate to="/dashboard" replace /> : <Landing />
}

export default function App() {
  return (
    <BrowserRouter>
      <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/today"
          element={
            <PrivateRoute>
              <Today />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/workspaces"
          element={
            <PrivateRoute>
              <Workspaces />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <Companies />
            </PrivateRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <PrivateRoute>
              <Applications />
            </PrivateRoute>
          }
        />
        <Route
          path="/opportunities"
          element={
            <PrivateRoute>
              <Opportunities />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <Contacts />
            </PrivateRoute>
          }
        />
        <Route
          path="/follow-ups"
          element={
            <PrivateRoute>
              <FollowUps />
            </PrivateRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <PrivateRoute>
              <Referrals />
            </PrivateRoute>
          }
        />
        <Route
          path="/action-items"
          element={
            <PrivateRoute>
              <ActionItems />
            </PrivateRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <PrivateRoute>
              <Timeline />
            </PrivateRoute>
          }
        />
        <Route
          path="/deadlines"
          element={
            <PrivateRoute>
              <Deadlines />
            </PrivateRoute>
          }
        />
        <Route
          path="/follow-up-rules"
          element={
            <PrivateRoute>
              <FollowUpRules />
            </PrivateRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <PrivateRoute>
              <Goals />
            </PrivateRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <PrivateRoute>
              <ResumeLibrary />
            </PrivateRoute>
          }
        />
        <Route
          path="/cover-letters"
          element={
            <PrivateRoute>
              <CoverLetterLibrary />
            </PrivateRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <PrivateRoute>
              <Activity />
            </PrivateRoute>
          }
        />
      </Routes>
      </WorkspaceProvider>
    </BrowserRouter>
  )
}
