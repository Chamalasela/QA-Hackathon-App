const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb, initDb } = require('./models/database');

async function seed() {
  await initDb();
  const db = getDb();
  console.log('Seeding MediCare Clinic database...');

  // Clear existing data
  db.exec('DELETE FROM invoices;');
  db.exec('DELETE FROM appointments;');
  db.exec('DELETE FROM doctors;');
  db.exec('DELETE FROM patients;');
  db.exec('DELETE FROM users;');

  const hash = (pw) => crypto.createHash('sha256').update(pw).digest('hex');

  // --- USERS ---
  const adminId = uuidv4();
  const receptionistId = uuidv4();

  db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'admin', 'Sarah', 'Wilson', '555-0100', datetime('now'))`).run(adminId, 'admin@test.com', hash('Test@123'));
  db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'admin', 'Mike', 'Brown', '555-0101', datetime('now'))`).run(receptionistId, 'receptionist@test.com', hash('Test@123'));

  // --- DOCTORS (5) ---
  const doctorData = [
    { first: 'James', last: 'Smith', email: 'doctor@test.com', phone: '555-0200', spec: 'General Medicine', license: 'LIC-001', fee: 100 },
    { first: 'Emily', last: 'Johnson', email: 'emily.johnson@clinic.com', phone: '555-0201', spec: 'Pediatrics', license: 'LIC-002', fee: 120 },
    { first: 'Robert', last: 'Williams', email: 'robert.williams@clinic.com', phone: '555-0202', spec: 'Dermatology', license: 'LIC-003', fee: 150 },
    { first: 'Maria', last: 'Garcia', email: 'maria.garcia@clinic.com', phone: '555-0203', spec: 'Orthopedics', license: 'LIC-004', fee: 130 },
    { first: 'David', last: 'Lee', email: 'david.lee@clinic.com', phone: '555-0204', spec: 'Cardiology', license: 'LIC-005', fee: 200 }
  ];

  const doctorIds = [];
  for (const d of doctorData) {
    const userId = uuidv4();
    const doctorId = uuidv4();
    db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'doctor', ?, ?, ?, datetime('now'))`).run(userId, d.email, hash('Test@123'), d.first, d.last, d.phone);
    db.prepare(`INSERT INTO doctors VALUES (?, ?, ?, ?, ?, datetime('now'))`).run(doctorId, userId, d.spec, d.license, d.fee);
    doctorIds.push(doctorId);
  }

  // --- PATIENTS (20) ---
  const patientData = [
    { first: 'John', last: 'Doe', email: 'patient@test.com', phone: '555-0300', dob: '1990-05-15', gender: 'Male', ssn: '123-45-6789', ins: 'INS-001', history: 'Diabetes Type 2, Hypertension' },
    { first: 'Jane', last: 'Smith', email: 'jane.smith@email.com', phone: '555-0301', dob: '1985-08-22', gender: 'Female', ssn: '234-56-7890', ins: 'INS-002', history: 'Asthma' },
    { first: 'Michael', last: 'Johnson', email: 'michael.j@email.com', phone: '555-0302', dob: '1978-03-10', gender: 'Male', ssn: '345-67-8901', ins: 'INS-003', history: 'None' },
    { first: 'Emily', last: 'Davis', email: 'emily.d@email.com', phone: '555-0303', dob: '1995-11-30', gender: 'Female', ssn: '456-78-9012', ins: 'INS-004', history: 'Allergies: Penicillin' },
    { first: 'William', last: 'Brown', email: 'william.b@email.com', phone: '555-0304', dob: '1960-01-05', gender: 'Male', ssn: '567-89-0123', ins: 'INS-005', history: 'Heart Disease, High Cholesterol' },
    { first: 'Olivia', last: 'Martinez', email: 'olivia.m@email.com', phone: '555-0305', dob: '2000-07-19', gender: 'Female', ssn: '678-90-1234', ins: 'INS-006', history: 'None' },
    { first: 'James', last: 'Anderson', email: 'james.a@email.com', phone: '555-0306', dob: '1988-12-25', gender: 'Male', ssn: '789-01-2345', ins: 'INS-007', history: 'Migraine' },
    { first: 'Sophia', last: 'Taylor', email: 'sophia.t@email.com', phone: '555-0307', dob: '1992-04-08', gender: 'Female', ssn: '890-12-3456', ins: 'INS-008', history: 'Eczema' },
    { first: 'Benjamin', last: 'Thomas', email: 'benjamin.t@email.com', phone: '555-0308', dob: '1975-09-14', gender: 'Male', ssn: '901-23-4567', ins: 'INS-009', history: 'Arthritis' },
    { first: 'Isabella', last: 'Jackson', email: 'isabella.j@email.com', phone: '555-0309', dob: '1998-06-02', gender: 'Female', ssn: '012-34-5678', ins: 'INS-010', history: 'None' },
    { first: 'Alexander', last: 'White', email: 'alex.w@email.com', phone: '555-0310', dob: '1982-02-28', gender: 'Male', ssn: '111-22-3333', ins: 'INS-011', history: 'GERD' },
    /* Patient born on Feb 29 for BUG F8: age calculation edge case */
    { first: 'Charlotte', last: 'Harris', email: 'charlotte.h@email.com', phone: '555-0311', dob: '2000-02-29', gender: 'Female', ssn: '222-33-4444', ins: 'INS-012', history: 'None' },
    { first: 'Daniel', last: 'Martin', email: 'daniel.m@email.com', phone: '555-0312', dob: '1970-10-31', gender: 'Male', ssn: '333-44-5555', ins: 'INS-013', history: 'COPD, Former Smoker' },
    { first: 'Amelia', last: 'Thompson', email: 'amelia.t@email.com', phone: '555-0313', dob: '2005-05-17', gender: 'Female', ssn: '444-55-6666', ins: 'INS-014', history: 'Anxiety Disorder' },
    /* Patient with today's birthday for BUG F8 testing */
    { first: 'Henry', last: 'Robinson', email: 'henry.r@email.com', phone: '555-0314', dob: '1990-05-17', gender: 'Male', ssn: '555-66-7777', ins: 'INS-015', history: 'None' },
    { first: 'Mia', last: 'Clark', email: 'mia.c@email.com', phone: '555-0315', dob: '1993-08-08', gender: 'Female', ssn: '666-77-8888', ins: 'INS-016', history: 'Hypothyroidism' },
    { first: "Patrick", last: "O'Brien", email: 'patrick.ob@email.com', phone: '555-0316', dob: '1987-03-17', gender: 'Male', ssn: '777-88-9999', ins: 'INS-017', history: 'None' },
    { first: 'Lily', last: 'Nguyen', email: 'lily.n@email.com', phone: '555-0317', dob: '1999-12-31', gender: 'Female', ssn: '888-99-0000', ins: 'INS-018', history: 'Lactose Intolerance' },
    { first: 'Ethan', last: 'Kim', email: 'ethan.k@email.com', phone: '555-0318', dob: '2002-01-01', gender: 'Male', ssn: '999-00-1111', ins: 'INS-019', history: 'None' },
    { first: 'Ava', last: 'Lopez', email: 'ava.l@email.com', phone: '555-0319', dob: '1996-06-15', gender: 'Female', ssn: '000-11-2222', ins: 'INS-020', history: 'Depression' }
  ];

  const patientIds = [];
  for (const p of patientData) {
    const userId = uuidv4();
    const patientId = uuidv4();
    db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'patient', ?, ?, ?, datetime('now'))`).run(userId, p.email, hash('Test@123'), p.first, p.last, p.phone);
    db.prepare(`INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`).run(patientId, userId, p.dob, p.gender, '123 Main St, City', p.ssn, p.ins, p.history, '555-9999');
    patientIds.push(patientId);
  }

  // --- APPOINTMENTS (30) ---
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

  const appointmentData = [];

  // Past appointments (completed)
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    // Skip weekends for past appointments
    if (d.getDay() === 0) d.setDate(d.getDate() - 2);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);

    appointmentData.push({
      patient_id: patientIds[i % patientIds.length],
      doctor_id: doctorIds[i % doctorIds.length],
      date: formatDate(d),
      time: timeSlots[i % timeSlots.length],
      status: 'completed',
      notes: `Routine checkup. Patient condition: stable.`,
      prescription: i % 3 === 0 ? 'Amoxicillin 500mg, 3x daily for 7 days' : null
    });
  }

  // Future appointments (scheduled)
  for (let i = 0; i < 12; i++) {
    const daysAhead = Math.floor(Math.random() * 14) + 1;
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);

    appointmentData.push({
      patient_id: patientIds[(i + 5) % patientIds.length],
      doctor_id: doctorIds[i % doctorIds.length],
      date: formatDate(d),
      time: timeSlots[(i + 3) % timeSlots.length],
      status: 'scheduled',
      notes: null,
      prescription: null
    });
  }

  // Today's appointments (for doctor dashboard testing)
  const todayStr = formatDate(today);
  for (let i = 0; i < 3; i++) {
    appointmentData.push({
      patient_id: patientIds[(i + 10) % patientIds.length],
      doctor_id: doctorIds[0], // First doctor
      date: todayStr,
      time: timeSlots[i + 4],
      status: 'scheduled',
      notes: null,
      prescription: null
    });
  }

  const appointmentIds = [];
  for (const a of appointmentData) {
    const id = uuidv4();
    db.prepare(`INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(id, a.patient_id, a.doctor_id, a.date, a.time, a.status, a.notes, a.prescription);
    appointmentIds.push({ id, ...a });
  }

  // --- INVOICES (for completed appointments) ---
  const completedAppts = appointmentIds.filter(a => a.status === 'completed');
  for (let i = 0; i < Math.min(10, completedAppts.length); i++) {
    const a = completedAppts[i];
    const doctor = db.prepare('SELECT consultation_fee FROM doctors WHERE id = ?').get(a.doctor_id);
    const amount = doctor?.consultation_fee || 100;
    const discount = i % 4 === 0 ? 10 : 0;
    const total = amount * (1 - discount / 100);
    const id = uuidv4();
    db.prepare(`INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
      .run(id, a.id, a.patient_id, amount, discount, total, i % 3 === 0 ? 'paid' : 'pending');
  }

  db.save();
  console.log('Seed complete!');
  console.log(`  Users: ${db.prepare('SELECT COUNT(*) as c FROM users').get().c}`);
  console.log(`  Doctors: ${db.prepare('SELECT COUNT(*) as c FROM doctors').get().c}`);
  console.log(`  Patients: ${db.prepare('SELECT COUNT(*) as c FROM patients').get().c}`);
  console.log(`  Appointments: ${db.prepare('SELECT COUNT(*) as c FROM appointments').get().c}`);
  console.log(`  Invoices: ${db.prepare('SELECT COUNT(*) as c FROM invoices').get().c}`);
  console.log('\nLogin Credentials (all passwords: Test@123):');
  console.log('  Admin:   admin@test.com');
  console.log('  Doctor:  doctor@test.com');
  console.log('  Patient: patient@test.com');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
