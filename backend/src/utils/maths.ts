/**
 * Exact Financial Maths for Gold Loan Portal
 *
 * Rules:
 * pureGoldGrams = netWeightGrams * (karat / 24)
 * goldValueRupees = pureGoldGrams * rate24kPerGram
 * eligibleLoanRupees = Math.floor(goldValueRupees * Math.min(planMaxLtv, 0.75))
 *
 * Loan is in whole rupees and never above 75% LTV.
 * Money stored as integer paise (1 Rupee = 100 Paise).
 */

export const MOCK_24K_RATE_PER_GRAM = 7000; // ₹7,000 / g
export const MAX_ALLOWED_LTV = 0.75; // 75% maximum regulatory LTV

export interface CalculationInput {
  netWeightGrams: number;
  grossWeightGrams?: number;
  karat: 18 | 22 | 24;
}

export interface PlanQuoteCalculation {
  planId: string;
  planName: string;
  annualInterestRate: number;
  interestRateDisplay: string;
  maxLtv: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureDescription: string;
  eligibleLoanRupees: number;
  eligibleLoanPaise: number;
  monthlyEmiRupees?: number;
}

export interface QuoteCalculationResult {
  netWeightGrams: number;
  grossWeightGrams?: number;
  karat: number;
  purityPercentage: number;
  pureGoldGrams: number;
  rate24kPerGram: number;
  goldValueRupees: number;
  goldValuePaise: number;
  quotes: PlanQuoteCalculation[];
}

/**
 * Calculates pure gold grams from net weight and karat.
 * Rounded to 4 decimal places to prevent floating point inaccuracies.
 */
export function calculatePureGoldGrams(netWeightGrams: number, karat: number): number {
  const pure = netWeightGrams * (karat / 24);
  // Round to 4 decimal places for display consistency (e.g. 41.25)
  return Math.round(pure * 10000) / 10000;
}

/**
 * Calculates the market value of the gold in whole rupees and integer paise.
 */
export function calculateGoldValue(
  pureGoldGrams: number,
  rate24kPerGram: number = MOCK_24K_RATE_PER_GRAM
): { goldValueRupees: number; goldValuePaise: number } {
  const valueRupees = pureGoldGrams * rate24kPerGram;
  // Whole rupees and exact paise
  const goldValueRupees = Math.round(valueRupees * 100) / 100;
  const goldValuePaise = Math.round(valueRupees * 100);
  return { goldValueRupees, goldValuePaise };
}

/**
 * Calculates the eligible loan amount for a specific plan.
 * Spec rule: eligibleLoan = floor( goldValue * min(plan.maxLtv, 0.75) )
 * Whole rupees and never above 75% LTV.
 */
export function calculateEligibleLoan(
  goldValueRupees: number,
  planMaxLtv: number
): { eligibleLoanRupees: number; eligibleLoanPaise: number } {
  const effectiveLtv = Math.min(planMaxLtv, MAX_ALLOWED_LTV);
  const eligibleLoanRupees = Math.floor(goldValueRupees * effectiveLtv);
  const eligibleLoanPaise = eligibleLoanRupees * 100;
  return { eligibleLoanRupees, eligibleLoanPaise };
}

/**
 * Calculates standard reducing balance monthly EMI (for EMI schemes)
 */
export function calculateMonthlyEmi(
  principalRupees: number,
  annualInterestRate: number,
  tenureMonths: number = 12
): number {
  if (annualInterestRate <= 0 || tenureMonths <= 0) {
    return Math.round(principalRupees / (tenureMonths || 1));
  }
  const monthlyRate = annualInterestRate / 12;
  const emi =
    (principalRupees * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}
