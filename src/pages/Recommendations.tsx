import { motion } from "framer-motion";
import { ListChecks, ExternalLink, Droplets, Shield, Sparkles, Leaf } from "lucide-react";

interface Product {
  name: string;
  brand: string;
  score: number;
  why: string;
  tags: string[];
  affiliate: string;
}

const products: Product[] = [
  { name: "Moisture Recovery Shampoo", brand: "Joico", score: 9, why: "Glycerin + panthenol in first 3. Sulfate-free.", tags: ["Hydration", "Color-Safe"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Hydrating Conditioner", brand: "Moroccanoil", score: 9, why: "Argan oil + glycerin top 5. Lightweight moisture.", tags: ["Deep Conditioning", "Shine"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Curl Defining Cream", brand: "SheaMoisture", score: 8, why: "Shea butter + coconut oil. Great for curly/coily.", tags: ["Curls", "Definition"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Scalp Revival Charcoal Shampoo", brand: "Briogeo", score: 8, why: "Tea tree + biotin. Clarifying without stripping.", tags: ["Scalp Health", "Clarifying"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Strengthening Amino Masque", brand: "Kérastase", score: 8, why: "Ceramides + silk amino acids in first 5.", tags: ["Repair", "Luxury"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Rosemary Mint Shampoo", brand: "Mielle", score: 7, why: "Rosemary + biotin. Growth-boosting formula.", tags: ["Growth", "Scalp"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Bond Repair Treatment", brand: "Olaplex No.3", score: 9, why: "Patented bond repair. Standalone hero ingredient.", tags: ["Bond Repair", "Damage"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
  { name: "Hydra-Boost Shampoo", brand: "Pureology", score: 8, why: "Hyaluronic acid + green tea. Color-safe moisture.", tags: ["Color-Safe", "Hydration"], affiliate: "https://www.amazon.com/dp/B07XYZEXAMPLE?tag=meetaudreyeva-20" },
];

const iconMap: Record<string, typeof Droplets> = {
  Hydration: Droplets,
  "Deep Conditioning": Droplets,
  "Scalp Health": Shield,
  Clarifying: Shield,
  Repair: Shield,
  "Bond Repair": Shield,
  Growth: Leaf,
  Scalp: Leaf,
  Curls: Sparkles,
  Shine: Sparkles,
  Luxury: Sparkles,
  Definition: Sparkles,
  "Color-Safe": Sparkles,
  Damage: Shield,
};

export default function Recommendations() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <ListChecks className="h-6 w-6 text-mint" />
          <h1 className="font-display text-3xl font-semibold">Smart Picks</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Curated for Colorado's dry climate. Scores based on INCI analysis.
        </p>
        <div className="p-3 rounded-xl bg-secondary/20 border border-secondary/40 text-sm text-muted-foreground mb-8">
          💡 <strong className="text-secondary-foreground">Pro tip:</strong> Mix brands! A great shampoo from one brand pairs well with a conditioner from another — focus on ingredients, not labels.
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="group p-5 rounded-2xl gradient-card border border-border/50 hover:border-primary/30 hover:shadow-warm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{p.brand}</p>
                  <h3 className="font-display text-lg font-medium">{p.name}</h3>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-mint/10 border border-mint/20">
                  <span className="text-sm font-bold text-mint">{p.score}</span>
                  <span className="text-[10px] text-muted-foreground">/10</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{p.why}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.tags.map((tag) => {
                  const Icon = iconMap[tag] || Sparkles;
                  return (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border border-border bg-muted/50 text-muted-foreground">
                      <Icon className="h-3 w-3" />
                      {tag}
                    </span>
                  );
                })}
              </div>
              <a
                href={p.affiliate}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                View on Amazon <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
