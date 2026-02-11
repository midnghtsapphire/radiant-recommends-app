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
  action: "generate" | "list" | "get" | "mark_implemented" | "batch_generate" | "auto_event" | "suggest_tools";
  tool_name?: string;
  tool_names?: string[];
  event_name?: string;
  event_type?: string; // "project" | "website" | "campaign"
  tool_description?: string;
  repo_id?: string;
}

async function callOpenRouter(prompt: string, model?: string): Promise<string> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  const selectedModel = model || OPENROUTER_MODELS[0];
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
      max_tokens: 8000,
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
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
    const userId = userData.user.id;

    const body: RepoRequest = await req.json();

    // ─── LIST ───
    if (body.action === "list") {
      const { data, error } = await supabase
        .from("tool_repository")
        .select("id, tool_name, event_name, status, is_implemented, model_used, generation_duration_ms, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
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
      const result = await generateToolAssets(body.tool_name, body.tool_description || "", body.event_name || "haircare-app", userId, supabase);
      return json(result);
    }

    // ─── BATCH GENERATE ───
    if (body.action === "batch_generate" && body.tool_names) {
      const results = [];
      for (const name of body.tool_names.slice(0, 3)) {
        const r = await generateToolAssets(name, "", body.event_name || "haircare-app", userId, supabase);
        results.push({ tool_name: name, status: r.status, id: r.id });
      }
      return json({ batch: results, generated: results.length });
    }

    // ─── SUGGEST TOOLS FOR EVENT ───
    if (body.action === "suggest_tools") {
      const eventName = body.event_name || "haircare-app";
      const eventType = body.event_type || "project";
      const suggestPrompt = `You are a senior software architect. For a "${eventType}" called "${eventName}", suggest ALL tools needed to make it production-ready.

Categories to cover:
- Core features (main functionality tools)
- QA & Testing (unit tests, E2E, code review, regression)
- Security & Compliance (SOX, OWASP, prompt injection detection)
- Marketing & Revenue (SEO, social media, affiliate, campaigns)
- DevOps & Monitoring (tracing, logging, CI/CD, deployment)
- Documentation (data dictionary, API docs, user manual)

Return JSON:
{
  "event_name": "${eventName}",
  "event_type": "${eventType}",
  "suggested_tools": [
    { "name": "UpToolName", "description": "What it does", "category": "qa|security|marketing|devops|docs|core", "priority": "critical|high|medium|low" }
  ],
  "total_tools": number,
  "estimated_generation_time_minutes": number
}`;
      const raw = await callOpenRouter(suggestPrompt, OPENROUTER_MODELS[1]);
      const parsed = parseJSON(raw);
      return json(parsed || { raw, event_name: eventName });
    }

    // ─── AUTO EVENT: Generate ALL tools for an event ───
    if (body.action === "auto_event") {
      const eventName = body.event_name || "haircare-app";
      const eventType = body.event_type || "project";

      // Step 1: Get tool suggestions
      const suggestPrompt = `You are a senior software architect. For a "${eventType}" called "${eventName}", list exactly the tool names needed. Return JSON array of objects with "name" and "description" fields only. Include tools for: core features, QA (UpQA, UpTest, UpCodeReview), E2E testing (UpEndToEnd, UpEndToEndTesting), security (UpSOXCompliance, UpAutoDetectionPromptInjections), implementation (UpImplement, UpRun), marketing, and monitoring. Max 15 tools.`;
      const suggestRaw = await callOpenRouter(suggestPrompt, OPENROUTER_MODELS[1]);
      const suggestedTools = parseJSON(suggestRaw);

      if (!suggestedTools || !Array.isArray(suggestedTools)) {
        return json({ error: "Failed to parse tool suggestions", raw: suggestRaw });
      }

      // Step 2: Generate each tool's assets
      const results = [];
      for (const tool of suggestedTools.slice(0, 10)) {
        try {
          const r = await generateToolAssets(
            tool.name || tool.tool_name,
            tool.description || tool.desc || "",
            eventName,
            userId,
            supabase
          );
          results.push({ tool_name: tool.name || tool.tool_name, status: r.status, id: r.id });
        } catch (e: any) {
          results.push({ tool_name: tool.name || tool.tool_name, status: "failed", error: e.message });
        }
      }

      return json({
        event_name: eventName,
        event_type: eventType,
        tools_generated: results.length,
        tools_suggested: suggestedTools.length,
        results,
        status: "complete",
      });
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
    const megaPrompt = `You are a senior software architect. Generate COMPLETE production-ready assets for the tool "${toolName}" for a hair care SaaS application.
${toolDescription ? `Tool purpose: ${toolDescription}` : ""}
Event/Project: ${eventName}
Domain: Hair care, beauty, anti-aging, marketing automation.

Return a SINGLE JSON object with ALL of these fields:

{
  "data_dictionary": {
    "tables": [
      {
        "table_name": "string",
        "description": "string",
        "columns": [
          { "name": "string", "type": "string (postgres type)", "nullable": bool, "default": "string|null", "description": "string" }
        ],
        "rls_policies": [
          { "name": "string", "command": "SELECT|INSERT|UPDATE|DELETE", "using": "string", "with_check": "string|null" }
        ]
      }
    ],
    "relationships": [ { "from": "table.column", "to": "table.column", "type": "one-to-many|many-to-many" } ]
  },
  "db_migration_sql": "-- Complete runnable SQL: CREATE TABLE, RLS, indexes, triggers. Must be valid PostgreSQL.",
  "roadmap": {
    "phases": [
      { "phase": "string", "duration": "string", "tasks": ["string"], "deliverables": ["string"] }
    ]
  },
  "blueprint": {
    "architecture": "string describing system design",
    "components": [ { "name": "string", "type": "edge_function|react_component|mcp_tool|db_table", "description": "string" } ],
    "integrations": ["string"],
    "tech_stack": ["string"]
  },
  "project_plan": {
    "milestones": [ { "name": "string", "tasks": ["string"], "priority": "high|medium|low" } ],
    "estimated_hours": number,
    "dependencies": ["string"]
  },
  "api_spec": {
    "endpoints": [
      { "method": "POST|GET", "path": "string", "description": "string", "request_body": {}, "response": {} }
    ]
  },
  "source_code": "Complete TypeScript Supabase Edge Function code using Deno.serve(). Include CORS, auth, error handling. Production-ready.",
  "master_prompt": "The system prompt that defines this tool's AI behavior.",
  "readme": "Full README.md with setup instructions, API docs, examples."
}

IMPORTANT: The db_migration_sql must be RUNNABLE SQL. Include CREATE TABLE, ALTER TABLE ENABLE ROW LEVEL SECURITY, CREATE POLICY, and CREATE INDEX statements. All tables must have user_id UUID NOT NULL and RLS policies scoped to auth.uid() = user_id.`;

    const raw = await callOpenRouter(megaPrompt, OPENROUTER_MODELS[0]);
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
          model_used: OPENROUTER_MODELS[0],
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
          model_used: OPENROUTER_MODELS[0],
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

function json(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
