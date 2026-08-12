import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mandate Console",
  description:
    "Create agents, define mandates, review requests, and inspect deterministic authorization decisions.",
  alternates: { canonical: "/app" },
  robots: { index: false, follow: false },
};

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return children;
}
