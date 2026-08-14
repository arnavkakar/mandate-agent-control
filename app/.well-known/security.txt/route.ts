const securityText = `Contact: https://github.com/arnavkakar/mandate-agent-control/security/advisories/new
Expires: 2027-08-14T00:00:00.000Z
Canonical: https://mandate-agent.com/.well-known/security.txt
Policy: https://mandate-agent.com/security
Preferred-Languages: en
`;

export function GET() {
  return new Response(securityText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
