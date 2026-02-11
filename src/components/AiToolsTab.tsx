import { useState } from "react";
import { Sparkles, Loader2, Wand2, Target, TrendingUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AiToolsProps {
  products: { id: string; product_name: string; product_type: string; score: number; description: string | null; target_state: string | null }[];
}

const LOVABLE_MODELS = [
  { id: "default", name: "Gemini 3 Flash (default)" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
];

const OPENROUTER_FREE_MODELS = [
  { id: "openrouter/free", name: "Auto-Free (best available)" },
  { id: "venice/uncensored:free", name: "Venice Uncensored 24B" },
  { id: "arcee-ai/trinity-large-preview:free", name: "Arcee Trinity 400B" },
  { id: "openai/gpt-oss-120b:free", name: "GPT-OSS 120B" },
  { id: "tngtech/deepseek-r1t2-chimera:free", name: "DeepSeek R1T2 Chimera" },
  { id: "z-ai/glm-4.5-air:free", name: "Z.ai GLM 4.5 Air" },
];

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketing-ai`;

export default function AiToolsTab({ products }: AiToolsProps) {
  const { toast } = useToast();
  const [provider, setProvider] = useState<"lovable" | "openrouter">("lovable");
  const [model, setModel] = useState("default");
  const [action, setAction] = useState<"generate_caption" | "score_product" | "trend_analysis">("generate_caption");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // Caption form
  const [captionProduct, setCaptionProduct] = useState("");
  const [captionPlatform, setCaptionPlatform] = useState("instagram");
  const [captionTone, setCaptionTone] = useState("professional");

  // Score form
  const [scoreProduct, setScoreProduct] = useState("");

  const models = provider === "lovable" ? LOVABLE_MODELS : OPENROUTER_FREE_MODELS;

  async function runAi() {
    setLoading(true);
    setResult("");
    try {
      let body: any = { action, provider, model: model === "default" ? undefined : model };

      if (action === "generate_caption") {
        const prod = products.find(p => p.id === captionProduct);
        if (!prod) { toast({ title: "Select a product", variant: "destructive" }); setLoading(false); return; }
        body = { ...body, product_name: prod.product_name, product_description: prod.description, platform: captionPlatform, tone: captionTone };
      } else if (action === "score_product") {
        const prod = products.find(p => p.id === scoreProduct);
        if (!prod) { toast({ title: "Select a product", variant: "destructive" }); setLoading(false); return; }
        body = { ...body, product_name: prod.product_name, product_type: prod.product_type, product_description: prod.description, target_state: prod.target_state };
      } else {
        body = { ...body, products: products.slice(0, 20).map(p => ({ name: p.product_name, type: p.product_type, score: p.score })) };
      }

      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data.result || "No result returned");
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
      setResult(`Error: ${e.message}`);
    }
    setLoading(false);
  }

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Provider & Model Selector */}
      <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-medium">AI Tools</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">MCP-compatible</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Powered by Lovable AI (Gemini, GPT-5) + OpenRouter free & uncensored models. All tools also available via the <code className="bg-muted px-1 rounded">marketing-mcp</code> edge function for use in any MCP-compatible app.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Action */}
          <Select value={action} onValueChange={(v: any) => { setAction(v); setResult(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="generate_caption"><div className="flex items-center gap-2"><Wand2 className="h-3.5 w-3.5" /> Generate Caption</div></SelectItem>
              <SelectItem value="score_product"><div className="flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Score Product</div></SelectItem>
              <SelectItem value="trend_analysis"><div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Trend Analysis</div></SelectItem>
            </SelectContent>
          </Select>

          {/* Provider */}
          <Select value={provider} onValueChange={(v: any) => { setProvider(v); setModel(v === "lovable" ? "default" : "openrouter/free"); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="lovable">Lovable AI (built-in)</SelectItem>
              <SelectItem value="openrouter">OpenRouter Free Models</SelectItem>
            </SelectContent>
          </Select>

          {/* Model */}
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action-specific inputs */}
      <div className="p-5 rounded-2xl gradient-card border border-border/50 space-y-3">
        {action === "generate_caption" && (
          <>
            <h4 className="text-sm font-medium">Caption Generator</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={captionProduct} onValueChange={setCaptionProduct}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={captionPlatform} onValueChange={setCaptionPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={captionTone} onValueChange={setCaptionTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="funny">Funny</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {action === "score_product" && (
          <>
            <h4 className="text-sm font-medium">AI Product Scorer</h4>
            <Select value={scoreProduct} onValueChange={setScoreProduct}>
              <SelectTrigger className="max-w-sm"><SelectValue placeholder="Select product to score" /></SelectTrigger>
              <SelectContent>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.product_name} (current: {p.score})</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}

        {action === "trend_analysis" && (
          <>
            <h4 className="text-sm font-medium">Trend Analysis</h4>
            <p className="text-xs text-muted-foreground">Analyzes your top {Math.min(products.length, 20)} products for market trends, picks the best one, and gives strategic advice.</p>
          </>
        )}

        <Button onClick={runAi} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Thinking…" : "Run AI"}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="p-5 rounded-2xl gradient-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Result
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {provider === "lovable" ? "Lovable AI" : "OpenRouter"} · {model === "default" ? "gemini-3-flash" : model.split("/").pop()}
              </span>
            </h4>
            <Button size="sm" variant="ghost" onClick={copyResult} className="gap-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="bg-muted/30 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}

      {/* FOSS / Open Source References */}
      <div className="p-4 rounded-xl bg-secondary/20 border border-secondary/40">
        <h4 className="text-sm font-medium text-secondary-foreground mb-2">Open Source & FOSS Stack</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>🔧 <strong>MCP Server:</strong> <code>marketing-mcp</code> edge function — reusable via MCP protocol in any compatible app (Cursor, Claude, etc.)</p>
          <p>📦 <strong>Social Scheduling:</strong> <a href="https://github.com/gitroomhq/postiz-app" target="_blank" rel="noopener" className="text-primary underline">Postiz</a> (AGPL-3.0) — self-hosted social scheduler with API for n8n/Zapier integration</p>
          <p>📦 <strong>Alt Schedulers:</strong> <a href="https://github.com/inovector/mixpost" target="_blank" rel="noopener" className="text-primary underline">Mixpost</a>, <a href="https://github.com/nickatnight/opensmm" target="_blank" rel="noopener" className="text-primary underline">OpenSMM</a>, <a href="https://github.com/nickatnight/socioboard" target="_blank" rel="noopener" className="text-primary underline">Socioboard</a></p>
          <p>🤖 <strong>Free AI:</strong> Lovable AI (Gemini 3, GPT-5) + OpenRouter free tier (Venice Uncensored, Trinity 400B, DeepSeek R1T2, GPT-OSS 120B)</p>
          <p>🔗 <strong>Protocol:</strong> Built on <a href="https://github.com/fiberplane/mcp-lite" target="_blank" rel="noopener" className="text-primary underline">mcp-lite</a> (MIT) for Model Context Protocol compatibility</p>
        </div>
      </div>
    </div>
  );
}
