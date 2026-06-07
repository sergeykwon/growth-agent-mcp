import { renderPromptTemplate } from "./renderTemplate.js";

const TEMPLATE = `You are an expert Product-Market Fit (PMF) analyst and strategist.

**Product**: {{product}}
**Product type**: {{product_type}} (one of: b2c-saas, b2b-saas, marketplace, dtc-ecommerce, other)
**Org context**: {{org_context}} (one of: zero-to-one, new-product, product-extension)
**Current metrics / signal (optional)**: {{metrics}}

Build a V1 PMF hypothesis across **6 dimensions** and identify the riskiest one, then propose validation experiments.

Tailor the analysis to product-type:
- **B2C SaaS** — focus on user acquisition, retention, viral loops
- **B2B SaaS** — focus on buyer vs end-user needs, sales cycle, enterprise requirements
- **Marketplace** — analyze supply and demand sides separately
- **DTC E-commerce** — focus on unit economics, CAC, brand differentiation

Use the **DVF framework** for assumptions:
- **Desirability** — user needs, problem severity, perceived value, solution fit ONLY (NEVER pricing/financial)
- **Viability** — ALL financial assumptions (pricing, WTP, revenue, margins, unit economics)
- **Feasibility** — operational, technical, organizational delivery

Risk model: \`Risk = (10 − Evidence Score) × Failure Impact\`.

Return this JSON (and only this JSON):

\`\`\`json
{
  "summary": "2-3 sentence executive summary",
  "overallConfidence": 5,
  "riskiestDimension": "dimension name",
  "dimensions": [
    { "dimension": "Problem", "confidence": 7, "status": "Validated" },
    { "dimension": "Target Audience", "confidence": 5, "status": "Needs Research" },
    { "dimension": "Value Proposition", "confidence": 6, "status": "Refinement Needed" },
    { "dimension": "Competitive Advantage", "confidence": 4, "status": "At Risk" },
    { "dimension": "Growth Strategy", "confidence": 5, "status": "Needs Research" },
    { "dimension": "Business Model", "confidence": 6, "status": "Refinement Needed" }
  ],
  "assumptions": [
    { "category": "Desirability", "assumption": "I believe ...", "rationale": "Why this matters ..." },
    { "category": "Viability",    "assumption": "I believe ...", "rationale": "..." },
    { "category": "Feasibility",  "assumption": "I believe ...", "rationale": "..." }
  ],
  "dvfTension": "1-2 sentence description of the most significant tension between DVF assumptions",
  "experiments": [
    {
      "assumption": "exact assumption text",
      "category": "Desirability|Viability|Feasibility",
      "learning": "what this confirms or contradicts",
      "type": "Customer Interview|Smoke Test|Concierge Test|Landing Page Test|Prototype Test|Survey",
      "steps": ["preparation step", "execution step", "analysis step"],
      "metric": "what you measure",
      "success": "specific threshold/signal",
      "failure": "specific threshold/signal",
      "effort": "Setup: short, Run: medium, Evidence: strong",
      "uncertainty": "what this won't resolve"
    }
  ],
  "improvements": [
    {
      "title": "improvement action title",
      "description": "1-2 sentences explaining how doing this raises confidence/quality of the PMF analysis (cite methodology or specific research to run)",
      "effort": "low|medium|high"
    }
  ],
  "nextStep": { "phase": "research|synthesis|validate", "reason": "Why this is next" }
}
\`\`\`

Rules:
- \`dimensions\`: always all 6, with integer confidence 1–10
- \`assumptions\`: exactly 3 per DVF category for the riskiest dimension (9 total)
- \`dvfTension\`: surface the most consequential conflict (e.g. desirability strong but viability weak)
- \`experiments\`: 1–2 briefs targeting the highest-risk assumption(s)
- \`improvements\`: 3–5 concrete, methodology-cited next actions (e.g. "Run 10 Problem Interviews with target ICP", "Build a Smoke Test landing page with 3 CTA variants")
- Use real company analogs ($10M+ revenue, similar approach) where relevant — avoid vague advice
- For validation, NEVER say "hypothesis" — say "assumption"
- Desirability NEVER includes pricing/financial assumptions

IMPORTANT: Detect the language of the user's input and respond in that same language. Keep proper nouns, brand names, and URLs in their original form.`;

export const pmfValidationPrompt = {
  name: "pmf-validation",
  description:
    "Growth Prophet's tuned PMF analyst prompt. Builds a 6-dimension PMF hypothesis with DVF assumptions and validation experiment briefs.",
  arguments: [
    {
      name: "product",
      description: "Your product (name + 1-line description).",
      required: true,
    },
    {
      name: "product_type",
      description:
        "Product type: b2c-saas | b2b-saas | marketplace | dtc-ecommerce | other.",
      required: true,
    },
    {
      name: "org_context",
      description:
        "Organizational context: zero-to-one | new-product | product-extension.",
      required: true,
    },
    {
      name: "metrics",
      description:
        "Optional current metrics or qualitative signal (e.g. 'paid pilot with 3 customers, 40% activation, 12% monthly churn').",
      required: false,
    },
  ],
  render(args: Record<string, string | undefined>): string {
    return renderPromptTemplate(TEMPLATE, {
      product: args.product ?? "",
      product_type: args.product_type ?? "other",
      org_context: args.org_context ?? "zero-to-one",
      metrics: args.metrics?.trim() ? args.metrics : "(none provided)",
    });
  },
};
