import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(){
 const workerUrl=new URL("../dist/server/index.js",import.meta.url);
 workerUrl.searchParams.set("test",`${process.pid}-${Date.now()}`);
 const {default:worker}=await import(workerUrl.href);
 return worker.fetch(new Request("http://localhost/",{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
}

async function renderPath(path){
 const workerUrl=new URL("../dist/server/index.js",import.meta.url);
 workerUrl.searchParams.set("test",`${process.pid}-${Date.now()}-${path}`);
 const {default:worker}=await import(workerUrl.href);
 return worker.fetch(new Request(`http://localhost${path}`,{headers:{accept:"text/html"}}),{ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},{waitUntil(){},passThroughOnException(){}});
}

test("server-renders the public Mandate product page",async()=>{
 const response=await render();
 assert.equal(response.status,200);
 assert.match(response.headers.get("content-type")??"",/^text\/html\b/i);
 const html=await response.text();
 assert.match(html,/<title>Mandate — Authorization controls for AI-agent spending<\/title>/i);
 assert.match(html,/AI agents can request/i);
 assert.match(html,/Mandate decides whether they may spend/i);
 assert.match(html,/Simulation only/i);
 assert.match(html,/type="module"/);
 assert.doesNotMatch(html,/codex-preview|Your site is taking shape/);
});

test("keeps the authenticated Mandate console at /app",async()=>{
 const response=await renderPath("/app");
 assert.equal(response.status,200);
 const html=await response.text();
 assert.match(html,/Loading Mandate/i);
 assert.match(html,/robots[^>]+noindex/i);
});

test("ships the authorization data model and safety thesis",async()=>{
 const [schema,readme,page]=await Promise.all([
  readFile(new URL("../db/schema.ts",import.meta.url),"utf8"),
  readFile(new URL("../README.md",import.meta.url),"utf8"),
  readFile(new URL("../app/mandate-console.tsx",import.meta.url),"utf8"),
 ]);
 for(const table of ["users","agents","mandates","transactions","authorizationDecisions","approvalRequests","auditEvents"]) assert.match(schema,new RegExp(`export const ${table}`));
 assert.match(readme,/does not move money/i);
 assert.match(readme,/deterministic/i);
 assert.match(page,/APPROVAL_REQUIRED/);
 assert.match(page,/Why was this/);
});
