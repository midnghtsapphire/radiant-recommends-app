import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, DollarSign, Rocket, Copy, CheckCheck, ExternalLink, Loader2,
  ShoppingCart, TrendingUp, Sparkles, Wrench, Code, Search, Megaphone,
  ChevronDown, Link2, BarChart3, Target, Clock, Eye, MousePointerClick,
  PlayCircle, CheckCircle2, XCircle, AlertTriangle, Coins, Mic,
  FolderOpen, Database, FileCode2, BookOpen
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
  // ─── Marketing & Revenue ───
  { name: "UpAffiliate", desc: "Auto-generate affiliate links, track conversions, optimize Amazon product listings", category: "revenue", cost: 1 },
  { name: "UpMarketing", desc: "Full marketing automation — campaigns, scheduling, budget allocation, ROI tracking", category: "revenue", cost: 2 },
  { name: "UpSEO", desc: "Deep SEO research — keywords, backlinks, long-tail phrases, meta optimization, domain authority", category: "revenue", cost: 1 },
  { name: "UpSocialMedia", desc: "Auto-post to all platforms, template generation, scheduling, engagement tracking", category: "revenue", cost: 2 },
  { name: "UpBlueOcean", desc: "Find untapped market niches, generate million-dollar sub-genre ideas with insights", category: "revenue", cost: 2 },
  { name: "UpContent", desc: "Content creation — video, blog, social templates from free YouTube/music sources", category: "revenue", cost: 2 },
  { name: "UpYouTube", desc: "YouTube channel curation, video SEO, content strategy, thumbnail optimization", category: "revenue", cost: 2 },
  { name: "UpChatter", desc: "Social media monitoring, sentiment analysis, trending topics across all platforms", category: "revenue", cost: 2 },
  // ─── Quality & Testing (consolidated) ───
  { name: "UpQA", desc: "Automated QA — unit, integration, regression, load testing, E2E suites, CI/CD hooks", category: "quality", cost: 2 },
  { name: "UpCodeReview", desc: "Automated code review, security scanning, best practices enforcement", category: "quality", cost: 2 },
  { name: "UpEndToEnd", desc: "Full E2E orchestration — user flows, edge cases, Playwright scripts, auto-rollback", category: "quality", cost: 3 },
  { name: "UpTracing", desc: "Performance tracing, error monitoring, bottleneck detection, observability dashboards", category: "quality", cost: 2 },
  // ─── Security & Trust (consolidated into UpTrustShield + UpBELL + UpPromptGuard) ───
  { name: "UpTrustShield", desc: "Consolidated security — deepfake detection, content verification, trust scoring, identity integrity", category: "security", cost: 3 },
  { name: "UpPromptGuard", desc: "Detect & block prompt injection attacks, sanitize LLM inputs, jailbreak prevention", category: "security", cost: 3 },
  { name: "UpBELL", desc: "Building Emergency Lockdown & Location — weapon detection, active shooter prevention, threat assessment, first responder alerts", category: "security", cost: 3 },
  { name: "UpDeepFakeProof", desc: "Watermark & certify authentic content — blockchain hash, provenance chain, tamper-proof certificates", category: "security", cost: 3 },
  // ─── Branding & Business ───
  { name: "UpAltText", desc: "Auto-generate SEO-optimized alt text for all images, accessibility compliance", category: "brand", cost: 1 },
  { name: "UpFavCon", desc: "Generate favicons, app icons, PWA icons in all required sizes from a single design", category: "brand", cost: 1 },
  { name: "UpLogo", desc: "AI logo generation, brand identity kits, color palette & typography suggestions", category: "brand", cost: 2 },
  { name: "UpDomain", desc: "Domain name research, availability checking, SEO-friendly naming, TLD strategy", category: "brand", cost: 1 },
  { name: "UpBrandKit", desc: "Complete brand identity — colors, fonts, voice, EIN, SOS, licenses, insurance, certificates", category: "brand", cost: 2 },
  // ─── App Creation & Payments ───
  { name: "UpApp", desc: "Final app assembly — wires all generated tools into working application, routes, UI, deployment", category: "app", cost: 3 },
  { name: "UpSubscription", desc: "Subscription management — plans, tiers, billing cycles, Stripe integration, usage metering", category: "app", cost: 3 },
  { name: "UpPayments", desc: "Payment processing — checkout flows, invoicing, refunds, multi-currency, tax calculation", category: "app", cost: 3 },
  { name: "UpOnboarding", desc: "User onboarding flows — welcome wizard, tutorials, progressive disclosure, activation metrics", category: "app", cost: 2 },
  { name: "UpDashboard", desc: "Admin dashboard — analytics, user management, revenue tracking, system health monitoring", category: "app", cost: 3 },
  { name: "UpAuth", desc: "Authentication system — signup, login, OAuth, MFA, role-based access, session management", category: "app", cost: 2 },
  // ─── Intelligence ───
  { name: "UpAgent", desc: "Customer service agent, complaint handling, product Q&A, phone/email automation", category: "intel", cost: 2 },
  { name: "UpFAQ", desc: "Auto-generate comprehensive FAQs for any website or product", category: "intel", cost: 1 },
  { name: "UpDataScientist", desc: "Data analysis, trend prediction, market intelligence, performance analytics", category: "intel", cost: 3 },
  { name: "UpPatent", desc: "Patent research, prior art analysis, patent application drafting, IP strategy", category: "intel", cost: 3 },
  { name: "UpCompetitorIntel", desc: "Competitor analysis — pricing, features, weaknesses, market positioning, clone-or-beat strategy", category: "intel", cost: 2 },
  // ─── Voice & Audio (consolidated into UpVoice) ───
  { name: "UpVoice", desc: "Full voice SaaS — TTS, STT, cloning, streaming, noise reduction, format conversion. Replaces ElevenLabs", category: "voice", cost: 3 },
  { name: "UpPodcast", desc: "Auto-generate podcasts from articles — script, multi-voice TTS, intro/outro, RSS", category: "voice", cost: 3 },
  // ─── Geographic & Demographic ───
  { name: "UpCounty", desc: "County/region market targeting — demographics, climate-specific solutions, local SEO, area economics", category: "geo", cost: 2 },
  { name: "UpAfro", desc: "African American hair care targeting by geography — demographics, product recommendations, cultural relevance", category: "geo", cost: 2 },
  // ─── Hair Sub-Genre Campaigns ───
  { name: "UpDryHair", desc: "Best products for dry hair — top 10, campaigns, affiliate links, sub-niche targeting", category: "hair", cost: 1 },
  { name: "UpDamagedHair", desc: "Best products for damaged hair — repair, restore, protein treatments, sub-niches", category: "hair", cost: 1 },
  { name: "UpOilyHair", desc: "Best products for oily hair — clarifying, balancing, lightweight formulas", category: "hair", cost: 1 },
  { name: "UpDandruff", desc: "Best dandruff solutions — medicated, natural, scalp treatments, prevention", category: "hair", cost: 1 },
  { name: "UpCurlyHair", desc: "Curly hair care — curl definition, moisture, protective styles, CGM method", category: "hair", cost: 1 },
  { name: "UpAntiAging", desc: "Anti-aging hair care — thinning, gray coverage, collagen-infused, scalp rejuvenation", category: "hair", cost: 1 },
  { name: "UpNaturalOrganic", desc: "Natural & organic hair care — chemical-free, plant-based, sustainable, clean beauty", category: "hair", cost: 1 },
  { name: "UpLuxury", desc: "Luxury & premium hair care — salon-quality, bio-engineered, high-end treatments", category: "hair", cost: 1 },
  { name: "UpTextured", desc: "Textured hair care — 3A-4C curl types, moisture retention, shrinkage management", category: "hair", cost: 1 },
  // ─── Documentation ───
  { name: "UpDataDictionary", desc: "Auto-generate complete data dictionary — tables, columns, types, relationships, ERD", category: "docs", cost: 1 },
  { name: "UpAPIDoc", desc: "API documentation — OpenAPI/Swagger spec, endpoint reference, authentication guide", category: "docs", cost: 1 },
  { name: "UpUserManual", desc: "User manual generation — feature guides, screenshots, FAQs, onboarding docs", category: "docs", cost: 1 },
  { name: "UpTechManual", desc: "Technical manual — architecture, deployment, configuration, troubleshooting guide", category: "docs", cost: 1 },
  // ─── Predictive & Investment (consolidated into UpPredictiveAlpha) ───
  { name: "UpPredictiveAlpha", desc: "Consolidated finance — stock, crypto, bond, Tesla, economics, emerging tech, crime, school safety predictions", category: "predictive", cost: 3 },
  { name: "UpPredictiveGetRich", desc: "Get-rich opportunity scoring — side hustles, arbitrage, market gaps, passive income, risk-adjusted ROI", category: "predictive", cost: 2 },
  // ─── Revenue & Fast Money ───
  { name: "UpSell", desc: "Sales automation — upsell, cross-sell, pricing optimization, conversion funnels, A/B testing", category: "fastmoney", cost: 2 },
  { name: "UpFastMoneyToday", desc: "Revenue-today strategies — same-day monetization, flash sales, viral launches, instant affiliate income", category: "fastmoney", cost: 2 },
  { name: "UpCrowdfund", desc: "Multi-platform crowdfunding — Indiegogo, Kickstarter, GoFundMe, Patreon, optimization, reward tiers", category: "fastmoney", cost: 2 },
  { name: "UpRevenueProjector", desc: "Revenue projection engine — $100/day to $1000/day models, time-to-market, failure probability, pivot plans", category: "fastmoney", cost: 3 },
  { name: "UpFreeAdvertising", desc: "Zero-cost advertising mastery — guerrilla marketing, viral loops, Reddit/HN/ProductHunt launches", category: "fastmoney", cost: 1 },
  { name: "UpPaidAdOptimizer", desc: "Paid ad ROI maximizer — Facebook/Google/TikTok ads, budget allocation, ROAS targets", category: "fastmoney", cost: 2 },
  // ─── Email & Drive Organizer ───
  { name: "UpInbox", desc: "Email organizer — auto-folders, smart categorization, bulk unsubscribe, subscription manager, digital footprint", category: "organizer", cost: 2 },
  { name: "UpMail", desc: "FOSS Resend alternative — self-hosted transactional email API, SMTP/SES, DKIM, templates, webhooks", category: "organizer", cost: 3 },
  { name: "UpDrive", desc: "Cloud drive organizer — Google Drive, Box, auto-folder by project, zip/archive, vault, photo/video sync", category: "organizer", cost: 2 },
  // ─── Agent & Connections ───
  { name: "UpClaw", desc: "AI Agent Creator — deploy agents as websites/APIs, multi-tenant SaaS, white-label, marketplace", category: "agent", cost: 3 },
  { name: "UpConnect", desc: "Universal API aggregator — one login for all APIs (Stripe, Google, OpenRouter), SaaS connector hub", category: "agent", cost: 3 },
  // ─── Deployment & App Stores ───
  { name: "UpApple", desc: "iOS App Store deployment — Capacitor build, Xcode config, provisioning, TestFlight", category: "deploy", cost: 3 },
  { name: "UpAPK", desc: "Android APK/AAB deployment — Capacitor build, Play Console, signing keys, store listing", category: "deploy", cost: 3 },
  { name: "UpEXE", desc: "Desktop & web deployment — Electron/Tauri exe, PWA setup, service workers", category: "deploy", cost: 3 },
  // ─── Meta / Orchestration ───
  { name: "UpImplement", desc: "Auto-implement generated tool from repository — deploy edge function, create DB tables, wire UI", category: "meta", cost: 3 },
  { name: "UpRun", desc: "Run an implemented tool end-to-end with unit test validation — verify it works in production", category: "meta", cost: 2 },
  { name: "UpSOXCompliance", desc: "SOX compliance audit — access controls, audit trails, data integrity, change management", category: "meta", cost: 3 },
  { name: "UpAutoEvent", desc: "Auto-create ALL tools needed for any event/project — researches market, suggests novel tools, generates everything", category: "meta", cost: 3 },
  { name: "UpRetry", desc: "Auto-retry failed/raw tools — cycles paid models 3x then Gemini fallback, bulk recovery", category: "meta", cost: 1 },
  // ─── Consolidated Power Tools ───
  { name: "UpGrowthEngine", desc: "Consolidated marketing — SEO, social, content, viral loops, guerrilla, free advertising, all-in-one", category: "consolidated", cost: 3 },
  { name: "UpPoofEcosystem", desc: "AI agent ecosystem — create, deploy, manage multiple genie-themed agents, marketplace", category: "consolidated", cost: 3 },
  { name: "UpLegacySecure", desc: "Digital inheritance — secure vaults, digital will, beneficiary access, dead man's switch", category: "consolidated", cost: 2 },
  { name: "UpNeuroSync", desc: "Focus & productivity — attention tracking, flow state optimization, deep work scheduling", category: "consolidated", cost: 2 },
  { name: "UpJurisPredict", desc: "Legal prediction — case outcomes, patent/IP strategy, regulatory risk, attorney pro se", category: "consolidated", cost: 3 },
  { name: "UpCarbonCaster", desc: "ESG arbitrage — carbon credit trading, sustainability scoring, green investment signals", category: "consolidated", cost: 2 },
  { name: "UpBioAudit", desc: "Bioweapon prevention — dual-use research detection, lab safety compliance, biosecurity scoring", category: "consolidated", cost: 3 },
  // ─── NEW: Missing tools identified by audit ───
  { name: "UpAnalytics", desc: "Site analytics — client-side behavior tracking, heatmaps, conversion funnels, A/B test results", category: "consolidated", cost: 2 },
  { name: "UpA11y", desc: "Accessibility audit — automated WCAG 2.1 compliance, contrast checks, screen reader testing", category: "consolidated", cost: 2 },
  { name: "UpI18n", desc: "Internationalization — dynamic localization, translation management, RTL support, global hair markets", category: "consolidated", cost: 2 },
  { name: "UpBackup", desc: "Database backup — automated snapshots, encrypted storage, point-in-time recovery, disaster recovery", category: "consolidated", cost: 2 },
  // ─── Test Pipeline ───
  { name: "UpTestPipeline", desc: "Auto-test all UpTools — connectivity, AI response, DB persistence, OpenRouter validation", category: "test", cost: 1 },
];

