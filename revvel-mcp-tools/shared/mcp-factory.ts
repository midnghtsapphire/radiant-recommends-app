/**
 * MCP Server Factory — creates a standard MCP server for any Up tool.
 *
 * Usage:
 *   import { createUpMcp } from "../shared/mcp-factory.ts";
 *   createUpMcp({ name: "up-seo", description: "...", systemPrompt: "..." });
 */

import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface UpMcpConfig {
  /** kebab-case name, e.g. "up-seo" */
  name: string;
  /** One-line description */
  description: string;
  /** System prompt for the AI */
  systemPrompt: string;
  /** Default model (optional) */
  defaultModel?: string;
  /** Extra MCP tools beyond the default "analyze" tool (optional) */
  extraTools?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    handler: (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
  }>;
}

export function createUpMcp(config: UpMcpConfig) {
  const app = new Hono();

  const mcpServer = new McpServer({
    name: config.name,
    version: "1.0.0",
  });

  // Primary "analyze" tool — every Up MCP has this
  mcpServer.tool({
    name: "analyze",
    description: `${config.description}. Send a query/prompt and get expert analysis.`,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Your question or prompt" },
        model: {
          type: "string",
          description: "AI model to use (optional)",
          default: config.defaultModel || "google/gemini-3-flash-preview",
        },
      },
      required: ["query"],
    },
    handler: async (params: Record<string, unknown>) => {
      const query = params.query as string;
      const model = (params.model as string) || config.defaultModel || "google/gemini-3-flash-preview";

      const apiKey = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("OPENROUTER_API_KEY");
      if (!apiKey) {
        return {
          content: [{ type: "text", text: "Error: No API key configured. Set LOVABLE_API_KEY or OPENROUTER_API_KEY." }],
        };
      }

      const isLovable = !!Deno.env.get("LOVABLE_API_KEY");
      const baseUrl = isLovable
        ? "https://ai.gateway.lovable.dev/v1/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";

      const resp = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: config.systemPrompt },
            { role: "user", content: query },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return {
          content: [{ type: "text", text: `AI error [${resp.status}]: ${errText}` }],
        };
      }

      const data = await resp.json();
      const result = data.choices?.[0]?.message?.content || "No response";

      return {
        content: [{ type: "text", text: result }],
      };
    },
  });

  // Register extra tools if provided
  if (config.extraTools) {
    for (const tool of config.extraTools) {
      mcpServer.tool(tool);
    }
  }

  const transport = new StreamableHttpTransport();

  // Health check
  app.get("/", (c) =>
    c.json({
      name: config.name,
      version: "1.0.0",
      description: config.description,
      mcp_endpoint: "/mcp",
    })
  );

  // CORS preflight
  app.options("/*", (c) => new Response(null, { headers: corsHeaders }));

  // MCP endpoint
  app.all("/mcp", async (c) => {
    return await transport.handleRequest(c.req.raw, mcpServer);
  });

  // Also handle root POST for Supabase edge function compatibility
  app.post("/", async (c) => {
    return await transport.handleRequest(c.req.raw, mcpServer);
  });

  Deno.serve(app.fetch);
}
