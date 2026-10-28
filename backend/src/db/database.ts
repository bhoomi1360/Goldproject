import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'gold_loan.db');

// Ensure parent dir exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initializes database tables
 */
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS loan_schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      annual_interest_rate REAL NOT NULL,
      max_ltv REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      tenure_description TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      gross_weight_grams REAL NOT NULL,
      net_weight_grams REAL NOT NULL,
      karat INTEGER NOT NULL,
      pure_gold_grams REAL NOT NULL,
      rate_24k_per_gram_paise INTEGER NOT NULL,
      gold_value_paise INTEGER NOT NULL,
      plan_id TEXT NOT NULL,
      eligible_loan_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES loan_schemes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_leads_mobile_created 
    ON leads(mobile_number, created_at);

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      request_hash TEXT NOT NULL,
      response_status INTEGER NOT NULL,
      response_body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lead_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    );
  `);
}

/**
 * Seeds default loan schemes as specified in assignment
 */
export function seedDefaultLoanSchemes() {
  const insert = db.prepare(`
    INSERT INTO loan_schemes (id, name, annual_interest_rate, max_ltv, tenure_months, tenure_description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      annual_interest_rate = excluded.annual_interest_rate,
      max_ltv = excluded.max_ltv,
      tenure_months = excluded.tenure_months,
      tenure_description = excluded.tenure_description,
      is_active = excluded.is_active
  `);

  const seedTransaction = db.transaction(() => {
    // PLAN_BULLET_01: 12.0%, 70% max LTV
    insert.run(
      'PLAN_BULLET_01',
      'Bullet Repayment',
      0.12,
      0.70,
      12,
      '12 months, interest + principal at maturity'
    );

    // PLAN_EMI_01: 10.5%, 75% max LTV
    insert.run(
      'PLAN_EMI_01',
      'Monthly EMI',
      0.105,
      0.75,
      12,
      '12 months, equal monthly instalments'
    );
  });

  seedTransaction();
}

// Auto-run schema initialization and seed on module import
initializeDatabase();
seedDefaultLoanSchemes();
