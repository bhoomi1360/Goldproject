import React from 'react';
import { FormDetails } from './Step1Details';
import { QuoteResponse, PlanQuote, LeadItem } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Send,
  RotateCcw,
  FileText,
  ShieldCheck,
  Clock,
  Printer,
  BadgeCheck,
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
      <div className="card success-box">
        <div className="success-check-circle">
          <BadgeCheck size={36} />
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
          Application Successfully Registered!
        </h2>
        <p className="card-desc" style={{ marginBottom: '1rem' }}>
          Your gold loan file has been assigned to our local branch vault officer for valuation verification.
        </p>

        <div className="app-id-pill" id="success-application-id">
          {submissionResult.applicationId}
        </div>

        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left',
            margin: '1.5rem 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Primary Borrower</span>
            <strong style={{ color: 'var(--text-main)' }}>{submissionResult.data.fullName}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Registered Mobile</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
              {submissionResult.data.mobileNumber}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Collateral Declared</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {submissionResult.data.netWeightGrams}g ({submissionResult.data.karat}K Gold)
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Chosen Scheme</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {submissionResult.data.planName || selectedPlan.planName}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Approved Loan Facility</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.3rem', fontFamily: 'var(--font-mono)' }}>
              ₹{submissionResult.data.eligibleLoanRupees.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            <span>Print Acknowledgment</span>
          </button>

          <button
            type="button"
            id="new-application-btn"
            className="btn btn-primary"
            onClick={onReset}
          >
            <RotateCcw size={16} />
            <span>New Application</span>
          </button>
        </div>
      </div>
    );
  }

  // Step 3 Review & Confirmation View
  return (
    <div className="card">
      <div className="card-title">
        <FileText className="text-primary" size={24} />
        <span>Step 3: Pre-Approval Verification</span>
      </div>
      <p className="card-desc">
        Please verify the applicant's credentials and loan terms before submitting to the underwriting desk.
      </p>

      {/* Friendly 409 Duplicate Error Banner */}
      {conflictError && (
        <div className="alert-box alert-danger" id="conflict-error-box">
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Active Application On Record</strong>
            <p style={{ marginTop: '0.2rem', lineHeight: 1.4 }}>
              {conflictError.existingApplicationId
                ? `You already applied recently with application ID ${conflictError.existingApplicationId}. Borrowers can submit one application every 7 days.`
                : conflictError.message}
            </p>
          </div>
        </div>
      )}

      {/* Review Breakdown Card */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Borrower Name</span>
          <strong style={{ color: 'var(--text-main)' }}>{formData.fullName}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Contact Mobile</span>
          <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
            {formData.mobileNumber}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Weight (Gross / Net)</span>
          <strong style={{ color: 'var(--text-main)' }}>
            {formData.grossWeightGrams}g / {formData.netWeightGrams}g
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Assessed Purity</span>
          <strong style={{ color: 'var(--text-main)' }}>
            {formData.karat} Karat ({quote.pureGoldGrams}g pure gold)
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Market Collateral Valuation</span>
          <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            ₹{quote.goldValueRupees.toLocaleString('en-IN')}
          </strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>Repayment Plan</span>
          <span className="plan-badge" style={{ margin: 0 }}>
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
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Eligible Loan Amount
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Disbursed in 30 mins upon physical hallmarking verification
            </div>
          </div>
          <span
            style={{
              fontSize: '1.5rem',
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
          <span>{isSubmitting ? 'Registering with Underwriter...' : 'Confirm & Register Application'}</span>
        </button>
      </div>
    </div>
  );
};
