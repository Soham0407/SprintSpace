-- ═══════════════════════════════════════════════════════════════════════════
--  Sprint-Space — Supabase Database Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor → New Query
--  Order matters — run top to bottom.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
--  1. PROFILES  (extends auth.users)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  avatar_url  TEXT,
  country     TEXT,               -- ISO 3166-1 alpha-2 e.g. "IN"
  bio         TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
--  2. COMPETITIONS
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS competitions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  organizer   TEXT NOT NULL,
  category    TEXT NOT NULL,
  deadline    TIMESTAMPTZ NOT NULL,
  prize_pool  TEXT NOT NULL,
  team_size   TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitions_category ON competitions(category);
CREATE INDEX IF NOT EXISTS idx_competitions_deadline  ON competitions(deadline);


-- ───────────────────────────────────────────────────────────────────────────
--  3. CANDIDATES  (TeamMatch profiles)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS candidates (
  id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role_wanted TEXT NOT NULL,
  skills      TEXT[] NOT NULL DEFAULT '{}',
  available   BOOLEAN DEFAULT TRUE,
  match_score INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_available ON candidates(available);
CREATE INDEX IF NOT EXISTS idx_candidates_role      ON candidates(role_wanted);


-- ───────────────────────────────────────────────────────────────────────────
--  4. RESOURCES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_sections (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resource_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id TEXT NOT NULL REFERENCES resource_sections(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  meta       TEXT NOT NULL,
  href       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_items_section ON resource_items(section_id, sort_order);


-- ───────────────────────────────────────────────────────────────────────────
--  5. ARCHIVE  (Shipped Projects)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS archive_projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  competition    TEXT NOT NULL,
  competition_id UUID REFERENCES competitions(id),
  result         TEXT NOT NULL CHECK (result IN ('Winner', 'Finalist', 'Runner-up', 'Shipped')),
  stack          TEXT[] NOT NULL DEFAULT '{}',
  href           TEXT NOT NULL DEFAULT '#',
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_archive_result ON archive_projects(result);


-- ───────────────────────────────────────────────────────────────────────────
--  6. WORKSPACES
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id    UUID REFERENCES competitions(id),
  competition_name  TEXT NOT NULL,
  health_score      INTEGER DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
  progress_percent  INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  critical_blockers INTEGER DEFAULT 0,
  deadline          TIMESTAMPTZ NOT NULL,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kanban_columns (
  id           TEXT NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  sort_order   INTEGER DEFAULT 0,
  PRIMARY KEY (id, workspace_id)
);

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  column_id    TEXT NOT NULL,
  title        TEXT NOT NULL,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_workspace ON kanban_tasks(workspace_id, column_id);

CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  profile_id   UUID REFERENCES profiles(id),
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  progress     INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  UNIQUE (workspace_id, profile_id)
);

CREATE TABLE IF NOT EXISTS timeline_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  status       TEXT NOT NULL CHECK (status IN ('done', 'active', 'pending')),
  sort_order   INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_timeline_workspace ON timeline_steps(workspace_id, sort_order);


-- ───────────────────────────────────────────────────────────────────────────
--  7. COUNTRY STATS  (Globe on landing page)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS country_stats (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  active_users INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION refresh_country_stats()
RETURNS VOID AS $$
BEGIN
  INSERT INTO country_stats (country_code, country_name, active_users)
  SELECT p.country, p.country, COUNT(*)::INTEGER
  FROM profiles p
  WHERE p.country IS NOT NULL
  GROUP BY p.country
  ON CONFLICT (country_code) DO UPDATE
    SET active_users = EXCLUDED.active_users,
        updated_at   = NOW();
END;
$$ LANGUAGE plpgsql;


-- ───────────────────────────────────────────────────────────────────────────
--  8. WORKSPACE RPC  (returns full WorkspaceData in one round-trip)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_workspace(workspace_id UUID)
RETURNS JSON AS $$
DECLARE
  ws     workspaces%ROWTYPE;
  result JSON;
BEGIN
  SELECT * INTO ws FROM workspaces WHERE id = workspace_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace % not found', workspace_id;
  END IF;

  SELECT json_build_object(
    'competitionName',  ws.competition_name,
    'healthScore',      ws.health_score,
    'progressPercent',  ws.progress_percent,
    'criticalBlockers', ws.critical_blockers,
    'deadline',         ws.deadline,

    'kanban', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id',    kc.id,
          'label', kc.label,
          'tasks', (
            SELECT COALESCE(json_agg(
              json_build_object('id', kt.id::text, 'title', kt.title)
              ORDER BY kt.sort_order
            ), '[]'::json)
            FROM kanban_tasks kt
            WHERE kt.workspace_id = get_workspace.workspace_id
              AND kt.column_id = kc.id
          )
        ) ORDER BY kc.sort_order
      ), '[]'::json)
      FROM kanban_columns kc
      WHERE kc.workspace_id = get_workspace.workspace_id
    ),

    'team', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id',       wm.id::text,
          'name',     wm.name,
          'role',     wm.role,
          'progress', wm.progress
        )
      ), '[]'::json)
      FROM workspace_members wm
      WHERE wm.workspace_id = get_workspace.workspace_id
    ),

    'timeline', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id',     ts.id::text,
          'label',  ts.label,
          'status', ts.status
        ) ORDER BY ts.sort_order
      ), '[]'::json)
      FROM timeline_steps ts
      WHERE ts.workspace_id = get_workspace.workspace_id
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_steps      ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_stats       ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles: public read"
  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Competitions
