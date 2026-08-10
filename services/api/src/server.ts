import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { and, eq, sql as dsql } from "drizzle-orm";
import { z } from "zod";
import { db, sql } from "./db.js";
import { env } from "./env.js";
import { agents, apiKeys, approvalRequests, authorizationDecisions, budgetLedger, mandates, memberships, organizations, transactions, users } from "./schema.js";
import { hashApiKey, hashPassword, issueApiKey, issueToken, verifyPassword, verifyToken } from "./security.js";
import { evaluatePolicy } from "./policy.js";
import { evaluateRisk } from "./risk.js";
import { appendAudit } from "./audit.js";
import type { MandatePolicy } from "./domain.js";

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 64_000 });
await app.register(cors, { origin: env.CORS_ORIGIN.split(","), credentials: true });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

const signupSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(12), organizationName: z.string().min(2) });
const loginSchema = z.object({ email: z.string().email(), password: z.string() });
const authRequestSchema = z.object({ idempotencyKey: z.string().min(8).max(128), amount: z.number().positive().max(10_000_000), currency: z.string().length(3).default("USD"), merchant: z.string().min(1).max(160), category: z.string().min(1).max(80), country: z.string().length(2), metadata: z.record(z.string(), z.unknown()).default({}) });

async function human(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  return verifyToken(header.slice(7));
}

