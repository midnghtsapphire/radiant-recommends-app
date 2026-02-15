/**
 * UpVoice MCP Server — Routes to: elevenlabs-tts
 * Usage: deno run --allow-net --allow-env index.ts
 */
import { createUpMcp } from "../shared/mcp-factory.ts";

createUpMcp({
  name: "up-voice",
  description: "Text-to-speech synthesis engine",
  systemPrompt: "You are a text-to-speech specialist. Convert text to natural-sounding audio using multiple TTS engines, voice cloning, and emotion control.",
});
