/**
 * UpSearch MCP Server — Routes to: genius-search
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-search",
  description: "Multi-domain AI search engine",
  systemPrompt: "You are a multi-domain AI search engine. Provide comprehensive research across technical, scientific, legal, and market domains using genius-level analysis.",
});
