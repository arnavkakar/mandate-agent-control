import { createHash, randomBytes } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);
export const hashPassword = (password: string) => hash(password, 12);
export const verifyPassword = (password: string, digest: string) => compare(password, digest);
export const hashApiKey = (key: string) => createHash("sha256").update(key).digest("hex");
export function issueApiKey() { const key = `mnd_live_${randomBytes(32).toString("base64url")}`; return { key, prefix: key.slice(0, 17), hash: hashApiKey(key) }; }
export async function issueToken(userId: string, organizationId: string) { return new SignJWT({ organizationId }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuer("mandate-api").setAudience("mandate-dashboard").setSubject(userId).setJti(randomBytes(16).toString("hex")).setIssuedAt().setExpirationTime("12h").sign(secret); }
export async function verifyToken(token: string) { const result = await jwtVerify(token, secret, { algorithms: ["HS256"], issuer: "mandate-api", audience: "mandate-dashboard" }); if (!result.payload.sub || typeof result.payload.organizationId !== "string") throw new Error("Malformed session"); return { userId: result.payload.sub, organizationId: result.payload.organizationId }; }
