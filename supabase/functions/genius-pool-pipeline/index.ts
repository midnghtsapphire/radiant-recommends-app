import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_FREE_MODELS = [
  "openrouter/free",
  "tngtech/deepseek-r1t2-chimera:free",
  "arcee-ai/trinity-large-preview:free",
];

interface PipelineRequest {
  action: "create_tool" | "create_campaign_tool" | "invent" | "full_pipeline";
  tool_name: string;
  tool_description: string;
  product_context?: string;
  use_openrouter?: boolean;
}

interface PipelineStep {
  step: string;
  model: string;
  result: string;
}

async function callAI(prompt: string, useOpenRouter: boolean, model?: string): Promise<string> {
  if (useOpenRouter) {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
    const selectedModel = model || OPENROUTER_FREE_MODELS[0];
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
      }),
    });
    if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]: ${await resp.text()}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } else {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not set");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limited — try again shortly");
      if (resp.status === 402) throw new Error("Credits exhausted — add credits in workspace settings");
      throw new Error(`AI [${resp.status}]: ${await resp.text()}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth failed");

    const body: PipelineRequest = await req.json();
    const { action, tool_name, tool_description, product_context, use_openrouter } = body;
    const useOR = use_openrouter ?? false;

    const steps: PipelineStep[] = [];

    // ─── STEP 1: Research ───
    console.log(`[PIPELINE] Step 1: Research for ${tool_name}`);
    const researchPrompt = `You are a world-class software architect and open-source researcher.

Research and design a FREE, open-source tool called "${tool_name}".
Purpose: ${tool_description}
${product_context ? `Product context: ${product_context}` : ""}
Domain: Hair care, beauty, anti-aging marketing automation.

Provide:
1. RESEARCH: What existing free/open-source solutions exist? What APIs are free? What GitHub repos are relevant?
2. ARCHITECTURE: How should this tool be structured? (MCP server, REST API, CLI, or agent)
3. KEY FEATURES: List 5-8 core features this tool must have
4. TECH STACK: Only free/open-source tech. No paid APIs. Suggest specific npm packages, GitHub repos, free APIs.
5. DATA SOURCES: Where does this tool get its data for free?
6. COMPETITIVE ADVANTAGE: How is this better than paid alternatives?

Return as structured markdown.`;

    const research = await callAI(researchPrompt, useOR);
    steps.push({ step: "research", model: useOR ? "openrouter/free" : "gemini-3-flash", result: research });

    // ─── STEP 2: Design & API Spec ───
    console.log(`[PIPELINE] Step 2: Design for ${tool_name}`);
    const designPrompt = `Based on this research for "${tool_name}":

${research}

Now create a detailed technical design:

1. API SPECIFICATION: Full REST API or MCP tool definitions with endpoints, methods, request/response schemas
2. DATA MODELS: TypeScript interfaces for all data structures
3. INTEGRATION POINTS: How it connects to GeniusPool, marketing automation, social media platforms
4. DEPLOYMENT: How to deploy as a Supabase Edge Function or standalone MCP server
5. AUTOMATION HOOKS: How campaigns auto-trigger this tool

Return as structured markdown with code blocks.`;

    const design = await callAI(designPrompt, useOR, OPENROUTER_FREE_MODELS[1]);
    steps.push({ step: "design", model: useOR ? "deepseek-r1t2" : "gemini-3-flash", result: design });

    // ─── STEP 3: Generate Implementation Code ───
    console.log(`[PIPELINE] Step 3: Code generation for ${tool_name}`);
    const codePrompt = `Based on this design for "${tool_name}":

${design}

Generate COMPLETE, production-ready TypeScript code for a Supabase Edge Function that implements this tool.

Requirements:
- Use Deno.serve() pattern
- Include full CORS headers
- Include authentication via Supabase JWT
- Use ONLY free APIs and open-source libraries
- NO paid API keys required (use Lovable AI gateway or OpenRouter free models for any AI needs)
- Include error handling, logging, input validation
- Make it work as both a REST API and potential MCP tool
- Include JSDoc comments

Also generate:
- A README.md with setup instructions
- Example curl commands to test
- A master prompt specification for the tool

Return the complete code in markdown code blocks labeled with filenames.`;

    const code = await callAI(codePrompt, useOR, OPENROUTER_FREE_MODELS[2]);
    steps.push({ step: "code", model: useOR ? "arcee-trinity" : "gemini-3-flash", result: code });

    // ─── STEP 4: Marketing Integration Plan ───
    console.log(`[PIPELINE] Step 4: Marketing integration for ${tool_name}`);
    const marketingPrompt = `For the tool "${tool_name}" (${tool_description}), create a complete marketing automation integration plan:

1. How to auto-connect this tool to GeniusPool budget campaigns
2. Social media auto-posting templates for each platform (Instagram, Facebook, TikTok, X/Twitter, Pinterest, YouTube)
3. Affiliate link integration with Amazon tag "meetaudreyeva-20"
4. SEO keywords this tool should target
5. Blue Ocean sub-niches this tool opens up
6. Auto-scheduling strategy
7. Performance tracking metrics
8. How to promote this tool itself as a product

Return as JSON:
{
  "integration_plan": { "genius_pool_hooks": [], "auto_triggers": [] },
  "social_templates": { "Instagram": "", "Facebook": "", "TikTok": "", "X": "", "Pinterest": "", "YouTube": "" },
  "seo_keywords": [],
  "blue_ocean_niches": [],
  "metrics": [],
  "self_promotion": { "pitch": "", "landing_page_copy": "" }
}`;

    const marketing = await callAI(marketingPrompt, false); // Always use Lovable AI for marketing
    steps.push({ step: "marketing_integration", model: "gemini-3-flash", result: marketing });

    // ─── Compile Final Output ───
    const output = {
      tool_name,
      tool_description,
      pipeline_steps: steps.length,
      status: "complete",
      generated_at: new Date().toISOString(),
      user_id: userData.user.id,
      steps,
      summary: {
        research_complete: true,
        design_complete: true,
        code_generated: true,
        marketing_integrated: true,
        ready_for_implementation: true,
      },
    };

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("genius-pool-pipeline error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
