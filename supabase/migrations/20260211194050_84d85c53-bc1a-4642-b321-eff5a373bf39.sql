
-- Tool Repository: stores complete production-ready assets per tool/event
CREATE TABLE public.tool_repository (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  event_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Generated assets
  data_dictionary JSONB,
  db_schema TEXT,
  db_migration_sql TEXT,
  roadmap JSONB,
  blueprint JSONB,
  project_plan JSONB,
  source_code TEXT,
  api_spec JSONB,
  master_prompt TEXT,
  readme TEXT,
  -- Metadata
  model_used TEXT,
  generation_duration_ms INTEGER,
  is_implemented BOOLEAN NOT NULL DEFAULT false,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tool_repository ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tool_repo_user ON public.tool_repository(user_id);
CREATE INDEX idx_tool_repo_status ON public.tool_repository(status);

CREATE POLICY "Users view own repo" ON public.tool_repository FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own repo" ON public.tool_repository FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own repo" ON public.tool_repository FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own repo" ON public.tool_repository FOR DELETE USING (auth.uid() = user_id);
