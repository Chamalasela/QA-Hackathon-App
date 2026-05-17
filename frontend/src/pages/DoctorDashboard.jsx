import { useState, useEffect } from 'react'
import { api } from '../api'

export default function DoctorDashboard({ user }) {
  const [appointments, setAppointments] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [notesModal, setNotesModal] = useState(null)
  const [notes, setNotes] = useState('')
  const [prescription, setPrescription] = useState('')

  useEffect(() => {
    if (user.doctorId) {
      /* BUG P2: This endpoint has N+1 query problem — each appointment triggers separate patient query */
      api.getDoctorAppointments(user.doctorId, selectedDate).then(setAppointments).catch(e => setError(e.message))
    }
  }, [user.doctorId, selectedDate])

  const handleComplete = async (id) => {
    try {
      /* BUG S2: notes/prescription not sanitized — stored XSS */
      await api.completeAppointment(id, { notes, prescription })
      setNotesModal(null)
      setNotes('')
      setPrescription('')
      api.getDoctorAppointments(user.doctorId, selectedDate).then(setAppointments)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{appointments.length}</div>
          <div className="stat-label">Today's Appointments</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{appointments.filter(a => a.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{appointments.filter(a => a.status === 'scheduled').length}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="card">
        <div className="detail-header">
          <h2>Doctor Dashboard</h2>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Email</th>
              <th>Phone</th>
              {/* BUG D1: Medical history visible in doctor dashboard (but this is intended for doctors) */}
              {/* BUG D2: However, SSN should NOT be shown here */}
              <th>Medical History</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(a => (
              <tr key={a.id}>
                <td>{a.time_slot}</td>
                <td>{a.patient_name}</td>
                <td>{a.patient_email}</td>
                <td>{a.patient_phone}</td>
                {/* BUG S2: Renders HTML from medical_history — stored XSS vector */}
                <td><span dangerouslySetInnerHTML={{ __html: a.patient_medical_history }} /></td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                <td>{a.notes || '—'}</td>
                <td className="actions">
                  {a.status === 'scheduled' && (
                    <button className="btn btn-sm btn-accent" onClick={() => setNotesModal(a.id)}>Complete</button>
                  )}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: '#999' }}>No appointments for this date</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {notesModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 500, margin: 0 }}>
            <h2>Complete Appointment</h2>
            <div className="form-group">
              <label>Notes</label>
              {/* BUG S2: No sanitization on input — allows HTML/script injection */}
              <textarea rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter consultation notes..." />
            </div>
            <div className="form-group">
              <label>Prescription</label>
              <textarea rows="3" value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Enter prescription..." />
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => handleComplete(notesModal)}>Save & Complete</button>
              <button className="btn btn-outline" onClick={() => setNotesModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
