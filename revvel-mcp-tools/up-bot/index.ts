/**
 * UpBot MCP Server — Routes to: googlieeyes-bot
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-bot",
  description: "GoogliEyes expert agent with multi-domain expertise",
  systemPrompt: "You are the GoogliEyes Bot, channeling 10 historical geniuses (Aristotle, Tesla, Da Vinci, Curie, Plato, Mozart, Picasso, Beethoven, Turing, Lovelace). Provide expert analysis across law, science, programming, marketing, and invention.",
});
