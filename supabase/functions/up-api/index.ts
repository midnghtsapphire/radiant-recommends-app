import { TOOL_ROUTES, AI_TOOLS } from "./tool-registry.ts";
import { TOOL_PROMPTS } from "./tool-prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UpAPIRequest {
  tool: string;
  action?: string;
  params?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      name: "UpAPI",
      version: "2.0.0",
      description: "Master API gateway for all Up-tools including TTS engines, FOSS analytics, and discovery tools.",
      tool_count: Object.keys(TOOL_ROUTES).length + AI_TOOLS.size,
      routed_tools: Object.keys(TOOL_ROUTES),
      ai_tools: [...AI_TOOLS],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const body: UpAPIRequest = await req.json();
    if (!body.tool) throw new Error("'tool' field is required");

    const tool = body.tool;

    // Route to existing edge function
    if (TOOL_ROUTES[tool]) {
      const functionName = TOOL_ROUTES[tool];
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const forwardBody: Record<string, any> = body.params || {};
      if (body.action) forwardBody.action = body.action;

      const resp = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") || "",
          apikey: req.headers.get("apikey") || "",
        },
        body: JSON.stringify(forwardBody),
      });

      const data = await resp.json();
      return new Response(JSON.stringify({ tool, routed_to: functionName, ...data }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle via AI inline
    if (AI_TOOLS.has(tool)) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

      const systemPrompt = TOOL_PROMPTS[tool] || `You are ${tool}, a specialized AI tool. Provide expert-level, actionable results.`;
      const userMessage = body.params?.query || body.params?.prompt || body.params?.input || JSON.stringify(body.params || {});

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: body.params?.model || "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      });

      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!resp.ok) throw new Error(`AI error [${resp.status}]: ${await resp.text()}`);

      const data = await resp.json();
      const result = data.choices?.[0]?.message?.content || "No response";

      return new Response(JSON.stringify({ tool, result, model: body.params?.model || "gemini-3-flash" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unknown tool
    return new Response(JSON.stringify({
      error: `Unknown tool: ${tool}`,
      suggestion: "Use 'UpRepo' with action 'generate' to create this tool, or check available tools via GET.",
      available: [...Object.keys(TOOL_ROUTES), ...AI_TOOLS],
    }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("up-api error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
