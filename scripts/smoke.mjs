#!/usr/bin/env node
/**
 * smoke.mjs — drive the built server over stdio with a real MCP client and
 * exercise every tool + a prompt. Exits non-zero on any failure.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "..", "dist", "index.js");

let failures = 0;
const ok = (label, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
};

const transport = new StdioClientTransport({ command: "node", args: [ENTRY] });
const client = new Client({ name: "smoke", version: "0.0.0" }, { capabilities: {} });
await client.connect(transport);

// tools/list
const { tools } = await client.listTools();
const toolNames = tools.map((t) => t.name).sort();
ok("tools/list", toolNames.length === 5, toolNames.join(", "));

// growth_playbook: catalog overview
const overview = await client.callTool({ name: "growth_playbook", arguments: {} });
ok("growth_playbook(overview)", overview.content[0].text.includes("Playbook Catalog"));

// growth_playbook: search
const search = await client.callTool({
  name: "growth_playbook",
  arguments: { query: "cold email sequence" },
});
const searchText = search.content[0].text;
ok("growth_playbook(search)", /id: `/.test(searchText), searchText.split("\n")[0]);
const firstId = (searchText.match(/id: `([^`]+)`/) || [])[1];

// growth_playbook: fetch by id
const fetch = await client.callTool({
  name: "growth_playbook",
  arguments: { id: firstId },
});
ok("growth_playbook(get)", fetch.content[0].text.includes("# Playbook:"), firstId);

// growth_playbook: group filter
const grouped = await client.callTool({
  name: "growth_playbook",
  arguments: { query: "audit", group: "ads" },
});
ok("growth_playbook(group=ads)", grouped.content[0].text.includes("group: ads"));

// unit_economics
const ue = await client.callTool({
  name: "unit_economics",
  arguments: { cac: 300, arpu: 50, grossMarginPct: 80, monthlyChurnPct: 5 },
});
const ueText = ue.content[0].text;
// lifetime = 20mo, LTV = 50*0.8*20 = 800, ratio = 2.67, payback = 300/40 = 7.5mo
ok("unit_economics(LTV)", ueText.includes("$800"), "expect LTV $800");
ok("unit_economics(ratio)", ueText.includes("2.67"), "expect 2.67:1");
ok("unit_economics(payback)", ueText.includes("7.5 months"), "expect 7.5mo");

// aso_keyword_score
const aso = await client.callTool({
  name: "aso_keyword_score",
  arguments: {
    keywords: [
      { keyword: "budget app", volume: 80, difficulty: 70, relevance: 90 },
      { keyword: "expense tracker", volume: 60, difficulty: 30, relevance: 100 },
    ],
  },
});
const asoText = aso.content[0].text;
// expense tracker: 60*1/0.3 = 200; budget app: 80*0.9/0.7 = 102.8 → tracker ranks #1
ok("aso_keyword_score(rank)", asoText.indexOf("expense tracker") < asoText.indexOf("budget app"));

// ab_test_planner
const ab = await client.callTool({
  name: "ab_test_planner",
  arguments: { baselineRatePct: 4, mdeRelativePct: 20, dailyVisitorsTotal: 2000 },
});
const abText = ab.content[0].text;
ok("ab_test_planner(sample)", /Per variant: [\d,]+/.test(abText), abText.match(/Per variant: [\d,]+/)?.[0]);
ok("ab_test_planner(duration)", abText.includes("days"));

// dau_projection
const dau = await client.callTool({
  name: "dau_projection",
  arguments: { d1: 40, d30: 20, d180: 10, dailyNewUsers: 1000, days: 90 },
});
ok("dau_projection", dau.content[0].text.includes("# DAU Projection"));

// prompts
const { prompts } = await client.listPrompts();
ok("prompts/list", prompts.length === 4, prompts.map((p) => p.name).join(", "));
const audit = await client.getPrompt({ name: "growth-audit", arguments: { product: "Acme" } });
ok("prompts/get(growth-audit)", audit.messages[0].content.text.includes("full-funnel growth audit"));

await client.close();
console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
