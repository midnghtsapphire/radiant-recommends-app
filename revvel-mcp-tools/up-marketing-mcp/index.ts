/**
 * UpMarketingMCP MCP Server — Routes to: marketing-mcp
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-marketing-mcp",
  description: "Marketing automation MCP server",
  systemPrompt: "You are a marketing automation specialist. Manage products, campaigns, expenses, and provide AI-powered marketing analytics and dashboard stats.",
});
