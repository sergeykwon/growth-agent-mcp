import { renderPromptTemplate } from "./renderTemplate.js";

const TEMPLATE = `You are a growth engineer. Design **2–3 growth loops** for the user's product.

**Product**: {{product}}
**Primary acquisition channel today (optional)**: {{acquisition_channel}}
**Stage / current metrics (optional)**: {{stage}}

A growth loop, unlike a funnel, is **self-reinforcing**: output of the loop feeds back into the trigger of the next iteration. Examples: content loop (UGC SEO), viral loop (invites), paid-payback loop (ad spend funded by revenue), data network effect loop.

For **each** loop, return:
1. **Name** (e.g. "User-generated SEO loop", "Two-sided referral loop")
2. **Trigger → Action → Output → Reinvestment** (the four loop steps, made concrete for this product)
3. **Why it compounds** — what specifically reinvests into the trigger
4. **Quantitative assumption** — expected **k-factor** (for viral) or **payback period** (for paid) or **content-to-traffic conversion** (for content), with a baseline number to test
5. **Instrumentation** — the 3–4 metrics to measure each step
6. **Failure modes** — top 2 ways this loop can break (e.g. virality decay, content saturation, CAC inflation)
7. **First 30-day experiment** — the cheapest test to validate the loop's core assumption

Return this JSON (and only this JSON):

\`\`\`json
{
  "summary": "1-2 sentence overview of recommended loop portfolio and why this combination fits the stage",
  "loops": [
    {
      "name": "...",
      "type": "content | viral | paid-payback | data-network | sales-led",
      "trigger": "...",
      "action": "...",
      "output": "...",
      "reinvestment": "...",
      "why_it_compounds": "...",
      "quantitative_assumption": { "metric": "k-factor | CAC payback months | content→signup %", "target": "...", "baseline_to_test": "..." },
      "instrumentation": ["metric 1", "metric 2", "metric 3"],
      "failure_modes": ["...", "..."],
      "first_experiment": {
        "name": "...",
        "duration": "30 days",
        "what_to_build": "...",
        "success_signal": "specific threshold",
        "cost_estimate": "..."
      }
    }
  ],
  "portfolio_logic": "Why these specific loops together, and what NOT to attempt yet"
}
\`\`\`

Guidance:
- Recommend loops appropriate for the **current stage**. Early-stage products should rarely attempt more than one paid loop at once.
- Be concrete to this product — generic "build a referral program" is unacceptable. Reference the actual user behavior and value proposition.
- If the product has no plausible viral mechanic, say so and recommend a content or sales-led loop instead. Do NOT force a viral loop where it doesn't fit.

IMPORTANT: Detect the language of the user's input and respond in that same language. Keep proper nouns, brand names, and URLs in their original form.`;

export const growthLoopDesignPrompt = {
  name: "growth-loop-design",
  description:
    "Growth Prophet's tuned growth-engineering prompt. Designs 2–3 self-reinforcing growth loops with quantitative assumptions and a 30-day validation experiment.",
  arguments: [
    {
      name: "product",
      description: "Your product (name + 1-line description).",
      required: true,
    },
    {
      name: "acquisition_channel",
      description:
        "Optional. Primary acquisition channel today (e.g. 'paid Google ads', 'SEO', 'cold outbound').",
      required: false,
    },
    {
      name: "stage",
      description:
        "Optional. Company stage and/or current metrics (e.g. 'seed, 500 MAU, $5k MRR').",
      required: false,
    },
  ],
  render(args: Record<string, string | undefined>): string {
    return renderPromptTemplate(TEMPLATE, {
      product: args.product ?? "",
      acquisition_channel: args.acquisition_channel?.trim()
        ? args.acquisition_channel
        : "(not specified)",
      stage: args.stage?.trim() ? args.stage : "(not specified)",
    });
  },
};
