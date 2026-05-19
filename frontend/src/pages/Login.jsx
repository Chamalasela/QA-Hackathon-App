import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamId, setTeamId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!teamId) {
      setError('Please select your team')
      return
    }
    try {
      const { token, user } = await api.login(email, password, Number(teamId))
      onLogin(user, token)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-overlay">
          <div className="login-hero-content">
            <div className="login-hero-brand">
              <span className="login-hero-icon">🏥</span>
              <h1>MediCare Clinic</h1>
              <p>Comprehensive Healthcare Management System</p>
            </div>
            <div className="login-hero-features">
              <div className="login-hero-feature">
                <span>📋</span>
                <span>Appointment Scheduling</span>
              </div>
              <div className="login-hero-feature">
                <span>👨‍⚕️</span>
                <span>Doctor Management</span>
              </div>
              <div className="login-hero-feature">
                <span>💳</span>
                <span>Billing & Invoicing</span>
              </div>
              <div className="login-hero-feature">
                <span>📊</span>
                <span>Patient Records</span>
              </div>
            </div>
            <div className="login-credentials-box">
              <h4>🔑 Test Credentials</h4>
              <table>
                <thead>
                  <tr><th>Role</th><th>Email</th><th>Password</th></tr>
                </thead>
                <tbody>
                  <tr><td>Admin</td><td>admin@test.com</td><td>Test@123</td></tr>
                  <tr><td>Doctor</td><td>doctor@test.com</td><td>Test@123</td></tr>
                  <tr><td>Patient</td><td>patient@test.com</td><td>Test@123</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Team</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)}>
                <option value="">-- Select Team --</option>
                <option value="1">Team Nebula</option>
                <option value="2">Team Orion</option>
                <option value="3">Team Nova</option>
                <option value="4">Team Cosmos</option>
                <option value="5">Team Andromeda</option>
              </select>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1em' }}>Sign In</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9em', color: '#666' }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
