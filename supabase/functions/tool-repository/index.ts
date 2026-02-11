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

interface RepoRequest {
  action: "generate" | "generate_pending" | "list" | "get" | "mark_implemented" | "batch_generate" | "auto_event" | "suggest_tools" | "audit" | "rename" | "retry" | "retry_all";
  tool_name?: string;
  tool_names?: string[];
  event_name?: string;
  event_type?: string;
  tool_description?: string;
  repo_id?: string;
}

// UpRetry: OpenRouter 3x (cycling models) → Gemini fallback. Automated resilience.
async function upRetry(prompt: string, maxRetries = 3): Promise<{ content: string; model: string; attempts: number }> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  let attempts = 0;

  // Phase 1: Try OpenRouter models up to maxRetries times
  if (apiKey) {
    for (let i = 0; i < maxRetries; i++) {
      const model = OPENROUTER_MODELS[i % OPENROUTER_MODELS.length];
      attempts++;
      try {
        console.log(`[UpRetry] Attempt ${attempts}/${maxRetries} with ${model}`);
        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://lovable.dev",
          },
          body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 8000 }),
        });
        if (resp.status === 429) { console.log(`[UpRetry] ${model} rate-limited, cycling...`); continue; }
        if (!resp.ok) { console.log(`[UpRetry] ${model} error ${resp.status}, cycling...`); continue; }
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content || "";
        if (content) return { content, model, attempts };
        console.log(`[UpRetry] ${model} returned empty, cycling...`);
      } catch (e) {
        console.log(`[UpRetry] ${model} threw: ${e}`);
      }
    }
  }

  // Phase 2: Gemini fallback (always works if LOVABLE_API_KEY set)
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("All OpenRouter attempts failed and no LOVABLE_API_KEY for fallback");
  attempts++;
  console.log(`[UpRetry] All OpenRouter failed. Falling back to Gemini (attempt ${attempts})`);
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: prompt }] }),
  });
  if (!resp.ok) throw new Error(`Gemini fallback failed [${resp.status}]`);
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("Gemini returned empty");
  return { content, model: "gemini-3-flash", attempts };
}

// Legacy wrapper for existing code
async function callOpenRouter(prompt: string, model?: string): Promise<string> {
  const result = await upRetry(prompt);
  return result.content;
}

