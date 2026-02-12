/**
 * Tool routing and AI tool registry — extracted from up-api/index.ts
 */

/** Tools that route to existing edge functions */
export const TOOL_ROUTES: Record<string, string> = {
  "UpSearch": "genius-search",
  "UpBot": "googlieeyes-bot",
  "UpMarketing": "marketing-ai",
  "UpMarketingMCP": "marketing-mcp",
  "UpLogo": "logo-generator",
  "UpVoice": "elevenlabs-tts",
  "UpAffiliate": "auto-affiliate-links",
  "UpRepo": "tool-repository",
  "UpTestPipeline": "test-pipeline",
  "UpPool": "genius-pool",
  "UpCredits": "agent-credits",
};

/** Tools handled inline via AI */
export const AI_TOOLS = new Set([
  // Core
  "UpSEO", "UpBlueOcean", "UpContent", "UpChatter", "UpYouTube",
  "UpQA", "UpCodeReview", "UpEndToEnd", "UpTracing",
  "UpTrustShield", "UpPromptGuard", "UpBELL", "UpDeepFakeProof",
  "UpAltText", "UpFavCon", "UpDomain", "UpBrandKit",
  "UpAgent", "UpFAQ", "UpDataScientist", "UpPatent", "UpCompetitorIntel",
  "UpPodcast", "UpCounty", "UpAfro",
  // Hair
  "UpDryHair", "UpDamagedHair", "UpOilyHair", "UpDandruff",
  "UpCurlyHair", "UpAntiAging", "UpNaturalOrganic", "UpLuxury", "UpTextured",
  // Docs
  "UpDataDictionary", "UpAPIDoc", "UpUserManual", "UpTechManual",
  // Predictive & Finance
  "UpPredictiveAlpha", "UpPredictiveGetRich",
  "UpSell", "UpFastMoneyToday", "UpCrowdfund", "UpRevenueProjector",
  // Advertising
  "UpFreeAdvertising", "UpPaidAdOptimizer",
  // Comms
  "UpInbox", "UpMail", "UpDrive",
  // Connections
  "UpClaw", "UpConnect",
  // Apps
  "UpApple", "UpAPK", "UpEXE",
  // Orchestration
  "UpImplement", "UpRun", "UpAutoEvent", "UpRetry",
  "UpGrowthEngine", "UpPoofEcosystem", "UpLegacySecure",
  // Intelligence
  "UpNeuroSync", "UpJurisPredict", "UpCarbonCaster", "UpBioAudit",
  "UpAnalytics", "UpA11y", "UpI18n", "UpBackup",
  "UpSOXCompliance",
  // TinyClaw agents
  "UpTinyClaw", "UpOpenClaw", "UpTikTokAPI",
  // Neurodivergent & WCAG
  "UpNeuroFriendly", "UpWCAG", "UpDyslexia", "UpNoBlueLight",
  // Eco & Sustainable
  "UpEcoCode", "UpGreenHost", "UpSustainBrand",
  // Badges & Audit
  "UpBadge", "UpAudit",
  // ─── NEW: TTS Engines ───
  "UpKokoroTTS", "UpChatterbox", "UpFishAudio", "UpTortoiseTTS", "UpPiperTTS", "UpTTSOrchestrator",
  // ─── NEW: Analytics (FOSS) ───
  "UpUmami", "UpPlausible", "UpMatomo", "UpClickHouse", "UpAnalyticsHub",
  // ─── NEW: FOSS Discovery ───
  "UpFOSS", "UpFOSSAudit",
  // ─── NEW: Google APIs ───
  "UpYouTubeData", "UpGoogleAnalytics", "UpSearchConsole", "UpGoogleSuite",
  // ─── NEW: Infrastructure ───
  "UpDigitalOcean",
]);
