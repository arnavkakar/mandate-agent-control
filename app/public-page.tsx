/* Native anchors are intentional: Vinext's next/link prefetch runtime currently breaks public navigation. */
/* eslint-disable @next/next/no-html-link-for-pages */
import { ArrowRight, ChevronDown, LockKeyhole, Menu } from "lucide-react";
import type { ReactNode } from "react";

export function PublicHeader() {
  return (
    <nav className="marketing-nav" aria-label="Main navigation">
      <a className="marketing-brand" href="/" aria-label="Mandate home">
        <span className="marketing-brand-mark" aria-hidden="true">
          <LockKeyhole size={18} />
        </span>
        <span>mandate</span>
      </a>
      <div className="marketing-nav-links">
        <a href="/">Home</a>
        <a href="/#how-it-works">How it works</a>
        <a href="/compare">Compare</a>
        <details className="marketing-learn-menu">
          <summary>
            Learn <ChevronDown size={15} aria-hidden="true" />
          </summary>
          <div>
            <a href="/learn/agentic-commerce">
              <strong>Agentic commerce</strong>
              <span>Understand the purchasing model</span>
            </a>
            <a href="/resources">
              <strong>Resource center</strong>
              <span>Guides, explainers, and references</span>
            </a>
            <a href="/knowledge">
              <strong>Knowledge base</strong>
              <span>Product concepts and terminology</span>
            </a>
            <a href="/faq">
              <strong>FAQs</strong>
              <span>Answers to common questions</span>
            </a>
            <a href="/blog">
              <strong>Blog</strong>
              <span>Analysis and product thinking</span>
            </a>
          </div>
        </details>
        <a href="/security">Security</a>
        <a className="marketing-nav-cta" href="/console">
          Open console
        </a>
      </div>
      <details className="public-nav-menu">
        <summary><Menu size={18} aria-hidden="true" /> Menu</summary>
        <div className="public-nav-panel">
          <div className="public-nav-group">
            <span>Product</span>
            <a href="/">Home</a>
            <a href="/#how-it-works">How it works</a>
            <a href="/compare">Compare</a>
            <a href="/security">Security</a>
          </div>
          <div className="public-nav-group">
            <span>Learn</span>
            <a href="/learn/agentic-commerce">Agentic commerce</a>
            <a href="/resources">Resource center</a>
            <a href="/knowledge">Knowledge base</a>
            <a href="/faq">FAQs</a>
            <a href="/blog">Blog</a>
          </div>
          <a className="public-nav-console" href="/console">Open console</a>
        </div>
      </details>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="marketing-footer public-footer">
      <a className="marketing-brand" href="/">
        <span className="marketing-brand-mark" aria-hidden="true">
          <LockKeyhole size={16} />
        </span>
        <span>mandate</span>
      </a>
      <p>Deterministic authorization controls for AI-agent payments. Updated August 15, 2026.</p>
      <div className="public-footer-links">
        <div>
          <strong>Product</strong>
          <a href="/">Home</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/compare">Compare</a>
          <a href="/security">Security</a>
          <a href="/console">Console</a>
        </div>
        <div>
          <strong>Learn</strong>
          <a href="/learn/agentic-commerce">Agentic commerce</a>
          <a href="/resources">Resources</a>
          <a href="/knowledge">Knowledge base</a>
          <a href="/faq">FAQs</a>
          <a href="/blog">Blog</a>
        </div>
        <div>
          <strong>Company</strong>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="https://github.com/arnavkakar/mandate-agent-control">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export function PublicPage({
  eyebrow,
  title,
  introduction,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <main className="marketing-shell public-page-shell">
      <a className="marketing-skip" href="#main-content">
        Skip to content
      </a>
      <PublicHeader />
      <article className="public-document" id="main-content">
        <header className="public-document-head">
          <p className="marketing-context">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{introduction}</p>
          <span>Last updated August 14, 2026</span>
        </header>
        <div className="public-document-body">{children}</div>
        <aside className="public-document-cta">
          <div>
            <strong>See the authorization boundary in practice.</strong>
            <p>Create a workspace and test simulated requests. No money moves.</p>
          </div>
          <a className="marketing-primary" href="/console">
            Open the console <ArrowRight size={17} />
          </a>
        </aside>
      </article>
      <PublicFooter />
    </main>
  );
}
