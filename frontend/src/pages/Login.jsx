import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const { token, user } = await api.login(email, password)
      onLogin(user, token)
    } catch (err) {
      setError(err.message) /* BUG U2: shows generic "Something went wrong" */
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
