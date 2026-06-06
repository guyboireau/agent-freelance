-- ============================================================================
-- Row Level Security (RLS) setup for agent-freelance
-- CRITICAL: These statements must be executed in the Supabase SQL Editor.
-- RLS cannot be enabled via application code alone.
-- ============================================================================

-- Enable RLS on main tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_projects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Example policies (adapt to your actual auth / business logic)
-- ----------------------------------------------------------------------------

-- prospects: users can only access their own records
-- CREATE POLICY "Users can manage own prospects"
--   ON prospects
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- briefs: users can only access their own records
-- CREATE POLICY "Users can manage own briefs"
--   ON briefs
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- quotes: users can only access their own records
-- CREATE POLICY "Users can manage own quotes"
--   ON quotes
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- messages: users can only access their own records
-- CREATE POLICY "Users can manage own messages"
--   ON messages
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- documents: users can only access their own records
-- CREATE POLICY "Users can manage own documents"
--   ON documents
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- past_projects: users can only access their own records
-- CREATE POLICY "Users can manage own past_projects"
--   ON past_projects
--   FOR ALL
--   TO authenticated
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- IMPORTANT
-- ----------------------------------------------------------------------------
-- 1. Replace `user_id` with the actual foreign-key column referencing auth.users.
-- 2. If a table is meant to be publicly readable, use a SELECT policy FOR anon.
-- 3. Always verify policies with the Supabase Policy Editor before shipping.
-- 4. Never expose service_role key to the browser — it bypasses RLS entirely.
-- ============================================================================
