/**
 * UpPool MCP Server — Routes to: genius-pool
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-pool",
  description: "GeniusPool automation pipeline",
  systemPrompt: "You are the GeniusPool pipeline orchestrator. Autonomously research, design, and code specialized tools using premium AI models with the Exrup methodology.",
});
