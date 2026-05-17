import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from './api'
import Login from './pages/Login'
import Register from './pages/Register'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Appointments from './pages/Appointments'
import BookAppointment from './pages/BookAppointment'
import DoctorDashboard from './pages/DoctorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Billing from './pages/Billing'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    navigate(userData.role === 'doctor' ? '/doctor' : userData.role === 'admin' ? '/admin' : '/appointments')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    )
  }

  const navLinks = {
    patient: [
      { to: '/appointments', label: 'My Appointments' },
      { to: '/book', label: 'Book Appointment' },
    ],
    doctor: [
      { to: '/doctor', label: 'Dashboard' },
      { to: '/appointments', label: 'All Appointments' },
    ],
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/patients', label: 'Patients' },
      { to: '/appointments', label: 'Appointments' },
      { to: '/book', label: 'Book Appointment' },
      { to: '/billing', label: 'Billing' },
    ],
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">🏥 Medi<span>Care</span> Clinic</div>
        <nav>
          {(navLinks[user.role] || []).map(link => (
            <Link key={link.to} to={link.to} className={location.pathname === link.to ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="user-info">
          <span>{user.first_name} {user.last_name} ({user.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="main">
        <Routes>
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail user={user} />} />
          <Route path="/appointments" element={<Appointments user={user} />} />
          <Route path="/book" element={<BookAppointment user={user} />} />
          <Route path="/doctor" element={<DoctorDashboard user={user} />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/billing" element={<Billing user={user} />} />
          <Route path="*" element={<Navigate to={user.role === 'doctor' ? '/doctor' : user.role === 'admin' ? '/admin' : '/appointments'} />} />
        </Routes>
      </main>
    </div>
  )
}
