import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { and, desc, eq, sql as dsql } from "drizzle-orm";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db, sql } from "./db.js";
import { env } from "./env.js";
import {
  agents,
  apiKeys,
  approvalRequests,
  auditEvents,
  authAccounts,
  authorizationDecisions,
  budgetLedger,
  mandates,
  memberships,
  organizations,
  transactions,
  users,
} from "./schema.js";
import {
  hashApiKey,
  hashPassword,
  issueApiKey,
  issueToken,
  verifyPassword,
  verifyToken,
} from "./security.js";
import { evaluatePolicy } from "./policy.js";
import { evaluateRisk } from "./risk.js";
import { appendAudit, verifyAuditChain } from "./audit.js";
import {
  interpretMandate,
  mandatePolicySchema,
} from "./mandate-interpreter.js";
import type { MandatePolicy } from "./domain.js";

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 64_000 });
await app.register(cors, {
  origin: env.CORS_ORIGIN.split(",").map((value) => value.trim()),
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PATCH", "DELETE", "OPTIONS"],
});
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(12).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
  organizationName: z.string().min(2),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
const googleSchema = z.object({ credential: z.string().min(100) });
const authRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(128),
  amount: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default("USD"),
  merchant: z.string().min(1).max(160),
  category: z.string().min(1).max(80),
  country: z.string().length(2),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

async function human(request: FastifyRequest) {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer "))
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  try {
    return await verifyToken(header.slice(7));
  } catch {
    throw Object.assign(new Error("Session expired or invalid"), {
      statusCode: 401,
      code: "SESSION_EXPIRED",
    });
  }
}

