import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, AlertTriangle, CheckCircle2, MinusCircle, Info, Volume2, Save, Loader2 } from "lucide-react";
import { analyzeIngredients, type AnalysisResult } from "@/lib/ingredients";
import ScoreRing from "@/components/ScoreRing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE =
  "Water, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Panthenol, Dimethicone, Fragrance, Citric Acid, Sodium Chloride, Methylparaben";

export default function Analyzer() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!input.trim()) return;
    setResult(analyzeIngredients(input));
  };

  const handleReadAloud = async () => {
    if (!result || playing) return;
    setPlaying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: result.summary }),
        }
      );
      if (!response.ok) throw new Error("TTS failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      await audio.play();
    } catch {
      toast({ variant: "destructive", title: "Voice error", description: "Could not read aloud." });
      setPlaying(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    const { error } = await supabase.from("saved_analyses").insert([{
      user_id: user.id,
      analysis_name: input.split(",")[0]?.trim().slice(0, 50) || "Analysis",
      analysis_data: JSON.parse(JSON.stringify(result)),
    }]);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Save failed", description: error.message });
    } else {
      toast({ title: "Saved!", description: "Analysis saved to your history." });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-semibold">INCI Analyzer</h1>
        </div>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Paste an ingredient list (INCI) from any shampoo or conditioner. We'll score it using the
          <strong className="text-foreground"> First 5 Rule</strong> — the first 5 ingredients make up 80–90% of the formula.
        </p>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste ingredient list here, separated by commas..."
            rows={5}
            className="w-full rounded-xl border border-border bg-card p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-body text-sm"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-shadow"
            >
              Analyze
            </button>
            <button
              onClick={() => { setInput(EXAMPLE); setResult(null); }}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Try Example
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-10 space-y-8"
            >
              {/* Score + Summary */}
              <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl gradient-card border border-border/50">
                <ScoreRing score={result.score} maxScore={result.maxScore} />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="font-display text-2xl font-medium mb-2">Analysis Complete</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">{result.summary}</p>
                  {result.hairNeeds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {result.hairNeeds.map((need) => (
                        <span key={need} className="px-3 py-1 rounded-full text-xs border border-primary/30 bg-primary/5 text-primary">
                          {need}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleReadAloud}
                      disabled={playing}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {playing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                      {playing ? "Playing..." : "Read Aloud"}
                    </button>
                    {user && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-xs text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* First 5 callout */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-secondary/40 flex gap-3">
                <Info className="h-5 w-5 text-secondary-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-secondary-foreground">The First 5 Rule</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingredients are listed by concentration. The first 5 typically comprise 80–90% of the product.
                    Beneficial ingredients here = real results. Harmful ones here = real concern.
                  </p>
                </div>
              </div>

              {/* Ingredient list */}
              <div className="space-y-2">
                <h3 className="font-display text-xl font-medium mb-4">Ingredient Breakdown</h3>
                {result.ingredients.map((ing, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      ing.category === "disqualifier"
                        ? "border-destructive/30 bg-destructive/5"
                        : ing.category === "reward"
                        ? "border-mint/30 bg-mint/5"
                        : "border-border/50 bg-card/50"
                    }`}
                  >
                    {ing.category === "disqualifier" ? (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                    ) : ing.category === "reward" ? (
                      <CheckCircle2 className="h-4 w-4 text-mint shrink-0 mt-1" />
                    ) : (
                      <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted-foreground">#{ing.position}</span>
                        <span className="font-medium text-sm capitalize">{ing.name}</span>
                        {ing.position <= 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Top 5</span>
                        )}
                        {ing.points !== 0 && (
                          <span className={`text-xs font-medium ${ing.points > 0 ? "text-mint" : "text-destructive"}`}>
                            {ing.points > 0 ? "+" : ""}{ing.points.toFixed(1)} pts
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ing.note}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
