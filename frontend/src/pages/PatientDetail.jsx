import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function PatientDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    /* BUG S1: No client-side check — any user can navigate to any patient ID */
    api.getPatient(id).then(p => { setPatient(p); setForm(p) }).catch(e => setError(e.message))
  }, [id])

  const handleSave = async () => {
    try {
      const updated = await api.updatePatient(id, form)
      setPatient(updated)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async () => {
    /* BUG U4: No confirmation dialog — deletes immediately */
    try {
      await api.deletePatient(id)
      navigate('/patients')
    } catch (err) {
      setError(err.message)
    }
  }

  if (!patient) return <div className="card">{error || 'Loading...'}</div>

  return (
    <div>
      <div className="card">
        <div className="detail-header">
          <h2>Patient: {patient.first_name} {patient.last_name}</h2>
          <div className="actions">
            {!editing && <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}>Edit</button>}
            {user?.role === 'admin' && <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>}
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        {editing ? (
          <div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={form.date_of_birth || ''} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender || ''} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>SSN</label>
                <input value={form.ssn || ''} onChange={e => setForm({...form, ssn: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Insurance Number</label>
                <input value={form.insurance_number || ''} onChange={e => setForm({...form, insurance_number: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Medical History</label>
              {/* BUG S2: No input sanitization — XSS possible through this field */}
              <textarea rows="3" value={form.medical_history || ''} onChange={e => setForm({...form, medical_history: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input value={form.emergency_contact || ''} onChange={e => setForm({...form, emergency_contact: e.target.value})} />
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
              <button className="btn btn-outline" onClick={() => { setEditing(false); setForm(patient) }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <table>
              <tbody>
                <tr><td><strong>Email</strong></td><td>{patient.email}</td></tr>
                <tr><td><strong>Phone</strong></td><td>{patient.phone}</td></tr>
                <tr><td><strong>Date of Birth</strong></td><td>{patient.date_of_birth}</td></tr>
                <tr><td><strong>Gender</strong></td><td>{patient.gender}</td></tr>
                <tr><td><strong>Address</strong></td><td>{patient.address}</td></tr>
                {/* BUG D2/S3: SSN visible to all roles */}
                <tr><td><strong>SSN</strong></td><td>{patient.ssn}</td></tr>
                <tr><td><strong>Insurance #</strong></td><td>{patient.insurance_number}</td></tr>
                {/* BUG D1: Medical history visible to admin/receptionist — should be doctor-only */}
                <tr><td><strong>Medical History</strong></td><td><span dangerouslySetInnerHTML={{ __html: patient.medical_history }} /></td></tr>
                {/* BUG S2: dangerouslySetInnerHTML renders stored XSS */}
                <tr><td><strong>Emergency Contact</strong></td><td>{patient.emergency_contact}</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
