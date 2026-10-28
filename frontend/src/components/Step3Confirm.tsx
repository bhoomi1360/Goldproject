import React from 'react';
import { FormDetails } from './Step1Details';
import { QuoteResponse, PlanQuote, LeadItem } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Send,
  RotateCcw,
  ShieldCheck,
  FileText,
} from 'lucide-react';

interface Step3Props {
  formData: FormDetails;
  quote: QuoteResponse;
  selectedPlan: PlanQuote;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submissionResult: { applicationId: string; data: LeadItem } | null;
  conflictError: { message: string; existingApplicationId?: string } | null;
  onReset: () => void;
}

export const Step3Confirm: React.FC<Step3Props> = ({
  formData,
  quote,
  selectedPlan,
  onBack,
  onSubmit,
  isSubmitting,
  submissionResult,
  conflictError,
  onReset,
}) => {
  // If submission was successful, show the success screen!
  if (submissionResult) {
    return (
      <div className="card success-card">
        <div className="success-icon">
          <CheckCircle2 size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Application Submitted Successfully!
        </h2>
        <p className="card-desc">
          Your gold loan pre-approval offer has been registered with our lending partner.
        </p>

        <div className="app-id-banner" id="success-application-id">
          {submissionResult.applicationId}
        </div>

        <div
          style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            margin: '1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Borrower Name</span>
            <strong>{submissionResult.data.fullName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Masked Mobile</span>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {submissionResult.data.mobileNumber}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Gold Collateral</span>
            <strong>
              {submissionResult.data.netWeightGrams}g ({submissionResult.data.karat}K Gold)
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Selected Scheme</span>
            <strong>{submissionResult.data.planName || selectedPlan.planName}</strong>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.6rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Approved Loan Amount</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.15rem', fontFamily: 'var(--font-mono)' }}>
              ₹{submissionResult.data.eligibleLoanRupees.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        <button
          type="button"
          id="new-application-btn"
          className="btn btn-outline"
          onClick={onReset}
        >
          <RotateCcw size={16} />
          <span>Start New Application</span>
        </button>
      </div>
    );
  }

  // Step 3 Review & Submit View
  return (
    <div className="card">
      <div className="card-title">
        <FileText className="text-primary" size={24} />
        <span>Step 3: Review & Final Confirmation</span>
      </div>
      <p className="card-desc">
        Review your borrower details and loan terms before submitting to the credit desk.
      </p>

      {/* Friendly 409 Duplicate Error Banner */}
      {conflictError && (
        <div className="alert-box alert-danger" id="conflict-error-box">
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Existing Application Found</strong>
            <p style={{ marginTop: '0.2rem' }}>
              {conflictError.existingApplicationId
                ? `You already applied recently with application ID ${conflictError.existingApplicationId}. Borrowers can submit one application every 7 days.`
                : conflictError.message}
            </p>
          </div>
        </div>
      )}

      {/* Review Summary Breakdown */}
      <div
        style={{
          background: 'var(--bg-main)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          fontSize: '0.9rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Full Name</span>
          <strong>{formData.fullName}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Mobile Number</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{formData.mobileNumber}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Gross / Net Weight</span>
          <strong>
            {formData.grossWeightGrams}g / {formData.netWeightGrams}g
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Purity & Pure Gold</span>
          <strong>
            {formData.karat}K Gold ({quote.pureGoldGrams}g pure)
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Collateral Market Value</span>
          <strong>₹{quote.goldValueRupees.toLocaleString('en-IN')}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Selected Scheme</span>
          <span className="plan-tag" style={{ margin: 0 }}>
            {selectedPlan.planName} ({selectedPlan.interestRateDisplay} p.a.)
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontWeight: 700 }}>Eligible Loan Offer</span>
          <span
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ₹{selectedPlan.eligibleLoanRupees.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={onBack}
          disabled={isSubmitting}
          style={{ flex: 1 }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <button
          id="confirm-submit-btn"
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={isSubmitting}
          style={{ flex: 2 }}
        >
          <Send size={18} />
          <span>{isSubmitting ? 'Submitting Application...' : 'Confirm & Submit Lead'}</span>
        </button>
      </div>
    </div>
  );
};
