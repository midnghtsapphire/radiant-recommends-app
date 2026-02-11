import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreditRequest {
  action: "balance" | "use_credits" | "add_credits" | "book_agent";
  credits?: number;
  agent_tool?: string;
  request_data?: any;
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

    const body: CreditRequest = await req.json();

    if (body.action === "balance") {
      const { data } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (!data) {
        // Auto-init if missing
        const { data: newData } = await supabase
          .from("user_credits")
          .insert({ user_id: userId, credits: 10 })
          .select()
          .single();
        return json({ credits: newData?.credits ?? 10, lifetime_purchased: 0 });
      }
      return json({ credits: data.credits, lifetime_purchased: data.lifetime_purchased });
    }

    if (body.action === "add_credits") {
      const amount = body.credits || 10;
      const { data: current } = await supabase
        .from("user_credits")
        .select("credits, lifetime_purchased")
        .eq("user_id", userId)
        .single();

      if (!current) {
        await supabase.from("user_credits").insert({
          user_id: userId,
          credits: amount,
          lifetime_purchased: amount,
        });
      } else {
        await supabase
          .from("user_credits")
          .update({
            credits: current.credits + amount,
            lifetime_purchased: current.lifetime_purchased + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
      return json({ success: true, credits_added: amount });
    }

    if (body.action === "book_agent") {
      const tool = body.agent_tool;
      if (!tool) throw new Error("agent_tool required");
      const cost = getToolCost(tool);

      // Check balance
      const { data: bal } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", userId)
        .single();
      
      if (!bal || bal.credits < cost) {
        return new Response(
          JSON.stringify({ error: "Insufficient credits", required: cost, available: bal?.credits || 0 }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct credits
      await supabase
        .from("user_credits")
        .update({ credits: bal.credits - cost, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      // Create session
      const { data: session } = await supabase
        .from("agent_sessions")
        .insert({
          user_id: userId,
          agent_tool: tool,
          credits_spent: cost,
          status: "active",
          request_data: body.request_data || {},
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Run the tool via Lovable AI
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      let result: any = { status: "no_ai" };
      
      if (lovableKey) {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{
              role: "user",
              content: `You are the ${tool} agent. ${body.request_data?.prompt || `Execute the ${tool} task with best practices.`}\n\nProvide a comprehensive, actionable response.`,
            }],
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          result = { output: aiData.choices?.[0]?.message?.content || "", model: "gemini-3-flash" };
        } else if (aiResp.status === 429) {
          result = { error: "Rate limited — try again shortly" };
        } else if (aiResp.status === 402) {
          result = { error: "Credits exhausted — add credits in workspace settings" };
        }
      }

      // Update session
      await supabase
        .from("agent_sessions")
        .update({
          status: "completed",
          result_data: result,
          completed_at: new Date().toISOString(),
        })
        .eq("id", session?.id);

      return json({
        session_id: session?.id,
        tool,
        credits_spent: cost,
        remaining_credits: bal.credits - cost,
        result,
      });
    }

    throw new Error("Invalid action");
  } catch (e: any) {
    console.error("agent-credits error:", e);
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

function getToolCost(tool: string): number {
  const costs: Record<string, number> = {
    UpQA: 2, UpCodeReview: 2, UpEndToEnd: 3, UpTracing: 2,
    UpDeepFakeDetection: 3, UpAutoDetectionPromptInjections: 3,
    UpAffiliate: 1, UpMarketing: 2, UpBackLinking: 2, UpLongTail: 1,
    UpSEO: 1, UpSocialMedia: 2, UpBlueOcean: 2, UpContent: 2,
    UpYouTube: 2, UpChatter: 2,
    UpAltText: 1, UpFavCon: 1, UpLogo: 2, UpDomain: 1, UpEIN: 1, UpSOS: 1,
    UpAgent: 2, UpFAQ: 1, UpDataScientist: 3, UpPatent: 3,
    UpVoice: 3, UpTTS: 2, UpSTT: 2, UpVoiceClone: 3, UpAudioMaster: 2, UpPodcast: 3,
    UpNOCO: 2, UpAfro: 2, UpTestPipeline: 1,
  };
  return costs[tool] || 1;
}
