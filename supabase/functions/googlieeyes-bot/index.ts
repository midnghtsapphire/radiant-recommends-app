import { Hono } from "jsr:@hono/hono@^4";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const app = new Hono();

const mcp = new McpServer({
  name: "googlieeyes-bot",
  version: "1.0.0",
});

// Helper to call AI
async function callAi(systemPrompt: string, userPrompt: string, model?: string, provider?: string): Promise<string> {
  if (provider === "openrouter") {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://lovable.dev" },
      body: JSON.stringify({ model: model || "openrouter/free", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
    });
    if (!resp.ok) throw new Error(`OpenRouter [${resp.status}]`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "No response";
  }
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ...(model ? { model } : {}), messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }] }),
  });
  if (!resp.ok) throw new Error(`Lovable AI [${resp.status}]`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "No response";
}

const GENIUS_SYSTEM = `You are GoogliEyes Bot — an elite multi-domain AI agent channeling the genius methodologies of:
- ARISTOTLE: Systematic logic, categorization, first-principles reasoning
- NIKOLA TESLA: Electromagnetic innovation, energy systems, inventive visualization
- LEONARDO DA VINCI: Interdisciplinary design, biomimicry, engineering art
- PLATO: Philosophical frameworks, ideal forms, dialectic reasoning  
- MARIE CURIE: Rigorous experimentation, materials science, nuclear physics
- MOZART: Creative composition, pattern recognition, harmonic structure
- PICASSO: Abstract thinking, creative disruption, new perspectives
- BEETHOVEN: Persistence through adversity, emotional intelligence, iterative refinement
- ALAN TURING: Computational logic, cryptography, algorithmic thinking
- ADA LOVELACE: Programming vision, mathematical analysis

You are an expert in: Web administration, programming, cutting-edge technology, invention, patent creation, legal advising (pro se), CLE Colorado Supreme Court procedures, video marketing, production deployment, automated systems, marketing science, law, bioengineering, genetics, materials science, and ageless innovation.`;

