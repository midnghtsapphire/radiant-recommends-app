import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AFFILIATE_TAG = "meetaudreyeva-20";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "X/Twitter", "Pinterest", "YouTube Shorts"];

const BUDGET_TIERS = [20, 40, 50, 100, 200, 500, 1000];

interface GeniusPoolRequest {
  budget: number;
  product_name: string;
  product_description?: string;
  product_url?: string;
  target_audience?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    const user = userData.user;

    const body: GeniusPoolRequest = await req.json();
    const { budget, product_name, product_description, product_url, target_audience } = body;

    if (!BUDGET_TIERS.includes(budget)) {
      return new Response(JSON.stringify({ error: `Invalid budget. Choose: ${BUDGET_TIERS.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build affiliate link
    const affiliateLink = product_url
      ? `${product_url}${product_url.includes("?") ? "&" : "?"}tag=${AFFILIATE_TAG}`
      : `https://www.amazon.com/s?k=${encodeURIComponent(product_name)}&tag=${AFFILIATE_TAG}`;

    // Calculate platform budget split
    const perPlatform = Math.floor(budget / PLATFORMS.length);
    const remainder = budget - perPlatform * PLATFORMS.length;

    // AI prompt to generate full campaign
    const prompt = `You are an expert social media marketing strategist for hair care and beauty products.

Generate a COMPLETE auto-launch campaign package for the following:

Product: ${product_name}
${product_description ? `Description: ${product_description}` : ""}
Target Audience: ${target_audience || "women 25-55 interested in hair care, beauty, anti-aging"}
Total Budget: $${budget}
Affiliate Link: ${affiliateLink}
Platforms: ${PLATFORMS.join(", ")}
Budget per platform: ~$${perPlatform} each (${PLATFORMS.length} platforms)

For EACH platform, generate:
1. A ready-to-post caption (platform-optimized, include the affiliate link naturally)
2. Hashtags (5-8 per platform)
3. Best posting time
4. Ad targeting suggestion
5. A 30-second video script concept
6. A visual template description (what the image/thumbnail should look like)

Also generate:
- 3 Amazon-optimized product titles with the affiliate tag
- SEO keywords (10 terms people search for today in hair, beauty, anti-aging, ageless, timebending, turn back time, best product for)
- A trending search terms analysis for: hair care, beauty, ageless, anti-aging, best product for hair
- Blue ocean sub-genre suggestions (untapped niches worth pursuing)
- Suggested launch schedule (which platform first, timing strategy)

Return as valid JSON with this structure:
{
  "campaign_name": "string",
  "total_budget": number,
  "affiliate_link": "string",
  "platforms": {
    "Instagram": { "caption": "", "hashtags": [], "best_time": "", "ad_targeting": "", "video_script": "", "visual_template": "", "budget": number },
    "Facebook": { ... },
    "TikTok": { ... },
    "X/Twitter": { ... },
    "Pinterest": { ... },
    "YouTube Shorts": { ... }
  },
  "amazon_titles": [],
  "seo_keywords": [],
  "trending_searches": { "hair_care": [], "beauty": [], "anti_aging": [], "best_product_for": [] },
  "blue_ocean_niches": [],
  "launch_schedule": []
}`;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI gateway not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      throw new Error(`AI error [${aiResp.status}]: ${errText}`);
    }

    const aiData = await aiResp.json();
    let rawResult = aiData.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let campaign: any;
    try {
      // Strip markdown code fences if present
      const jsonMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawResult.trim();
      campaign = JSON.parse(jsonStr);
    } catch {
      campaign = { raw_response: rawResult, parse_error: true };
    }

    // Ensure affiliate link is present
    campaign.affiliate_link = affiliateLink;
    campaign.affiliate_tag = AFFILIATE_TAG;
    campaign.user_id = user.id;
    campaign.budget_selected = budget;
    campaign.generated_at = new Date().toISOString();

    return new Response(JSON.stringify(campaign), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("genius-pool error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
