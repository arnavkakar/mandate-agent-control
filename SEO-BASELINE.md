# Mandate SEO Baseline

Measured: 2026-08-14  
Canonical origin: `https://mandate-agent.com`  
Scope: public homepage and the indexable URLs in the production sitemap

This baseline records measured production behavior, not projections. The authenticated console is intentionally excluded from search with `noindex, nofollow`.

## Production scores

| Check | Score | Evidence |
| --- | ---: | --- |
| Schema | 100/100 | Valid JSON-LD graph with `Organization`, `WebSite`, `WebPage`, and `SoftwareApplication` |
| Sitemap | 100/100 | Four canonical, indexable, 200-status URLs; referenced by `robots.txt` |
| GEO / AI search readiness | 63/100 | AI search crawlers allowed, substantive `llms.txt`, structured data, and a 138-word answer-first definition |
| Performance heuristic | 35/100 | Heuristic only; real PageSpeed/CrUX data was unavailable and this score must not be presented as field performance |

The performance tool estimated LCP 2.48s, INP 500ms, and CLS 0.03 from deterministic lab heuristics. These are not real-user measurements. Obtain PageSpeed Insights and CrUX evidence after the domain has accumulated sufficient traffic.

## Verified search surface

- `/` — product homepage, canonical and indexable
- `/security` — security model and prompt-injection boundary
- `/privacy` — data-use disclosure
- `/terms` — simulation and acceptable-use boundary
- `/console` — authenticated product, intentionally `noindex, nofollow`
- `/app` — compatibility redirect to `/console`
- `/robots.txt` — sitemap reference and explicit AI-search crawler policy
- `/sitemap.xml` — public canonical URLs only
- `/llms.txt` — product facts and authoritative links
- `/.well-known/security.txt` — private vulnerability-reporting path
- `/opengraph-image` — social preview image

## Remaining work

1. Connect Google Search Console and submit the production sitemap.
2. Collect real PageSpeed/CrUX measurements and address confirmed Core Web Vitals issues only from those measurements.
3. Add developer quickstart, API, and MCP documentation with copy-pastable simulated requests.
4. Publish focused product and use-case pages from the architecture in `TODO.md`; do not generate thin template pages.
5. Add Cloudflare or equivalent edge protection before deliberate public acquisition.
6. Re-run schema, sitemap, GEO, accessibility, and performance checks after every public information-architecture release.

## Audit limitations

- The AccessLint Chrome helper could not expose its local debugging port in the macOS sandbox, so a full automated WCAG result is not claimed.
- A live DOM inspection confirmed one `h1` per public route, ordered heading structures, canonical and robots metadata, named links/buttons, no missing image `alt` attributes, and no desktop horizontal overflow. Full keyboard, screen-reader, contrast, and 390px viewport verification remain required.
- Search rankings, traffic, and conversion data do not exist yet; no outcome claims should be made until Search Console and first-party analytics provide evidence.
