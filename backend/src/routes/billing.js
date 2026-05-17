const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/billing:
 *   get:
 *     summary: Get all invoices
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of invoices }
 */
router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  const { patient_id, status } = req.query;

  let query = `
    SELECT i.*,
      pu.first_name as patient_first_name,
      pu.last_name as patient_last_name,
      a.appointment_date, a.time_slot,
      du.first_name as doctor_first_name,
      du.last_name as doctor_last_name
    FROM invoices i
    JOIN appointments a ON i.appointment_id = a.id
    JOIN patients p ON i.patient_id = p.id
    JOIN users pu ON p.user_id = pu.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users du ON d.user_id = du.id
  `;

  const conditions = [];
  const params = [];
  if (patient_id) { conditions.push('i.patient_id = ?'); params.push(patient_id); }
  if (status) { conditions.push('i.status = ?'); params.push(status); }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY i.created_at DESC';

  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

/**
 * @swagger
 * /api/billing:
 *   post:
 *     summary: Create an invoice for a completed appointment
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [appointment_id, patient_id, amount]
 *             properties:
 *               appointment_id: { type: string }
 *               patient_id: { type: string }
 *               amount: { type: number }
 *               discount_percentage: { type: number }
 *     responses:
 *       201: { description: Invoice created }
 */
router.post('/', authenticateToken, authorizeRoles('admin', 'doctor'), (req, res) => {
  const { appointment_id, patient_id, amount, discount_percentage = 0 } = req.body;

  if (!appointment_id || !patient_id || !amount) {
    return res.status(400).json({ error: 'Something went wrong' });
  }

  /* BUG F7: No validation on discount_percentage — accepts negative and >100 values */
  const total = amount * (1 - discount_percentage / 100);

  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO invoices (id, appointment_id, patient_id, amount, discount_percentage, total, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `).run(id, appointment_id, patient_id, amount, discount_percentage, total);

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.status(201).json(invoice);
});

/**
 * @swagger
 * /api/billing/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice details }
 */
router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Something went wrong' });
  }
  res.json(invoice);
});

/**
 * @swagger
 * /api/billing/{id}/pay:
 *   put:
 *     summary: Mark invoice as paid
 *     tags: [Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice paid }
 */
router.put('/:id/pay', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(req.params.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  res.json(invoice);
});

module.exports = router;
