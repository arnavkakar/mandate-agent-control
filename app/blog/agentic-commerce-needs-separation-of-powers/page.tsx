import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";

export const metadata: Metadata = {
  title: "Agentic Commerce Needs a Separation of Powers",
  description: "Why the model interpreting a purchase request should never be the system granting financial authority.",
  alternates: { canonical: "/blog/agentic-commerce-needs-separation-of-powers" },
};

export default function SeparationOfPowersPost() {
  return (
    <ArticleShell
      section="Blog"
      title="Agentic commerce needs a separation of powers."
      description="The model can understand what a person means. That does not make it the right place to decide what the person is financially allowed to do."
      date="August 14, 2026"
      datePublished="2026-08-14"
      canonical="/blog/agentic-commerce-needs-separation-of-powers"
      readingTime="7 minute read"
      related={[
        { href: "/learn/agentic-commerce", title: "What is agentic commerce?", description: "See the complete journey from intent to authorization evidence.", type: "Field guide" },
        { href: "/blog/risk-scores-should-not-override-policy", title: "Risk scores should not override policy", description: "Keep probabilistic escalation separate from hard rules.", type: "Design principle" },
      ]}
    >
      <section className="article-summary"><h2>The argument</h2><p><strong>Delegated action needs an independent authorization boundary.</strong> The software proposing a purchase can be flexible and probabilistic. The system granting financial permission should be deterministic, narrow, and accountable to rules a person deliberately activated.</p></section>
      <section><h2>Interpretation and authority solve different problems</h2><p>A language model is useful when a business owner says, “Let the procurement agent renew ordinary software, but ask me before it tries a new vendor.” The model can identify likely fields: software is allowed, new merchants need review, and the rule applies to the procurement agent.</p><p>That translation is still a proposal. Language is ambiguous, models can misunderstand it, and hostile content can attempt to redirect the interpretation. Financial authority should not inherit those uncertainties. A person must be able to inspect the structured rule, correct it, and activate a specific version.</p></section>
      <section><h2>The agent should request, not rule</h2><p>An agent attempting to renew Notion should submit facts: its identity, merchant, amount, category, country, and a unique request key. It should not send “approved” as an instruction that the control system trusts. The authorization layer derives the result from authenticated identity, active policy, budget state, transaction limits, merchant rules, geography, and review conditions.</p><p>This pattern resembles separation of duties in finance and security. The actor performing work is not the sole actor certifying that its work was permitted.</p></section>
      <section><h2>Human review is a resolution, not a rewrite</h2><p>When policy returns APPROVAL_REQUIRED, the initial result should remain intact. A human approval adds a second event: who reviewed the request, what evidence was available, what note they supplied, and when the resolution occurred. Preserving both states makes the system explainable after the fact.</p><p>Likewise, a hard decline should not become a one-click approval. The operator can change the policy intentionally and submit a new request, but the original failure remains evidence that the prior authority did not allow the action.</p></section>
      <section><h2>Protocols are moving toward explicit authority</h2><p>Google’s description of the <a href="https://developers.googleblog.com/en/developers-guide-to-ai-agent-protocols/">Agent Payments Protocol</a> emphasizes typed mandates and proof of intent alongside commerce protocols. <a href="https://developer.visa.com/use-cases/visa-intelligent-commerce-for-agents">Visa’s agentic-commerce materials</a> similarly emphasize authenticated instructions, controls, and transparency. These efforts differ in implementation, but the shared architectural point is important: an agent’s capability to act is not itself proof that the action was authorized.</p><p>Mandate is not integrated with these networks today. It models the upstream business-control question they make more urgent.</p></section>
      <section><h2>The practical test</h2><p>Ask one question of any agent-payment design: <em>Could the agent, model, or untrusted content it encounters expand the authority used to approve this same request?</em> If the answer is yes, the boundary is circular.</p><p>A safer design lets models interpret, agents request, deterministic code authorize, and people resolve exceptions. See the <a href="/knowledge">knowledge base</a> for how Mandate represents each part.</p></section>
    </ArticleShell>
  );
}
