# AI Assistance & Verification Log (`AI_LOG.md`)

This document records the transparent and critical use of AI tools during the architecture, implementation, and automated testing of the **Gold Loan Portal**.

---

## 1. AI Tools Used & Purpose

| AI Tool | Purpose & Responsibilities |
| :--- | :--- |
| **Google Antigravity & Claude Code** | Full-stack scaffolding, financial formula verification, test-driven validation schemas, race condition simulation, and automated conversation evaluation engine. |
| **TypeScript Compiler & Vitest** | Automated static analysis and real-time execution verification against all 8 technical specification test cases. |

---

## 2. Two Exact Prompts Used

### Prompt 1: Validation & Error Shape Enforcement (Zod & HTTP Statuses)
```text
Write a robust Zod validation schema for POST /api/v1/quotes and POST /api/v1/leads adhering strictly to the assignment rules:
1. Name must be 2 to 60 characters with only letters and spaces (^[a-zA-Z\s]+$).
2. Mobile must be an Indian 10-digit number starting with 6-9 (^[6-9]\d{9}$).
3. Weight constraint: 0 < netWeightGrams <= grossWeightGrams <= 1000g. If net > gross, return a 400 error targeted at 'netWeightGrams'.
4. Karat must be strictly 18, 22, or 24.
5. If planId does not exist in the database, return HTTP 404 with error code 'PLAN_NOT_FOUND'.
6. If the same mobile applied within the last 7 days, return HTTP 409 Conflict with the existing applicationId.
7. Wrap all errors in the standard contract:
   { "error": { "code": string, "message": string, "fields"?: [{ "field": string, "message": string }] } }
Ensure 500 responses return clean JSON without any exposed stack traces.
```

### Prompt 2: AI Agent Function Calling & Guardrails Integration
```text
Design an AI Loan Assistant service that acts as an autonomous agent using typed tool calling:
1. Tool 1: get_loan_schemes() - fetches active plans from the DB. The model must not invent or describe plans outside this tool.
2. Tool 2: calculate_quote(net, gross, karat) - invokes the quote engine. The model must never perform mental arithmetic; all numbers come from this tool.
3. Tool 3: submit_application(payload) - files the lead with status SUBMITTED, but MUST be gated by an explicit user confirmation step showing the summary.
4. Tool 4: check_existing_application(mobile) - detects repeat applicants within 7 days.
5. Guardrails: The agent must decline investment/market advice (e.g., crypto, stocks) and refuse off-topic requests politely. It must also resist adversarial prompt injections attempting to bypass LTV caps (maximum 75%).
```

---

## 3. Place Where the AI Got It Wrong, How It Was Spotted & Test That Catches It

### The Mistake
During the initial implementation of the conversational slot extractor in `agentService.ts`:
1. The AI generated a regex pattern to extract weights:
   ```javascript
   const netMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams|gram)\s*(?:net|of)?/);
   ```
2. When evaluating **Test Conversation #3** (`"I have gross weight 50g and net weight 55g of 22k gold, quote me"`), the AI's regex eagerly matched `"50g"` (the gross weight) and assigned it to `netWeightGrams` because `"50g"` appeared first in the sentence.
3. As a result, the backend evaluated `netWeightGrams = 50` and `grossWeightGrams = 50`, completely bypassing the `net > gross` business validation check, and calculated a quote instead of rejecting the input!

### How It Was Spotted
We executed the automated dialogue evaluation script (`npm run eval`):
```bash
npm run eval
```
The test suite immediately flagged a failure:
```text
📌 Test Conversation #3: [Business Rules & Validation]
  💬 User: "I have gross weight 50g and net weight 55g of 22k gold, quote me"
  🤖 Agent: "Based on 50g of 22K gold..."
  ❌ Response did not contain expected phrase: "cannot be greater than gross weight"
```

### The Fix
We refactored `agentService.ts` to implement explicit, non-overlapping extraction for gross and net weights:
```typescript
// Explicit gross weight extraction: "gross weight 50g", "gross 50 g"
const grossMatch = lower.match(/gross\s*(?:weight)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g?/);
if (grossMatch) {
  state.collectedDetails!.grossWeightGrams = parseFloat(grossMatch[1]);
}

// Explicit net weight extraction: "net weight 55g", "net 45g", "45 g net"
const explicitNetMatch = lower.match(/net\s*(?:weight)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*g?/) ||
                         lower.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*net/);
if (explicitNetMatch) {
  state.collectedDetails!.netWeightGrams = parseFloat(explicitNetMatch[1]);
}
```

### The Automated Test That Now Catches It
We codified this into both `backend/tests/api.test.ts` (unit/API level) and `backend/eval/agentConversations.eval.ts` (conversational agent level):

```typescript
// From backend/eval/agentConversations.eval.ts (Test Conversation #3):
{
  id: 3,
  title: 'Validation Error: Net weight greater than gross weight',
  category: 'Business Rules & Validation',
  steps: [
    {
      user: 'I have gross weight 50g and net weight 55g of 22k gold, quote me',
      expectedReplyContains: ['cannot be greater than gross weight', 'verify'],
    },
  ],
}
```

Now, running `npm run eval` confirms that this validation error is caught accurately every single time.
