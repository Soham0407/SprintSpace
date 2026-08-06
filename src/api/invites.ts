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
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

function mapRow(row: Record<string, any>): Invite {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    competitionName: row.competition_name as string,
    invitedByName: row.invited_by_name as string,
    status: row.status as Invite['status'],
    createdAt: row.created_at as string,
  };
}

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

  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('invited_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

/** Accepts an invite — joins the workspace it points to. */
export async function acceptInvite(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.map((i) => (i.id === id ? { ...i, status: 'accepted' } : i));
    await mockDelay(null);
    return;
  }

  const { error } = await supabase.from('invites').update({ status: 'accepted' }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Declines an invite. */
export async function declineInvite(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.map((i) => (i.id === id ? { ...i, status: 'declined' } : i));
    await mockDelay(null);
    return;
  }

  const { error } = await supabase.from('invites').update({ status: 'declined' }).eq('id', id);
  if (error) throw new Error(error.message);
}