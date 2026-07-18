import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Competition } from './types';

// ─── Helper ───────────────────────────────────────────────────────────────────
// Returns true only when Supabase is fully configured
function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data (kept as fallback while keys are pending) ──────────────────────
const MOCK_COMPETITIONS: Competition[] = [
  {
    id: 'web-wonders-2026',
    name: 'Web Wonders 2026',
    organizer: 'SVNIT Dev Council',
    category: 'Web Dev',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹50,000',
    teamSize: '2–4',
  },
  {
    id: 'smart-india-hackathon',
    name: 'Smart India Hackathon',
    organizer: 'Ministry of Education, Govt. of India',
    category: 'Open Innovation',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹1,00,000',
    teamSize: '6',
  },
  {
    id: 'hackverse-4',
    name: 'HackVerse 4.0',
    organizer: 'IEEE Student Chapter',
    category: 'AI/ML',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹30,000',
    teamSize: '2–5',
  },
  {
    id: 'finflow-hacks',
    name: 'FinFlow Hacks',
    organizer: 'Razorpay x College Consortium',
    category: 'Fintech',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹75,000',
    teamSize: '3–4',
  },
  {
    id: 'greencode-sprint',
    name: 'GreenCode Sprint',
    organizer: 'Sustainability Cell',
    category: 'Sustainability',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹40,000',
    teamSize: '2–4',
  },
  {
    id: 'codestorm-autumn',
    name: 'CodeStorm Autumn',
    organizer: 'GDG Campus Chapter',
    category: 'AI/ML',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    prizePool: '₹25,000',
    teamSize: '1–4',
  },
];

// ─── API function ─────────────────────────────────────────────────────────────
export async function getCompetitions(): Promise<Competition[]> {
  // Fall back to mock data until Supabase keys are provided
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_COMPETITIONS);
  }

  const { data, error } = await supabase
    .from('competitions')
    .select('slug, name, organizer, category, deadline, prize_pool, team_size')
    .eq('is_active', true)
    .order('deadline', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((c) => ({
    id: c.slug as string,
    name: c.name as string,
    organizer: c.organizer as string,
    category: c.category as string,
    deadline: c.deadline as string,
    prizePool: c.prize_pool as string,
    teamSize: c.team_size as string,
  }));
}
