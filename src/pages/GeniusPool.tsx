import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, DollarSign, Rocket, Copy, CheckCheck, ExternalLink, Loader2, ShoppingCart, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function GeniusPool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleLaunch = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to launch campaigns.", variant: "destructive" });
      return;
    }
    if (!selectedBudget || !productName) {
      toast({ title: "Missing info", description: "Select a budget and enter a product name.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setCampaign(null);

    try {
      const { data, error } = await supabase.functions.invoke("genius-pool", {
        body: {
          budget: selectedBudget,
          product_name: productName,
          product_description: productDesc,
          product_url: productUrl,
          target_audience: audience,
        },
      });

      if (error) throw error;
      setCampaign(data);
      toast({ title: "Campaign generated!", description: `$${selectedBudget} campaign ready for ${productName}` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copyText(text, id)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0">
      {copied === id ? <CheckCheck className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">GeniusPool</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Select your budget → auto-generate campaigns across all social media with your affiliate link ({AFFILIATE_TAG}).
        </p>

        {/* Budget Tier Selection */}
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Select Campaign Budget
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUDGET_TIERS.map((tier) => (
              <button
                key={tier.amount}
                onClick={() => setSelectedBudget(tier.amount)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedBudget === tier.amount
                    ? "border-primary bg-primary/10 shadow-lg"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="font-display text-xl font-bold">{tier.label}</span>
                <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-3 mb-6">
          <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product name (e.g. Moisture Recovery Shampoo)" />
          <Input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="Amazon product URL (optional — auto-generates affiliate link)" />
          <Input value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Brief description (optional)" />
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target audience (optional, default: women 25-55)" />
        </div>

        {/* Launch Button */}
        <Button
          onClick={handleLaunch}
          disabled={loading || !selectedBudget || !productName}
          className="w-full h-12 text-lg font-semibold gap-2"
          size="lg"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Generating Campaign...</>
          ) : (
            <><Rocket className="h-5 w-5" /> Launch ${selectedBudget || "—"} Campaign</>
          )}
        </Button>

        {/* Generated Campaign */}
        <AnimatePresence mode="wait">
          {campaign && !campaign.parse_error && (
            <motion.div
              key="campaign"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* Affiliate Link */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Your Affiliate Link</p>
                    <p className="text-sm font-mono break-all">{campaign.affiliate_link}</p>
                  </div>
                  <div className="flex gap-1">
                    <CopyBtn text={campaign.affiliate_link} id="aff-link" />
                    <a href={campaign.affiliate_link} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-muted text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Platform Campaigns */}
              {campaign.platforms && Object.entries(campaign.platforms).map(([platform, data]: [string, any]) => (
                <div key={platform} className="p-5 rounded-2xl border border-border/50 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg font-semibold">{platform}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">${data.budget || "—"}</span>
                  </div>
                  {data.caption && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Caption</p>
                      <div className="flex gap-2 items-start p-3 rounded-lg bg-muted/30">
                        <p className="text-sm flex-1">{data.caption}</p>
                        <CopyBtn text={data.caption} id={`cap-${platform}`} />
                      </div>
                    </div>
                  )}
                  {data.hashtags && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Hashtags</p>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(data.hashtags) ? data.hashtags : []).map((h: string, i: number) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{h}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {data.best_time && <p className="text-xs text-muted-foreground">⏰ Best time: {data.best_time}</p>}
                  {data.video_script && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Video Script</p>
                      <div className="flex gap-2 items-start p-3 rounded-lg bg-muted/30">
                        <p className="text-xs flex-1 text-muted-foreground">{data.video_script}</p>
                        <CopyBtn text={data.video_script} id={`vid-${platform}`} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* SEO Keywords */}
              {campaign.seo_keywords && (
                <div className="p-5 rounded-2xl border border-border/50 bg-card">
                  <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> SEO & Trending Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {campaign.seo_keywords.map((kw: string, i: number) => (
                      <span key={i} className="text-sm bg-muted px-3 py-1 rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blue Ocean Niches */}
              {campaign.blue_ocean_niches && (
                <div className="p-5 rounded-2xl border border-border/50 bg-card">
                  <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Blue Ocean Niches
                  </h3>
                  <ul className="space-y-2">
                    {campaign.blue_ocean_niches.map((niche: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">▸</span> {niche}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Amazon Titles */}
              {campaign.amazon_titles && (
                <div className="p-5 rounded-2xl border border-border/50 bg-card">
                  <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" /> Amazon-Optimized Titles
                  </h3>
                  {campaign.amazon_titles.map((title: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start p-2 rounded-lg hover:bg-muted/30">
                      <p className="text-sm flex-1">{title}</p>
                      <CopyBtn text={title} id={`amz-${i}`} />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Raw response fallback */}
          {campaign?.parse_error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 p-5 rounded-2xl border border-border/50 bg-card">
              <h3 className="font-display text-lg font-semibold mb-3">Generated Campaign (Raw)</h3>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96">{campaign.raw_response}</pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
