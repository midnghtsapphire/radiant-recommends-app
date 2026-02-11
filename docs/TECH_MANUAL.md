# Technical Manual — AgelessGeno Suite

## System Architecture

### Frontend Stack
- **React 18** + **TypeScript** — Component-based UI
- **Vite** — Build tool and dev server
- **Tailwind CSS** + **shadcn/ui** — Design system
- **Framer Motion** — Animations
- **React Router v6** — Client-side routing
- **TanStack Query** — Server state management
- **Recharts** — Data visualization

### Backend Stack
- **Lovable Cloud** (Supabase) — Database, auth, edge functions, storage
- **Deno** — Edge function runtime
- **Hono** — HTTP framework for MCP servers
- **mcp-lite** — Model Context Protocol implementation

### AI Providers
1. **Lovable AI Gateway** (`ai.gateway.lovable.dev`) — Gemini + GPT-5
2. **OpenRouter** (`openrouter.ai`) — Free & uncensored models
3. **Perplexity** (`api.perplexity.ai`) — Web search + AI

## Edge Function Architecture

### genius-search (REST)
```
POST /functions/v1/genius-search
Body: { query, domain, provider, model?, depth? }
Response: { result, domain, provider, model }
```

### googlieeyes-bot (MCP)
```
POST /functions/v1/googlieeyes-bot/mcp
Body: MCP Streamable HTTP transport
Tools: research, invent, patent_analysis, legal_advice, code_architect, video_script, blue_ocean, timemachine_collab
```

### marketing-mcp (MCP)
```
POST /functions/v1/marketing-mcp/mcp
Tools: list_products, add_product, create_campaign_post, record_expense, get_dashboard_stats, generate_caption, ai_score_product
```

## Security
- RLS policies on all tables (user_id scoping)
- JWT verification disabled at function level, validated in code where needed
- API keys stored as encrypted Supabase secrets
- CORS headers configured for web access

## Prompts Used

### Genius System Prompt
The core system prompt channels 10 historical geniuses (Aristotle, Tesla, Da Vinci, Curie, Plato, Mozart, Picasso, Beethoven, Turing, Lovelace) and covers domains: web admin, programming, cutting-edge tech, invention, patents, legal (pro se), CLE, video marketing, science, bioengineering, genetics, and materials science.

### Domain-Specific Prompts
Each search domain has a tailored prompt:
- **Patent**: Tesla's inventive methodology + Edison's patent strategy
- **Legal**: Pro se expertise + CLE Colorado Supreme Court
- **Science**: Curie's experimentation + modern bioengineering
- **Code**: Turing's logic + Lovelace's programming vision
- **Marketing**: Picasso's creative vision + Mozart's timing
- **Invention**: Da Vinci's interdisciplinary approach + Tesla's genius

## File Structure
```
src/
  components/
    AiToolsTab.tsx         — AI marketing tools (captions, scoring, trends)
    GeniusToolsTab.tsx     — Search + GoogliEyes Bot agent UI
    Layout.tsx             — App shell
  pages/
    MarketingDashboard.tsx — Main dashboard with all tabs
    Index.tsx              — Landing page
supabase/
  functions/
    genius-search/         — Multi-domain AI search
    googlieeyes-bot/       — MCP agent (8 tools)
    marketing-mcp/         — Marketing automation MCP
    marketing-ai/          — AI caption/scoring REST API
docs/
    README.md              — Project overview
    TECH_MANUAL.md         — This file
    USER_MANUAL.md         — End-user guide
    DATA_DICTIONARY.md     — Database schema reference
```
