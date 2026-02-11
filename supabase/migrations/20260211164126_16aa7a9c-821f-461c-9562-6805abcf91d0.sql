
-- Marketing products table
CREATE TABLE public.marketing_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'hair_care', -- hair_care, own_product, affiliate
  description TEXT,
  score NUMERIC DEFAULT 0, -- ranking score 0-100
  priority INTEGER DEFAULT 0, -- manual priority override
  target_state TEXT,
  target_county TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, marketing, completed, paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.marketing_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON public.marketing_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.marketing_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.marketing_products FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_marketing_products_updated_at BEFORE UPDATE ON public.marketing_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaign posts table
CREATE TABLE public.campaign_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.marketing_products(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, -- instagram, facebook, tiktok, twitter
  caption TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, posted, failed
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  engagement_clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0, -- ad spend in cents
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts" ON public.campaign_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON public.campaign_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.campaign_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.campaign_posts FOR DELETE USING (auth.uid() = user_id);

-- Marketing expenses table for accounting
CREATE TABLE public.marketing_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.marketing_products(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'ad_spend', -- ad_spend, content_creation, tools, other
  description TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  tax_deductible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" ON public.marketing_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.marketing_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.marketing_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.marketing_expenses FOR DELETE USING (auth.uid() = user_id);