CREATE POLICY "competitions: public read"
  ON competitions FOR SELECT USING (TRUE);
CREATE POLICY "competitions: authenticated insert"
  ON competitions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Candidates
CREATE POLICY "candidates: public read"
  ON candidates FOR SELECT USING (TRUE);
CREATE POLICY "candidates: own write"
  ON candidates FOR ALL USING (auth.uid() = id);

-- Resources (admin writes via service_role, everyone reads)
CREATE POLICY "resource_sections: public read"
  ON resource_sections FOR SELECT USING (TRUE);
CREATE POLICY "resource_items: public read"
  ON resource_items FOR SELECT USING (TRUE);

-- Archive
CREATE POLICY "archive: public read"
  ON archive_projects FOR SELECT USING (TRUE);
CREATE POLICY "archive: authenticated insert"
  ON archive_projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a helper function to break RLS infinite recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND profile_id = auth.uid()
  );
$$;

-- Workspaces (owner + members can read; owner can write)
CREATE POLICY "workspaces: member read"
  ON workspaces FOR SELECT
  USING (auth.uid() = created_by OR public.is_workspace_member(id));

CREATE POLICY "workspaces: owner write"
  ON workspaces FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "workspaces: owner insert"
  ON workspaces FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Kanban columns
CREATE POLICY "kanban_columns: member read"
  ON kanban_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = kanban_columns.workspace_id
        AND (w.created_by = auth.uid() OR public.is_workspace_member(w.id))
    )
  );

-- Kanban tasks
CREATE POLICY "kanban_tasks: member read/write"
  ON kanban_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = kanban_tasks.workspace_id
        AND (w.created_by = auth.uid() OR public.is_workspace_member(w.id))
    )
  );

-- Workspace members
CREATE POLICY "workspace_members: member read"
  ON workspace_members FOR SELECT
  USING (
    profile_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = workspace_members.workspace_id
        AND w.created_by = auth.uid()
    ) OR
    public.is_workspace_member(workspace_id)
  );

-- Timeline steps
CREATE POLICY "timeline_steps: member read/write"
  ON timeline_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.id = timeline_steps.workspace_id
        AND (w.created_by = auth.uid() OR public.is_workspace_member(w.id))
    )
  );

-- Country stats
CREATE POLICY "country_stats: public read"
  ON country_stats FOR SELECT USING (TRUE);


