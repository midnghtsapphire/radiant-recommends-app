import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, DollarSign, Rocket, Copy, CheckCheck, ExternalLink, Loader2,
  ShoppingCart, TrendingUp, Sparkles, Wrench, Code, Search, Megaphone, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BUDGET_TIERS = [
  { amount: 20, label: "$20", desc: "Starter • 2-3 platforms" },
  { amount: 40, label: "$40", desc: "Basic • all platforms" },
  { amount: 50, label: "$50", desc: "Growth • boosted reach" },
  { amount: 100, label: "$100", desc: "Pro • full campaigns" },
  { amount: 200, label: "$200", desc: "Scale • targeted ads" },
  { amount: 500, label: "$500", desc: "Premium • max reach" },
  { amount: 1000, label: "$1000", desc: "Enterprise • dominate" },
];

const AFFILIATE_TAG = "meetaudreyeva-20";

const PRESET_TOOLS = [
  { name: "UpAffiliate", desc: "Auto-generate affiliate links, track conversions, optimize Amazon product listings" },
  { name: "UpSEO", desc: "Deep SEO research, keyword analysis, trending search terms, alt-text generation" },
  { name: "UpSocialMedia", desc: "Auto-post to all platforms, template generation, scheduling, engagement tracking" },
  { name: "UpBlueOcean", desc: "Find untapped market niches, generate million-dollar sub-genre ideas with insights" },
  { name: "UpContent", desc: "Recreate content from free YouTube/music sources, production-ready templates" },
  { name: "UpAgent", desc: "Customer service agent, complaint handling, product Q&A, phone/email automation" },
  { name: "UpCodeReview", desc: "Automated code review MCP, security scanning, best practices enforcement" },
  { name: "UpFAQ", desc: "Auto-generate comprehensive FAQs for any website or product" },
  { name: "UpDataScientist", desc: "Data analysis, trend prediction, market intelligence, performance analytics" },
  { name: "UpPatent", desc: "Patent research, prior art analysis, patent application drafting, IP strategy" },
  { name: "UpChatter", desc: "Social media monitoring, sentiment analysis, trending topics across all platforms" },
  { name: "UpYouTube", desc: "YouTube channel curation, video SEO, content strategy, thumbnail optimization" },
];

