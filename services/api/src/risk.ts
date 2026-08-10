import type { AuthorizationInput, RiskResult } from "./domain.js";

export function evaluateRisk(input: AuthorizationInput): RiskResult {
  const factors: RiskResult["factors"] = [];
  if (input.averageTransactionCents > 0 && input.amountCents >= input.averageTransactionCents * 3) factors.push({ code: "AMOUNT_ANOMALY", points: 30, detail: "Amount is at least 3× the agent's historical average." });
  if (input.isNewMerchant) factors.push({ code: "NEW_MERCHANT", points: 20, detail: "Merchant has no prior approved history for this agent." });
  if (input.policy.allowedCategories.length > 0 && !input.policy.allowedCategories.map(x => x.toLowerCase()).includes(input.category.toLowerCase())) factors.push({ code: "CATEGORY_MISMATCH", points: 25, detail: "Category is outside the policy allowlist." });
  if (input.transactionCountLastHour >= 5) factors.push({ code: "ABNORMAL_VELOCITY", points: 20, detail: "Five or more requests were submitted in the last hour." });
  if (input.policy.allowedCountries.length > 0 && !input.policy.allowedCountries.map(x => x.toUpperCase()).includes(input.country.toUpperCase())) factors.push({ code: "GEOGRAPHY_MISMATCH", points: 25, detail: "Transaction country is outside the policy allowlist." });
  return { score: Math.min(100, factors.reduce((sum, factor) => sum + factor.points, 0)), factors };
}
