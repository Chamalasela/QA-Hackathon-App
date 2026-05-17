import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const loadPatients = async (searchTerm) => {
    try {
      const data = await api.getPatients(searchTerm || undefined)
      setPatients(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { loadPatients() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    loadPatients(search)
  }

  const calculateAge = (dob) => {
    if (!dob) return 'N/A'
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    return age
  }

  return (
    <div>
      <div className="card">
        <div className="detail-header">
          <h2>Patients</h2>
        </div>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search by patient name (exact match)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); loadPatients() }}>Clear</button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>DOB</th>
              <th>Age</th>
              <th>Gender</th>
              <th>SSN</th>
              <th>Insurance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id}>
                <td>{p.first_name} {p.last_name}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.date_of_birth}</td>
                <td>{calculateAge(p.date_of_birth)}</td>
                <td>{p.gender}</td>
                <td>{p.ssn}</td>
                <td>{p.insurance_number}</td>
                <td>
                  <Link to={`/patients/${p.id}`} className="btn btn-sm btn-primary">View</Link>
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#999' }}>No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
