import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, ResourceLayout, ResourceLedger } from "../resource-shell";
import { BLOG_AUTHOR, blogHref, blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Mandate essays and explainers about agentic commerce, deterministic authorization, financial risk controls, and human oversight.",
  alternates: { canonical: "/blog" },
};

const posts = blogPosts.map((post) => ({ ...post, href: blogHref(post), meta: `${BLOG_AUTHOR} · ${post.readingTime}` }));

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
          <div><h2>{posts[0].title}</h2><p>{posts[0].description}</p><small>By {BLOG_AUTHOR} · {posts[0].readingTime}</small></div>
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
