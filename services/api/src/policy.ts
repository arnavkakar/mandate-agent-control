import type { AuthorizationInput, PolicyResult, RuleResult } from "./domain.js";

const norm = (value: string) => value.trim().toLowerCase();

export function evaluatePolicy(input: AuthorizationInput): PolicyResult {
  const p = input.policy;
  const rules: RuleResult[] = [];
  const add = (rule: string, outcome: RuleResult["outcome"], reason: string) => rules.push({ rule, outcome, reason });

  add("agent_status", input.agentStatus === "ACTIVE" ? "PASS" : "FAIL", input.agentStatus === "ACTIVE" ? "Agent is active." : `Agent is ${input.agentStatus.toLowerCase()}.`);
  const expired = Boolean(p.expiresAt && new Date(p.expiresAt) <= (input.now ?? new Date()));
  add("mandate_expiration", expired ? "FAIL" : "PASS", expired ? "Mandate has expired." : "Mandate is active.");
  add("positive_amount", input.amountCents > 0 ? "PASS" : "FAIL", input.amountCents > 0 ? "Amount is valid." : "Amount must be positive.");
  add("monthly_budget", input.spentThisMonthCents + input.amountCents <= p.monthlyBudgetCents ? "PASS" : "FAIL", input.spentThisMonthCents + input.amountCents <= p.monthlyBudgetCents ? "Purchase fits the remaining monthly budget." : "Purchase exceeds the remaining monthly budget.");
  add("transaction_limit", input.amountCents <= p.maxTransactionCents ? "PASS" : "FAIL", input.amountCents <= p.maxTransactionCents ? "Amount is within the hard transaction limit." : "Amount exceeds the hard transaction limit.");

  const merchant = norm(input.merchant);
  const category = norm(input.category);
  const country = input.country.trim().toUpperCase();
  const blockedMerchant = p.blockedMerchants.map(norm).includes(merchant);
  const blockedCategory = p.blockedCategories.map(norm).includes(category);
  const categoryAllowed = p.allowedCategories.length === 0 || p.allowedCategories.map(norm).includes(category);
  const merchantAllowed = p.allowedMerchants.length === 0 || p.allowedMerchants.map(norm).includes(merchant);
  const countryAllowed = p.allowedCountries.length === 0 || p.allowedCountries.map(x => x.toUpperCase()).includes(country);
  add("blocked_merchant", blockedMerchant ? "FAIL" : "PASS", blockedMerchant ? "Merchant is explicitly blocked." : "Merchant is not blocked.");
  add("blocked_category", blockedCategory ? "FAIL" : "PASS", blockedCategory ? "Category is explicitly blocked." : "Category is not blocked.");
  add("allowed_category", categoryAllowed ? "PASS" : "FAIL", categoryAllowed ? "Category is permitted." : "Category is outside the mandate.");
  add("allowed_merchant", merchantAllowed ? "PASS" : "FAIL", merchantAllowed ? "Merchant is permitted." : "Merchant is not on the allowlist.");
  add("allowed_country", countryAllowed ? "PASS" : "FAIL", countryAllowed ? "Country is permitted." : "Country is outside the mandate.");

  const approvalReasons: string[] = [];
  if (p.requireApprovalForAll) approvalReasons.push("All transactions require human approval.");
  if (input.amountCents > p.approvalThresholdCents) approvalReasons.push("Amount exceeds the autonomous approval threshold.");
  if (p.requireApprovalForNewMerchant && input.isNewMerchant) approvalReasons.push("Merchant is new for this agent.");
  add("human_approval", approvalReasons.length ? "REVIEW" : "PASS", approvalReasons.join(" ") || "No human approval rule was triggered.");

  const failures = rules.filter(rule => rule.outcome === "FAIL").map(rule => rule.reason);
  if (failures.length) return { decision: "DECLINED", reasons: failures, rules };
  if (approvalReasons.length) return { decision: "APPROVAL_REQUIRED", reasons: approvalReasons, rules };
  return { decision: "APPROVED", reasons: ["All deterministic authorization rules passed."], rules };
}
