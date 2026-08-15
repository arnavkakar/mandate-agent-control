import type { Metadata } from "next";
import { ArticleShell } from "../../resource-shell";
import { BLOG_AUTHOR } from "../posts";

export const metadata: Metadata = {
  title: "Risk Scores Should Not Override Policy",
  description: "Learn why probabilistic risk signals may escalate eligible AI-agent requests but must never erase a hard authorization boundary.",
  alternates: { canonical: "/blog/risk-scores-should-not-override-policy" },
  authors: [{ name: BLOG_AUTHOR }],
  openGraph: { type: "article", url: "/blog/risk-scores-should-not-override-policy", title: "Risk scores should not override policy", description: "Why risk may escalate an eligible request but cannot manufacture financial authority.", publishedTime: "2026-08-14", authors: [BLOG_AUTHOR] },
};

export default function RiskPolicyPost() {
  return (
    <ArticleShell
      section="Blog"
      title="Risk scores should not override policy."
      description="A risk score is a reason to look closer. It is not a substitute for the explicit financial authority a person granted."
      date="August 14, 2026"
      datePublished="2026-08-14"
      author={BLOG_AUTHOR}
      canonical="/blog/risk-scores-should-not-override-policy"
      readingTime="5 minute read"
      related={[
        { href: "/knowledge#risk", title: "Risk and human approval", description: "See the factors used in Mandate’s basic risk model.", type: "Knowledge" },
        { href: "/blog/agentic-commerce-needs-separation-of-powers", title: "Agentic commerce needs a separation of powers", description: "Keep interpretation, action, and authorization distinct.", type: "Point of view" },
      ]}
    >
      <section className="article-summary"><h2>The rule</h2><p><strong>Risk may make an eligible request more restrictive. It must never make an ineligible request less restrictive.</strong> That one-way relationship keeps probabilistic signals from weakening deliberate business policy.</p></section>
      <section><h2>Policy answers permission</h2><p>A spending mandate contains explicit decisions: crypto is blocked, international requests are disallowed, the agent is limited to software and office equipment, or the monthly budget is exhausted. These are not statistical predictions. They express the authority a person chose to delegate.</p><p>If a Binance request has a risk score of 8, it is still declined when cryptocurrency is blocked. A low score cannot manufacture permission.</p></section>
      <section><h2>Risk answers scrutiny</h2><p>An eligible request can still look unusual. It may involve a new merchant, an amount far above the agent’s normal pattern, rapid repeated requests, a category that does not match its purpose, or a country outside expected activity. Those signals are useful because policy cannot anticipate every operational pattern.</p><p>The safe response is escalation: return APPROVAL_REQUIRED and show the factors to a person. The reviewer can assess context without pretending the signal was a deterministic rule.</p></section>
      <section><h2>Opaque scores create false confidence</h2><p>“Risk 46” is not self-explanatory. Operators need the band definition, triggered factors, source window, and limitations. Otherwise a precise-looking number can carry more authority than its evidence deserves.</p><p>Mandate’s MVP therefore returns a score together with named factors. It does not claim a calibrated fraud model or use synthetic statistics when a workspace has no transaction history.</p></section>
      <section><h2>A monotonic control model</h2><p>Think of authorization as a one-way gate. Policy can approve, require review, or decline. Risk can leave an eligible request unchanged or move it toward more review. It cannot move a declined request toward approval. Human action can resolve a queued request, but it does not rewrite the original policy result.</p><p>This monotonic structure is easier to test and explain than a blended model where dozens of weighted signals can offset a hard business prohibition.</p></section>
      <section><h2>Design the interface around evidence</h2><p>Show the exact policy rows first, the risk factors second, and the final outcome clearly. For queued requests, keep budget impact, merchant novelty, failed or review-triggering rules, and reviewer scope visible beside the action.</p><p>Read the <a href="/knowledge#decisions">authorization-decision reference</a> for the three-state model.</p></section>
    </ArticleShell>
  );
}
