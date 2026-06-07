import { renderPromptTemplate } from "./renderTemplate.js";

const TEMPLATE = `You are a competitive intelligence expert. Analyze the user's product and its competitive landscape.

**User's product**: {{product}}
**Category / market**: {{category}}
**Known competitors (optional, may be empty)**: {{competitors}}

Return this JSON (and only this JSON — no prose before or after):

\`\`\`json
{
  "summary": "1-2 sentence overview",
  "your_product": {
    "name": "...",
    "positioning": "...",
    "strengths": ["..."],
    "weaknesses": ["..."]
  },
  "competitors": [
    {
      "name": "...",
      "url": "...",
      "positioning": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "pricing": "...",
      "threat_level": "high | medium | low"
    }
  ],
  "differentiation": {
    "unique_advantages": ["..."],
    "gaps_to_fill": ["..."],
    "positioning_recommendation": "..."
  },
  "battlecard": {
    "when_they_say": [{ "objection": "...", "response": "..." }],
    "win_themes": ["..."]
  }
}
\`\`\`

Guidance:
- Identify 3–6 real competitors. If \`competitors\` is provided, include those first and then add any obvious ones the user missed.
- Each competitor's \`strengths\` and \`weaknesses\` must be specific and observable — no platitudes.
- \`threat_level\` reflects overlap with the user's ICP × differentiation moat, not raw company size.
- \`battlecard.when_they_say\` should contain 2–4 of the most common buyer objections that favor competitors, with concise responses.

IMPORTANT: Detect the language of the user's product/category text and respond in that same language. If the input is in Korean, all JSON string values must be in Korean. If in English, respond in English. Keep proper nouns, brand names, and URLs in their original form.`;

export const competitorAnalysisPrompt = {
  name: "competitor-analysis",
  description:
    "Growth Prophet's tuned competitive-intelligence prompt. Generates a positioning + battlecard JSON for a product against its competitors.",
  arguments: [
    {
      name: "product",
      description: "Your product (name + 1-line description, e.g. 'Notion — collaborative workspace for teams').",
      required: true,
    },
    {
      name: "category",
      description: "Category or market (e.g. 'SaaS productivity', 'DTC skincare').",
      required: true,
    },
    {
      name: "competitors",
      description: "Optional comma-separated list of known competitors (e.g. 'Coda, Roam, Obsidian'). Leave empty to let the model find them.",
      required: false,
    },
  ],
  render(args: Record<string, string | undefined>): string {
    return renderPromptTemplate(TEMPLATE, {
      product: args.product ?? "",
      category: args.category ?? "",
      competitors: args.competitors?.trim() ? args.competitors : "(none provided — please identify the top 3–6)",
    });
  },
};
