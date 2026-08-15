import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";
import { BLOG_AUTHOR } from "../posts";

export const metadata: Metadata = {
  title: "From User Intent to an Auditable Purchase Request",
  description: "Follow the identities, policy versions, transaction facts, decisions, and human resolutions required for auditable AI-agent purchasing.",
  alternates: { canonical: "/blog/from-user-intent-to-auditable-purchase-request" },
  authors: [{ name: BLOG_AUTHOR }],
  openGraph: { type: "article", url: "/blog/from-user-intent-to-auditable-purchase-request", title: "From user intent to an auditable purchase request", description: "The evidence chain required to make an AI-agent purchase decision explainable.", publishedTime: "2026-08-14", authors: [BLOG_AUTHOR] },
};

export default function AuditableRequestPost() {
  return (
    <ArticleShell
      section="Blog"
      title="From user intent to an auditable purchase request."
      description="An audit trail becomes useful only when it preserves the chain of authority—not merely a timestamp and a final status."
      date="August 14, 2026"
      datePublished="2026-08-14"
      author={BLOG_AUTHOR}
      canonical="/blog/from-user-intent-to-auditable-purchase-request"
      readingTime="6 minute read"
      related={[
        { href: "/knowledge#mandates", title: "Spending mandates", description: "Reference the rules that establish delegated authority.", type: "Knowledge" },
        { href: "/faq", title: "Mandate FAQs", description: "Get shorter answers about decisions, keys, and approvals.", type: "FAQ" },
      ]}
    >
      <section className="article-summary"><h2>The useful unit is a trace</h2><p><strong>A trustworthy purchase record connects human intent, agent identity, evaluated facts, policy version, risk evidence, deterministic result, and any later human resolution.</strong> Remove one link and the operator is forced to reconstruct authority from assumptions.</p></section>
      <section><h2>Start with the authority that existed</h2><p>Suppose an operator gives a procurement agent a $2,000 monthly budget, allows software and office equipment, permits autonomous transactions up to $250, and requires review for every new merchant. The system should save the structured rule as a version with an activation time and actor.</p><p>If the operator later raises the autonomous limit, earlier requests must still point to the version that governed them. Otherwise a historical decision can appear justified by a rule that did not yet exist.</p></section>
      <section><h2>Record the request as facts</h2><p>For a $96 Notion renewal, store the requesting agent, normalized amount and currency, merchant identity, category, country, merchant-novelty state, request time, and idempotency key. The raw agent explanation can provide context, but it should not substitute for the fields the policy engine actually evaluated.</p><p>Idempotency matters because agents retry. A repeated network request should retrieve the original result, not consume the budget twice or create two approval records.</p></section>
      <section><h2>Keep policy evidence and risk evidence separate</h2><p>The policy trace might say the agent is active, the mandate is current, $1,904 remains, software is allowed, and $96 is below the autonomous threshold. The risk trace might note that Notion is a known merchant and the amount matches prior behavior.</p><p>These are different claims. Policy establishes permission; risk asks whether eligible behavior deserves additional scrutiny. Storing them separately prevents a single opaque score from hiding which business rule mattered.</p></section>
      <section><h2>Append the human action</h2><p>For an $899 Apple request, policy could return APPROVAL_REQUIRED because the amount exceeds the autonomous limit and the merchant is new. If a reviewer approves it, save the reviewer, optional note, time, and scope of that approval. “Approve once” should mean this request only—not a silent merchant allowlist change.</p><p>The original result remains. The human action is a later, explicit resolution. That distinction is what lets an auditor answer both “what did the system decide?” and “what did the person decide afterward?”</p></section>
      <section><h2>Make the evidence usable</h2><p>A hash-linked event log can make tampering more evident, but a useful interface must also translate identifiers and payloads into a readable sequence. Operators need the merchant, amount, agent, exact rule rows, risk factors, policy version, and actor—not just a digest.</p><p>The <a href="/knowledge#audit">audit-evidence reference</a> describes Mandate’s current MVP boundary and what production maturity would add.</p></section>
    </ArticleShell>
  );
}