const HAIR_CATEGORIES = [
  "shampoo", "conditioner", "hair serum", "hair oil", "hair mask",
  "leave-in conditioner", "heat protectant", "curl cream", "hair growth",
  "scalp treatment", "anti-aging hair care", "hair vitamins", "biotin",
  "dry hair", "damaged hair", "oily hair", "dandruff", "no humidity",
  "curly hair", "textured hair", "natural organic", "luxury premium",
];

const CATEGORY_LABELS: Record<string, string> = {
  revenue: "💰 Marketing & Revenue",
  quality: "🛡️ Quality & Testing",
  security: "🔐 Security & Trust",
  brand: "🎨 Branding & Business",
  app: "📱 App Creation & Payments",
  intel: "🧠 Intelligence",
  voice: "🎙️ Voice & Audio",
  geo: "🌎 Geographic & Demographic",
  hair: "💇 Hair Sub-Genre Campaigns",
  docs: "📄 Documentation",
  predictive: "🔮 Predictive & Investment",
  fastmoney: "💸 Revenue & Fast Money",
  test: "🧪 Testing",
  consolidated: "🔥 Power Tools & New",
  organizer: "📂 Email & Drive",
  agent: "🤖 Agents & Connections",
  deploy: "📲 Deployment & App Stores",
  meta: "⚡ Orchestration & Meta-Tools",
};

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

  // Credits & testing state
  const [credits, setCredits] = useState<number | null>(null);
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [agentLoading, setAgentLoading] = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<any>(null);

  // Repository state
  const [repoTools, setRepoTools] = useState<any[]>([]);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoGenerating, setRepoGenerating] = useState<string | null>(null);
  const [repoDetail, setRepoDetail] = useState<any>(null);
  const [repoDetailLoading, setRepoDetailLoading] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("project");
  const [eventGenerating, setEventGenerating] = useState(false);
  const [eventResult, setEventResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadCredits();
      loadRepo();
    }
  }, [user]);

  const loadCredits = async () => {
    try {
      const { data } = await supabase.functions.invoke("agent-credits", { body: { action: "balance" } });
      if (data?.credits !== undefined) setCredits(data.credits);
    } catch { /* silent */ }
  };

  const loadRepo = async () => {
    setRepoLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tool-repository", { body: { action: "list" } });
      if (error) throw error;
      setRepoTools(data?.tools || []);
    } catch { /* silent */ }
    finally { setRepoLoading(false); }
  };

  const handleRepoGenerate = async (name: string, desc: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setRepoGenerating(name);
    try {
      const { data, error } = await supabase.functions.invoke("tool-repository", {
        body: { action: "generate", tool_name: name, tool_description: desc, event_name: "haircare-app" },
      });
      if (error) throw error;
      toast({ title: `${name} → Repository`, description: `${data.status} • ${data.duration_ms}ms` });
      loadRepo();
    } catch (e: any) { toast({ title: "Generation failed", description: e.message, variant: "destructive" }); }
    finally { setRepoGenerating(null); }
  };

  const handleRepoDetail = async (id: string) => {
    setRepoDetailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tool-repository", { body: { action: "get", repo_id: id } });
      if (error) throw error;
      setRepoDetail(data);
    } catch (e: any) { toast({ title: "Failed to load", description: e.message, variant: "destructive" }); }
    finally { setRepoDetailLoading(false); }
  };

  const handleMarkImplemented = async (id: string) => {
    try {
      await supabase.functions.invoke("tool-repository", { body: { action: "mark_implemented", repo_id: id } });
      toast({ title: "Marked as implemented!" });
      loadRepo();
      setRepoDetail(null);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  const handleAutoEvent = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!eventName) { toast({ title: "Enter event/project name", variant: "destructive" }); return; }
    setEventGenerating(true);
    setEventResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("tool-repository", {
        body: { action: "auto_event", event_name: eventName, event_type: eventType },
      });
      if (error) throw error;
      setEventResult(data);
      toast({ title: `${data.tools_generated} tools generated for "${eventName}"!` });
      loadRepo();
    } catch (e: any) { toast({ title: "Auto-event failed", description: e.message, variant: "destructive" }); }
    finally { setEventGenerating(false); }
  };



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
      await supabase.from("campaign_tracking").insert({
        user_id: user.id, campaign_name: `${productName} - $${selectedBudget}`, product_name: productName,
        budget_cents: selectedBudget * 100, is_free: selectedBudget === 0, affiliate_tag: AFFILIATE_TAG,
        platforms: data?.platforms ? Object.keys(data.platforms) : [], status: "generated",
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

  const handleTestTool = async (toolNameToTest: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setTestingTool(toolNameToTest);
    try {
      const { data, error } = await supabase.functions.invoke("test-pipeline", {
        body: { action: "test_single", tool_name: toolNameToTest },
      });
      if (error) throw error;
      setTestResults(prev => ({ ...prev, [toolNameToTest]: data }));
      const icon = data.status === "pass" ? "✅" : data.status === "partial" ? "⚠️" : "❌";
      toast({ title: `${icon} ${toolNameToTest}: ${data.passed}/${data.total} passed`, description: `${data.duration_ms}ms` });
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [toolNameToTest]: { status: "fail", error: e.message } }));
      toast({ title: `❌ ${toolNameToTest} test failed`, description: e.message, variant: "destructive" });
    } finally { setTestingTool(null); }
  };

  const handleBookAgent = async (tool: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    setAgentLoading(tool);
    setAgentResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("agent-credits", {
        body: { action: "book_agent", agent_tool: tool, request_data: { prompt: `Run ${tool} for my hair care SaaS project.` } },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: data.error, description: `Need ${data.required} credits, have ${data.available}`, variant: "destructive" });
      } else {
        setAgentResult(data);
        setCredits(data.remaining_credits);
        toast({ title: `${tool} complete!`, description: `${data.credits_spent} credits used` });
      }
    } catch (e: any) { toast({ title: "Agent failed", description: e.message, variant: "destructive" }); }
    finally { setAgentLoading(null); }
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

  const TestStatusIcon = ({ name }: { name: string }) => {
    const r = testResults[name];
    if (testingTool === name) return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    if (!r) return null;
    if (r.status === "pass") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (r.status === "partial") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">GeniusPool</h1>
          </div>
          {credits !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-display font-bold text-primary">{credits}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          Agent SaaS hub — campaigns, affiliate, tools, testing & credits. All automated.
        </p>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="campaigns" className="gap-1 text-xs"><Rocket className="h-3.5 w-3.5" /> Campaigns</TabsTrigger>
            <TabsTrigger value="affiliate" className="gap-1 text-xs"><Link2 className="h-3.5 w-3.5" /> Affiliate</TabsTrigger>
            <TabsTrigger value="tools" className="gap-1 text-xs"><Wrench className="h-3.5 w-3.5" /> Tools</TabsTrigger>
            <TabsTrigger value="repo" className="gap-1 text-xs"><FolderOpen className="h-3.5 w-3.5" /> Repo</TabsTrigger>
            <TabsTrigger value="agents" className="gap-1 text-xs"><Mic className="h-3.5 w-3.5" /> Agents</TabsTrigger>
            <TabsTrigger value="test" className="gap-1 text-xs"><PlayCircle className="h-3.5 w-3.5" /> Test</TabsTrigger>
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
            <div className="p-5 rounded-2xl border border-border/50 bg-card">
              <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" /> AutoAffiliateLinks
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                AI finds top-ranking hair products → auto-generates affiliate links ({AFFILIATE_TAG}) → saves & tracks.
              </p>
              <div className="flex gap-3 mb-4 flex-wrap">
                <select value={affiliateCategory} onChange={(e) => setAffiliateCategory(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {HAIR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input value={affiliateCount} onChange={(e) => setAffiliateCount(e.target.value)} placeholder="Count" className="w-20" type="number" min="1" max="20" />
                <Button onClick={handleGenerateAffiliateLinks} disabled={affiliateLoading} className="gap-2">
                  {affiliateLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Links</>}
                </Button>
              </div>
            </div>
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.ranking_score >= 80 ? "bg-primary/20 text-primary" : p.ranking_score >= 50 ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>Score: {p.ranking_score}</span>
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
                GeniusPool researches → designs → OpenRouter codes → marketing integration. All free.
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
              {Object.keys(CATEGORY_LABELS).map((cat) => {
                const tools = PRESET_TOOLS.filter((t) => t.category === cat);
                if (!tools.length) return null;
                return (
                  <div key={cat} className="mb-4">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                      {CATEGORY_LABELS[cat]}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tools.map((tool) => (
                        <div key={tool.name} className="p-3 rounded-xl border border-border hover:border-primary/50 bg-card transition-all hover:shadow-md flex items-start justify-between gap-2">
                          <button onClick={() => handlePipeline(tool.name, tool.desc)} disabled={pipelineLoading}
                            className="text-left flex-1 disabled:opacity-50">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-semibold text-primary text-sm">{tool.name}</span>
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{tool.cost}cr</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tool.desc}</p>
                          </button>
                          <div className="flex items-center gap-1 shrink-0 mt-1">
                            <TestStatusIcon name={tool.name} />
                            <button onClick={() => handleTestTool(tool.name)} disabled={!!testingTool}
                              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary disabled:opacity-50"
                              title="Test this tool">
                              <PlayCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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

          {/* ─── AGENTS (Credits-based) TAB ─── */}
          <TabsContent value="agents" className="space-y-6">
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" /> Agent SaaS — Pay with Credits
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="font-display font-bold">{credits ?? "..."}</span>
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Each tool costs credits. Click to book an agent session — AI runs the tool and delivers results.
              </p>
              {Object.keys(CATEGORY_LABELS).map((cat) => {
                const tools = PRESET_TOOLS.filter((t) => t.category === cat);
                if (!tools.length) return null;
                return (
                  <div key={cat} className="mb-4">
                    <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
                      {CATEGORY_LABELS[cat]}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {tools.map((tool) => (
                        <button key={tool.name} onClick={() => handleBookAgent(tool.name)}
                          disabled={agentLoading === tool.name || (credits !== null && credits < tool.cost)}
                          className="p-3 rounded-xl border border-border hover:border-primary/50 bg-card text-left transition-all hover:shadow-md disabled:opacity-50">
                          <div className="flex items-center justify-between">
                            <span className="font-display font-semibold text-primary text-sm">{tool.name}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{tool.cost} cr</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tool.desc}</p>
                          {agentLoading === tool.name && <div className="flex items-center gap-1 mt-1 text-xs text-primary"><Loader2 className="h-3 w-3 animate-spin" /> Running...</div>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {agentResult && (
                <motion.div key="agent-result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 rounded-2xl border border-border/50 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg font-semibold">{agentResult.tool} Result</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{agentResult.credits_spent} credits</span>
                  </div>
                  {agentResult.result?.output && (
                    <div className="flex gap-2 items-start">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap overflow-auto max-h-[500px] flex-1 p-3 rounded-lg bg-muted/30">{agentResult.result.output}</pre>
                      <CopyBtn text={agentResult.result.output} id="agent-out" />
                    </div>
                  )}
                  {agentResult.result?.error && (
                    <p className="text-sm text-destructive">{agentResult.result.error}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ─── TEST PIPELINE TAB ─── */}
          <TabsContent value="test" className="space-y-6">
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" /> TestPipeline — Verify All UpTools
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Tests AI connectivity (Lovable AI + OpenRouter), DB persistence, and tool validation for each UpTool.
              </p>
              <div className="flex gap-3 mb-4">
                <Button onClick={() => {
                  PRESET_TOOLS.slice(0, 5).forEach((t) => handleTestTool(t.name));
                }} disabled={!!testingTool} className="gap-2">
                  <PlayCircle className="h-4 w-4" /> Test First 5
                </Button>
                <Button variant="outline" onClick={() => {
                  const untested = PRESET_TOOLS.filter(t => !testResults[t.name]);
                  if (untested.length) handleTestTool(untested[0].name);
                }} disabled={!!testingTool} className="gap-2">
                  <PlayCircle className="h-4 w-4" /> Test Next Untested
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {PRESET_TOOLS.map((tool) => {
                const r = testResults[tool.name];
                return (
                  <div key={tool.name} className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    r?.status === "pass" ? "border-green-500/30 bg-green-500/5" :
                    r?.status === "partial" ? "border-yellow-500/30 bg-yellow-500/5" :
                    r?.status === "fail" ? "border-red-500/30 bg-red-500/5" :
                    "border-border bg-card"
                  }`}>
                    <div className="flex items-center gap-3">
                      <TestStatusIcon name={tool.name} />
                      <div>
                        <span className="font-display font-semibold text-sm">{tool.name}</span>
                        {r && <span className="text-xs text-muted-foreground ml-2">{r.passed}/{r.total} • {r.duration_ms}ms</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleTestTool(tool.name)} disabled={testingTool === tool.name}>
                      {testingTool === tool.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ─── REPOSITORY TAB ─── */}
          <TabsContent value="repo" className="space-y-6">
            {/* Auto-Event Generator */}
            <div className="p-5 rounded-2xl border border-accent/30 bg-accent/5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent-foreground" /> Auto-Event — Generate ALL Tools
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create an event/project → OpenRouter auto-suggests & generates every tool needed (QA, tests, security, SOX, marketing, docs, deployment).
              </p>
              <div className="flex gap-3 flex-wrap mb-4">
                <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event/project name (e.g. haircare-launch-2026)" className="flex-1 min-w-48" />
                <select value={eventType} onChange={(e) => setEventType(e.target.value)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <option value="project">Project</option>
                  <option value="website">Website</option>
                  <option value="campaign">Campaign</option>
                  <option value="saas">SaaS App</option>
                  <option value="api">API/MCP</option>
                </select>
                <Button onClick={handleAutoEvent} disabled={eventGenerating || !eventName} className="gap-2">
                  {eventGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating All...</> : <><Rocket className="h-4 w-4" /> Auto-Create All Tools</>}
                </Button>
              </div>
              {eventResult && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm">
                  <p className="font-semibold">{eventResult.tools_generated} tools generated for "{eventResult.event_name}" ({eventResult.event_type})</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {eventResult.results?.map((r: any, i: number) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${r.status === "ready" ? "bg-primary/20 text-primary" : r.status === "failed" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                        {r.tool_name}: {r.status}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" /> Tool Repository
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                GeniusPool → OpenRouter generates complete production assets (SQL, code, data dictionary, roadmap, blueprint) → stored here for fast implementation.
              </p>
              <div className="flex gap-3 flex-wrap mb-4">
                <Button onClick={loadRepo} disabled={repoLoading} variant="outline" className="gap-2">
                  {repoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />} Refresh
                </Button>
              </div>

              {/* Send to Repo buttons */}
              <h3 className="font-display font-semibold text-sm mb-2">Send to Repository (OpenRouter generates all assets)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                {PRESET_TOOLS.map((tool) => (
                  <button key={tool.name} onClick={() => handleRepoGenerate(tool.name, tool.desc)}
                    disabled={repoGenerating === tool.name}
                    className="p-2 rounded-lg border border-border hover:border-primary/50 bg-card text-left transition-all text-xs disabled:opacity-50">
                    <div className="flex items-center gap-1.5">
                      {repoGenerating === tool.name ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : <FileCode2 className="h-3 w-3 text-primary" />}
                      <span className="font-semibold text-primary">{tool.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Repository Items */}
            {repoTools.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Generated Assets ({repoTools.length})
                </h3>
                {repoTools.map((item: any) => (
                  <div key={item.id} className={`p-4 rounded-xl border transition-all ${
                    item.is_implemented ? "border-primary/30 bg-primary/5" :
                    item.status === "ready" ? "border-border bg-card hover:border-primary/50 cursor-pointer" :
                    item.status === "failed" ? "border-destructive/30 bg-destructive/5" :
                    "border-border bg-card"
                  }`} onClick={() => item.status === "ready" && handleRepoDetail(item.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.is_implemented ? <CheckCircle2 className="h-4 w-4 text-primary" /> :
                         item.status === "ready" ? <FileCode2 className="h-4 w-4 text-primary" /> :
                         item.status === "failed" ? <XCircle className="h-4 w-4 text-destructive" /> :
                         <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <div>
                          <span className="font-display font-semibold text-sm">{item.tool_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{item.event_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.model_used}</span>
                        {item.generation_duration_ms && <span>{(item.generation_duration_ms / 1000).toFixed(1)}s</span>}
                        <span className={`px-2 py-0.5 rounded-full ${
                          item.is_implemented ? "bg-primary/20 text-primary" :
                          item.status === "ready" ? "bg-muted" : "bg-destructive/20 text-destructive"
                        }`}>{item.is_implemented ? "implemented" : item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detail View */}
            <AnimatePresence mode="wait">
              {repoDetail && (
                <motion.div key="repo-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{repoDetail.tool_name}</h3>
                      <p className="text-xs text-muted-foreground">{repoDetail.event_name} • {repoDetail.model_used}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRepoDetail(null)}>Close</Button>
                      {!repoDetail.is_implemented && (
                        <Button size="sm" onClick={() => handleMarkImplemented(repoDetail.id)} className="gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Implemented
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* SQL Migration */}
                  {repoDetail.db_migration_sql && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> DB Migration SQL</span>
                        <CopyBtn text={repoDetail.db_migration_sql} id="sql" />
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{repoDetail.db_migration_sql}</pre>
                    </div>
                  )}

                  {/* Source Code */}
                  {repoDetail.source_code && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><FileCode2 className="h-4 w-4 text-primary" /> Source Code</span>
                        <CopyBtn text={repoDetail.source_code} id="code" />
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-96 p-3">{repoDetail.source_code}</pre>
                    </div>
                  )}

                  {/* Data Dictionary */}
                  {repoDetail.data_dictionary && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Data Dictionary</span>
                        <CopyBtn text={JSON.stringify(repoDetail.data_dictionary, null, 2)} id="dict" />
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{JSON.stringify(repoDetail.data_dictionary, null, 2)}</pre>
                    </div>
                  )}

                  {/* Roadmap */}
                  {repoDetail.roadmap && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Roadmap</span>
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{JSON.stringify(repoDetail.roadmap, null, 2)}</pre>
                    </div>
                  )}

                  {/* Blueprint */}
                  {repoDetail.blueprint && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><Code className="h-4 w-4 text-primary" /> Blueprint</span>
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{JSON.stringify(repoDetail.blueprint, null, 2)}</pre>
                    </div>
                  )}

                  {/* Master Prompt */}
                  {repoDetail.master_prompt && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Master Prompt</span>
                        <CopyBtn text={repoDetail.master_prompt} id="prompt" />
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{repoDetail.master_prompt}</pre>
                    </div>
                  )}

                  {/* README */}
                  {repoDetail.readme && (
                    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                      <div className="p-3 flex items-center justify-between border-b border-border/50">
                        <span className="font-semibold text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> README</span>
                        <CopyBtn text={repoDetail.readme} id="readme" />
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-64 p-3">{repoDetail.readme}</pre>
                    </div>
                  )}
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
