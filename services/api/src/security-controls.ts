import { createHash } from "node:crypto";

const injectionPatterns = [
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+instructions?/i,
  /(reveal|repeat|print|show)\s+(the\s+)?(system|developer)\s+(prompt|message|instructions?)/i,
  /(act|behave|respond)\s+as\s+(the\s+)?(system|developer|administrator)/i,
  /(?:^|\s)(system|developer|assistant)\s*:\s*/i,
  /(bypass|disable|override)\s+(the\s+)?(policy|authorization|approval|safety|rules?)/i,
  /(approve|authorize)\s+(this|all|any)\s+(transaction|purchase|payment)s?\s+(automatically|regardless)/i,
];

export function containsPromptInjection(value: string) {
  return injectionPatterns.some((pattern) => pattern.test(value));
}

export function stableSecurityIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function containsControlCharacters(value: string) {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || (code < 32 && code !== 9 && code !== 10 && code !== 13);
  });
}
