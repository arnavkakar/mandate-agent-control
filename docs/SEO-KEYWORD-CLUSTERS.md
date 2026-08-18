# Mandate search cluster plan

Updated: 2026-08-17

## How the data was gathered

This plan combines two free keyword sources with live SERP review:

- Ahrefs Free Keyword Generator supplied the most credible directional demand signal. It reported `agentic commerce` and `what is agentic commerce` above 1,000 monthly searches with hard difficulty; `ai agent payments` above 100; and most narrower authorization terms below 100 or without enough data for a difficulty score.
- KeywordVolumeChecker supplied AI-estimated volume and difficulty for long-tail terms. These numbers are useful only for relative prioritization and are not treated as measured search volume. Its estimates often disagreed with Ahrefs.
- Live Google/Bing results were reviewed to confirm intent and page-type overlap. Official protocol, payment-network, research, and enterprise sources were preferred over secondary summaries.

The practical conclusion is more reliable than any individual volume number: broad agentic-commerce queries are competitive, while payment-control and protocol queries are smaller but substantially closer to Mandate's product and buyer intent.

## Priority clusters

| Cluster | Primary query | Intent | Difficulty signal | Mandate page | Status |
|---|---|---|---|---|---|
| Agentic payments | agentic payments | Informational / commercial investigation | Medium; broad SERP led by payment networks and research institutions | `/blog/what-are-agentic-payments` | Published in this release |
| Payment protocols | agent payments protocol | Informational / technical | Low directional competition; official AP2 pages dominate | `/blog/ap2-agent-payments-protocol-guide` | Published in this release |
| Procurement agents | AI agents in procurement | Informational / use-case investigation | Medium; enterprise explainers dominate | `/blog/ai-agents-in-procurement-controls` | Published in this release |
| Spending controls | AI agent spending limits | Informational / solution-aware | Low-to-medium directional competition | `/blog/how-to-set-spending-limits-for-ai-agents` | Existing owner; strengthened with internal links |
| Payment mandates | AI agent payment mandate | Informational / technical | Low reported volume; highly product-aligned | `/blog/what-is-an-ai-agent-payment-mandate` | Existing owner; strengthened with internal links |
| Agentic commerce | what is agentic commerce | Informational | Hard; high-volume head term | `/learn/agentic-commerce` | Existing pillar; no duplicate created |
| Payment security | prompt injection AI agents | Informational / security | High for broad query; narrower payment intent is smaller | `/blog/prompt-injection-and-ai-agent-payments` | Existing owner |

## Why these three new posts

1. **Agentic payments** is the category bridge. It explains the complete system and gives Mandate a defensible place between agent intent and payment execution.
2. **AP2 / agent payments protocol** is a specific technical spoke with clearer intent and less content competition than the broad category terms.
3. **AI agents in procurement** maps directly to the initial buyer persona and gives the product a concrete business use case rather than only abstract infrastructure language.

We intentionally did not publish another generic agentic-commerce definition, spending-limits guide, or payment-mandate definition. Those intents already have canonical owners, and duplicating them would create keyword cannibalization.

## Internal-link architecture

- `/learn/agentic-commerce` remains the broad category pillar.
- `/blog/what-are-agentic-payments` is the payments sub-pillar.
- The AP2, procurement, mandate, spending-limit, and prompt-injection articles are spokes.
- Each new spoke links back to the payments pillar and to the closest product-control guide.
- Existing pillars link forward to the new pages so crawlers and readers can discover the cluster without relying on the blog index alone.

## Next content candidates

Publish only after Search Console begins returning impressions or a fresh free-tool/SERP pass confirms distinct intent:

1. Human approval workflows for AI agents.
2. AI-agent payment API design and idempotency.
3. AI-agent audit trails and authorization evidence.
4. Procurement-agent policy template for small businesses.
5. AP2 versus x402: authorization proof versus payment transport, using current primary specifications.

## Measurement

Review every 28 days in Search Console:

- indexed URLs and crawl status;
- impressions by cluster, not just by individual phrase;
- queries reaching positions 8–30, which are the best refresh candidates;
- click-through rate for pages with impressions;
- internal links and referring pages;
- conversions from editorial pages to account creation or product exploration.

Do not react to one day of data. This domain is new, and search engines need time to crawl, evaluate, and associate it with the category.
