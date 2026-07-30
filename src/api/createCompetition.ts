import { supabase } from '../lib/supabaseClient';

export interface CreateCompetitionInput {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  description: string;
  maxMembers: number;
}

/**
 * Creates a competition + linked workspace + owner membership row.
 * Invitations are NOT handled here — that's a later phase.
 * Returns the new workspace id.
 */
export async function createCompetition(input: CreateCompetitionInput): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated — please log in first.');
  if (!input.name.trim()) throw new Error('Competition name is required.');
  if (!input.endDate) throw new Error('End date is required.');
  if (input.maxMembers < 1) throw new Error('Maximum members must be a positive number.');

  const ownerName = (user.user_metadata?.name as string | undefined) ?? user.email ?? 'You';
  const slug = `${input.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  // 1. competitions
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .insert({
      slug,
      name: input.name,
      organizer: ownerName,
      category: input.type,
      deadline: input.endDate,
      prize_pool: 'TBD',
      team_size: String(input.maxMembers),
      description: input.description || null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (compError) throw new Error(compError.message);

  // 2. workspaces
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      competition_id: competition.id,
      competition_name: input.name,
      health_score: 0,
      progress_percent: 0,
      critical_blockers: 0,
      deadline: input.endDate,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (wsError) throw new Error(wsError.message);

  // 3. workspace_members — creator as Owner
  /*const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    profile_id: user.id,
    name: ownerName,
    role: 'Owner',
    progress: 0,
  });

  if (memberError) throw new Error(memberError.message);*/

    const { error: kanbanError } = await supabase
  .from("kanban_columns")
  .insert([
    {
      id: "todo",
      workspace_id: workspace.id,
      label: "To Do",
      sort_order: 1,
    },
    {
      id: "in-progress",
      workspace_id: workspace.id,
      label: "In Progress",
      sort_order: 2,
    },
    {
      id: "done",
      workspace_id: workspace.id,
      label: "Done",
      sort_order: 3,
    },
  ]);

if (kanbanError) throw new Error(kanbanError.message);

  const { error: timelineError } = await supabase
  .from("timeline_steps")
  .insert([
    {
      workspace_id: workspace.id,
      label: "Idea Finalization",
      status: "active",
      sort_order: 1,
    },
    {
      workspace_id: workspace.id,
      label: "Planning",
      status: "pending",
      sort_order: 2,
    },
    {
      workspace_id: workspace.id,
      label: "Development",
      status: "pending",
      sort_order: 3,
    },
    {
      workspace_id: workspace.id,
      label: "Testing",
      status: "pending",
      sort_order: 4,
    },
    {
      workspace_id: workspace.id,
      label: "Submission",
      status: "pending",
      sort_order: 5,
    },
    {
      workspace_id: workspace.id,
      label: "Presentation",
      status: "pending",
      sort_order: 6,
    },
  ]);

if (timelineError) throw new Error(timelineError.message);

  return workspace.id as string;
}