import { useState } from "react";
import { Search, Brain, Lightbulb, Scale, Code, Video, Compass, Users, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SEARCH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/genius-search`;
const BOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/googlieeyes-bot`;

const PROVIDERS = [
  { id: "lovable", name: "Lovable AI (Best Paid)" },
  { id: "perplexity", name: "Perplexity (web search)" },
];

const MODELS_BY_PROVIDER: Record<string, { id: string; name: string }[]> = {
  lovable: [
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash (default)" },
    { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "openai/gpt-5", name: "GPT-5" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini" },
    { id: "openai/gpt-5.2", name: "GPT-5.2 (Latest)" },
  ],
  perplexity: [
    { id: "sonar", name: "Sonar (default)" },
  ],
};

const DOMAINS = [
  { id: "general", name: "General Research", icon: Search },
  { id: "patent", name: "Patent Search", icon: Lightbulb },
  { id: "legal", name: "Legal Research", icon: Scale },
  { id: "science", name: "Science & Bio", icon: Brain },
  { id: "code", name: "Code & Tech", icon: Code },
  { id: "marketing", name: "Marketing", icon: Sparkles },
  { id: "invention", name: "Invention", icon: Compass },
];

const BOT_TOOLS = [
  { id: "research", name: "Deep Research", icon: Search, desc: "Multi-domain research with genius methodologies" },
  { id: "invent", name: "Invention Generator", icon: Lightbulb, desc: "Novel invention disclosures (Tesla + Da Vinci)" },
  { id: "patent_analysis", name: "Patent Analysis", icon: Scale, desc: "Patentability, prior art, blue ocean gaps" },
  { id: "legal_advice", name: "Legal Advisor", icon: Scale, desc: "Pro se, CLE, IP law, Colorado procedures" },
  { id: "code_architect", name: "Code Architect", icon: Code, desc: "Production-ready code & architecture" },
  { id: "video_script", name: "Video Script", icon: Video, desc: "Marketing video scripts (Picasso + Mozart)" },
  { id: "blue_ocean", name: "Blue Ocean Finder", icon: Compass, desc: "Untapped market opportunities" },
  { id: "timemachine_collab", name: "Genius Collab", icon: Users, desc: "Historical genius brainstorming session" },
];

export default function GeniusToolsTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("search");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDomain, setSearchDomain] = useState("general");
  const [searchProvider, setSearchProvider] = useState("lovable");
  const [searchModel, setSearchModel] = useState("google/gemini-3-flash-preview");
  const [searchDepth, setSearchDepth] = useState("quick");

  // Bot state
  const [botTool, setBotTool] = useState("research");
  const [botInput, setBotInput] = useState("");
  const [botField, setBotField] = useState("");
  const [botProvider, setBotProvider] = useState("lovable");
  const [botModel, setBotModel] = useState("google/gemini-3-flash-preview");

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function runSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const resp = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          domain: searchDomain,
          provider: searchProvider,
          model: searchModel === "default" ? undefined : searchModel,
          depth: searchDepth,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data.result || "No result");
    } catch (e: any) {
      toast({ title: "Search Error", description: e.message, variant: "destructive" });
      setResult(`Error: ${e.message}`);
    }
    setLoading(false);
  }

  async function runBot() {
    if (!botInput.trim()) return;
    setLoading(true);
    setResult("");
    try {
      // Build MCP tool call body
      const toolArgs: Record<string, any> = { provider: botProvider, model: botModel === "default" ? undefined : botModel };

      switch (botTool) {
        case "research": toolArgs.query = botInput; toolArgs.domain = botField || "general"; break;
        case "invent": toolArgs.problem = botInput; toolArgs.field = botField; break;
        case "patent_analysis": toolArgs.invention = botInput; toolArgs.field = botField; break;
        case "legal_advice": toolArgs.question = botInput; toolArgs.area = botField || "general"; break;
        case "code_architect": toolArgs.task = botInput; toolArgs.stack = botField; break;
        case "video_script": toolArgs.product = botInput; toolArgs.platform = botField || "tiktok"; break;
        case "blue_ocean": toolArgs.industry = botInput; toolArgs.current_products = botField; break;
        case "timemachine_collab": toolArgs.question = botInput; toolArgs.geniuses = botField || "tesla,davinci,aristotle,curie"; break;
      }

      // Call the genius-search as a fallback REST API (not MCP transport, simpler for dashboard)
      const resp = await fetch(SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query: `[${botTool.toUpperCase()}] ${botField ? `Field: ${botField}\n` : ""}${botInput}`,
          domain: botTool === "legal_advice" ? "legal" : botTool === "patent_analysis" ? "patent" : botTool === "code_architect" ? "code" : botTool === "invent" ? "invention" : botTool === "blue_ocean" ? "marketing" : botTool === "video_script" ? "marketing" : "general",
          provider: botProvider,
          model: botModel === "default" ? undefined : botModel,
          depth: "deep",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      const data = await resp.json();
      setResult(data.result || "No result");
    } catch (e: any) {
      toast({ title: "Bot Error", description: e.message, variant: "destructive" });
      setResult(`Error: ${e.message}`);
    }
    setLoading(false);
  }

  const searchModels = MODELS_BY_PROVIDER[searchProvider] || [];
  const botModels = MODELS_BY_PROVIDER[botProvider] || [];

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl gradient-card border border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-medium">GoogliEyes Bot — Genius Tools</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">MCP + API + Token</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Multi-domain AI agent channeling Aristotle, Tesla, Da Vinci, Curie, Plato, Mozart, Picasso, Beethoven. Patent, legal, science, code, marketing, invention tools. Available via MCP at <code className="bg-muted px-1 rounded">googlieeyes-bot</code>.
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="search" className="gap-1.5"><Search className="h-3.5 w-3.5" />Search</TabsTrigger>
          <TabsTrigger value="bot" className="gap-1.5"><Brain className="h-3.5 w-3.5" />Agent Tools</TabsTrigger>
        </TabsList>

        {/* SEARCH TAB */}
        <TabsContent value="search" className="space-y-4 mt-4">
          <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
            <h4 className="text-sm font-medium">Genius Search</h4>
            <Textarea
              placeholder="Ask anything — patents, legal questions, science, code, marketing, inventions…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={searchDomain} onValueChange={setSearchDomain}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINS.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchProvider} onValueChange={(v) => { setSearchProvider(v); setSearchModel(v === "lovable" ? "google/gemini-3-flash-preview" : "sonar"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchModel} onValueChange={setSearchModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {searchModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchDepth} onValueChange={setSearchDepth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick">Quick</SelectItem>
                  <SelectItem value="deep">Deep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runSearch} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching…" : "Search"}
            </Button>
          </div>
        </TabsContent>

        {/* BOT TOOLS TAB */}
        <TabsContent value="bot" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {BOT_TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setBotTool(tool.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  botTool === tool.id ? "border-primary bg-primary/10" : "border-border/50 hover:bg-muted/30"
                }`}
              >
                <tool.icon className={`h-4 w-4 mb-1 ${botTool === tool.id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-xs font-medium">{tool.name}</p>
                <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
              </button>
            ))}
          </div>

          <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
            <h4 className="text-sm font-medium">{BOT_TOOLS.find(t => t.id === botTool)?.name}</h4>
            <Textarea
              placeholder={
                botTool === "invent" ? "Describe the problem to solve…" :
                botTool === "patent_analysis" ? "Describe the invention to analyze…" :
                botTool === "legal_advice" ? "Ask your legal question…" :
                botTool === "code_architect" ? "Describe what to build…" :
                botTool === "video_script" ? "Product name for video…" :
                botTool === "blue_ocean" ? "Industry to analyze…" :
                botTool === "timemachine_collab" ? "Question for the genius panel…" :
                "Enter your research query…"
              }
              value={botInput}
              onChange={e => setBotInput(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder={
                  botTool === "timemachine_collab" ? "Geniuses: tesla,davinci,curie" :
                  botTool === "video_script" ? "Platform: tiktok, youtube, reels" :
                  "Field / context (optional)"
                }
                value={botField}
                onChange={e => setBotField(e.target.value)}
              />
              <Select value={botProvider} onValueChange={(v) => { setBotProvider(v); setBotModel(v === "lovable" ? "google/gemini-3-flash-preview" : "sonar"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">Lovable AI</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                </SelectContent>
              </Select>
              <Select value={botModel} onValueChange={setBotModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {botModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runBot} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {loading ? "Processing…" : `Run ${BOT_TOOLS.find(t => t.id === botTool)?.name}`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Result */}
      {result && (
        <div className="p-5 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Result
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {activeSubTab === "search" ? searchProvider : botProvider}
              </span>
            </h4>
            <Button size="sm" variant="ghost" onClick={copyResult} className="gap-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
