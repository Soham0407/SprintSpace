import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Candidate } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Ananya R.',  roleWanted: 'Frontend',   skills: ['React', 'Tailwind', 'Figma'],         matchScore: 94, available: true  },
  { id: 'c2', name: 'Kabir S.',   roleWanted: 'Backend',    skills: ['Node.js', 'PostgreSQL', 'Docker'],     matchScore: 88, available: true  },
  { id: 'c3', name: 'Meera D.',   roleWanted: 'ML/AI',      skills: ['PyTorch', 'NLP', 'FastAPI'],           matchScore: 82, available: false },
  { id: 'c4', name: 'Rehan K.',   roleWanted: 'Design',     skills: ['UI/UX', 'Framer', 'Branding'],         matchScore: 79, available: true  },
  { id: 'c5', name: 'Sanya P.',   roleWanted: 'Full-stack', skills: ['Next.js', 'MongoDB', 'AWS'],           matchScore: 75, available: true  },
  { id: 'c6', name: 'Devansh M.', roleWanted: 'Backend',    skills: ['Django', 'Redis', 'GraphQL'],          matchScore: 71, available: false },
];

// ─── API function ─────────────────────────────────────────────────────────────
export async function getCandidates(): Promise<Candidate[]> {
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_CANDIDATES);
  }

  const { data, error } = await supabase
    .from('candidates')
    .select(`
      id,
      role_wanted,
      skills,
      available,
      match_score,
      profiles ( name )
    `)
    .order('match_score', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: (c.profiles as { name: string } | null)?.name ?? 'Unknown',
    roleWanted: c.role_wanted as string,
    skills: c.skills as string[],
    matchScore: c.match_score as number,
    available: c.available as boolean,
  }));
}
