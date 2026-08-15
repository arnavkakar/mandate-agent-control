import Link from "next/link";
import { ArrowRight, LockKeyhole, Menu } from "lucide-react";
import type { ReactNode } from "react";

export function PublicHeader() {
  return (
    <nav className="marketing-nav" aria-label="Main navigation">
      <Link className="marketing-brand" href="/" aria-label="Mandate home">
        <span className="marketing-brand-mark" aria-hidden="true">
          <LockKeyhole size={18} />
        </span>
        <span>mandate</span>
      </Link>
      <div className="marketing-nav-links">
        <Link href="/learn/agentic-commerce">Agentic commerce</Link>
        <Link href="/resources">Resources</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/security">Security</Link>
        <Link className="marketing-nav-cta" href="/console">
          Open console
        </Link>
      </div>
      <details className="public-nav-menu">
        <summary><Menu size={18} aria-hidden="true" /> Menu</summary>
        <div>
          <Link href="/learn/agentic-commerce">Agentic commerce</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/knowledge">Knowledge base</Link>
          <Link href="/faq">FAQs</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/security">Security</Link>
          <Link href="/console">Open console</Link>
        </div>
      </details>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="marketing-footer public-footer">
      <Link className="marketing-brand" href="/">
        <span className="marketing-brand-mark" aria-hidden="true">
          <LockKeyhole size={16} />
        </span>
        <span>mandate</span>
      </Link>
      <p>Deterministic authorization controls for simulated AI-agent payments. Updated August 14, 2026.</p>
      <div>
        <Link href="/resources">Resources</Link>
        <Link href="/knowledge">Knowledge</Link>
        <Link href="/faq">FAQs</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/security">Security</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="https://github.com/arnavkakar/mandate-agent-control">GitHub</a>
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
          <Link className="marketing-primary" href="/console">
            Open the console <ArrowRight size={17} />
          </Link>
        </aside>
      </article>
      <PublicFooter />
    </main>
  );
}
