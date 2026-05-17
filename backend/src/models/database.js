const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'clinic.db');
let db = null;
let ready = false;

class DbWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        self.save();
        return { changes: self._db.getRowsModified() };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        let row = null;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row || undefined;
      },
      all(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length > 0) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      }
    };
  }

  exec(sql) {
    this._db.exec(sql);
  }

  pragma() {}

  save() {
    const data = this._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function initDb() {
  if (ready) return;
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new DbWrapper(new SQL.Database(fileBuffer));
  } else {
    db = new DbWrapper(new SQL.Database());
  }
  initSchema(db);
  db.save();
  ready = true;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),
      first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date_of_birth TEXT, gender TEXT,
      address TEXT, ssn TEXT, insurance_number TEXT, medical_history TEXT,
      emergency_contact TEXT, is_deleted INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, specialization TEXT,
      license_number TEXT, consultation_fee REAL DEFAULT 100.00,
      created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY, patient_id TEXT NOT NULL, doctor_id TEXT NOT NULL,
      appointment_date TEXT NOT NULL, time_slot TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
      notes TEXT, prescription TEXT, created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (patient_id) REFERENCES patients(id), FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY, appointment_id TEXT NOT NULL, patient_id TEXT NOT NULL,
      amount REAL NOT NULL, discount_percentage REAL DEFAULT 0, total REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );
  `);
}

module.exports = { getDb, initDb };
