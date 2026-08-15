import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, FileText, HelpCircle, ShieldCheck } from "lucide-react";
import { ResourceLayout, ResourceLedger } from "../resource-shell";

/*
THESIS: A field guide to controlled agentic commerce, not a generic content-card library.
OWN-WORLD: Warm registry paper, ruled ledgers, dense ochre index band, sparse editorial face.
STORY: Understand the category, inspect Mandate's control model, answer objections, then test it.
FIRST VIEWPORT: Large editorial title above a dense four-part index band and one primary guide.
FORM: Field-guide sleeve with index band, assigned structure 4, seed bba6eded.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
*/

export const metadata: Metadata = {
  title: "Resource Center",
  description: "Guides, explanations, FAQs, and practical references for understanding agentic commerce and deterministic authorization.",
  alternates: { canonical: "/resources" },
};

const foundations = [
  {
    href: "/learn/agentic-commerce",
    title: "How agentic commerce works",
    description: "Follow one business purchase from human intent through agent action, authorization, payment infrastructure, and audit evidence.",
    type: "Field guide",
    meta: "12 min",
  },
  {
    href: "/faq",
    title: "Agentic commerce and Mandate FAQs",
    description: "Plain answers about agents, mandates, approvals, API keys, risk, privacy, and the simulation boundary.",
    type: "FAQ",
    meta: "24 answers",
  },
];

const productReferences = [
  {
    href: "/knowledge",
    title: "Mandate knowledge base",
    description: "A working reference for authorization decisions, spending mandates, scoped credentials, risk escalation, and audit records.",
    type: "Reference",
    meta: "6 topics",
  },
  {
    href: "/security",
    title: "Security and trust boundary",
    description: "See why the language model cannot authorize, how untrusted instructions are contained, and which production controls remain planned.",
    type: "Security",
    meta: "Current model",
  },
];

const editorial = [
  {
    href: "/blog/agentic-commerce-needs-separation-of-powers",
    title: "Agentic commerce needs a separation of powers",
    description: "Why the system interpreting a request should not be the system granting financial authority.",
    type: "Point of view",
    meta: "7 min",
  },
  {
    href: "/blog/from-user-intent-to-auditable-purchase-request",
    title: "From user intent to an auditable purchase request",
    description: "A concrete trace of what must be recorded before an agent-initiated purchase can be trusted.",
    type: "Explainer",
    meta: "6 min",
  },
  {
    href: "/blog/risk-scores-should-not-override-policy",
    title: "Risk scores should not override policy",
    description: "Risk is useful for escalation. It should never erase an explicit financial boundary.",
    type: "Design principle",
    meta: "5 min",
  },
];

export default function ResourcesPage() {
  return (
    <ResourceLayout>
      <div id="main-content">
        <header className="resource-hero">
          <div>
            <h1>The field guide to controlled agentic commerce.</h1>
            <p>Understand what changes when software can buy, where authorization belongs, and how Mandate keeps humans and deterministic rules in control.</p>
          </div>
          <Link href="/learn/agentic-commerce" className="resource-feature-link">
            <BookOpen size={22} aria-hidden="true" />
            <span><small>Start here</small><strong>How agentic commerce works</strong></span>
            <ArrowRight size={20} aria-hidden="true" />
          </Link>
        </header>

        <nav className="resource-index-band" aria-label="Resource sections">
          <a href="#foundations"><BookOpen size={17} /> Foundations <span>02</span></a>
          <a href="#product-reference"><ShieldCheck size={17} /> Product reference <span>02</span></a>
          <a href="#editorial"><FileText size={17} /> Editorial <span>03</span></a>
          <Link href="/faq"><HelpCircle size={17} /> FAQs <span>24</span></Link>
        </nav>

        <section className="resource-section" id="foundations">
          <div className="resource-section-head"><h2>Build the right mental model first.</h2><p>Start with the commerce journey and the questions operators ask before trusting an agent with purchasing work.</p></div>
          <ResourceLedger items={foundations} />
        </section>

        <section className="resource-section" id="product-reference">
          <div className="resource-section-head"><h2>Understand the control layer.</h2><p>Use these references when designing an integration, reviewing a decision, or deciding what an agent should be allowed to do.</p></div>
          <ResourceLedger items={productReferences} />
        </section>

        <section className="resource-section" id="editorial">
          <div className="resource-section-head"><h2>Reason about the category.</h2><p>Short arguments and explainers on the operating principles behind safe agent purchasing.</p></div>
          <ResourceLedger items={editorial} />
        </section>
      </div>
    </ResourceLayout>
  );
}
