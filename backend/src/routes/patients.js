const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients (with optional search)
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by patient name
 *       - in: query
 *         name: ssn
 *         schema: { type: string }
 *         description: Filter by SSN
 *     responses:
 *       200: { description: List of patients }
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { search, ssn } = req.query;
  /* BUG D5: sensitive data (ssn) passed as URL query parameter — appears in logs/history */

  let query = `
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone
    FROM patients p
    JOIN users u ON p.user_id = u.id
  `;
  /* BUG D4: No filter for is_deleted — soft-deleted records still returned */
  const params = [];

  if (search) {
    /* BUG F3: Case-sensitive search — uses = instead of LIKE with COLLATE NOCASE */
    query += ` WHERE (u.first_name = ? OR u.last_name = ?)`;
    params.push(search, search);
  }
  if (ssn) {
    query += search ? ' AND' : ' WHERE';
    query += ` p.ssn = ?`;
    params.push(ssn);
  }

  const patients = db.prepare(query).all(...params);

  /* BUG S3: Returns ALL patient data including SSN, insurance, medical history in list endpoint
     Should only return name, ID, DOB for list view */
  /* BUG D1: No role-based filtering — admin/receptionist can see medical_history */
  res.json(patients);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Patient details }
 *       404: { description: Patient not found }
 */
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();

  /* BUG S1: No authorization check — any authenticated user can view any patient's full record
     Should check: is this the patient themselves, or their assigned doctor? */
  const patient = db.prepare(`
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone
    FROM patients p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);
  /* BUG D4: No is_deleted check — deleted patients still accessible via direct API */

  if (!patient) {
    return res.status(404).json({ error: 'Something went wrong' });
  }

  /* BUG S3 + D2: Returns SSN, insurance, medical_history even when not needed */
  /* BUG D1: Admin/receptionist can see medical_history — should be doctor-only */
  res.json(patient);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient information
 *     tags: [Patients]
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
 *               date_of_birth: { type: string }
 *               gender: { type: string }
 *               address: { type: string }
 *               ssn: { type: string }
 *               insurance_number: { type: string }
 *               medical_history: { type: string }
 *               emergency_contact: { type: string }
 *     responses:
 *       200: { description: Patient updated }
 */
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const { date_of_birth, gender, address, ssn, insurance_number, medical_history, emergency_contact } = req.body;

  /* BUG S1: No authorization — any user can update any patient */
  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Something went wrong' });
  }

  db.prepare(`
    UPDATE patients SET
      date_of_birth = COALESCE(?, date_of_birth),
      gender = COALESCE(?, gender),
      address = COALESCE(?, address),
      ssn = COALESCE(?, ssn),
      insurance_number = COALESCE(?, insurance_number),
      medical_history = COALESCE(?, medical_history),
      emergency_contact = COALESCE(?, emergency_contact)
    WHERE id = ?
  `).run(date_of_birth, gender, address, ssn, insurance_number, medical_history, emergency_contact, req.params.id);

  const updated = db.prepare(`
    SELECT p.*, u.email, u.first_name, u.last_name, u.phone
    FROM patients p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  res.json(updated);
});

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete a patient (soft delete)
 *     tags: [Patients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Patient deleted }
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const db = getDb();
  /* Soft delete — but BUG D4: GET endpoints don't filter by is_deleted */
  db.prepare('UPDATE patients SET is_deleted = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Patient deleted' });
});

module.exports = router;
