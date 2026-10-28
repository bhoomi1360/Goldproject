import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Step1Details, FormDetails, FieldErrors } from './components/Step1Details';
import { Step2Quote } from './components/Step2Quote';
import { Step3Confirm } from './components/Step3Confirm';
import { ChatDrawer } from './components/ChatDrawer';
import { AdminView } from './components/AdminView';
import {
  calculateQuote,
  submitLeadApplication,
  QuoteResponse,
  PlanQuote,
  LeadItem,
  fetchGoldRate,
} from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<'portal' | 'admin'>('portal');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [goldRate, setGoldRate] = useState<number>(7000);

  // Form State
  const [formData, setFormData] = useState<FormDetails>({
    fullName: '',
    mobileNumber: '',
    grossWeightGrams: '45',
    netWeightGrams: '45',
    karat: 22,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PLAN_EMI_01');
  const [isQuoting, setIsQuoting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Result & Error States
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    data: LeadItem;
  } | null>(null);
  const [conflictError, setConflictError] = useState<{
    message: string;
    existingApplicationId?: string;
  } | null>(null);

  // Load benchmark gold rate
  useEffect(() => {
    fetchGoldRate()
      .then((data) => {
        if (data?.rates?.['24K']) setGoldRate(data.rates['24K']);
      })
      .catch(() => {});
  }, []);

  // Validate form inputs inline
  const validateField = (field: keyof FormDetails, value: any): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value || value.trim().length < 2) return 'Full Name must be at least 2 characters';
        if (value.trim().length > 60) return 'Full Name cannot exceed 60 characters';
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Full Name must contain only letters and spaces';
        return undefined;

      case 'mobileNumber':
        if (!value || !/^[6-9]\d{9}$/.test(value.trim())) {
          return 'Enter a valid 10-digit Indian mobile starting with 6-9';
        }
        return undefined;

      case 'grossWeightGrams': {
        const gross = parseFloat(value);
        if (isNaN(gross) || gross <= 0) return 'Gross weight must be greater than 0';
        if (gross > 1000) return 'Gross weight cannot exceed 1000 grams';
        return undefined;
      }

      case 'netWeightGrams': {
        const net = parseFloat(value);
        const gross = parseFloat(formData.grossWeightGrams);
        if (isNaN(net) || net <= 0) return 'Net weight must be greater than 0';
        if (net > 1000) return 'Net weight cannot exceed 1000 grams';
        if (!isNaN(gross) && net > gross) {
          return 'Net weight cannot exceed gross weight';
        }
        return undefined;
      }

      default:
        return undefined;
    }
  };

  const handleFormChange = (updated: Partial<FormDetails>) => {
    const nextForm = { ...formData, ...updated };
    setFormData(nextForm);

    // Update validation errors
    const nextErrors: FieldErrors = { ...fieldErrors };
    Object.keys(updated).forEach((k) => {
      const key = k as keyof FormDetails;
      const err = validateField(key, nextForm[key]);
      if (err) nextErrors[key] = err;
      else delete nextErrors[key];
    });

    // Also revalidate net vs gross relationship
    if (updated.grossWeightGrams !== undefined || updated.netWeightGrams !== undefined) {
      const netErr = validateField('netWeightGrams', nextForm.netWeightGrams);
      if (netErr) nextErrors.netWeightGrams = netErr;
      else delete nextErrors.netWeightGrams;
    }

    setFieldErrors(nextErrors);
  };

  // Debounced Quote Calculation (300ms)
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    const gross = parseFloat(formData.grossWeightGrams);
    const net = parseFloat(formData.netWeightGrams);

    if (
      !isNaN(gross) &&
      !isNaN(net) &&
      gross > 0 &&
      net > 0 &&
      net <= gross &&
      gross <= 1000 &&
      (formData.karat === 18 || formData.karat === 22 || formData.karat === 24)
    ) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(async () => {
        setIsQuoting(true);
        try {
          const res = await calculateQuote({
            grossWeightGrams: gross,
            netWeightGrams: net,
            karat: formData.karat,
          });
          setQuote(res);
        } catch (err) {
          console.error('Failed to calculate live quote:', err);
        } finally {
          setIsQuoting(false);
        }
      }, 300);
    }

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData.grossWeightGrams, formData.netWeightGrams, formData.karat]);

  // Handle final submission
  const handleSubmitLead = async () => {
    const nameErr = validateField('fullName', formData.fullName);
    const mobErr = validateField('mobileNumber', formData.mobileNumber);
    const grossErr = validateField('grossWeightGrams', formData.grossWeightGrams);
    const netErr = validateField('netWeightGrams', formData.netWeightGrams);

    if (nameErr || mobErr || grossErr || netErr) {
      setFieldErrors({
        fullName: nameErr,
        mobileNumber: mobErr,
        grossWeightGrams: grossErr,
        netWeightGrams: netErr,
      });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    setConflictError(null);

    // Generate unique Idempotency-Key for this submission attempt
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const res = await submitLeadApplication(
        {
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          grossWeightGrams: parseFloat(formData.grossWeightGrams),
          netWeightGrams: parseFloat(formData.netWeightGrams),
          karat: formData.karat,
          planId: selectedPlanId,
        },
        idempotencyKey
      );

      setSubmissionResult(res);
    } catch (err: any) {
      if (err?.error?.code === 'DUPLICATE_APPLICATION' || err?.status === 409) {
        setConflictError({
          message:
            err?.error?.message ||
            'You have already applied recently. Borrowers can submit one application every 7 days.',
          existingApplicationId: err?.error?.existingApplicationId,
        });
      } else if (err?.error?.fields) {
        const serverErrors: FieldErrors = {};
        err.error.fields.forEach((f: any) => {
          (serverErrors as any)[f.field] = f.message;
        });
        setFieldErrors(serverErrors);
        setCurrentStep(1);
      } else {
        setConflictError({
          message: err?.error?.message || 'Submission failed. Please check details and try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: '',
      mobileNumber: '',
      grossWeightGrams: '45',
      netWeightGrams: '45',
      karat: 22,
    });
    setSubmissionResult(null);
    setConflictError(null);
    setCurrentStep(1);
  };

  const selectedPlan: PlanQuote | undefined =
    quote?.quotes.find((q) => q.planId === selectedPlanId) || quote?.quotes[0];

  return (
    <>
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        goldRate={goldRate}
      />

      <main className="container">
        {currentTab === 'admin' ? (
          <AdminView />
        ) : (
          <div className="portal-grid">
            {/* Left Column: 3-Step Gold Loan Application Flow */}
            <div>
              {/* Stepper Navigation */}
              {!submissionResult && (
                <div className="stepper-nav">
                  <button
                    type="button"
                    className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
                    onClick={() => setCurrentStep(1)}
                  >
                    <span className="step-number">1</span>
                    <span>Details</span>
                  </button>

                  <div className="step-divider" />

                  <button
                    type="button"
                    className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
                    onClick={() => {
                      if (!fieldErrors.grossWeightGrams && !fieldErrors.netWeightGrams) {
                        setCurrentStep(2);
                      }
                    }}
                    disabled={Boolean(fieldErrors.grossWeightGrams || fieldErrors.netWeightGrams)}
                  >
                    <span className="step-number">2</span>
                    <span>Live Quote</span>
                  </button>

                  <div className="step-divider" />

                  <button
                    type="button"
                    className={`step-item ${currentStep === 3 ? 'active' : ''}`}
                    onClick={() => {
                      if (formData.fullName && formData.mobileNumber) {
                        setCurrentStep(3);
                      }
                    }}
                    disabled={!formData.fullName || !formData.mobileNumber}
                  >
                    <span className="step-number">3</span>
                    <span>Confirm</span>
                  </button>
                </div>
              )}

              {/* Step 1: Details */}
              {currentStep === 1 && !submissionResult && (
                <Step1Details
                  formData={formData}
                  onChange={handleFormChange}
                  errors={fieldErrors}
                  onNext={() => setCurrentStep(2)}
                />
              )}

              {/* Step 2: Live Quote & Scheme Selection */}
              {currentStep === 2 && !submissionResult && (
                <Step2Quote
                  quote={quote}
                  selectedPlanId={selectedPlanId}
                  onSelectPlan={setSelectedPlanId}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  isLoading={isQuoting}
                />
              )}

              {/* Step 3: Review & Final Confirmation / Success */}
              {(currentStep === 3 || submissionResult) && selectedPlan && quote && (
                <Step3Confirm
                  formData={formData}
                  quote={quote}
                  selectedPlan={selectedPlan}
                  onBack={() => setCurrentStep(2)}
                  onSubmit={handleSubmitLead}
                  isSubmitting={isSubmitting}
                  submissionResult={submissionResult}
                  conflictError={conflictError}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* Right Column: AI Loan Assistant Chat */}
            <div>
              <ChatDrawer
                onApplicationCreated={(appId) => {
                  console.log(`Lead filed by assistant: ${appId}`);
                }}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
export default App;
