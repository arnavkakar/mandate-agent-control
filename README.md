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
- **Data boundary:** the Drizzle schema in `db/schema.ts` defines users, agents, mandates, transactions, authorization decisions, approval requests, and hash-linked audit events. The schema is portable to Supabase PostgreSQL; JSON text columns become `jsonb`, and ownership is enforced with Supabase RLS in production.
- **Payment boundary:** a future provider adapter receives only already-authorized intents. No provider implementation exists in this MVP.

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

## Production hardening roadmap

- Supabase Auth with organization membership and RLS on every owned table.
- Supabase PostgreSQL migrations, transactions, and row locks for atomic monthly budget reservation.
- Server-only OpenAI Structured Outputs integration with schema versioning and adversarial prompt tests.
- Signed agent credentials, nonce/idempotency enforcement, request expiry, and replay protection.
- Cryptographically chained audit events exported to immutable object storage.
- Configurable velocity windows, historical baselines, alerting, and risk calibration.
- Optional payment-provider adapter behind an explicit simulation/production environment gate.
- Background reconciliation, observability, rate limiting, and approval escalation policies.

## Local development

Use Node 22 or newer, install dependencies, then run the `dev`, `build`, `lint`, and `test` scripts from `package.json`.
