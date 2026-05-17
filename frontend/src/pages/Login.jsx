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
    <div className="login-container">
      <div className="login-card">
        <h1>🏥 MediCare Clinic</h1>
        <p className="subtitle">Sign in to your account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)}>
              <option value="">-- Select Team --</option>
              {[1,2,3,4,5,6].map(t => <option key={t} value={t}>Team {t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9em' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}
