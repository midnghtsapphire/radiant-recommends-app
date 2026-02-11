import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Download, RefreshCw, Palette, Type,
  Eye, Zap, Crown, ChevronDown, Star, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STYLE_PRESETS = [
  { id: "modern", label: "Modern & Clean", icon: "✨", desc: "Minimalist, geometric, contemporary" },
  { id: "glassy-3d", label: "Glassy 3D", icon: "💎", desc: "Glassmorphism, depth, reflections" },
  { id: "anime-genz", label: "Anime GenZ", icon: "🎌", desc: "Bold, vibrant, anime-inspired" },
  { id: "luxury", label: "Luxury Premium", icon: "👑", desc: "Gold, serif, elegant, high-end" },
  { id: "retro-futuristic", label: "Retro-Futuristic", icon: "🚀", desc: "Neon, synthwave, cyberpunk" },
  { id: "organic", label: "Organic & Natural", icon: "🌿", desc: "Earth tones, flowing, botanical" },
  { id: "brutalist", label: "Brutalist", icon: "🏗️", desc: "Raw, bold, unconventional" },
  { id: "poof-magic", label: "Poof Magic ✨", icon: "🧞", desc: "Magical, genie, sparkles, enchanted" },
];

const VIBE_OPTIONS = [
  "Premium & Innovative", "Playful & Energetic", "Trustworthy & Corporate",
  "Bold & Disruptive", "Warm & Friendly", "Mysterious & Luxurious",
  "Tech-Forward & Cutting-Edge", "Obsessed-Love-It Addictive",
];

export default function LogoGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tagline, setTagline] = useState("");
  const [colors, setColors] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [selectedVibe, setSelectedVibe] = useState("Premium & Innovative");
  const [quality, setQuality] = useState<"standard" | "pro">("standard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [variationLoading, setVariationLoading] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!brandName.trim()) { toast({ title: "Enter a brand name", variant: "destructive" }); return; }

    setLoading(true);
    setResult(null);

    try {
      const stylePre = STYLE_PRESETS.find((s) => s.id === selectedStyle);
      const { data, error } = await supabase.functions.invoke("logo-generator", {
        body: {
          action: "generate",
          brand_name: brandName,
          industry: industry || undefined,
          style: `${stylePre?.label} — ${stylePre?.desc}`,
          colors: colors || undefined,
          tagline: tagline || undefined,
          vibe: selectedVibe,
          quality,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      toast({ title: `${data.generated} logos generated!`, description: `${data.total_concepts} concepts researched by OpenRouter` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVariation = async (logoIndex: number) => {
    if (!result?.logos?.[logoIndex]?.image) return;
    setVariationLoading(logoIndex);
    try {
      const { data, error } = await supabase.functions.invoke("logo-generator", {
        body: {
          action: "variations",
          brand_name: brandName,
          existing_logo_base64: result.logos[logoIndex].image,
          variation_prompt: `Create a refined variation of this logo for "${brandName}". Keep the core identity but make it more polished, crisp, and modern. Professional vector-style, clean background.`,
          quality,
        },
      });
      if (error) throw error;
      if (data?.variation?.image) {
        setResult((prev: any) => ({
          ...prev,
          logos: [...prev.logos, {
            concept_name: `${prev.logos[logoIndex].concept_name} — Variation`,
            type: "variation",
            description: "AI-refined variation",
            image: data.variation.image,
          }],
        }));
        toast({ title: "Variation generated!" });
      }
    } catch (e: any) {
      toast({ title: "Variation failed", description: e.message, variant: "destructive" });
    } finally {
      setVariationLoading(null);
    }
  };

  const downloadLogo = (base64: string, name: string) => {
    const link = document.createElement("a");
    link.href = base64;
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-logo.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">UpLogo — AI Logo Studio</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
            Logo <span className="text-primary">Generator</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            OpenRouter researches your brand &amp; competitors, then Gemini generates production-ready logos.
            3 unique concepts per generation.
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6 mb-8 space-y-6"
        >
          {/* Brand Name + Industry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Brand Name *</label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. AgelessGeno, PoofAgents, UpBELL"
                className="bg-muted/50 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Industry</label>
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Hair Care SaaS, School Safety Tech, FinTech"
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          {/* Tagline + Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tagline</label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Genius at your fingertips"
                className="bg-muted/50 border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Color Preferences</label>
              <Input
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="e.g. gold & black, neon pink, auto-suggest"
                className="bg-muted/50 border-border"
              />
            </div>
          </div>

          {/* Style Presets */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-primary" /> Style Direction
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStyle(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedStyle === s.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-muted/30 hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-1.5">
              <Star className="h-4 w-4 text-accent" /> Brand Vibe
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVibe(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedVibe === v
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Quality + Generate */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setQuality("standard")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  quality === "standard" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Zap className="h-3 w-3 inline mr-1" />Standard
              </button>
              <button
                onClick={() => setQuality("pro")}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  quality === "pro" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Crown className="h-3 w-3 inline mr-1" />Pro Quality
              </button>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !brandName.trim()}
              className="flex-1 h-12 text-base font-semibold bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Researching &amp; Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Logos
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 text-center"
            >
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Creating Your Logos</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>🔍 Step 1: OpenRouter researching competitors &amp; brand strategy...</p>
                <p>🎨 Step 2: Generating color palettes &amp; typography...</p>
                <p>🖼️ Step 3: Gemini creating logo images...</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">This takes 15-30 seconds</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Research Summary */}
              {result.research && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" /> Brand Research
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.research.brand_analysis && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Personality</p>
                        <div className="flex flex-wrap gap-1">
                          {result.research.brand_analysis.personality_keywords?.map((k: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{k}</span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{result.research.brand_analysis.emotional_response}</p>
                      </div>
                    )}
                    {result.research.color_palette && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Color Palette</p>
                        <div className="flex gap-2 mb-2">
                          {["primary", "secondary", "accent"].map((key) => (
                            result.research.color_palette[key] && (
                              <div key={key} className="text-center">
                                <div
                                  className="w-10 h-10 rounded-lg border border-border shadow-sm"
                                  style={{ backgroundColor: result.research.color_palette[key] }}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">{result.research.color_palette[key]}</p>
                              </div>
                            )
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{result.research.color_palette.reasoning}</p>
                      </div>
                    )}
                    {result.research.competitor_analysis && (
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Competitor Insights</p>
                        <p className="text-xs text-foreground/80">{result.research.competitor_analysis.slice(0, 200)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Generated Logos */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> Generated Logos ({result.logos?.length || 0})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.logos?.map((logo: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                      className="bg-muted/20 border border-border rounded-xl overflow-hidden group"
                    >
                      {logo.image ? (
                        <div className="aspect-square bg-white flex items-center justify-center p-4 relative">
                          <img
                            src={logo.image}
                            alt={logo.concept_name}
                            className="max-w-full max-h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadLogo(logo.image, `${brandName}-${logo.concept_name}`)}
                            >
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleVariation(i)}
                              disabled={variationLoading === i}
                            >
                              {variationLoading === i ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <><RefreshCw className="h-4 w-4 mr-1" /> Variation</>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-muted/30 flex items-center justify-center">
                          <p className="text-sm text-muted-foreground text-center px-4">
                            {logo.error || "Image generation failed"}
                          </p>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium text-foreground">{logo.concept_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{logo.type}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{logo.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
