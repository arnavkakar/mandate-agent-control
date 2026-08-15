import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, ResourceLayout, ResourceLedger } from "../resource-shell";

export const metadata: Metadata = {
  title: "Blog",
  description: "Mandate essays and explainers about agentic commerce, deterministic authorization, financial risk controls, and human oversight.",
  alternates: { canonical: "/blog" },
};

const posts = [
  {
    href: "/blog/agentic-commerce-needs-separation-of-powers",
    title: "Agentic commerce needs a separation of powers",
    description: "The system interpreting a purchase request should not be the system granting financial authority.",
    type: "Point of view",
    meta: "7 min",
  },
  {
    href: "/blog/from-user-intent-to-auditable-purchase-request",
    title: "From user intent to an auditable purchase request",
    description: "What must be captured between a human instruction and an agent action for the result to be explainable.",
    type: "Explainer",
    meta: "6 min",
  },
  {
    href: "/blog/risk-scores-should-not-override-policy",
    title: "Risk scores should not override policy",
    description: "Risk can escalate a request. It cannot repeal an explicit financial boundary.",
    type: "Design principle",
    meta: "5 min",
  },
];

export default function BlogPage() {
  return (
    <ResourceLayout>
      <div className="blog-page" id="main-content">
        <Breadcrumbs items={[{ label: "Blog" }]} />
        <header className="blog-head">
          <h1>Writing about authority before autonomy.</h1>
          <p>Notes on agentic commerce, deterministic controls, human accountability, and the infrastructure required when software can act.</p>
        </header>
        <a className="blog-feature" href={posts[0].href}>
          <div><h2>{posts[0].title}</h2><p>{posts[0].description}</p></div>
          <span>Read the essay <ArrowRight size={17} /></span>
        </a>
        <section className="blog-latest">
          <div className="resource-section-head"><h2>Latest writing</h2><p>Foundational pieces first. New posts will expand only when they add evidence or a distinct operating lesson.</p></div>
          <ResourceLedger items={posts} />
        </section>
      </div>
    </ResourceLayout>
  );
}
