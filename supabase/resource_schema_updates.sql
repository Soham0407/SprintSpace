-- ═══════════════════════════════════════════════════════════════════════════
--  Resources Backend — Schema Updates
--  Run in: Supabase Dashboard → SQL Editor → New Query
--  Prerequisite: supabase/schema.sql has already been run once.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,
  category    TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "resources: public read" ON resources;
CREATE POLICY "resources: public read"
  ON resources FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "resources: authenticated insert" ON resources;
CREATE POLICY "resources: authenticated insert"
  ON resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "resources: owner update" ON resources;
CREATE POLICY "resources: owner update"
  ON resources FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "resources: owner delete" ON resources;
CREATE POLICY "resources: owner delete"
  ON resources FOR DELETE
  USING (auth.uid() = created_by);

-- 4. Seed resource data if table is empty
INSERT INTO resources (title, description, url, category, tags)
SELECT 'Rulebook.pdf', 'Official competition rulebook and guidelines', 'https://example.com/rulebook.pdf', 'Rulebook', ARRAY['official', 'guidelines']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Rulebook.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Problem Statement.pdf', 'Detailed problem statement and project requirements', 'https://example.com/problem_statement.pdf', 'Rulebook', ARRAY['official', 'requirements']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Problem Statement.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Submission Guidelines.pdf', 'Instructions for submitting your final project', 'https://example.com/submission_guidelines.pdf', 'Rulebook', ARRAY['official', 'submission']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Submission Guidelines.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Judging Criteria.pdf', 'Rubric and guidelines used by the judges', 'https://example.com/judging_criteria.pdf', 'Rulebook', ARRAY['official', 'judging']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Judging Criteria.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Timeline.pdf', 'Important dates, milestones, and deadlines', 'https://example.com/timeline.pdf', 'Rulebook', ARRAY['official', 'schedule']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Timeline.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Research.pdf', 'Market analysis and user research findings', 'https://example.com/research.pdf', 'Project File', ARRAY['research', 'user-study']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Research.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Architecture.pdf', 'Technical architecture and system design document', 'https://example.com/architecture.pdf', 'Project File', ARRAY['design', 'technical']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Architecture.pdf');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'Presentation.pptx', 'Final pitch presentation deck', 'https://example.com/presentation.pptx', 'Project File', ARRAY['pitch', 'slides']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'Presentation.pptx');

INSERT INTO resources (title, description, url, category, tags)
SELECT 'UI Design.fig', 'Figma prototypes and component library links', 'https://figma.com/file/sprintspace', 'Project File', ARRAY['ui', 'ux', 'design']
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE title = 'UI Design.fig');


-- 5. Create storage bucket for resources if not exists
INSERT INTO storage.buckets (id, name, public)
SELECT 'resources', 'resources', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'resources'
);

-- 6. Storage Policies for 'resources' bucket
-- Allow public select on files in resources bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'resources');

-- Allow authenticated insert
DROP POLICY IF EXISTS "Authenticated Insert Access" ON storage.objects;
CREATE POLICY "Authenticated Insert Access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' AND 
    auth.role() = 'authenticated'
  );

-- Allow authenticated update/delete
DROP POLICY IF EXISTS "Authenticated Owner Delete Update" ON storage.objects;
CREATE POLICY "Authenticated Owner Delete Update" ON storage.objects
  FOR ALL USING (
    bucket_id = 'resources' AND 
    auth.role() = 'authenticated'
  );

