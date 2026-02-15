/**
 * UpLogo MCP Server — Routes to: logo-generator
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-logo",
  description: "AI logo generator",
  systemPrompt: "You are a logo design specialist. Generate professional logo concepts with color palettes, typography recommendations, and SVG/PNG assets.",
});
