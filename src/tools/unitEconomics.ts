import { z } from "zod";

export const unitEconomicsInputSchema = {
  type: "object",
  properties: {
    cac: {
      type: "number",
      description: "Customer acquisition cost ($ per new customer). Optional if adSpend + newCustomers are given.",
    },
    adSpend: { type: "number", description: "Total acquisition spend ($) over a period. Used with newCustomers to derive CAC and with revenue for ROAS." },
    newCustomers: { type: "number", description: "New customers acquired from that spend. Used to derive CAC." },
    revenue: { type: "number", description: "Revenue ($) attributed to adSpend, for ROAS." },
    arpu: {
      type: "number",
      description: "Average monthly revenue per customer/account ($). Required for LTV.",
    },
    grossMarginPct: {
      type: "number",
      description: "Gross margin percent applied to revenue (0–100). Defaults to 80.",
      default: 80,
    },
    monthlyChurnPct: {
      type: "number",
      description: "Monthly customer/revenue churn percent (0–100). Provide this OR lifetimeMonths to get LTV.",
    },
    lifetimeMonths: {
      type: "number",
      description: "Average customer lifetime in months. Alternative to monthlyChurnPct.",
    },
  },
} as const;

const ZodInput = z.object({
  cac: z.number().nonnegative().optional(),
  adSpend: z.number().nonnegative().optional(),
  newCustomers: z.number().positive().optional(),
  revenue: z.number().nonnegative().optional(),
  arpu: z.number().nonnegative().optional(),
  grossMarginPct: z.number().min(0).max(100).optional(),
  monthlyChurnPct: z.number().min(0).max(100).optional(),
  lifetimeMonths: z.number().positive().optional(),
});

export interface ToolResult {
  isError: boolean;
  content: { type: "text"; text: string }[];
}

const money = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function runUnitEconomics(rawInput: unknown): ToolResult {
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
  const gmFrac = (d.grossMarginPct ?? 80) / 100;

  // Derive CAC.
  let cac = d.cac;
  if (cac == null && d.adSpend != null && d.newCustomers != null) {
    cac = d.adSpend / d.newCustomers;
  }

  // Derive lifetime.
  let lifetimeMonths = d.lifetimeMonths;
  if (lifetimeMonths == null && d.monthlyChurnPct != null && d.monthlyChurnPct > 0) {
    lifetimeMonths = 100 / d.monthlyChurnPct; // 1 / churnFraction
  }

  const lines: string[] = ["# Unit Economics", ""];
  const notes: string[] = [];

  lines.push("**Inputs**");
  if (cac != null) lines.push(`- CAC: ${money(cac)}${d.cac == null ? " (derived from adSpend ÷ newCustomers)" : ""}`);
  if (d.arpu != null) lines.push(`- ARPU (monthly): ${money(d.arpu)}`);
  lines.push(`- Gross margin: ${(gmFrac * 100).toFixed(0)}%`);
  if (d.monthlyChurnPct != null) lines.push(`- Monthly churn: ${d.monthlyChurnPct}%`);
  if (lifetimeMonths != null) lines.push(`- Avg lifetime: ${lifetimeMonths.toFixed(1)} months`);
  lines.push("");

  // LTV
  let ltv: number | null = null;
  if (d.arpu != null && lifetimeMonths != null) {
    ltv = d.arpu * gmFrac * lifetimeMonths;
  }

  lines.push("**Results**");
  if (ltv != null) {
    lines.push(`- **LTV** (gross-margin adjusted): ${money(ltv)}`);
  } else {
    notes.push("LTV needs `arpu` plus either `monthlyChurnPct` or `lifetimeMonths`.");
  }

  if (ltv != null && cac != null && cac > 0) {
    const ratio = ltv / cac;
    const verdict = ratio >= 3 ? "✅ healthy (≥3)" : ratio >= 1 ? "⚠️ thin (1–3)" : "🚨 unprofitable (<1)";
    lines.push(`- **LTV : CAC** = ${ratio.toFixed(2)} : 1 — ${verdict}`);
  }

  if (cac != null && d.arpu != null) {
    const monthlyContribution = d.arpu * gmFrac;
    if (monthlyContribution > 0) {
      const payback = cac / monthlyContribution;
      const verdict = payback <= 12 ? "✅ <12mo" : payback <= 18 ? "⚠️ 12–18mo" : "🚨 >18mo";
      lines.push(`- **CAC payback**: ${payback.toFixed(1)} months — ${verdict}`);
    }
  }

  if (d.revenue != null && d.adSpend != null && d.adSpend > 0) {
    const roas = d.revenue / d.adSpend;
    lines.push(`- **ROAS**: ${roas.toFixed(2)}x (${money(d.revenue)} rev ÷ ${money(d.adSpend)} spend)`);
  }

  if (notes.length) {
    lines.push("", "**Notes**", ...notes.map((n) => `- ${n}`));
  }

  lines.push(
    "",
    "> Benchmarks: LTV:CAC ≥ 3:1 and CAC payback < 12 months are the common SaaS health bars. Below 1:1 you lose money per customer.",
  );

  return { isError: false, content: [{ type: "text", text: lines.join("\n") }] };
}
