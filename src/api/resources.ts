import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { ResourceSection } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_RESOURCE_SECTIONS: ResourceSection[] = [
  {
    id: 'pitch-decks',
    label: 'Pitch Decks',
    items: [
      { id: 'r1', title: 'Winning Hackathon Pitch Template',   meta: '12-slide deck · Figma', href: '#' },
      { id: 'r2', title: 'Problem-Solution-Impact Framework',  meta: 'PDF guide',             href: '#' },
      { id: 'r3', title: '2-Minute Demo Script Structure',     meta: 'Doc template',          href: '#' },
    ],
  },
  {
    id: 'design-kits',
    label: 'Design Kits',
    items: [
      { id: 'r4', title: 'Dark Mode UI Kit',               meta: 'Figma · 40 components', href: '#' },
      { id: 'r5', title: 'Landing Page Wireframe Pack',    meta: 'Figma',                 href: '#' },
      { id: 'r6', title: 'Icon Set — Line & Solid',        meta: 'SVG bundle',            href: '#' },
    ],
  },
  {
    id: 'boilerplate',
    label: 'Boilerplate Code',
    items: [
      { id: 'r7', title: 'React + Vite + Tailwind Starter',    meta: 'GitHub template', href: '#' },
      { id: 'r8', title: 'Auth Flow (JWT + Refresh Tokens)',    meta: 'Node.js snippet', href: '#' },
      { id: 'r9', title: 'FastAPI + PostgreSQL Boilerplate',    meta: 'GitHub template', href: '#' },
    ],
  },
  {
    id: 'mentorship',
    label: 'Mentorship',
    items: [
      { id: 'r10', title: 'Book a 20-min Mentor Call',              meta: 'Live scheduling', href: '#' },
      { id: 'r11', title: 'Judging Criteria Breakdown',             meta: 'Guide',           href: '#' },
      { id: 'r12', title: 'Common Pitfalls in Hackathon Demos',     meta: 'Article',         href: '#' },
    ],
  },
];

// ─── API function ─────────────────────────────────────────────────────────────
export async function getResourceSections(): Promise<ResourceSection[]> {
  if (!isSupabaseReady()) {
    return mockDelay(MOCK_RESOURCE_SECTIONS);
  }

  const { data, error } = await supabase
    .from('resource_sections')
    .select(`
      id,
      label,
      resource_items ( id, title, meta, href )
    `)
    .order('sort_order');

  if (error) throw new Error(error.message);

  return (data ?? []).map((s) => ({
    id: s.id as string,
    label: s.label as string,
    items: (s.resource_items as { id: string; title: string; meta: string; href: string }[]) ?? [],
  }));
}
