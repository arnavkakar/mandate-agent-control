import type { Metadata } from "next";
import { Breadcrumbs, ResourceLayout } from "../resource-shell";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Reference documentation for Mandate agents, spending mandates, authorization decisions, risk controls, scoped API keys, and audit evidence.",
  alternates: { canonical: "/knowledge" },
};

const topics = [
  ["agents", "Agents and identity"],
  ["mandates", "Spending mandates"],
  ["decisions", "Authorization decisions"],
  ["risk", "Risk and approval"],
  ["keys", "Scoped API keys"],
  ["audit", "Audit evidence"],
] as const;

export default function KnowledgePage() {
  return (
    <ResourceLayout>
      <article className="knowledge-page" id="main-content">
        <Breadcrumbs items={[{ label: "Knowledge base" }]} />
        <header className="knowledge-head">
          <h1>Mandate knowledge base</h1>
          <p>A compact reference for the objects and decisions that make an agent purchase request governable.</p>
        </header>
        <div className="knowledge-layout">
          <aside className="knowledge-index">
            <strong>Contents</strong>
            <nav aria-label="Knowledge base topics">
              {topics.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
            </nav>
            <p>Current product scope: simulated authorization only.</p>
          </aside>
          <div className="knowledge-content">
            <section id="agents">
              <h2>Agents and identity</h2>
              <p>An agent is the software actor asking whether it may perform a purchase. In Mandate, an agent has a name, business purpose, status, budget, organization owner, and scoped credential. Identity matters because a policy is not a general company rule; it governs what one specific agent may do.</p>
              <dl>
                <div><dt>Active</dt><dd>The agent may submit requests under its current mandate.</dd></div>
                <div><dt>Paused</dt><dd>Requests stop temporarily without deleting history or policy.</dd></div>
                <div><dt>Revoked</dt><dd>The identity is terminally disabled and its credential should no longer authorize requests.</dd></div>
              </dl>
            </section>

            <section id="mandates">
              <h2>Spending mandates</h2>
              <p>A spending mandate is a structured, versioned statement of delegated financial authority. It can begin as natural language, but a human reviews and activates the structured rules. Changing a rule creates new governing state rather than rewriting the evidence attached to earlier decisions.</p>
              <div className="knowledge-rule-table">
                <div><b>Budget</b><span>How much authority exists within the monthly period.</span></div>
                <div><b>Transaction limits</b><span>What amount may proceed autonomously and when review is mandatory.</span></div>
                <div><b>Scope</b><span>Allowed or blocked categories, merchants, and countries.</span></div>
                <div><b>Conditions</b><span>Expiration, new-merchant review, and approval-for-all behavior.</span></div>
              </div>
            </section>

            <section id="decisions">
              <h2>Authorization decisions</h2>
              <p>The deterministic policy engine returns exactly one initial result. It evaluates facts and rules; the language model never selects the result.</p>
              <div className="decision-reference">
                <article><h3>APPROVED</h3><p>All hard rules and mandatory-review conditions passed.</p></article>
                <article><h3>APPROVAL_REQUIRED</h3><p>No hard rule blocked the request, but policy or risk requires a person to resolve it.</p></article>
                <article><h3>DECLINED</h3><p>At least one hard authorization boundary failed.</p></article>
              </div>
              <p>A later human approval does not rewrite the original result. It adds a resolution record showing who acted, when, and why.</p>
            </section>

            <section id="risk">
              <h2>Risk and human approval</h2>
              <p>Risk signals help decide whether an otherwise eligible request deserves additional scrutiny. Mandate’s basic factors include amount anomaly, new merchant, category mismatch, abnormal velocity, and geography mismatch. The score ranges from 0–100 and records the factors that contributed.</p>
              <p>Risk may escalate an eligible request to APPROVAL_REQUIRED. It must not convert a policy decline into an approval. This preserves explicit business rules as the final hard boundary.</p>
            </section>

            <section id="keys">
              <h2>Scoped API keys</h2>
              <p>An agent API key identifies the requesting agent to Mandate’s authorization endpoint. It sits under the agent because its authority must be narrow: it may submit purchase facts for that agent, but it cannot edit the mandate, increase the budget, approve its own request, or act as another agent.</p>
              <p>The key belongs to the integration—not to the payment instrument. A customer backend, MCP server, or agent runtime can send the key with an authorization request before attempting a downstream action. Keys should be shown once, stored as secrets, rotated when exposed, and revoked with the agent.</p>
            </section>

            <section id="audit">
              <h2>Audit evidence</h2>
              <p>An explainable decision needs more than a final status. Mandate records the request facts, mandate version, passed and failed policy checks, risk factors, initial decision, later human resolution, actor, timestamp, and linked audit event.</p>
              <p>The current audit trail is hash-linked and tamper-evident in style; it is not represented as a certified immutable ledger. Production expansion should add independent export, retention controls, verified backups, and integrity monitoring.</p>
            </section>

            <aside className="knowledge-next">
              <strong>Need the complete journey?</strong>
              <p>Read <a href="/learn/agentic-commerce">How agentic commerce works</a>, or use the <a href="/faq">FAQ</a> for shorter answers.</p>
            </aside>
          </div>
        </div>
      </article>
    </ResourceLayout>
  );
}
