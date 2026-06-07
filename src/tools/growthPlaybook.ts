import { z } from "zod";
import {
  getPlaybookById,
  listGroups,
  searchPlaybooks,
} from "../playbooks/catalog.js";

export const growthPlaybookInputSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        "Natural-language topic or keywords to find the right playbook (e.g. 'cold email sequence', 'app store keyword optimization', 'reduce checkout drop-off', 'series A pmf validation'). Omit when fetching a known id.",
    },
    id: {
      type: "string",
      description:
        "Exact playbook id (from a prior search result) to fetch the full playbook text. Takes priority over `query`.",
    },
    group: {
      type: "string",
      enum: ["growth-marketing", "ads", "pmf", "seo"],
      description: "Optional filter restricting search to one discipline group.",
    },
    limit: {
      type: "integer",
      description: "Max search results to return. Defaults to 10.",
      default: 10,
    },
  },
} as const;

const ZodInput = z.object({
  query: z.string().optional(),
  id: z.string().optional(),
  group: z.enum(["growth-marketing", "ads", "pmf", "seo"]).optional(),
  limit: z.number().int().positive().max(40).optional(),
});

export interface ToolResult {
  isError: boolean;
  content: { type: "text"; text: string }[];
}

function text(t: string, isError = false): ToolResult {
  return { isError, content: [{ type: "text", text: t }] };
}

export function runGrowthPlaybook(rawInput: unknown): ToolResult {
  const parsed = ZodInput.safeParse(rawInput);
  if (!parsed.success) {
    return text(
      `Invalid arguments: ${parsed.error.issues
        .map((i) => `${i.path.join(".")} — ${i.message}`)
        .join("; ")}`,
      true,
    );
  }

  const { query, id, group, limit = 10 } = parsed.data;

  // 1. Fetch a specific playbook by id.
  if (id) {
    const hit = getPlaybookById(id);
    if (!hit) {
      return text(
        `No playbook with id "${id}". Call growth_playbook with a \`query\` to search the catalog first.`,
        true,
      );
    }
    return text(
      `# Playbook: ${hit.entry.title}\n` +
        `_id: ${hit.entry.id} · group: ${hit.entry.group} · source: ${hit.entry.skill}/${hit.entry.source}_\n\n` +
        `---\n\n${hit.content}\n\n---\n\n` +
        `Apply this playbook to the user's product/context. Detect the user's language and respond in it. Use the calculators (unit_economics, aso_keyword_score, ab_test_planner, dau_projection) for any quantitative step.`,
    );
  }

  // 2. Search by query (and/or group).
  if (query || group) {
    const results = searchPlaybooks(query ?? "", { group, limit });
    if (results.length === 0) {
      return text(
        `No playbooks matched "${query ?? ""}"${group ? ` in group "${group}"` : ""}.\n\n` +
          renderGroupsOverview(),
      );
    }
    const lines = results
      .map(
        (r, i) =>
          `${i + 1}. **${r.entry.title}**\n` +
          `   - id: \`${r.entry.id}\` · group: ${r.entry.group}\n` +
          `   - ${r.entry.snippet}`,
      )
      .join("\n\n");
    return text(
      `Found ${results.length} matching playbook(s)${group ? ` in "${group}"` : ""}:\n\n` +
        `${lines}\n\n` +
        `→ Call growth_playbook again with \`id\` set to the best match to load its full playbook.`,
    );
  }

  // 3. No args — orient the agent with the catalog overview.
  return text(renderGroupsOverview());
}

function renderGroupsOverview(): string {
  const groups = listGroups();
  const total = groups.reduce((s, g) => s + g.count, 0);
  const rows = groups.map((g) => `- **${g.group}** — ${g.count} playbooks`).join("\n");
  return (
    `# Growth Agent — Playbook Catalog\n\n` +
    `${total} expert growth playbooks across ${groups.length} discipline groups:\n\n` +
    `${rows}\n\n` +
    `Search with \`growth_playbook({ query: "..." })\` (optionally \`group\`), then fetch the full text with \`growth_playbook({ id: "..." })\`.\n\n` +
    `Examples:\n` +
    `- \`{ query: "improve signup conversion" }\`\n` +
    `- \`{ query: "google ads audit", group: "ads" }\`\n` +
    `- \`{ query: "keyword metadata", group: "growth-marketing" }\``
  );
}
