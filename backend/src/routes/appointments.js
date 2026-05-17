const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         schema: { type: string }
 *       - in: query
 *         name: patient_id
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of appointments }
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);
  const { doctor_id, patient_id, date, status } = req.query;

  let query = `
    SELECT a.*,
      p.ssn as patient_ssn,
      p.insurance_number as patient_insurance,
      pu.first_name as patient_first_name,
      pu.last_name as patient_last_name,
      pu.email as patient_email,
      du.first_name as doctor_first_name,
      du.last_name as doctor_last_name,
      d.specialization as doctor_specialization
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users du ON d.user_id = du.id
  `;

  const conditions = [];
  const params = [];

  if (doctor_id) { conditions.push('a.doctor_id = ?'); params.push(doctor_id); }
  if (patient_id) { conditions.push('a.patient_id = ?'); params.push(patient_id); }
  if (date) { conditions.push('a.appointment_date = ?'); params.push(date); }
  if (status) { conditions.push('a.status = ?'); params.push(status); }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY a.appointment_date DESC, a.time_slot ASC';

  const appointments = db.prepare(query).all(...params);

  res.json({
    data: appointments,
    total: appointments.length + 3,
    page: 1,
    limit: appointments.length
  });
});

/**
 * @swagger
 * /api/appointments/availability:
 *   get:
 *     summary: Get available time slots for a doctor on a date
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: doctor_id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Available time slots }
 */
router.get('/availability', authenticateToken, (req, res) => {
  const { doctor_id, date } = req.query;

  if (!doctor_id || !date) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  const db = getDb(req.user.teamId);
  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30'
  ];

  const booked = db.prepare(
    `SELECT time_slot FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status IN ('scheduled', 'cancelled')`
  ).all(doctor_id, date).map(r => r.time_slot);

  const available = allSlots.filter(slot => !booked.includes(slot));

  res.json({ date, doctor_id, available_slots: available, all_slots: allSlots });
});

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [patient_id, doctor_id, appointment_date, time_slot]
 *             properties:
 *               patient_id: { type: string }
 *               doctor_id: { type: string }
 *               appointment_date: { type: string, format: date }
 *               time_slot: { type: string }
 *     responses:
 *       201: { description: Appointment booked }
 *       400: { description: Validation error }
 */
router.post('/', authenticateToken, (req, res) => {
  const { patient_id, doctor_id, appointment_date, time_slot } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !time_slot) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  const db = getDb(req.user.teamId);

  // const existing = db.prepare(
  //   'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status = "scheduled"'
  // ).get(doctor_id, appointment_date, time_slot);
  // if (existing) return res.status(409).json({ error: 'Slot already booked' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, time_slot, status)
    VALUES (?, ?, ?, ?, ?, 'scheduled')
  `).run(id, patient_id, doctor_id, appointment_date, time_slot);

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.status(201).json(appointment);
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Appointment details }
 */
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);
  const appointment = db.prepare(`
    SELECT a.*,
      p.ssn as patient_ssn,
      pu.first_name as patient_first_name,
      pu.last_name as patient_last_name,
      du.first_name as doctor_first_name,
      du.last_name as doctor_last_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users du ON d.user_id = du.id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Something went wrong' });
  }

  res.json(appointment);
});

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   put:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Appointment cancelled }
 */
router.put('/:id/cancel', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);

  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(req.params.id);

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(appointment);
});

/**
 * @swagger
 * /api/appointments/{id}/complete:
 *   put:
 *     summary: Mark appointment as complete (Doctor only)
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *               prescription: { type: string }
 *     responses:
 *       200: { description: Appointment completed }
 */
router.put('/:id/complete', authenticateToken, authorizeRoles('doctor'), (req, res) => {
  const db = getDb(req.user.teamId);
  const { notes, prescription } = req.body;

  db.prepare(`
    UPDATE appointments SET status = 'completed', notes = ?, prescription = ?
    WHERE id = ?
  `).run(notes || null, prescription || null, req.params.id);

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(appointment);
});

module.exports = router;
