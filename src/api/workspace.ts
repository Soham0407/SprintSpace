import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { WorkspaceData } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_WORKSPACE: WorkspaceData = {
  competitionName: 'Web Wonders 2026',
  healthScore: 87,
  progressPercent: 78,
  criticalBlockers: 2,
  deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000).toISOString(),
  kanban: [
    {
      id: 'todo',
      label: 'To Do',
      tasks: [
        { id: 't1', title: 'Landing Page' },
        { id: 't2', title: 'Presentation' },
        { id: 't3', title: 'Testing' },
      ],
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      tasks: [
        { id: 't4', title: 'Authentication' },
        { id: 't5', title: 'Dashboard' },
        { id: 't6', title: 'AI Context Setup' },
      ],
    },
    {
      id: 'done',
      label: 'Done',
      tasks: [
        { id: 't7', title: 'Database' },
        { id: 't8', title: 'Login' },
      ],
    },
  ],
  team: [
    { id: 'm1', name: 'Rahul',  role: 'Frontend',      progress: 90 },
    { id: 'm2', name: 'Priya',  role: 'Backend',       progress: 70 },
    { id: 'm3', name: 'Anjali', role: 'AI Module',     progress: 40 },
    { id: 'm4', name: 'Rohit',  role: 'Documentation', progress: 60 },
  ],
  timeline: [
    { id: 'ti1', label: 'Problem Analysis',  status: 'done'    },
    { id: 'ti2', label: 'UI Design',         status: 'done'    },
    { id: 'ti3', label: 'Database Setup',    status: 'done'    },
    { id: 'ti4', label: 'Backend APIs',      status: 'active'  },
    { id: 'ti5', label: 'AI Integration',    status: 'pending' },
    { id: 'ti6', label: 'Testing',           status: 'pending' },
    { id: 'ti7', label: 'Deployment',        status: 'pending' },
    { id: 'ti8', label: 'Final Presentation',status: 'pending' },
  ],
};

// ─── API function ─────────────────────────────────────────────────────────────
/**
 * Fetches a workspace by ID.
 * If no workspaceId is given, it returns the first workspace owned by
 * the current logged-in user.
 *
 * Uses a Supabase RPC (PostgreSQL function) that joins all 4 sub-tables
 * and returns the exact WorkspaceData shape the frontend expects.
 *
 * See the backend_guide.md → §8 for the full SQL to create the RPC.
 */
export async function getWorkspace(workspaceId?: string): Promise<WorkspaceData> {
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_WORKSPACE);
  }

  let resolvedId = workspaceId;

  // If no ID supplied, find the current user's first workspace
  if (!resolvedId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated — please log in first.');

    const { data: ws, error: wsErr } = await supabase
      .from('workspaces')
      .select('id')
      .eq('created_by', user.id)
      .limit(1)
      .maybeSingle();

    if (wsErr) throw new Error(wsErr.message);
    if (!ws) {
      console.warn('No workspace found in Supabase for this user. Falling back to the demo workspace.');
      return mockDelay(MOCK_WORKSPACE);
    }

    resolvedId = ws.id as string;
  }

  // Call the Postgres RPC that builds the full WorkspaceData JSON
  const { data, error } = await supabase.rpc('get_workspace', {
    workspace_id: resolvedId,
  });

  if (error) throw new Error(error.message);
  return data as WorkspaceData;
}
