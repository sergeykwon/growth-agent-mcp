#!/usr/bin/env node
/**
 * smoke-http.mjs — boot the built HTTP server on an ephemeral port and drive it
 * with a real MCP Streamable HTTP client. Verifies the remote/connector path.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "..", "dist", "http.js");
const PORT = 39817;

let failures = 0;
const ok = (label, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
};

const child = spawn("node", [ENTRY], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "inherit", "inherit"],
});

const waitForReady = () =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + 8000;
    const tick = async () => {
      try {
        const r = await fetch(`http://localhost:${PORT}/health`);
        if (r.ok) return resolve(await r.json());
      } catch {
        /* not up yet */
      }
      if (Date.now() > deadline) return reject(new Error("server did not start"));
      setTimeout(tick, 150);
    };
    tick();
  });

try {
  const health = await waitForReady();
  ok("GET /health", health.status === "ok", health.catalog);

  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${PORT}/mcp`),
  );
  const client = new Client({ name: "smoke-http", version: "0.0.0" }, { capabilities: {} });
  await client.connect(transport);

  const { tools } = await client.listTools();
  ok("tools/list over HTTP", tools.length === 5, tools.map((t) => t.name).join(", "));

  const pb = await client.callTool({
    name: "growth_playbook",
    arguments: { query: "pricing strategy" },
  });
  ok("growth_playbook over HTTP", /id: `/.test(pb.content[0].text));

  const ue = await client.callTool({
    name: "unit_economics",
    arguments: { cac: 300, arpu: 50, grossMarginPct: 80, monthlyChurnPct: 5 },
  });
  ok("unit_economics over HTTP", ue.content[0].text.includes("$800"));

  const { prompts } = await client.listPrompts();
  ok("prompts/list over HTTP", prompts.length === 4);

  await client.close();
} catch (err) {
  ok(`exception: ${err.message}`, false);
} finally {
  child.kill("SIGTERM");
}

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
