import React from 'react';
import { QuoteResponse, PlanQuote } from '../services/api';
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface Step2Props {
  quote: QuoteResponse | null;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const Step2Quote: React.FC<Step2Props> = ({
  quote,
  selectedPlanId,
  onSelectPlan,
  onBack,
  onNext,
  isLoading,
}) => {
  if (!quote) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p className="card-desc">Calculating quotes based on jewellery weight...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <Sparkles className="text-primary" size={24} />
        <span>Step 2: Live Valuation & Loan Schemes</span>
      </div>
      <p className="card-desc">
        Calculated at benchmark 24K bullion rate of ₹{quote.rate24kPerGram.toLocaleString('en-IN')}/g.
        Select your preferred repayment scheme below.
      </p>

      {/* Gold Valuation Summary */}
      <div className="quote-highlight">
        <div>
          <div className="highlight-stat-label">Net Pure Gold</div>
          <div className="highlight-stat-value gold" id="pure-gold-display">
            {quote.pureGoldGrams} g
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {quote.karat}K Gold ({quote.purityPercentage}% Purity)
          </div>
        </div>

        <div>
          <div className="highlight-stat-label">Market Value</div>
          <div className="highlight-stat-value" id="gold-value-display">
            ₹{quote.goldValueRupees.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            At ₹{quote.rate24kPerGram}/g 24K rate
          </div>
        </div>
      </div>

      {/* Selectable Plan Cards */}
      <div className="plans-grid">
        {quote.quotes.map((plan: PlanQuote) => {
          const isSelected = selectedPlanId === plan.planId;

          return (
            <div
              key={plan.planId}
              id={`plan-card-${plan.planId}`}
              className={`plan-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectPlan(plan.planId)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="plan-tag">
                    {plan.planId === 'PLAN_EMI_01' ? 'Most Popular' : 'Lump Sum'}
                  </span>
                  {isSelected && <CheckCircle2 size={18} color="var(--primary)" />}
                </div>

                <div className="plan-name">{plan.planName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Max LTV {plan.maxLtvPercent}% · {plan.interestRateDisplay} p.a.
                </div>

                <div className="plan-loan-amount" id={`loan-amount-${plan.planId}`}>
                  ₹{plan.eligibleLoanRupees.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="plan-specs">
                <span>
                  <strong>Tenure</strong>
                  <span>{plan.tenureMonths} Months</span>
                </span>
                {plan.monthlyEmiRupees && (
                  <span>
                    <strong>Estimated EMI</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      ₹{plan.monthlyEmiRupees.toLocaleString('en-IN')}/mo
                    </span>
                  </span>
                )}
                <span>
                  <strong>Repayment</strong>
                  <span style={{ fontSize: '0.75rem', maxWidth: '170px', textAlign: 'right' }}>
                    {plan.tenureDescription}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          style={{ flex: 1 }}
        >
          <ArrowLeft size={18} />
          <span>Edit Details</span>
        </button>

        <button
          id="step2-next-btn"
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selectedPlanId || isLoading}
          style={{ flex: 2 }}
        >
          <span>Continue to Confirmation</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
