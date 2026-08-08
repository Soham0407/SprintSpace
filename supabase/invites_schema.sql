-- ══════════════════════════════════════════════════════════════
--  INVITES — Clean reset. Run this in Supabase SQL editor.
--  Safe to run multiple times.
-- ══════════════════════════════════════════════════════════════

-- 1. DROP existing table (cascade removes indexes, policies, FKs)
DROP TABLE IF EXISTS public.invites CASCADE;

-- 2. CREATE TABLE with correct full schema
CREATE TABLE public.invites (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id)  ON DELETE CASCADE,
  invited_user_id  UUID        NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  invited_by       UUID        NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  competition_name TEXT        NOT NULL DEFAULT '',
  description      TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique: one pending invite per user per workspace (reuse on re-invite after decline)
CREATE UNIQUE INDEX idx_invites_unique_pending
  ON public.invites (workspace_id, invited_user_id)
  WHERE status = 'pending';

CREATE INDEX idx_invites_invited_user ON public.invites(invited_user_id, status);
CREATE INDEX idx_invites_workspace    ON public.invites(workspace_id);

-- 3. RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Invitee sees their own invites
DROP POLICY IF EXISTS "invites: own read"        ON public.invites;
CREATE POLICY "invites: own read"
  ON public.invites FOR SELECT
  USING (invited_user_id = auth.uid());

-- Sender inserts (invited_by must be the current user)
DROP POLICY IF EXISTS "invites: sender insert"   ON public.invites;
DROP POLICY IF EXISTS "invites: owner insert"    ON public.invites;
CREATE POLICY "invites: sender insert"
  ON public.invites FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Invitee updates their status (accept / decline)
DROP POLICY IF EXISTS "invites: own update status" ON public.invites;
CREATE POLICY "invites: own update status"
  ON public.invites FOR UPDATE
  USING  (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- 4. ACCEPT INVITE RPC
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite  invites%ROWTYPE;
  v_name    TEXT;
  v_role    TEXT;
BEGIN
  -- Lock & fetch the invite that belongs to the caller
  SELECT * INTO v_invite
    FROM invites
   WHERE id = invite_id
     AND invited_user_id = auth.uid()
     AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already handled (id: %)', invite_id;
  END IF;

  -- Invitee name from profiles
  SELECT name INTO v_name FROM profiles WHERE id = auth.uid();

  -- Role from candidates (optional — falls back to Member)
  SELECT COALESCE(role_wanted, 'Member') INTO v_role
    FROM candidates WHERE id = auth.uid();

  -- Mark accepted
  UPDATE invites SET status = 'accepted' WHERE id = invite_id;

  -- Add to workspace (idempotent)
  INSERT INTO workspace_members (workspace_id, profile_id, name, role, progress)
  VALUES (
    v_invite.workspace_id,
    auth.uid(),
    COALESCE(v_name, 'Member'),
    COALESCE(v_role, 'Member'),
    0
  )
  ON CONFLICT (workspace_id, profile_id) DO NOTHING;
END;
$$;
