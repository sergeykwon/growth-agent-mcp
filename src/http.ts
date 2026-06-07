#!/usr/bin/env node
/**
 * Remote HTTP entry point — exposes the same growth-agent server over the MCP
 * Streamable HTTP transport so it can be added as a Claude **custom connector**
 * (claude.ai / Claude Desktop / Claude Code) or used by any remote MCP client.
 *
 * Stateless: a fresh Server + transport is created per request, so it scales
 * horizontally and deploys cleanly to any Node host (Docker, Railway, Render,
 * Fly, a VPS, etc.).
 *
 *   PORT                 listen port (default 3000)
 *   GROWTH_AGENT_TOKEN   if set, requires `Authorization: Bearer <token>`
 *
 * Endpoints:
 *   POST /mcp            MCP Streamable HTTP
 *   GET  /health         liveness probe
 *   GET  /               human-readable info
 */
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { catalogSummary, createGrowthAgentServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3000);
const TOKEN = process.env.GROWTH_AGENT_TOKEN?.trim();

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version",
  );
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

function authorized(req: IncomingMessage): boolean {
  if (!TOKEN) return true;
  const header = req.headers["authorization"];
  return typeof header === "string" && header === `Bearer ${TOKEN}`;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

const httpServer = createHttpServer(async (req, res) => {
  setCors(res);
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === "/health") {
    return sendJson(res, 200, { status: "ok", catalog: catalogSummary() });
  }

  if (url.pathname === "/" && req.method === "GET") {
    return sendJson(res, 200, {
      name: "growth-agent-mcp",
      transport: "streamable-http",
      endpoint: "/mcp",
      auth: TOKEN ? "bearer-token-required" : "open",
      catalog: catalogSummary(),
      docs: "https://github.com/growthprophet/growth-agent-mcp",
    });
  }

  if (url.pathname !== "/mcp") {
    return sendJson(res, 404, { error: "not found", hint: "POST /mcp" });
  }

  if (!authorized(req)) {
    return sendJson(res, 401, {
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
  }

  // Stateless transport spec: GET/DELETE aren't supported without sessions.
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    return res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed. Use POST." },
        id: null,
      }),
    );
  }

  try {
    const body = await readBody(req);
    // Fresh server + transport per request — no shared session state.
    const server = createGrowthAgentServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch (err) {
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: `Internal error: ${(err as Error).message}` },
        id: null,
      });
    }
  }
});

httpServer.listen(PORT, () => {
  console.error(
    `[growth-agent-mcp] streamable-http listening on :${PORT}/mcp — ${catalogSummary()}${
      TOKEN ? " (bearer auth on)" : ""
    }`,
  );
});
