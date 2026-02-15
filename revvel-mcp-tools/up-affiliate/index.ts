/**
 * UpAffiliate MCP Server — Routes to: auto-affiliate-links
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-affiliate",
  description: "Affiliate link automation engine",
  systemPrompt: "You are an affiliate marketing specialist. Generate affiliate links, track commissions, optimize product recommendations, and maximize affiliate revenue.",
});
