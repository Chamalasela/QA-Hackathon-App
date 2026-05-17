import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Appointments({ user }) {
  const [appointments, setAppointments] = useState({ data: [], total: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      const params = {}
      if (user.role === 'patient' && user.patientId) params.patient_id = user.patientId
      if (user.role === 'doctor' && user.doctorId) params.doctor_id = user.doctorId
      const data = await api.getAppointments(params)
      setAppointments(data)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = async (id) => {
    /* BUG U4: No confirmation dialog — cancels immediately on click */
    try {
      await api.cancelAppointment(id)
      loadAppointments()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card">
      <div className="detail-header">
        <h2>{user.role === 'patient' ? 'My Appointments' : 'All Appointments'}</h2>
        {/* BUG F9: Shows incorrect total count */}
        <span style={{ color: '#757575', fontSize: '0.9em' }}>Total: {appointments.total} appointments</span>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            {user.role !== 'patient' && <th>Patient</th>}
            {user.role !== 'doctor' && <th>Doctor</th>}
            <th>Specialization</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(appointments.data || []).map(a => (
            <tr key={a.id}>
              <td>{a.appointment_date}</td>
              {/* BUG F6: Time displayed as-is from server (UTC), not converted to local timezone */}
              <td>{a.time_slot}</td>
              {user.role !== 'patient' && <td>{a.patient_first_name} {a.patient_last_name}</td>}
              {user.role !== 'doctor' && <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>}
              <td>{a.doctor_specialization}</td>
              <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
              <td className="actions">
                {a.status === 'scheduled' && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancel(a.id)}>Cancel</button>
                )}
              </td>
            </tr>
          ))}
          {(appointments.data || []).length === 0 && (
            <tr><td colSpan="7" style={{ textAlign: 'center', color: '#999' }}>No appointments found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