app.get("/health", async () => ({ ok: true, service: "mandate-api", version: "1.0.0" }));
app.post("/v1/auth/signup", async (request, reply) => {
  const input = signupSchema.parse(request.body);
  const slug = `${input.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
  const result = await db.transaction(async tx => {
    const [org] = await tx.insert(organizations).values({ name: input.organizationName, slug }).returning();
    const [user] = await tx.insert(users).values({ email: input.email.toLowerCase(), name: input.name, passwordHash: await hashPassword(input.password) }).returning();
    await tx.insert(memberships).values({ organizationId: org.id, userId: user.id, role: "owner" });
    await appendAudit(tx, { organizationId: org.id, eventType: "ORGANIZATION_CREATED", actorType: "USER", actorId: user.id, subjectType: "ORGANIZATION", subjectId: org.id, payload: { name: org.name } });
    return { org, user };
  });
  return reply.code(201).send({ token: await issueToken(result.user.id, result.org.id), user: { id: result.user.id, name: result.user.name, email: result.user.email }, organization: result.org });
});
app.post("/v1/auth/login", async (request, reply) => {
  const input = loginSchema.parse(request.body);
  const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1);
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
  const [membership] = await db.select().from(memberships).where(eq(memberships.userId, user.id)).limit(1);
  return { token: await issueToken(user.id, membership.organizationId) };
});
app.get("/v1/agents", async request => { const auth = await human(request); return db.select().from(agents).where(eq(agents.organizationId, auth.organizationId)); });
app.post("/v1/agents", async (request, reply) => {
  const auth = await human(request); const input = z.object({ name: z.string().min(2), purpose: z.string().min(3) }).parse(request.body);
  const [agent] = await db.insert(agents).values({ organizationId: auth.organizationId, ...input }).returning();
  return reply.code(201).send(agent);
});
app.patch("/v1/agents/:id", async (request, reply) => {
  const auth = await human(request); const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const input = z.object({ status: z.enum(["ACTIVE", "PAUSED", "REVOKED"]).optional(), name: z.string().min(2).optional(), purpose: z.string().min(3).optional() }).refine(value => Object.keys(value).length > 0).parse(request.body);
  const [agent] = await db.update(agents).set(input).where(and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId))).returning();
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  return agent;
});
app.post("/v1/agents/:id/keys", async (request, reply) => {
  const auth = await human(request); const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const [agent] = await db.select().from(agents).where(and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId))).limit(1);
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  const input = z.object({ name: z.string().min(2), scopes: z.array(z.enum(["authorizations:write", "decisions:read"])).min(1) }).parse(request.body); const issued = issueApiKey();
  const [record] = await db.insert(apiKeys).values({ organizationId: auth.organizationId, agentId: agent.id, name: input.name, scopes: input.scopes, prefix: issued.prefix, keyHash: issued.hash }).returning();
  return reply.code(201).send({ id: record.id, apiKey: issued.key, prefix: issued.prefix, warning: "Copy this key now. It will not be shown again." });
});
app.post("/v1/agents/:id/mandates", async (request, reply) => {
  const auth = await human(request); const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const input = z.object({ userIntent: z.string().min(10), policy: z.custom<MandatePolicy>() }).parse(request.body);
  const [current] = await db.select({ version: mandates.version }).from(mandates).where(eq(mandates.agentId, id)).orderBy(dsql`${mandates.version} desc`).limit(1);
  await db.update(mandates).set({ active: false }).where(eq(mandates.agentId, id));
  const [mandate] = await db.insert(mandates).values({ organizationId: auth.organizationId, agentId: id, version: (current?.version ?? 0) + 1, userIntent: input.userIntent, policy: input.policy, createdBy: auth.userId }).returning();
  return reply.code(201).send(mandate);
});
app.post("/v1/authorization-requests", async (request, reply) => {
  const rawKey = String(request.headers["x-mandate-key"] ?? ""); const [key] = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, hashApiKey(rawKey)), dsql`${apiKeys.revokedAt} is null`)).limit(1);
  if (!key || !key.scopes.includes("authorizations:write")) return reply.code(401).send({ error: "INVALID_API_KEY" });
  const input = authRequestSchema.parse(request.body); const amountCents = Math.round(input.amount * 100);
  try {
    const output = await db.transaction(async tx => {
      await tx.execute(dsql`select pg_advisory_xact_lock(hashtext(${key.agentId}))`);
      const [existing] = await tx.select().from(transactions).where(and(eq(transactions.agentId, key.agentId), eq(transactions.idempotencyKey, input.idempotencyKey))).limit(1);
      if (existing) { const [decision] = await tx.select().from(authorizationDecisions).where(eq(authorizationDecisions.transactionId, existing.id)).limit(1); return { transaction: existing, decision, replayed: true }; }
      const [agent] = await tx.select().from(agents).where(eq(agents.id, key.agentId)).limit(1); const [mandate] = await tx.select().from(mandates).where(and(eq(mandates.agentId, key.agentId), eq(mandates.active, true))).orderBy(dsql`${mandates.version} desc`).limit(1);
      if (!agent || !mandate) throw new Error("NO_ACTIVE_MANDATE");
      const period = new Date().toISOString().slice(0, 7); const [spend] = await tx.select({ total: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)` }).from(budgetLedger).where(and(eq(budgetLedger.agentId, agent.id), eq(budgetLedger.period, period)));
      const [history] = await tx.select({ count: dsql<number>`count(*)`, average: dsql<number>`coalesce(avg(${transactions.amountCents}), 0)` }).from(transactions).where(eq(transactions.agentId, agent.id));
      const [known] = await tx.select({ count: dsql<number>`count(*)` }).from(transactions).where(and(eq(transactions.agentId, agent.id), dsql`lower(${transactions.merchant}) = lower(${input.merchant})`));
      const [velocity] = await tx.select({ count: dsql<number>`count(*)` }).from(transactions).where(and(eq(transactions.agentId, agent.id), dsql`${transactions.createdAt} > now() - interval '1 hour'`));
      const evaluationInput = { agentStatus: agent.status, amountCents, merchant: input.merchant, category: input.category, country: input.country, isNewMerchant: Number(known.count) === 0, spentThisMonthCents: Number(spend.total), transactionCountLastHour: Number(velocity.count), averageTransactionCents: Number(history.average), policy: mandate.policy };
      const policy = evaluatePolicy(evaluationInput); const risk = evaluateRisk(evaluationInput);
      const [transaction] = await tx.insert(transactions).values({ organizationId: key.organizationId, agentId: key.agentId, idempotencyKey: input.idempotencyKey, amountCents, merchant: input.merchant, category: input.category, country: input.country.toUpperCase(), currency: input.currency.toUpperCase(), metadata: input.metadata }).returning();
      const [decision] = await tx.insert(authorizationDecisions).values({ organizationId: key.organizationId, transactionId: transaction.id, mandateId: mandate.id, decision: policy.decision, policyRules: policy.rules, reasons: policy.reasons, riskScore: risk.score, riskFactors: risk.factors, engineVersion: "policy-v1.0.0" }).returning();
      if (policy.decision === "APPROVED") await tx.insert(budgetLedger).values({ organizationId: key.organizationId, agentId: key.agentId, transactionId: transaction.id, amountCents, kind: "AUTHORIZED", period });
      if (policy.decision === "APPROVAL_REQUIRED") await tx.insert(approvalRequests).values({ organizationId: key.organizationId, decisionId: decision.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
      await appendAudit(tx, { organizationId: key.organizationId, eventType: "AUTHORIZATION_DECIDED", actorType: "AGENT", actorId: key.agentId, subjectType: "TRANSACTION", subjectId: transaction.id, payload: { decision: policy.decision, reasons: policy.reasons, risk } });
      return { transaction, decision, replayed: false };
    });
    return reply.code(output.replayed ? 200 : 201).send(output);
  } catch (error) { if (error instanceof Error && error.message === "NO_ACTIVE_MANDATE") return reply.code(409).send({ error: "NO_ACTIVE_MANDATE" }); throw error; }
});
app.post("/v1/approval-requests/:id/resolve", async (request, reply) => {
  const auth = await human(request); const { id } = z.object({ id: z.string().uuid() }).parse(request.params); const input = z.object({ outcome: z.enum(["APPROVED", "DECLINED"]), note: z.string().max(500).optional() }).parse(request.body);
  const result = await db.transaction(async tx => {
    const [approval] = await tx.select().from(approvalRequests).where(and(eq(approvalRequests.id, id), eq(approvalRequests.organizationId, auth.organizationId))).limit(1);
    if (!approval || approval.status !== "PENDING" || approval.expiresAt <= new Date()) return null;
    const [decision] = await tx.select().from(authorizationDecisions).where(eq(authorizationDecisions.id, approval.decisionId)).limit(1);
    const [transaction] = await tx.select().from(transactions).where(eq(transactions.id, decision.transactionId)).limit(1);
    if (input.outcome === "APPROVED") {
      const [mandate] = await tx.select().from(mandates).where(eq(mandates.id, decision.mandateId)).limit(1); const period = new Date().toISOString().slice(0, 7);
      await tx.execute(dsql`select pg_advisory_xact_lock(hashtext(${transaction.agentId}))`);
      const [spend] = await tx.select({ total: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)` }).from(budgetLedger).where(and(eq(budgetLedger.agentId, transaction.agentId), eq(budgetLedger.period, period)));
      if (Number(spend.total) + transaction.amountCents > mandate.policy.monthlyBudgetCents) throw Object.assign(new Error("Budget changed while awaiting approval"), { statusCode: 409, code: "BUDGET_EXCEEDED" });
      await tx.insert(budgetLedger).values({ organizationId: auth.organizationId, agentId: transaction.agentId, transactionId: transaction.id, amountCents: transaction.amountCents, kind: "HUMAN_AUTHORIZED", period });
    }
    const [resolved] = await tx.update(approvalRequests).set({ status: input.outcome, resolvedBy: auth.userId, resolutionNote: input.note, resolvedAt: new Date() }).where(eq(approvalRequests.id, id)).returning();
    await appendAudit(tx, { organizationId: auth.organizationId, eventType: "APPROVAL_RESOLVED", actorType: "USER", actorId: auth.userId, subjectType: "APPROVAL_REQUEST", subjectId: id, payload: { outcome: input.outcome, note: input.note ?? null } });
    return resolved;
  });
  if (!result) return reply.code(409).send({ error: "APPROVAL_NOT_PENDING" });
  return result;
});

app.setErrorHandler((error: unknown, _request, reply) => { if (error instanceof z.ZodError) return reply.code(400).send({ error: "INVALID_REQUEST", issues: error.issues }); app.log.error(error); const failure = error as { statusCode?: number; name?: string }; return reply.code(failure.statusCode ?? 500).send({ error: failure.statusCode ? failure.name : "INTERNAL_ERROR" }); });

await app.listen({ port: env.PORT, host: "0.0.0.0" });
process.on("SIGTERM", async () => { await app.close(); await sql.end(); });
