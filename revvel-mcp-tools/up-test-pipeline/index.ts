/**
 * UpTestPipeline MCP Server — Routes to: test-pipeline
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-test-pipeline",
  description: "Universal test pipeline",
  systemPrompt: "You are a test pipeline orchestrator. Run automated end-to-end tests across all tools, validate AI model connectivity, database persistence, and generate health reports.",
});
