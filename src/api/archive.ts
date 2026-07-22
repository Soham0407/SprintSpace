import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { ArchiveProject, CreateArchiveInput } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// Kept in one place so every read (list / by-id) stays in sync with the DB shape.
const ARCHIVE_COLUMNS =
  'id, name, competition, competition_id, workspace_id, result, stack, href, created_at, deleted_at';

function mapRow(row: Record<string, unknown>): ArchiveProject {
  return {
    id: row.id as string,
    name: row.name as string,
    competition: row.competition as string,
    competitionId: (row.competition_id as string) ?? undefined,
    workspaceId: (row.workspace_id as string) ?? undefined,
    result: row.result as ArchiveProject['result'],
    stack: (row.stack as string[]) ?? [],
    href: row.href as string,
    createdAt: row.created_at as string,
    deletedAt: (row.deleted_at as string | null) ?? null,
  };
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: ArchiveProject[] = [
  { id: 'p1', name: 'Repo Replay',    competition: 'HackVerse 3.0',         result: 'Winner',    stack: ['Next.js', 'Clerk', 'Framer Motion'],       href: '#', deletedAt: null },
  { id: 'p2', name: 'Foldcraft',      competition: 'CodeStorm Spring',       result: 'Finalist',  stack: ['React', 'Tailwind', 'Framer Motion'],       href: '#', deletedAt: null },
  { id: 'p3', name: 'CampusConnect',  competition: 'Smart India Hackathon',  result: 'Shipped',   stack: ['React', 'Node.js', 'MongoDB'],              href: '#', deletedAt: null },
  { id: 'p4', name: 'EcoTrack',       competition: 'GreenCode Sprint',       result: 'Runner-up', stack: ['Vue', 'FastAPI', 'PostgreSQL'],             href: '#', deletedAt: null },
  { id: 'p5', name: 'StudyBuddy AI',  competition: 'HackVerse 4.0',          result: 'Shipped',   stack: ['React', 'OpenAI API', 'Supabase'],          href: '#', deletedAt: null },
  { id: 'p6', name: 'PayLoop',        competition: 'FinFlow Hacks',          result: 'Finalist',  stack: ['Next.js', 'Razorpay', 'Prisma'],            href: '#', deletedAt: null },
];

// Mutable copy so create/restore/delete are visible to each other in mock mode
// (module-level state — resets on page reload, same lifetime as MOCK_* elsewhere).
let mockStore: ArchiveProject[] = MOCK_PROJECTS.map((p) => ({ ...p }));

// ─── API functions ────────────────────────────────────────────────────────────

/** Fetches every non-deleted archived project, newest first. */
export async function getArchiveProjects(): Promise<ArchiveProject[]> {
  if (!isSupabaseReady()) {
    return mockDelay(mockStore.filter((p) => !p.deletedAt));
  }

  const { data, error } = await supabase
    .from('archive_projects')
    .select(ARCHIVE_COLUMNS)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapRow);
}

/** Fetches a single archived project by id (including soft-deleted ones, so a
    future "trash" view could still show and restore them). */
export async function getArchiveById(id: string): Promise<ArchiveProject> {
  if (!isSupabaseReady()) {
    const found = mockStore.find((p) => p.id === id);
    if (!found) throw new Error(`Archive ${id} not found.`);
    return mockDelay(found);
  }

  const { data, error } = await supabase
    .from('archive_projects')
    .select(ARCHIVE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Archive ${id} not found.`);

  return mapRow(data);
}

/** Archives a completed workspace/project. `href` defaults to '#', matching the
    existing seed data, so callers don't need a link at creation time. */
export async function createArchive(input: CreateArchiveInput): Promise<ArchiveProject> {
  if (!isSupabaseReady()) {
    const newProject: ArchiveProject = {
      id: `mock-${Date.now()}`,
      name: input.name,
      competition: input.competition,
      competitionId: input.competitionId,
      workspaceId: input.workspaceId,
      result: input.result,
      stack: input.stack,
      href: input.href ?? '#',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    mockStore = [newProject, ...mockStore];
    return mockDelay(newProject);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('archive_projects')
    .insert({
      name: input.name,
      competition: input.competition,
      competition_id: input.competitionId,
      workspace_id: input.workspaceId,
      result: input.result,
      stack: input.stack,
      href: input.href ?? '#',
      created_by: user?.id,
    })
    .select(ARCHIVE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);

  return mapRow(data);
}

/** Un-deletes a soft-deleted archive entry. */
export async function restoreArchive(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.map((p) => (p.id === id ? { ...p, deletedAt: null } : p));
    await mockDelay(null);
    return;
  }

  const { error } = await supabase
    .from('archive_projects')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Removes an archived project. Soft-deletes by default (sets `deleted_at`, so
 * it disappears from getArchiveProjects() but can still be restoreArchive()'d).
 * Pass `{ permanent: true }` to actually delete the row — cannot be undone.
 */
export async function deleteArchive(id: string, options?: { permanent?: boolean }): Promise<void> {
  const permanent = options?.permanent ?? false;

  if (!isSupabaseReady()) {
    mockStore = permanent
      ? mockStore.filter((p) => p.id !== id)
      : mockStore.map((p) => (p.id === id ? { ...p, deletedAt: new Date().toISOString() } : p));
    await mockDelay(null);
    return;
  }

  if (permanent) {
    const { error } = await supabase.from('archive_projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('archive_projects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}