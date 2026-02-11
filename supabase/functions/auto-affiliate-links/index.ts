import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AFFILIATE_TAG = "meetaudreyeva-20";

const HAIR_CATEGORIES = [
  "shampoo", "conditioner", "hair serum", "hair oil", "hair mask",
  "leave-in conditioner", "heat protectant", "curl cream", "hair growth",
  "scalp treatment", "keratin treatment", "hair color", "dry shampoo",
  "hair vitamins", "anti-aging hair care", "biotin supplement",
];

interface AutoAffiliateRequest {
  action: "generate" | "list" | "stats";
  category?: string;
  count?: number;
  email_results?: boolean;
  target_monthly_revenue?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Auth failed");
    const user = userData.user;

    const body: AutoAffiliateRequest = await req.json();

    if (body.action === "list") {
      const { data: links } = await supabase
        .from("auto_affiliate_links")
        .select("*")
        .eq("user_id", user.id)
        .order("ranking_score", { ascending: false });
      return new Response(JSON.stringify({ links: links || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "stats") {
      const { data: links } = await supabase
        .from("auto_affiliate_links")
        .select("*")
        .eq("user_id", user.id);

      const { data: campaigns } = await supabase
        .from("campaign_tracking")
        .select("*")
        .eq("user_id", user.id);

      const totalClicks = (links || []).reduce((s, l) => s + (l.clicks || 0), 0);
      const totalConversions = (links || []).reduce((s, l) => s + (l.conversions || 0), 0);
      const totalRevenue = (links || []).reduce((s, l) => s + (l.revenue_cents || 0), 0);
      const totalLinks = (links || []).length;
      const avgConversionRate = totalClicks > 0 ? (totalConversions / totalClicks * 100) : 0;
      const totalCampaigns = (campaigns || []).length;
      const freeCampaigns = (campaigns || []).filter(c => c.is_free).length;
      const paidCampaigns = totalCampaigns - freeCampaigns;

      const targetRevenue = body.target_monthly_revenue || 1000;
      const currentMonthlyRate = totalRevenue / Math.max(1, 30); // simplified
      const daysToTarget = currentMonthlyRate > 0
        ? Math.ceil((targetRevenue * 100 - totalRevenue) / currentMonthlyRate)
        : 999;

      return new Response(JSON.stringify({
        total_links: totalLinks,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_revenue_dollars: (totalRevenue / 100).toFixed(2),
        avg_conversion_rate: avgConversionRate.toFixed(2),
        total_campaigns: totalCampaigns,
        free_campaigns: freeCampaigns,
        paid_campaigns: paidCampaigns,
        target_monthly_revenue: targetRevenue,
        projected_days_to_target: daysToTarget,
        probability_of_target: Math.min(95, Math.max(5, 100 - daysToTarget * 0.1)).toFixed(1),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // action === "generate"
    const category = body.category || "hair care";
    const count = Math.min(body.count || 10, 20);

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("AI not configured");

    const prompt = `You are an expert Amazon affiliate marketing strategist for hair and beauty products.

Generate ${count} high-ranking, high-monetization Amazon affiliate product recommendations for the category: "${category}".

For each product provide:
- product_name: Specific real product name that would exist on Amazon
- product_category: Sub-category
- estimated_price: Typical price in USD
- estimated_commission_pct: Amazon commission rate for this category (typically 1-10%)
- ranking_score: 0-100 based on popularity, search volume, conversion likelihood
- amazon_search_url: Amazon search URL for this product
- why_recommended: One sentence on why this is a high earner
- monthly_search_volume_estimate: Rough monthly searches
- competition_level: low/medium/high

Focus on:
- Products with high search volume in hair care, beauty, anti-aging
- Products with good commission rates
- Trending and seasonal products
- Products that pair well with content marketing

Return as JSON array. No markdown fences.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok) throw new Error(`AI error [${aiResp.status}]`);
    const aiData = await aiResp.json();
    let rawResult = aiData.choices?.[0]?.message?.content || "[]";

    let products: any[];
    try {
      const jsonMatch = rawResult.match(/```(?:json)?\s*([\s\S]*?)```/);
      products = JSON.parse(jsonMatch ? jsonMatch[1].trim() : rawResult.trim());
    } catch {
      products = [];
    }

    // Create affiliate links and save to DB
    const affiliateLinks = products.map((p: any) => ({
      user_id: user.id,
      product_name: p.product_name || "Unknown Product",
      product_category: p.product_category || category,
      amazon_url: p.amazon_search_url || `https://www.amazon.com/s?k=${encodeURIComponent(p.product_name || category)}`,
      affiliate_url: `https://www.amazon.com/s?k=${encodeURIComponent(p.product_name || category)}&tag=${AFFILIATE_TAG}`,
      affiliate_tag: AFFILIATE_TAG,
      ranking_score: p.ranking_score || 50,
      estimated_commission_pct: p.estimated_commission_pct || 4,
    }));

    if (affiliateLinks.length > 0) {
      await supabase.from("auto_affiliate_links").insert(affiliateLinks);
    }

    return new Response(JSON.stringify({
      generated: affiliateLinks.length,
      products: products.map((p: any, i: number) => ({
        ...p,
        affiliate_url: affiliateLinks[i]?.affiliate_url,
      })),
      affiliate_tag: AFFILIATE_TAG,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("auto-affiliate-links error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
