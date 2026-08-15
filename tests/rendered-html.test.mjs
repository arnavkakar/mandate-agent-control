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
 assert.match(html,/What is AI-agent payment authorization/i);
 assert.match(html,/"@type":"Organization"/i);
 assert.match(html,/"@type":"WebSite"/i);
 assert.match(html,/"@type":"WebPage"/i);
 assert.match(html,/Simulation only/i);
 assert.match(html,/type="module"/);
 assert.doesNotMatch(html,/codex-preview|Your site is taking shape/);
});

test("keeps the authenticated Mandate console at /console",async()=>{
 const response=await renderPath("/console");
 assert.equal(response.status,200);
 const html=await response.text();
 assert.match(html,/Loading Mandate/i);
 assert.match(html,/robots[^>]+noindex/i);
});

test("publishes indexable trust pages and machine-readable policy files",async()=>{
 for(const [path,needle] of [["/security",/language model never holds financial authority/i],["/privacy",/Data Mandate receives/i],["/terms",/simulation and authorization prototype/i]]){
  const response=await renderPath(path);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,needle);
  assert.doesNotMatch(html,/robots[^>]+noindex/i);
 }
 const llms=await renderPath("/llms.txt");
 assert.equal(llms.status,200);
 assert.match(llms.headers.get("content-type")??"",/^text\/plain\b/i);
 assert.match(await llms.text(),/deterministic policy engine authorizes them/i);
 const security=await renderPath("/.well-known/security.txt");
 assert.equal(security.status,200);
 assert.match(await security.text(),/security\/advisories\/new/i);
});

test("publishes the resource center and substantive learning routes",async()=>{
 for(const [path,needle] of [
  ["/resources",/field guide to controlled agentic commerce/i],
  ["/learn/agentic-commerce",/Agentic commerce is a purchasing journey/i],
  ["/knowledge",/Mandate knowledge base/i],
  ["/faq",/Questions worth answering before an agent can spend/i],
  ["/blog",/Writing about authority before autonomy/i],
  ["/blog/agentic-commerce-needs-separation-of-powers",/Delegated action needs an independent authorization boundary/i],
  ["/blog/from-user-intent-to-auditable-purchase-request",/useful unit is a trace/i],
  ["/blog/risk-scores-should-not-override-policy",/Risk may make an eligible request more restrictive/i],
  ["/blog/how-to-set-spending-limits-for-ai-agents",/Start with a narrow job/i],
  ["/blog/prompt-injection-and-ai-agent-payments",/Assume the model can be manipulated/i],
  ["/blog/what-is-an-ai-agent-payment-mandate",/versioned set of rules/i],
  ["/compare",/Mandate, Skyfire, Stripe Issuing, and Ramp compared/i],
 ]){
  const response=await renderPath(path);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,needle);
  assert.doesNotMatch(html,/robots[^>]+noindex/i);
 }
 const sitemap=await renderPath("/sitemap.xml");
 assert.equal(sitemap.status,200);
 const xml=await sitemap.text();
 assert.match(xml,/learn\/agentic-commerce/i);
 assert.match(xml,/blog\/risk-scores-should-not-override-policy/i);
 assert.match(xml,/blog\/how-to-set-spending-limits-for-ai-agents/i);
 assert.match(xml,/blog\/prompt-injection-and-ai-agent-payments/i);
 assert.match(xml,/blog\/what-is-an-ai-agent-payment-mandate/i);
 assert.match(xml,/<loc>https:\/\/mandate-agent\.com\/compare<\/loc>/i);
});

test("publishes a sourced and balanced competitor comparison",async()=>{
 const response=await renderPath("/compare");
 assert.equal(response.status,200);
 const html=await response.text();
 for(const product of ["Mandate","Skyfire","Stripe Issuing","Ramp"]) assert.match(html,new RegExp(product,"i"));
 assert.match(html,/published by Mandate/i);
 assert.match(html,/official product pages and documentation/i);
 assert.match(html,/https:\/\/docs\.skyfire\.xyz/i);
 assert.match(html,/https:\/\/stripe\.com\/issuing/i);
 assert.match(html,/https:\/\/agents\.ramp\.com/i);
 assert.match(html,/"@type":"ItemList"/i);
 assert.doesNotMatch(html,/better than|worst|inferior/i);
});

test("publishes crawl policy and complete article SEO",async()=>{
 const robots=await renderPath("/robots.txt");
 assert.equal(robots.status,200);
 const policy=await robots.text();
 assert.match(policy,/User-Agent: \*/i);
 assert.match(policy,/Disallow: \/console/i);
 assert.match(policy,/Sitemap: https:\/\/mandate-agent\.com\/sitemap\.xml/i);
 for(const slug of [
  "agentic-commerce-needs-separation-of-powers",
  "from-user-intent-to-auditable-purchase-request",
  "risk-scores-should-not-override-policy",
  "how-to-set-spending-limits-for-ai-agents",
  "prompt-injection-and-ai-agent-payments",
  "what-is-an-ai-agent-payment-mandate",
 ]){
  const response=await renderPath(`/blog/${slug}`);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.match(html,/By (?:<!-- -->)?Arnav Kakar/i);
  assert.match(html,/"@type":"BlogPosting"/i);
  assert.match(html,/"@type":"Person","name":"Arnav Kakar"/i);
  assert.match(html,new RegExp(`rel="canonical" href="https://mandate-agent\\.com/blog/${slug}"`,`i`));
 }
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