function parseJSON(text: string): any {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return JSON.parse(match ? match[1].trim() : text.trim());
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    serviceRoleKey
  );

  try {
    let userId = "00000000-0000-0000-0000-000000000000"; // system user UUID
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader !== `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData.user) {
        userId = userData.user.id;
      }
    }

    const body: RepoRequest = await req.json();

    // ─── LIST ───
    if (body.action === "list") {
      const db = userId === "system" ? supabaseAdmin : supabase;
      const query = db
        .from("tool_repository")
        .select("id, tool_name, event_name, status, is_implemented, model_used, generation_duration_ms, created_at")
        .order("created_at", { ascending: false });
      if (userId !== "system") query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) throw error;
      return json({ tools: data });
    }

    // ─── GET SINGLE ───
    if (body.action === "get" && body.repo_id) {
      const { data, error } = await supabase
        .from("tool_repository")
        .select("*")
        .eq("id", body.repo_id)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return json(data);
    }

    // ─── MARK IMPLEMENTED ───
    if (body.action === "mark_implemented" && body.repo_id) {
      await supabase
        .from("tool_repository")
        .update({ is_implemented: true, implemented_at: new Date().toISOString(), status: "implemented" })
        .eq("id", body.repo_id)
        .eq("user_id", userId);
      return json({ success: true });
    }

    // ─── GENERATE ───
    if (body.action === "generate" && body.tool_name) {
      const result = await generateToolAssets(body.tool_name, body.tool_description || "", body.event_name || "haircare-app", userId, supabaseAdmin);
      return json(result);
    }

    // ─── GENERATE FOR EXISTING PENDING TOOL (skip insert) ───
    if (body.action === "generate_pending" && body.repo_id) {
      const { data: existing } = await supabaseAdmin
        .from("tool_repository")
        .select("*")
        .eq("id", body.repo_id)
        .single();
      if (!existing) throw new Error("Tool not found");
      
      const desc = existing.blueprint?.description || existing.tool_name;
      await supabaseAdmin.from("tool_repository").update({ status: "generating" }).eq("id", body.repo_id);
      
      const result = await generateToolAssetsForExisting(
        existing.id, existing.tool_name, desc, existing.event_name || "mega-suite-2026", supabaseAdmin
      );
      return json(result);
    }

    // ─── RENAME: AI suggests shorter names ───
    if (body.action === "rename") {
      const { data: tools } = await supabaseAdmin
        .from("tool_repository")
        .select("id, tool_name, blueprint")
        .order("created_at", { ascending: false })
        .limit(50);
      const names = (tools || []).map((t: any) => `${t.tool_name}: ${t.blueprint?.description || "no desc"}`).join("\n");
      const renamePrompt = `Rename these tools. Rules: Keep "Up" prefix. Max 10 chars total. Domain-friendly. Catchy. Return JSON array: [{"old":"UpOldName","new":"UpNew","reason":"why"}].

${names}`;
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      let raw: string;
      if (lovableKey) {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: renamePrompt }] }),
        });
        if (!resp.ok) throw new Error(`Rename AI failed [${resp.status}]`);
        const data = await resp.json();
        raw = data.choices?.[0]?.message?.content || "";
      } else {
        raw = await callOpenRouter(renamePrompt);
      }
      const parsed = parseJSON(raw);
      return json({ renames: parsed || [], raw: parsed ? undefined : raw });
    }

    // ─── BATCH GENERATE ───
    if (body.action === "batch_generate" && body.tool_names) {
      const results = [];
      for (const name of body.tool_names.slice(0, 3)) {
        const r = await generateToolAssets(name, "", body.event_name || "haircare-app", userId, supabaseAdmin);
        results.push({ tool_name: name, status: r.status, id: r.id });
      }
      return json({ batch: results, generated: results.length });
    }

    // ─── SUGGEST TOOLS FOR EVENT ───
    if (body.action === "suggest_tools") {
      const eventName = body.event_name || "haircare-app";
      const eventType = body.event_type || "project";
      const suggestPrompt = `You are a visionary software architect and market strategist. For a "${eventType}" called "${eventName}", research and suggest ALL tools needed to make it production-ready AND industry-leading.

RESEARCH FIRST:
- What existing free/open-source APIs, apps, or platforms solve similar problems? List them.
- What are the BEST paid competitors? How can we build something better for free?
- What new-age renaissance ideas could disrupt this space? Think beyond what exists.
- What would investors, stakeholders, and technical reviewers expect to see?

TOOL CATEGORIES (suggest tools for ALL that apply to "${eventType}"):
- Core Features: main functionality, unique differentiators
- Business Formation: UpDomain, UpEIN, UpSOS, UpBusinessLicense, UpCertificates, UpInsurance
- App Creation: UpApp (assembles everything into working app), UpSubscription, UpPayments
- Marketing & Revenue: UpSEO, UpSocialMedia, UpAffiliate, UpBlueOcean, UpContent, UpYouTube
- QA & Testing: UpQA, UpTest, UpCodeReview, UpEndToEnd, UpEndToEndTesting
- Security & Compliance: UpSOXCompliance, UpAutoDetectionPromptInjections, UpDeepFakeDetection
- DevOps: UpTracing, UpMonitoring, UpCI, UpDeployment
- Documentation: UpDataDictionary, UpAPIDoc, UpUserManual, UpTechManual
- Branding: UpLogo, UpFavCon, UpAltText, UpBrandKit
- Voice & Media: UpVoice, UpTTS, UpPodcast, UpVideo
- Orchestration: UpImplement, UpRun, UpAutoEvent

IMPORTANT: Not every ${eventType} needs every tool. A website needs UpDomain, UpSEO, UpSubscription. A campaign needs UpSocialMedia, UpContent, UpAffiliate. A SaaS needs UpApp, UpSubscription, UpPayments, UpQA. Tailor the list.

Also suggest 3-5 NOVEL tools that don't exist yet but SHOULD — renaissance ideas that would give "${eventName}" an unfair advantage.

Return JSON:
{
  "event_name": "${eventName}",
  "event_type": "${eventType}",
  "market_research": {
    "existing_competitors": [{ "name": "string", "url": "string", "weakness": "string" }],
    "free_apis_available": ["string"],
    "blue_ocean_opportunities": ["string"]
  },
  "suggested_tools": [
    { "name": "UpToolName", "description": "What it does", "category": "core|business|app|marketing|qa|security|devops|docs|brand|voice|meta", "priority": "critical|high|medium|low", "why_needed": "string" }
  ],
  "novel_tools": [
    { "name": "UpToolName", "description": "Renaissance idea that doesn't exist yet", "competitive_advantage": "string" }
  ],
  "recommended_order": ["UpTool1", "UpTool2"],
  "total_tools": number,
  "estimated_generation_time_minutes": number
}`;
      const raw = await callOpenRouter(suggestPrompt, OPENROUTER_MODELS[1]);
      const parsed = parseJSON(raw);
      return json(parsed || { raw, event_name: eventName });
    }

    // ─── AUTO EVENT: Suggest tools + insert as pending (no generation — avoids timeout) ───
    if (body.action === "auto_event") {
      const eventName = body.event_name || "haircare-app";
      const eventType = body.event_type || "project";

      // Step 1: Get tool suggestions — research-driven with revenue projections
      const suggestPrompt = `You are a visionary architect, market strategist, and revenue engineer. For a "${eventType}" called "${eventName}", do the following:

1. DEEP RESEARCH: What existing apps, APIs, open-source projects, Indiegogo/Kickstarter campaigns exist in this space? What are their weaknesses? How do we build 10x better for free?
2. NAMING CONVENTION: Our prefix is "Up" (e.g., UpQA, UpSEO, UpPredictiveStock, UpFastMoneyToday). Use it consistently. Names must be catchy, addictive, memorable.
3. REVENUE PROJECTIONS FOR EVERY TOOL:
   - Time to first dollar: today? this week? this month?
   - Projected revenue: $100/day, $500/day, $1000/day scenarios
   - Free advertising strategy vs paid advertising ROI
   - When will it fail? Why might it not work? How to make it work anyway?
4. PREDICTIVE & INVESTMENT TOOLS: Include UpPredictiveStock, UpPredictiveCrypto, UpPredictiveTesla, UpPredictiveEconomics, UpPredictiveEmergingTech, UpPredictiveGetRich — algorithms, signals, probability engines.
5. FAST MONEY TOOLS: UpSell, UpFastMoneyToday, UpIndiegogo, UpKickstarter, UpCrowdfund, UpRevenueProjector, UpFreeAdvertising, UpPaidAdOptimizer — revenue captured TODAY.
6. SAFETY TOOLS (UpBELL project): UpWeaponDetect, UpEdgeWeapon, UpEdgeActiveShooter, UpThreatAssess — deep research on weapon detection, active shooter prevention, school safety AI.
7. DEEPFAKE & SECURITY: Include deepfake detection, testing, AI content verification, prompt injection detection, trust scoring.
8. CREATIVE DIRECTION: Think PoofAgents (genie-in-a-lamp AI agents), glassy 3D, anime GenZ themes, generational targeting (GenZ/Millennials/GenX/Boomers), catchy addictive branding.
9. MARKETING PLAN: Deep research on unconventional, genius, creative marketing — guerrilla, viral, Reddit/HN/ProductHunt launches, zero-cost growth hacks. Create a sub-genre marketing plan for EACH tool.
10. FAILURE ANALYSIS: For each tool — when will it fail? Why won't it work? How to make it work? Pivot strategies.
11. NOVEL IDEAS: 5-10 renaissance-level tools that don't exist anywhere. Better clones, higher power, obsessed-love-it ideas.
12. COLLABORATORS: Recommend AI models, APIs, services, open-source projects to integrate. Decrease need for paid APIs.
13. TOOL SUITE: Design the COMPLETE tool suite tailored for "${eventType}". Include sub-agents and sub-genres as separate tools.

Return JSON array: [{"name": "UpToolName", "description": "what it does and revenue potential", "category": "string", "order": 1, "revenue_today": "$X", "time_to_market": "today|week|month", "fail_risk": "low|medium|high", "marketing_strategy": "string"}]. Max 25 tools.`;
      const suggestRaw = await callOpenRouter(suggestPrompt, OPENROUTER_MODELS[1]);
      const suggestedTools = parseJSON(suggestRaw);

      if (!suggestedTools || !Array.isArray(suggestedTools)) {
        return json({ error: "Failed to parse tool suggestions", raw: suggestRaw });
      }

      // Step 2: Insert all as "pending" rows — generation happens per-tool later
      const rows = suggestedTools.slice(0, 25).map((tool: any, i: number) => ({
        user_id: userId,
        tool_name: tool.name || tool.tool_name || `UpTool${i}`,
        event_name: eventName,
        status: "pending",
        blueprint: { category: tool.category, order: tool.order || i + 1, description: tool.description },
      }));

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("tool_repository")
        .insert(rows)
        .select("id, tool_name, status");
      if (insertErr) throw insertErr;

      return json({
        event_name: eventName,
        event_type: eventType,
        tools_queued: inserted?.length || 0,
        tools: inserted,
        status: "queued",
        message: "Tools queued. Call 'generate' for each tool_name to create full assets.",
      });
    }

    // ─── AUDIT: Deep research existing tools, consolidate, suggest better ones ───
    if (body.action === "audit") {
      const { data: existing } = await supabaseAdmin
        .from("tool_repository")
        .select("tool_name, event_name, status, blueprint")
        .order("created_at", { ascending: false })
        .limit(100);

      const toolList = (existing || []).map((t: any) => t.tool_name).join(", ");

      const auditPrompt = `Audit these tools. Prefix "Up".

EXISTING: ${toolList}

1. Overlapping tools? Merge them.
2. Missing tools? Add them.
3. Bad names? Rename.
4. 5 novel tools nobody built.
5. Each: revenue potential, time-to-market, fail risk.

JSON array: [{"name":"UpX","description":"string","action":"keep|merge|rename|new|remove","merge_from":["UpA","UpB"],"category":"string","order":1}]. Max 25.`;

      // Use Lovable AI (Gemini) for speed — OpenRouter free models too slow for audit
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      let raw: string;
      if (lovableKey) {
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: auditPrompt }],
          }),
        });
        if (!resp.ok) throw new Error(`Lovable AI [${resp.status}]: ${await resp.text()}`);
        const data = await resp.json();
        raw = data.choices?.[0]?.message?.content || "";
      } else {
        raw = await callOpenRouter(auditPrompt, OPENROUTER_MODELS[0]);
      }
      const parsed = parseJSON(raw);

      if (!parsed || !Array.isArray(parsed)) {
        return json({ error: "Failed to parse audit", raw });
      }

      const newTools = parsed.filter((t: any) => t.action === "new" || t.action === "merge");
      if (newTools.length > 0) {
        const rows = newTools.slice(0, 25).map((tool: any, i: number) => ({
          user_id: userId,
          tool_name: tool.name || `UpAudit${i}`,
          event_name: "audit-consolidation-2026",
          status: "pending",
          blueprint: {
            category: tool.category,
            order: tool.order || i + 1,
            description: tool.description,
            action: tool.action,
            merge_from: tool.merge_from,
          },
        }));
        await supabaseAdmin.from("tool_repository").insert(rows);
      }

      return json({
        audit_results: parsed,
        existing_count: existing?.length || 0,
        new_tools_created: newTools.length,
        consolidations: parsed.filter((t: any) => t.action === "merge").length,
        removals: parsed.filter((t: any) => t.action === "remove").length,
      });
    }

    // ─── RETRY: UpRetry for a single raw/failed tool ───
    if (body.action === "retry" && body.repo_id) {
      const { data: tool } = await supabaseAdmin.from("tool_repository").select("*").eq("id", body.repo_id).single();
      if (!tool) throw new Error("Tool not found");
      if (!["raw", "failed", "pending", "retrying", "generating"].includes(tool.status)) {
        return json({ message: `Tool ${tool.tool_name} is already ${tool.status}, skip retry`, status: tool.status });
      }
      await supabaseAdmin.from("tool_repository").update({ status: "retrying" }).eq("id", body.repo_id);
      const desc = tool.blueprint?.description || tool.tool_name;
      const start = Date.now();

      const megaPrompt = `Senior architect: generate production-ready assets for "${tool.tool_name}".
Purpose: ${desc}
Project: ${tool.event_name || "mega-suite-2026"}. Domain: SaaS, marketing, automation, AI tools.

Return ONE JSON object with keys: data_dictionary, db_migration_sql, roadmap, blueprint, project_plan, api_spec, source_code (TypeScript Deno.serve()), master_prompt, readme.
db_migration_sql must be runnable PostgreSQL with RLS. All tables need user_id UUID NOT NULL.`;

      const { content: raw, model: usedModel, attempts } = await upRetry(megaPrompt);
      const parsed = parseJSON(raw);

      if (parsed) {
        await supabaseAdmin.from("tool_repository").update({
          status: "ready",
          data_dictionary: parsed.data_dictionary || null,
          db_schema: JSON.stringify(parsed.data_dictionary?.tables || [], null, 2),
          db_migration_sql: parsed.db_migration_sql || null,
          roadmap: parsed.roadmap || null,
          blueprint: parsed.blueprint || null,
          project_plan: parsed.project_plan || null,
          source_code: parsed.source_code || null,
          api_spec: parsed.api_spec || null,
          master_prompt: parsed.master_prompt || null,
          readme: parsed.readme || null,
          model_used: usedModel,
          generation_duration_ms: Date.now() - start,
          updated_at: new Date().toISOString(),
        }).eq("id", body.repo_id);
        return json({ id: body.repo_id, tool_name: tool.tool_name, status: "ready", model: usedModel, attempts, duration_ms: Date.now() - start, assets: Object.keys(parsed) });
      } else {
        await supabaseAdmin.from("tool_repository").update({
          status: "raw", source_code: raw, model_used: usedModel,
          generation_duration_ms: Date.now() - start, updated_at: new Date().toISOString(),
        }).eq("id", body.repo_id);
        return json({ id: body.repo_id, tool_name: tool.tool_name, status: "raw", model: usedModel, attempts, duration_ms: Date.now() - start });
      }
    }

    // ─── RETRY ALL: UpRetry for all raw/failed tools ───
    if (body.action === "retry_all") {
      const { data: failedTools } = await supabaseAdmin
        .from("tool_repository")
        .select("id, tool_name, status, blueprint, event_name")
        .in("status", ["raw", "failed"])
        .order("created_at", { ascending: true })
        .limit(10);
      if (!failedTools?.length) return json({ message: "No raw/failed tools to retry", retried: 0 });

      const results = [];
      for (const tool of failedTools) {
        try {
          await supabaseAdmin.from("tool_repository").update({ status: "retrying" }).eq("id", tool.id);
          const desc = tool.blueprint?.description || tool.tool_name;
          const start = Date.now();
          const megaPrompt = `Senior architect: generate production-ready assets for "${tool.tool_name}".
Purpose: ${desc}
Project: ${tool.event_name || "mega-suite-2026"}. Domain: SaaS, marketing, automation, AI tools.

Return ONE JSON object with keys: data_dictionary, db_migration_sql, roadmap, blueprint, project_plan, api_spec, source_code (TypeScript Deno.serve()), master_prompt, readme.`;

          const { content: raw, model: usedModel, attempts } = await upRetry(megaPrompt);
          const parsed = parseJSON(raw);
          if (parsed) {
            await supabaseAdmin.from("tool_repository").update({
              status: "ready", data_dictionary: parsed.data_dictionary || null,
              db_schema: JSON.stringify(parsed.data_dictionary?.tables || [], null, 2),
              db_migration_sql: parsed.db_migration_sql || null, roadmap: parsed.roadmap || null,
              blueprint: parsed.blueprint || null, project_plan: parsed.project_plan || null,
              source_code: parsed.source_code || null, api_spec: parsed.api_spec || null,
              master_prompt: parsed.master_prompt || null, readme: parsed.readme || null,
              model_used: usedModel, generation_duration_ms: Date.now() - start, updated_at: new Date().toISOString(),
            }).eq("id", tool.id);
            results.push({ tool_name: tool.tool_name, status: "ready", model: usedModel, attempts, duration_ms: Date.now() - start });
          } else {
            await supabaseAdmin.from("tool_repository").update({
              status: "raw", source_code: raw, model_used: usedModel,
              generation_duration_ms: Date.now() - start, updated_at: new Date().toISOString(),
            }).eq("id", tool.id);
            results.push({ tool_name: tool.tool_name, status: "raw", model: usedModel, attempts, duration_ms: Date.now() - start });
          }
        } catch (e: any) {
          await supabaseAdmin.from("tool_repository").update({ status: "failed", source_code: e.message }).eq("id", tool.id);
          results.push({ tool_name: tool.tool_name, status: "failed", error: e.message });
        }
      }
      return json({ retried: results.length, results });
    }

    throw new Error("Invalid action");
  } catch (e: any) {
    console.error("tool-repository error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateToolAssets(
  toolName: string,
  toolDescription: string,
  eventName: string,
  userId: string,
  supabase: any
) {
  const start = Date.now();
  console.log(`[REPO] Generating assets for ${toolName}`);

  // Insert pending record
  const { data: record, error: insertErr } = await supabase
    .from("tool_repository")
    .insert({ user_id: userId, tool_name: toolName, event_name: eventName, status: "generating" })
    .select()
    .single();
  if (insertErr) throw insertErr;

  try {
    // ─── MEGA PROMPT: Generate ALL assets in one call ───
    const megaPrompt = `Senior architect: generate production-ready assets for "${toolName}".
${toolDescription ? `Purpose: ${toolDescription}` : ""}
Project: ${eventName}. Domain: SaaS, marketing, automation, AI tools.

Return ONE JSON object with these keys:
- data_dictionary: {tables:[{table_name,description,columns:[{name,type,nullable,default,description}],rls_policies:[{name,command,using,with_check}]}],relationships:[{from,to,type}]}
- db_migration_sql: runnable PostgreSQL (CREATE TABLE, RLS, indexes). All tables need user_id UUID NOT NULL, RLS scoped to auth.uid()=user_id.
- roadmap: {phases:[{phase,duration,tasks:[],deliverables:[]}]}
- blueprint: {architecture,components:[{name,type,description}],integrations:[],tech_stack:[]}
- project_plan: {milestones:[{name,tasks:[],priority}],estimated_hours,dependencies:[]}
- api_spec: {endpoints:[{method,path,description,request_body:{},response:{}}]}
- source_code: Complete TypeScript Deno.serve() edge function with CORS + auth + error handling.
- master_prompt: System prompt for this tool's AI behavior.
- readme: README.md with setup, API docs, examples.`;

    // Use UpRetry: OpenRouter 3x → Gemini fallback
    const { content: raw, model: usedModel } = await upRetry(megaPrompt);
    const parsed = parseJSON(raw);

    if (parsed) {
      await supabase
        .from("tool_repository")
        .update({
          status: "ready",
          data_dictionary: parsed.data_dictionary || null,
          db_schema: JSON.stringify(parsed.data_dictionary?.tables || [], null, 2),
          db_migration_sql: parsed.db_migration_sql || null,
          roadmap: parsed.roadmap || null,
          blueprint: parsed.blueprint || null,
          project_plan: parsed.project_plan || null,
          source_code: parsed.source_code || null,
          api_spec: parsed.api_spec || null,
          master_prompt: parsed.master_prompt || null,
          readme: parsed.readme || null,
          model_used: usedModel,
          generation_duration_ms: Date.now() - start,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      return { id: record.id, tool_name: toolName, status: "ready", duration_ms: Date.now() - start, assets: Object.keys(parsed) };
    } else {
      // Couldn't parse — store raw
      await supabase
        .from("tool_repository")
        .update({
          status: "raw",
          source_code: raw,
          model_used: usedModel,
          generation_duration_ms: Date.now() - start,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id);

      return { id: record.id, tool_name: toolName, status: "raw", duration_ms: Date.now() - start };
    }
  } catch (e: any) {
    await supabase
      .from("tool_repository")
      .update({ status: "failed", source_code: e.message, generation_duration_ms: Date.now() - start })
      .eq("id", record.id);
    throw e;
  }
}

async function generateToolAssetsForExisting(
  recordId: string,
  toolName: string,
  toolDescription: string,
  eventName: string,
  supabase: any
) {
  const start = Date.now();
  console.log(`[REPO] Generating assets for existing ${toolName} (${recordId})`);
  
  const megaPrompt = `Senior architect: generate production-ready assets for "${toolName}".
Purpose: ${toolDescription}
Project: ${eventName}. Domain: SaaS, marketing, automation, AI tools.

Return ONE JSON object with keys: data_dictionary, db_migration_sql, roadmap, blueprint, project_plan, api_spec, source_code (TypeScript Deno.serve()), master_prompt, readme.
db_migration_sql must be runnable PostgreSQL with RLS. All tables need user_id UUID NOT NULL.`;

  const { content: raw, model: usedModel } = await upRetry(megaPrompt);

  const parsed = parseJSON(raw);
  if (parsed) {
    await supabase.from("tool_repository").update({
      status: "ready",
      data_dictionary: parsed.data_dictionary || null,
      db_schema: JSON.stringify(parsed.data_dictionary?.tables || [], null, 2),
      db_migration_sql: parsed.db_migration_sql || null,
      roadmap: parsed.roadmap || null,
      blueprint: parsed.blueprint || null,
      project_plan: parsed.project_plan || null,
      source_code: parsed.source_code || null,
      api_spec: parsed.api_spec || null,
      master_prompt: parsed.master_prompt || null,
      readme: parsed.readme || null,
      model_used: usedModel,
      generation_duration_ms: Date.now() - start,
      updated_at: new Date().toISOString(),
    }).eq("id", recordId);
    return { id: recordId, tool_name: toolName, status: "ready", duration_ms: Date.now() - start, assets: Object.keys(parsed) };
  } else {
    await supabase.from("tool_repository").update({
      status: "raw", source_code: raw, model_used: usedModel,
      generation_duration_ms: Date.now() - start, updated_at: new Date().toISOString(),
    }).eq("id", recordId);
    return { id: recordId, tool_name: toolName, status: "raw", duration_ms: Date.now() - start };
  }
}

function json(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