export default function GeniusPool() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Campaign state
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Pipeline state
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any>(null);
  const [toolName, setToolName] = useState("");
  const [toolDesc, setToolDesc] = useState("");
  const [toolContext, setToolContext] = useState("");
  const [useOpenRouter, setUseOpenRouter] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyText(text, id)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0">
      {copied === id ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  const handleLaunch = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!selectedBudget || !productName) { toast({ title: "Select budget & product", variant: "destructive" }); return; }
    setLoading(true);
    setCampaign(null);
    try {
      const { data, error } = await supabase.functions.invoke("genius-pool", {
        body: { budget: selectedBudget, product_name: productName, product_description: productDesc, product_url: productUrl, target_audience: audience },
      });
      if (error) throw error;
      setCampaign(data);
      toast({ title: "Campaign generated!", description: `$${selectedBudget} campaign ready` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handlePipeline = async (presetName?: string, presetDesc?: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    const name = presetName || toolName;
    const desc = presetDesc || toolDesc;
    if (!name || !desc) { toast({ title: "Enter tool name & description", variant: "destructive" }); return; }

    setPipelineLoading(true);
    setPipelineResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("genius-pool-pipeline", {
        body: { action: "full_pipeline", tool_name: name, tool_description: desc, product_context: toolContext, use_openrouter: useOpenRouter },
      });
      if (error) throw error;
      setPipelineResult(data);
      toast({ title: `${name} pipeline complete!`, description: "Research → Design → Code → Marketing done" });
    } catch (e: any) { toast({ title: "Pipeline failed", description: e.message, variant: "destructive" }); }
    finally { setPipelineLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">GeniusPool</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Auto-generate campaigns & build free tools — all powered by AI, no paid APIs.
        </p>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns" className="gap-2"><Rocket className="h-4 w-4" /> Campaigns</TabsTrigger>
            <TabsTrigger value="tools" className="gap-2"><Wrench className="h-4 w-4" /> Auto-Create Tools</TabsTrigger>
          </TabsList>

          {/* ─── CAMPAIGNS TAB ─── */}
          <TabsContent value="campaigns" className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Select Campaign Budget
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUDGET_TIERS.map((tier) => (
                  <button key={tier.amount} onClick={() => setSelectedBudget(tier.amount)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedBudget === tier.amount ? "border-primary bg-primary/10 shadow-lg" : "border-border hover:border-primary/50 bg-card"}`}>
                    <span className="font-display text-xl font-bold">{tier.label}</span>
                    <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name" />
              <Input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="Amazon URL (optional — auto-adds affiliate tag)" />
              <Input value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Brief description (optional)" />
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target audience (optional)" />
            </div>
            <Button onClick={handleLaunch} disabled={loading || !selectedBudget || !productName} className="w-full h-12 text-lg font-semibold gap-2" size="lg">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</> : <><Rocket className="h-5 w-5" /> Launch ${selectedBudget || "—"} Campaign</>}
            </Button>

            <AnimatePresence mode="wait">
              {campaign && !campaign.parse_error && (
                <motion.div key="campaign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs text-muted-foreground mb-1">Affiliate Link</p><p className="text-sm font-mono break-all">{campaign.affiliate_link}</p></div>
                      <div className="flex gap-1"><CopyBtn text={campaign.affiliate_link} id="aff" /><a href={campaign.affiliate_link} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" /></a></div>
                    </div>
                  </div>
                  {campaign.platforms && Object.entries(campaign.platforms).map(([p, d]: [string, any]) => (
                    <div key={p} className="p-5 rounded-2xl border border-border/50 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-lg font-semibold">{p}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">${d.budget || "—"}</span>
                      </div>
                      {d.caption && <div className="mb-3"><p className="text-xs text-muted-foreground mb-1">Caption</p><div className="flex gap-2 items-start p-3 rounded-lg bg-muted/30"><p className="text-sm flex-1">{d.caption}</p><CopyBtn text={d.caption} id={`c-${p}`} /></div></div>}
                      {d.hashtags && <div className="flex flex-wrap gap-1 mb-2">{(Array.isArray(d.hashtags) ? d.hashtags : []).map((h: string, i: number) => <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{h}</span>)}</div>}
                      {d.best_time && <p className="text-xs text-muted-foreground">⏰ {d.best_time}</p>}
                      {d.video_script && <div className="mt-3"><p className="text-xs text-muted-foreground mb-1">Video Script</p><div className="flex gap-2 items-start p-3 rounded-lg bg-muted/30"><p className="text-xs flex-1 text-muted-foreground">{d.video_script}</p><CopyBtn text={d.video_script} id={`v-${p}`} /></div></div>}
                    </div>
                  ))}
                  {campaign.seo_keywords && <div className="p-5 rounded-2xl border border-border/50 bg-card"><h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> SEO Keywords</h3><div className="flex flex-wrap gap-2">{campaign.seo_keywords.map((k: string, i: number) => <span key={i} className="text-sm bg-muted px-3 py-1 rounded-full">{k}</span>)}</div></div>}
                  {campaign.blue_ocean_niches && <div className="p-5 rounded-2xl border border-border/50 bg-card"><h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Blue Ocean</h3><ul className="space-y-2">{campaign.blue_ocean_niches.map((n: string, i: number) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary">▸</span>{n}</li>)}</ul></div>}
                  {campaign.amazon_titles && <div className="p-5 rounded-2xl border border-border/50 bg-card"><h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Amazon Titles</h3>{campaign.amazon_titles.map((t: string, i: number) => <div key={i} className="flex gap-2 items-start p-2 rounded-lg hover:bg-muted/30"><p className="text-sm flex-1">{t}</p><CopyBtn text={t} id={`a-${i}`} /></div>)}</div>}
                </motion.div>
              )}
              {campaign?.parse_error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-5 rounded-2xl border border-border/50 bg-card"><h3 className="font-semibold mb-3">Raw Response</h3><pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">{campaign.raw_response}</pre></motion.div>}
            </AnimatePresence>
          </TabsContent>

          {/* ─── AUTO-CREATE TOOLS TAB ─── */}
          <TabsContent value="tools" className="space-y-6">
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" /> Auto-Create Pipeline
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                AI researches → designs → codes → integrates marketing. No paid APIs. Uses OpenRouter free models + Lovable AI.
              </p>
              <div className="space-y-3 mb-4">
                <Input value={toolName} onChange={(e) => setToolName(e.target.value)} placeholder="Tool name (e.g. UpInventor)" />
                <Input value={toolDesc} onChange={(e) => setToolDesc(e.target.value)} placeholder="What should this tool do?" />
                <Input value={toolContext} onChange={(e) => setToolContext(e.target.value)} placeholder="Product/business context (optional)" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useOpenRouter} onChange={(e) => setUseOpenRouter(e.target.checked)} className="rounded" />
                  Use OpenRouter free models (recommended for variety)
                </label>
              </div>
              <Button onClick={() => handlePipeline()} disabled={pipelineLoading || !toolName || !toolDesc} className="w-full gap-2">
                {pipelineLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Running Pipeline...</> : <><Wrench className="h-4 w-4" /> Create Tool</>}
              </Button>
            </div>

            {/* Preset Tools */}
            <div>
              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Quick-Launch Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TOOLS.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => { setToolName(tool.name); setToolDesc(tool.desc); }}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 bg-card text-left transition-all hover:shadow-md"
                  >
                    <span className="font-display font-semibold text-primary">{tool.name}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Results */}
            <AnimatePresence mode="wait">
              {pipelineResult && (
                <motion.div key="pipeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <h3 className="font-display text-lg font-semibold">{pipelineResult.tool_name}</h3>
                    <p className="text-sm text-muted-foreground">{pipelineResult.tool_description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Steps: {pipelineResult.pipeline_steps}</span>
                      <span>Status: {pipelineResult.status}</span>
                      <span>{new Date(pipelineResult.generated_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {pipelineResult.steps?.map((step: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <button
                        onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {step.step === "research" && <Search className="h-5 w-5 text-primary" />}
                          {step.step === "design" && <Code className="h-5 w-5 text-primary" />}
                          {step.step === "code" && <Wrench className="h-5 w-5 text-primary" />}
                          {step.step === "marketing_integration" && <Megaphone className="h-5 w-5 text-primary" />}
                          <div>
                            <span className="font-semibold capitalize">{step.step.replace("_", " ")}</span>
                            <span className="text-xs text-muted-foreground ml-2">via {step.model}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CopyBtn text={step.result} id={`step-${i}`} />
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedStep === i ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {expandedStep === i && (
                        <div className="p-4 pt-0 border-t border-border/50">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-[500px] p-3 rounded-lg bg-muted/30">
                            {step.result}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
