import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "./public-page";

const decisionChecks = [
  ["Agent status", "Active", "pass"],
  ["Monthly authority", "$1,904 remaining", "pass"],
  ["Autonomous limit", "$250 maximum", "review"],
  ["Merchant history", "Apple is new", "review"],
] as const;

const requestExample = `POST /v1/authorization-requests
X-Mandate-Key: mnd_live_••••••••

{
  "amount": 96,
  "merchant": "Notion",
  "category": "software",
  "country": "US"
}`;

const responseExample = `{
  "decision": "APPROVED",
  "riskScore": 12,
  "reasons": [
    "Within autonomous limit",
    "Known merchant and category"
  ]
}`;

export default function MarketingHome() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://mandate-agent.com/#organization",
        name: "Mandate",
        url: "https://mandate-agent.com/",
      },
      {
        "@type": "WebSite",
        "@id": "https://mandate-agent.com/#website",
        name: "Mandate",
        url: "https://mandate-agent.com/",
        publisher: { "@id": "https://mandate-agent.com/#organization" },
      },
      {
        "@type": "WebPage",
        "@id": "https://mandate-agent.com/#webpage",
        name: "Mandate — Authorization controls for AI-agent spending",
        url: "https://mandate-agent.com/",
        dateModified: "2026-08-14",
        isPartOf: { "@id": "https://mandate-agent.com/#website" },
        about: { "@id": "https://mandate-agent.com/#software" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://mandate-agent.com/#software",
        name: "Mandate",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "A programmable authorization and risk-control layer for simulated AI-agent payments.",
        url: "https://mandate-agent.com/",
        author: { "@id": "https://mandate-agent.com/#organization" },
      },
    ],
  };

  return (
    <main className="marketing-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <a className="marketing-skip" href="#main-content">
        Skip to content
      </a>

      <PublicHeader />

      <section className="marketing-hero" id="main-content">
        <div className="marketing-hero-copy">
          <p className="marketing-context">
            Authorization infrastructure for agentic commerce
          </p>
          <h1>
            AI agents can request.
            <br />
            <span>Mandate decides whether they may spend.</span>
          </h1>
          <p className="marketing-lede">
            Give agents narrowly scoped financial authority without letting a
            language model become the decision-maker. Every request is evaluated
            by deterministic policy, scored for risk, and recorded with an exact
            reason trail.
          </p>
          <div className="marketing-hero-actions">
            <Link className="marketing-primary" href="/console">
              Create a workspace <ArrowRight size={17} />
            </Link>
            <a className="marketing-secondary" href="#decision-trace">
              See a decision trace
            </a>
          </div>
          <p className="marketing-boundary-note">
            <ShieldCheck size={16} aria-hidden="true" />
            Simulation only. No cards, bank credentials, or real payments.
          </p>
        </div>

        <div className="decision-instrument" id="decision-trace">
          <div className="instrument-head">
            <div>
              <span>Authorization request</span>
              <strong>Apple · Office equipment</strong>
            </div>
            <b>$899.00</b>
          </div>
          <div className="instrument-agent">
            <span className="instrument-icon"><Bot size={18} /></span>
            <div>
              <small>Requesting agent</small>
              <strong>Procurement agent</strong>
            </div>
            <span className="instrument-status">ACTIVE</span>
          </div>
          <div className="instrument-checks">
            {decisionChecks.map(([label, value, state]) => (
              <div className="instrument-check" key={label}>
                <span className={state} aria-hidden="true">
                  {state === "pass" ? <Check size={14} /> : <Clock3 size={14} />}
                </span>
                <div><small>{label}</small><strong>{value}</strong></div>
                <em>{state === "pass" ? "PASS" : "REVIEW"}</em>
              </div>
            ))}
          </div>
          <div className="instrument-outcome">
            <span><Clock3 size={20} /></span>
            <div>
              <small>Deterministic outcome</small>
              <strong>APPROVAL_REQUIRED</strong>
              <p>Amount exceeds autonomous limit and merchant is new.</p>
            </div>
            <b>46<small>/100 risk</small></b>
          </div>
          <div className="instrument-proof">
            Policy v3 · 6 rules evaluated · AI did not authorize this request
          </div>
        </div>
      </section>

      <div className="marketing-principles" aria-label="Product principles">
        <span>Deterministic authorization</span>
        <span>Least-privilege mandates</span>
        <span>Human approval when required</span>
        <span>Machine-readable reasons</span>
      </div>

      <section className="marketing-section definition-section">
        <p className="marketing-context">Plain-language definition</p>
        <h2>What is AI-agent payment authorization?</h2>
        <p>
          AI-agent payment authorization is the control process that determines
          whether software acting on a person’s or company’s behalf may make a
          purchase. An agent can propose a merchant, amount, category, and country,
          but it should not decide its own financial permissions. Mandate checks the
          request against an active, versioned policy covering identity, status,
          available budget, transaction limits, merchant and category rules,
          geography, expiration, and review conditions. The deterministic engine
          then returns one of three machine-readable outcomes: APPROVED,
          APPROVAL_REQUIRED, or DECLINED. Risk signals may escalate a request for
          human review, but they cannot erase a hard policy failure. The language
          model is limited to converting human instructions into a proposed rule
          structure. A person reviews and activates that structure. This separation
          makes automated purchasing least-privilege, explainable, revocable, and
          auditable without representing that a real payment has occurred.
        </p>
      </section>

      <section className="marketing-section mechanism-section" id="how-it-works">
        <div className="section-intro">
          <h2>A separation of powers for every purchase request.</h2>
          <p>
            The model can help translate what you mean. It never receives the
            authority to decide what can be spent.
          </p>
        </div>
        <div className="authority-rail">
          <article>
            <span><FileCheck2 size={20} /></span>
            <div>
              <h3>Define intent</h3>
              <p>Write a mandate in plain language or configure exact rules directly.</p>
            </div>
          </article>
          <ArrowRight className="authority-arrow" aria-hidden="true" />
          <article>
            <span><ShieldCheck size={20} /></span>
            <div>
              <h3>Evaluate deterministically</h3>
              <p>Identity, budget, limits, merchants, categories, countries, and risk are checked in code.</p>
            </div>
          </article>
          <ArrowRight className="authority-arrow" aria-hidden="true" />
          <article>
            <span><UserCheck size={20} /></span>
            <div>
              <h3>Keep humans in control</h3>
              <p>Ambiguous or elevated requests stop for review with the original evidence preserved.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="marketing-section controls-section" id="controls">
        <div className="controls-copy">
          <h2>Authority is explicit, narrow, and revocable.</h2>
          <p>
            Each agent receives its own purpose, status, budget, policy version,
            and scoped credential. Pause it immediately, require review for every
            request, or revoke access entirely.
          </p>
          <ul>
            <li><Check /> Monthly and per-transaction limits</li>
            <li><Check /> Merchant, category, and country rules</li>
            <li><Check /> New-merchant and approval thresholds</li>
            <li><Check /> Pause, revoke, and approval-all controls</li>
          </ul>
        </div>
        <div className="mandate-sheet">
          <div className="mandate-sheet-head">
            <div><small>Active mandate</small><strong>Procurement agent · v3</strong></div>
            <span>ACTIVE</span>
          </div>
          <blockquote>
            “Give my procurement agent $2,000 per month. Allow software and
            office equipment. Require approval above $250 and for every new
            merchant. Block crypto, gambling, and international requests.”
          </blockquote>
          <dl>
            <div><dt>Monthly authority</dt><dd>$2,000</dd></div>
            <div><dt>Autonomous transaction</dt><dd>$250</dd></div>
            <div><dt>Allowed scope</dt><dd>Software · Office equipment</dd></div>
            <div><dt>Blocked scope</dt><dd>Crypto · Gambling · International</dd></div>
          </dl>
          <p><LockKeyhole size={14} /> Proposed by language model. Activated by a human.</p>
        </div>
      </section>

      <section className="marketing-section outcome-section">
        <div className="section-intro">
          <h2>Three outcomes. No probabilistic authorization.</h2>
          <p>Every response is predictable for software and understandable for people.</p>
        </div>
        <div className="outcome-ledger">
          <article className="approved">
            <CheckCircle2 />
            <h3>APPROVED</h3>
            <p>Every hard rule and review condition passed.</p>
          </article>
          <article className="review">
            <Clock3 />
            <h3>APPROVAL_REQUIRED</h3>
            <p>The request pauses until a human resolves it.</p>
          </article>
          <article className="declined">
            <XCircle />
            <h3>DECLINED</h3>
            <p>A hard policy boundary blocked the request.</p>
          </article>
        </div>
      </section>

      <section className="marketing-section api-section" id="api">
        <div className="api-copy">
          <h2>Put Mandate between an agent and the action it wants to take.</h2>
          <p>
            Agents, MCP servers, and your own backend submit the same authorization
            request before a purchase. Mandate returns a decision—not a payment.
          </p>
          <div className="api-facts">
            <span><KeyRound /> Scoped agent credentials</span>
            <span><Code2 /> Idempotent REST requests</span>
            <span><FileCheck2 /> Stored policy and risk evidence</span>
          </div>
        </div>
        <div className="code-ledger" aria-label="Authorization API example">
          <div><span>REQUEST</span><span>RESPONSE</span></div>
          <pre><code>{requestExample}</code></pre>
          <pre><code>{responseExample}</code></pre>
        </div>
      </section>

      <section className="marketing-section evidence-section">
        <div>
          <h2>Built for scrutiny, not magic.</h2>
          <p>
            Inspect the exact rule trace, risk factors, original decision, later
            human resolution, and linked audit event for every simulated request.
          </p>
        </div>
        <div className="evidence-chain" aria-label="Audit event sequence">
          <span>User intent</span><i />
          <span>Agent request</span><i />
          <span>Policy evaluation</span><i />
          <span>Risk evaluation</span><i />
          <span>Decision</span><i />
          <span>Human resolution</span>
        </div>
      </section>

      <section className="marketing-cta">
        <div>
          <h2>Give your agents boundaries before you give them a budget.</h2>
          <p>Create a workspace, define one mandate, and test the full decision path in simulation.</p>
        </div>
        <Link className="marketing-primary" href="/console">
          Create a workspace <ArrowRight size={17} />
        </Link>
      </section>

      <PublicFooter />
    </main>
  );
}
