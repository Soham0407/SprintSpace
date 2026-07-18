import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { ArchiveProject } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_PROJECTS: ArchiveProject[] = [
  { id: 'p1', name: 'Repo Replay',    competition: 'HackVerse 3.0',         result: 'Winner',    stack: ['Next.js', 'Clerk', 'Framer Motion'],       href: '#' },
  { id: 'p2', name: 'Foldcraft',      competition: 'CodeStorm Spring',       result: 'Finalist',  stack: ['React', 'Tailwind', 'Framer Motion'],       href: '#' },
  { id: 'p3', name: 'CampusConnect',  competition: 'Smart India Hackathon',  result: 'Shipped',   stack: ['React', 'Node.js', 'MongoDB'],              href: '#' },
  { id: 'p4', name: 'EcoTrack',       competition: 'GreenCode Sprint',       result: 'Runner-up', stack: ['Vue', 'FastAPI', 'PostgreSQL'],             href: '#' },
  { id: 'p5', name: 'StudyBuddy AI',  competition: 'HackVerse 4.0',          result: 'Shipped',   stack: ['React', 'OpenAI API', 'Supabase'],          href: '#' },
  { id: 'p6', name: 'PayLoop',        competition: 'FinFlow Hacks',          result: 'Finalist',  stack: ['Next.js', 'Razorpay', 'Prisma'],            href: '#' },
];

// ─── API function ─────────────────────────────────────────────────────────────
export async function getArchiveProjects(): Promise<ArchiveProject[]> {
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_PROJECTS);
  }

  const { data, error } = await supabase
    .from('archive_projects')
    .select('id, name, competition, result, stack, href')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as ArchiveProject[];
}
