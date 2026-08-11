import { createHash } from "node:crypto";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { asc, desc, eq } from "drizzle-orm";
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

export async function verifyAuditChain(tx:any,organizationId:string){
  const events=await tx.select().from(auditEvents).where(eq(auditEvents.organizationId,organizationId)).orderBy(asc(auditEvents.sequence));let previousHash:string|null=null;
  for(const event of events){const expected=createHash("sha256").update(stable({organizationId:event.organizationId,eventType:event.eventType,actorType:event.actorType,actorId:event.actorId,subjectType:event.subjectType,subjectId:event.subjectId,payload:event.payload,sequence:event.sequence,previousHash})).digest("hex");if(event.previousHash!==previousHash||event.eventHash!==expected)return {valid:false,checked:events.length,brokenAtSequence:event.sequence,expectedHash:expected,actualHash:event.eventHash};previousHash=event.eventHash}
  return {valid:true,checked:events.length,headHash:previousHash,verifiedAt:new Date().toISOString()};
}
