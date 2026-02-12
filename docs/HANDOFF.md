# 🧠 Agent Handoff Document
> Last updated: 2026-02-12
> Purpose: Complete project state for seamless session continuity.

---

## 1. Project Identity

- **App Name**: Up (Hair care / beauty / anti-aging marketing automation platform)
- **Stack**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Lovable Cloud (Supabase) — edge functions, auth, DB, storage
- **Mobile**: Capacitor (Android + iOS shells configured)
- **Supabase Project ID**: `ubbiqmjmwoezrkvathpx`

---

## 2. Secrets & API Keys (All Configured)

| Secret | Purpose | Source |
|--------|---------|--------|
| `LOVABLE_API_KEY` | Lovable AI gateway (Gemini 3, GPT-5) | Auto-provisioned |
| `OPENROUTER_API_KEY` | OpenRouter models (Kimo, Dolphin, Venice, etc.) | User-provided |
| `PERPLEXITY_API_KEY` | Perplexity AI search | Connector-managed |
| `FIRECRAWL_API_KEY` | Web scraping / INCI extraction | Connector-managed |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS/STT | Connector-managed |
| `STRIPE_SECRET_KEY` | Stripe payments | Auto-provisioned |
| `GOOGLE_AI_API_KEY` | Google Gemini fallback (user's own key) | User-provided |
| `DIGITALOCEAN_API_KEY` | DigitalOcean infrastructure management | User-provided |

---

## 3. Architecture Overview

### Master Gateway: UpAPI v2.0.0
- **Location**: `supabase/functions/up-api/`
- **Structure**: 3-file module split:
  - `index.ts` — Router (routes to edge functions or handles AI inline)
  - `tool-registry.ts` — `TOOL_ROUTES` (maps tool→edge function) + `AI_TOOLS` Set
  - `tool-prompts.ts` — System prompts for all AI-handled tools
- **Tool Count**: 106+ tools across categories

### Edge Functions (Dedicated)
| Function | Purpose |
|----------|---------|
| `genius-search` | Multi-domain AI search (patent, legal, science, code, marketing, invention) |
| `genius-pool` | GeniusPool campaign management |
| `genius-pool-pipeline` | 4-step tool generation pipeline (research→design→code→marketing) |
| `tool-repository` | 9-asset generation per tool (code, SQL, README, blueprint, API spec, etc.) |
| `marketing-ai` | AI marketing content generation |
| `marketing-mcp` | Marketing MCP server |
| `auto-affiliate-links` | Amazon affiliate link generation (tag: meetaudreyeva-20) |
| `create-checkout` | Stripe checkout sessions |
| `check-subscription` | Subscription status checks |
| `customer-portal` | Stripe customer portal |
| `agent-credits` | Credit management system |
| `elevenlabs-tts` | ElevenLabs voice synthesis |
| `up-voice` | Voice processing |
| `logo-generator` | AI logo generation |
| `googlieeyes-bot` | Bot functionality |
| `test-pipeline` | Pipeline testing framework |

### AI Model Strategy
- **Primary**: Lovable AI gateway → `google/gemini-3-flash-preview` (default)
- **Premium**: `google/gemini-2.5-pro`, `openai/gpt-5`, `openai/gpt-5.2`
- **Fallback**: User's `GOOGLE_AI_API_KEY` for direct Gemini access
- **OpenRouter**: Kimo (Hermes 405B), Dolphin 8B, Mistral Large, Venice Uncensored, free models
- **Free models**: `openrouter/free`, `tngtech/deepseek-r1t2-chimera:free`, `arcee-ai/trinity-large-preview:free`

---

## 4. Database Schema

### Tables
| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (id, email, hair_type_preference, premium) | ✅ |
| `saved_analyses` | Saved ingredient analyses | ✅ |
| `marketing_products` | Products being marketed | ✅ |
| `campaign_posts` | Social media campaign posts | ✅ |
| `campaign_tracking` | Campaign performance metrics | ✅ |
| `marketing_expenses` | Expense tracking (tax deductible) | ✅ |
| `auto_affiliate_links` | Amazon affiliate links | ✅ |
| `tool_repository` | Generated tool assets (9 per tool) | ✅ |
| `pipeline_test_results` | Pipeline test outcomes | ✅ |
| `agent_sessions` | AI agent session tracking | ✅ |
| `user_credits` | Credit balances (10 free to start) | ✅ |

### Key Triggers
- `handle_new_user()` — Creates profile on signup
- `handle_new_user_credits()` — Grants 10 free credits on signup
- `update_updated_at_column()` — Auto-updates timestamps

---

## 5. Frontend Routes

| Route | Page | Lazy-loaded |
|-------|------|-------------|
| `/` | Index (landing) | ✅ |
| `/auth` | Authentication | ✅ |
| `/analyzer` | Ingredient analyzer | ✅ |
| `/recommendations` | Product recommendations | ✅ |
| `/saved` | Saved analyses | ✅ |
| `/premium` | Premium subscription | ✅ |
| `/marketing` | Marketing dashboard | ✅ |
| `/marketing-dashboard` | Advanced marketing | ✅ |
| `/genius-pool` | GeniusPool tool builder | ✅ |
| `/logo-generator` | Logo generation | ✅ |
| `*` | 404 Not Found | ✅ |

---

## 6. Tool Categories (106+ Tools)

### Marketing & Revenue
UpPost, UpScheduler, UpAffiliate, UpSEO, UpViralHook, UpHashtag, UpCaption, UpInfluencer, UpAdCopy, UpEmailBlast, UpPricing, UpFastMoney, UpRevenueMax

### Quality & Security
UpQA, UpTest, UpCodeReview, UpSecurity, UpTrustShield, UpDeepfakeDetect, UpBELL

### Voice & TTS
UpKokoroTTS, UpChatterbox, UpFishAudio, UpTortoiseTTS, UpPiperTTS, UpTTSOrchestrator

### Analytics (FOSS)
UpUmami, UpPlausible, UpMatomo, UpClickHouse, UpAnalyticsHub

### Intelligence & Research
UpPatent, UpBlueOcean, UpCompetitor, UpTrend, UpFOSS, UpFOSSAudit

### Infrastructure
UpDigitalOcean (NEW — uses DIGITALOCEAN_API_KEY)

### Branding & Design
UpBrandKit, UpLogo, UpBadge, UpColorPalette

### Orchestration & Meta
UpAutoEvent, UpImplement, UpRun, UpEndToEnd, UpRepo, UpAPIDoc

### Business & Legal
UpBusinessLicense, UpCertificates, UpInsurance

---

## 7. Key Design Decisions

1. **Exrup Methodology**: "Extreme Scrum" — one-iteration production delivery
2. **Tool Repository**: Every tool generates 9 assets automatically
3. **Pending Queue**: Two-step architecture prevents edge function timeouts
4. **AI Fallback Chain**: Premium models → retries → Gemini 3 Flash final fallback
5. **Dual Gemini**: Lovable AI primary, user's Google key as fallback
6. **Affiliate Tag**: `meetaudreyeva-20` for all Amazon links
7. **ErrorBoundary**: Global crash recovery wraps entire app
8. **Lazy Loading**: All 11 routes lazy-loaded with Suspense

---

## 8. Pending / TODO Items

- [ ] Create `UpDigitalOcean` tool implementation (edge function + registry)
- [ ] Create `UpGoogleAnalytics` tool with badge integration
- [ ] Create `UpDrive` tool for Google Drive/email access
- [ ] Implement Gemini dual-key fallback logic in edge functions
- [ ] Add analytics badges to `UpBadge` system
- [ ] PWA setup with service worker + push notifications
- [ ] Full FOSS analytics stack (Umami + ClickHouse + Grafana)
- [ ] End-to-end testing of TTS tools via GeniusPool UI

---

## 9. User Preferences

- **Owner**: Building a hair care / beauty / anti-aging marketing automation empire
- **Style**: Wants ALL features, comprehensive, production-ready
- **AI Models**: Uses premium models, wants both Lovable AI + personal Gemini
- **Infrastructure**: DigitalOcean for hosting/deployment
- **Analytics**: Prefers FOSS (Umami, Plausible) over Google Analytics
- **Methodology**: Exrup — ship fast, one iteration
- **Session Continuity**: Requires handoff docs for agent transitions

---

## 10. File Map (Key Files)

```
src/
├── App.tsx                          # Router + lazy loading + ErrorBoundary
├── components/
│   ├── ErrorBoundary.tsx            # Global crash recovery
│   ├── Layout.tsx                   # App shell
│   ├── GeniusToolsTab.tsx           # GeniusPool UI
│   └── AiToolsTab.tsx              # AI tools interface
├── pages/
│   ├── Index.tsx                    # Landing page
│   ├── Auth.tsx                     # Login/signup
│   ├── Analyzer.tsx                 # Ingredient analysis
│   ├── GeniusPool.tsx              # Tool builder
│   ├── Marketing.tsx               # Marketing hub
│   └── MarketingDashboard.tsx      # Advanced analytics
├── hooks/useAuth.tsx               # Auth hook
├── lib/ingredients.ts              # Ingredient database
└── integrations/supabase/          # Auto-generated (DO NOT EDIT)

supabase/functions/
├── up-api/
│   ├── index.ts                    # Master gateway router
│   ├── tool-registry.ts            # Tool routing table + AI tools set
│   └── tool-prompts.ts             # System prompts for AI tools
├── genius-search/index.ts          # Multi-domain search
├── genius-pool/index.ts            # Campaign management
├── genius-pool-pipeline/index.ts   # 4-step tool pipeline
├── tool-repository/index.ts        # 9-asset generator
└── [12+ more edge functions]

docs/
├── README.md
├── TECH_MANUAL.md
├── USER_MANUAL.md
├── DATA_DICTIONARY.md
└── HANDOFF.md                      # THIS FILE
```

---

*This document should be read by the next agent at session start to restore full project context.*
