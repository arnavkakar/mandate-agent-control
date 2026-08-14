import type { Metadata } from "next";
import { PublicPage } from "../public-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the Mandate simulated AI-agent authorization portfolio MVP.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PublicPage
      eyebrow="Terms of use"
      title="Mandate is a simulation and authorization prototype."
      introduction="These terms cover access to the current portfolio MVP. Mandate records simulated authorization intent and decisions; it is not a bank, card program, payment processor, or financial adviser."
    >
      <section>
        <h2>Permitted use</h2>
        <p>
          You may use Mandate to create test agents, configure mandates, submit
          simulated purchase requests, review decisions, and evaluate the
          product. You are responsible for the accuracy and lawfulness of data
          you submit and for activity performed through your account or agent keys.
        </p>
      </section>

      <section>
        <h2>Prohibited use</h2>
        <ul>
          <li>Do not use Mandate to represent that a real payment, bank transfer, or financial approval occurred.</li>
          <li>Do not submit payment credentials, production secrets, unlawful content, malware, or sensitive regulated data.</li>
          <li>Do not probe, disrupt, overload, bypass limits, access another tenant, or use the service to attack another system.</li>
          <li>Do not expose scoped agent keys in client code, public repositories, screenshots, or prompts.</li>
        </ul>
      </section>

      <section>
        <h2>Accounts and credentials</h2>
        <p>
          Keep account and agent credentials confidential. Scoped agent keys are
          intended for server-side integrations that submit simulated authorization
          requests. They do not grant permission to edit mandates, resolve approvals,
          or access unrelated workspaces.
        </p>
      </section>

      <section>
        <h2>Availability and changes</h2>
        <p>
          This is an evolving portfolio project. Features may change, be suspended,
          or be removed, and uninterrupted availability is not guaranteed. Material
          changes to these terms will be reflected by updating the date on this page.
        </p>
      </section>

      <section>
        <h2>No warranty or financial reliance</h2>
        <p>
          The service is provided for demonstration and evaluation. Do not rely on
          it to safeguard or authorize real funds. You remain responsible for any
          external system you connect and for independently validating controls
          before production use.
        </p>
      </section>
    </PublicPage>
  );
}
