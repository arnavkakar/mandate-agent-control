# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Small-business owners and startup operators who delegate software, equipment, travel, advertising, and other business purchasing tasks to AI agents while remaining accountable for financial controls.

## Product Purpose

Mandate is a programmable authorization and risk-control layer for AI-agent payments. It lets agents request purchases but keeps authorization in deterministic policy code and, when rules require it, a human approval workflow. Success means an operator can understand, constrain, review, and audit every attempted agent purchase without trusting an LLM to make a financial authorization decision.

## Positioning

Mandate separates interpretation from authority: an LLM may translate plain-language intent into a proposed structured mandate, but only the deterministic policy engine can return `APPROVED`, `APPROVAL_REQUIRED`, or `DECLINED`. Every result includes machine-readable reasons and an explainable rule trace.

## Operating Context

Operators create agents and versioned spending mandates in a control-center dashboard. Agents, MCP servers, or customer backends submit authorization requests before spending through a scoped API credential. Operators monitor spend and risk, pause or revoke agents, change limits, review queued transactions, and inspect a tamper-evident audit trail. The product currently models simulated payments; future payment-provider adapters remain downstream of authorization.

## Capabilities and Constraints

- Organization-scoped signup, login, agents, mandates, API keys, transactions, decisions, approvals, budget ledger entries, and audit events.
- Deterministic checks cover agent status, mandate expiration, monthly budget, transaction limits, approval thresholds, category and merchant allow/block rules, country rules, and merchant novelty.
- Risk scoring covers amount anomaly, new merchant, category mismatch, abnormal velocity, and geography mismatch.
- The production API, dashboard, and PostgreSQL database are hosted as separate services in the same Railway project; the dashboard consumes the API over its public service URL until private service-to-service routing is introduced.
- No real payment processing, card storage, banking credentials, or fabricated provider integrations.
- OpenAI Structured Outputs may interpret mandate language server-side but can never authorize a transaction.
- External MCPs, expense systems, webhooks, and payment providers are optional adapters rather than required data sources.

## Brand Commitments

The product name is Mandate. The voice is serious, calm, precise, and operational: modern fintech infrastructure rather than an AI chatbot. Copy must distinguish simulated activity from real financial movement and must not claim integrations or transactions that do not exist.

## Evidence on Hand

- A working multi-view dashboard with realistic seeded demo data in `app/page.tsx`.
- A production API, PostgreSQL schema, migrations, policy/risk tests, and Railway configuration under `services/api`.
- A live Railway health endpoint and a private GitHub source repository.
- No testimonials, customers, transaction volume claims, payment-provider relationships, or compliance certifications; future work must not fabricate them.

## Product Principles

1. LLMs interpret; deterministic systems authorize.
2. Every financial decision is explainable.
3. Financial permissions follow least privilege.
4. Ambiguous or elevated-risk actions remain human-in-the-loop.
5. Product truth and simulation boundaries are explicit.

## Accessibility & Inclusion

The operational dashboard must support keyboard navigation, visible focus, semantic labels, readable contrast, responsive layouts, reduced-motion preferences, and clear non-color-only status communication. Financial decisions and recovery paths must be understandable without specialist fintech or AI terminology.
