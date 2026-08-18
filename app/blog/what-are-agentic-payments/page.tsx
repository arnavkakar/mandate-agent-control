import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";
import { BLOG_AUTHOR } from "../posts";

const canonical = "/blog/what-are-agentic-payments";

export const metadata: Metadata = {
  title: "What Are Agentic Payments? A Practical Guide",
  description: "Learn how agentic payments work across intent, authorization, checkout, payment execution, and audit evidence—with one practical business example.",
  alternates: { canonical },
  authors: [{ name: BLOG_AUTHOR }],
  openGraph: {
    type: "article",
    url: canonical,
    title: "What are agentic payments?",
    description: "A practical guide to the systems, controls, and evidence behind AI-agent payments.",
    publishedTime: "2026-08-17",
    authors: [BLOG_AUTHOR],
  },
};

export default function AgenticPaymentsPost() {
  return (
    <ArticleShell
      section="Blog"
      title="What are agentic payments?"
      description="Agentic payments are payment journeys in which an AI agent can initiate purchasing actions for a person or business. Safe implementations separate what the agent wants to do from who authorized it and how money moves."
      date="August 17, 2026"
      datePublished="2026-08-17"
      canonical={canonical}
      author={BLOG_AUTHOR}
      readingTime="13 minute read"
      related={[
        { href: "/blog/ap2-agent-payments-protocol-guide", title: "AP2 and the agent payments protocol, explained", description: "Understand typed mandates, signed intent, and payment receipts.", type: "Protocol guide" },
        { href: "/blog/what-is-an-ai-agent-payment-mandate", title: "What is an AI-agent payment mandate?", description: "See how delegated authority becomes a versioned policy.", type: "Explainer" },
        { href: "/learn/agentic-commerce", title: "What is agentic commerce?", description: "Follow the broader journey from discovery through controlled action.", type: "Field guide" },
      ]}
    >
      <section className="article-summary">
        <h2>The short answer</h2>
        <p><strong>An agentic payment is a payment initiated or prepared by an AI agent acting under delegated authority.</strong> The agent may discover a product, assemble a purchase, and submit a payment request. That does not mean the model should decide whether the request is authorized. A robust design keeps intent, authorization, and payment execution as separate layers.</p>
      </section>

      <section>
        <h2>A practical agentic-payment example</h2>
        <p>A small company asks a procurement agent to renew ordinary software subscriptions. The agent finds a $96 Notion renewal and prepares a request containing the merchant, amount, currency, category, country, and a unique request identifier.</p>
        <p>Before anything can proceed, a control layer checks the agent&apos;s identity and status, the company&apos;s active mandate, remaining monthly budget, transaction limit, merchant history, category rules, geography, and expiration. If every required rule passes, the result can be APPROVED. If Notion is a new merchant, the result can be APPROVAL_REQUIRED. If the agent is paused or software is outside its allowed scope, the result is DECLINED.</p>
        <p>Only after authorization would a production integration hand a tightly bound approval to a payment provider. Mandate currently models the control and evidence layer; it does not move money or store payment credentials.</p>
      </section>

      <section>
        <h2>The five parts of an agentic payment</h2>
        <div className="article-table-wrap">
          <table>
            <thead><tr><th>Part</th><th>Question it answers</th><th>Typical system</th></tr></thead>
            <tbody>
              <tr><td>Intent</td><td>What outcome is the buyer asking for?</td><td>User interface and AI agent</td></tr>
              <tr><td>Identity</td><td>Which user, business, and agent are acting?</td><td>Authentication and agent credentials</td></tr>
              <tr><td>Authorization</td><td>Is this specific request permitted now?</td><td>Deterministic policy and risk controls</td></tr>
              <tr><td>Execution</td><td>How is the approved payment submitted?</td><td>Payment provider, wallet, or network</td></tr>
              <tr><td>Evidence</td><td>What happened, under which rules, and why?</td><td>Receipts and audit trail</td></tr>
            </tbody>
          </table>
        </div>
        <p>This separation is not only Mandate&apos;s product thesis. An <a href="https://www.elibrary.imf.org/view/journals/068/2026/004/article-A001-en.xml">IMF analysis of agentic payments</a> uses a three-layer framework of intent, authorization, and settlement, and highlights the tension between probabilistic AI behavior and deterministic payment infrastructure.</p>
      </section>

      <section>
        <h2>Agentic payments are not one payment rail</h2>
        <p>The phrase describes a category of purchasing behavior, not a single network or protocol. Several systems can participate in the same journey.</p>
        <ul className="article-checklist">
          <li>Commerce protocols can describe products, carts, checkout state, and post-purchase actions.</li>
          <li>Authorization protocols can carry proof of user intent or bind authority to a particular checkout.</li>
          <li>Payment networks can authenticate agents, tokenize credentials, apply fraud controls, and execute transactions.</li>
          <li>HTTP payment protocols can let software pay for digital resources in response to a 402 challenge.</li>
          <li>Business control layers can enforce internal budgets, roles, merchant rules, and human approvals before execution.</li>
        </ul>
        <p>For example, <a href="https://www.visa.com/en-us/solutions/intelligent-commerce">Visa Intelligent Commerce</a> describes payment credentials, controls, authentication, and protections for AI-initiated transactions. <a href="https://www.mastercard.com/us/en/business/artificial-intelligence/mastercard-agent-pay.html">Mastercard Agent Pay</a> emphasizes registered agent identity, tokenization, and verifiable intent. Cloudflare&apos;s <a href="https://developers.cloudflare.com/agents/tools/payments/">agentic-payments documentation</a> describes x402 and Machine Payments Protocol flows for programmatic HTTP purchases.</p>
      </section>

      <section>
        <h2>Why an AI agent should request, not self-authorize</h2>
        <p>Large language models are useful for interpreting goals, comparing options, and producing structured requests. Their outputs remain probabilistic. A model can misunderstand a constraint, work from stale information, or be influenced by untrusted text found in an email, website, document, or tool response.</p>
        <p>If the same model can reinterpret the policy and approve the action it proposes, the boundary is circular. The agent can effectively expand its own authority. A deterministic engine avoids that problem by evaluating validated transaction facts against an active, versioned policy outside the model.</p>
        <p>The result should be a small state machine: APPROVED, APPROVAL_REQUIRED, or DECLINED. Each state needs machine-readable reasons, the policy version used, evaluated facts, and risk factors. This makes the decision repeatable and explainable.</p>
      </section>

      <section>
        <h2>Controls an agentic-payment system needs</h2>
        <p>A production control layer should evaluate more than a single spending cap. Useful boundaries include authenticated agent identity, active or paused status, aggregate budget, per-transaction maximum, approval threshold, merchant and category allowlists or blocklists, country rules, expiration, and new-merchant treatment.</p>
        <p>Risk can add scrutiny for an unusual amount, abnormal velocity, category mismatch, new merchant, or geography mismatch. Risk should be monotonic: it may escalate an otherwise eligible request, but it must not turn an explicit policy failure into an approval.</p>
        <p>Human approval is not a fallback for every weak rule. It is a deliberately scoped state for ambiguity and elevated risk. The reviewer should see the request, exact rule that triggered review, remaining budget, merchant history, risk factors, and the effect of the decision.</p>
      </section>

      <section>
        <h2>How protocols fit together</h2>
        <p>The <a href="https://ap2-protocol.org/ap2/specification/">AP2 specification</a> defines checkout and payment mandates designed to provide cryptographic proof that a shopping agent is authorized for a particular checkout. Its specification also states that required validation must happen in deterministic code. That makes AP2 relevant to proof that crosses system boundaries.</p>
        <p>An internal policy engine answers a related but different business question: whether this agent&apos;s proposed purchase fits the organization&apos;s rules at that moment. A future architecture could evaluate the internal mandate first, then use an external protocol or provider to carry a bound authorization toward checkout and payment. These components can complement one another; one should not be presented as a replacement for all the others.</p>
      </section>

      <section>
        <h2>What buyers should ask vendors</h2>
        <ul className="article-checklist">
          <li>Can the AI model or agent change the policy used to authorize its own request?</li>
          <li>Is every agent separately authenticated and limited to its own organization and scope?</li>
          <li>Are budgets reserved atomically so concurrent requests cannot overspend?</li>
          <li>Does every decision preserve the exact inputs, policy version, checks, and reviewer action?</li>
          <li>Are payment credentials isolated from prompts, models, logs, and ordinary application data?</li>
          <li>Can operators pause an agent, revoke credentials, require review, and investigate failures quickly?</li>
        </ul>
      </section>

      <section>
        <h2>Where Mandate fits</h2>
        <p>Mandate focuses on the control and authorization layer for business agents. It turns user-defined authority into structured rules, evaluates requests deterministically, escalates defined cases to people, and preserves an explainable audit trail.</p>
        <p>To go deeper, read how an <a href="/blog/what-is-an-ai-agent-payment-mandate">AI-agent payment mandate</a> represents delegated authority, compare the main <a href="/blog/ap2-agent-payments-protocol-guide">AP2 mandate types</a>, or use the guide to <a href="/blog/how-to-set-spending-limits-for-ai-agents">setting AI-agent spending limits</a>.</p>
      </section>
    </ArticleShell>
  );
}
