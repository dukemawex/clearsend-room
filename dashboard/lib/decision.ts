import { z } from "zod";

const schema = z.object({
  met: z.boolean(),
  summary: z.string().min(1).max(4000),
  criteria: z.array(z.object({
    criterion: z.string().min(1).max(300),
    met: z.boolean(),
    reason: z.string().min(1).max(4000),
  }).strict()).min(1).max(12),
}).strict();

/** Model output is data, not authority. Reject partial/coerced/duplicate verdicts. */
export function parseDecision(content: string, criteria: string[]) {
  const expected = criteria.length ? criteria : ["Meets the specification"];
  if (new Set(expected).size !== expected.length) throw new Error("Duplicate acceptance criteria");
  // Allow a single JSON code fence, not arbitrary prose or embedded objects.
  const text = content.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/, "$1");
  const result = schema.parse(JSON.parse(text));
  const names = result.criteria.map(c => c.criterion);
  if (names.length !== expected.length || new Set(names).size !== names.length ||
      names.some(c => !expected.includes(c))) throw new Error("Verdict must cover every acceptance criterion exactly once");
  return { ...result, met: result.met && result.criteria.every(c => c.met),
    criteria: expected.map(c => result.criteria.find(row => row.criterion === c)!) };
}
