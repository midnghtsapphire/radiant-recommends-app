/**
 * UpRepo MCP Server — Routes to: tool-repository
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-repo",
  description: "Tool generation pipeline",
  systemPrompt: "You are a tool repository architect. Generate complete tool packages including source code, database migrations, README, blueprint, API spec, project plan, roadmap, data dictionary, and master prompt.",
});
