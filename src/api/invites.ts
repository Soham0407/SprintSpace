import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Invite, WorkspaceInvite } from './types';
import { MOCK_WORKSPACE } from './workspace';

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
    // ── Mock-mode limit checks ──
    const currentMembers = MOCK_WORKSPACE.team.length;
    const pendingInvites = mockStore.filter(
      (i) => i.workspaceId === workspaceId && i.status === 'pending'
    ).length;
    const maxMembers = 5;

    if (MOCK_WORKSPACE.team.some((m) => m.id === invitedUserId)) {
      throw new Error('This person is already a member of the workspace.');
    }
    if (currentMembers + pendingInvites >= maxMembers) {
      throw new Error(
        `Team is full. Limit: ${maxMembers} (${currentMembers} members + ${pendingInvites} pending invites).`
      );
    }

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

  // ── Real Supabase path ──
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated — please log in first.');

  // 1. Duplicate member check
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('profile_id', invitedUserId)
    .maybeSingle();
  if (existingMember) throw new Error('This person is already a member of the workspace.');

  // 2. Get max from competition
  const { data: wsData, error: wsError } = await supabase
    .from('workspaces')
    .select('competitions ( team_size )')
    .eq('id', workspaceId)
    .single();
  if (wsError || !wsData) throw new Error(wsError?.message ?? 'Workspace not found.');
  const teamSize = (wsData.competitions as any)?.team_size;
  const maxMembers = teamSize ? parseInt(teamSize, 10) : 4;

  // 3. Current member count
  const { count: memberCount, error: mcErr } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId);
  if (mcErr) throw new Error(mcErr.message);

  // 4. Pending invite count
  const { count: pendingCount, error: pcErr } = await supabase
    .from('invites')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending');
  if (pcErr) throw new Error(pcErr.message);

  // 5. Limit check
  if ((memberCount ?? 0) + (pendingCount ?? 0) >= maxMembers) {
    throw new Error(
      `Team is full. Limit: ${maxMembers} (${memberCount ?? 0} members + ${pendingCount ?? 0} pending invites).`
    );
  }

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
    const invite = mockStore.find((i) => i.id === id);
    mockStore = mockStore.map((i) => (i.id === id ? { ...i, status: 'accepted' } : i));
    // Add user to mock workspace team
    if (invite) {
      MOCK_WORKSPACE.team.push({
        id: `m-joined-${Date.now()}`,
        name: invite.invitedByName === 'You' ? 'New Teammate' : invite.invitedByName,
        role: 'Developer',
        progress: 0,
      });
    }
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

/**
 * Fetches every invite (pending + accepted) sent for a workspace.
 * Used by the workspace Invites section so the owner can see who has
 * been invited and whether they have joined yet.
 */
export async function getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
  if (!isSupabaseReady()) {
    return mockDelay(
      mockStore
        .filter((i) => i.status !== 'declined')
        .map((i) => ({
          id: i.id,
          workspaceId: i.workspaceId,
          userId: '',
          name: i.invitedByName,
          status: i.status === 'pending' ? 'pending' : 'accepted',
          createdAt: i.createdAt,
        }))
    );
  }

  const { data: rows, error } = await supabase
    .from('invites')
    .select('id, invited_user_id, status, created_at')
    .eq('workspace_id', workspaceId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  // Batch-look up invited user names from profiles
  const userIds = [...new Set(rows.map((r) => r.invited_user_id as string).filter(Boolean))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', userIds);

  const nameMap: Record<string, string> = {};
  for (const p of profiles ?? []) {
    if (p.name) nameMap[p.id] = p.name;
  }

  // Fallback: direct profiles reads are often restricted by RLS. Resolve any
  // remaining names through the candidates table (same join TeamMatch uses).
  const missingIds = userIds.filter((id) => !nameMap[id]);
  if (missingIds.length > 0) {
    const { data: cands } = await supabase
      .from('candidates')
      .select('id, profiles ( name )')
      .in('id', missingIds);

    for (const c of cands ?? []) {
      const profile = c.profiles as unknown as { name: string | null } | null;
      if (profile?.name) nameMap[c.id] = profile.name;
    }
  }

  return rows.map((row) => ({
    id: row.id as string,
    workspaceId,
    userId: row.invited_user_id as string,
    name: nameMap[row.invited_user_id as string] ?? 'Invited Member',
    status: row.status as WorkspaceInvite['status'],
    createdAt: row.created_at as string,
  }));
}

/** Cancels a pending invite by deleting its row, freeing up a team slot. */
export async function cancelInvite(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.filter((i) => i.id !== id);
    await mockDelay(null);
    return;
  }

  const { error } = await supabase.from('invites').delete().eq('id', id);
  if (error) throw new Error(error.message);
}