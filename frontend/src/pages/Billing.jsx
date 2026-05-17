import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Billing({ user }) {
  const [invoices, setInvoices] = useState([])
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ appointment_id: '', patient_id: '', amount: '', discount_percentage: '0' })
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    loadInvoices()
    if (user.role === 'admin' || user.role === 'doctor') {
      api.getAppointments({ status: 'completed' }).then(d => setAppointments(d.data || [])).catch(() => {})
    }
  }, [])

  const loadInvoices = () => {
    const params = user.role === 'patient' ? { patient_id: user.patientId } : {}
    api.getInvoices(params).then(setInvoices).catch(e => setError(e.message))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createInvoice({
        appointment_id: form.appointment_id,
        patient_id: form.patient_id,
        amount: parseFloat(form.amount),
        discount_percentage: parseFloat(form.discount_percentage)
      })
      setShowCreate(false)
      setForm({ appointment_id: '', patient_id: '', amount: '', discount_percentage: '0' })
      loadInvoices()
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePay = async (id) => {
    try {
      await api.payInvoice(id)
      loadInvoices()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAppointmentSelect = (e) => {
    const aptId = e.target.value
    const apt = appointments.find(a => a.id === aptId)
    if (apt) {
      setForm({
        ...form,
        appointment_id: aptId,
        patient_id: apt.patient_id || (apt.data ? '' : ''),
        amount: ''
      })
      // Try to find patient_id from appointment data
      if (apt.patient_id) {
        setForm(f => ({ ...f, patient_id: apt.patient_id }))
      }
    }
  }

  return (
    <div>
      <div className="card">
        <div className="detail-header">
          <h2>Billing & Invoices</h2>
          {(user.role === 'admin' || user.role === 'doctor') && (
            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
              {showCreate ? 'Cancel' : '+ Create Invoice'}
            </button>
          )}
        </div>
        {error && <div className="alert alert-error">{error}</div>}

        {showCreate && (
          <form onSubmit={handleCreate} style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
            <div className="form-group">
              <label>Completed Appointment</label>
              <select value={form.appointment_id} onChange={handleAppointmentSelect} required>
                <option value="">Select Appointment</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.appointment_date} {a.time_slot} — {a.patient_first_name} {a.patient_last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Discount %</label>
                <input type="number" value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})} />
              </div>
            </div>
            {form.amount && form.discount_percentage && (
              <p style={{ marginBottom: 12 }}>
                <strong>Total: ${(parseFloat(form.amount || 0) * (1 - parseFloat(form.discount_percentage || 0) / 100)).toFixed(2)}</strong>
              </p>
            )}
            <button type="submit" className="btn btn-accent">Create Invoice</button>
          </form>
        )}

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td>{inv.appointment_date} {inv.time_slot}</td>
                <td>{inv.patient_first_name} {inv.patient_last_name}</td>
                <td>Dr. {inv.doctor_first_name} {inv.doctor_last_name}</td>
                <td>${inv.amount}</td>
                <td>{inv.discount_percentage}%</td>
                <td><strong>${inv.total?.toFixed ? inv.total.toFixed(2) : inv.total}</strong></td>
                <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                <td className="actions">
                  {inv.status === 'pending' && (
                    <button className="btn btn-sm btn-accent" onClick={() => handlePay(inv.id)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: '#999' }}>No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
