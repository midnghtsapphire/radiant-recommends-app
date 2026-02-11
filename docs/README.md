# MidnightSapphire — AgelessGeno Marketing & Genius AI Suite

> **Repositories:** `midnghtsapphire/agelessgeno-marketing` (this project) + `midnghtsapphire/googlieeyes-bot` (MCP agent)

## 🏗 Architecture Overview

```
┌─────────────────────────────────────┐
│         React Frontend              │
│  (Dashboard, AI Tools, Search)      │
├──────────┬──────────┬───────────────┤
│          │          │               │
▼          ▼          ▼               ▼
genius-    googlieeyes marketing-   marketing-
search     -bot (MCP)  mcp (MCP)     ai
│          │          │               │
▼          ▼          ▼               ▼
┌──────────────────────────────────────┐
│     AI Providers                      │
│  Lovable AI | OpenRouter | Perplexity │
└──────────────────────────────────────┘
```

## 🔧 Edge Functions (Backend)

| Function | Type | Description |
|----------|------|-------------|
| `genius-search` | REST API | Multi-domain AI search (patent, legal, science, code, marketing, invention) |
| `googlieeyes-bot` | MCP Server | 8-tool agent: research, invent, patent, legal, code, video, blue ocean, genius collab |
| `marketing-mcp` | MCP Server | 7-tool marketing automation: products, campaigns, expenses, AI captions, scoring |
| `marketing-ai` | REST API | AI caption generation, product scoring, trend analysis |
| `elevenlabs-tts` | REST API | Text-to-speech via ElevenLabs |
| `check-subscription` | REST API | Stripe subscription verification |
| `create-checkout` | REST API | Stripe checkout session creation |
| `customer-portal` | REST API | Stripe customer portal |

## 🤖 GoogliEyes Bot — MCP Agent

Multi-domain AI agent channeling genius methodologies:

### Tools
1. **research** — Deep multi-domain research
2. **invent** — Invention disclosure generator (Tesla + Da Vinci)
3. **patent_analysis** — Patentability, prior art, blue ocean gaps
4. **legal_advice** — Pro se, CLE, Colorado, IP law
5. **code_architect** — Production-ready architecture
6. **video_script** — Marketing video scripts (Picasso + Mozart)
7. **blue_ocean** — Market opportunity analysis
8. **timemachine_collab** — Genius brainstorming sessions

### Genius Methodologies
- **Aristotle**: Systematic logic, first-principles reasoning
- **Tesla**: Inventive visualization, electromagnetic innovation
- **Da Vinci**: Interdisciplinary design, biomimicry
- **Curie**: Rigorous experimentation, materials science
- **Plato**: Philosophical frameworks, dialectic reasoning
- **Mozart**: Creative composition, pattern recognition
- **Picasso**: Abstract thinking, creative disruption
- **Beethoven**: Persistence, emotional intelligence
- **Turing**: Computational logic, algorithmic thinking
- **Lovelace**: Programming vision, mathematical analysis

### MCP Connection (Cursor, Claude Desktop, etc.)
```json
{
  "mcpServers": {
    "googlieeyes-bot": {
      "url": "https://ubbiqmjmwoezrkvathpx.supabase.co/functions/v1/googlieeyes-bot/mcp"
    },
    "marketing-mcp": {
      "url": "https://ubbiqmjmwoezrkvathpx.supabase.co/functions/v1/marketing-mcp/mcp"
    }
  }
}
```

## 🔑 API Keys & Tokens

| Secret | Source | Required |
|--------|--------|----------|
| `LOVABLE_API_KEY` | Auto-provisioned | ✅ (Gemini, GPT-5) |
| `OPENROUTER_API_KEY` | openrouter.ai | ✅ (free uncensored models) |
| `PERPLEXITY_API_KEY` | perplexity.ai | Optional (web search) |
| `FIRECRAWL_API_KEY` | firecrawl.dev | Optional (web scraping) |
| `ELEVENLABS_API_KEY` | elevenlabs.io | Optional (TTS) |
| `STRIPE_SECRET_KEY` | stripe.com | ✅ (payments) |

## 🧠 AI Models

### Lovable AI (no extra key needed)
- `google/gemini-3-flash-preview` (default)
- `google/gemini-2.5-flash` / `google/gemini-2.5-pro`
- `openai/gpt-5-mini`

### OpenRouter Free & Uncensored
- `venice/uncensored:free` — Venice Uncensored 24B (unrestricted)
- `arcee-ai/trinity-large-preview:free` — Arcee Trinity 400B
- `openai/gpt-oss-120b:free` — GPT-OSS 120B
- `tngtech/deepseek-r1t2-chimera:free` — DeepSeek R1T2
- `openrouter/free` — Auto-selects best free model

## 📊 Database Schema

### `marketing_products`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| product_name | TEXT | Product name |
| product_type | TEXT | hair_care, own_product, affiliate |
| description | TEXT | Optional description |
| score | INTEGER | Priority score 0-100 |
| status | TEXT | queued, marketing, paused, completed |
| target_state | TEXT | US state targeting |
| target_county | TEXT | County targeting |

### `campaign_posts`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | FK → marketing_products |
| platform | TEXT | instagram, facebook, tiktok, twitter |
| caption | TEXT | Post content |
| spend_cents | INTEGER | Ad spend in cents |
| engagement_* | INTEGER | Likes, comments, shares, clicks |
| reach | INTEGER | Total reach |

### `marketing_expenses`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category | TEXT | ad_spend, content_creation, tools, other |
| amount_cents | INTEGER | Amount in cents |
| tax_deductible | BOOLEAN | Tax deduction flag |

## 🚀 Deployment

All edge functions deploy automatically via Lovable Cloud. No manual deployment needed.

## 📄 License

MIT — Open source, FOSS-compatible.
