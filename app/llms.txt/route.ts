const llmsText = `# Mandate
> Mandate is a programmable authorization and risk-control layer for simulated AI-agent payments.

## Core product
- [Homepage](https://mandate-agent.com/): Product overview and deterministic authorization model.
- [Security](https://mandate-agent.com/security): Trust boundaries, prompt-injection position, and implemented controls.
- [Privacy](https://mandate-agent.com/privacy): Data collection and processing disclosure.
- [Terms](https://mandate-agent.com/terms): Simulation boundary and acceptable use.
- [GitHub](https://github.com/arnavkakar/mandate-agent-control): Source, architecture, and development tracker.

## Key facts
- AI agents may submit purchase requests, but a deterministic policy engine authorizes them.
- Every request returns APPROVED, APPROVAL_REQUIRED, or DECLINED with machine-readable reasons.
- A language model may structure proposed mandate rules; it cannot authorize transactions.
- Human review resolves ambiguous or elevated requests.
- The current MVP is simulated. It does not process real payments or store card or banking credentials.
`;

export function GET() {
  return new Response(llmsText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
