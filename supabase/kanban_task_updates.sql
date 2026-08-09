-- ═══════════════════════════════════════════════════════════════════════════
--  Kanban Tasks — add fields needed for assignment + completion tracking
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Prerequisite: supabase/schema.sql already run.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS assigned_to  UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date     DATE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assigned ON kanban_tasks(assigned_to);
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
              json_build_object(
                'id',          kt.id::text,
                'title',       kt.title,
                'assignedTo',  kt.assigned_to::text,
                'dueDate',     kt.due_date,
                'completedAt', kt.completed_at
              )
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