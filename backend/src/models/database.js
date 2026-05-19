const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const VALID_TEAMS = [1, 2, 3, 4, 5];

// Cache of DB instances per team
const dbs = {};
let SQL = null;

function getDbPath(teamId) {
  return path.join(DATA_DIR, `clinic-team-${teamId}.db`);
}

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
    fs.writeFileSync(this._path, buffer);
  }
}

async function initDb(teamId) {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const teams = teamId ? [teamId] : VALID_TEAMS;
  for (const t of teams) {
    if (dbs[t]) continue;
    const dbPath = getDbPath(t);
    let wrapper;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      wrapper = new DbWrapper(new SQL.Database(fileBuffer));
    } else {
      wrapper = new DbWrapper(new SQL.Database());
    }
    wrapper._path = dbPath;
    initSchema(wrapper);
    wrapper.save();
    dbs[t] = wrapper;
  }
}

function getDb(teamId) {
  if (!teamId || !VALID_TEAMS.includes(Number(teamId))) {
    throw new Error('Invalid team ID. Must be 1-5.');
  }
  const db = dbs[Number(teamId)];
  if (!db) throw new Error(`Database for team ${teamId} not initialized. Call initDb() first.`);
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
