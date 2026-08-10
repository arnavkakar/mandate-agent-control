import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePolicy } from "../src/policy.js";
import { evaluateRisk } from "../src/risk.js";
import type { AuthorizationInput } from "../src/domain.js";

const base: AuthorizationInput = { agentStatus: "ACTIVE", amountCents: 9600, merchant: "Notion", category: "Software", country: "US", isNewMerchant: false, spentThisMonthCents: 20_000, transactionCountLastHour: 1, averageTransactionCents: 10_000, policy: { monthlyBudgetCents: 200_000, maxTransactionCents: 100_000, approvalThresholdCents: 25_000, allowedCategories: ["Software", "Office equipment"], blockedCategories: ["Crypto", "Gambling"], allowedMerchants: [], blockedMerchants: [], allowedCountries: ["US"], requireApprovalForNewMerchant: true, requireApprovalForAll: false, expiresAt: null } };

test("approves a purchase when every deterministic rule passes", () => assert.equal(evaluatePolicy(base).decision, "APPROVED"));
test("requires review above the autonomous threshold", () => assert.equal(evaluatePolicy({ ...base, amountCents: 30_000 }).decision, "APPROVAL_REQUIRED"));
test("declines blocked categories before approval rules", () => assert.equal(evaluatePolicy({ ...base, amountCents: 30_000, category: "Crypto" }).decision, "DECLINED"));
test("declines paused agents", () => assert.equal(evaluatePolicy({ ...base, agentStatus: "PAUSED" }).decision, "DECLINED"));
test("scores risk factors deterministically and caps at 100", () => { const risk = evaluateRisk({ ...base, amountCents: 100_000, isNewMerchant: true, category: "Crypto", country: "GB", transactionCountLastHour: 8 }); assert.equal(risk.score, 100); assert.equal(risk.factors.length, 5); });
