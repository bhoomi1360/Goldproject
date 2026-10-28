import { db } from '../db/database.js';
import { LeadRequestInput } from '../validation/schemas.js';
import {
  calculatePureGoldGrams,
  calculateGoldValue,
  calculateEligibleLoan,
  MOCK_24K_RATE_PER_GRAM,
} from '../utils/maths.js';
import { maskMobileNumber, sanitizeLogPayload } from '../utils/mask.js';
import { ConflictError, NotFoundError } from '../middleware/errorHandler.js';

export interface LeadRecord {
  id: string;
  fullName: string;
  mobileNumber: string; // masked in responses
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  rate24kPerGram: number;
  goldValueRupees: number;
  goldValuePaise: number;
  planId: string;
  planName?: string;
  eligibleLoanRupees: number;
  eligibleLoanPaise: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilterOptions {
  planId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class LeadService {
  /**
   * Generates next sequential human-friendly application ID: GL-1001, GL-1002, etc.
   */
  private generateApplicationId(): string {
    const row = db
      .prepare(
        `SELECT id FROM leads 
         WHERE id LIKE 'GL-%' 
         ORDER BY CAST(SUBSTR(id, 4) AS INTEGER) DESC LIMIT 1`
      )
      .get() as { id: string } | undefined;

    if (!row) {
      return 'GL-1001';
    }

    const currentNum = parseInt(row.id.replace('GL-', ''), 10);
    const nextNum = isNaN(currentNum) ? 1001 : currentNum + 1;
    return `GL-${nextNum}`;
  }

  /**
   * Checks for duplicate application within 7 days for the given mobile number.
   * Returns existing lead if found.
   */
  public checkDuplicateLead(mobileNumber: string): { id: string; createdAt: string } | null {
    const existing = db
      .prepare(
        `SELECT id, created_at FROM leads 
         WHERE mobile_number = ? 
           AND created_at >= datetime('now', '-7 days')
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(mobileNumber) as { id: string; created_at: string } | undefined;

    if (existing) {
      return { id: existing.id, createdAt: existing.created_at };
    }
    return null;
  }

  /**
   * Submits a new lead application.
   * Atomically executes de-duplication, re-calculation, and insertion.
   */
  public submitLead(input: LeadRequestInput): LeadRecord {
    console.log(
      `[LeadService] Submitting application for mobile: ${maskMobileNumber(input.mobileNumber)}`
    );

    // 1. Verify Plan Exists (else 404)
    const plan = db
      .prepare('SELECT id, name, max_ltv, annual_interest_rate FROM loan_schemes WHERE id = ?')
      .get(input.planId) as
      | { id: string; name: string; max_ltv: number; annual_interest_rate: number }
      | undefined;

    if (!plan) {
      throw new NotFoundError(
        `Loan scheme with id '${input.planId}' was not found`,
        'PLAN_NOT_FOUND'
      );
    }

    // 2. Perform Atomic Insertion inside SQLite Transaction
    // Ensures simultaneous requests for the same mobile will produce exactly one 201 and one 409!
    const createLeadTransaction = db.transaction(() => {
      // Re-check duplicate inside the transaction
      const duplicate = this.checkDuplicateLead(input.mobileNumber);
      if (duplicate) {
        throw new ConflictError(
          `You already applied recently. Existing application ${duplicate.id} is active.`,
          duplicate.id,
          'DUPLICATE_APPLICATION'
        );
      }

      // Re-calculate numbers server-side (never trust client)
      const pureGoldGrams = calculatePureGoldGrams(input.netWeightGrams, input.karat);
      const { goldValueRupees, goldValuePaise } = calculateGoldValue(
        pureGoldGrams,
        MOCK_24K_RATE_PER_GRAM
      );
      const { eligibleLoanRupees, eligibleLoanPaise } = calculateEligibleLoan(
        goldValueRupees,
        plan.max_ltv
      );

      const applicationId = this.generateApplicationId();

      const insertStmt = db.prepare(`
        INSERT INTO leads (
          id, full_name, mobile_number, gross_weight_grams, net_weight_grams,
          karat, pure_gold_grams, rate_24k_per_gram_paise, gold_value_paise,
          plan_id, eligible_loan_paise, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, 'SUBMITTED', datetime('now'), datetime('now')
        )
      `);

      insertStmt.run(
        applicationId,
        input.fullName,
        input.mobileNumber,
        input.grossWeightGrams,
        input.netWeightGrams,
        input.karat,
        pureGoldGrams,
        MOCK_24K_RATE_PER_GRAM * 100, // paise
        goldValuePaise,
        plan.id,
        eligibleLoanPaise
      );

      // Add audit log
      db.prepare(`
        INSERT INTO lead_audit_logs (lead_id, action, new_status, notes)
        VALUES (?, 'APPLICATION_SUBMITTED', 'SUBMITTED', 'Initial application submitted via portal')
      `).run(applicationId);

      return {
        id: applicationId,
        fullName: input.fullName,
        mobileNumber: maskMobileNumber(input.mobileNumber),
        grossWeightGrams: input.grossWeightGrams,
        netWeightGrams: input.netWeightGrams,
        karat: input.karat,
        pureGoldGrams,
        rate24kPerGram: MOCK_24K_RATE_PER_GRAM,
        goldValueRupees,
        goldValuePaise,
        planId: plan.id,
        planName: plan.name,
        eligibleLoanRupees,
        eligibleLoanPaise,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return createLeadTransaction();
  }

  /**
   * Retrieves all leads with masked mobile numbers (9876XXXX10), newest first.
   * Supports filtering and pagination.
   */
  public getLeads(options: LeadFilterOptions = {}): {
    leads: LeadRecord[];
    total: number;
    page: number;
    limit: number;
  } {
    const { planId, status, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (planId) {
      whereClauses.push('l.plan_id = ?');
      params.push(planId);
    }

    if (status) {
      whereClauses.push('l.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM leads l ${whereSql}`)
      .get(...params) as { count: number };

    const rows = db
      .prepare(
        `SELECT l.*, s.name as plan_name
         FROM leads l
         LEFT JOIN loan_schemes s ON l.plan_id = s.id
         ${whereSql}
         ORDER BY l.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as any[];

    const leads: LeadRecord[] = rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      mobileNumber: maskMobileNumber(r.mobile_number),
      grossWeightGrams: r.gross_weight_grams,
      netWeightGrams: r.net_weight_grams,
      karat: r.karat,
      pureGoldGrams: r.pure_gold_grams,
      rate24kPerGram: Math.round(r.rate_24k_per_gram_paise / 100),
      goldValueRupees: Math.round(r.gold_value_paise / 100),
      goldValuePaise: r.gold_value_paise,
      planId: r.plan_id,
      planName: r.plan_name,
      eligibleLoanRupees: Math.round(r.eligible_loan_paise / 100),
      eligibleLoanPaise: r.eligible_loan_paise,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return {
      leads,
      total: countRow.count,
      page,
      limit,
    };
  }

  /**
   * Retrieves single lead by ID
   */
  public getLeadById(id: string): LeadRecord | null {
    const row = db
      .prepare(
        `SELECT l.*, s.name as plan_name
         FROM leads l
         LEFT JOIN loan_schemes s ON l.plan_id = s.id
         WHERE l.id = ?`
      )
      .get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      fullName: row.full_name,
      mobileNumber: maskMobileNumber(row.mobile_number),
      grossWeightGrams: row.gross_weight_grams,
      netWeightGrams: row.net_weight_grams,
      karat: row.karat,
      pureGoldGrams: row.pure_gold_grams,
      rate24kPerGram: Math.round(row.rate_24k_per_gram_paise / 100),
      goldValueRupees: Math.round(row.gold_value_paise / 100),
      goldValuePaise: row.gold_value_paise,
      planId: row.plan_id,
      planName: row.plan_name,
      eligibleLoanRupees: Math.round(row.eligible_loan_paise / 100),
      eligibleLoanPaise: row.eligible_loan_paise,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Updates lead status with audit logging (Bonus B1)
   */
  public updateStatus(id: string, newStatus: string, notes?: string): LeadRecord {
    const current = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
    if (!current) {
      throw new NotFoundError(`Lead ${id} not found`, 'LEAD_NOT_FOUND');
    }

    const updateTx = db.transaction(() => {
      db.prepare(
        `UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newStatus, id);

      db.prepare(
        `INSERT INTO lead_audit_logs (lead_id, action, old_status, new_status, notes)
         VALUES (?, 'STATUS_UPDATE', ?, ?, ?)`
      ).run(id, current.status, newStatus, notes || `Status changed to ${newStatus}`);
    });

    updateTx();
    return this.getLeadById(id)!;
  }
}

export const leadService = new LeadService();
