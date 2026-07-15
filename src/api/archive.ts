import { mockDelay } from './mockClient';
import type { ArchiveProject } from './types';

// MOCK — replace with a real fetch to GET /api/archive
const PROJECTS: ArchiveProject[] = [
  { id: 'p1', name: 'Repo Replay', competition: 'HackVerse 3.0', result: 'Winner', stack: ['Next.js', 'Clerk', 'Framer Motion'], href: '#' },
  { id: 'p2', name: 'Foldcraft', competition: 'CodeStorm Spring', result: 'Finalist', stack: ['React', 'Tailwind', 'Framer Motion'], href: '#' },
  { id: 'p3', name: 'CampusConnect', competition: 'Smart India Hackathon', result: 'Shipped', stack: ['React', 'Node.js', 'MongoDB'], href: '#' },
  { id: 'p4', name: 'EcoTrack', competition: 'GreenCode Sprint', result: 'Runner-up', stack: ['Vue', 'FastAPI', 'PostgreSQL'], href: '#' },
  { id: 'p5', name: 'StudyBuddy AI', competition: 'HackVerse 4.0', result: 'Shipped', stack: ['React', 'OpenAI API', 'Supabase'], href: '#' },
  { id: 'p6', name: 'PayLoop', competition: 'FinFlow Hacks', result: 'Finalist', stack: ['Next.js', 'Razorpay', 'Prisma'], href: '#' },
];

export async function getArchiveProjects(): Promise<ArchiveProject[]> {
  return mockDelay(PROJECTS);
}
