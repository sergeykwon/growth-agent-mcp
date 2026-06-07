import { z } from "zod";
import { zPower, zTwoSided } from "../lib/stats.js";

export const abTestPlannerInputSchema = {
  type: "object",
  properties: {
    baselineRatePct: {
      type: "number",
      description: "Current baseline conversion rate as a percent (0–100), e.g. 4 for 4%.",
    },
    mdeRelativePct: {
      type: "number",
      description: "Minimum detectable effect as a RELATIVE lift percent, e.g. 10 means detect a 10% lift (4% → 4.4%). Provide this or mdeAbsolutePct.",
    },
    mdeAbsolutePct: {
      type: "number",
      description: "Minimum detectable effect in ABSOLUTE percentage points, e.g. 0.5 means 4% → 4.5%.",
    },
    powerPct: { type: "number", description: "Statistical power percent. Defaults to 80.", default: 80 },
    alphaPct: { type: "number", description: "Significance level percent (two-sided). Defaults to 5.", default: 5 },
    variants: { type: "integer", description: "Number of variants including control. Defaults to 2.", default: 2 },
    dailyVisitorsTotal: {
      type: "number",
      description: "Optional total daily visitors entering the test (split across variants), used to estimate test duration.",
    },
  },
  required: ["baselineRatePct"],
} as const;

const ZodInput = z.object({
  baselineRatePct: z.number().gt(0).lt(100),
  mdeRelativePct: z.number().gt(0).optional(),
  mdeAbsolutePct: z.number().gt(0).optional(),
  powerPct: z.number().gt(0).lt(100).optional(),
  alphaPct: z.number().gt(0).lt(50).optional(),
  variants: z.number().int().min(2).max(10).optional(),
  dailyVisitorsTotal: z.number().positive().optional(),
});

export interface ToolResult {
  isError: boolean;
  content: { type: "text"; text: string }[];
}

export function runAbTestPlanner(rawInput: unknown): ToolResult {
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

  const d = parsed.data;
  if (d.mdeRelativePct == null && d.mdeAbsolutePct == null) {
    return {
      isError: true,
      content: [{ type: "text", text: "Provide either mdeRelativePct or mdeAbsolutePct." }],
    };
  }

  const p1 = d.baselineRatePct / 100;
  const absLift =
    d.mdeAbsolutePct != null
      ? d.mdeAbsolutePct / 100
      : (d.mdeRelativePct! / 100) * p1;
  const p2 = p1 + absLift;
  if (p2 >= 1) {
    return {
      isError: true,
      content: [{ type: "text", text: "MDE pushes the target rate to ≥100%. Lower the MDE." }],
    };
  }

  const power = (d.powerPct ?? 80) / 100;
  const alpha = (d.alphaPct ?? 5) / 100;
  const variants = d.variants ?? 2;

  const zA = zTwoSided(alpha);
  const zB = zPower(power);

  // Two-proportion sample size per variant.
  const nPerVariant = Math.ceil(
    (Math.pow(zA + zB, 2) * (p1 * (1 - p1) + p2 * (1 - p2))) / Math.pow(p2 - p1, 2),
  );
  const totalN = nPerVariant * variants;

  const lines: string[] = [
    "# A/B Test Plan",
    "",
    "**Inputs**",
    `- Baseline: ${d.baselineRatePct}%`,
    `- Target: ${(p2 * 100).toFixed(3)}% (${
      d.mdeAbsolutePct != null
        ? `+${d.mdeAbsolutePct}pp absolute`
        : `+${d.mdeRelativePct}% relative`
    })`,
    `- Power: ${(power * 100).toFixed(0)}% · Significance: ${(alpha * 100).toFixed(0)}% (two-sided)`,
    `- Variants: ${variants}`,
    "",
    "**Required sample**",
    `- **Per variant: ${nPerVariant.toLocaleString()}** conversions-eligible visitors`,
    `- **Total: ${totalN.toLocaleString()}** across all variants`,
  ];

  if (d.dailyVisitorsTotal != null) {
    const perVariantDaily = d.dailyVisitorsTotal / variants;
    const days = Math.ceil(nPerVariant / perVariantDaily);
    lines.push(
      "",
      "**Estimated duration**",
      `- At ${d.dailyVisitorsTotal.toLocaleString()} visitors/day (${Math.round(perVariantDaily).toLocaleString()}/variant): **~${days} days**`,
    );
    if (days < 7) lines.push(`- ⚠️ Run at least 1–2 full weeks regardless, to cover weekly seasonality.`);
  }

  lines.push(
    "",
    `> Don't peek-and-stop: fixing the sample size up front keeps the ${(alpha * 100).toFixed(0)}% false-positive rate honest. Let the test reach its required N before deciding.`,
  );

  return { isError: false, content: [{ type: "text", text: lines.join("\n") }] };
}
