-- ═══════════════════════════════════════════════════════════════════════════
--  Archive Backend — Schema Updates
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Prerequisite: supabase/schema.sql has already been run once.
--  This file only ADDS to archive_projects — it never touches other tables.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Link an archive entry back to the workspace it was created from (nullable —
--    an archive can also be created "manually" without a live workspace record),
--    and add the soft-delete marker.
ALTER TABLE archive_projects
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id),
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_archive_deleted_at ON archive_projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_archive_workspace  ON archive_projects(workspace_id);

-- 2. RLS: the existing "public read" and "authenticated insert" policies from
--    schema.sql are untouched. We only add what's new — owners need to be able
--    to soft-delete/restore (UPDATE) and permanently delete (DELETE) their own
--    archived projects.
DROP POLICY IF EXISTS "archive: owner update" ON archive_projects;
CREATE POLICY "archive: owner update"
  ON archive_projects FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "archive: owner delete" ON archive_projects;
CREATE POLICY "archive: owner delete"
  ON archive_projects FOR DELETE
  USING (auth.uid() = created_by);