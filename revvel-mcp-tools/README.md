# Revvel MCP Tools — 111 Reusable MCP Servers

A monorepo of **111 standalone MCP (Model Context Protocol) servers** — each in its own folder, ready to plug into any app, IDE, or AI agent (Cursor, Claude Desktop, Cline, etc.).

## 🏗️ Structure

```
revvel-mcp-tools/
├── README.md
├── deno.json              # shared import map
├── generate.ts            # generator script (creates all 111 from registry)
├── shared/
│   └── mcp-factory.ts     # shared MCP server factory
├── up-seo/index.ts
├── up-bell/index.ts
├── up-predictive-alpha/index.ts
├── ... (111 total)
```

## 🚀 Quick Start

### Run any tool locally
```bash
cd up-seo
deno run --allow-net --allow-env index.ts
# MCP server running on http://localhost:8000
```

### Connect to Cursor / Claude Desktop
Add to your MCP config:
```json
{
  "mcpServers": {
    "up-seo": {
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

### Deploy to Supabase Edge Functions
```bash
supabase functions deploy up-seo
```

### Deploy to Deno Deploy
```bash
deployctl deploy --project=up-seo up-seo/index.ts
```

## 🔧 Regenerate All Tools
```bash
deno run --allow-read --allow-write generate.ts
```

## 📦 Tool Categories

### Core (11 Routed)
| Tool | Function | Description |
|------|----------|-------------|
| UpSearch | genius-search | Multi-domain AI search |
| UpBot | googlieeyes-bot | GoogliEyes MCP agent |
| UpMarketing | marketing-ai | AI captions & scoring |
| UpMarketingMCP | marketing-mcp | Marketing automation MCP |
| UpLogo | logo-generator | AI logo generation |
| UpVoice | elevenlabs-tts | Text-to-speech |
| UpAffiliate | auto-affiliate-links | Affiliate link automation |
| UpRepo | tool-repository | Tool generation pipeline |
| UpTestPipeline | test-pipeline | Universal test pipeline |
| UpPool | genius-pool | GeniusPool automation |
| UpCredits | agent-credits | Credit management |

### SEO & Marketing (8)
UpSEO, UpBlueOcean, UpContent, UpSell, UpFreeAdvertising, UpPaidAdOptimizer, UpCompetitorIntel, UpGrowthEngine

### Quality & Security (8)
UpQA, UpCodeReview, UpEndToEnd, UpTracing, UpTrustShield, UpPromptGuard, UpDeepFakeProof, UpSOXCompliance

### Predictive & Finance (6)
UpPredictiveAlpha, UpPredictiveGetRich, UpFastMoneyToday, UpCrowdfund, UpRevenueProjector, UpSell

### Voice & TTS (7)
UpKokoroTTS, UpChatterbox, UpFishAudio, UpTortoiseTTS, UpPiperTTS, UpTTSOrchestrator, UpVoice

### Accessibility & Neuro (4)
UpNeuroFriendly, UpWCAG, UpDyslexia, UpNoBlueLight

### Eco & Sustainable (3)
UpEcoCode, UpGreenHost, UpSustainBrand

### Analytics (5)
UpUmami, UpPlausible, UpMatomo, UpClickHouse, UpAnalyticsHub

### Google APIs (4)
UpYouTubeData, UpGoogleAnalytics, UpSearchConsole, UpGoogleSuite

### FOSS Discovery (2)
UpFOSS, UpFOSSAudit

### Infrastructure (1)
UpDigitalOcean

### Hair Care (9)
UpDryHair, UpDamagedHair, UpOilyHair, UpDandruff, UpCurlyHair, UpAntiAging, UpNaturalOrganic, UpLuxury, UpTextured

### Documentation (4)
UpDataDictionary, UpAPIDoc, UpUserManual, UpTechManual

### Legal & Compliance (3)
UpJurisPredict, UpPatent, UpSOXCompliance

### Branding & Design (4)
UpAltText, UpFavCon, UpDomain, UpBrandKit

### Intelligence & AI (6)
UpAgent, UpNeuroSync, UpCarbonCaster, UpBioAudit, UpDataScientist, UpFAQ

### Badges & Audit (2)
UpBadge, UpAudit

### Communication (3)
UpInbox, UpMail, UpDrive

### TinyClaw Agents (3)
UpTinyClaw, UpOpenClaw, UpTikTokAPI

### App Builders (3)
UpApple, UpAPK, UpEXE

### Orchestration (6)
UpImplement, UpRun, UpAutoEvent, UpRetry, UpPoofEcosystem, UpLegacySecure

### Other (7)
UpChatter, UpYouTube, UpPodcast, UpCounty, UpAfro, UpClaw, UpConnect, UpA11y, UpI18n, UpBackup, UpAnalytics

## 📄 License

MIT — Use freely in any project.
