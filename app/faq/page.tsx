import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, ResourceLayout } from "../resource-shell";

export const metadata: Metadata = {
  title: "Agentic Commerce and Mandate FAQs",
  description: "Plain answers about agentic commerce, spending mandates, approvals, risk, API keys, payment boundaries, privacy, and security.",
  alternates: { canonical: "/faq" },
};

const groups = [
  {
    title: "Agentic commerce",
    items: [
      ["What is agentic commerce?", "Agentic commerce is a purchasing journey in which AI agents can discover options, make selections, and initiate or complete defined actions for a buyer. The buyer remains the source of authority."],
      ["Is this just shopping through a chatbot?", "No. Conversation may capture intent, but agentic commerce also involves identity, structured actions, merchant communication, authorization, payment infrastructure, and evidence."],
      ["Can an AI agent make purchases without asking every time?", "It can operate within pre-authorized boundaries if the operator intentionally grants that scope. Requests outside those boundaries should stop for review or be declined."],
      ["Who is responsible for an agent purchase?", "The accountable person or business cannot delegate responsibility merely by using an agent. A production system should preserve who granted authority, which rules applied, and who resolved exceptions."],
    ],
  },
  {
    title: "Mandate product model",
    items: [
      ["What does Mandate do?", "Mandate evaluates simulated agent purchase requests against deterministic financial rules and returns APPROVED, APPROVAL_REQUIRED, or DECLINED with machine-readable reasons."],
      ["Does Mandate process real payments?", "No. The current MVP stores authorization intent, simulated requests, decisions, approvals, and audit events. It does not move money or store card or bank credentials."],
      ["What is a spending mandate?", "A spending mandate is a versioned set of rules defining what one agent may spend, where, when, and under which review conditions."],
      ["Why is the policy tied to an agent?", "Least privilege requires permissions to belong to a specific identity and purpose. A travel agent should not automatically inherit the authority of a procurement agent."],
    ],
  },
  {
    title: "Decisions and approvals",
    items: [
      ["What causes APPROVED?", "The request passes every hard policy check and no policy or risk condition requires human review."],
      ["What causes APPROVAL_REQUIRED?", "The request remains eligible but crosses a review condition, such as an approval threshold, new merchant rule, or elevated risk factor."],
      ["What causes DECLINED?", "A hard boundary fails—for example, a revoked agent, expired mandate, exhausted budget, blocked merchant or category, disallowed country, or amount above a hard maximum."],
      ["Can a human approve a declined request?", "Not through the approval queue. A decline represents a hard policy failure. The operator must intentionally change the governing policy or request facts and submit a new request."],
      ["Does approving a request change its original decision?", "No. The initial APPROVAL_REQUIRED result remains part of the evidence. Human approval adds a separate resolution record."],
    ],
  },
  {
    title: "AI and risk",
    items: [
      ["Does an LLM authorize transactions?", "No. An LLM may convert natural-language instructions into a proposed structured mandate. A human reviews that proposal, and deterministic code evaluates transactions."],
      ["How does Mandate reduce prompt-injection risk?", "Natural-language instructions are treated as untrusted data. The model has no payment tools, approval authority, database access, or credentials; its structured output is schema-validated before human review."],
      ["What does the risk score mean?", "It is a 0–100 indicator derived from recorded factors such as amount anomaly, merchant novelty, category mismatch, velocity, and geography. It supports review rather than replacing policy."],
      ["Can a low risk score override a blocked rule?", "No. A hard policy failure remains DECLINED regardless of the risk score."],
    ],
  },
  {
    title: "Integrations and credentials",
    items: [
      ["What is an agent API key for?", "It lets an integration identify one agent when submitting structured authorization requests. The key cannot expand its own permissions or approve requests."],
      ["Why are API keys shown under an agent?", "The credential is scoped to that agent’s identity. This prevents one integration from silently acting with another agent’s budget or policy."],
      ["Can an MCP server connect to Mandate?", "Architecturally yes: an MCP tool could call Mandate’s authorization API before a purchase action. The MVP does not claim a packaged MCP connector or external production integration."],
      ["Where does transaction data come from?", "A customer backend, agent runtime, MCP server, or simulator submits merchant, amount, category, country, and idempotency information. Mandate is the system of record for the resulting authorization evidence."],
    ],
  },
  {
    title: "Data, security, and scope",
    items: [
      ["Does Mandate store card numbers?", "No. Card numbers, CVVs, bank credentials, and real payment-provider secrets are outside the MVP’s scope."],
      ["Is the audit trail immutable?", "It is hash-linked and designed to make changes evident, but the portfolio MVP does not claim certified immutability. Production maturity requires independent exports, retention controls, and monitored integrity checks."],
      ["Is Mandate a bank or payment processor?", "No. Mandate is currently a simulated authorization and risk-control application, not a bank, money transmitter, card network, or payment processor."],
    ],
  },
] as const;

export default function FAQPage() {
  const questions = groups.flatMap((group) => group.items);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <ResourceLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="faq-page" id="main-content">
        <Breadcrumbs items={[{ label: "FAQs" }]} />
        <header className="faq-head">
          <h1>Questions worth answering before an agent can spend.</h1>
          <p>Plain-language answers about the category, the control model, and Mandate’s current simulation boundary.</p>
        </header>
        <div className="faq-layout">
          <nav className="faq-index" aria-label="FAQ categories">
            {groups.map((group) => <a href={`#${group.title.toLowerCase().replaceAll(" ", "-").replaceAll(",", "")}`} key={group.title}>{group.title}<span>{group.items.length}</span></a>)}
          </nav>
          <div className="faq-groups">
            {groups.map((group) => {
              const id = group.title.toLowerCase().replaceAll(" ", "-").replaceAll(",", "");
              return (
                <section id={id} key={group.title}>
                  <h2>{group.title}</h2>
                  <div className="faq-questions">
                    {group.items.map(([question, answer]) => (
                      <details key={question}>
                        <summary>{question}</summary>
                        <p>{answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <aside className="faq-next"><strong>Need the connected story?</strong><p>Read <Link href="/learn/agentic-commerce">the practical guide to agentic commerce</Link> or browse the <Link href="/knowledge">Mandate knowledge base</Link>.</p></aside>
      </article>
    </ResourceLayout>
  );
}
