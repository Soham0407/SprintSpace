import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Candidate } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Ananya R.',  roleWanted: 'Frontend',   skills: ['React', 'Tailwind', 'Figma'],         matchScore: 94, available: true,  avatarUrl: null, bio: 'Love building sleek interfaces' },
  { id: 'c2', name: 'Kabir S.',   roleWanted: 'Backend',    skills: ['Node.js', 'PostgreSQL', 'Docker'],     matchScore: 88, available: true,  avatarUrl: null, bio: 'Database optimization geek' },
  { id: 'c3', name: 'Meera D.',   roleWanted: 'ML/AI',      skills: ['PyTorch', 'NLP', 'FastAPI'],           matchScore: 82, available: false, avatarUrl: null, bio: 'Machine learning researcher' },
  { id: 'c4', name: 'Rehan K.',   roleWanted: 'Design',     skills: ['UI/UX', 'Framer', 'Branding'],         matchScore: 79, available: true,  avatarUrl: null, bio: 'Product designer & brand strategist' },
  { id: 'c5', name: 'Sanya P.',   roleWanted: 'Full-stack', skills: ['Next.js', 'MongoDB', 'AWS'],           matchScore: 75, available: true,  avatarUrl: null, bio: 'Full-stack engineer' },
  { id: 'c6', name: 'Devansh M.', roleWanted: 'Backend',    skills: ['Django', 'Redis', 'GraphQL'],          matchScore: 71, available: false, avatarUrl: null, bio: 'Backend engineer' },
];

// ─── API function ─────────────────────────────────────────────────────────────
export async function getCandidates(): Promise<Candidate[]> {
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_CANDIDATES);
  }

  // Get the current user so we can exclude them from the list
  const { data: { user } } = await supabase.auth.getUser();

  const query = supabase
    .from('candidates')
    .select(`
      id,
      role_wanted,
      skills,
      available,
      match_score,
      profiles ( name, avatar_url, bio )
    `)
    .order('match_score', { ascending: false });

  // Exclude the logged-in user so they don't see themselves
  if (user) {
    query.neq('id', user.id);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => {
    const profile = c.profiles as unknown as { name: string; avatar_url: string | null; bio: string | null } | null;
    return {
      id: c.id as string,
      name: profile?.name ?? 'Unknown',
      avatarUrl: profile?.avatar_url ?? null,
      bio: profile?.bio ?? null,
      roleWanted: c.role_wanted as string,
      skills: c.skills as string[],
      matchScore: c.match_score as number,
      available: c.available as boolean,
    };
  });
}
