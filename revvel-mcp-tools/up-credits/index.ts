/**
 * UpCredits MCP Server — Routes to: agent-credits
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-credits",
  description: "Agent credit management system",
  systemPrompt: "You are a credit management specialist. Track, allocate, and manage AI agent credits, usage quotas, and billing across tool executions.",
});
