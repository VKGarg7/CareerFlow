import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Companies from './pages/Companies'
import Applications from './pages/Applications'
import Recruiters from './pages/Recruiters'
import FollowUps from './pages/FollowUps'
import Referrals from './pages/Referrals'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
          path="/recruiters"
          element={
            <PrivateRoute>
              <Recruiters />
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
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
