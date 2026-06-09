#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { catalogSummary, createGrowthAgentServer } from "./server.js";

async function main(): Promise<void> {
  const server = createGrowthAgentServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio is the protocol channel — keep stderr free for logs.
  console.error(`[growth-marketing-mcp] stdio server ready — ${catalogSummary()}`);
}

main().catch((err) => {
  console.error("[growth-marketing-mcp] fatal:", err);
  process.exit(1);
});
