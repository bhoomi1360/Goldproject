import { quoteService } from './quoteService.js';
import { leadService } from './leadService.js';
import { QuoteRequestSchema, LeadRequestSchema } from '../validation/schemas.js';
import { maskMobileNumber } from '../utils/mask.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, any>;
  };
  toolResult?: any;
}

export interface ChatSessionState {
  pendingConfirmationPayload?: any;
  collectedDetails?: {
    fullName?: string;
    mobileNumber?: string;
    grossWeightGrams?: number;
    netWeightGrams?: number;
    karat?: 18 | 22 | 24;
    planId?: string;
  };
}

export interface AgentResponse {
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
  state: ChatSessionState;
}

export class AgentService {
  public async toolGetLoanSchemes() {
    const schemes = quoteService.getActiveLoanSchemes();
    return schemes.map((s) => ({
      id: s.id,
      name: s.name,
      annualInterestRate: `${(s.annual_interest_rate * 100).toFixed(1)}%`,
      maxLtv: `${Math.round(s.max_ltv * 100)}%`,
      tenure: s.tenure_description,
    }));
  }

  public async toolCalculateQuote(args: {
    netWeightGrams: number;
    grossWeightGrams: number;
    karat: 18 | 22 | 24;
  }) {
    const validation = QuoteRequestSchema.safeParse({
      netWeightGrams: Number(args.netWeightGrams),
      grossWeightGrams: Number(args.grossWeightGrams ?? args.netWeightGrams),
      karat: Number(args.karat) as any,
    });

    if (!validation.success) {
      return {
        isError: true,
        error: validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    const quote = quoteService.calculateQuotes(validation.data);
    return {
      pureGoldGrams: quote.pureGoldGrams,
      rate24kPerGram: quote.rate24kPerGram,
      goldValueRupees: quote.goldValueRupees,
      quotes: quote.quotes.map((q) => ({
        planId: q.planId,
        planName: q.planName,
        interestRate: q.interestRateDisplay,
        maxLtv: `${q.maxLtvPercent}%`,
        eligibleLoanRupees: q.eligibleLoanRupees,
        monthlyEmiRupees: q.monthlyEmiRupees,
      })),
    };
  }

  public async toolSubmitApplication(payload: any) {
    const validation = LeadRequestSchema.safeParse(payload);
    if (!validation.success) {
      return {
        isError: true,
        error: validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }

    try {
      const result = leadService.submitLead(validation.data);
      return {
        success: true,
        applicationId: result.id,
        status: result.status,
        eligibleLoanRupees: result.eligibleLoanRupees,
        planName: result.planName,
      };
    } catch (err: any) {
      return {
        isError: true,
        code: err.code || 'SUBMISSION_FAILED',
        message: err.message,
        existingApplicationId: err.existingApplicationId,
      };
    }
  }

  public async toolCheckExistingApplication(mobile: string) {
    const existing = leadService.checkDuplicateLead(mobile);
    if (existing) {
      return {
        hasExistingApplication: true,
        applicationId: existing.id,
        appliedDate: existing.createdAt,
      };
    }
    return { hasExistingApplication: false };
  }

  public async processMessage(
    userMessage: string,
    history: ChatMessage[] = [],
    currentState: ChatSessionState = {}
  ): Promise<AgentResponse> {
    const text = userMessage.trim();
    const lower = text.toLowerCase();
    const toolCallsExecuted: AgentResponse['toolCallsExecuted'] = [];

    const state: ChatSessionState = {
      collectedDetails: { ...(currentState.collectedDetails || {}) },
      pendingConfirmationPayload: currentState.pendingConfirmationPayload,
    };

    // 1. Check pending confirmation first before any slot processing!
    if (state.pendingConfirmationPayload) {
      const isAffirmative =
        lower === 'yes' ||
        lower === 'confirm' ||
        lower === 'proceed' ||
        lower.startsWith('yes') ||
        lower.includes('confirm') ||
        lower.includes('submit');

      const isNegative =
        lower === 'no' ||
        lower.includes('cancel') ||
        lower.includes('stop') ||
        lower.includes('abort');

      if (isAffirmative) {
        const payload = state.pendingConfirmationPayload;
        state.pendingConfirmationPayload = undefined;

        const submitResult = await this.toolSubmitApplication(payload);
        toolCallsExecuted.push({
          name: 'submit_application',
          args: { ...payload, mobileNumber: maskMobileNumber(payload.mobileNumber) },
          result: submitResult,
        });

        if (submitResult.isError) {
          if (submitResult.code === 'DUPLICATE_APPLICATION') {
            return {
              reply: `You already applied recently (Application ID: ${submitResult.existingApplicationId}). A borrower can only submit one active application every 7 days.`,
              toolCallsExecuted,
              state,
            };
          }
          return {
            reply: `Could not submit your application: ${submitResult.message}`,
            toolCallsExecuted,
            state,
          };
        }

        return {
          reply: `🎉 Congratulations! Your gold loan application has been submitted successfully with Application ID **${submitResult.applicationId}** for an eligible loan of **₹${submitResult.eligibleLoanRupees?.toLocaleString('en-IN')}** under the **${submitResult.planName}** plan. A field agent will contact you shortly.`,
          toolCallsExecuted,
          applicationId: submitResult.applicationId,
          state,
        };
      } else if (isNegative) {
        state.pendingConfirmationPayload = undefined;
        return {
          reply: 'Application submission cancelled. Let me know if you would like to change any details or test other schemes.',
          toolCallsExecuted,
          state,
        };
      }
    }

    // 2. Guardrails Check: Adversarial prompt injection, investment advice & off-topic
    if (lower.includes('ignore all previous') || lower.includes('system prompt') || lower.includes('jailbreak') || lower.includes('bypass')) {
      return {
        reply: "I am a Gold Loan Assistant. I strictly follow regulatory lending rules and gold loan evaluation criteria. Please share your gold jewellery weight and purity to receive a loan calculation.",
        toolCallsExecuted,
        state,
      };
    }

    const investmentKeywords = ['crypto', 'bitcoin', 'mutual fund', 'stock', 'share market', 'invest advice', 'invest in gold'];
    if (investmentKeywords.some((k) => lower.includes(k))) {
      return {
        reply: "I am a Gold Loan Assistant. I do not provide investment, financial, or market advice. However, if you are looking to unlock cash by pledging your gold jewellery, I can help calculate your loan eligibility!",
        toolCallsExecuted,
        state,
      };
    }

    const offTopicKeywords = ['weather', 'recipe', 'who is president', 'write a poem', 'joke', 'movie', 'football', 'capital of'];
    if (offTopicKeywords.some((k) => lower.includes(k))) {
      return {
        reply: "I can only assist with Gold Loan inquiries, eligibility quotes, and loan applications. How can I help with your gold loan today?",
        toolCallsExecuted,
        state,
      };
    }

    // 3. Robust Slot Extraction
    // Karat extraction
    const karatMatch = lower.match(/\b(18|22|24)\s*(?:k|kt|carat|karat)?\b/);
    if (karatMatch) {
      state.collectedDetails!.karat = parseInt(karatMatch[1], 10) as 18 | 22 | 24;
    }

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
    } else {
      // General weight: e.g. "45 grams of 22 carat", "30 grams"
      const genericWeight = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|grams|gram)\b/);
      if (genericWeight && !state.collectedDetails!.netWeightGrams) {
        state.collectedDetails!.netWeightGrams = parseFloat(genericWeight[1]);
      }
    }

    // Default gross to net if gross not separately specified
    if (state.collectedDetails!.netWeightGrams && !state.collectedDetails!.grossWeightGrams) {
      state.collectedDetails!.grossWeightGrams = state.collectedDetails!.netWeightGrams;
    }

    // Mobile extraction
    const mobileMatch = text.match(/\b([6-9]\d{9})\b/);
    if (mobileMatch) {
      state.collectedDetails!.mobileNumber = mobileMatch[1];
    }

    // Full name extraction
    const nameMatch =
      text.match(/(?:my name is|name[:\s]+)\s*([a-zA-Z\s]{2,40})/i) ||
      text.match(/name is\s*([a-zA-Z\s]{2,40})/i);
    if (nameMatch) {
      // Cut off at comma, period, or "mobile"
      let parsedName = nameMatch[1].split(/,|;|\bmobile\b|\bphone\b/i)[0].trim();
      state.collectedDetails!.fullName = parsedName;
    }

    // Scheme selection
    if (lower.includes('bullet')) {
      state.collectedDetails!.planId = 'PLAN_BULLET_01';
    } else if (lower.includes('emi')) {
      state.collectedDetails!.planId = 'PLAN_EMI_01';
    }

    const { netWeightGrams, grossWeightGrams, karat, mobileNumber, fullName, planId } =
      state.collectedDetails!;

    // 4. Validate net <= gross constraint
    if (netWeightGrams && grossWeightGrams && netWeightGrams > grossWeightGrams) {
      return {
        reply: `Net weight (${netWeightGrams}g) cannot be greater than gross weight (${grossWeightGrams}g). Please verify and provide the correct weights.`,
        toolCallsExecuted,
        state,
      };
    }

    // 5. Check duplicate mobile check tool if mobile is available
    if (mobileNumber) {
      const existingCheck = await this.toolCheckExistingApplication(mobileNumber);
      toolCallsExecuted.push({
        name: 'check_existing_application',
        args: { mobile: maskMobileNumber(mobileNumber) },
        result: existingCheck,
      });

      if (existingCheck.hasExistingApplication) {
        return {
          reply: `You already applied recently (Application ID: ${existingCheck.applicationId}). Our policy allows one application per mobile number every 7 days.`,
          toolCallsExecuted,
          state,
        };
      }
    }

    // 6. Calculate Quote via Tool if we have net weight & karat
    let quoteResult: any = null;
    if (netWeightGrams && karat) {
      quoteResult = await this.toolCalculateQuote({
        netWeightGrams,
        grossWeightGrams: grossWeightGrams || netWeightGrams,
        karat,
      });

      toolCallsExecuted.push({
        name: 'calculate_quote',
        args: {
          netWeightGrams,
          grossWeightGrams: grossWeightGrams || netWeightGrams,
          karat,
        },
        result: quoteResult,
      });

      if (quoteResult.isError) {
        const errorMsg = quoteResult.error.map((e: any) => e.message).join(', ');
        return {
          reply: `There was an issue with the gold details: ${errorMsg}. Please provide valid details.`,
          toolCallsExecuted,
          state,
        };
      }
    }

    // 7. If asking for schemes explicitly (without applying)
    const isAskingForSchemes =
      (lower.includes('what schemes') ||
        lower.includes('list schemes') ||
        lower.includes('available schemes') ||
        lower.includes('what plans') ||
        lower.includes('tell me schemes') ||
        lower.includes('interest rates')) &&
      !fullName &&
      !mobileNumber;

    if (isAskingForSchemes) {
      const schemes = await this.toolGetLoanSchemes();
      toolCallsExecuted.push({
        name: 'get_loan_schemes',
        args: {},
        result: schemes,
      });

      const schemeList = schemes
        .map(
          (s) =>
            `• **${s.name}** (${s.id}): Max LTV ${s.maxLtv}, Interest ${s.annualInterestRate} p.a., Tenure: ${s.tenure}`
        )
        .join('\n');

      return {
        reply: `Here are our active loan schemes:\n${schemeList}\n\nTell me the weight (in grams) and karat (18K, 22K, or 24K) of your jewellery to get a live quote!`,
        toolCallsExecuted,
        state,
      };
    }

    // 8. Application Intent Flow
    const hasApplyIntent =
      lower.includes('apply') ||
      lower.includes('submit') ||
      lower.includes('file') ||
      Boolean(fullName && mobileNumber);

    if (hasApplyIntent && quoteResult) {
      if (!fullName) {
        return {
          reply: `Great! For ${netWeightGrams}g of ${karat}K gold, your gold value is **₹${quoteResult.goldValueRupees?.toLocaleString('en-IN')}**.\n\nTo file your application, please provide your **Full Name**.`,
          toolCallsExecuted,
          state,
        };
      }

      if (!mobileNumber) {
        return {
          reply: `Thank you, ${fullName}. Please provide your **10-digit mobile number** (starting with 6-9) to proceed.`,
          toolCallsExecuted,
          state,
        };
      }

      const selectedPlanId = planId || 'PLAN_EMI_01';
      const selectedPlan =
        quoteResult.quotes.find((q: any) => q.planId === selectedPlanId) || quoteResult.quotes[0];

      const payloadToConfirm = {
        fullName,
        mobileNumber,
        grossWeightGrams: grossWeightGrams || netWeightGrams,
        netWeightGrams,
        karat,
        planId: selectedPlan.planId,
      };

      state.pendingConfirmationPayload = payloadToConfirm;

      return {
        reply:
          `Please review your gold loan summary before submitting:\n\n` +
          `• **Borrower Name**: ${fullName}\n` +
          `• **Mobile**: ${maskMobileNumber(mobileNumber)}\n` +
          `• **Gold Purity**: ${karat}K (${quoteResult.pureGoldGrams}g pure gold)\n` +
          `• **Net / Gross Weight**: ${netWeightGrams}g / ${grossWeightGrams || netWeightGrams}g\n` +
          `• **Market Value**: ₹${quoteResult.goldValueRupees?.toLocaleString('en-IN')}\n` +
          `• **Selected Scheme**: ${selectedPlan.planName} (${selectedPlan.interestRate} p.a., Max LTV ${selectedPlan.maxLtv})\n` +
          `• **Eligible Loan Amount**: ₹${selectedPlan.eligibleLoanRupees?.toLocaleString('en-IN')}\n\n` +
          `Would you like to confirm and submit this application? (Type **yes** or **confirm**)`,
        toolCallsExecuted,
        requiresConfirmation: {
          action: 'submit_application',
          payload: payloadToConfirm,
          summary: {
            fullName,
            mobileNumber: maskMobileNumber(mobileNumber),
            netWeightGrams: netWeightGrams!,
            grossWeightGrams: grossWeightGrams || netWeightGrams!,
            karat: karat!,
            planName: selectedPlan.planName,
            eligibleLoan: `₹${selectedPlan.eligibleLoanRupees?.toLocaleString('en-IN')}`,
          },
        },
        state,
      };
    }

    // 9. If quote calculated but not applying yet
    if (quoteResult) {
      const quotesText = quoteResult.quotes
        .map(
          (q: any) =>
            `• **${q.planName}**: Eligible Loan **₹${q.eligibleLoanRupees.toLocaleString('en-IN')}** (${q.maxLtv} LTV, ${q.interestRate} p.a.)`
        )
        .join('\n');

      return {
        reply:
          `Based on **${netWeightGrams}g** of **${karat}K gold** (pure gold: **${quoteResult.pureGoldGrams}g** at ₹${quoteResult.rate24kPerGram}/g 24K rate, market value ₹${quoteResult.goldValueRupees.toLocaleString('en-IN')}):\n\n` +
          `${quotesText}\n\n` +
          `Would you like to apply for this loan? Just say "I'd like to apply" along with your name and 10-digit mobile number!`,
        toolCallsExecuted,
        state,
      };
    }

    // 10. Missing weight or karat prompts
    if (!netWeightGrams && !karat) {
      return {
        reply:
          "Hello! I am your AI Gold Loan Assistant. Please share the weight of your gold jewellery (in grams) and its purity (18K, 22K, or 24K) to get an instant calculation.",
        toolCallsExecuted,
        state,
      };
    }

    if (!karat) {
      return {
        reply: `You mentioned ${netWeightGrams} grams of gold. What is the purity or karat of the gold (18K, 22K, or 24K)?`,
        toolCallsExecuted,
        state,
      };
    }

    if (!netWeightGrams) {
      return {
        reply: `You mentioned ${karat}K purity. How many grams of gold jewellery do you have?`,
        toolCallsExecuted,
        state,
      };
    }

    return {
      reply: "How else can I assist you with your gold loan application?",
      toolCallsExecuted,
      state,
    };
  }
}

export const agentService = new AgentService();
