import { supabase } from '../lib/supabaseClient';
import { mockDelay } from './mockClient';
import type { Profile, UpdateProfileInput } from './types';

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return Boolean(url && !url.includes('placeholder'));
}

const MOCK_PROFILE: Profile = {
  id: 'mock-user-id-active',
  name: 'Developer',
  email: 'dev@college.edu',
  username: 'developer',
  bio: null,
  role: null,
  avatarUrl: null,
  notificationsEnabled: true,
};

function mapRow(row: Record<string, any>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    username: (row.username as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    avatarUrl: (row.avatar_url as string | null) ?? null,
    notificationsEnabled: (row.notifications_enabled as boolean) ?? true,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!isSupabaseReady()) return mockDelay(MOCK_PROFILE);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw new Error(error.message);
  return mapRow(data);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
  if (!isSupabaseReady()) return mockDelay({ ...MOCK_PROFILE, ...input });

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.username !== undefined) payload.username = input.username;
  if (input.bio !== undefined) payload.bio = input.bio;
  if (input.role !== undefined) payload.role = input.role;
  if (input.notificationsEnabled !== undefined) payload.notifications_enabled = input.notificationsEnabled;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('That username is already taken.');
    throw new Error(error.message);
  }
  return mapRow(data);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!isSupabaseReady()) return mockDelay(URL.createObjectURL(file));

  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw new Error(updateError.message);
  return publicUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  if (!isSupabaseReady()) {
    await mockDelay(null);
    return;
  }
  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
  if (error) throw new Error(error.message);
}