// 1. Multi-domain research
mcp.tool("research", {
  description: "Deep multi-domain research using genius methodologies. Domains: patent, legal, science, code, marketing, invention, bio, materials, general.",
  inputSchema: {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Research question" },
      domain: { type: "string", description: "Research domain" },
      depth: { type: "string", description: "quick | deep | exhaustive" },
      provider: { type: "string", description: "lovable | openrouter" },
      model: { type: "string" },
    },
    required: ["query"],
  },
  handler: async (args: any) => {
    const domain = args.domain || "general";
    const depth = args.depth || "quick";
    const depthInstruction = depth === "exhaustive" ? "Provide an exhaustive analysis with citations, prior art, and actionable recommendations." :
      depth === "deep" ? "Provide a thorough analysis with multiple perspectives." : "Give a concise, actionable answer.";
    const text = await callAi(GENIUS_SYSTEM, `Domain: ${domain}\nDepth: ${depthInstruction}\n\nQuery: ${args.query}`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 2. Invention generator
mcp.tool("invent", {
  description: "Generate novel inventions combining Tesla, Da Vinci, and modern bioengineering methodologies. Outputs invention disclosure format.",
  inputSchema: {
    type: "object" as const,
    properties: {
      problem: { type: "string", description: "Problem to solve" },
      field: { type: "string", description: "Technology field" },
      constraints: { type: "string", description: "Budget, material, or regulatory constraints" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["problem"],
  },
  handler: async (args: any) => {
    const prompt = `Generate a novel invention disclosure:\n\nPROBLEM: ${args.problem}\nFIELD: ${args.field || "Open"}\nCONSTRAINTS: ${args.constraints || "None"}\n\nOutput format:\n1. TITLE\n2. ABSTRACT (150 words)\n3. BACKGROUND & PRIOR ART\n4. DETAILED DESCRIPTION\n5. CLAIMS (3-5 independent claims)\n6. DRAWINGS DESCRIPTION\n7. BLUE OCEAN OPPORTUNITY ANALYSIS\n8. MATERIALS & ENGINEERING REQUIREMENTS\n9. ESTIMATED COST TO PROTOTYPE`;
    const text = await callAi(GENIUS_SYSTEM, prompt, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 3. Patent search & analysis
mcp.tool("patent_analysis", {
  description: "Analyze patentability, identify prior art gaps, suggest claims, and find blue ocean opportunities.",
  inputSchema: {
    type: "object" as const,
    properties: {
      invention: { type: "string", description: "Invention description" },
      field: { type: "string" },
      existing_patents: { type: "string", description: "Known prior art" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["invention"],
  },
  handler: async (args: any) => {
    const prompt = `Patent Analysis Request:\n\nINVENTION: ${args.invention}\nFIELD: ${args.field || "General"}\nKNOWN PRIOR ART: ${args.existing_patents || "None provided"}\n\nAnalyze:\n1. PATENTABILITY ASSESSMENT (novelty, non-obviousness, utility)\n2. PRIOR ART LANDSCAPE\n3. SUGGESTED CLAIMS LANGUAGE\n4. USPTO CLASSIFICATION CODES\n5. BLUE OCEAN GAPS (unprotected opportunities)\n6. FREEDOM TO OPERATE RISKS\n7. RECOMMENDED FILING STRATEGY`;
    const text = await callAi(GENIUS_SYSTEM, prompt, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 4. Legal advisor
mcp.tool("legal_advice", {
  description: "Legal research and pro se guidance including CLE, Colorado Supreme Court procedures, IP law, copyright, and trademark.",
  inputSchema: {
    type: "object" as const,
    properties: {
      question: { type: "string" },
      area: { type: "string", description: "ip | copyright | trademark | pro_se | cle | general" },
      jurisdiction: { type: "string", description: "Default: Colorado" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["question"],
  },
  handler: async (args: any) => {
    const text = await callAi(GENIUS_SYSTEM, `Legal research request:\nArea: ${args.area || "general"}\nJurisdiction: ${args.jurisdiction || "Colorado"}\n\n${args.question}\n\nProvide: citations, procedural steps, deadlines, and strategic recommendations.`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 5. Code architect
mcp.tool("code_architect", {
  description: "Generate production-ready code, architecture, and cutting-edge tech recommendations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      task: { type: "string", description: "What to build" },
      stack: { type: "string", description: "Tech stack preferences" },
      constraints: { type: "string" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["task"],
  },
  handler: async (args: any) => {
    const text = await callAi(GENIUS_SYSTEM, `Code Architecture Request:\n\nTASK: ${args.task}\nSTACK: ${args.stack || "React/TypeScript/Supabase"}\nCONSTRAINTS: ${args.constraints || "Production-ready"}\n\nProvide:\n1. Architecture diagram (text)\n2. File structure\n3. Key code implementations\n4. Cutting-edge tech suggestions\n5. Security considerations\n6. Deployment strategy`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 6. Marketing video script
mcp.tool("video_script", {
  description: "Generate marketing video scripts with Picasso's creative vision and Mozart's compositional timing.",
  inputSchema: {
    type: "object" as const,
    properties: {
      product: { type: "string" },
      platform: { type: "string", description: "tiktok | youtube | instagram_reels" },
      duration_seconds: { type: "number" },
      style: { type: "string", description: "professional | viral | educational | storytelling" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["product"],
  },
  handler: async (args: any) => {
    const text = await callAi(GENIUS_SYSTEM, `Create a ${args.duration_seconds || 30}-second ${args.platform || "social media"} video script for "${args.product}".\nStyle: ${args.style || "professional"}\n\nInclude:\n1. HOOK (first 3 seconds)\n2. SCENE-BY-SCENE BREAKDOWN with visual directions\n3. VOICEOVER SCRIPT\n4. MUSIC/SOUND suggestions\n5. TEXT OVERLAYS\n6. CALL TO ACTION\n7. HASHTAGS`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 7. Blue ocean finder
mcp.tool("blue_ocean", {
  description: "Find untapped market opportunities using blue ocean strategy methodology combined with Tesla's inventive thinking.",
  inputSchema: {
    type: "object" as const,
    properties: {
      industry: { type: "string" },
      current_products: { type: "string" },
      budget: { type: "string" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["industry"],
  },
  handler: async (args: any) => {
    const text = await callAi(GENIUS_SYSTEM, `Blue Ocean Strategy Analysis:\n\nINDUSTRY: ${args.industry}\nCURRENT PRODUCTS: ${args.current_products || "None specified"}\nBUDGET: ${args.budget || "Not specified"}\n\nProvide:\n1. RED OCEAN MAP (current competition)\n2. BLUE OCEAN OPPORTUNITIES (3-5 untapped spaces)\n3. VALUE INNOVATION CANVAS\n4. FOUR ACTIONS FRAMEWORK (Eliminate/Reduce/Raise/Create)\n5. FIRST-MOVER ADVANTAGE ANALYSIS\n6. IMPLEMENTATION ROADMAP\n7. RISK ASSESSMENT`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

// 8. TimeMachineGeno collab
mcp.tool("timemachine_collab", {
  description: "Collaborative brainstorming channeling historical geniuses. Ask any genius a question or have them collaborate on a problem.",
  inputSchema: {
    type: "object" as const,
    properties: {
      question: { type: "string" },
      geniuses: { type: "string", description: "Comma-separated: tesla, davinci, aristotle, curie, plato, mozart, picasso, beethoven, turing, lovelace" },
      collaboration_type: { type: "string", description: "debate | brainstorm | roundtable | mentor" },
      provider: { type: "string" }, model: { type: "string" },
    },
    required: ["question"],
  },
  handler: async (args: any) => {
    const geniuses = args.geniuses || "tesla,davinci,aristotle";
    const collab = args.collaboration_type || "brainstorm";
    const text = await callAi(GENIUS_SYSTEM, `${collab.toUpperCase()} SESSION\n\nParticipants: ${geniuses}\nTopic: ${args.question}\n\nSimulate a ${collab} where each genius contributes from their unique perspective and methodology. Include:\n1. Each genius's individual contribution\n2. Points of agreement and disagreement\n3. Synthesized conclusion\n4. Actionable next steps\n5. Novel insights from combining perspectives`, args.model, args.provider);
    return { content: [{ type: "text" as const, text }] };
  },
});

const transport = new StreamableHttpTransport();

app.all("/googlieeyes-bot/mcp/*", async (c) => transport.handleRequest(c.req.raw, mcp));
app.all("/googlieeyes-bot/mcp", async (c) => transport.handleRequest(c.req.raw, mcp));
app.all("/mcp/*", async (c) => transport.handleRequest(c.req.raw, mcp));
app.all("/mcp", async (c) => transport.handleRequest(c.req.raw, mcp));

const infoJson = {
  name: "googlieeyes-bot",
  version: "1.0.0",
  description: "GoogliEyes Bot — Elite multi-domain AI agent MCP. Web admin, programmer, inventor, patent creator, legal advisor, CLE trainer, video marketer, scientist, and genius collaborator. Channels Aristotle, Tesla, Da Vinci, Curie, Plato, Mozart, Picasso, Beethoven, Turing, Lovelace.",
  endpoints: { mcp: "/googlieeyes-bot/mcp" },
  tools: ["research", "invent", "patent_analysis", "legal_advice", "code_architect", "video_script", "blue_ocean", "timemachine_collab"],
};

app.get("/googlieeyes-bot", (c) => c.json(infoJson));
app.get("/", (c) => c.json(infoJson));
app.options("*", (c) => new Response(null, { headers: corsHeaders }));

Deno.serve(app.fetch);
