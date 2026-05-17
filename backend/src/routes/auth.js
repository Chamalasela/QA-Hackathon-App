const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { JWT_SECRET, JWT_EXPIRY } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new patient
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               phone: { type: string }
 *               date_of_birth: { type: string }
 *               gender: { type: string }
 *               address: { type: string }
 *               ssn: { type: string }
 *               insurance_number: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       400: { description: Validation error }
 */
router.post('/register', (req, res) => {
  const { email, password, first_name, last_name, phone, date_of_birth, gender, address, ssn, insurance_number } = req.body;

  if (!email || !password || !first_name || !last_name) {
    /* BUG U3: The frontend clears all form fields after this error — but that's a frontend bug */
    return res.status(400).json({ error: 'Something went wrong' }); /* BUG U2: generic error message */
  }

  /* BUG F2: Weak email validation — accepts 'test@' as valid */
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ error: 'Something went wrong' }); /* BUG U2: should say "Email already exists" */
  }

  const userId = uuidv4();
  const patientId = uuidv4();
  const password_hash = crypto.createHash('sha256').update(password).digest('hex');

  db.prepare(`INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES (?, ?, ?, 'patient', ?, ?, ?)`)
    .run(userId, email, password_hash, first_name, last_name, phone || null);

  db.prepare(`INSERT INTO patients (id, user_id, date_of_birth, gender, address, ssn, insurance_number) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(patientId, userId, date_of_birth || null, gender || null, address || null, ssn || null, insurance_number || null);

  const token = jwt.sign({ userId, role: 'patient', patientId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  res.status(201).json({ token, user: { id: userId, email, first_name, last_name, role: 'patient', patientId } });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Invalid credentials }
 */
/* BUG S5: No rate limiting on login endpoint — brute force possible */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) {
    return res.status(401).json({ error: 'Something went wrong' }); /* BUG U2: generic message */
  }

  const password_hash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.password_hash !== password_hash) {
    return res.status(401).json({ error: 'Something went wrong' });
  }

  let patientId = null;
  let doctorId = null;

  if (user.role === 'patient') {
    const patient = db.prepare('SELECT id FROM patients WHERE user_id = ?').get(user.id);
    patientId = patient?.id;
  } else if (user.role === 'doctor') {
    const doctor = db.prepare('SELECT id FROM doctors WHERE user_id = ?').get(user.id);
    doctorId = doctor?.id;
  }

  /* BUG S4: Token valid for 7 days, no refresh mechanism */
  const token = jwt.sign(
    { userId: user.id, role: user.role, patientId, doctorId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  res.json({ token, user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, patientId, doctorId } });
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 */
router.get('/profile', require('../middleware/auth').authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: 'Something went wrong' });
  }

  /* BUG S6: password_hash is included in the response — should be excluded */
  res.json(user);
});

module.exports = router;
