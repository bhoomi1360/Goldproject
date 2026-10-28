import React from 'react';
import { Scale, AlertCircle, ArrowRight, Info, ShieldCheck, Gem } from 'lucide-react';

export interface FormDetails {
  fullName: string;
  mobileNumber: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  karat: 18 | 22 | 24;
}

export interface FieldErrors {
  fullName?: string;
  mobileNumber?: string;
  grossWeightGrams?: string;
  netWeightGrams?: string;
  karat?: string;
}

interface Step1Props {
  formData: FormDetails;
  onChange: (updated: Partial<FormDetails>) => void;
  errors: FieldErrors;
  onNext: () => void;
}

export const Step1Details: React.FC<Step1Props> = ({
  formData,
  onChange,
  errors,
  onNext,
}) => {
  const isFormValid =
    formData.fullName.trim().length >= 2 &&
    /^[a-zA-Z\s]+$/.test(formData.fullName.trim()) &&
    /^[6-9]\d{9}$/.test(formData.mobileNumber.trim()) &&
    parseFloat(formData.grossWeightGrams) > 0 &&
    parseFloat(formData.netWeightGrams) > 0 &&
    parseFloat(formData.netWeightGrams) <= parseFloat(formData.grossWeightGrams) &&
    parseFloat(formData.grossWeightGrams) <= 1000;

  const handleAddWeight = (added: number) => {
    const current = parseFloat(formData.netWeightGrams) || 0;
    const nextVal = Math.min(1000, current + added).toString();
    onChange({
      grossWeightGrams: nextVal,
      netWeightGrams: nextVal,
    });
  };

  return (
    <div className="card">
      <div className="card-title">
        <Scale className="text-primary" size={24} />
        <span>Step 1: Borrower & Collateral Intake</span>
      </div>
      <p className="card-desc">
        Enter the borrower credentials and certified physical gold weights. We calculate pure gold value automatically.
      </p>

      {/* Full Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="fullName">
          <span>Borrower Full Name</span>
          <span className="form-label-hint">As printed on Aadhaar / PAN</span>
        </label>
        <input
          id="fullName"
          type="text"
          className={`form-input ${errors.fullName ? 'has-error' : ''}`}
          placeholder="e.g. Ramesh Chandra Sharma"
          value={formData.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          autoComplete="name"
        />
        {errors.fullName && (
          <div className="field-error" id="fullName-error">
            <AlertCircle size={14} />
            <span>{errors.fullName}</span>
          </div>
        )}
      </div>

      {/* Mobile Number */}
      <div className="form-group">
        <label className="form-label" htmlFor="mobileNumber">
          <span>Borrower Mobile Number</span>
          <span className="form-label-hint">10-digit Indian (+91)</span>
        </label>
        <input
          id="mobileNumber"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          className={`form-input ${errors.mobileNumber ? 'has-error' : ''}`}
          placeholder="9876543210"
          value={formData.mobileNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            onChange({ mobileNumber: val });
          }}
        />
        {errors.mobileNumber && (
          <div className="field-error" id="mobileNumber-error">
            <AlertCircle size={14} />
            <span>{errors.mobileNumber}</span>
          </div>
        )}
      </div>

      {/* Weights Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Gross Weight */}
        <div className="form-group">
          <label className="form-label" htmlFor="grossWeightGrams">
            <span>Gross Weight (g)</span>
            <span className="form-label-hint">Total scale</span>
          </label>
          <input
            id="grossWeightGrams"
            type="text"
            inputMode="decimal"
            className={`form-input ${errors.grossWeightGrams ? 'has-error' : ''}`}
            placeholder="45.00"
            value={formData.grossWeightGrams}
            onChange={(e) => onChange({ grossWeightGrams: e.target.value })}
          />
          {errors.grossWeightGrams && (
            <div className="field-error">
              <AlertCircle size={14} />
              <span>{errors.grossWeightGrams}</span>
            </div>
          )}
        </div>

        {/* Net Weight */}
        <div className="form-group">
          <label className="form-label" htmlFor="netWeightGrams">
            <span>Net Gold Weight (g)</span>
            <span className="form-label-hint">Pure metal</span>
          </label>
          <input
            id="netWeightGrams"
            type="text"
            inputMode="decimal"
            className={`form-input ${errors.netWeightGrams ? 'has-error' : ''}`}
            placeholder="45.00"
            value={formData.netWeightGrams}
            onChange={(e) => onChange({ netWeightGrams: e.target.value })}
          />
          {errors.netWeightGrams && (
            <div className="field-error">
              <AlertCircle size={14} />
              <span>{errors.netWeightGrams}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Weight Adjuster for Field Agents */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
          ⚡ Field Quick Add (Grams):
        </div>
        <div className="quick-chips-row">
          <button type="button" className="quick-chip" onClick={() => handleAddWeight(5)}>
            +5g
          </button>
          <button type="button" className="quick-chip" onClick={() => handleAddWeight(10)}>
            +10g
          </button>
          <button type="button" className="quick-chip" onClick={() => handleAddWeight(25)}>
            +25g
          </button>
          <button type="button" className="quick-chip" onClick={() => handleAddWeight(50)}>
            +50g
          </button>
          <button
            type="button"
            className="quick-chip"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => onChange({ grossWeightGrams: '45', netWeightGrams: '45' })}
          >
            Reset (45g)
          </button>
        </div>
      </div>

      {/* Purity Karat Selection */}
      <div className="form-group">
        <label className="form-label">
          <span>BIS Hallmarked Purity</span>
          <span className="form-label-hint">Standard Indian Carats</span>
        </label>
        <div className="purity-grid">
          <button
            type="button"
            id="karat-18"
            className={`purity-card-btn ${formData.karat === 18 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 18 })}
          >
            <span className="purity-title">18 Karat</span>
            <span className="purity-spec">75.0% Gold</span>
            <span className="purity-hallmark">BIS 750</span>
          </button>

          <button
            type="button"
            id="karat-22"
            className={`purity-card-btn ${formData.karat === 22 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 22 })}
          >
            <span className="purity-title">22 Karat</span>
            <span className="purity-spec">91.67% Gold</span>
            <span className="purity-hallmark">BIS 916</span>
          </button>

          <button
            type="button"
            id="karat-24"
            className={`purity-card-btn ${formData.karat === 24 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 24 })}
          >
            <span className="purity-title">24 Karat</span>
            <span className="purity-spec">99.9% Gold</span>
            <span className="purity-hallmark">BIS 999</span>
          </button>
        </div>
      </div>

      {/* Stone Deduction Note */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          alignItems: 'center',
          padding: '0.65rem 0.85rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.775rem',
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
        }}
      >
        <Gem size={16} color="var(--gold)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Deduction note:</strong> Deduct weight of emeralds, rubies, or lac wax from gross weight to arrive at net gold weight.
        </span>
      </div>

      <button
        id="step1-next-btn"
        type="button"
        className="btn btn-primary btn-block"
        onClick={onNext}
        disabled={!isFormValid}
      >
        <span>Calculate Loan Offer</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
