import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, DollarSign, Rocket, Copy, CheckCheck, ExternalLink, Loader2,
  ShoppingCart, TrendingUp, Sparkles, Wrench, Code, Search, Megaphone,
  ChevronDown, Link2, BarChart3, Target, Clock, Eye, MousePointerClick
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BUDGET_TIERS = [
  { amount: 0, label: "FREE", desc: "Organic only • no ads" },
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

const HAIR_CATEGORIES = [
  "shampoo", "conditioner", "hair serum", "hair oil", "hair mask",
  "leave-in conditioner", "heat protectant", "curl cream", "hair growth",
  "scalp treatment", "anti-aging hair care", "hair vitamins", "biotin",
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

  // Affiliate state
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateResults, setAffiliateResults] = useState<any>(null);
  const [affiliateCategory, setAffiliateCategory] = useState("hair care");
  const [affiliateCount, setAffiliateCount] = useState("10");
  const [affiliateStats, setAffiliateStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [targetRevenue, setTargetRevenue] = useState("1000");

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
    if (selectedBudget === null || !productName) { toast({ title: "Select budget & product", variant: "destructive" }); return; }
    setLoading(true);
    setCampaign(null);
    try {
      const { data, error } = await supabase.functions.invoke("genius-pool", {
        body: { budget: selectedBudget, product_name: productName, product_description: productDesc, product_url: productUrl, target_audience: audience },
      });
      if (error) throw error;

      // Save campaign to tracking
      await supabase.from("campaign_tracking").insert({
        user_id: user.id,
        campaign_name: `${productName} - $${selectedBudget}`,
        product_name: productName,
        budget_cents: selectedBudget * 100,
        is_free: selectedBudget === 0,
        affiliate_tag: AFFILIATE_TAG,
        platforms: data?.platforms ? Object.keys(data.platforms) : [],
        status: "generated",
      });

      setCampaign(data);
      toast({ title: "Campaign generated!", description: `${selectedBudget === 0 ? "Free" : `$${selectedBudget}`} campaign ready` });
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
      toast({ title: `${name} pipeline complete!` });
    } catch (e: any) { toast({ title: "Pipeline failed", description: e.message, variant: "destructive" }); }
    finally { setPipelineLoading(false); }
  };

  const handleGenerateAffiliateLinks = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setAffiliateLoading(true);
    setAffiliateResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("auto-affiliate-links", {
        body: { action: "generate", category: affiliateCategory, count: parseInt(affiliateCount) },
      });
      if (error) throw error;
      setAffiliateResults(data);
      toast({ title: `${data.generated} affiliate links created!` });
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setAffiliateLoading(false); }
  };

  const handleLoadStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-affiliate-links", {
        body: { action: "stats", target_monthly_revenue: parseInt(targetRevenue) },
      });
      if (error) throw error;
      setAffiliateStats(data);
    } catch (e: any) { toast({ title: "Stats failed", description: e.message, variant: "destructive" }); }
    finally { setStatsLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">GeniusPool</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Free & paid campaigns, auto affiliate links, and AI tool creation — all in one hub.
        </p>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns" className="gap-1 text-xs sm:text-sm"><Rocket className="h-4 w-4" /> Campaigns</TabsTrigger>
            <TabsTrigger value="affiliate" className="gap-1 text-xs sm:text-sm"><Link2 className="h-4 w-4" /> AutoAffiliate</TabsTrigger>
            <TabsTrigger value="tools" className="gap-1 text-xs sm:text-sm"><Wrench className="h-4 w-4" /> Create Tools</TabsTrigger>
          </TabsList>

          {/* ─── CAMPAIGNS TAB ─── */}
          <TabsContent value="campaigns" className="space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Select Budget (FREE available!)
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUDGET_TIERS.map((tier) => (
                  <button key={tier.amount} onClick={() => setSelectedBudget(tier.amount)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedBudget === tier.amount ? "border-primary bg-primary/10 shadow-lg"
                      : tier.amount === 0 ? "border-accent bg-accent/10 hover:border-primary/50"
                      : "border-border hover:border-primary/50 bg-card"
                    }`}>
                    <span className={`font-display text-xl font-bold ${tier.amount === 0 ? "text-accent-foreground" : ""}`}>{tier.label}</span>
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
            <Button onClick={handleLaunch} disabled={loading || selectedBudget === null || !productName} className="w-full h-12 text-lg font-semibold gap-2" size="lg">
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Generating...</>
                : <><Rocket className="h-5 w-5" /> {selectedBudget === 0 ? "Launch FREE Campaign" : `Launch $${selectedBudget} Campaign`}</>}
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
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">${d.budget || "0"}</span>
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
              {campaign?.parse_error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-5 rounded-2xl border border-border/50 bg-card"><pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">{campaign.raw_response}</pre></motion.div>}
            </AnimatePresence>
          </TabsContent>

          {/* ─── AUTO AFFILIATE TAB ─── */}
          <TabsContent value="affiliate" className="space-y-6">
            {/* Stats Dashboard */}
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Performance Dashboard
                </h2>
                <div className="flex items-center gap-2">
                  <Input value={targetRevenue} onChange={(e) => setTargetRevenue(e.target.value)} placeholder="Target $/mo" className="w-28 h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleLoadStats} disabled={statsLoading}>
                    {statsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Load Stats"}
                  </Button>
                </div>
              </div>

              {affiliateStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon={Link2} label="Total Links" value={affiliateStats.total_links} />
                  <StatCard icon={Eye} label="Views" value={affiliateStats.total_clicks} />
                  <StatCard icon={MousePointerClick} label="Conversions" value={affiliateStats.total_conversions} />
                  <StatCard icon={DollarSign} label="Revenue" value={`$${affiliateStats.total_revenue_dollars}`} />
                  <StatCard icon={Target} label="Conversion Rate" value={`${affiliateStats.avg_conversion_rate}%`} />
                  <StatCard icon={Rocket} label="Campaigns" value={`${affiliateStats.free_campaigns}F / ${affiliateStats.paid_campaigns}P`} />
                  <StatCard icon={Clock} label="Days to Target" value={affiliateStats.projected_days_to_target} />
                  <StatCard icon={TrendingUp} label="Probability" value={`${affiliateStats.probability_of_target}%`} />
                </div>
              )}
            </div>

            {/* Generate Links */}
            <div className="p-5 rounded-2xl border border-border/50 bg-card">
              <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" /> AutoAffiliateLinks
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                AI finds top-ranking hair products on Amazon → auto-generates your affiliate links ({AFFILIATE_TAG}) → saves & tracks.
              </p>
              <div className="flex gap-3 mb-4 flex-wrap">
                <select
                  value={affiliateCategory}
                  onChange={(e) => setAffiliateCategory(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  {HAIR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input value={affiliateCount} onChange={(e) => setAffiliateCount(e.target.value)} placeholder="Count" className="w-20" type="number" min="1" max="20" />
                <Button onClick={handleGenerateAffiliateLinks} disabled={affiliateLoading} className="gap-2">
                  {affiliateLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Links</>}
                </Button>
              </div>
            </div>

            {/* Generated Links */}
            <AnimatePresence mode="wait">
              {affiliateResults && (
                <motion.div key="affiliate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <h3 className="font-display font-semibold">{affiliateResults.generated} Links Generated</h3>
                  {affiliateResults.products?.map((p: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl border border-border/50 bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{p.product_name}</h4>
                          <p className="text-xs text-muted-foreground">{p.product_category} • ~${p.estimated_price} • {p.estimated_commission_pct}% commission</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.ranking_score >= 80 ? "bg-primary/20 text-primary" :
                            p.ranking_score >= 50 ? "bg-accent/20 text-accent-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>Score: {p.ranking_score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{p.why_recommended}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">🔍 ~{p.monthly_search_volume_estimate}/mo</span>
                        <span className="text-muted-foreground">Competition: {p.competition_level}</span>
                      </div>
                      {p.affiliate_url && (
                        <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                          <p className="text-xs font-mono flex-1 truncate">{p.affiliate_url}</p>
                          <CopyBtn text={p.affiliate_url} id={`afl-${i}`} />
                          <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" /></a>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ─── AUTO-CREATE TOOLS TAB ─── */}
          <TabsContent value="tools" className="space-y-6">
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" /> Auto-Create Pipeline
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                AI researches → designs → codes → integrates marketing. No paid APIs.
              </p>
              <div className="space-y-3 mb-4">
                <Input value={toolName} onChange={(e) => setToolName(e.target.value)} placeholder="Tool name (e.g. UpInventor)" />
                <Input value={toolDesc} onChange={(e) => setToolDesc(e.target.value)} placeholder="What should this tool do?" />
                <Input value={toolContext} onChange={(e) => setToolContext(e.target.value)} placeholder="Product/business context (optional)" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useOpenRouter} onChange={(e) => setUseOpenRouter(e.target.checked)} className="rounded" />
                  Use OpenRouter free models (recommended)
                </label>
              </div>
              <Button onClick={() => handlePipeline()} disabled={pipelineLoading || !toolName || !toolDesc} className="w-full gap-2">
                {pipelineLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Running Pipeline...</> : <><Wrench className="h-4 w-4" /> Create Tool</>}
              </Button>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Quick-Launch Presets
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_TOOLS.map((tool) => (
                  <button key={tool.name} onClick={() => { setToolName(tool.name); setToolDesc(tool.desc); }}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 bg-card text-left transition-all hover:shadow-md">
                    <span className="font-display font-semibold text-primary">{tool.name}</span>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {pipelineResult && (
                <motion.div key="pipeline" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                    <h3 className="font-display text-lg font-semibold">{pipelineResult.tool_name}</h3>
                    <p className="text-sm text-muted-foreground">{pipelineResult.tool_description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Steps: {pipelineResult.pipeline_steps}</span>
                      <span>Status: {pipelineResult.status}</span>
                    </div>
                  </div>
                  {pipelineResult.steps?.map((step: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <button onClick={() => setExpandedStep(expandedStep === i ? null : i)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors">
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
                          <CopyBtn text={step.result} id={`s-${i}`} />
                          <ChevronDown className={`h-4 w-4 transition-transform ${expandedStep === i ? "rotate-180" : ""}`} />
                        </div>
                      </button>
                      {expandedStep === i && (
                        <div className="p-4 pt-0 border-t border-border/50">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-[500px] p-3 rounded-lg bg-muted/30">{step.result}</pre>
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

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="font-display text-lg font-bold">{value}</span>
    </div>
  );
}
