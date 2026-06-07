import { renderPromptTemplate } from "./renderTemplate.js";

const TEMPLATE = `You are a senior growth advisor running a full-funnel growth audit. Act as an agent: pull the relevant Growth Prophet playbooks and run the quantitative tools yourself before giving recommendations.

**Product / company**: {{product}}
**Stage & context (optional)**: {{context}}
**Primary goal (optional, e.g. activation, revenue, retention)**: {{goal}}

Run the audit in this order:

1. **Orient** — call \`growth_playbook\` (no args) to see the catalog of disciplines available.
2. **Diagnose the funnel** — for each stage that matters to this product (acquisition → activation → retention → revenue → referral), call \`growth_playbook({ query: ... })\` to load the matching playbook(s), then apply them to this product. Cover at minimum: one acquisition channel, CRO/activation, retention/churn, and pricing/monetization.
3. **Quantify** — wherever a number is involved, use the calculators instead of guessing:
   - \`unit_economics\` for CAC / LTV / payback / ROAS
   - \`dau_projection\` for growth/retention modeling
   - \`aso_keyword_score\` if it's a mobile app
   - \`ab_test_planner\` to size any experiment you propose
4. **Synthesize** — deliver:
   - **Top 3 growth levers** ranked by expected impact × ease, each tied to the playbook it came from.
   - **30-day action plan** — concrete experiments, each with a hypothesis, the metric it moves, and (via ab_test_planner) how long it must run.
   - **Risks / unknowns** — what data you'd need to be more confident.

Be specific and opinionated — no generic advice. Every recommendation should trace back to a playbook you actually loaded or a number you actually computed.

IMPORTANT: Detect the language of the user's input and respond in that same language. Keep brand names and metric names in their conventional form.`;

export const growthAuditPrompt = {
  name: "growth-audit",
  description:
    "Run a full-funnel growth audit as an agent: pulls the relevant growth playbooks, runs the unit-economics / DAU / A/B calculators, and returns ranked levers + a 30-day experiment plan.",
  arguments: [
    { name: "product", description: "The product or company to audit.", required: true },
    { name: "context", description: "Stage, traction, channels, or other context.", required: false },
    { name: "goal", description: "Primary growth goal to optimize for.", required: false },
  ],
  render(args: Record<string, string | undefined>): string {
    return renderPromptTemplate(TEMPLATE, {
      product: args.product ?? "(not provided)",
      context: args.context ?? "(not provided)",
      goal: args.goal ?? "(not provided)",
    });
  },
};