app.get("/health", async () => ({
  ok: true,
  service: "mandate-api",
  version: "1.0.0",
}));
app.get("/", async () => ({
  name: "Mandate Authorization API",
  status: "operational",
  version: "1.0.0",
  documentation:
    "https://github.com/arnavkakar/mandate-agent-control#api-quick-start",
  health: "/health",
  authorizationEndpoint: "/v1/authorization-requests",
  notice:
    "Simulated authorization and risk controls only. No payments are processed.",
}));
app.get("/v1/auth/google/config", async () => ({
  enabled: Boolean(env.GOOGLE_CLIENT_ID),
  clientId: env.GOOGLE_CLIENT_ID ?? null,
}));
app.post("/v1/auth/google", async (request, reply) => {
  if (!env.GOOGLE_CLIENT_ID)
    return reply.code(503).send({ error: "GOOGLE_AUTH_NOT_CONFIGURED" });
  const origin = request.headers.origin;
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((value) =>
    value.trim(),
  );
  if (origin && !allowedOrigins.includes(origin))
    return reply.code(403).send({ error: "ORIGIN_NOT_ALLOWED" });
  const { credential } = googleSchema.parse(request.body);
  let payload;
  try {
    ({ payload } = await jwtVerify(credential, googleKeys, {
      audience: env.GOOGLE_CLIENT_ID,
      issuer: ["https://accounts.google.com", "accounts.google.com"],
    }));
  } catch {
    return reply.code(401).send({ error: "INVALID_GOOGLE_CREDENTIAL" });
  }
  const subject = typeof payload.sub === "string" ? payload.sub : "";
  const email =
    typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const name =
    typeof payload.name === "string"
      ? payload.name.trim()
      : email.split("@")[0];
  if (!subject || !email || payload.email_verified !== true)
    return reply.code(401).send({ error: "UNVERIFIED_GOOGLE_ACCOUNT" });

  const result = await db
    .transaction(async (tx) => {
      const [linked] = await tx
        .select({ user: users })
        .from(authAccounts)
        .innerJoin(users, eq(users.id, authAccounts.userId))
        .where(
          and(
            eq(authAccounts.provider, "google"),
            eq(authAccounts.providerSubject, subject),
          ),
        )
        .limit(1);
      let user = linked?.user;
      if (!user) {
        const [existing] = await tx
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existing) {
          const googleControlsEmail =
            email.endsWith("@gmail.com") || typeof payload.hd === "string";
          if (!googleControlsEmail)
            throw Object.assign(
              new Error("Account linking requires password confirmation"),
              { code: "ACCOUNT_LINKING_REQUIRED" },
            );
          user = existing;
        } else {
          [user] = await tx
            .insert(users)
            .values({ email, name: name || "Mandate user", passwordHash: null })
            .returning();
        }
        await tx
          .insert(authAccounts)
          .values({
            userId: user.id,
            provider: "google",
            providerSubject: subject,
          });
      }
      let [membership] = await tx
        .select()
        .from(memberships)
        .where(eq(memberships.userId, user.id))
        .limit(1);
      let organization;
      if (!membership) {
        const organizationName = `${user.name}'s Workspace`;
        const slug = `${
          user.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "workspace"
        }-${Date.now().toString(36)}`;
        [organization] = await tx
          .insert(organizations)
          .values({ name: organizationName, slug })
          .returning();
        [membership] = await tx
          .insert(memberships)
          .values({
            organizationId: organization.id,
            userId: user.id,
            role: "owner",
          })
          .returning();
        await appendAudit(tx, {
          organizationId: organization.id,
          eventType: "ORGANIZATION_CREATED",
          actorType: "USER",
          actorId: user.id,
          subjectType: "ORGANIZATION",
          subjectId: organization.id,
          payload: { name: organization.name, identityProvider: "google" },
        });
      } else {
        [organization] = await tx
          .select()
          .from(organizations)
          .where(eq(organizations.id, membership.organizationId))
          .limit(1);
      }
      if (!organization) throw new Error("Workspace not found");
      return { user, organization };
    })
    .catch((error) => {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ACCOUNT_LINKING_REQUIRED"
      )
        return null;
      throw error;
    });
  if (!result)
    return reply.code(409).send({ error: "ACCOUNT_LINKING_REQUIRED" });
  return {
    token: await issueToken(result.user.id, result.organization.id),
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },
    organization: result.organization,
  };
});
app.post("/v1/auth/signup", async (request, reply) => {
  const input = signupSchema.parse(request.body);
  const slug = `${input.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
  const result = await db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organizations)
      .values({ name: input.organizationName, slug })
      .returning();
    const [user] = await tx
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: await hashPassword(input.password),
      })
      .returning();
    await tx
      .insert(memberships)
      .values({ organizationId: org.id, userId: user.id, role: "owner" });
    await appendAudit(tx, {
      organizationId: org.id,
      eventType: "ORGANIZATION_CREATED",
      actorType: "USER",
      actorId: user.id,
      subjectType: "ORGANIZATION",
      subjectId: org.id,
      payload: { name: org.name },
    });
    return { org, user };
  });
  return reply
    .code(201)
    .send({
      token: await issueToken(result.user.id, result.org.id),
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: result.org,
    });
});
app.post("/v1/auth/login", async (request, reply) => {
  const input = loginSchema.parse(request.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);
  if (
    !user ||
    !user.passwordHash ||
    !(await verifyPassword(input.password, user.passwordHash))
  )
    return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
  const [membership] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, user.id))
    .limit(1);
  if (!membership)
    return reply.code(403).send({ error: "WORKSPACE_MEMBERSHIP_REQUIRED" });
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, membership.organizationId))
    .limit(1);
  if (!organization)
    return reply.code(403).send({ error: "WORKSPACE_NOT_FOUND" });
  return {
    token: await issueToken(user.id, membership.organizationId),
    user: { id: user.id, name: user.name, email: user.email },
    organization,
  };
});
app.get("/v1/me", async (request) => {
  const auth = await human(request);
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, auth.organizationId))
    .limit(1);
  if (!user || !organization)
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  return { user, organization };
});
app.post("/v1/mandate-interpretations", async (request, reply) => {
  const auth = await human(request);
  const { userIntent } = z
    .object({ userIntent: z.string().min(10).max(5000) })
    .parse(request.body);
  const interpretation = await interpretMandate(userIntent);
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "MANDATE_INTERPRETED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "MANDATE_DRAFT",
    subjectId: crypto.randomUUID(),
    payload: {
      summary: interpretation.summary,
      ambiguityCount: interpretation.ambiguities.length,
    },
  });
  return reply.send(interpretation);
});
app.get("/v1/agents", async (request) => {
  const auth = await human(request);
  const period = new Date().toISOString().slice(0, 7);
  const agentRows = await db
    .select()
    .from(agents)
    .where(eq(agents.organizationId, auth.organizationId))
    .orderBy(desc(agents.createdAt));
  const activeMandates = await db
    .select({ agentId: mandates.agentId, policy: mandates.policy })
    .from(mandates)
    .where(
      and(
        eq(mandates.organizationId, auth.organizationId),
        eq(mandates.active, true),
      ),
    );
  const spendRows = await db
    .select({
      agentId: budgetLedger.agentId,
      total: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)`,
    })
    .from(budgetLedger)
    .where(
      and(
        eq(budgetLedger.organizationId, auth.organizationId),
        eq(budgetLedger.period, period),
      ),
    )
    .groupBy(budgetLedger.agentId);
  const policyByAgent = new Map(
    activeMandates.map((item) => [item.agentId, item.policy]),
  );
  const spendByAgent = new Map(
    spendRows.map((item) => [item.agentId, Number(item.total)]),
  );
  return agentRows.map((agent) => ({
    ...agent,
    spentThisMonthCents: spendByAgent.get(agent.id) ?? 0,
    mandate: policyByAgent.get(agent.id) ?? null,
  }));
});
app.post("/v1/agents", async (request, reply) => {
  const auth = await human(request);
  const input = z
    .object({ name: z.string().min(2), purpose: z.string().min(3) })
    .parse(request.body);
  const [agent] = await db
    .insert(agents)
    .values({ organizationId: auth.organizationId, ...input })
    .returning();
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "AGENT_CREATED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "AGENT",
    subjectId: agent.id,
    payload: input,
  });
  return reply.code(201).send(agent);
});
app.patch("/v1/agents/:id", async (request, reply) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const input = z
    .object({
      status: z.enum(["ACTIVE", "PAUSED", "REVOKED"]).optional(),
      name: z.string().min(2).optional(),
      purpose: z.string().min(3).optional(),
    })
    .refine((value) => Object.keys(value).length > 0)
    .parse(request.body);
  const [agent] = await db
    .update(agents)
    .set(input)
    .where(
      and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId)),
    )
    .returning();
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "AGENT_UPDATED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "AGENT",
    subjectId: agent.id,
    payload: input,
  });
  return agent;
});
app.post("/v1/agents/:id/keys", async (request, reply) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const [agent] = await db
    .select()
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId)),
    )
    .limit(1);
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  const input = z
    .object({
      name: z.string().min(2),
      scopes: z
        .array(z.enum(["authorizations:write", "decisions:read"]))
        .min(1),
    })
    .parse(request.body);
  const issued = issueApiKey();
  const [record] = await db
    .insert(apiKeys)
    .values({
      organizationId: auth.organizationId,
      agentId: agent.id,
      name: input.name,
      scopes: input.scopes,
      prefix: issued.prefix,
      keyHash: issued.hash,
    })
    .returning();
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "API_KEY_CREATED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "API_KEY",
    subjectId: record.id,
    payload: {
      agentId: id,
      name: record.name,
      prefix: record.prefix,
      scopes: record.scopes,
    },
  });
  return reply
    .code(201)
    .send({
      id: record.id,
      apiKey: issued.key,
      prefix: issued.prefix,
      warning: "Copy this key now. It will not be shown again.",
    });
});
app.get("/v1/agents/:id/keys", async (request, reply) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId)),
    )
    .limit(1);
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      scopes: apiKeys.scopes,
      lastUsedAt: apiKeys.lastUsedAt,
      revokedAt: apiKeys.revokedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.agentId, id),
        eq(apiKeys.organizationId, auth.organizationId),
      ),
    )
    .orderBy(desc(apiKeys.createdAt));
});
app.delete("/v1/agents/:agentId/keys/:keyId", async (request, reply) => {
  const auth = await human(request);
  const { agentId, keyId } = z
    .object({ agentId: z.string().uuid(), keyId: z.string().uuid() })
    .parse(request.params);
  const [key] = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.agentId, agentId),
        eq(apiKeys.organizationId, auth.organizationId),
        dsql`${apiKeys.revokedAt} is null`,
      ),
    )
    .returning({ id: apiKeys.id, revokedAt: apiKeys.revokedAt });
  if (!key) return reply.code(404).send({ error: "API_KEY_NOT_FOUND" });
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "API_KEY_REVOKED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "API_KEY",
    subjectId: key.id,
    payload: { agentId },
  });
  return key;
});
app.post(
  "/v1/agents/:agentId/keys/:keyId/rotate",
  async (request, reply) => {
    const auth = await human(request);
    const { agentId, keyId } = z
      .object({ agentId: z.string().uuid(), keyId: z.string().uuid() })
      .parse(request.params);
    const issued = issueApiKey();
    const replacement = await db.transaction(async (tx) => {
      const [current] = await tx
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(apiKeys.id, keyId),
            eq(apiKeys.agentId, agentId),
            eq(apiKeys.organizationId, auth.organizationId),
            dsql`${apiKeys.revokedAt} is null`,
          ),
        )
        .returning({ name: apiKeys.name, scopes: apiKeys.scopes });
      if (!current) return null;
      const [next] = await tx
        .insert(apiKeys)
        .values({
          organizationId: auth.organizationId,
          agentId,
          name: `${current.name} replacement`,
          scopes: current.scopes,
          prefix: issued.prefix,
          keyHash: issued.hash,
        })
        .returning({ id: apiKeys.id, prefix: apiKeys.prefix });
      await appendAudit(tx, {
        organizationId: auth.organizationId,
        eventType: "API_KEY_ROTATED",
        actorType: "USER",
        actorId: auth.userId,
        subjectType: "API_KEY",
        subjectId: next.id,
        payload: { agentId, revokedKeyId: keyId, prefix: next.prefix },
      });
      return next;
    });
    if (!replacement)
      return reply.code(404).send({ error: "API_KEY_NOT_FOUND" });
    return reply.code(201).send({
      ...replacement,
      apiKey: issued.key,
      warning: "Copy this key now. It will not be shown again.",
    });
  },
);
app.get("/v1/mandates", async (request) => {
  const auth = await human(request);
  return db
    .select()
    .from(mandates)
    .where(eq(mandates.organizationId, auth.organizationId))
    .orderBy(desc(mandates.createdAt));
});
app.get("/v1/agents/:id/mandates", async (request) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  return db
    .select()
    .from(mandates)
    .where(
      and(
        eq(mandates.organizationId, auth.organizationId),
        eq(mandates.agentId, id),
      ),
    )
    .orderBy(desc(mandates.version));
});
app.post("/v1/agents/:id/mandates", async (request, reply) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const input = z
    .object({ userIntent: z.string().min(10), policy: mandatePolicySchema })
    .parse(request.body);
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(eq(agents.id, id), eq(agents.organizationId, auth.organizationId)),
    )
    .limit(1);
  if (!agent) return reply.code(404).send({ error: "AGENT_NOT_FOUND" });
  const mandate = await db.transaction(async (tx) => {
    await tx.execute(dsql`select pg_advisory_xact_lock(hashtext(${id}))`);
    const [current] = await tx
      .select({ version: mandates.version })
      .from(mandates)
      .where(
        and(
          eq(mandates.agentId, id),
          eq(mandates.organizationId, auth.organizationId),
        ),
      )
      .orderBy(desc(mandates.version))
      .limit(1);
    await tx
      .update(mandates)
      .set({ active: false })
      .where(
        and(
          eq(mandates.agentId, id),
          eq(mandates.organizationId, auth.organizationId),
        ),
      );
    const [created] = await tx
      .insert(mandates)
      .values({
        organizationId: auth.organizationId,
        agentId: id,
        version: (current?.version ?? 0) + 1,
        userIntent: input.userIntent,
        policy: input.policy,
        createdBy: auth.userId,
      })
      .returning();
    await appendAudit(tx, {
      organizationId: auth.organizationId,
      eventType: "MANDATE_ACTIVATED",
      actorType: "USER",
      actorId: auth.userId,
      subjectType: "MANDATE",
      subjectId: created.id,
      payload: {
        agentId: id,
        version: created.version,
        userIntent: input.userIntent,
      },
    });
    return created;
  });
  return reply.code(201).send(mandate);
});
async function authorizeAgent(
  agentId: string,
  organizationId: string,
  input: z.infer<typeof authRequestSchema>,
) {
  const amountCents = Math.round(input.amount * 100);
  return db.transaction(async (tx) => {
    await tx.execute(dsql`select pg_advisory_xact_lock(hashtext(${agentId}))`);
    const [existing] = await tx
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.agentId, agentId),
          eq(transactions.idempotencyKey, input.idempotencyKey),
        ),
      )
      .limit(1);
    if (existing) {
      const [decision] = await tx
        .select()
        .from(authorizationDecisions)
        .where(eq(authorizationDecisions.transactionId, existing.id))
        .limit(1);
      return { transaction: existing, decision, replayed: true };
    }
    const [agent] = await tx
      .select()
      .from(agents)
      .where(
        and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)),
      )
      .limit(1);
    const [mandate] = await tx
      .select()
      .from(mandates)
      .where(and(eq(mandates.agentId, agentId), eq(mandates.active, true)))
      .orderBy(dsql`${mandates.version} desc`)
      .limit(1);
    if (!agent || !mandate) throw new Error("NO_ACTIVE_MANDATE");
    const period = new Date().toISOString().slice(0, 7);
    const [spend] = await tx
      .select({
        total: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)`,
      })
      .from(budgetLedger)
      .where(
        and(
          eq(budgetLedger.agentId, agent.id),
          eq(budgetLedger.period, period),
        ),
      );
    const [history] = await tx
      .select({
        count: dsql<number>`count(*)`,
        average: dsql<number>`coalesce(avg(${transactions.amountCents}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.agentId, agent.id));
    const [known] = await tx
      .select({ count: dsql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.agentId, agent.id),
          dsql`lower(${transactions.merchant}) = lower(${input.merchant})`,
        ),
      );
    const [velocity] = await tx
      .select({ count: dsql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.agentId, agent.id),
          dsql`${transactions.createdAt} > now() - interval '1 hour'`,
        ),
      );
    const evaluationInput = {
      agentStatus: agent.status,
      amountCents,
      merchant: input.merchant,
      category: input.category,
      country: input.country,
      isNewMerchant: Number(known.count) === 0,
      spentThisMonthCents: Number(spend.total),
      transactionCountLastHour: Number(velocity.count),
      averageTransactionCents: Number(history.average),
      policy: mandate.policy,
    };
    const policy = evaluatePolicy(evaluationInput);
    const risk = evaluateRisk(evaluationInput);
    const [transaction] = await tx
      .insert(transactions)
      .values({
        organizationId,
        agentId,
        idempotencyKey: input.idempotencyKey,
        amountCents,
        merchant: input.merchant,
        category: input.category,
        country: input.country.toUpperCase(),
        currency: input.currency.toUpperCase(),
        metadata: input.metadata,
      })
      .returning();
    const [decision] = await tx
      .insert(authorizationDecisions)
      .values({
        organizationId,
        transactionId: transaction.id,
        mandateId: mandate.id,
        decision: policy.decision,
        policyRules: policy.rules,
        reasons: policy.reasons,
        riskScore: risk.score,
        riskFactors: risk.factors,
        engineVersion: "policy-v1.0.0",
      })
      .returning();
    if (policy.decision === "APPROVED")
      await tx
        .insert(budgetLedger)
        .values({
          organizationId,
          agentId,
          transactionId: transaction.id,
          amountCents,
          kind: "AUTHORIZED",
          period,
        });
    if (policy.decision === "APPROVAL_REQUIRED")
      await tx
        .insert(approvalRequests)
        .values({
          organizationId,
          decisionId: decision.id,
          expiresAt: new Date(Date.now() + 86_400_000),
        });
    await appendAudit(tx, {
      organizationId,
      eventType: "AUTHORIZATION_DECIDED",
      actorType: "AGENT",
      actorId: agentId,
      subjectType: "TRANSACTION",
      subjectId: transaction.id,
      payload: { decision: policy.decision, reasons: policy.reasons, risk },
    });
    return { transaction, decision, replayed: false };
  });
}
app.post("/v1/authorization-requests", async (request, reply) => {
  const rawKey = String(request.headers["x-mandate-key"] ?? "");
  const [key] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyHash, hashApiKey(rawKey)),
        dsql`${apiKeys.revokedAt} is null`,
      ),
    )
    .limit(1);
  if (!key || !key.scopes.includes("authorizations:write"))
    return reply.code(401).send({ error: "INVALID_API_KEY" });
  const input = authRequestSchema.parse(request.body);
  try {
    const output = await authorizeAgent(key.agentId, key.organizationId, input);
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id));
    return reply.code(output.replayed ? 200 : 201).send(output);
  } catch (error) {
    if (error instanceof Error && error.message === "NO_ACTIVE_MANDATE")
      return reply.code(409).send({ error: "NO_ACTIVE_MANDATE" });
    throw error;
  }
});
app.post("/v1/simulator/authorization-requests", async (request, reply) => {
  const auth = await human(request);
  const input = z
    .object({ agentId: z.string().uuid(), request: authRequestSchema })
    .parse(request.body);
  try {
    return reply
      .code(201)
      .send(
        await authorizeAgent(input.agentId, auth.organizationId, input.request),
      );
  } catch (error) {
    if (error instanceof Error && error.message === "NO_ACTIVE_MANDATE")
      return reply.code(409).send({ error: "NO_ACTIVE_MANDATE" });
    throw error;
  }
});
app.post("/v1/demo-seed", async (request, reply) => {
  const auth = await human(request);
  const [existing] = await db
    .select({ count: dsql<number>`count(*)` })
    .from(agents)
    .where(eq(agents.organizationId, auth.organizationId));
  if (Number(existing.count) > 0)
    return reply.code(409).send({ error: "WORKSPACE_NOT_EMPTY" });
  const definitions = [
    {
      name: "Procurement Agent",
      purpose: "Software and office purchasing",
      policy: {
        monthlyBudgetCents: 200000,
        maxTransactionCents: 25000,
        approvalThresholdCents: 25000,
        allowedCategories: ["software", "office equipment"],
        blockedCategories: ["crypto", "gambling"],
        allowedMerchants: ["Notion", "AWS"],
        blockedMerchants: ["Binance"],
        allowedCountries: ["US"],
        requireApprovalForNewMerchant: true,
        requireApprovalForAll: false,
        expiresAt: null,
      },
    },
    {
      name: "Travel Coordinator",
      purpose: "Team travel and accommodation",
      policy: {
        monthlyBudgetCents: 300000,
        maxTransactionCents: 30000,
        approvalThresholdCents: 30000,
        allowedCategories: ["travel"],
        blockedCategories: ["crypto", "gambling"],
        allowedMerchants: ["Delta"],
        blockedMerchants: [],
        allowedCountries: ["US"],
        requireApprovalForNewMerchant: true,
        requireApprovalForAll: false,
        expiresAt: null,
      },
    },
  ] satisfies Array<{ name: string; purpose: string; policy: MandatePolicy }>;
  const created = await db.transaction(async (tx) => {
    const rows = [];
    for (const definition of definitions) {
      const [agent] = await tx
        .insert(agents)
        .values({
          organizationId: auth.organizationId,
          name: definition.name,
          purpose: definition.purpose,
        })
        .returning();
      await tx
        .insert(mandates)
        .values({
          organizationId: auth.organizationId,
          agentId: agent.id,
          version: 1,
          userIntent: `Demo mandate for ${definition.purpose}.`,
          policy: definition.policy,
          createdBy: auth.userId,
        });
      await appendAudit(tx, {
        organizationId: auth.organizationId,
        eventType: "DEMO_AGENT_CREATED",
        actorType: "USER",
        actorId: auth.userId,
        subjectType: "AGENT",
        subjectId: agent.id,
        payload: { name: agent.name, synthetic: true },
      });
      rows.push(agent);
    }
    return rows;
  });
  const samples = [
    {
      agentId: created[0].id,
      idempotencyKey: `demo-notion-${Date.now()}`,
      amount: 96,
      merchant: "Notion",
      category: "software",
      country: "US",
    },
    {
      agentId: created[0].id,
      idempotencyKey: `demo-apple-${Date.now()}`,
      amount: 899,
      merchant: "Apple",
      category: "office equipment",
      country: "US",
    },
    {
      agentId: created[0].id,
      idempotencyKey: `demo-binance-${Date.now()}`,
      amount: 600,
      merchant: "Binance",
      category: "crypto",
      country: "KY",
    },
    {
      agentId: created[1].id,
      idempotencyKey: `demo-delta-${Date.now()}`,
      amount: 389,
      merchant: "Delta",
      category: "travel",
      country: "US",
    },
  ];
  for (const sample of samples) {
    await authorizeAgent(sample.agentId, auth.organizationId, {
      ...sample,
      currency: "USD",
      metadata: { syntheticDemo: true },
    });
  }
  await appendAudit(db, {
    organizationId: auth.organizationId,
    eventType: "DEMO_WORKSPACE_SEEDED",
    actorType: "USER",
    actorId: auth.userId,
    subjectType: "ORGANIZATION",
    subjectId: auth.organizationId,
    payload: {
      synthetic: true,
      agents: created.length,
      transactions: samples.length,
    },
  });
  return reply
    .code(201)
    .send({
      agents: created.length,
      transactions: samples.length,
      synthetic: true,
    });
});
app.get("/v1/transactions", async (request) => {
  const auth = await human(request);
  return db
    .select({
      id: transactions.id,
      merchant: transactions.merchant,
      category: transactions.category,
      country: transactions.country,
      currency: transactions.currency,
      amountCents: transactions.amountCents,
      metadata: transactions.metadata,
      createdAt: transactions.createdAt,
      agentId: agents.id,
      agentName: agents.name,
      decisionId: authorizationDecisions.id,
      decision: authorizationDecisions.decision,
      reasons: authorizationDecisions.reasons,
      policyRules: authorizationDecisions.policyRules,
      riskScore: authorizationDecisions.riskScore,
      riskFactors: authorizationDecisions.riskFactors,
      engineVersion: authorizationDecisions.engineVersion,
      approvalRequestId: approvalRequests.id,
      approvalStatus: approvalRequests.status,
    })
    .from(transactions)
    .innerJoin(agents, eq(agents.id, transactions.agentId))
    .innerJoin(
      authorizationDecisions,
      eq(authorizationDecisions.transactionId, transactions.id),
    )
    .leftJoin(
      approvalRequests,
      eq(approvalRequests.decisionId, authorizationDecisions.id),
    )
    .where(eq(transactions.organizationId, auth.organizationId))
    .orderBy(desc(transactions.createdAt))
    .limit(250);
});
app.get("/v1/approval-requests", async (request) => {
  const auth = await human(request);
  return db
    .select({
      id: approvalRequests.id,
      status: approvalRequests.status,
      expiresAt: approvalRequests.expiresAt,
      createdAt: approvalRequests.createdAt,
      resolvedAt: approvalRequests.resolvedAt,
      resolutionNote: approvalRequests.resolutionNote,
      decisionId: authorizationDecisions.id,
      decision: authorizationDecisions.decision,
      reasons: authorizationDecisions.reasons,
      policyRules: authorizationDecisions.policyRules,
      riskScore: authorizationDecisions.riskScore,
      riskFactors: authorizationDecisions.riskFactors,
      transactionId: transactions.id,
      merchant: transactions.merchant,
      category: transactions.category,
      country: transactions.country,
      currency: transactions.currency,
      amountCents: transactions.amountCents,
      agentId: agents.id,
      agentName: agents.name,
    })
    .from(approvalRequests)
    .innerJoin(
      authorizationDecisions,
      eq(authorizationDecisions.id, approvalRequests.decisionId),
    )
    .innerJoin(
      transactions,
      eq(transactions.id, authorizationDecisions.transactionId),
    )
    .innerJoin(agents, eq(agents.id, transactions.agentId))
    .where(
      and(
        eq(approvalRequests.organizationId, auth.organizationId),
        eq(approvalRequests.status, "PENDING"),
        dsql`${approvalRequests.expiresAt} > now()`,
      ),
    )
    .orderBy(desc(approvalRequests.createdAt));
});
app.get("/v1/dashboard", async (request) => {
  const auth = await human(request);
  const period = new Date().toISOString().slice(0, 7);
  const [budget] = await db
    .select({
      authorizedSpendCents: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)`,
    })
    .from(budgetLedger)
    .where(
      and(
        eq(budgetLedger.organizationId, auth.organizationId),
        eq(budgetLedger.period, period),
      ),
    );
  const [counts] = await db
    .select({
      total: dsql<number>`count(*)`,
      approved: dsql<number>`count(*) filter (where ${authorizationDecisions.decision} = 'APPROVED' or ${approvalRequests.status} = 'APPROVED')`,
      declined: dsql<number>`count(*) filter (where ${authorizationDecisions.decision} = 'DECLINED' or ${approvalRequests.status} = 'DECLINED')`,
      review: dsql<number>`count(*) filter (where ${authorizationDecisions.decision} = 'APPROVAL_REQUIRED' and ${approvalRequests.status} = 'PENDING' and ${approvalRequests.expiresAt} > now())`,
      highRisk: dsql<number>`count(*) filter (where ${authorizationDecisions.riskScore} >= 70)`,
    })
    .from(authorizationDecisions)
    .leftJoin(
      approvalRequests,
      eq(approvalRequests.decisionId, authorizationDecisions.id),
    )
    .where(eq(authorizationDecisions.organizationId, auth.organizationId));
  const activeMandates = await db
    .select({ policy: mandates.policy })
    .from(mandates)
    .where(
      and(
        eq(mandates.organizationId, auth.organizationId),
        eq(mandates.active, true),
      ),
    );
  const authorizedBudgetCents = activeMandates.reduce(
    (sum, item) => sum + item.policy.monthlyBudgetCents,
    0,
  );
  return {
    period,
    authorizedSpendCents: Number(budget.authorizedSpendCents),
    authorizedBudgetCents,
    remainingBudgetCents: Math.max(
      0,
      authorizedBudgetCents - Number(budget.authorizedSpendCents),
    ),
    ...Object.fromEntries(
      Object.entries(counts).map(([key, value]) => [key, Number(value)]),
    ),
  };
});
app.get("/v1/audit-events", async (request) => {
  const auth = await human(request);
  return db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.organizationId, auth.organizationId))
    .orderBy(desc(auditEvents.sequence))
    .limit(250);
});
app.get("/v1/audit-events/verify", async (request) => {
  const auth = await human(request);
  return verifyAuditChain(db, auth.organizationId);
});
app.post("/v1/approval-requests/:id/resolve", async (request, reply) => {
  const auth = await human(request);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
  const input = z
    .object({
      outcome: z.enum(["APPROVED", "DECLINED"]),
      note: z.string().max(500).optional(),
    })
    .parse(request.body);
  const result = await db.transaction(async (tx) => {
    const [approval] = await tx
      .select()
      .from(approvalRequests)
      .where(
        and(
          eq(approvalRequests.id, id),
          eq(approvalRequests.organizationId, auth.organizationId),
        ),
      )
      .limit(1);
    if (
      !approval ||
      approval.status !== "PENDING" ||
      approval.expiresAt <= new Date()
    )
      return null;
    const [decision] = await tx
      .select()
      .from(authorizationDecisions)
      .where(eq(authorizationDecisions.id, approval.decisionId))
      .limit(1);
    const [transaction] = await tx
      .select()
      .from(transactions)
      .where(eq(transactions.id, decision.transactionId))
      .limit(1);
    if (input.outcome === "APPROVED") {
      const [mandate] = await tx
        .select()
        .from(mandates)
        .where(eq(mandates.id, decision.mandateId))
        .limit(1);
      const period = new Date().toISOString().slice(0, 7);
      await tx.execute(
        dsql`select pg_advisory_xact_lock(hashtext(${transaction.agentId}))`,
      );
      const [spend] = await tx
        .select({
          total: dsql<number>`coalesce(sum(${budgetLedger.amountCents}), 0)`,
        })
        .from(budgetLedger)
        .where(
          and(
            eq(budgetLedger.agentId, transaction.agentId),
            eq(budgetLedger.period, period),
          ),
        );
      if (
        Number(spend.total) + transaction.amountCents >
        mandate.policy.monthlyBudgetCents
      )
        throw Object.assign(
          new Error("Budget changed while awaiting approval"),
          { statusCode: 409, code: "BUDGET_EXCEEDED" },
        );
      await tx
        .insert(budgetLedger)
        .values({
          organizationId: auth.organizationId,
          agentId: transaction.agentId,
          transactionId: transaction.id,
          amountCents: transaction.amountCents,
          kind: "HUMAN_AUTHORIZED",
          period,
        });
    }
    const [resolved] = await tx
      .update(approvalRequests)
      .set({
        status: input.outcome,
        resolvedBy: auth.userId,
        resolutionNote: input.note,
        resolvedAt: new Date(),
      })
      .where(eq(approvalRequests.id, id))
      .returning();
    await appendAudit(tx, {
      organizationId: auth.organizationId,
      eventType: "APPROVAL_RESOLVED",
      actorType: "USER",
      actorId: auth.userId,
      subjectType: "APPROVAL_REQUEST",
      subjectId: id,
      payload: { outcome: input.outcome, note: input.note ?? null },
    });
    return resolved;
  });
  if (!result) return reply.code(409).send({ error: "APPROVAL_NOT_PENDING" });
  return result;
});

app.setErrorHandler((error: unknown, _request, reply) => {
  if (error instanceof z.ZodError)
    return reply
      .code(400)
      .send({ error: "INVALID_REQUEST", issues: error.issues });
  app.log.error(error);
  const failure = error as {
    statusCode?: number;
    code?: string;
    name?: string;
  };
  return reply
    .code(failure.statusCode ?? 500)
    .send({
      error:
        failure.code ?? (failure.statusCode ? failure.name : "INTERNAL_ERROR"),
    });
});

await app.listen({ port: env.PORT, host: "0.0.0.0" });
process.on("SIGTERM", async () => {
  await app.close();
  await sql.end();
});
