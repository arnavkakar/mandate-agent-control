import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/app", "/console"] },
      { userAgent: ["OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot"], allow: "/", disallow: ["/app", "/console"] },
    ],
    sitemap: "https://mandate-agent.com/sitemap.xml",
    host: "https://mandate-agent.com",
  };
}
