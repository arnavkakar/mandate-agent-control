import { createHash } from "node:crypto";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { desc, eq } from "drizzle-orm";
import { auditEvents } from "./schema.js";

const stable = (value: unknown): string => value && typeof value === "object" && !Array.isArray(value)
  ? `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`
  : Array.isArray(value) ? `[${value.map(stable).join(",")}]` : JSON.stringify(value);

export async function appendAudit(tx: any, event: { organizationId: string; eventType: string; actorType: string; actorId: string; subjectType: string; subjectId: string; payload: Record<string, unknown> }) {
  const [previous] = await tx.select().from(auditEvents).where(eq(auditEvents.organizationId, event.organizationId)).orderBy(desc(auditEvents.sequence)).limit(1);
  const sequence = (previous?.sequence ?? 0) + 1;
  const previousHash = previous?.eventHash ?? null;
  const eventHash = createHash("sha256").update(stable({ ...event, sequence, previousHash })).digest("hex");
  await tx.insert(auditEvents).values({ ...event, sequence, previousHash, eventHash });
  return { sequence, eventHash };
}
