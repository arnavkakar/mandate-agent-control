import { z } from "zod";
import { env } from "./env.js";

export const mandatePolicySchema = z.object({
  monthlyBudgetCents: z.number().int().nonnegative(),
  maxTransactionCents: z.number().int().nonnegative(),
  approvalThresholdCents: z.number().int().nonnegative(),
  allowedCategories: z.array(z.string()),
  blockedCategories: z.array(z.string()),
  allowedMerchants: z.array(z.string()),
  blockedMerchants: z.array(z.string()),
  allowedCountries: z.array(z.string().length(2)),
  requireApprovalForNewMerchant: z.boolean(),
  requireApprovalForAll: z.boolean(),
  expiresAt: z.string().nullable(),
});
export const interpretationSchema = z.object({
  policy: mandatePolicySchema,
  summary: z.string(),
  assumptions: z.array(z.string()),
  ambiguities: z.array(z.string()),
});
const fields = {
  monthlyBudgetCents: { type: "integer", minimum: 0 },
  maxTransactionCents: { type: "integer", minimum: 0 },
  approvalThresholdCents: { type: "integer", minimum: 0 },
  allowedCategories: { type: "array", items: { type: "string" } },
  blockedCategories: { type: "array", items: { type: "string" } },
  allowedMerchants: { type: "array", items: { type: "string" } },
  blockedMerchants: { type: "array", items: { type: "string" } },
  allowedCountries: {
    type: "array",
    items: { type: "string", minLength: 2, maxLength: 2 },
  },
  requireApprovalForNewMerchant: { type: "boolean" },
  requireApprovalForAll: { type: "boolean" },
  expiresAt: { anyOf: [{ type: "string" }, { type: "null" }] },
};
const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["policy", "summary", "assumptions", "ambiguities"],
  properties: {
    policy: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(fields),
      properties: fields,
    },
    summary: { type: "string" },
    assumptions: { type: "array", items: { type: "string" } },
    ambiguities: { type: "array", items: { type: "string" } },
  },
};

export async function interpretMandate(userIntent: string) {
  if (!env.OPENAI_API_KEY)
    throw Object.assign(
      new Error("OpenAI mandate interpretation is not configured"),
      { statusCode: 503, code: "MANDATE_INTERPRETER_NOT_CONFIGURED" },
    );
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      store: false,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Interpret the user's financial intent into a proposed Mandate policy. Interpret only: never authorize a transaction. Preserve ambiguity and make conservative assumptions explicit. Use integer USD cents and ISO alpha-2 countries.",
            },
          ],
        },
        { role: "user", content: [{ type: "input_text", text: userIntent }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "mandate_interpretation",
          strict: true,
          schema: jsonSchema,
        },
      },
    }),
  });
  const body = (await response.json()) as {
    error?: { message?: string; code?: string; type?: string };
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (!response.ok) {
    const message = body.error?.message ?? "OpenAI request failed";
    const billingRequired =
      body.error?.code === "insufficient_quota" ||
      /no credits remaining/i.test(message);
    throw Object.assign(new Error(message), {
      statusCode: billingRequired ? 402 : response.status === 429 ? 429 : 502,
      code: billingRequired
        ? "OPENAI_BILLING_REQUIRED"
        : response.status === 429
          ? "OPENAI_RATE_LIMITED"
          : "MANDATE_INTERPRETATION_FAILED",
    });
  }
  const item = body.output
    ?.flatMap((output) => output.content ?? [])
    .find((content) => content.type === "output_text");
  if (!item?.text)
    throw Object.assign(new Error("OpenAI returned no structured output"), {
      statusCode: 502,
      code: "MANDATE_INTERPRETATION_FAILED",
    });
  return interpretationSchema.parse(JSON.parse(item.text));
}
