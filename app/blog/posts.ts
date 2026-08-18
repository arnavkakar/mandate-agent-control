export const BLOG_AUTHOR = "Arnav Kakar";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  type: string;
  readingTime: string;
  published: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "what-are-agentic-payments",
    title: "What are agentic payments?",
    description: "A practical guide to how AI agents request, authorize, and execute payments—and why those jobs belong to separate systems.",
    type: "Pillar guide",
    readingTime: "13 min",
    published: "2026-08-17",
  },
  {
    slug: "ap2-agent-payments-protocol-guide",
    title: "AP2 and the agent payments protocol, explained",
    description: "How AP2 uses typed mandates, signed intent, and receipts to make agent-initiated purchases verifiable.",
    type: "Protocol guide",
    readingTime: "11 min",
    published: "2026-08-17",
  },
  {
    slug: "ai-agents-in-procurement-controls",
    title: "AI agents in procurement: where controls belong",
    description: "How procurement agents can help with sourcing and purchasing while budgets, suppliers, and approvals remain governed.",
    type: "Use-case guide",
    readingTime: "12 min",
    published: "2026-08-17",
  },
  {
    slug: "how-to-set-spending-limits-for-ai-agents",
    title: "How to set spending limits for AI agents",
    description: "A practical framework for budgets, transaction caps, merchant rules, review thresholds, and emergency controls.",
    type: "Operating guide",
    readingTime: "11 min",
    published: "2026-08-15",
  },
  {
    slug: "prompt-injection-and-ai-agent-payments",
    title: "Prompt injection and AI-agent payments",
    description: "Why prompt filtering is not an authorization boundary, and how to contain untrusted instructions before money can move.",
    type: "Security",
    readingTime: "10 min",
    published: "2026-08-15",
  },
  {
    slug: "what-is-an-ai-agent-payment-mandate",
    title: "What is an AI-agent payment mandate?",
    description: "A plain-language guide to the rules, identities, evidence, and human decisions behind delegated agent spending.",
    type: "Explainer",
    readingTime: "10 min",
    published: "2026-08-15",
  },
  {
    slug: "agentic-commerce-needs-separation-of-powers",
    title: "Agentic commerce needs a separation of powers",
    description: "The system interpreting a purchase request should not be the system granting financial authority.",
    type: "Point of view",
    readingTime: "7 min",
    published: "2026-08-14",
  },
  {
    slug: "from-user-intent-to-auditable-purchase-request",
    title: "From user intent to an auditable purchase request",
    description: "What must be captured between a human instruction and an agent action for the result to be explainable.",
    type: "Explainer",
    readingTime: "6 min",
    published: "2026-08-14",
  },
  {
    slug: "risk-scores-should-not-override-policy",
    title: "Risk scores should not override policy",
    description: "Risk can escalate a request. It cannot repeal an explicit financial boundary.",
    type: "Design principle",
    readingTime: "5 min",
    published: "2026-08-14",
  },
];

export const blogHref = (post: BlogPost) => `/blog/${post.slug}`;
