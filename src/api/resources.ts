import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { ResourceSection, Resource, CreateResourceInput } from './types';

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

const MOCK_RESOURCES: Resource[] = [
  // Rulebook category
  { id: 'r1', title: 'Rulebook.pdf', description: 'Official competition rulebook and guidelines', url: 'https://example.com/rulebook.pdf', category: 'Rulebook', tags: ['official', 'guidelines'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r2', title: 'Problem Statement.pdf', description: 'Detailed problem statement and project requirements', url: 'https://example.com/problem_statement.pdf', category: 'Rulebook', tags: ['official', 'requirements'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r3', title: 'Submission Guidelines.pdf', description: 'Instructions for submitting your final project', url: 'https://example.com/submission_guidelines.pdf', category: 'Rulebook', tags: ['official', 'submission'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r4', title: 'Judging Criteria.pdf', description: 'Rubric and guidelines used by the judges', url: 'https://example.com/judging_criteria.pdf', category: 'Rulebook', tags: ['official', 'judging'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r5', title: 'Timeline.pdf', description: 'Important dates, milestones, and deadlines', url: 'https://example.com/timeline.pdf', category: 'Rulebook', tags: ['official', 'schedule'], createdAt: new Date().toISOString(), createdBy: null },

  // Project Files category
  { id: 'r6', title: 'Research.pdf', description: 'Market analysis and user research findings', url: 'https://example.com/research.pdf', category: 'Project File', tags: ['research', 'user-study'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r7', title: 'Architecture.pdf', description: 'Technical architecture and system design document', url: 'https://example.com/architecture.pdf', category: 'Project File', tags: ['design', 'technical'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r8', title: 'Presentation.pptx', description: 'Final pitch presentation deck', url: 'https://example.com/presentation.pptx', category: 'Project File', tags: ['pitch', 'slides'], createdAt: new Date().toISOString(), createdBy: null },
  { id: 'r9', title: 'UI Design.fig', description: 'Figma prototypes and component library links', url: 'https://figma.com/file/sprintspace', category: 'Project File', tags: ['ui', 'ux', 'design'], createdAt: new Date().toISOString(), createdBy: null },
];

let mockStore: Resource[] = MOCK_RESOURCES.map((r) => ({ ...r }));

function mapRow(row: Record<string, any>): Resource {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    url: row.url as string,
    category: row.category as string,
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    createdBy: (row.created_by as string | null) ?? null,
  };
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function getResources(): Promise<Resource[]> {
  if (!isSupabaseReady()) {
    return mockDelay(mockStore);
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  if (!isSupabaseReady()) {
    const newResource: Resource = {
      id: `mock-${Date.now()}`,
      title: input.title,
      description: input.description ?? null,
      url: input.url,
      category: input.category,
      tags: input.tags ?? [],
      createdAt: new Date().toISOString(),
      createdBy: 'mock-user-id-active',
    };
    mockStore = [newResource, ...mockStore];
    return mockDelay(newResource);
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('resources')
    .insert({
      title: input.title,
      description: input.description,
      url: input.url,
      category: input.category,
      tags: input.tags ?? [],
      created_by: user?.id,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function uploadResourceFile(file: File): Promise<string> {
  if (!isSupabaseReady()) {
    const mockUrl = URL.createObjectURL(file);
    return mockDelay(mockUrl);
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('resources')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('resources')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteResource(id: string): Promise<void> {
  if (!isSupabaseReady()) {
    mockStore = mockStore.filter((r) => r.id !== id);
    await mockDelay(null);
    return;
  }

  const { data: resource, error: getError } = await supabase
    .from('resources')
    .select('url')
    .eq('id', id)
    .maybeSingle();

  if (getError) throw new Error(getError.message);
  const url = resource?.url;

  const { error: dbError } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (dbError) throw new Error(dbError.message);

  if (url && url.includes('/storage/v1/object/public/resources/')) {
    const fileName = url.split('/storage/v1/object/public/resources/').pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage
        .from('resources')
        .remove([fileName]);
      
      if (storageError) {
        console.error('Failed to remove file from storage:', storageError.message);
      }
    }
  }
}


// Backwards compatibility for unused template helper
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
