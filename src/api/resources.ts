import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { ResourceSection, Resource, CreateResourceInput } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

// ─── MOCK data ────────────────────────────────────────────────────────────────
const MOCK_RESOURCE_SECTIONS: ResourceSection[] = [];

let mockStore: Resource[] = [];

function mapRow(row: Record<string, any>): Resource {
  return {
    id: row.id as string,
    workspaceId: (row.workspace_id as string | null) ?? null,
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

export async function getResources(workspaceId: string): Promise<Resource[]> {
  if (!isSupabaseReady()) {
    return mockDelay(mockStore.filter((r) => r.workspaceId === workspaceId));
  }

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function createResource(input: CreateResourceInput): Promise<Resource> {
  if (!isSupabaseReady()) {
    const newResource: Resource = {
      id: `mock-${Date.now()}`,
      workspaceId: input.workspaceId,
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
      workspace_id: input.workspaceId,
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
  return mockDelay(MOCK_RESOURCE_SECTIONS);
}
