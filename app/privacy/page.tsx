import type { Metadata } from "next";
import { PublicPage } from "../public-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What data the Mandate portfolio MVP collects, why it is used, and which data it deliberately does not collect.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PublicPage
      eyebrow="Privacy notice"
      title="Collect only what the authorization workflow needs."
      introduction="This notice describes the current Mandate portfolio MVP. It is intentionally explicit about the product’s simulated status and the limited data required to operate it."
    >
      <section>
        <h2>Data Mandate receives</h2>
        <ul>
          <li>Account data such as your name, organization name, email address, password hash, and authentication records.</li>
          <li>Workspace data such as agents, mandates, simulated transactions, decisions, approvals, and audit events.</li>
          <li>Technical data such as IP-derived request information, timestamps, error details, and abuse-prevention counters.</li>
          <li>If you use Google sign-in, the identity information returned by Google for authentication.</li>
        </ul>
      </section>

      <section>
        <h2>How the data is used</h2>
        <p>
          Data is used to authenticate users, enforce tenant boundaries, evaluate
          simulated authorization requests, display explainable decisions,
          preserve audit evidence, prevent abuse, and operate the service.
        </p>
      </section>

      <section>
        <h2>Natural-language mandate interpretation</h2>
        <p>
          When you choose to structure a mandate from natural language, that
          instruction is sent to OpenAI for schema-constrained interpretation.
          The model does not receive authority to approve transactions, access
          payment credentials, or change an active mandate. You can use the
          structured form without relying on natural-language interpretation.
        </p>
      </section>

      <section>
        <h2>Data Mandate does not need</h2>
        <p>
          Do not submit card numbers, bank-account credentials, government IDs,
          production secrets, health information, or other sensitive personal
          data. The MVP does not process real payments and is not designed to
          receive those categories of information.
        </p>
      </section>

      <section>
        <h2>Service providers and retention</h2>
        <p>
          Railway provides application and PostgreSQL hosting, Google may provide
          authentication, and OpenAI processes mandate text only when that feature
          is invoked. Records are retained while needed to operate and secure the
          workspace or meet legitimate recordkeeping needs. Formal deletion and
          retention automation remains part of the production roadmap.
        </p>
      </section>

      <section>
        <h2>Questions and requests</h2>
        <p>
          Until a dedicated privacy channel is published, contact the project
          owner through the verified profile linked from the
          <a href="https://github.com/arnavkakar/mandate-agent-control"> Mandate GitHub repository</a>.
          Do not post personal data or credentials in a public issue.
        </p>
      </section>
    </PublicPage>
  );
}
