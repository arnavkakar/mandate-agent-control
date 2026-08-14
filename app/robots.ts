import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/app"] },
      { userAgent: ["OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"], allow: "/", disallow: ["/app"] },
    ],
    sitemap: "https://mandate-agent.com/sitemap.xml",
    host: "https://mandate-agent.com",
  };
}
