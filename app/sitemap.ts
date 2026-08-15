import type { MetadataRoute } from "next";
import { blogHref, blogPosts } from "./blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const evergreen = [
    "",
    "resources",
    "learn/agentic-commerce",
    "knowledge",
    "faq",
    "blog",
    "compare",
    "security",
    "privacy",
    "terms",
  ].map((path) => ({
    url: `https://mandate-agent.com/${path}`,
    lastModified: new Date("2026-08-15"),
  }));
  const articles = blogPosts.map((post) => ({
    url: `https://mandate-agent.com${blogHref(post)}`,
    lastModified: new Date(post.published),
  }));
  return [...evergreen, ...articles];
}
