# Mandate Delivery Tracker

Last updated: 2026-08-14
Repository: `arnavkakar/mandate-agent-control`  
Production web: `https://mandate-agent.com`  
Production API: `https://mandate-agent-control-production.up.railway.app`

This file is the durable handoff for the next engineer or agent. Do not infer completion from merged code alone: each item distinguishes implemented, locally verified, and production verified.

## Current release state

- [x] Backend and dashboard are deployed on Railway in the same project.
- [x] The API health endpoint is live and the dashboard can authenticate against Railway.
- [x] The custom apex domain `mandate-agent.com` is verified and resolves to the Railway web service.
- [x] The authenticated control center is live, including agents, mandates, simulator, transactions, approvals, risk activity, audit trail, and connections.
- [x] The public homepage, metadata, robots route, sitemap route, and dynamic Open Graph image are implemented in commit `b71b6a5`.
- [ ] **Release blocker:** Railway production maps the literal `/app` route segment to the framework app root and leaks its `noindex` metadata across public pages. Current source removes the collision by moving the console to `/console`; `/app` is retained only as a compatibility redirect.
- [ ] After the collision-free route is active, verify desktop and 390px mobile rendering, keyboard navigation, the CTA to `/console`, canonical URLs, `robots.txt`, `sitemap.xml`, `llms.txt`, `security.txt`, and the Open Graph image on the custom domain.

## What has been completed

### Product and architecture

- [x] Deterministic three-state authorization: `APPROVED`, `APPROVAL_REQUIRED`, `DECLINED`.
- [x] Policy and risk engines are separate; risk can escalate but cannot override a hard decline.
- [x] Versioned mandates, tenant-scoped financial records, human approval resolution, and hash-linked audit events.
- [x] Railway PostgreSQL and Railway API/web services.
- [x] No card storage, bank connection, or real payment execution in the MVP.

### Authentication and persistent application state

- [x] Email/password workspace signup and login.
- [x] Password visibility control, confirmation field, password requirements, and inline validation.
- [x] Google Identity Services signup with server-side ID-token verification.
- [x] Persistent Railway-backed agents, mandates, transactions, approvals, metrics, and audit events.
- [x] Agent pause/resume, revoke, budget/threshold changes, and approval-all control flows.
- [x] Live agent simulator and synthetic demo seed flow.

### Reliability and regression coverage

- [x] Approval resolution refreshes the queue and clears stale error state.
- [x] Expired sessions fail safely and return users to authentication.
- [x] Clipboard feedback and atomic credential rotation.
- [x] Terminal agent revocation enforced by the backend.
- [x] Empty JSON request handling and production critical-flow regression tests.
- [x] API policy and security tests currently pass (9 tests at the latest local run).

### Security hardening

- [x] Drizzle parameter binding; request data is not concatenated into SQL.
- [x] Organization/agent ownership enforced at trust-boundary lookups.
- [x] Strict Zod request/output validation and explicit body/text/numeric limits.
- [x] Route-specific and global rate limits, including OpenAI interpretation cost controls.
- [x] Prompt-injection defense-in-depth, strict Structured Outputs, output re-validation, timeout, token ceiling, and model safety identifier.
- [x] The LLM has no payment tools, database authority, credentials, or authorization capability.
- [x] Transactional budget/approval locks, idempotency keys, and serialized audit-chain appends.
- [x] Restrictive response headers, no-store API responses, CORS allowlist, and explicit Origin enforcement.
- [ ] Put Cloudflare in front of the public site/API for managed WAF, bot management, application-layer DDoS protection, and edge rate limits before inviting untrusted traffic.
- [ ] Rotate any OpenAI/OAuth secret that was ever pasted into chat, screenshots, logs, or another non-secret channel.
- [ ] Replace browser local-storage bearer sessions with Secure, HttpOnly, SameSite cookies plus CSRF protection.
- [ ] Add email verification, password reset, MFA, session revocation, webhook signing, and immutable audit export.
- [ ] Add Sentry/OpenTelemetry, rate-limit alerting, backup verification, and a restore drill.

### UI and accessibility

