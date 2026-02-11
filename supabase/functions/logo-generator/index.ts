import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENROUTER_MODELS = [
  "tngtech/deepseek-r1t2-chimera:free",
  "arcee-ai/trinity-large-preview:free",
  "openrouter/free",
];

interface LogoRequest {
  action: "generate" | "variations";
  brand_name: string;
  industry?: string;
  style?: string;
  colors?: string;
  tagline?: string;
  vibe?: string;
  existing_logo_base64?: string;
  variation_prompt?: string;
  quality?: "standard" | "pro";
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  for (const model of OPENROUTER_MODELS) {
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
        max_tokens: 4000,
      }),
    });

    if (resp.status === 429) {
      console.log(`[LOGO] Model ${model} rate-limited, trying next...`);
      continue;
    }
    if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]: ${await resp.text()}`);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (content) return content;
  }

  throw new Error("All OpenRouter models rate-limited");
}

function parseJSON(text: string): any {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(match ? match[1].trim() : text.trim());
  } catch {
    return null;
  }
}

async function generateLogoImage(prompt: string, quality: string): Promise<string | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not set");

  const model = quality === "pro"
    ? "google/gemini-3-pro-image-preview"
    : "google/gemini-2.5-flash-image";

  console.log(`[LOGO] Generating image with ${model}`);

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (resp.status === 429) {
    throw new Error("Rate limited — please wait a moment and try again.");
  }
  if (resp.status === 402) {
    throw new Error("Credits exhausted — please add funds to your workspace.");
  }
  if (!resp.ok) {
    const t = await resp.text();
    console.error("[LOGO] Image generation failed:", resp.status, t);
    throw new Error(`Image generation failed [${resp.status}]`);
  }

  const data = await resp.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const textResponse = data.choices?.[0]?.message?.content || "";

  return imageUrl || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: LogoRequest = await req.json();

    if (body.action === "generate") {
      const { brand_name, industry, style, colors, tagline, vibe, quality } = body;

      if (!brand_name) throw new Error("brand_name is required");

      // Step 1: OpenRouter creative direction research
      const researchPrompt = `You are an elite brand identity designer and logo strategist. Research and create a comprehensive creative brief for a logo.

BRAND: "${brand_name}"
INDUSTRY: ${industry || "tech/SaaS"}
STYLE PREFERENCE: ${style || "modern, clean, memorable"}
COLOR PREFERENCE: ${colors || "auto-suggest based on industry psychology"}
TAGLINE: ${tagline || "none"}
VIBE: ${vibe || "premium, innovative, trustworthy"}

RESEARCH & DELIVER:
1. COMPETITOR LOGOS: What do the top 5 competitors in this space look like? What are their logo weaknesses?
2. COLOR PSYCHOLOGY: What colors work best for this industry? What emotions do they evoke?
3. TYPOGRAPHY: What font styles convey the right brand personality?
4. ICON CONCEPTS: 3 distinct icon/symbol concepts that would make this brand instantly recognizable
5. LAYOUT OPTIONS: Wordmark, lettermark, icon+text, emblem, abstract
6. TRENDS: Current design trends in this industry (2025-2026)
7. UNIQUENESS: How to make this logo stand out from every competitor

Return JSON:
{
  "brand_analysis": {
    "personality_keywords": ["string"],
    "target_audience": "string",
    "emotional_response": "string"
  },
  "color_palette": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex",
    "reasoning": "string"
  },
  "logo_concepts": [
    {
      "name": "string",
      "type": "wordmark|lettermark|icon|emblem|abstract|combination",
      "description": "Detailed visual description",
      "icon_description": "Specific icon/symbol details",
      "typography": "font style description",
      "image_prompt": "A very detailed prompt to generate this exact logo as a high-quality image. Include: clean white/transparent background, vector-style, professional logo design, specific colors, specific shapes, specific typography style. Be extremely detailed and specific about every visual element."
    }
  ],
  "competitor_analysis": "string",
  "recommended_concept": 0
}`;

      console.log("[LOGO] Step 1: OpenRouter creative research...");
      const researchRaw = await callOpenRouter(researchPrompt);
      const research = parseJSON(researchRaw);

      if (!research || !research.logo_concepts?.length) {
        return json({
          status: "partial",
          research_raw: researchRaw,
          message: "Got creative direction but couldn't parse structured data. Retrying may help.",
        });
      }

      // Step 2: Generate logo images using Lovable AI
      console.log(`[LOGO] Step 2: Generating ${research.logo_concepts.length} logo images...`);
      const logoResults = [];

      for (const concept of research.logo_concepts.slice(0, 3)) {
        const imagePrompt = concept.image_prompt ||
          `Professional logo design for "${brand_name}". ${concept.description}. ${concept.icon_description || ""}. Style: ${concept.type}. Colors: ${research.color_palette?.primary || ""}, ${research.color_palette?.secondary || ""}. Clean white background, vector-style, high quality, crisp edges, professional branding. No text artifacts, clean typography.`;

        try {
          const imageBase64 = await generateLogoImage(imagePrompt, quality || "standard");
          logoResults.push({
            concept_name: concept.name,
            type: concept.type,
            description: concept.description,
            typography: concept.typography,
            image: imageBase64,
            prompt_used: imagePrompt,
          });
        } catch (e: any) {
          console.error(`[LOGO] Failed to generate image for concept "${concept.name}":`, e.message);
          logoResults.push({
            concept_name: concept.name,
            type: concept.type,
            description: concept.description,
            typography: concept.typography,
            image: null,
            error: e.message,
            prompt_used: imagePrompt,
          });
        }
      }

      return json({
        status: "success",
        brand_name,
        research: {
          brand_analysis: research.brand_analysis,
          color_palette: research.color_palette,
          competitor_analysis: research.competitor_analysis,
          recommended_concept: research.recommended_concept,
        },
        logos: logoResults,
        total_concepts: research.logo_concepts.length,
        generated: logoResults.filter((l) => l.image).length,
      });
    }

    // ─── VARIATIONS ───
    if (body.action === "variations" && body.existing_logo_base64) {
      const variationPrompt = body.variation_prompt ||
        `Create a variation of this logo. Make it more modern and polished while keeping the core brand identity. Professional vector-style logo, clean background.`;

      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (!lovableKey) throw new Error("LOVABLE_API_KEY not set");

      const model = body.quality === "pro"
        ? "google/gemini-3-pro-image-preview"
        : "google/gemini-2.5-flash-image";

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: variationPrompt },
              { type: "image_url", image_url: { url: body.existing_logo_base64 } },
            ],
          }],
          modalities: ["image", "text"],
        }),
      });

      if (!resp.ok) {
        const status = resp.status;
        if (status === 429) throw new Error("Rate limited — try again shortly.");
        if (status === 402) throw new Error("Credits exhausted — add funds.");
        throw new Error(`Variation failed [${status}]`);
      }

      const data = await resp.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      return json({
        status: "success",
        variation: {
          image: imageUrl,
          prompt: variationPrompt,
        },
      });
    }

    throw new Error("Invalid action. Use 'generate' or 'variations'.");
  } catch (e: any) {
    console.error("[LOGO] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function json(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
