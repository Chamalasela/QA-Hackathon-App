const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb, initDb } = require('./models/database');

async function seedTeam(teamId) {
  const db = getDb(teamId);
  console.log(`\nSeeding Team ${teamId} database...`);

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

  db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'admin', 'Sachini', 'Weerasinghe', '077-1000100', datetime('now'))`).run(adminId, 'admin@test.com', hash('Test@123'));
  db.prepare(`INSERT INTO users VALUES (?, ?, ?, 'admin', 'Kavindu', 'Rathnayake', '077-1000101', datetime('now'))`).run(receptionistId, 'receptionist@test.com', hash('Test@123'));

  // --- DOCTORS (5) ---
  const doctorData = [
    { first: 'Nuwan', last: 'Perera', email: 'doctor@test.com', phone: '077-2000200', spec: 'General Medicine', license: 'SLMC-001', fee: 100 },
    { first: 'Tharushi', last: 'Fernando', email: 'tharushi.fernando@clinic.com', phone: '077-2000201', spec: 'Pediatrics', license: 'SLMC-002', fee: 120 },
    { first: 'Kasun', last: 'Jayawardena', email: 'kasun.jayawardena@clinic.com', phone: '077-2000202', spec: 'Dermatology', license: 'SLMC-003', fee: 150 },
    { first: 'Dilini', last: 'de Silva', email: 'dilini.desilva@clinic.com', phone: '077-2000203', spec: 'Orthopedics', license: 'SLMC-004', fee: 130 },
    { first: 'Amila', last: 'Wickramasinghe', email: 'amila.wickramasinghe@clinic.com', phone: '077-2000204', spec: 'Cardiology', license: 'SLMC-005', fee: 200 }
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
    { first: 'Tharindu', last: 'Bandara', email: 'patient@test.com', phone: '077-3000300', dob: '1990-05-15', gender: 'Male', ssn: '199005150234', ins: 'INS-001', history: 'Diabetes Type 2, Hypertension' },
    { first: 'Nethmi', last: 'Samarawickrama', email: 'nethmi.s@email.com', phone: '077-3000301', dob: '1985-08-22', gender: 'Female', ssn: '198508220456', ins: 'INS-002', history: 'Asthma' },
    { first: 'Chathura', last: 'Gunasekara', email: 'chathura.g@email.com', phone: '077-3000302', dob: '1978-03-10', gender: 'Male', ssn: '197803100678', ins: 'INS-003', history: 'None' },
    { first: 'Sanduni', last: 'Dissanayake', email: 'sanduni.d@email.com', phone: '077-3000303', dob: '1995-11-30', gender: 'Female', ssn: '199511300890', ins: 'INS-004', history: 'Allergies: Penicillin' },
    { first: 'Lakshan', last: 'Senanayake', email: 'lakshan.s@email.com', phone: '077-3000304', dob: '1960-01-05', gender: 'Male', ssn: '196001050112', ins: 'INS-005', history: 'Heart Disease, High Cholesterol' },
    { first: 'Hiruni', last: 'Rajapaksha', email: 'hiruni.r@email.com', phone: '077-3000305', dob: '2000-07-19', gender: 'Female', ssn: '200007190334', ins: 'INS-006', history: 'None' },
    { first: 'Dinesh', last: 'Kumara', email: 'dinesh.k@email.com', phone: '077-3000306', dob: '1988-12-25', gender: 'Male', ssn: '198812250556', ins: 'INS-007', history: 'Migraine' },
    { first: 'Ishara', last: 'Wijesinghe', email: 'ishara.w@email.com', phone: '077-3000307', dob: '1992-04-08', gender: 'Female', ssn: '199204080778', ins: 'INS-008', history: 'Eczema' },
    { first: 'Ruwan', last: 'Herath', email: 'ruwan.h@email.com', phone: '077-3000308', dob: '1975-09-14', gender: 'Male', ssn: '197509140990', ins: 'INS-009', history: 'Arthritis' },
    { first: 'Kavisha', last: 'Abeysekara', email: 'kavisha.a@email.com', phone: '077-3000309', dob: '1998-06-02', gender: 'Female', ssn: '199806021212', ins: 'INS-010', history: 'None' },
    { first: 'Supun', last: 'Liyanage', email: 'supun.l@email.com', phone: '077-3000310', dob: '1982-02-28', gender: 'Male', ssn: '198202281434', ins: 'INS-011', history: 'GERD' },
    { first: 'Malsha', last: 'Karunaratne', email: 'malsha.k@email.com', phone: '077-3000311', dob: '2000-02-29', gender: 'Female', ssn: '200002291656', ins: 'INS-012', history: 'None' },
    { first: 'Chaminda', last: 'Weerakoon', email: 'chaminda.w@email.com', phone: '077-3000312', dob: '1970-10-31', gender: 'Male', ssn: '197010311878', ins: 'INS-013', history: 'COPD, Former Smoker' },
    { first: 'Piumika', last: 'Tennakoon', email: 'piumika.t@email.com', phone: '077-3000313', dob: '2005-05-17', gender: 'Female', ssn: '200505172090', ins: 'INS-014', history: 'Anxiety Disorder' },
    { first: 'Asanka', last: 'Pathirana', email: 'asanka.p@email.com', phone: '077-3000314', dob: '1990-05-17', gender: 'Male', ssn: '199005172312', ins: 'INS-015', history: 'None' },
    { first: 'Rashmi', last: 'Nanayakkara', email: 'rashmi.n@email.com', phone: '077-3000315', dob: '1993-08-08', gender: 'Female', ssn: '199308082534', ins: 'INS-016', history: 'Hypothyroidism' },
    { first: 'Prasanna', last: 'Gunawardana', email: 'prasanna.g@email.com', phone: '077-3000316', dob: '1987-03-17', gender: 'Male', ssn: '198703172756', ins: 'INS-017', history: 'None' },
    { first: 'Anusha', last: 'Ekanayake', email: 'anusha.e@email.com', phone: '077-3000317', dob: '1999-12-31', gender: 'Female', ssn: '199912312978', ins: 'INS-018', history: 'Lactose Intolerance' },
    { first: 'Nadeesha', last: 'Ranasinghe', email: 'nadeesha.r@email.com', phone: '077-3000318', dob: '2002-01-01', gender: 'Male', ssn: '200201013190', ins: 'INS-019', history: 'None' },
    { first: 'Hasini', last: 'Madushani', email: 'hasini.m@email.com', phone: '077-3000319', dob: '1996-06-15', gender: 'Female', ssn: '199606153412', ins: 'INS-020', history: 'Depression' }
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
  console.log(`  Team ${teamId} seed complete!`);
  console.log(`  Users: ${db.prepare('SELECT COUNT(*) as c FROM users').get().c}`);
  console.log(`  Doctors: ${db.prepare('SELECT COUNT(*) as c FROM doctors').get().c}`);
  console.log(`  Patients: ${db.prepare('SELECT COUNT(*) as c FROM patients').get().c}`);
  console.log(`  Appointments: ${db.prepare('SELECT COUNT(*) as c FROM appointments').get().c}`);
  console.log(`  Invoices: ${db.prepare('SELECT COUNT(*) as c FROM invoices').get().c}`);
}

async function seed() {
  await initDb();
  for (let t = 1; t <= 6; t++) {
    await seedTeam(t);
  }
  console.log('\n✅ All 6 team databases seeded!');
  console.log('\nLogin Credentials (all passwords: Test@123):');
  console.log('  Admin:   admin@test.com');
  console.log('  Doctor:  doctor@test.com');
  console.log('  Patient: patient@test.com');
  console.log('\nSelect Team 1-6 on the login page.');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