- [x] Impeccable initialized with `PRODUCT.md`, `DESIGN.md`, and project design context.
- [x] Every dashboard view received Impeccable critique and polish.
- [x] Generic purple AI-SaaS styling was replaced with the Authorization Registry visual system: warm ledger neutrals, registry green, ochre review emphasis, flat borders, serif financial hierarchy, and semantic decision colors.
- [x] Fabricated risk statistics and hardcoded decision evidence were removed; live data or honest empty states are used.
- [x] Mobile layout, Connections overflow, Create Mandate reflow, touch targets, sidebar inert state, dialog labels, Escape handling, and focus restoration were improved.
- [x] Deterministic Impeccable detector returned no findings after the production UI pass.
- [ ] Complete focus trapping/background inertness for every modal, drawer, and mobile navigation panel.
- [ ] Run a full live WCAG 2.2 audit on populated representative states after the public route blocker is resolved.

### Public website and SEO foundation

- [x] Marketing homepage designed around the product-specific authorization boundary and decision trace.
- [x] Console moved in source to `/console` with `noindex, nofollow` metadata; `/app` is a compatibility redirect.
- [x] Root metadata, canonical URL, SoftwareApplication JSON-LD, `robots.ts`, `sitemap.ts`, and dynamic `opengraph-image.tsx` implemented.
- [x] Codex SEO suite `v1.9.6-codex.5` reviewed and installed locally: 26 workflows and 24 agent profiles; core verifier passes.
- [x] Independent checks installed locally: Addy Osmani web-quality SEO and Core Web Vitals; Corey Haines content strategy, site architecture, and programmatic SEO.
- [x] `npm i -g seo` intentionally not used because the unscoped package is ambiguous and provides weaker provenance than pinned GitHub sources.
- [x] Publish honest `/security`, `/privacy`, and `/terms` trust pages with canonical metadata and internal footer navigation.
- [x] Add `/llms.txt`, explicit AI-search crawler access, `/.well-known/security.txt`, and a repository security-reporting policy.
- [x] Local production build, lint, and four rendered-route regression tests pass for the complete trust/SEO surface.
- [x] Fix the Railway/vinext root-route mismatch locally; lint, production build, and rendered-route tests pass.
- [ ] Deploy that fix, then run a fresh production SEO audit and save the baseline/action plan.
- [ ] Connect Google Search Console and submit `https://mandate-agent.com/sitemap.xml` only after root canonical/indexing is correct.
- [ ] Add privacy, terms, security, and responsible-disclosure pages before public acquisition.

## Approved SEO and site architecture direction

Mandate is a hybrid SaaS + developer-infrastructure site. Keep the architecture shallow and every important page within three clicks.

```text
Homepage (/)
├── Product (/product)
│   ├── Authorization policies (/product/policy-engine)
│   ├── Human approvals (/product/approvals)
│   ├── Risk controls (/product/risk-controls)
│   └── Audit trail (/product/audit-trail)
├── Use cases (/use-cases)
│   ├── AI procurement agents (/use-cases/procurement-agents)
│   ├── AI travel agents (/use-cases/travel-agents)
│   └── AI marketing agents (/use-cases/marketing-agents)
├── Developers (/developers)
│   ├── Quickstart (/developers/quickstart)
│   ├── API reference (/developers/api)
│   ├── MCP integration (/developers/mcp)
│   └── Security model (/developers/security)
├── Resources (/resources)
│   ├── What is agent payment authorization? (/resources/agent-payment-authorization)
│   ├── Deterministic vs LLM authorization (/resources/deterministic-authorization)
│   └── Human-in-the-loop agent payments (/resources/human-in-the-loop-agent-payments)
├── Pricing (/pricing)
├── Security (/security)
├── Privacy (/privacy)
├── Terms (/terms)
└── Console (/console, noindex; /app redirects here)
```

Recommended header: Product, Use cases, Developers, Security, Pricing, then the Create workspace CTA. Keep resources and legal pages in the footer until content volume justifies more navigation.

Content pillars:

1. Agent payment authorization and least-privilege financial authority.
2. Deterministic policy engines and explainable decisions.
3. Human approval workflows and operational control.
4. Agent-payment security, prompt-injection boundaries, and auditability.
5. Integration tutorials for APIs, MCP servers, and agent frameworks.

