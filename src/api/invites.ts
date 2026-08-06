import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Invite } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
let mockStore: Invite[] = [
  {
    id: 'inv1',
    workspaceId: 'mock-workspace-1',
    competitionName: 'Web Wonders 2026',
    invitedByName: 'Aira',
    description: 'A web dev competition focused on creative UI/UX.',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetches every pending invite for the current logged-in user. */
export async function getMyInvites(): Promise<Invite[]> {
  if (!isSupabaseReady()) {
    return mockDelay(mockStore.filter((i) => i.status === 'pending'));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated — please log in first.');

  // Step 1: Fetch raw invite rows (no join — avoids ambiguous FK issue with two profiles FKs)
  const { data: rows, error } = await supabase
    .from('invites')
    .select('id, workspace_id, competition_name, description, status, created_at, invited_by')
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  // Step 2: Batch-look up inviter names from profiles
  const inviterIds = [...new Set(rows.map((r) => r.invited_by as string).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', inviterIds);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    nameMap[p.id] = p.name;
  }

  return rows.map((row) => ({
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    competitionName: row.competition_name as string,
    invitedByName: nameMap[row.invited_by as string] ?? 'Someone',
    description: (row.description as string | null) ?? null,
    status: row.status as Invite['status'],
    createdAt: row.created_at as string,
  }));
}

/**
 * Sends an invite to a user for a workspace.
 * Called by NewCompetitionPage after the workspace is created.
 */
export async function sendInvite(
  workspaceId: string,
  invitedUserId: string,
  competitionName: string,
  description?: string,
): Promise<void> {
  if (!isSupabaseReady()) {
    const mockInvite: Invite = {
      id: `inv-${Date.now()}`,
      workspaceId,
      competitionName,
      invitedByName: 'You',
      description: description ?? null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    mockStore = [...mockStore, mockInvite];
    await mockDelay(null);
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated — please log in first.');

  const { error } = await supabase.from('invites').insert({
    workspace_id: workspaceId,
    invited_user_id: invitedUserId,
    invited_by: user.id,
    competition_name: competitionName,
    description: description ?? null,
    status: 'pending',
  });

  // Ignore unique constraint violations (already invited)
  if (error && !error.message.includes('duplicate') && !error.code?.includes('23505')) {
    console.error('[sendInvite] error:', error);
    throw new Error(error.message);
  }
}

/**
 * Accepts an invite — calls the Postgres RPC that atomically:
 *  1. Marks invite as 'accepted'
 *  2. Inserts user into workspace_members
 *  3. Sets candidates.available = false
 */
export async function acceptInvite(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.map((i) => (i.id === id ? { ...i, status: 'accepted' } : i));
    await mockDelay(null);
    return;
  }

  const { error } = await supabase.rpc('accept_invite', { invite_id: id });
  if (error) throw new Error(error.message);
}

/** Declines an invite — updates status to 'declined'. */
export async function declineInvite(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.map((i) => (i.id === id ? { ...i, status: 'declined' } : i));
    await mockDelay(null);
    return;
  }

  const { error } = await supabase
    .from('invites')
    .update({ status: 'declined' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}