import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FlaskConical, Sparkles, ListChecks, Megaphone, Flower2 } from "lucide-react";
import heroImage from "@/assets/hero-hair.jpg";

const features = [
  {
    icon: FlaskConical,
    title: "INCI Analyzer",
    desc: "Paste any ingredient list — get a score with the First 5 Rule, disqualifiers & rewards.",
    link: "/analyzer",
    color: "text-primary",
  },
  {
    icon: ListChecks,
    title: "Smart Picks",
    desc: "Curated product recommendations for Colorado's dry climate and your hair type.",
    link: "/recommendations",
    color: "text-mint",
  },
  {
    icon: Megaphone,
    title: "Marketing Suite",
    desc: "Generate luxury positioning, SEO copy, video scripts, and social captions.",
    link: "/marketing",
    color: "text-blossom",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Index() {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden gradient-hero">
        {/* Bg image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Flowing hair with cherry blossoms"
            className="h-full w-full object-cover opacity-30"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full gradient-glow animate-glow-pulse pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <Flower2 className="h-4 w-4 text-blossom" />
              <span className="text-sm text-muted-foreground">AI Cosmetic Chemistry</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight leading-tight mb-6">
              Your Hair Deserves
              <br />
              <span className="font-semibold text-primary">Better Chemistry</span>
            </h1>

            <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
              Analyze ingredients like a cosmetic chemist. Score any shampoo or conditioner
              instantly with AI-powered INCI analysis — tailored for Colorado's climate.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/analyzer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-warm hover:shadow-glow transition-shadow"
              >
                <FlaskConical className="h-5 w-5" />
                Analyze Ingredients
              </Link>
              <Link
                to="/recommendations"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-card/50 text-foreground font-medium hover:bg-card transition-colors"
              >
                <Sparkles className="h-5 w-5 text-blossom" />
                Browse Picks
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-light mb-3">
            Everything for your <span className="text-primary font-medium">hair journey</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            From ingredient science to marketing — powered by AI, designed for you.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((f) => (
            <motion.div key={f.title} variants={item}>
              <Link
                to={f.link}
                className="group block p-6 rounded-2xl gradient-card border border-border/50 hover:border-primary/30 hover:shadow-warm transition-all"
              >
                <f.icon className={`h-8 w-8 mb-4 ${f.color}`} />
                <h3 className="font-display text-xl font-medium mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Colorado tip */}
      <section className="pb-24 container mx-auto px-4">
        <motion.div
          className="max-w-2xl mx-auto p-8 rounded-2xl bg-secondary/30 border border-secondary/50 text-center"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-secondary-foreground font-display text-lg italic">
            "Dry Johnstown air? Prioritize moisture-rich formulas with glycerin, aloe, and hyaluronic acid
            in the first 5 ingredients."
          </p>
          <p className="text-sm text-muted-foreground mt-3">— Colorado Climate Tip</p>
        </motion.div>
      </section>
    </div>
  );
}
