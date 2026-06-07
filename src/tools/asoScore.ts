import { z } from "zod";

export const asoKeywordScoreInputSchema = {
  type: "object",
  properties: {
    keywords: {
      type: "array",
      description: "Candidate keywords with volume, difficulty, and relevance.",
      items: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "The keyword phrase." },
          volume: {
            type: "number",
            description: "Search popularity / volume (any consistent scale, e.g. 0–100 ASO popularity or absolute searches).",
          },
          difficulty: {
            type: "number",
            description: "Competition / difficulty score 0–100 (higher = harder to rank).",
          },
          relevance: {
            type: "number",
            description: "Relevance to the app 0–100 (how well it matches the product). Defaults to 100.",
            default: 100,
          },
        },
        required: ["keyword", "volume", "difficulty"],
      },
    },
  },
  required: ["keywords"],
} as const;

const ZodInput = z.object({
  keywords: z
    .array(
      z.object({
        keyword: z.string(),
        volume: z.number().nonnegative(),
        difficulty: z.number().min(0).max(100),
        relevance: z.number().min(0).max(100).optional(),
      }),
    )
    .min(1),
});

export interface ToolResult {
  isError: boolean;
  content: { type: "text"; text: string }[];
}

export function runAsoKeywordScore(rawInput: unknown): ToolResult {
  const parsed = ZodInput.safeParse(rawInput);
  if (!parsed.success) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Invalid arguments: ${parsed.error.issues
            .map((i) => `${i.path.join(".")} — ${i.message}`)
            .join("; ")}`,
        },
      ],
    };
  }

  const scored = parsed.data.keywords
    .map((k) => {
      const relevance = k.relevance ?? 100;
      // Opportunity = volume × relevance ÷ difficulty.
      // difficulty is floored at 5 so a near-zero score doesn't explode the ratio.
      const diffFrac = Math.max(k.difficulty, 5) / 100;
      const relFrac = relevance / 100;
      const opportunity = (k.volume * relFrac) / diffFrac;
      return { ...k, relevance, opportunity };
    })
    .sort((a, b) => b.opportunity - a.opportunity);

  const max = scored[0]?.opportunity || 1;
  const rows = scored
    .map((k, i) => {
      const norm = ((k.opportunity / max) * 100).toFixed(0);
      return `| ${i + 1} | ${k.keyword} | ${k.volume} | ${k.difficulty} | ${k.relevance} | **${k.opportunity.toFixed(1)}** | ${norm} |`;
    })
    .join("\n");

  const text =
    `# ASO Keyword Opportunity\n\n` +
    `Opportunity = volume × (relevance ÷ 100) ÷ (difficulty ÷ 100). Ranked high → low.\n\n` +
    `| # | Keyword | Volume | Difficulty | Relevance | Opportunity | Index |\n` +
    `|--:|:--------|-------:|-----------:|----------:|------------:|------:|\n` +
    `${rows}\n\n` +
    `> Prioritize the top of this list for title/subtitle/keyword-field placement. High-difficulty terms only earn their slot when volume × relevance is large enough to overcome the competition.`;

  return { isError: false, content: [{ type: "text", text }] };
}