Do not start broad programmatic SEO yet. Mandate does not have enough proprietary or product-derived data to make hundreds of template pages genuinely unique. Start with the high-intent product, developer, security, and three use-case pages above; validate impressions and queries in Search Console before expanding.

## Prioritized next actions

### P0 — release correctness

1. Promote the latest GitHub deployment in Railway. The source connection is on `main` with automatic deploys enabled, but Railway retained the earlier deployment after the successful route-fix build was removed.
2. Verify the Railway deployment:
   - `/` contains the marketing `h1`, canonical `/`, and `index, follow`.
   - `/console` contains the console/auth UI, canonical `/console`, and `noindex, nofollow`.
   - `/app` redirects to `/console` without becoming an application page module.
   - Both routes preserve the security headers.
3. Verify desktop and 390px mobile layout, keyboard access, CTA navigation, `robots.txt`, `sitemap.xml`, and the Open Graph image.

### P1 — launch safety and observability

1. Add Cloudflare WAF/DDoS protection and edge rate limits.
2. Configure Sentry or OpenTelemetry for API and web errors; alert on OpenAI rejections/rate limits, authentication spikes, and 5xx rates.
3. Rotate exposed secrets and confirm only Railway secret variables contain production credentials.
4. Configure PostgreSQL backups and execute a restore test.

### P1 — SEO launch essentials

1. Publish `/security`, `/privacy`, and `/terms`.
2. Publish developer quickstart/API/MCP documentation with copy-pastable requests and honest simulation boundaries.
3. Run Codex SEO technical, schema, sitemap, GEO, and performance checks on the live domain.
4. Validate JSON-LD with Schema.org and Google Rich Results tools. Do not add commercial FAQ schema solely for rich-result hopes.
5. Connect Search Console and submit the sitemap.

### P2 — content and conversion

1. Build product pages for policy, approvals, risk, and audit evidence.
2. Build the three initial use-case pages with distinct workflows and examples—not variable-swapped templates.
3. Build the three resource pillar pages and interlink them to product and developer pages.
4. Add a transparent pricing/availability page even if the initial state is “portfolio MVP / early access.” Do not invent customers, performance metrics, or integrations.
5. Instrument first-party product analytics and conversion events only after the privacy disclosure is ready.

### P2 — application maturity

1. Cookie-based sessions/CSRF, password reset, email verification, MFA, and session/device management.
2. Webhook signing/retries/DLQ and agent-key rotation UX.
3. Approval escalation policies, configurable velocity windows, calibrated risk baselines, and audit export.
4. Add a future payment-provider adapter only behind an explicit environment boundary; never let it bypass Mandate's deterministic decision.

## Verification commands

Run from the repository root with Node 22+:

```bash
pnpm install
pnpm lint
pnpm api:typecheck
pnpm api:test
pnpm build
node --test tests/rendered-html.test.mjs
pnpm test:e2e
```

Known local constraint: the full vinext build can fail in the macOS sandbox because of the native rolldown binary signing/team restriction. Railway's Linux build is the authoritative build in that case. Do not ignore test failures caused by application code.

Production smoke checks:

```bash
curl -fsS https://mandate-agent-control-production.up.railway.app/health
curl -fsSI https://mandate-agent.com/
curl -fsS https://mandate-agent.com/robots.txt
curl -fsS https://mandate-agent.com/sitemap.xml
curl -fsSI https://mandate-agent.com/opengraph-image
```

## Handoff rules

- Preserve the principle: language models may interpret; deterministic code authorizes.
- Never add real payment/card behavior or imply simulated requests were real.
- Never commit secrets, `.env` files, SEO provider credentials, `.seo-cache`, generated audit reports, or Railway variable values.
- Keep commits authored as `Arnav Kakar <156546544+arnavkakar@users.noreply.github.com>` with no `Co-authored-by` trailer.
- Before changing a high-stakes control, inspect both tenant scoping and audit-event behavior.
- Before declaring a deploy complete, verify the behavior on `https://mandate-agent.com`, not only the Railway build log.