-- ═══════════════════════════════════════════════════════════════════════════
--  SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- Resource sections
INSERT INTO resource_sections (id, label, sort_order) VALUES
  ('pitch-decks', 'Pitch Decks',      1),
  ('design-kits', 'Design Kits',      2),
  ('boilerplate', 'Boilerplate Code', 3),
  ('mentorship',  'Mentorship',       4)
ON CONFLICT (id) DO NOTHING;

-- Resource items
INSERT INTO resource_items (section_id, title, meta, href, sort_order) VALUES
  ('pitch-decks', 'Winning Hackathon Pitch Template',   '12-slide deck · Figma', '#', 1),
  ('pitch-decks', 'Problem-Solution-Impact Framework',  'PDF guide',             '#', 2),
  ('pitch-decks', '2-Minute Demo Script Structure',     'Doc template',          '#', 3),
  ('design-kits', 'Dark Mode UI Kit',                   'Figma · 40 components', '#', 1),
  ('design-kits', 'Landing Page Wireframe Pack',        'Figma',                 '#', 2),
  ('design-kits', 'Icon Set — Line & Solid',            'SVG bundle',            '#', 3),
  ('boilerplate', 'React + Vite + Tailwind Starter',    'GitHub template',       '#', 1),
  ('boilerplate', 'Auth Flow (JWT + Refresh Tokens)',   'Node.js snippet',       '#', 2),
  ('boilerplate', 'FastAPI + PostgreSQL Boilerplate',   'GitHub template',       '#', 3),
  ('mentorship',  'Book a 20-min Mentor Call',          'Live scheduling',       '#', 1),
  ('mentorship',  'Judging Criteria Breakdown',         'Guide',                 '#', 2),
  ('mentorship',  'Common Pitfalls in Hackathon Demos', 'Article',               '#', 3)
ON CONFLICT DO NOTHING;

-- Sample competitions
INSERT INTO competitions (slug, name, organizer, category, deadline, prize_pool, team_size) VALUES
  ('web-wonders-2026',     'Web Wonders 2026',      'SVNIT Dev Council',                  'Web Dev',        NOW() + INTERVAL '6 days',  '₹50,000',   '2–4'),
  ('smart-india-hackathon','Smart India Hackathon',  'Ministry of Education, Govt. of India','Open Innovation',NOW() + INTERVAL '21 days','₹1,00,000', '6'),
  ('hackverse-4',          'HackVerse 4.0',          'IEEE Student Chapter',               'AI/ML',          NOW() + INTERVAL '10 days', '₹30,000',   '2–5'),
  ('finflow-hacks',        'FinFlow Hacks',          'Razorpay x College Consortium',      'Fintech',        NOW() + INTERVAL '14 days', '₹75,000',   '3–4'),
  ('greencode-sprint',     'GreenCode Sprint',       'Sustainability Cell',                'Sustainability', NOW() + INTERVAL '30 days', '₹40,000',   '2–4'),
  ('codestorm-autumn',     'CodeStorm Autumn',       'GDG Campus Chapter',                'AI/ML',          NOW() + INTERVAL '5 days',  '₹25,000',   '1–4')
ON CONFLICT (slug) DO NOTHING;

-- Sample archive projects
INSERT INTO archive_projects (name, competition, result, stack, href) VALUES
  ('Repo Replay',   'HackVerse 3.0',         'Winner',    ARRAY['Next.js','Clerk','Framer Motion'],     '#'),
  ('Foldcraft',     'CodeStorm Spring',      'Finalist',  ARRAY['React','Tailwind','Framer Motion'],    '#'),
  ('CampusConnect', 'Smart India Hackathon', 'Shipped',   ARRAY['React','Node.js','MongoDB'],           '#'),
  ('EcoTrack',      'GreenCode Sprint',      'Runner-up', ARRAY['Vue','FastAPI','PostgreSQL'],           '#'),
  ('StudyBuddy AI', 'HackVerse 4.0',         'Shipped',   ARRAY['React','OpenAI API','Supabase'],       '#'),
  ('PayLoop',       'FinFlow Hacks',         'Finalist',  ARRAY['Next.js','Razorpay','Prisma'],         '#')
ON CONFLICT DO NOTHING;
