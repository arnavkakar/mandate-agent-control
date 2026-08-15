/* Native anchors are intentional: Vinext's next/link prefetch runtime currently breaks public navigation. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { ArrowRight, Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "./public-page";

export type ResourceLink = {
  href: string;
  title: string;
  description: string;
  type: string;
  meta?: string;
};

export function ResourceLayout({ children }: { children: ReactNode }) {
  return (
    <main className="marketing-shell resource-shell">
      <a className="marketing-skip" href="#main-content">Skip to content</a>
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ href?: string; label: string }> }) {
  return (
    <nav className="resource-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        {items.map((item) => (
          <li key={item.label} aria-current={item.href ? undefined : "page"}>
            {item.href ? <a href={item.href}>{item.label}</a> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ResourceLedger({ items }: { items: ResourceLink[] }) {
  return (
    <div className="resource-ledger">
      {items.map((item) => (
        <a href={item.href} className="resource-ledger-row" key={item.href}>
          <span className="resource-ledger-type">{item.type}</span>
          <span>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </span>
          <span className="resource-ledger-action">
            {item.meta && <small>{item.meta}</small>}
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        </a>
      ))}
    </div>
  );
}

export function ArticleShell({
  section,
  title,
  description,
  date,
  datePublished,
  canonical,
  readingTime,
  children,
  related,
}: {
  section: "Blog" | "Knowledge base" | "Field guide";
  title: string;
  description: string;
  date: string;
  datePublished: string;
  canonical: string;
  readingTime: string;
  children: ReactNode;
  related: ResourceLink[];
}) {
  const parent = section === "Blog" ? "/blog" : section === "Knowledge base" ? "/knowledge" : "/resources";
  const schema = {
    "@context": "https://schema.org",
    "@type": section === "Blog" ? "BlogPosting" : "TechArticle",
    headline: title,
    description,
    datePublished,
    dateModified: datePublished,
    author: { "@type": "Organization", name: "Mandate", url: "https://mandate-agent.com" },
    publisher: { "@type": "Organization", name: "Mandate", url: "https://mandate-agent.com" },
    mainEntityOfPage: `https://mandate-agent.com${canonical}`,
  };
  return (
    <ResourceLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="editorial-article" id="main-content">
        <Breadcrumbs items={[{ href: parent, label: section }, { label: title }]} />
        <header className="editorial-head">
          <h1>{title}</h1>
          <strong>{description}</strong>
          <div><time dateTime={date}>{date}</time><span><Clock3 size={14} /> {readingTime}</span></div>
        </header>
        <div className="editorial-grid">
          <aside className="editorial-aside" aria-label="On this page">
            <strong>Reading note</strong>
            <p>Mandate is a simulated authorization layer. Examples explain control flows; they do not represent real transactions or payment-provider integrations.</p>
          </aside>
          <div className="editorial-body">{children}</div>
        </div>
        <aside className="editorial-related" aria-label="Related resources">
          <h2>Continue reading</h2>
          <ResourceLedger items={related} />
        </aside>
      </article>
    </ResourceLayout>
  );
}
