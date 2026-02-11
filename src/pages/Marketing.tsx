import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Wand2, Copy, CheckCheck } from "lucide-react";

interface GeneratedContent {
  positioning: string;
  seoTitle: string;
  seoDescription: string;
  captions: string[];
  videoIdeas: string[];
}

function generateMarketing(product: string, audience: string): GeneratedContent {
  const p = product || "luxury hair serum";
  const a = audience || "women 25-45";
  return {
    positioning: `${p} — an addictive luxury ritual for ${a}. Position as the "glass hair" secret weapon: science-backed, salon-quality, effortlessly chic. Emphasize transformation from damage to luminous, bouncy strands.`,
    seoTitle: `${p} | Transform Your Hair with AI-Analyzed Ingredients`,
    seoDescription: `Discover why ${p} scored 9/10 on our INCI analysis. Dermatologist-grade formula with glycerin, peptides & ceramides for ${a}. Free shipping.`,
    captions: [
      `✨ Your hair called — it wants the good stuff. Meet ${p}. #GlassHair #HairScience`,
      `POV: You finally read the ingredients before buying 💅 And found ${p}. #CleanBeauty`,
      `Not all shampoos are created equal. Let me break down why ${p} is top-tier 🔬 #INCIAnalysis`,
      `Dry Colorado air 🏔️ + ${p} = the hydration your hair's been begging for. #ColoradoBeauty`,
      `Plot twist: the $12 drugstore pick scored higher than the $50 salon brand. Here's why... #HairTok`,
    ],
    videoIdeas: [
      `"The Ritual" — ASMR-style 60s showing ${p} application with ambient spa music. Cinematic close-ups of texture, lather, shine.`,
      `"Before/After Transformation" — 30s split-screen. Damaged → luminous. Voiceover: "Your hair deserves better chemistry."`,
      `"Ingredient Detective" — TikTok trend-style. Show INCI label, circle bad ingredients, reveal ${p} as the clean alternative.`,
      `"Colorado Survival Guide" — Lifestyle reel: skiing, dry air shots, cut to hair care routine with ${p}. Relatable local content.`,
      `"Blind Test" — Have ${a} compare ${p} vs competitors without labels. Reveal winner with dramatic music.`,
    ],
  };
}

export default function Marketing() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    setContent(generateMarketing(product, audience));
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyText(text, id)}
      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
    >
      {copied === id ? <CheckCheck className="h-3.5 w-3.5 text-mint" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="h-6 w-6 text-blossom" />
          <h1 className="font-display text-3xl font-semibold">Marketing Suite</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Generate luxury positioning, SEO copy, social captions, and video scripts for any hair product.
        </p>

        <div className="space-y-4 mb-6">
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Product name (e.g. Moisture Recovery Shampoo)"
            className="w-full rounded-xl border border-border bg-card p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Target audience (e.g. women 25-45 in Colorado)"
            className="w-full rounded-xl border border-border bg-card p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blossom text-accent-foreground font-medium shadow-blossom hover:opacity-90 transition-opacity"
          >
            <Wand2 className="h-4 w-4" />
            Generate Content
          </button>
        </div>

        <AnimatePresence mode="wait">
          {content && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Positioning */}
              <Section title="Brand Positioning">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm text-muted-foreground leading-relaxed">{content.positioning}</p>
                  <CopyBtn text={content.positioning} id="pos" />
                </div>
              </Section>

              {/* SEO */}
              <Section title="SEO Copy">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Title Tag</p>
                      <p className="text-sm font-medium">{content.seoTitle}</p>
                    </div>
                    <CopyBtn text={content.seoTitle} id="seo-title" />
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Meta Description</p>
                      <p className="text-sm">{content.seoDescription}</p>
                    </div>
                    <CopyBtn text={content.seoDescription} id="seo-desc" />
                  </div>
                </div>
              </Section>

              {/* Captions */}
              <Section title="Social Captions">
                <div className="space-y-2">
                  {content.captions.map((cap, i) => (
                    <div key={i} className="flex justify-between items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <p className="text-sm">{cap}</p>
                      <CopyBtn text={cap} id={`cap-${i}`} />
                    </div>
                  ))}
                </div>
              </Section>

              {/* Video Ideas */}
              <Section title="Video Scripts">
                <div className="space-y-3">
                  {content.videoIdeas.map((idea, i) => (
                    <div key={i} className="flex justify-between items-start gap-2 p-3 rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground leading-relaxed">{idea}</p>
                      <CopyBtn text={idea} id={`vid-${i}`} />
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl gradient-card border border-border/50">
      <h3 className="font-display text-lg font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}
