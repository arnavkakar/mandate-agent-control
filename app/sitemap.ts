import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "resources",
    "learn/agentic-commerce",
    "knowledge",
    "faq",
    "blog",
    "blog/agentic-commerce-needs-separation-of-powers",
    "blog/from-user-intent-to-auditable-purchase-request",
    "blog/risk-scores-should-not-override-policy",
    "security",
    "privacy",
    "terms",
  ].map((path) => ({
    url: `https://mandate-agent.com/${path}`,
    lastModified: new Date("2026-08-14"),
  }));
}
