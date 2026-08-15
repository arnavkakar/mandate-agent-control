import { createHash } from "node:crypto";

const injectionPatterns = [
  /ignore[\s\p{P}\p{S}]*(all[\s\p{P}\p{S}]*)?(previous|prior|above|system)[\s\p{P}\p{S}]*instructions?/iu,
  /(reveal|repeat|print|show)\s+(the\s+)?(system|developer)\s+(prompt|message|instructions?)/i,
  /(act|behave|respond)\s+as\s+(the\s+)?(system|developer|administrator)/i,
  /(?:^|\s)(system|developer|assistant)\s*:\s*/i,
  /(developer|jailbreak)\s+mode/i,
  /(bypass|disable|override)\s+(the\s+)?(policy|authorization|approval|safety|rules?)/i,
  /(approve|authorize)\s+(this|all|any)\s+(transaction|purchase|payment)s?\s+(automatically|regardless)/i,
];

function normalizeSecurityText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[\t ]+/g, " ");
}

function wordSignature(value: string) {
  const word = value.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length < 4) return word;
  return `${word[0]}${[...word.slice(1, -1)].sort().join("")}${word.at(-1)}`;
}

const fuzzyInjectionWords = [
  "ignore",
  "previous",
  "instructions",
  "bypass",
  "override",
  "reveal",
  "system",
  "prompt",
].map(wordSignature);

function containsFuzzyInjection(value: string) {
  const matches = new Set(
    value
      .split(/[^A-Za-z]+/)
      .map(wordSignature)
      .filter((word) => fuzzyInjectionWords.includes(word)),
  );
  return matches.size >= 3;
}

function decodedBase64Segments(value: string) {
  return value.match(/[A-Za-z0-9+/]{24,}={0,2}/g)?.flatMap((segment) => {
    try {
      const decoded = Buffer.from(segment, "base64").toString("utf8");
      const printable = [...decoded].every((character) => {
        const code = character.charCodeAt(0);
        return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
      });
      return printable ? [decoded] : [];
    } catch {
      return [];
    }
  }) ?? [];
}

export function containsPromptInjection(value: string) {
  const normalized = normalizeSecurityText(value);
  if (
    injectionPatterns.some((pattern) => pattern.test(normalized)) ||
    containsFuzzyInjection(normalized)
  ) return true;
  return decodedBase64Segments(normalized).some((decoded) =>
    injectionPatterns.some((pattern) => pattern.test(decoded)) ||
    containsFuzzyInjection(decoded),
  );
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
