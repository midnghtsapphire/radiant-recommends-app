const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchRequest {
  query: string;
  domain: "general" | "patent" | "legal" | "science" | "code" | "marketing" | "invention";
  provider: "lovable" | "openrouter" | "perplexity";
  model?: string;
  depth?: "quick" | "deep";
}

const DOMAIN_PROMPTS: Record<string, string> = {
  general: "You are a genius-level research assistant combining the analytical methods of Aristotle, Tesla's inventive thinking, and Da Vinci's interdisciplinary approach. Provide comprehensive, actionable answers.",
  patent: "You are a patent research expert channeling Nikola Tesla's inventive methodology and Edison's patent strategy. Search for prior art, identify patentability gaps, suggest claims language, and find blue ocean opportunities. Include USPTO classification codes when relevant.",
  legal: "You are a legal research expert with expertise in pro se litigation, CLE requirements, Colorado Supreme Court procedures, intellectual property law, patent prosecution, copyright, and trademark. Provide citations and procedural guidance.",
  science: "You are a scientific research expert channeling Marie Curie's methodical experimentation, Tesla's electrical engineering genius, and modern bioengineering expertise. Cover materials science, genetics, bioengineering, chemistry, and physics.",
  code: "You are an elite programmer channeling the systematic thinking of Alan Turing and the creative problem-solving of Ada Lovelace. Provide production-ready code, architecture recommendations, and cutting-edge tech stack suggestions.",
  marketing: "You are a marketing genius combining Picasso's creative vision, Mozart's sense of timing and composition, and modern growth hacking strategies. Provide viral marketing strategies, social media tactics, and conversion optimization.",
  invention: "You are an invention consultant channeling Leonardo da Vinci's interdisciplinary innovation, Tesla's electromagnetic genius, Beethoven's creative persistence, and Plato's philosophical reasoning. Identify blue ocean opportunities, suggest novel combinations of existing tech, and draft invention disclosures.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method === "GET") {
      return new Response(JSON.stringify({
        name: "genius-search",
        version: "1.0.0",
        description: "Multi-domain AI search tool channeling genius methodologies (Aristotle, Tesla, Da Vinci, Curie, Plato, Mozart, Picasso, Beethoven). Supports patent, legal, science, code, marketing, and invention research.",
        domains: Object.keys(DOMAIN_PROMPTS),
        providers: ["lovable", "openrouter", "perplexity"],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body: SearchRequest = await req.json();
    if (!body.query) throw new Error("Query is required");

    const domain = body.domain || "general";
    const systemPrompt = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.general;
    const depth = body.depth || "quick";

    const userPrompt = depth === "deep"
      ? `Research this thoroughly with multiple perspectives, citations, and actionable next steps:\n\n${body.query}`
      : body.query;

    let result: string;

    if (body.provider === "perplexity") {
      const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
      if (!apiKey) throw new Error("PERPLEXITY_API_KEY not configured");
      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: body.model || "sonar",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (!resp.ok) throw new Error(`Perplexity [${resp.status}]: ${await resp.text()}`);
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content || "No response";
    } else if (body.provider === "openrouter") {
      const apiKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://lovable.dev" },
        body: JSON.stringify({
          model: body.model || "openrouter/free",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        }),
      });
      if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]: ${await resp.text()}`);
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content || "No response";
    } else {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(body.model ? { model: body.model } : {}),
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        }),
      });
      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`Lovable AI [${resp.status}]: ${await resp.text()}`);
      }
      const data = await resp.json();
      result = data.choices?.[0]?.message?.content || "No response";
    }

    return new Response(JSON.stringify({ result, domain, provider: body.provider || "lovable", model: body.model || "default" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("genius-search error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
