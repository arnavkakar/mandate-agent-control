export const decisions = ["APPROVED", "APPROVAL_REQUIRED", "DECLINED"] as const;
export type Decision = (typeof decisions)[number];

export type MandatePolicy = {
  monthlyBudgetCents: number;
  maxTransactionCents: number;
  approvalThresholdCents: number;
  allowedCategories: string[];
  blockedCategories: string[];
  allowedMerchants: string[];
  blockedMerchants: string[];
  allowedCountries: string[];
  requireApprovalForNewMerchant: boolean;
  requireApprovalForAll: boolean;
  expiresAt: string | null;
};

export type AuthorizationInput = {
  agentStatus: "ACTIVE" | "PAUSED" | "REVOKED";
  amountCents: number;
  merchant: string;
  category: string;
  country: string;
  isNewMerchant: boolean;
  spentThisMonthCents: number;
  transactionCountLastHour: number;
  averageTransactionCents: number;
  policy: MandatePolicy;
  now?: Date;
};

export type RuleResult = { rule: string; outcome: "PASS" | "REVIEW" | "FAIL"; reason: string };
export type PolicyResult = { decision: Decision; reasons: string[]; rules: RuleResult[] };
export type RiskResult = { score: number; factors: { code: string; points: number; detail: string }[] };
