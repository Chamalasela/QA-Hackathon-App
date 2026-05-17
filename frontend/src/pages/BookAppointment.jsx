import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function BookAppointment({ user }) {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(user.patientId || '')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [slots, setSlots] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(() => {})
    if (user.role === 'admin') {
      api.getPatients().then(setPatients).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      api.getAvailability(selectedDoctor, selectedDate).then(data => {
        setSlots(data.available_slots || [])
        setSelectedSlot('')
      }).catch(() => setSlots([]))
    }
  }, [selectedDoctor, selectedDate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.bookAppointment({
        patient_id: selectedPatient,
        doctor_id: selectedDoctor,
        appointment_date: selectedDate,
        time_slot: selectedSlot
      })
      setSuccess('Appointment booked successfully!')
      setTimeout(() => navigate('/appointments'), 1500)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="card">
      <h2>Book Appointment</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        {user.role === 'admin' && (
          <div className="form-group">
            <label>Patient *</label>
            <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} required>
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.email}</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Doctor *</label>
          <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required>
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} — {d.specialization} (${d.consultation_fee})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required />
        </div>
        {slots.length > 0 && (
          <div className="form-group">
            <label>Available Time Slots *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {slots.map(slot => (
                <button
                  type="button"
                  key={slot}
                  className={`btn btn-sm ${selectedSlot === slot ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedDate && selectedDoctor && slots.length === 0 && (
          <div className="alert alert-error">No available slots for this date. Please try another date.</div>
        )}
        <button type="submit" className="btn btn-primary" disabled={!selectedSlot} style={{ marginTop: 16 }}>
          Book Appointment
        </button>
      </form>
    </div>
  )
}
