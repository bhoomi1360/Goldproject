# 🪙 AurumFlow — Gold Loan Portal with an AI Agent

> Production-minded gold-loan intake portal: a validated full-stack app with exact financial mathematics, 100% regulatory compliance, and an autonomous AI agent that calls backend tools instead of guessing.

---

## ⚡ Quick Start

```bash
# 1. Clone repository & install dependencies
git clone <repo-url>
cd project
npm install
npm --prefix frontend install

# 2. Seed database (Optional: auto-seeds on first run)
npm run seed

# 3. Run all automated tests (Maths + API test cases 1 to 8)
npm test

# 4. Run AI Agent Conversation Evaluation suite (5 core + 2 bonus dialogues)
npm run eval

# 5. Start development server (Backend on :3000, Frontend on :5173)
npm run dev
```

Visit the application at: **`http://localhost:5173`** (or `http://localhost:3000` for production build).

---

## 🚀 Environment Variables (`.env.example`)

Copy the example file to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Runtime environment (`development` / `production`) |
| `DB_PATH` | `./gold_loan.db` | Path to SQLite database file |
| `BENCHMARK_24K_RATE` | `7000` | Benchmark 24K bullion price in ₹ per gram |
| `OPENAI_API_KEY` | *(optional)* | OpenAI API Key (portal includes local emulator for testing without paid keys) |

---

## 💎 Mathematical Exactness (Test Cases 1–8)

All financial figures are strictly calculated according to regulatory mandates and stored internally as **integer paise**:

$$\text{pureGoldGrams} = \text{netWeightGrams} \times \left(\frac{\text{karat}}{24}\right)$$
$$\text{goldValue} = \text{pureGoldGrams} \times \text{rate24kPerGram}$$
$$\text{eligibleLoan} = \lfloor \text{goldValue} \times \min(\text{plan.maxLtv}, 0.75) \rfloor$$

| # | Input | Expected Output | Status |
| :---: | :--- | :--- | :---: |
| **1** | 45g net · 22K · EMI (`PLAN_EMI_01`) | pure 41.25g · value ₹2,88,750 · loan **₹2,16,562** | ✅ PASSED (201) |
| **2** | 45g net · 22K · Bullet (`PLAN_BULLET_01`) | value ₹2,88,750 · loan **₹2,02,125** (70% LTV) | ✅ PASSED (200) |
| **3** | 10g net · 18K · EMI (`PLAN_EMI_01`) | pure 7.5g · value ₹52,500 · loan **₹39,375** | ✅ PASSED (200) |
| **4** | Net 52g > Gross 50g | `400 Bad Request` with field error on `netWeightGrams` | ✅ PASSED (400) |
| **5** | Mobile `5876543210` or `98765` | `400 Bad Request` with field error on `mobileNumber` | ✅ PASSED (400) |
| **6** | Duplicate mobile within 7 days | `409 Conflict` with existing `applicationId` | ✅ PASSED (409) |
| **7** | Replay with same `Idempotency-Key` | Original `201` response replayed (`X-Cache-Lookup: HIT`) | ✅ PASSED (201) |
| **8** | 2 parallel requests, same new mobile | Atomic serialization: exactly **one 201** and **one 409** | ✅ PASSED (Atomic) |

Run all tests:
```bash
npm test
```

---

## 🤖 AI Loan Assist Agent (`npm run eval`)

Borrowers can converse naturally with the AI Assistant (*"I have 45 grams of 22 carat jewellery, how much can I get?"*). The agent operates under strict safety and regulatory bounds:

1. **Function Calling Architecture**:
   - `get_loan_schemes()`: Fetches active plans directly from DB. The agent never hallucinates unseeded schemes.
   - `calculate_quote(net, gross, karat)`: Computes gold purity, bullion value, and loans. The LLM **never** does arithmetic itself.
   - `submit_application(payload)`: Inserts verified lead only after presenting an explicit confirmation summary card.
   - `check_existing_application(mobile)`: Proactively alerts if the borrower already applied within 7 days.
2. **Safety & Regulatory Guardrails**:
   - Declines investment advice (crypto, stocks, speculation) politely.
   - Blocks off-topic queries and prompt injection attempts.
   - Masks sensitive borrower numbers in logs (`9876XXXX10`).
3. **Conversational Test Suite**:
   Run the 7 automated conversations:
   ```bash
   npm run eval
   ```
   - Conversation 1: Happy path through to 201 submission
   - Conversation 2: Slot-filling missing fields (karat, name, phone)
   - Conversation 3: Net weight greater than gross validation
   - Conversation 4: 7-day duplicate policy enforcement
   - Conversation 5: Off-topic / investment advice rejection
   - Conversation 6 (Bonus): Prompt injection defense
   - Conversation 7 (Bonus): User cancellation / changing mind

---

## 🏆 Bonus Tasks Implemented

- [x] **B1 · Harden the Backend**:
  - `Idempotency-Key` HTTP header handling on `POST /leads` to ensure safe retries.
  - Concurrency-safe transactions (`db.transaction`) preventing duplicate inserts under simultaneous parallel requests.
  - Lead lifecycle state machine (`SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `APPROVED` / `REJECTED`) with an audit log table (`lead_audit_logs`).
  - Cached gold-rate endpoint (`GET /api/v1/gold-rate`).
- [x] **B2 · Smarter Agent**:
  - 4th agent tool: `check_existing_application(mobile)`.
  - Prompt injection defense test cases in eval suite.
  - Visual tool-status indicators (`Terminal: called calculate_quote()`).
- [x] **B4 · Ops Ready**:
  - Production `Dockerfile` and `docker-compose.yml`.
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`).
  - IP-based rate limiting on `POST /leads` via `express-rate-limit`.
  - Comprehensive [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 📱 Mobile-First Field Agent UX

- **Responsive Design**: Tested down to 375px viewport for field agents.
- **Sensible Keypads**: `inputMode="numeric"` for phone numbers and `inputMode="decimal"` for gold weights.
- **Live Debounced Calculation**: Re-quotes automatically at 300ms debounce as weights are entered.
- **Masked Data**: Admin table and response payloads automatically format mobile numbers as `9876XXXX10`.

---

## 🔮 What I Would Do With More Time

1. **OCR Appraisal Slip Extraction (Bonus B3)**: Integrate a document vision pipeline (e.g. AWS Textract or Gemini 2.0 Flash multimodal) to parse jeweler appraisal certificates directly from a camera snap.
2. **Production Postgres Migration**: Although SQLite with WAL mode is zero-config and handles thousands of reads/writes concurrently, add Drizzle ORM migrations targeting AWS Aurora PostgreSQL with read-replicas.
3. **WhatsApp Business Webhook**: Hook the `agentService` into the Twilio/WhatsApp Business API so rural borrowers can apply via voice notes or text on WhatsApp.
4. **SMS OTP Authentication**: Add a 2-factor OTP verification step via SMS (e.g. Twilio/Msg91) before final lead registration.
