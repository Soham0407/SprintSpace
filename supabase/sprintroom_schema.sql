CREATE TABLE IF NOT EXISTS sprintroom_messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sender_id    UUID NOT NULL REFERENCES profiles(id),
    content      TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprintroom_messages_workspace
    ON sprintroom_messages(workspace_id, created_at);

CREATE TABLE IF NOT EXISTS sprintroom_pins (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    created_by   UUID REFERENCES profiles(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprintroom_pins_workspace
    ON sprintroom_pins(workspace_id, created_at);

ALTER TABLE sprintroom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprintroom_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sprintroom_messages: member read"
    ON sprintroom_messages FOR SELECT
    USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

CREATE POLICY "sprintroom_messages: member insert"
ON sprintroom_messages FOR INSERT
    WITH CHECK (
    sender_id = auth.uid()
    AND (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id))
);

CREATE POLICY "sprintroom_pins: member read"
ON sprintroom_pins FOR SELECT
USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

CREATE POLICY "sprintroom_pins: member insert"
ON sprintroom_pins FOR INSERT
WITH CHECK (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

CREATE POLICY "sprintroom_pins: member delete"
ON sprintroom_pins FOR DELETE
USING (public.is_workspace_owner(workspace_id) OR public.is_workspace_member(workspace_id));

ALTER PUBLICATION supabase_realtime ADD TABLE sprintroom_messages;  