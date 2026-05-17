const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),

  // Patients
  getPatients: (search) => request(`/patients${search ? `?search=${search}` : ''}`),
  getPatient: (id) => request(`/patients/${id}`),
  updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id) => request(`/patients/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: () => request('/doctors'),
  getDoctor: (id) => request(`/doctors/${id}`),
  getDoctorAppointments: (id, date) => request(`/doctors/${id}/appointments${date ? `?date=${date}` : ''}`),

  // Appointments
  getAppointments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },
  getAvailability: (doctor_id, date) => request(`/appointments/availability?doctor_id=${doctor_id}&date=${date}`),
  bookAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: 'PUT' }),
  completeAppointment: (id, data) => request(`/appointments/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),

  // Billing
  getInvoices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/billing${qs ? `?${qs}` : ''}`);
  },
  createInvoice: (data) => request('/billing', { method: 'POST', body: JSON.stringify(data) }),
  payInvoice: (id) => request(`/billing/${id}/pay`, { method: 'PUT' }),
};
