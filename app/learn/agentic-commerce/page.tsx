import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";

export const metadata: Metadata = {
  title: "What Is Agentic Commerce? A Practical Guide",
  description: "Understand how AI agents discover, request, authorize, and eventually complete purchases—and where deterministic controls fit.",
  alternates: { canonical: "/learn/agentic-commerce" },
};

export default function AgenticCommerceGuide() {
  return (
      <ArticleShell
        section="Field guide"
        title="What is agentic commerce?"
        description="Agentic commerce begins when software does more than recommend: it takes bounded actions in a purchasing journey on behalf of a person or business."
        date="August 14, 2026"
        datePublished="2026-08-14"
        canonical="/learn/agentic-commerce"
        readingTime="12 minute guide"
        related={[
          { href: "/blog/what-are-agentic-payments", title: "What are agentic payments?", description: "Go deeper on intent, authorization, execution, and evidence.", type: "Pillar guide" },
          { href: "/knowledge", title: "Mandate knowledge base", description: "Reference the controls that govern an authorization request.", type: "Reference" },
          { href: "/blog/ai-agents-in-procurement-controls", title: "AI agents in procurement", description: "Apply the model to a practical business workflow.", type: "Use-case guide" },
        ]}
      >
        <section className="article-summary">
          <h2>The short definition</h2>
          <p><strong>Agentic commerce is a purchasing journey in which an AI agent can discover options, make selections, and initiate or complete defined actions for a buyer.</strong> The buyer may be an individual or a company. The important change is not conversational shopping; it is delegated action. Once an agent can act, the system needs identity, authenticated intent, spending boundaries, risk controls, approval paths, and durable evidence.</p>
        </section>

        <section>
          <h2>One journey from request to decision</h2>
          <p>Imagine a small company gives a procurement agent the task: “Renew our Notion workspace if the monthly charge remains under $120.” A controlled journey looks like this:</p>
          <ol className="journey-ledger">
            <li><b>1</b><span><strong>A person defines intent.</strong>The operator names the purpose, budget, categories, limits, and conditions requiring review.</span></li>
            <li><b>2</b><span><strong>The agent finds an option.</strong>It identifies Notion, the $96 amount, the software category, and the merchant country.</span></li>
            <li><b>3</b><span><strong>The agent requests authority.</strong>It submits structured transaction facts using its own scoped credential. It does not submit a verdict.</span></li>
            <li><b>4</b><span><strong>Policy evaluates the request.</strong>Deterministic code checks identity, agent status, remaining budget, limits, merchant and category rules, geography, and expiration.</span></li>
            <li><b>5</b><span><strong>Risk can escalate.</strong>A new merchant, unusual amount, velocity spike, or geography mismatch can require human review, but risk cannot erase a hard decline.</span></li>
            <li><b>6</b><span><strong>A decision and evidence return.</strong>The response is APPROVED, APPROVAL_REQUIRED, or DECLINED, with the exact checks and risk factors recorded.</span></li>
          </ol>
          <p>In Mandate’s current MVP, the flow ends with a simulated authorization decision. No payment is sent and no card or bank credential is involved.</p>
        </section>

        <section>
          <h2>The systems have different jobs</h2>
          <div className="article-table-wrap">
            <table>
              <thead><tr><th>System</th><th>Its job</th><th>What it must not assume</th></tr></thead>
              <tbody>
                <tr><td>Person or business</td><td>Define intent and remain accountable</td><td>That a vague prompt is a complete financial policy</td></tr>
                <tr><td>AI agent</td><td>Discover, compare, select, and request</td><td>That completing a task means it may authorize itself</td></tr>
                <tr><td>Authorization layer</td><td>Apply identity, policy, budget, and review rules</td><td>That model confidence is financial permission</td></tr>
                <tr><td>Merchant or commerce protocol</td><td>Describe products, carts, checkout, and order state</td><td>That an agent request proves buyer authorization</td></tr>
                <tr><td>Payment provider</td><td>Move money using protected payment infrastructure</td><td>That payment acceptance replaces upstream intent controls</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Why mandates are becoming important</h2>
          <p>Industry protocols increasingly separate the commercial action from proof of authority. Google’s developer guidance describes the <a href="https://developers.googleblog.com/en/developers-guide-to-ai-agent-protocols/">Agent Payments Protocol</a> as a layer of typed mandates and configurable guardrails, while the <a href="https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/">Universal Commerce Protocol</a> focuses on the commerce journey between buyer surfaces, businesses, and payment providers. <a href="https://www.visa.com/en-us/solutions/intelligent-commerce">Visa’s official Intelligent Commerce overview</a> describes agentic commerce as discovery, decision, and transaction activity performed with user permission and clear controls. <a href="https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens">Stripe’s current documentation</a> similarly emphasizes scoped payment credentials for agent-initiated purchases.</p>
          <p>These references show a shared architectural direction, not a Mandate integration claim. Mandate currently simulates the authorization-control layer and is not connected to AP2, UCP, Visa, Stripe, or any real payment network.</p>
        </section>

        <section>
          <h2>Where Mandate is relevant</h2>
          <p>Commerce protocols can help an agent communicate with a merchant, and payment providers can protect credentials and execute a charge. A business still needs to answer an internal question before either step: <em>is this specific agent allowed to make this specific purchase, under the authority we granted?</em></p>
          <p>Mandate models that decision point. It gives each agent a narrow identity, a versioned policy, a budget envelope, scoped credentials, risk escalation, human review, and an audit trail. That makes it suitable as an authorization gateway placed between an agent’s proposed action and a future downstream commerce or payment adapter.</p>
        </section>

        <section>
          <h2>What a production design should preserve</h2>
          <ul className="article-checklist">
            <li>Authenticate the person, organization, and requesting agent separately.</li>
            <li>Represent financial permissions as structured, versioned rules.</li>
            <li>Keep the authorization decision deterministic and independently testable.</li>
            <li>Require explicit human review for ambiguity or elevated risk.</li>
            <li>Bind every decision to the policy version and facts evaluated at that moment.</li>
            <li>Use idempotency and budget reservations to prevent duplicate or concurrent overspend.</li>
            <li>Keep payment credentials outside the agent and authorization model whenever possible.</li>
          </ul>
          <p>Continue with the <a href="/knowledge">Mandate knowledge base</a> for the product vocabulary or review the <a href="/faq">frequently asked questions</a>.</p>
        </section>
      </ArticleShell>
  );
}
