import { describe, it, expect } from 'vitest';
import {
  calculatePureGoldGrams,
  calculateGoldValue,
  calculateEligibleLoan,
  MOCK_24K_RATE_PER_GRAM,
  MAX_ALLOWED_LTV,
} from '../src/utils/maths.js';

describe('Exact Money Maths - Assignment Test Cases', () => {
  it('Test Case 1: 45 g net · 22K · EMI -> pure 41.25 g · value ₹2,88,750 · loan ₹2,16,562', () => {
    const netWeight = 45;
    const karat = 22;
    const emiMaxLtv = 0.75;

    const pureGold = calculatePureGoldGrams(netWeight, karat);
    expect(pureGold).toBe(41.25);

    const { goldValueRupees, goldValuePaise } = calculateGoldValue(pureGold, MOCK_24K_RATE_PER_GRAM);
    expect(goldValueRupees).toBe(288750);
    expect(goldValuePaise).toBe(28875000);

    const { eligibleLoanRupees, eligibleLoanPaise } = calculateEligibleLoan(goldValueRupees, emiMaxLtv);
    expect(eligibleLoanRupees).toBe(216562);
    expect(eligibleLoanPaise).toBe(21656200);
  });

  it('Test Case 2: 45 g net · 22K · Bullet -> value ₹2,88,750 · loan ₹2,02,125 (70% LTV)', () => {
    const netWeight = 45;
    const karat = 22;
    const bulletMaxLtv = 0.70;

    const pureGold = calculatePureGoldGrams(netWeight, karat);
    expect(pureGold).toBe(41.25);

    const { goldValueRupees } = calculateGoldValue(pureGold, MOCK_24K_RATE_PER_GRAM);
    expect(goldValueRupees).toBe(288750);

    const { eligibleLoanRupees, eligibleLoanPaise } = calculateEligibleLoan(goldValueRupees, bulletMaxLtv);
    expect(eligibleLoanRupees).toBe(202125);
    expect(eligibleLoanPaise).toBe(20212500);
  });

  it('Test Case 3: 10 g net · 18K · EMI -> pure 7.5 g · value ₹52,500 · loan ₹39,375', () => {
    const netWeight = 10;
    const karat = 18;
    const emiMaxLtv = 0.75;

    const pureGold = calculatePureGoldGrams(netWeight, karat);
    expect(pureGold).toBe(7.5);

    const { goldValueRupees, goldValuePaise } = calculateGoldValue(pureGold, MOCK_24K_RATE_PER_GRAM);
    expect(goldValueRupees).toBe(52500);
    expect(goldValuePaise).toBe(5250000);

    const { eligibleLoanRupees, eligibleLoanPaise } = calculateEligibleLoan(goldValueRupees, emiMaxLtv);
    expect(eligibleLoanRupees).toBe(39375);
    expect(eligibleLoanPaise).toBe(3937500);
  });

  it('Enforces cap: Max LTV must never exceed 75% even if a plan specifies 85%', () => {
    const goldValueRupees = 100000;
    const illegalPlanLtv = 0.85;

    const { eligibleLoanRupees } = calculateEligibleLoan(goldValueRupees, illegalPlanLtv);
    // 75% of 100000 = 75000, not 85000
    expect(eligibleLoanRupees).toBe(75000);
  });

  it('Floor rounding check: eligibleLoan is in whole rupees, rounding down', () => {
    // 288750 * 0.75 = 216562.5 -> floor is 216562
    const { eligibleLoanRupees } = calculateEligibleLoan(288750, 0.75);
    expect(eligibleLoanRupees).toBe(216562);
    expect(Number.isInteger(eligibleLoanRupees)).toBe(true);
  });
});
