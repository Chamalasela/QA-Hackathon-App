const express = require('express');
const { getDb } = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of doctors }
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);
  const doctors = db.prepare(`
    SELECT d.*, u.first_name, u.last_name, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
  `).all();
  res.json(doctors);
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Doctor details }
 */
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);
  const doctor = db.prepare(`
    SELECT d.*, u.first_name, u.last_name, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!doctor) {
    return res.status(404).json({ error: 'Something went wrong' });
  }
  res.json(doctor);
});

/**
 * @swagger
 * /api/doctors/{id}/appointments:
 *   get:
 *     summary: Get doctor's appointments (today)
 *     tags: [Doctors]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         description: Filter by date (defaults to today)
 *     responses:
 *       200: { description: Doctor's appointments }
 */
router.get('/:id/appointments', authenticateToken, (req, res) => {
  const db = getDb(req.user.teamId);
  const date = req.query.date || new Date().toISOString().split('T')[0];

  const appointments = db.prepare(`
    SELECT a.* FROM appointments a
    WHERE a.doctor_id = ? AND a.appointment_date = ?
    ORDER BY a.time_slot ASC
  `).all(req.params.id, date);

  const enriched = appointments.map(apt => {
    const patient = db.prepare(`
      SELECT p.*, u.first_name, u.last_name, u.email, u.phone
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(apt.patient_id);

    return {
      ...apt,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
      patient_email: patient?.email,
      patient_phone: patient?.phone,
      patient_medical_history: patient?.medical_history,
      patient_ssn: patient?.ssn
    };
  });

  res.json(enriched);
});

module.exports = router;
