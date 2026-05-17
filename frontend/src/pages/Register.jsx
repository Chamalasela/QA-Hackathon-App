import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', ssn: '', insurance_number: '', team_id: '' })
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.team_id) {
      setError('Please select your team')
      return
    }
    try {
      const { token, user } = await api.register({ ...form, team_id: Number(form.team_id) })
      onLogin(user, token)
    } catch (err) {
      setError(err.message)
      setForm({ email: '', password: '', first_name: '', last_name: '', phone: '', date_of_birth: '', gender: '', ssn: '', insurance_number: '', team_id: '' })
    }
  }

  return (
    <div className="login-container">
      <div className="login-card" style={{ width: 500 }}>
        <h1>🏥 Patient Registration</h1>
        <p className="subtitle">Create your MediCare Clinic account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team *</label>
            <select name="team_id" value={form.team_id} onChange={handleChange} required>
              <option value="">-- Select Team --</option>
              {[1,2,3,4,5,6].map(t => <option key={t} value={t}>Team {t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input type="text" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>SSN</label>
              <input name="ssn" value={form.ssn} onChange={handleChange} placeholder="XXX-XX-XXXX" />
            </div>
          </div>
          <div className="form-group">
            <label>Insurance Number</label>
            <input name="insurance_number" value={form.insurance_number} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.9em' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
