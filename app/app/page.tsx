import type { Metadata } from "next";
import MandateConsole from "../mandate-console";

export const metadata: Metadata = {
  title: "Mandate Console",
  description: "Create agents, define mandates, review requests, and inspect deterministic authorization decisions.",
  alternates: { canonical: "/app" },
  robots: { index: false, follow: false },
};

export default function ConsolePage() {
  return <MandateConsole />;
}
