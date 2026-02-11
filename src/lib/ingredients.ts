export interface IngredientResult {
  name: string;
  position: number;
  category: "reward" | "disqualifier" | "neutral";
  points: number;
  note: string;
}

export interface AnalysisResult {
  score: number;
  maxScore: number;
  ingredients: IngredientResult[];
  summary: string;
  hairNeeds: string[];
}

const DISQUALIFIERS: Record<string, string> = {
  "sodium lauryl sulfate": "Harsh surfactant that strips natural oils",
  "sodium laureth sulfate": "Can cause dryness and irritation over time",
  "sls": "Harsh surfactant (sodium lauryl sulfate)",
  "sles": "Can cause dryness (sodium laureth sulfate)",
  "formaldehyde": "Known irritant and potential carcinogen",
  "dmdm hydantoin": "Formaldehyde releaser — may cause scalp sensitivity",
  "parabens": "Endocrine disruptor concerns",
  "methylparaben": "Paraben preservative — may accumulate",
  "propylparaben": "Paraben preservative — endocrine concerns",
  "mineral oil": "Can create build-up, blocks moisture",
  "petrolatum": "Coating agent — traps dirt, blocks moisture",
  "isopropyl alcohol": "Drying alcohol — strips moisture",
  "diethanolamine": "Potential irritant and environmental concern",
  "triethanolamine": "Can cause scalp irritation",
  "polyethylene glycol": "Can strip natural moisture",
  "dimethicone": "Silicone build-up without sulfate cleansing",
};

const REWARDS: Record<string, string> = {
  "glycerin": "Excellent humectant — draws moisture to hair",
  "aloe barbadensis": "Soothing, hydrating, strengthens strands",
  "aloe vera": "Natural moisturizer and scalp soother",
  "panthenol": "Pro-vitamin B5 — adds shine and elasticity",
  "hydrolyzed keratin": "Repairs and strengthens damaged hair",
  "argan oil": "Rich in vitamin E — deep conditioning",
  "argania spinosa": "Argan oil — nourishing and smoothing",
  "jojoba oil": "Mimics natural sebum — balances scalp",
  "simmondsia chinensis": "Jojoba — lightweight moisture balance",
  "coconut oil": "Deep penetrating moisture",
  "cocos nucifera": "Coconut oil — protein loss prevention",
  "shea butter": "Rich emollient — seals in moisture",
  "butyrospermum parkii": "Shea butter — intense conditioning",
  "biotin": "Supports hair growth and thickness",
  "niacinamide": "Improves scalp circulation and health",
  "hyaluronic acid": "Intense hydration for hair and scalp",
  "castor oil": "Strengthens roots, promotes growth",
  "rosemary extract": "Stimulates growth, reduces shedding",
  "rosmarinus officinalis": "Rosemary — DHT blocker, growth booster",
  "tea tree oil": "Antimicrobial — cleanses scalp naturally",
  "silk amino acids": "Smooths cuticle, adds shine",
  "ceramide": "Restores hair barrier and prevents breakage",
  "peptides": "Building blocks for stronger strands",
};

export function analyzeIngredients(inciList: string): AnalysisResult {
  const raw = inciList
    .split(/[,\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (raw.length === 0) {
    return { score: 0, maxScore: 10, ingredients: [], summary: "No ingredients to analyze.", hairNeeds: [] };
  }

  let totalPoints = 5; // Start at midpoint
  const ingredients: IngredientResult[] = [];
  const needs = new Set<string>();

  raw.forEach((name, i) => {
    const position = i + 1;
    const isFirst5 = position <= 5;
    const multiplier = isFirst5 ? 1.5 : 1;

    // Check disqualifiers
    const disqKey = Object.keys(DISQUALIFIERS).find((k) => name.includes(k));
    if (disqKey) {
      const pts = -2 * multiplier;
      totalPoints += pts;
      ingredients.push({ name: raw[i] || name, position, category: "disqualifier", points: pts, note: DISQUALIFIERS[disqKey] });
      if (name.includes("sulfate") || name.includes("alcohol")) needs.add("Moisture Recovery");
      if (name.includes("silicone") || name.includes("dimethicone")) needs.add("Clarifying Cleanse");
      return;
    }

    // Check rewards
    const rewKey = Object.keys(REWARDS).find((k) => name.includes(k));
    if (rewKey) {
      const pts = 2 * multiplier;
      totalPoints += pts;
      ingredients.push({ name: raw[i] || name, position, category: "reward", points: pts, note: REWARDS[rewKey] });
      if (name.includes("keratin") || name.includes("biotin")) needs.add("Strength & Repair");
      if (name.includes("glycerin") || name.includes("aloe") || name.includes("hyaluronic")) needs.add("Deep Hydration");
      return;
    }

    ingredients.push({ name: raw[i] || name, position, category: "neutral", points: 0, note: "Standard cosmetic ingredient" });
  });

  const score = Math.max(0, Math.min(10, Math.round(totalPoints)));
  const first5 = ingredients.slice(0, 5);
  const rewardCount = ingredients.filter((i) => i.category === "reward").length;
  const disqCount = ingredients.filter((i) => i.category === "disqualifier").length;

  let summary = `Score: ${score}/10. `;
  summary += `First 5 ingredients make up ~80-90% of the formula. `;
  if (disqCount > 0) summary += `Found ${disqCount} concerning ingredient(s). `;
  if (rewardCount > 0) summary += `Found ${rewardCount} beneficial ingredient(s). `;
  if (score >= 8) summary += "Excellent formula for hair health!";
  else if (score >= 5) summary += "Decent formula with room for improvement.";
  else summary += "Consider switching to a gentler, more nourishing product.";

  if (needs.size === 0) needs.add("General Maintenance");

  return { score, maxScore: 10, ingredients, summary, hairNeeds: Array.from(needs) };
}
