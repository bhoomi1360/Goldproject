export interface LoanScheme {
  id: string;
  name: string;
  annualInterestRate: number;
  interestRateDisplay: string;
  maxLtv: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureDescription: string;
  isActive: boolean;
}

export interface PlanQuote {
  planId: string;
  planName: string;
  annualInterestRate: number;
  interestRateDisplay: string;
  maxLtv: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureDescription: string;
  eligibleLoanRupees: number;
  eligibleLoanPaise: number;
  monthlyEmiRupees?: number;
}

export interface QuoteResponse {
  netWeightGrams: number;
  grossWeightGrams?: number;
  karat: number;
  purityPercentage: number;
  pureGoldGrams: number;
  rate24kPerGram: number;
  goldValueRupees: number;
  goldValuePaise: number;
  quotes: PlanQuote[];
}

export interface LeadSubmissionPayload {
  fullName: string;
  mobileNumber: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: 18 | 22 | 24;
  planId: string;
}

export interface LeadItem {
  id: string;
  fullName: string;
  mobileNumber: string;
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
  pureGoldGrams: number;
  rate24kPerGram: number;
  goldValueRupees: number;
  goldValuePaise: number;
  planId: string;
  planName?: string;
  eligibleLoanRupees: number;
  eligibleLoanPaise: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  reply: string;
  toolCallsExecuted: Array<{
    name: string;
    args: any;
    result: any;
  }>;
  requiresConfirmation?: {
    action: 'submit_application';
    payload: any;
    summary: {
      fullName: string;
      mobileNumber: string;
      netWeightGrams: number;
      grossWeightGrams: number;
      karat: number;
      planName: string;
      eligibleLoan: string;
    };
  };
  applicationId?: string;
  state: any;
}

const API_BASE = '/api/v1';

export async function fetchLoanSchemes(): Promise<LoanScheme[]> {
  const res = await fetch(`${API_BASE}/loan-schemes`);
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data;
}

export async function calculateQuote(payload: {
  grossWeightGrams: number;
  netWeightGrams: number;
  karat: number;
}): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data;
}

export async function submitLeadApplication(
  payload: LeadSubmissionPayload,
  idempotencyKey?: string
): Promise<{ applicationId: string; data: LeadItem }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

export async function fetchLeads(params: {
  planId?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<{ leads: LeadItem[]; total: number }> {
  const query = new URLSearchParams();
  if (params.planId) query.set('planId', params.planId);
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/leads?${query.toString()}`);
  const json = await res.json();
  if (!res.ok) throw json;
  return { leads: json.data, total: json.pagination.total };
}

export async function updateLeadStatus(id: string, status: string, notes?: string): Promise<LeadItem> {
  const res = await fetch(`${API_BASE}/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data;
}

export async function sendChatMessage(
  message: string,
  history: any[] = [],
  state: any = {}
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, state }),
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data;
}

export async function fetchGoldRate(): Promise<any> {
  const res = await fetch(`${API_BASE}/gold-rate`);
  const json = await res.json();
  if (!res.ok) throw json;
  return json.data;
}
