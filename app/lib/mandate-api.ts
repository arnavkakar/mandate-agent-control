export const MANDATE_API_URL =
  process.env.NEXT_PUBLIC_MANDATE_API_URL ??
  "https://mandate-agent-control-production.up.railway.app";

export type Session = {
  token: string;
  user?: { id: string; name: string; email: string };
  organization?: { id: string; name: string; slug: string };
};

export type ApiAgent = {
  id: string;
  name: string;
  purpose: string;
  status: "ACTIVE" | "PAUSED" | "REVOKED";
  createdAt: string;
  spentThisMonthCents: number;
  mandate: MandatePolicy | null;
};

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

export type ApiTransaction = {
  id: string;
  merchant: string;
  category: string;
  country: string;
  currency: string;
  amountCents: number;
  createdAt: string;
  agentId: string;
  agentName: string;
  decisionId: string;
  decision: "APPROVED" | "APPROVAL_REQUIRED" | "DECLINED";
  reasons: string[];
  policyRules: { rule: string; outcome: "PASS" | "REVIEW" | "FAIL"; reason: string }[];
  riskScore: number;
  riskFactors: { code: string; points: number; detail: string }[];
  engineVersion: string;
  approvalRequestId: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED" | null;
};

export type DashboardSummary = {
  period: string;
  authorizedSpendCents: number;
  authorizedBudgetCents: number;
  remainingBudgetCents: number;
  total: number;
  approved: number;
  declined: number;
  review: number;
  highRisk: number;
};

const SESSION_KEY = "mandate.session.v1";

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as Session | null; }
  catch { return null; }
}

export function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

export class MandateApiError extends Error {
  constructor(public status: number, public code: string, public details?: unknown) {
    super(code);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${MANDATE_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new MandateApiError(response.status, String(body.error ?? "REQUEST_FAILED"), body);
  return body as T;
}

export const mandateApi = {
  signup(input: { name: string; email: string; password: string; organizationName: string }) {
    return request<Session>("/v1/auth/signup", { method: "POST", body: JSON.stringify(input) });
  },
  login(input: { email: string; password: string }) {
    return request<Session>("/v1/auth/login", { method: "POST", body: JSON.stringify(input) });
  },
  me(token: string) { return request<Omit<Session, "token">>("/v1/me", {}, token); },
  agents(token: string) { return request<ApiAgent[]>("/v1/agents", {}, token); },
  createAgent(token: string, input: { name: string; purpose: string }) { return request<ApiAgent>("/v1/agents", { method: "POST", body: JSON.stringify(input) }, token); },
  updateAgent(token: string, id: string, input: Partial<Pick<ApiAgent, "name" | "purpose" | "status">>) { return request<ApiAgent>(`/v1/agents/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token); },
  transactions(token: string) { return request<ApiTransaction[]>("/v1/transactions", {}, token); },
  approvals(token: string) { return request<(ApiTransaction & { status: string; expiresAt: string })[]>("/v1/approval-requests", {}, token); },
  dashboard(token: string) { return request<DashboardSummary>("/v1/dashboard", {}, token); },
  auditEvents(token: string) { return request<Record<string, unknown>[]>("/v1/audit-events", {}, token); },
  createKey(token: string, agentId: string, input = { name: "Primary key", scopes: ["authorizations:write"] }) { return request<{ id: string; apiKey: string; prefix: string; warning: string }>(`/v1/agents/${agentId}/keys`, { method: "POST", body: JSON.stringify(input) }, token); },
  createMandate(token: string, agentId: string, input: { userIntent: string; policy: MandatePolicy }) { return request(`/v1/agents/${agentId}/mandates`, { method: "POST", body: JSON.stringify(input) }, token); },
  resolveApproval(token: string, id: string, outcome: "APPROVED" | "DECLINED", note?: string) { return request(`/v1/approval-requests/${id}/resolve`, { method: "POST", body: JSON.stringify({ outcome, note }) }, token); },
};
