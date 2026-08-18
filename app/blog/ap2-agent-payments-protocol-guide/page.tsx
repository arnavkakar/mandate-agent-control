import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";
import { BLOG_AUTHOR } from "../posts";

const canonical = "/blog/ap2-agent-payments-protocol-guide";

export const metadata: Metadata = {
  title: "AP2 Protocol Guide: Agent Payment Mandates",
  description: "Understand AP2, its intent, checkout, and payment mandates, how signed authorization works, and where internal spending controls still fit.",
  alternates: { canonical },
  authors: [{ name: BLOG_AUTHOR }],
  openGraph: {
    type: "article",
    url: canonical,
    title: "AP2 and the agent payments protocol, explained",
    description: "A practical guide to AP2 mandates, authorization evidence, and agent-initiated payments.",
    publishedTime: "2026-08-17",
    authors: [BLOG_AUTHOR],
  },
};

export default function Ap2GuidePost() {
  return (
    <ArticleShell
      section="Blog"
      title="AP2 and the agent payments protocol, explained"
      description="AP2 is an open protocol for carrying verifiable user authorization through agent-led commerce. Its central idea is a mandate: signed evidence that binds an agent&apos;s action to human intent."
      date="August 17, 2026"
      datePublished="2026-08-17"
      canonical={canonical}
      author={BLOG_AUTHOR}
      readingTime="11 minute read"
      related={[
        { href: "/blog/what-are-agentic-payments", title: "What are agentic payments?", description: "See where protocols fit in the complete payment journey.", type: "Pillar guide" },
        { href: "/blog/what-is-an-ai-agent-payment-mandate", title: "What is an AI-agent payment mandate?", description: "Compare protocol evidence with an internal business policy.", type: "Explainer" },
        { href: "/learn/agentic-commerce", title: "What is agentic commerce?", description: "Understand the broader discovery-to-purchase journey.", type: "Field guide" },
      ]}
    >
      <section className="article-summary">
        <h2>AP2 in one paragraph</h2>
        <p><strong>The Agent Payments Protocol, or AP2, defines a way for agents, merchants, credential providers, payment processors, and other participants to exchange verifiable proof of user authorization.</strong> Rather than treating a chat message as sufficient consent, AP2 uses typed, signed mandates that describe intent and bind approval to a checkout or payment.</p>
      </section>

      <section>
        <h2>What problem AP2 is trying to solve</h2>
        <p>Traditional online checkout assumes a person is present to select a product, review the final amount, authenticate, and approve the payment. An agent-led journey can split those moments across different systems and times. The user may give a broad instruction first, while the agent discovers a merchant and assembles a cart later.</p>
        <p>That creates a proof problem. A merchant or payment participant needs to know which agent is acting, whether the user delegated the task, what constraints were granted, and whether the final checkout still matches that authority. AP2 makes those claims portable and verifiable.</p>
        <p>The protocol does not make model output authoritative. The <a href="https://ap2-protocol.org/ap2/specification/">official AP2 specification</a> explicitly requires deterministic code for validation or processing performed by a role.</p>
      </section>

      <section>
        <h2>The AP2 mandate types</h2>
        <div className="article-table-wrap">
          <table>
            <thead><tr><th>Mandate</th><th>What it represents</th><th>Who relies on it</th></tr></thead>
            <tbody>
              <tr><td>Intent Mandate</td><td>The user&apos;s delegated purchasing intent and constraints</td><td>Agents and downstream participants that need proof of delegation</td></tr>
              <tr><td>Checkout Mandate</td><td>Authorization for a particular merchant checkout</td><td>The merchant verifying the assembled purchase</td></tr>
              <tr><td>Payment Mandate</td><td>Authorization to pay for a checkout to which the mandate is cryptographically bound</td><td>Credential provider, network, and merchant payment processor</td></tr>
            </tbody>
          </table>
        </div>
        <p>AP2 supports different journeys. In a human-present flow, a person can review a completed checkout before signing. In a delegated flow, an earlier intent can define what the agent may pursue, and later evidence can show that the resulting checkout remained within scope.</p>
      </section>

      <section>
        <h2>One AP2-style journey</h2>
        <ol className="journey-ledger">
          <li><b>01</b><span><strong>Delegate intent</strong>A company authorizes an agent to renew approved software within a defined limit and time window.</span></li>
          <li><b>02</b><span><strong>Build checkout</strong>The shopping agent finds the renewal and obtains merchant-signed checkout details.</span></li>
          <li><b>03</b><span><strong>Evaluate constraints</strong>Deterministic code verifies identity, scope, amount, merchant, expiration, and any required human review.</span></li>
          <li><b>04</b><span><strong>Bind authorization</strong>The checkout and payment mandates are signed and tied to the specific checkout rather than a reusable vague instruction.</span></li>
          <li><b>05</b><span><strong>Verify and respond</strong>Relevant participants verify the mandate and return signed receipts for acceptance or rejection.</span></li>
        </ol>
        <p>The cryptographic details matter because they reduce ambiguity and replay. A permission for one checkout should not become a transferable approval for a different merchant, cart, or amount.</p>
      </section>

      <section>
        <h2>AP2, UCP, A2A, and MCP are not the same thing</h2>
        <p>These protocol names appear together because agent systems often need several kinds of interoperability. They solve different problems.</p>
        <ul className="article-checklist">
          <li><strong>AP2</strong> carries authorization and payment-related mandate evidence.</li>
          <li><strong>UCP</strong> provides a shared language for commerce capabilities and checkout journeys.</li>
          <li><strong>A2A</strong> helps agents communicate and coordinate tasks with other agents.</li>
          <li><strong>MCP</strong> helps models and agents connect to tools, data, and external capabilities.</li>
        </ul>
        <p>Google&apos;s <a href="https://developers.googleblog.com/en/developers-guide-to-ai-agent-protocols/">developer guide to AI-agent protocols</a> explains the division succinctly: commerce protocols can handle what is being ordered, while AP2 adds evidence about who approved it and the applicable guardrails.</p>
      </section>

      <section>
        <h2>AP2 does not replace internal authorization policy</h2>
        <p>Protocol evidence must originate from an actual authority decision. A small business still needs a source of truth for which agents exist, their status, budgets, approval thresholds, permitted categories, merchant rules, countries, and expiration. It also needs roles for the people allowed to change those rules.</p>
        <p>An internal authorization layer can evaluate those facts and produce a decision. AP2 can then help represent and convey appropriate proof to other parties in the commerce and payment flow. The two layers answer connected but distinct questions: internal policy decides whether the business permits the action; protocol mandates help other participants verify the relevant delegation and transaction binding.</p>
      </section>

      <section>
        <h2>What a serious implementation must verify</h2>
        <ul className="article-checklist">
          <li>The signer, agent, user, merchant, and payment participants have authenticated identities.</li>
          <li>The mandate type and schema version match exactly what the verifier supports.</li>
          <li>Signatures, keys, timestamps, expiration, audience, and replay protections are valid.</li>
          <li>The mandate is bound to the intended checkout, amount, currency, merchant, and operation.</li>
          <li>The underlying business policy still has sufficient budget and has not been paused, revoked, or superseded.</li>
          <li>Receipts preserve the outcome without rewriting the original request or authorization evidence.</li>
        </ul>
      </section>

      <section>
        <h2>Where human approval belongs</h2>
        <p>Human review should occur before an authorization is signed or released when a rule requires it. Examples include a new merchant, an amount above an autonomous threshold, a category exception, or elevated risk.</p>
        <p>The reviewer needs the final checkout facts and the policy evidence—not only an agent-generated summary. Approval should be scoped to the specific request unless the person separately changes the standing policy. This prevents one exception from silently becoming a broad permission.</p>
      </section>

      <section>
        <h2>How AP2 relates to Mandate</h2>
        <p>Mandate&apos;s terminology shares an architectural idea with AP2: agents should operate under explicit, inspectable authority. Mandate currently implements its own simulated business authorization workflow; it is not an AP2 implementation and does not claim protocol interoperability.</p>
        <p>A future adapter could map an approved internal decision into the appropriate protocol artifact, provided the integration follows the live specification, cryptographic requirements, identity model, and participant obligations. Until then, it is important to distinguish architectural compatibility from a working integration.</p>
        <p>For the broader category, start with <a href="/blog/what-are-agentic-payments">how agentic payments work</a>. For the internal control object, read <a href="/blog/what-is-an-ai-agent-payment-mandate">what an AI-agent payment mandate contains</a>.</p>
      </section>
    </ArticleShell>
  );
}
