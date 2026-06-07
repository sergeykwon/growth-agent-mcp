import { z } from "zod";
import {
  generateForecastData,
  lifetimeDays,
  validateRetentionInputs,
  type ForecastPoint,
} from "../lib/dauMath.js";

export const dauProjectionInputSchema = {
  type: "object",
  properties: {
    d1: {
      type: "number",
      description: "Day-1 retention rate as a percent (0–100). e.g. 40 means 40%.",
    },
    d30: {
      type: "number",
      description: "Day-30 retention rate as a percent (0–100). Must be ≤ d1.",
    },
    d180: {
      type: "number",
      description: "Day-180 retention rate as a percent (0–100). Must be ≤ d30.",
    },
    dailyNewUsers: {
      type: "number",
      description: "Daily new user acquisition (DNU). Defaults to 1000.",
      default: 1000,
    },
    days: {
      type: "integer",
      description: "Projection horizon in days. Defaults to 180.",
      default: 180,
    },
    existingDAU: {
      type: "number",
      description: "Optional existing DAU base at day 0. Defaults to 0.",
      default: 0,
    },
    monthlyChurnPct: {
      type: "number",
      description:
        "Optional monthly churn percent for the existing DAU base (0–100). Defaults to 0.",
      default: 0,
    },
  },
  required: ["d1", "d30", "d180"],
} as const;

const ZodInput = z.object({
  d1: z.number(),
  d30: z.number(),
  d180: z.number(),
  dailyNewUsers: z.number().positive().optional(),
  days: z.number().int().positive().max(3650).optional(),
  existingDAU: z.number().nonnegative().optional(),
  monthlyChurnPct: z.number().min(0).max(100).optional(),
});

export interface DauProjectionResult {
  isError: boolean;
  content: { type: "text"; text: string }[];
}

export function runDauProjection(rawInput: unknown): DauProjectionResult {
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

  const {
    d1,
    d30,
    d180,
    dailyNewUsers = 1000,
    days = 180,
    existingDAU = 0,
    monthlyChurnPct = 0,
  } = parsed.data;

  const v = validateRetentionInputs(d1, d30, d180);
  if (!v.ok) {
    return {
      isError: true,
      content: [{ type: "text", text: v.error }],
    };
  }

  const curve = generateForecastData({
    d1,
    d30,
    d180,
    dailyNewUsers,
    days,
    existingDAU,
    monthlyChurnPct,
  });

  const lt30 = lifetimeDays(d1, d30, d180, 30);
  const lt180 = lifetimeDays(d1, d30, d180, 180);

  return {
    isError: false,
    content: [{ type: "text", text: formatResult({ curve, lt30, lt180, input: parsed.data }) }],
  };
}

function formatResult(args: {
  curve: ForecastPoint[];
  lt30: number;
  lt180: number;
  input: z.infer<typeof ZodInput>;
}): string {
  const { curve, lt30, lt180, input } = args;

  const milestoneDays = [0, 1, 7, 14, 30, 60, 90, 180, 365].filter(
    (d) => d < curve.length,
  );
  const lastDay = curve.length - 1;
  if (!milestoneDays.includes(lastDay)) milestoneDays.push(lastDay);

  const rows = milestoneDays
    .map((d) => {
      const p = curve[d];
      return `| ${p.day} | ${p.date} | ${p.existing.toLocaleString()} | ${p.new.toLocaleString()} | **${p.total.toLocaleString()}** |`;
    })
    .join("\n");

  const finalDAU = curve[curve.length - 1]?.total ?? 0;

  return `# DAU Projection

**Inputs**
- D1 retention: ${input.d1}%
- D30 retention: ${input.d30}%
- D180 retention: ${input.d180}%
- Daily new users (DNU): ${(input.dailyNewUsers ?? 1000).toLocaleString()}
- Horizon: ${input.days ?? 180} days
- Existing DAU base: ${(input.existingDAU ?? 0).toLocaleString()}
- Monthly churn (existing): ${input.monthlyChurnPct ?? 0}%

**Lifetime metrics (per acquired user)**
- LT30 (expected active days in first 30): **${lt30.toFixed(2)}**
- LT180 (expected active days in first 180): **${lt180.toFixed(2)}**

**Projection (milestone days)**

| Day | Date | Existing DAU | New-user DAU | Total DAU |
|----:|:-----|-------------:|-------------:|----------:|
${rows}

**Final DAU (day ${lastDay}):** ${finalDAU.toLocaleString()}

> Math: piecewise power-law retention fit through (1, D1), (30, D30), (180, D180), cohort-summed daily.
`;
}
