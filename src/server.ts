import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  dauProjectionInputSchema,
  runDauProjection,
} from "./tools/dauProjection.js";
import {
  growthPlaybookInputSchema,
  runGrowthPlaybook,
} from "./tools/growthPlaybook.js";
import {
  unitEconomicsInputSchema,
  runUnitEconomics,
} from "./tools/unitEconomics.js";
import {
  asoKeywordScoreInputSchema,
  runAsoKeywordScore,
} from "./tools/asoScore.js";
import {
  abTestPlannerInputSchema,
  runAbTestPlanner,
} from "./tools/abTest.js";
import { listGroups } from "./playbooks/catalog.js";
import { findPrompt, PROMPTS } from "./prompts/index.js";

const SERVER_INFO = {
  name: "growth-marketing-mcp",
  version: "0.1.0",
} as const;

type ToolHandler = (args: unknown) => {
  isError: boolean;
  content: { type: "text"; text: string }[];
};

const TOOLS: {
  name: string;
  description: string;
  inputSchema: unknown;
  run: ToolHandler;
}[] = [
  {
    name: "growth_playbook",
    description:
      "Retrieve Growth Prophet's expert growth playbooks on demand. Call with no args to see the catalog, with `query` (+ optional `group`) to search, or with `id` to fetch a full playbook. Covers ASO, Apple Search Ads, SEO, CRO, copywriting, paid ads (Google/Meta/TikTok/LinkedIn/Microsoft/Apple/YouTube), cold email, email sequences, lead magnets, referral, launch, pricing, churn, RevOps, sales enablement, PMF, and more. Use this whenever the user asks for growth/marketing help — load the matching playbook, then apply it.",
    inputSchema: growthPlaybookInputSchema,
    run: runGrowthPlaybook,
  },
  {
    name: "unit_economics",
    description:
      "Compute SaaS/growth unit economics: LTV, LTV:CAC ratio, CAC payback period, and ROAS. Accepts CAC (or adSpend + newCustomers), ARPU, gross margin, and either monthly churn or lifetime months. Use for any pricing, acquisition, or monetization analysis.",
    inputSchema: unitEconomicsInputSchema,
    run: runUnitEconomics,
  },
  {
    name: "aso_keyword_score",
    description:
      "Rank app store keywords by opportunity = volume × relevance ÷ difficulty. Pass an array of {keyword, volume, difficulty, relevance}. Use for ASO keyword prioritization (title/subtitle/keyword-field placement).",
    inputSchema: asoKeywordScoreInputSchema,
    run: runAsoKeywordScore,
  },
  {
    name: "ab_test_planner",
    description:
      "Calculate required sample size per variant and (optionally) test duration for an A/B test, given baseline rate, minimum detectable effect, power, and significance. Use to size any experiment before running it.",
    inputSchema: abTestPlannerInputSchema,
    run: runAbTestPlanner,
  },
  {
    name: "dau_projection",
    description:
      "Calculate a DAU (Daily Active Users) projection using a piecewise power-law retention curve fit through Day-1, Day-30, and Day-180 retention rates. Cohort-sums daily over the horizon. Pure math — no LLM calls. Returns LT30, LT180, and a milestone table.",
    inputSchema: dauProjectionInputSchema,
    run: runDauProjection,
  },
];

export function createGrowthAgentServer(): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
      prompts: {},
    },
  });

  // ── tools/list ──────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  // ── tools/call ──────────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    const result = tool.run(args ?? {});
    return { content: result.content, isError: result.isError };
  });

  // ── prompts/list ────────────────────────────────────────────────────────
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  }));

  // ── prompts/get ─────────────────────────────────────────────────────────
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompt = findPrompt(name);
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }
    const rendered = prompt.render(args ?? {});
    return {
      description: prompt.description,
      messages: [
        {
          role: "user",
          content: { type: "text", text: rendered },
        },
      ],
    };
  });

  return server;
}

/** Catalog size, used by the startup log so operators can confirm the corpus loaded. */
export function catalogSummary(): string {
  const groups = listGroups();
  const total = groups.reduce((s, g) => s + g.count, 0);
  return `${total} playbooks (${groups.map((g) => `${g.group}:${g.count}`).join(", ")})`;
}
