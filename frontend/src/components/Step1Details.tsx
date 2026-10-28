import React from 'react';
import { User, Phone, Scale, Award, AlertCircle, ArrowRight } from 'lucide-react';

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

  return (
    <div className="card">
      <div className="card-title">
        <Scale className="text-primary" size={24} />
        <span>Step 1: Borrower & Gold Details</span>
      </div>
      <p className="card-desc">
        Enter borrower identity and accurate jewellery weight to compute the loan eligibility.
      </p>

      {/* Full Name */}
      <div className="form-group">
        <label className="form-label" htmlFor="fullName">
          Full Name
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="fullName"
            type="text"
            className={`form-input ${errors.fullName ? 'has-error' : ''}`}
            placeholder="e.g. Ramesh Kumar"
            value={formData.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            autoComplete="name"
          />
        </div>
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
          Mobile Number (10 Digits)
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="mobileNumber"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            className={`form-input ${errors.mobileNumber ? 'has-error' : ''}`}
            placeholder="e.g. 9876543210"
            value={formData.mobileNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
              onChange({ mobileNumber: val });
            }}
          />
        </div>
        {errors.mobileNumber && (
          <div className="field-error" id="mobileNumber-error">
            <AlertCircle size={14} />
            <span>{errors.mobileNumber}</span>
          </div>
        )}
      </div>

      {/* Weight Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Gross Weight */}
        <div className="form-group">
          <label className="form-label" htmlFor="grossWeightGrams">
            Gross Weight (g)
          </label>
          <input
            id="grossWeightGrams"
            type="text"
            inputMode="decimal"
            className={`form-input ${errors.grossWeightGrams ? 'has-error' : ''}`}
            placeholder="e.g. 45"
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
            Net Gold Weight (g)
          </label>
          <input
            id="netWeightGrams"
            type="text"
            inputMode="decimal"
            className={`form-input ${errors.netWeightGrams ? 'has-error' : ''}`}
            placeholder="e.g. 45"
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

      {/* Gold Karat Selection */}
      <div className="form-group">
        <label className="form-label">Gold Purity (Karat)</label>
        <div className="purity-pills">
          <button
            type="button"
            id="karat-18"
            className={`purity-btn ${formData.karat === 18 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 18 })}
          >
            18 Karat
            <span className="purity-sub">75.0% Purity</span>
          </button>
          <button
            type="button"
            id="karat-22"
            className={`purity-btn ${formData.karat === 22 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 22 })}
          >
            22 Karat
            <span className="purity-sub">91.67% Purity</span>
          </button>
          <button
            type="button"
            id="karat-24"
            className={`purity-btn ${formData.karat === 24 ? 'active' : ''}`}
            onClick={() => onChange({ karat: 24 })}
          >
            24 Karat
            <span className="purity-sub">99.9% Purity</span>
          </button>
        </div>
      </div>

      <button
        id="step1-next-btn"
        type="button"
        className="btn btn-primary btn-block"
        onClick={onNext}
        disabled={!isFormValid}
        style={{ marginTop: '1rem' }}
      >
        <span>View Live Quotes & Schemes</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
