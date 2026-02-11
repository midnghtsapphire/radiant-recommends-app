
-- Campaign tracking table with analytics
CREATE TABLE public.campaign_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT true,
  affiliate_tag TEXT DEFAULT 'meetaudreyeva-20',
  affiliate_links JSONB DEFAULT '[]',
  platforms JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  -- Analytics
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  -- Projections
  probability_score NUMERIC(5,2) DEFAULT 0,
  projected_monthly_revenue_cents INTEGER DEFAULT 0,
  days_to_target INTEGER DEFAULT 0,
  target_revenue_cents INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns" ON public.campaign_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own campaigns" ON public.campaign_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.campaign_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.campaign_tracking FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_campaign_tracking_updated_at
  BEFORE UPDATE ON public.campaign_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto affiliate links table
CREATE TABLE public.auto_affiliate_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_category TEXT DEFAULT 'hair care',
  amazon_url TEXT,
  affiliate_url TEXT NOT NULL,
  affiliate_tag TEXT DEFAULT 'meetaudreyeva-20',
  ranking_score NUMERIC(5,2) DEFAULT 0,
  estimated_commission_pct NUMERIC(5,2) DEFAULT 4.0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  emailed BOOLEAN DEFAULT false,
  emailed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own links" ON public.auto_affiliate_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own links" ON public.auto_affiliate_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON public.auto_affiliate_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON public.auto_affiliate_links FOR DELETE USING (auth.uid() = user_id);
