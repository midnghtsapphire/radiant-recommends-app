import { Hono } from "jsr:@hono/hono@^4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const app = new Hono();

const mcp = new McpServer({
  name: "marketing-automation-mcp",
  version: "1.0.0",
});

// Helper: create an authenticated Supabase client from the request
function getSupabase(authHeader?: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  return createClient(url, anonKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

/* ─── TOOLS ─── */

// 1. List products (top N by score)
mcp.tool("list_products", {
  description: "List marketing products ranked by score. Optionally filter by state, type, or status.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: { type: "number", description: "Max products to return (default 10)" },
      status: { type: "string", description: "Filter by status: queued, marketing, paused, completed" },
      product_type: { type: "string", description: "Filter: hair_care, own_product, affiliate" },
      state: { type: "string", description: "Filter by US state" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabase();
    let q = sb.from("marketing_products").select("*").order("score", { ascending: false }).limit(args.limit || 10);
    if (args.status) q = q.eq("status", args.status);
    if (args.product_type) q = q.eq("product_type", args.product_type);
    if (args.state) q = q.eq("target_state", args.state);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  },
});

// 2. Add product to queue
mcp.tool("add_product", {
  description: "Add a new product to the marketing queue with score and location targeting.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string", description: "User UUID" },
      product_name: { type: "string", description: "Product name" },
      product_type: { type: "string", description: "hair_care | own_product | affiliate" },
      description: { type: "string", description: "Product description" },
      score: { type: "number", description: "Priority score 0-100" },
      target_state: { type: "string", description: "US state for targeting" },
      target_county: { type: "string", description: "County for targeting" },
    },
    required: ["user_id", "product_name"],
  },
  handler: async (args: any) => {
    const sb = getSupabase();
    const { data, error } = await sb.from("marketing_products").insert({
      user_id: args.user_id,
      product_name: args.product_name,
      product_type: args.product_type || "hair_care",
      description: args.description || null,
      score: args.score || 50,
      target_state: args.target_state || null,
      target_county: args.target_county || null,
    }).select("id, product_name, score").single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: `Product added: ${JSON.stringify(data)}` }] };
  },
});

// 3. Create campaign post
mcp.tool("create_campaign_post", {
  description: "Create a social media campaign post for a product on any platform.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" },
      product_id: { type: "string", description: "Product UUID" },
      platform: { type: "string", description: "instagram | facebook | tiktok | twitter" },
      caption: { type: "string", description: "Post caption" },
      spend_cents: { type: "number", description: "Ad spend in cents" },
    },
    required: ["user_id", "product_id", "platform", "caption"],
  },
  handler: async (args: any) => {
    const sb = getSupabase();
    const { data, error } = await sb.from("campaign_posts").insert({
      user_id: args.user_id,
      product_id: args.product_id,
      platform: args.platform,
      caption: args.caption,
      spend_cents: args.spend_cents || 0,
    }).select("id, platform, status").single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: `Post created: ${JSON.stringify(data)}` }] };
  },
});

// 4. Record expense
mcp.tool("record_expense", {
  description: "Record a marketing expense for accounting and tax tracking.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string" },
      description: { type: "string" },
      amount_cents: { type: "number" },
      category: { type: "string", description: "ad_spend | content_creation | tools | other" },
      product_id: { type: "string", description: "Optional linked product" },
      tax_deductible: { type: "boolean" },
    },
    required: ["user_id", "description", "amount_cents"],
  },
  handler: async (args: any) => {
    const sb = getSupabase();
    const { data, error } = await sb.from("marketing_expenses").insert({
      user_id: args.user_id,
      description: args.description,
      amount_cents: args.amount_cents,
      category: args.category || "other",
      product_id: args.product_id || null,
      tax_deductible: args.tax_deductible || false,
    }).select("id, description, amount_cents").single();
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };
    return { content: [{ type: "text" as const, text: `Expense recorded: ${JSON.stringify(data)}` }] };
  },
});

// 5. Get dashboard stats
mcp.tool("get_dashboard_stats", {
  description: "Get aggregated marketing stats: total spend, reach, engagement, queue counts.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_id: { type: "string", description: "Optional user filter" },
    },
  },
  handler: async (args: any) => {
    const sb = getSupabase();
    const [{ data: products }, { data: posts }, { data: expenses }] = await Promise.all([
      sb.from("marketing_products").select("status, score"),
      sb.from("campaign_posts").select("spend_cents, engagement_likes, engagement_comments, engagement_shares, reach"),
      sb.from("marketing_expenses").select("amount_cents, tax_deductible"),
    ]);
    const stats = {
      products_queued: products?.filter((p: any) => p.status === "queued").length || 0,
      products_active: products?.filter((p: any) => p.status === "marketing").length || 0,
      products_completed: products?.filter((p: any) => p.status === "completed").length || 0,
      total_ad_spend_cents: posts?.reduce((s: number, p: any) => s + (p.spend_cents || 0), 0) || 0,
      total_expenses_cents: expenses?.reduce((s: number, e: any) => s + e.amount_cents, 0) || 0,
      total_reach: posts?.reduce((s: number, p: any) => s + (p.reach || 0), 0) || 0,
      total_engagement: posts?.reduce((s: number, p: any) => s + (p.engagement_likes || 0) + (p.engagement_comments || 0) + (p.engagement_shares || 0), 0) || 0,
      tax_deductible_cents: expenses?.filter((e: any) => e.tax_deductible).reduce((s: number, e: any) => s + e.amount_cents, 0) || 0,
    };
    return { content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }] };
  },
});

