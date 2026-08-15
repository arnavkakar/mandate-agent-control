const UPSTREAM_API_URL =
  process.env.MANDATE_API_URL ??
  process.env.NEXT_PUBLIC_MANDATE_API_URL ??
  "https://mandate-agent-control-production.up.railway.app";

const SESSION_COOKIE = "__Host-mandate_session";
const DEV_SESSION_COOKIE = "mandate_session";
const MAX_PROXY_BODY_BYTES = 64_000;
const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function parseCookies(header: string | null) {
  return new Map(
    (header ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf("=");
        return separator === -1
          ? [part, ""]
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

function sessionCookie(token: string, secure: boolean) {
  const name = secure ? SESSION_COOKIE : DEV_SESSION_COOKIE;
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure ? "; Secure" : ""}`;
}

function expiredSessionCookies() {
  return [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
    `${DEV_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}

function isSameOriginMutation(request: Request) {
  if (!MUTATING_METHODS.has(request.method)) return true;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (
    origin === requestUrl.origin &&
    (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site")
  );
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (!isSameOriginMutation(request))
    return Response.json({ error: "CROSS_SITE_REQUEST_BLOCKED" }, { status: 403 });

  const { path } = await context.params;
  const route = `/${path.join("/")}`;
  if (route === "/v1/auth/logout" && request.method === "POST") {
    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const cookie of expiredSessionCookies()) headers.append("Set-Cookie", cookie);
    return Response.json({ ok: true }, { headers });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROXY_BODY_BYTES)
    return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });

  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.get(SESSION_COOKIE) ?? cookies.get(DEV_SESSION_COOKIE);
  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();
  if (body && body.byteLength > MAX_PROXY_BODY_BYTES)
    return Response.json({ error: "REQUEST_TOO_LARGE" }, { status: 413 });

  let upstream: Response;
  try {
    upstream = await fetch(`${UPSTREAM_API_URL}${route}`, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
      signal: AbortSignal.timeout(40_000),
    });
  } catch {
    return Response.json({ error: "UPSTREAM_UNAVAILABLE" }, { status: 502 });
  }

  const responseHeaders = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": upstream.headers.get("content-type") ?? "application/json",
  });
  const raw = await upstream.text();
  let output = raw;
  if (
    upstream.ok &&
    request.method === "POST" &&
    ["/v1/auth/login", "/v1/auth/signup", "/v1/auth/google"].includes(route)
  ) {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const issuedToken = typeof payload.token === "string" ? payload.token : "";
    if (!issuedToken)
      return Response.json({ error: "INVALID_AUTH_RESPONSE" }, { status: 502 });
    delete payload.token;
    payload.token = "cookie-session";
    output = JSON.stringify(payload);
    responseHeaders.append(
      "Set-Cookie",
      sessionCookie(issuedToken, new URL(request.url).protocol === "https:"),
    );
  }
  if (upstream.status === 401) {
    for (const cookie of expiredSessionCookies()) responseHeaders.append("Set-Cookie", cookie);
  }
  return new Response(output, { status: upstream.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
