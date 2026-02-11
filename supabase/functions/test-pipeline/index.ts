import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TestRequest {
  action: "test_single" | "test_batch" | "get_results";
  tool_name?: string;
  tool_names?: string[];
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

    const body: TestRequest = await req.json();
    const { action } = body;

    if (action === "get_results") {
      const { data, error } = await supabase
        .from("pipeline_test_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return new Response(JSON.stringify({ results: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test_single" && body.tool_name) {
      const result = await runToolTest(body.tool_name, userId, supabase);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test_batch" && body.tool_names) {
      const results = [];
      for (const name of body.tool_names.slice(0, 5)) {
        const r = await runToolTest(name, userId, supabase);
        results.push(r);
      }
      return new Response(JSON.stringify({ batch_results: results, tested: results.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e: any) {
    console.error("test-pipeline error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function runToolTest(toolName: string, userId: string, supabase: any) {
  const start = Date.now();
  const steps: { step: string; status: string; duration_ms: number }[] = [];

  try {
    // Step 1: Validate tool definition
    const s1 = Date.now();
    const validated = toolName && toolName.length > 0;
    steps.push({ step: "validate", status: validated ? "pass" : "fail", duration_ms: Date.now() - s1 });
    if (!validated) throw new Error("Invalid tool name");

    // Step 2: Test AI connectivity (quick ping to Lovable AI)
    const s2 = Date.now();
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      steps.push({ step: "ai_connectivity", status: "fail", duration_ms: Date.now() - s2 });
      throw new Error("LOVABLE_API_KEY not configured");
    }
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: `Briefly describe what "${toolName}" should do in one sentence.` }],
      }),
    });
    if (aiResp.status === 429) {
      steps.push({ step: "ai_connectivity", status: "rate_limited", duration_ms: Date.now() - s2 });
    } else if (aiResp.status === 402) {
      steps.push({ step: "ai_connectivity", status: "credits_exhausted", duration_ms: Date.now() - s2 });
    } else if (!aiResp.ok) {
      steps.push({ step: "ai_connectivity", status: "fail", duration_ms: Date.now() - s2 });
    } else {
      const aiData = await aiResp.json();
      const desc = aiData.choices?.[0]?.message?.content || "";
      steps.push({ step: "ai_connectivity", status: desc ? "pass" : "warn", duration_ms: Date.now() - s2 });
    }

    // Step 3: Test OpenRouter connectivity
    const s3 = Date.now();
    const orKey = Deno.env.get("OPENROUTER_API_KEY");
    if (orKey) {
      const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${orKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://lovable.dev" },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [{ role: "user", content: `Test ping for ${toolName}` }],
          max_tokens: 50,
        }),
      });
      steps.push({ step: "openrouter_connectivity", status: orResp.ok ? "pass" : "warn", duration_ms: Date.now() - s3 });
    } else {
      steps.push({ step: "openrouter_connectivity", status: "skip", duration_ms: 0 });
    }

    // Step 4: Test DB write/read
    const s4 = Date.now();
    const totalDuration = Date.now() - start;
    const passCount = steps.filter(s => s.status === "pass").length;
    const status = passCount >= 2 ? "pass" : passCount >= 1 ? "partial" : "fail";

    const { error: dbErr } = await supabase.from("pipeline_test_results").insert({
      user_id: userId,
      tool_name: toolName,
      status,
      steps_completed: passCount,
      total_steps: steps.length,
      result_data: { steps },
      duration_ms: totalDuration,
    });
    steps.push({ step: "db_persistence", status: dbErr ? "fail" : "pass", duration_ms: Date.now() - s4 });

    return {
      tool_name: toolName,
      status,
      steps,
      duration_ms: Date.now() - start,
      passed: passCount,
      total: steps.length,
    };
  } catch (e: any) {
    const totalDuration = Date.now() - start;
    await supabase.from("pipeline_test_results").insert({
      user_id: userId,
      tool_name: toolName,
      status: "fail",
      steps_completed: steps.filter(s => s.status === "pass").length,
      total_steps: steps.length,
      result_data: { steps },
      error_message: e.message,
      duration_ms: totalDuration,
    });
    return { tool_name: toolName, status: "fail", steps, error: e.message, duration_ms: totalDuration };
  }
}
