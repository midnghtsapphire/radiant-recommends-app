import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * UpAPI — Master Consolidated API
 * Routes all Up-tool requests through a single endpoint.
 * 
 * POST /functions/v1/up-api
 * Body: { tool: "UpSEO" | "UpTrustShield" | ..., action: string, params: {} }
 * 
 * Supported tools route to existing edge functions or handle inline.
 */

interface UpAPIRequest {
  tool: string;
  action?: string;
  params?: Record<string, any>;
}

const TOOL_ROUTES: Record<string, string> = {
  // Direct edge function routing
  "UpSearch": "genius-search",
  "UpBot": "googlieeyes-bot",
  "UpMarketing": "marketing-ai",
  "UpMarketingMCP": "marketing-mcp",
  "UpLogo": "logo-generator",
  "UpVoice": "elevenlabs-tts",
  "UpAffiliate": "auto-affiliate-links",
  "UpRepo": "tool-repository",
  "UpTestPipeline": "test-pipeline",
  "UpPool": "genius-pool",
  "UpCredits": "agent-credits",
};

// Tools that run inline via AI
const AI_TOOLS = new Set([
  "UpSEO", "UpBlueOcean", "UpContent", "UpChatter", "UpYouTube",
  "UpQA", "UpCodeReview", "UpEndToEnd", "UpTracing",
  "UpTrustShield", "UpPromptGuard", "UpBELL", "UpDeepFakeProof",
  "UpAltText", "UpFavCon", "UpDomain", "UpBrandKit",
  "UpAgent", "UpFAQ", "UpDataScientist", "UpPatent", "UpCompetitorIntel",
  "UpPodcast", "UpCounty", "UpAfro",
  "UpDryHair", "UpDamagedHair", "UpOilyHair", "UpDandruff",
  "UpCurlyHair", "UpAntiAging", "UpNaturalOrganic", "UpLuxury", "UpTextured",
  "UpDataDictionary", "UpAPIDoc", "UpUserManual", "UpTechManual",
  "UpPredictiveAlpha", "UpPredictiveGetRich",
  "UpSell", "UpFastMoneyToday", "UpCrowdfund", "UpRevenueProjector",
  "UpFreeAdvertising", "UpPaidAdOptimizer",
  "UpInbox", "UpMail", "UpDrive",
  "UpClaw", "UpConnect",
  "UpApple", "UpAPK", "UpEXE",
  "UpImplement", "UpRun", "UpAutoEvent", "UpRetry",
  "UpGrowthEngine", "UpPoofEcosystem", "UpLegacySecure",
  "UpNeuroSync", "UpJurisPredict", "UpCarbonCaster", "UpBioAudit",
  "UpAnalytics", "UpA11y", "UpI18n", "UpBackup",
  "UpSOXCompliance",
]);

const TOOL_PROMPTS: Record<string, string> = {
  "UpSEO": "You are an SEO expert. Analyze keywords, backlinks, long-tail phrases, and provide actionable optimization strategies.",
  "UpTrustShield": "You are a security analyst specializing in deepfake detection, content verification, and trust scoring. Provide comprehensive integrity analysis.",
  "UpBELL": "You are a school safety and threat assessment expert. Analyze threats, suggest prevention protocols, and emergency response procedures.",
  "UpPredictiveAlpha": "You are a quantitative finance analyst. Provide stock, crypto, bond, economics, and emerging tech predictions with probability scoring.",
  "UpSell": "You are a sales strategist. Provide upsell, cross-sell, pricing optimization, and conversion funnel strategies for maximum revenue.",
  "UpBlueOcean": "You are a market strategist specializing in blue ocean strategy. Find untapped niches and million-dollar sub-genre opportunities.",
  "UpQA": "You are a QA engineer. Generate comprehensive test suites — unit, integration, regression, E2E — with code examples.",
  "UpJurisPredict": "You are a legal analyst. Predict case outcomes, assess IP strategy, evaluate regulatory risk, and provide pro se guidance.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method === "GET") {
    return new Response(JSON.stringify({
      name: "UpAPI",
      version: "1.0.0",
      description: "Master API gateway for all Up-tools. Routes to specialized edge functions or handles inline via AI.",
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
      const forwardBody = body.params || {};
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

    // Unknown tool — try tool-repository generate
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
