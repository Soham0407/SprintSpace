import { mockDelay } from './mockClient';
import type { Candidate } from './types';

// MOCK — replace this array with a real fetch to GET /api/teammatch/candidates
const CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Ananya R.', roleWanted: 'Frontend', skills: ['React', 'Tailwind', 'Figma'], matchScore: 94, available: true },
  { id: 'c2', name: 'Kabir S.', roleWanted: 'Backend', skills: ['Node.js', 'PostgreSQL', 'Docker'], matchScore: 88, available: true },
  { id: 'c3', name: 'Meera D.', roleWanted: 'ML/AI', skills: ['PyTorch', 'NLP', 'FastAPI'], matchScore: 82, available: false },
  { id: 'c4', name: 'Rehan K.', roleWanted: 'Design', skills: ['UI/UX', 'Framer', 'Branding'], matchScore: 79, available: true },
  { id: 'c5', name: 'Sanya P.', roleWanted: 'Full-stack', skills: ['Next.js', 'MongoDB', 'AWS'], matchScore: 75, available: true },
  { id: 'c6', name: 'Devansh M.', roleWanted: 'Backend', skills: ['Django', 'Redis', 'GraphQL'], matchScore: 71, available: false },
];

export async function getCandidates(): Promise<Candidate[]> {
  return mockDelay(CANDIDATES);
}
