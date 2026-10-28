import React from 'react';
import { QuoteResponse, PlanQuote } from '../services/api';
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Calendar, Percent } from 'lucide-react';

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
        <p className="card-desc">Computing collateral valuation...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">
        <Sparkles className="text-primary" size={24} />
        <span>Step 2: Valuation & Scheme Selection</span>
      </div>
      <p className="card-desc">
        Live collateral appraisal based on ₹{quote.rate24kPerGram.toLocaleString('en-IN')}/g spot bullion rate. Choose your repayment structure:
      </p>

      {/* Gold Valuation Hero Summary */}
      <div className="valuation-hero">
        <div>
          <div className="val-item-label">Net Pure Gold</div>
          <div className="val-item-number gold" id="pure-gold-display">
            {quote.pureGoldGrams} g
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {quote.netWeightGrams}g of {quote.karat}K ({quote.purityPercentage}%)
          </div>
        </div>

        <div>
          <div className="val-item-label">Collateral Value</div>
          <div className="val-item-number" id="gold-value-display">
            ₹{quote.goldValueRupees.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Benchmark ₹{quote.rate24kPerGram}/g
          </div>
        </div>
      </div>

      {/* Selectable Scheme Cards */}
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
                  <span className="plan-badge">
                    {plan.planId === 'PLAN_EMI_01' ? '⚡ Equal Monthly Installment' : '🛡️ Bullet Repayment'}
                  </span>
                  {isSelected && <CheckCircle2 size={20} color="var(--primary)" />}
                </div>

                <div className="plan-title">{plan.planName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Max LTV {plan.maxLtvPercent}% · {plan.interestRateDisplay} p.a.
                </div>

                <div className="plan-loan" id={`loan-amount-${plan.planId}`}>
                  ₹{plan.eligibleLoanRupees.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="plan-features">
                <div className="feature-line">
                  <span>Tenure Duration</span>
                  <strong>{plan.tenureMonths} Months</strong>
                </div>

                {plan.monthlyEmiRupees ? (
                  <div className="feature-line">
                    <span>Monthly EMI</span>
                    <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      ₹{plan.monthlyEmiRupees.toLocaleString('en-IN')}/mo
                    </strong>
                  </div>
                ) : (
                  <div className="feature-line">
                    <span>Principal & Interest</span>
                    <strong>At Loan Maturity</strong>
                  </div>
                )}

                <div className="feature-line" style={{ paddingTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>Pre-closure Penalty</span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--success)', fontWeight: 600 }}>0% (Nil)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regulatory LTV Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 0.85rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span>
          Compliance: Maximum loan-to-value (LTV) is capped at 75% under Reserve Bank of India lending directions.
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          style={{ flex: 1 }}
        >
          <ArrowLeft size={18} />
          <span>Modify Details</span>
        </button>

        <button
          id="step2-next-btn"
          type="button"
          className="btn btn-primary"
          onClick={onNext}
          disabled={!selectedPlanId || isLoading}
          style={{ flex: 2 }}
        >
          <span>Review Offer Terms</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