// 6. Generate AI caption (via Lovable AI or OpenRouter)
mcp.tool("generate_caption", {
  description: "Use AI to generate a social media caption for a product. Uses Lovable AI (free) or OpenRouter free models.",
  inputSchema: {
    type: "object" as const,
    properties: {
      product_name: { type: "string" },
      product_description: { type: "string" },
      platform: { type: "string", description: "instagram | facebook | tiktok | twitter" },
      tone: { type: "string", description: "professional | casual | funny | educational" },
      model: { type: "string", description: "Model: lovable (default), openrouter-free. For OpenRouter, specify model ID like venice/uncensored:free" },
    },
    required: ["product_name", "platform"],
  },
  handler: async (args: any) => {
    const prompt = `Write a compelling ${args.platform} post caption for "${args.product_name}". ${args.product_description ? `Description: ${args.product_description}.` : ""} Tone: ${args.tone || "professional"}. Include relevant hashtags. Keep it platform-appropriate.`;

    try {
      let text: string;
      if (args.model && args.model.startsWith("openrouter")) {
        const modelId = args.model.includes("/") ? args.model.replace("openrouter-", "") : "venice/uncensored:free";
        const apiKey = Deno.env.get("OPENROUTER_API_KEY");
        if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await resp.json();
        text = data.choices?.[0]?.message?.content || "No response";
      } else {
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        });
        const data = await resp.json();
        text = data.choices?.[0]?.message?.content || "No response";
      }
      return { content: [{ type: "text" as const, text }] };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `AI error: ${e.message}` }] };
    }
  },
});

// 7. Score product via AI
mcp.tool("ai_score_product", {
  description: "Use AI to suggest a marketing priority score (0-100) for a product based on its attributes.",
  inputSchema: {
    type: "object" as const,
    properties: {
      product_name: { type: "string" },
      product_type: { type: "string" },
      description: { type: "string" },
      target_state: { type: "string" },
    },
    required: ["product_name"],
  },
  handler: async (args: any) => {
    const prompt = `You are a marketing strategist. Score this product 0-100 for marketing priority. Return ONLY a JSON object: {"score": number, "reasoning": "brief explanation"}\n\nProduct: ${args.product_name}\nType: ${args.product_type || "general"}\nDescription: ${args.description || "N/A"}\nTarget: ${args.target_state || "National"}`;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return { content: [{ type: "text" as const, text: "LOVABLE_API_KEY not configured" }] };
    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await resp.json();
      return { content: [{ type: "text" as const, text: data.choices?.[0]?.message?.content || "No response" }] };
    } catch (e: any) {
      return { content: [{ type: "text" as const, text: `Error: ${e.message}` }] };
    }
  },
});

const transport = new StreamableHttpTransport();

// MCP endpoints
app.all("/marketing-mcp/mcp/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcp);
});
app.all("/marketing-mcp/mcp", async (c) => {
  return await transport.handleRequest(c.req.raw, mcp);
});
app.all("/mcp/*", async (c) => {
  return await transport.handleRequest(c.req.raw, mcp);
});
app.all("/mcp", async (c) => {
  return await transport.handleRequest(c.req.raw, mcp);
});

const infoJson = {
  name: "marketing-automation-mcp",
  version: "1.0.0",
  description: "MCP server for marketing automation — product queue, campaigns, expenses, AI generation. Reusable in any MCP-compatible app.",
  endpoints: { mcp: "/marketing-mcp/mcp" },
  tools: [
    "list_products", "add_product", "create_campaign_post",
    "record_expense", "get_dashboard_stats",
    "generate_caption", "ai_score_product",
  ],
  models: {
    lovable_ai: ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "openai/gpt-5-mini"],
    openrouter_free: [
      "venice/uncensored:free",
      "arcee-ai/trinity-large-preview:free",
      "openai/gpt-oss-120b:free",
      "tngtech/deepseek-r1t2-chimera:free",
      "openrouter/free",
    ],
  },
};

// Info endpoint
app.get("/marketing-mcp", (c) => c.json(infoJson));
app.get("/marketing-mcp/", (c) => c.json(infoJson));
app.get("/", (c) => c.json(infoJson));

// CORS
app.options("*", (c) => new Response(null, { headers: corsHeaders }));

Deno.serve(app.fetch);
