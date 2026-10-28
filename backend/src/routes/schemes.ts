import { Router, Request, Response } from 'express';
import { quoteService } from '../services/quoteService.js';

export const schemesRouter = Router();

/**
 * GET /api/v1/loan-schemes
 * Returns active loan schemes from the database
 */
schemesRouter.get('/', (req: Request, res: Response) => {
  const schemes = quoteService.getActiveLoanSchemes();

  const formatted = schemes.map((s) => ({
    id: s.id,
    name: s.name,
    annualInterestRate: s.annual_interest_rate,
    interestRateDisplay: `${(s.annual_interest_rate * 100).toFixed(1)}%`,
    maxLtv: s.max_ltv,
    maxLtvPercent: Math.round(s.max_ltv * 100),
    tenureMonths: s.tenure_months,
    tenureDescription: s.tenure_description,
    isActive: Boolean(s.is_active),
  }));

  res.status(200).json({
    data: formatted,
    count: formatted.length,
  });
});
