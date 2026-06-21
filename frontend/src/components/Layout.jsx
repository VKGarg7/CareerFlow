import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
        pathname === to
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold text-blue-600">CareerFlow</span>
          <nav className="flex gap-1">
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/companies', 'Companies')}
            {navLink('/profile', 'Profile')}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
