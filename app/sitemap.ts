import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "security", "privacy", "terms"].map((path) => ({
    url: `https://mandate-agent.com/${path}`,
  }));
}
