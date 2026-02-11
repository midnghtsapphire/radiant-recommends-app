# Data Dictionary — AgelessGeno Suite

## Tables

### marketing_products
Primary table for product marketing queue management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | — | Owner user ID |
| product_name | TEXT | NO | — | Product display name |
| product_type | TEXT | NO | 'hair_care' | Enum: hair_care, own_product, affiliate |
| description | TEXT | YES | NULL | Product description |
| score | INTEGER | YES | 50 | Marketing priority score (0-100) |
| priority | INTEGER | YES | NULL | Manual priority override |
| status | TEXT | NO | 'queued' | Enum: queued, marketing, paused, completed |
| target_state | TEXT | YES | NULL | US state for geo-targeting |
| target_county | TEXT | YES | NULL | County for geo-targeting |
| created_at | TIMESTAMPTZ | NO | now() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | now() | Last update time |

### campaign_posts
Social media campaign posts linked to products.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | — | Owner user ID |
| product_id | UUID | NO | — | FK → marketing_products.id |
| platform | TEXT | NO | — | Enum: instagram, facebook, tiktok, twitter |
| caption | TEXT | NO | — | Post content |
| status | TEXT | NO | 'draft' | Enum: draft, scheduled, posted, archived |
| spend_cents | INTEGER | YES | 0 | Ad spend in cents (USD) |
| engagement_likes | INTEGER | YES | 0 | Like count |
| engagement_comments | INTEGER | YES | 0 | Comment count |
| engagement_shares | INTEGER | YES | 0 | Share count |
| engagement_clicks | INTEGER | YES | 0 | Click count |
| reach | INTEGER | YES | 0 | Total impressions |
| scheduled_at | TIMESTAMPTZ | YES | NULL | Scheduled post time |
| posted_at | TIMESTAMPTZ | YES | NULL | Actual post time |
| created_at | TIMESTAMPTZ | NO | now() | Record creation time |

### marketing_expenses
Expense tracking for accounting and tax purposes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | — | Owner user ID |
| description | TEXT | NO | — | Expense description |
| amount_cents | INTEGER | NO | — | Amount in cents (USD) |
| category | TEXT | NO | 'other' | Enum: ad_spend, content_creation, tools, other |
| product_id | UUID | YES | NULL | Optional FK → marketing_products.id |
| expense_date | DATE | NO | CURRENT_DATE | Date of expense |
| tax_deductible | BOOLEAN | YES | false | Tax deduction flag |
| receipt_url | TEXT | YES | NULL | Receipt file URL |
| created_at | TIMESTAMPTZ | NO | now() | Record creation time |

### profiles
User profile information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | — | Primary key (matches auth.users.id) |
| email | TEXT | YES | NULL | User email |
| premium | BOOLEAN | NO | false | Premium subscription status |
| hair_type_preference | TEXT | YES | NULL | User's hair type preference |
| created_at | TIMESTAMPTZ | NO | now() | Profile creation time |
| updated_at | TIMESTAMPTZ | NO | now() | Last update time |

### saved_analyses
Saved hair product analyses.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | — | Owner user ID |
| analysis_name | TEXT | NO | — | Analysis display name |
| analysis_data | JSONB | NO | — | Full analysis data |
| created_at | TIMESTAMPTZ | NO | now() | Record creation time |

## Relationships

```
marketing_products.id ←─── campaign_posts.product_id
marketing_products.id ←─── marketing_expenses.product_id
```

## RLS Policies

All tables have Row Level Security enabled. Users can only access their own data (`auth.uid() = user_id`).

## Edge Function APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /genius-search | GET | No | Service info |
| /genius-search | POST | No | AI search query |
| /googlieeyes-bot | GET | No | Bot info |
| /googlieeyes-bot/mcp | POST | No | MCP tool calls |
| /marketing-mcp | GET | No | Marketing MCP info |
| /marketing-mcp/mcp | POST | No | Marketing MCP tool calls |
| /marketing-ai | GET | No | Available AI models |
| /marketing-ai | POST | No | AI actions (caption, score, trends) |
