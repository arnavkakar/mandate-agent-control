import type { Metadata } from "next";
import { PublicPage } from "../public-page";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Mandate separates language-model interpretation from deterministic authorization and protects its simulated agent-payment control plane.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <PublicPage
      eyebrow="Security model"
      title="The language model never holds financial authority."
      introduction="Mandate is designed around a narrow trust boundary: models may structure user intent, while authenticated code, versioned policy, and human reviewers control every authorization outcome."
    >
      <section>
        <h2>What Mandate protects</h2>
        <p>
          Mandate stores simulated agents, mandates, authorization requests,
          decisions, approval records, and audit events. The MVP does not store
          card numbers, bank credentials, or payment-provider secrets, and it
          does not execute real payments.
        </p>
      </section>

      <section>
        <h2>Authorization boundary</h2>
        <ul>
          <li>The model can translate natural-language intent into a proposed policy structure.</li>
          <li>The proposal is validated against a strict schema and must be activated by a human.</li>
          <li>A deterministic engine—not a model—returns APPROVED, APPROVAL_REQUIRED, or DECLINED.</li>
          <li>Hard policy failures cannot be overridden by model output.</li>
          <li>Scoped agent credentials cannot edit mandates or approve their own requests.</li>
        </ul>
      </section>

      <section>
        <h2>Application controls</h2>
        <div className="public-control-grid">
          <article>
            <h3>Input and cost controls</h3>
            <p>Bounded request bodies, schema validation, model timeouts, output limits, and route-specific rate limits reduce abuse and unbounded model spend.</p>
          </article>
          <article>
            <h3>Tenant isolation</h3>
            <p>Organization and agent ownership are checked at server trust boundaries before financial records can be read or changed.</p>
          </article>
          <article>
            <h3>Database safety</h3>
            <p>Queries use parameter binding through Drizzle. Authorization requests use idempotency keys and serialized budget checks.</p>
          </article>
          <article>
            <h3>Decision evidence</h3>
            <p>Policy checks, risk factors, human resolutions, and linked audit events preserve why a simulated request received its result.</p>
          </article>
        </div>
      </section>

      <section>
        <h2>Prompt-injection position</h2>
        <p>
          Mandate treats all natural-language instructions as untrusted data.
          The interpretation endpoint has no payment tools, database authority,
          approval capability, or access to user credentials. Structured model
          output is revalidated before it can become a proposed mandate, and a
          human must activate that proposal before deterministic evaluation uses it.
        </p>
      </section>

      <section>
        <h2>Responsible disclosure</h2>
        <p>
          Please report suspected vulnerabilities privately through the
          repository&apos;s <a href="https://github.com/arnavkakar/mandate-agent-control/security/advisories/new">GitHub security advisory form</a>.
          Do not include secrets, personal data, or exploit details in a public issue.
          This portfolio MVP does not currently operate a bug-bounty program.
        </p>
      </section>

      <section>
        <h2>Before broader public use</h2>
        <p>
          The launch plan still includes an edge WAF and bot controls, cookie-based
          sessions with CSRF protection, email verification, MFA, centralized
          observability, secret rotation, and a verified database restore drill.
          These are explicitly tracked rather than represented as completed controls.
        </p>
      </section>
    </PublicPage>
  );
}
