import { useState, useEffect } from 'react'
import { api } from '../api'

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState({ data: [], total: 0 })
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.getAppointments().then(setAppointments).catch(e => setError(e.message))
    api.getDoctors().then(setDoctors).catch(() => {})
    api.getPatients().then(setPatients).catch(() => {})
  }, [])

  const appts = appointments.data || []
  const scheduled = appts.filter(a => a.status === 'scheduled').length
  const completed = appts.filter(a => a.status === 'completed').length
  const cancelled = appts.filter(a => a.status === 'cancelled').length

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{patients.length}</div>
          <div className="stat-label">Total Patients</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{doctors.length}</div>
          <div className="stat-label">Doctors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{scheduled}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cancelled}</div>
          <div className="stat-label">Cancelled</div>
        </div>
        {/* BUG F9: Total count is wrong from API */}
        <div className="stat-card">
          <div className="stat-value">{appointments.total}</div>
          <div className="stat-label">Total (API count)</div>
        </div>
      </div>

      <div className="card">
        <h2>Doctors</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialization</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Consultation Fee</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.id}>
                <td>Dr. {d.first_name} {d.last_name}</td>
                <td>{d.specialization}</td>
                <td>{d.email}</td>
                <td>{d.phone}</td>
                <td>${d.consultation_fee}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Recent Appointments</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {/* BUG P1: ALL appointments loaded at once — no pagination */}
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appts.slice(0, 20).map(a => (
              <tr key={a.id}>
                <td>{a.appointment_date}</td>
                <td>{a.time_slot}</td>
                <td>{a.patient_first_name} {a.patient_last_name}</td>
                <td>Dr. {a.doctor_first_name} {a.doctor_last_name}</td>
                <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {appts.length > 20 && <p style={{ textAlign: 'center', color: '#999', padding: 12 }}>Showing 20 of {appointments.total}</p>}
      </div>
    </div>
  )
}
