const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AiRequest {
  action: "generate_caption" | "score_product" | "trend_analysis";
  provider: "lovable" | "openrouter";
  model?: string;
  product_name?: string;
  product_description?: string;
  platform?: string;
  tone?: string;
  product_type?: string;
  target_state?: string;
  products?: { name: string; type: string; score: number }[];
}

const OPENROUTER_FREE_MODELS = [
  { id: "venice/uncensored:free", name: "Venice Uncensored (24B)", description: "Uncensored Mistral 24B — unrestricted" },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity Large (400B)", description: "Frontier-scale open-weight" },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B", description: "Open-source GPT large model" },
  { id: "tngtech/deepseek-r1t2-chimera:free", name: "DeepSeek R1T2 Chimera", description: "Strong reasoning model" },
  { id: "openrouter/free", name: "OpenRouter Auto-Free", description: "Auto-selects best free model" },
  { id: "z-ai/glm-4.5-air:free", name: "Z.ai GLM 4.5 Air", description: "Fast general-purpose" },
];

const LOVABLE_MODELS = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash (default)", description: "Fast, balanced" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Good multimodal + reasoning" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Strong performance, lower cost" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Top-tier reasoning" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // GET = return available models
    if (req.method === "GET") {
      return new Response(JSON.stringify({
        lovable_models: LOVABLE_MODELS,
        openrouter_free_models: OPENROUTER_FREE_MODELS,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: AiRequest = await req.json();
    let prompt = "";

    switch (body.action) {
      case "generate_caption":
        prompt = `You are a social media marketing expert. Write a compelling ${body.platform || "social media"} post caption for "${body.product_name}". ${body.product_description ? `Product: ${body.product_description}.` : ""} Tone: ${body.tone || "professional"}. Include 3-5 relevant hashtags. Keep it platform-appropriate and engaging. Return ONLY the caption text.`;
        break;
      case "score_product":
        prompt = `You are a marketing strategist. Analyze this product and return ONLY a JSON object with no extra text: {"score": <number 0-100>, "reasoning": "<2 sentences>", "recommendations": ["<action 1>", "<action 2>", "<action 3>"]}\n\nProduct: ${body.product_name}\nType: ${body.product_type || "general"}\nDescription: ${body.product_description || "N/A"}\nTarget Market: ${body.target_state || "National US"}`;
        break;
      case "trend_analysis":
        const productList = body.products?.map(p => `${p.name} (${p.type}, score: ${p.score})`).join(", ") || "No products";
        prompt = `You are a marketing analyst. Analyze these products and provide trend insights. Return a JSON object: {"trends": ["<trend 1>", "<trend 2>"], "top_pick": "<product name>", "top_pick_reason": "<why>", "market_advice": "<1-2 sentences>"}\n\nProducts: ${productList}\nTarget Region: ${body.target_state || "National US"}`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    let result: string;

    if (body.provider === "openrouter") {
      const apiKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
      const model = body.model || "openrouter/free";
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.dev",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("OpenRouter error:", resp.status, errText);
        throw new Error(`OpenRouter [${resp.status}]: ${errText}`);
      }
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content || "No response from model";
    } else {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
      const model = body.model || undefined;
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(model ? { model } : {}),
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        if (resp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (resp.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Add credits in workspace settings." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Lovable AI [${resp.status}]: ${errText}`);
      }
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content || "No response from model";
    }

    return new Response(JSON.stringify({ result, provider: body.provider, model: body.model || "default" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("marketing-ai error:", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
