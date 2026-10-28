import { db } from '../db/database.js';
import {
  calculatePureGoldGrams,
  calculateGoldValue,
  calculateEligibleLoan,
  calculateMonthlyEmi,
  MOCK_24K_RATE_PER_GRAM,
  QuoteCalculationResult,
  PlanQuoteCalculation,
} from '../utils/maths.js';
import { QuoteRequestInput } from '../validation/schemas.js';

export interface SchemeRow {
  id: string;
  name: string;
  annual_interest_rate: number;
  max_ltv: number;
  tenure_months: number;
  tenure_description: string;
  is_active: number;
}

export class QuoteService {
  /**
   * Fetches active loan schemes from the database
   */
  public getActiveLoanSchemes(): SchemeRow[] {
    return db
      .prepare('SELECT * FROM loan_schemes WHERE is_active = 1 ORDER BY id ASC')
      .all() as SchemeRow[];
  }

  /**
   * Calculates quotes across all active loan schemes for given inputs.
   * Pure calculation, no database write.
   */
  public calculateQuotes(input: QuoteRequestInput): QuoteCalculationResult {
    const { netWeightGrams, grossWeightGrams, karat } = input;

    const pureGoldGrams = calculatePureGoldGrams(netWeightGrams, karat);
    const { goldValueRupees, goldValuePaise } = calculateGoldValue(
      pureGoldGrams,
      MOCK_24K_RATE_PER_GRAM
    );

    const schemes = this.getActiveLoanSchemes();

    const quotes: PlanQuoteCalculation[] = schemes.map((scheme) => {
      const { eligibleLoanRupees, eligibleLoanPaise } = calculateEligibleLoan(
        goldValueRupees,
        scheme.max_ltv
      );

      const planQuote: PlanQuoteCalculation = {
        planId: scheme.id,
        planName: scheme.name,
        annualInterestRate: scheme.annual_interest_rate,
        interestRateDisplay: `${(scheme.annual_interest_rate * 100).toFixed(1)}%`,
        maxLtv: scheme.max_ltv,
        maxLtvPercent: Math.round(scheme.max_ltv * 100),
        tenureMonths: scheme.tenure_months,
        tenureDescription: scheme.tenure_description,
        eligibleLoanRupees,
        eligibleLoanPaise,
      };

      if (scheme.id === 'PLAN_EMI_01') {
        planQuote.monthlyEmiRupees = calculateMonthlyEmi(
          eligibleLoanRupees,
          scheme.annual_interest_rate,
          scheme.tenure_months
        );
      }

      return planQuote;
    });

    return {
      netWeightGrams,
      grossWeightGrams,
      karat,
      purityPercentage: Math.round((karat / 24) * 10000) / 100,
      pureGoldGrams,
      rate24kPerGram: MOCK_24K_RATE_PER_GRAM,
      goldValueRupees,
      goldValuePaise,
      quotes,
    };
  }
}

export const quoteService = new QuoteService();
