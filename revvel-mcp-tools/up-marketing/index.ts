/**
 * UpMarketing MCP Server — Routes to: marketing-ai
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-marketing",
  description: "AI caption and scoring engine for marketing",
  systemPrompt: "You are a marketing AI specialist. Generate captions, score products for market readiness, analyze trends, and create compelling marketing copy.",
});
