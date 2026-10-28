# System Architecture & Technical Specifications

AurumFlow is a production-minded gold-loan intake portal engineered with strict financial mathematics, atomic database constraints, and an autonomous AI agent utilizing typed function calling.

---

## 1. High-Level Architecture

```
                  ┌────────────────────────────────────────┐
                  │          React 18 + Vite Web App       │
                  │   (3-Step Intake + AI Chat + Admin)    │
                  └──────────────────┬─────────────────────┘
                                     │ JSON / HTTP
                                     ▼
                  ┌────────────────────────────────────────┐
                  │       Node.js + Express API Server     │
                  ├────────────────────────────────────────┤
                  │  Middlewares:                          │
                  │  • Zod Schema Validator                │
                  │  • Idempotency-Key Cache               │
                  │  • Express Rate Limiter                │
                  │  • Error Contract & Exception Handler  │
                  └──────┬──────────────────────────┬──────┘
                         │                          │
        ┌────────────────▼──────┐     ┌─────────────▼───────────────┐
        │  Core Service Layer   │     │   AI Loan Assist Agent      │
        │  • quoteService       │     │   • Tool Calling Dispatcher │
        │  • leadService        │◄────┤   • Guardrails & Safety     │
        │  • goldRateService    │     │   • Slot Extraction State   │
        └───────────────┬───────┘     └─────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────────────────────────┐
        │       SQLite Database (WAL Mode / Immediate Locking)      │
        │  • loan_schemes     • leads      • idempotency_keys       │
        │  • lead_audit_logs  • indices on (mobile, created_at)     │
        └───────────────────────────────────────────────────────────┘
```

---

## 2. Exact Financial Maths & Money Representation

To avoid floating-point rounding errors common in monetary computations, financial amounts are calculated with strict ordering and stored internally as **integer paise** (1 Rupee = 100 Paise):

1. **Pure Gold Grams**:
   $$\text{pureGoldGrams} = \text{netWeightGrams} \times \left(\frac{\text{karat}}{24}\right)$$
   *(e.g., $45\text{g} \times \frac{22}{24} = 41.25\text{g}$)*

2. **Collateral Value**:
   $$\text{goldValueRupees} = \text{pureGoldGrams} \times \text{rate24kPerGram}$$
   *(e.g., $41.25 \times 7000 = ₹2,88,750$)*

3. **Eligible Loan Amount**:
   $$\text{eligibleLoanRupees} = \left\lfloor \text{goldValueRupees} \times \min(\text{plan.maxLtv}, 0.75) \right\rfloor$$
   *(e.g., $\lfloor 288750 \times 0.75 \rfloor = ₹2,16,562$)*

- Loan amounts are truncated down (`Math.floor`) to whole rupees.
- Regulatory cap of **75% LTV** is enforced strictly on the server, even if a loan scheme defines a higher multiplier.

---

## 3. Data Integrity & Race-Condition Safety

### A. 7-Day Duplicate Prevention
A borrower may not submit two active loan applications within 7 days.
- In `leadService.ts`, de-duplication is executed inside a SQLite `IMMEDIATE` transaction.
- When two concurrent requests arrive simultaneously for the same new mobile number, SQLite's atomic write-lock guarantees that one transaction commits (`201 Created`), while the second transaction immediately detects the existing record and halts with `409 Conflict`.
- Verified by **Test Case #8** in `backend/tests/api.test.ts`.

### B. Idempotency Support
- The `POST /api/v1/leads` endpoint evaluates the `Idempotency-Key` header.
- Repeated requests replay the cached original `201` response with the header `X-Cache-Lookup: HIT`, preventing accidental double bookings.

---

## 4. AI Loan Assist Agent Architecture

The AI Loan Agent follows a deterministic tool-augmented pattern:
1. **Never guesses financial numbers**: The LLM is strictly prohibited from doing mental arithmetic. Every quote is computed by `calculate_quote`.
2. **Never invents schemes**: Only schemes retrieved from `get_loan_schemes` are communicated.
3. **Explicit Confirmation Gate**: The agent presents a structured summary and waits for the borrower's affirmative response (`yes` / `confirm`) before calling `submit_application`.
4. **Safety Guardrails**: Investment advice (crypto, stocks) and off-topic requests are rejected politely. Prompt injections attempting to override rules or LTV limits are thwarted.
5. **Privacy Safeguard**: Applicant phone numbers are masked in all logs (`9876XXXX10`).
