-- ═══════════════════════════════════════════════════════════════════════════
--  Sprint-Space — Supabase Database RLS Policies Update
--  Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. DROP EXISTING WORKSPACE-RELATED POLICIES
DROP POLICY IF EXISTS "profiles: own delete" ON profiles;
DROP POLICY IF EXISTS "competitions: owner update" ON competitions;
DROP POLICY IF EXISTS "competitions: owner delete" ON competitions;

DROP POLICY IF EXISTS "workspaces: member read" ON workspaces;
DROP POLICY IF EXISTS "workspaces: owner write" ON workspaces;
DROP POLICY IF EXISTS "workspaces: owner insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces: select" ON workspaces;
DROP POLICY IF EXISTS "workspaces: insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces: update" ON workspaces;
DROP POLICY IF EXISTS "workspaces: delete" ON workspaces;

DROP POLICY IF EXISTS "kanban_columns: member read" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns: select" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns: insert" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns: update" ON kanban_columns;
DROP POLICY IF EXISTS "kanban_columns: delete" ON kanban_columns;

DROP POLICY IF EXISTS "kanban_tasks: member read/write" ON kanban_tasks;
DROP POLICY IF EXISTS "kanban_tasks: select" ON kanban_tasks;
DROP POLICY IF EXISTS "kanban_tasks: insert" ON kanban_tasks;
DROP POLICY IF EXISTS "kanban_tasks: update" ON kanban_tasks;
DROP POLICY IF EXISTS "kanban_tasks: delete" ON kanban_tasks;

DROP POLICY IF EXISTS "workspace_members: member read" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members: select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members: insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members: update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members: delete" ON workspace_members;

DROP POLICY IF EXISTS "timeline_steps: member read/write" ON timeline_steps;
DROP POLICY IF EXISTS "timeline_steps: select" ON timeline_steps;
DROP POLICY IF EXISTS "timeline_steps: insert" ON timeline_steps;
DROP POLICY IF EXISTS "timeline_steps: update" ON timeline_steps;
DROP POLICY IF EXISTS "timeline_steps: delete" ON timeline_steps;

-- 2. UPDATE/CREATE RECURSION BREAKERS (SECURITY DEFINER PL/PGSQL FUNCTIONS)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND profile_id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = ws_id AND created_by = auth.uid()
  );
END;
$$;

-- 3. SECURE WORKSPACE RPC
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

  -- Verify authorization: owner or workspace member
  IF ws.created_by != auth.uid() AND NOT public.is_workspace_member(workspace_id) THEN
    RAISE EXCEPTION 'Access denied to workspace %', workspace_id;
  END IF;

  SELECT json_build_object(
    'competitionId',    ws.competition_id,
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. CREATE NEW COMPLETE CRUD POLICIES
-- Profiles
CREATE POLICY "profiles: own delete"
  ON profiles FOR DELETE USING (auth.uid() = id);

-- Competitions
CREATE POLICY "competitions: owner update"
  ON competitions FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "competitions: owner delete"
  ON competitions FOR DELETE USING (auth.uid() = created_by);

-- Workspaces
CREATE POLICY "workspaces: select"
  ON workspaces FOR SELECT USING (auth.uid() = created_by OR public.is_workspace_member(id));
CREATE POLICY "workspaces: insert"
  ON workspaces FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = created_by);
CREATE POLICY "workspaces: update"
  ON workspaces FOR UPDATE USING (auth.uid() = created_by OR public.is_workspace_member(id))
  WITH CHECK (auth.uid() = created_by OR public.is_workspace_member(id));
CREATE POLICY "workspaces: delete"
  ON workspaces FOR DELETE USING (auth.uid() = created_by);

-- Kanban columns
CREATE POLICY "kanban_columns: select"
  ON kanban_columns FOR SELECT USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_columns: insert"
  ON kanban_columns FOR INSERT WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_columns: update"
  ON kanban_columns FOR UPDATE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_columns: delete"
  ON kanban_columns FOR DELETE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

-- Kanban tasks
CREATE POLICY "kanban_tasks: select"
  ON kanban_tasks FOR SELECT USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_tasks: insert"
  ON kanban_tasks FOR INSERT WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_tasks: update"
  ON kanban_tasks FOR UPDATE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "kanban_tasks: delete"
  ON kanban_tasks FOR DELETE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

-- Workspace members
CREATE POLICY "workspace_members: select"
  ON workspace_members FOR SELECT USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id) OR profile_id = auth.uid());
CREATE POLICY "workspace_members: insert"
  ON workspace_members FOR INSERT WITH CHECK (public.is_workspace_owner(workspace_id) OR profile_id = auth.uid());
CREATE POLICY "workspace_members: update"
  ON workspace_members FOR UPDATE USING (public.is_workspace_owner(workspace_id) OR profile_id = auth.uid())
  WITH CHECK (public.is_workspace_owner(workspace_id) OR profile_id = auth.uid());
CREATE POLICY "workspace_members: delete"
  ON workspace_members FOR DELETE USING (public.is_workspace_owner(workspace_id) OR profile_id = auth.uid());

-- Timeline steps
CREATE POLICY "timeline_steps: select"
  ON timeline_steps FOR SELECT USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "timeline_steps: insert"
  ON timeline_steps FOR INSERT WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "timeline_steps: update"
  ON timeline_steps FOR UPDATE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
CREATE POLICY "timeline_steps: delete"
  ON timeline_steps FOR DELETE USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));
