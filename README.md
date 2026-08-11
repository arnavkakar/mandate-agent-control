# Mandate

Mandate is a programmable authorization and risk-control layer for simulated AI-agent payments. It gives an AI agent permission to *request* a purchase while reserving the authorization decision for deterministic code and, when required, a human reviewer.

> This is a portfolio MVP. It does not move money, store card data, connect to a bank, or claim that simulated transactions occurred in the real world.

## Product thesis

Agentic commerce needs a separation of powers. An LLM can interpret business intent into a proposed mandate, but probabilistic output must never be the source of financial authority. Mandate converts intent into a versioned ruleset, evaluates every transaction against that ruleset, attaches an independent 0–100 risk score, and returns exactly one of `APPROVED`, `APPROVAL_REQUIRED`, or `DECLINED` with machine-readable reasons.

The demo is seeded around a small company using procurement, growth, travel, and engineering agents. The simulator, approval queue, decision explainer, risk view, and audit trail form one connected workflow.

## Architecture

- **UI:** Next-compatible React, TypeScript, Tailwind CSS, Recharts, and reusable dashboard primitives.
- **Authorization boundary:** a deterministic rules pipeline checks agent status, mandate validity, monthly budget, autonomous limit, approval threshold, merchant/category allow- and blocklists, geography, and merchant novelty.
- **Risk boundary:** separate weighted signals cover amount anomaly, new merchant, category mismatch, abnormal velocity, and geography mismatch. Risk can escalate a transaction but cannot override a hard decline.
- **LLM boundary:** production mandate parsing should call OpenAI Structured Outputs on the server, validate the response against a strict schema, and present the result for user confirmation. The demo renders a deterministic representative parse so it remains safe and usable without secrets.
- **Production enforcement API:** `services/api` is a Railway-ready Fastify service with PostgreSQL, signup/login, organizations, scoped agent credentials, versioned mandates, idempotent authorization requests, serialized budget checks, approval records, and hash-chained audit events.
- **Data boundary:** `services/api/src/schema.ts` is the production PostgreSQL model. The original `db/schema.ts` remains the lightweight hosted-demo schema. Tenant ownership is explicit on every financial record.
- **Payment boundary:** a future provider adapter receives only already-authorized intents. No provider implementation exists in this MVP.

```text
Agent / MCP / your backend
          │  signed REST request
          ▼
Mandate authorization API ──► deterministic policy + risk
          │                              │
          ▼                              ▼
 PostgreSQL ledger                one explainable decision
          │
          └──► optional webhook / future payment-provider adapter
```

## Where production data comes from

Mandate does not depend on a bank, card network, or third-party transaction feed. The primary data source is the authorization request that an agent, an MCP server, or the customer&apos;s backend sends **before** a purchase. Customers configure identity and intent in the dashboard; request history creates the merchant, velocity, and anomaly baselines.

Optional connectors can enrich the system later:

- MCP tools or agent SDKs submit authorization requests.
- Webhooks notify customers of decisions and approval outcomes.
- Expense/ERP imports provide reconciliation and richer historical baselines.
- A future payment-provider adapter may execute an already-approved intent, but it stays downstream of Mandate and outside this MVP.

This makes the core product plug-and-play and independently deployable. External sources improve context; they are not required for authorization.

## Decision precedence

1. Hard blocks (revoked/paused agent, expired mandate, blocked merchant/category/country, insufficient budget) produce `DECLINED`.
2. Review rules (approval threshold, new merchant, global approval switch, high risk) produce `APPROVAL_REQUIRED`.
3. Only a request that passes every hard and review rule becomes `APPROVED`.

Risk and policy outputs are stored independently. Human resolution creates a new audit event; it does not rewrite the original evaluation.

## Demo flows

1. Open **Simulator**, submit a known low-value US software purchase, and inspect its approval reasons.
2. Submit Apple for $899 to see amount and merchant novelty require review.
3. Submit Binance / Crypto or select a non-US country to see a deterministic decline.
4. Open **Approval Queue** and approve or decline a pending request.
5. Open **Agents** to pause/resume an agent or require approval for all future transactions.
6. Open **Create Mandate**, interpret the example intent, review the structured policy, and activate it.

## Implemented production foundation

- Password signup/login and Google Identity Services signup with server-verified ID tokens and short-lived Mandate access tokens.
- Organizations and tenant-scoped records.
- Per-agent API keys stored as one-way SHA-256 hashes and returned once.
- Deterministic policy and risk engines with unit tests.
- Idempotent `POST /v1/authorization-requests` contract.
- PostgreSQL advisory locks around spend evaluation and ledger writes, preventing concurrent requests from overspending a monthly budget.
- Versioned mandates, immutable original decisions, and SHA-256-linked audit events.
- CORS, rate limiting, strict request validation, Docker, and Railway configuration.

## Remaining hardening roadmap

- Server-only OpenAI Structured Outputs integration with schema versioning and adversarial prompt tests.
- Password email verification, password reset, MFA, enterprise SSO, session revocation, and audit-log export to immutable object storage.
- Webhook signing, retry queues, dead-letter handling, and key rotation UX.
- Configurable velocity windows, historical baselines, alerting, and risk calibration.
- Optional payment-provider adapter behind an explicit simulation/production environment gate.
- Background reconciliation, OpenTelemetry/Sentry observability, backups, retention controls, and approval escalation policies.

## Railway deployment

1. Create a Railway project from this GitHub repository.
2. Add a Railway PostgreSQL service and link it to the application so `DATABASE_URL` is injected.
3. Set `JWT_SECRET` to at least 32 random characters and `CORS_ORIGIN` to the dashboard origin.
4. For Google signup, create a Google OAuth **Web application** client, add the frontend domain (for example `https://mandate-web-production.up.railway.app`) as an authorized JavaScript origin, and set its client ID as `GOOGLE_CLIENT_ID` on the API service. The Google button remains hidden when this variable is absent.
5. Run `pnpm db:prod:migrate` once as a release/pre-deploy command.
6. Deploy. `railway.json` builds `services/api/Dockerfile` and checks `/health`.

Keep the public dashboard and API on separate domains, for example `app.mandate.example` and `api.mandate.example`. Only server-side components may hold OpenAI credentials. Agent keys belong in the calling agent&apos;s secret store, never browser storage.

## API quick start

After signup, create an agent, activate a mandate, then issue a scoped key. The agent calls:

```bash
curl https://api.example.com/v1/authorization-requests \
  -H "X-Mandate-Key: mnd_live_REDACTED" \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey":"order_01J8","amount":96,"currency":"USD","merchant":"Notion","category":"Software","country":"US"}'
```

The caller must proceed only for `APPROVED`, wait for a human on `APPROVAL_REQUIRED`, and stop on `DECLINED`.

## Local development

Use Node 22 or newer.

```bash
pnpm install
cp .env.example .env
pnpm db:prod:migrate
pnpm api:dev       # API on :3001
pnpm dev           # dashboard
pnpm check         # lint, typecheck, engine tests, UI build/test
```

The local API requires PostgreSQL. The hosted dashboard intentionally remains a seeded simulation and clearly labels that no money moves.
