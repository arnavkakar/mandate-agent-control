import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("security-test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}

const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const context = { waitUntil() {}, passThroughOnException() {} };

test("rejects cross-site state-changing dashboard API requests", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/mandate/v1/auth/logout", {
      method: "POST",
      headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    }),
    env,
    context,
  );
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "CROSS_SITE_REQUEST_BLOCKED" });
});

test("logout clears only HttpOnly same-site session cookies", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("https://mandate-agent.com/api/mandate/v1/auth/logout", {
      method: "POST",
      headers: { origin: "https://mandate-agent.com", "sec-fetch-site": "same-origin" },
    }),
    env,
    context,
  );
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie().join("\n");
  assert.match(cookies, /HttpOnly/i);
  assert.match(cookies, /SameSite=Lax/i);
  assert.match(cookies, /Max-Age=0/i);
  assert.doesNotMatch(cookies, /Bearer/i);
});

test("browser code no longer persists or attaches bearer sessions", async () => {
  const client = await readFile(new URL("../app/lib/mandate-api.ts", import.meta.url), "utf8");
  assert.doesNotMatch(client, /localStorage\.setItem/);
  assert.doesNotMatch(client, /Authorization:\s*`Bearer/);
  assert.match(client, /credentials:\s*"same-origin"/);
  assert.match(client, /localStorage\.removeItem\("mandate\.session\.v1"\)/);
});

test("public pages ship restrictive browser security headers", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    env,
    context,
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.match(response.headers.get("content-security-policy") ?? "", /object-src 'none'/);
});

test("database access remains parameterized and tenant-scoped on consequential routes", async () => {
  const server = await readFile(new URL("../services/api/src/server.ts", import.meta.url), "utf8");
  assert.doesNotMatch(server, /sql\.unsafe|\.unsafe\(/);
  assert.match(server, /eq\(approvalRequests\.organizationId, auth\.organizationId\)/);
  assert.match(server, /eq\(agents\.organizationId, auth\.organizationId\)/);
  assert.match(server, /eq\(authorizationDecisions\.organizationId, auth\.organizationId\)/);
});
