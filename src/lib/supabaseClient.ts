import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    !url.includes('placeholder') &&
    !url.includes('your-project-id') &&
    key &&
    !key.includes('placeholder') &&
    !key.includes('your-anon-public-key-here')
  );
}

if (!isSupabaseReady()) {
  console.warn(
    '[Supabase] Missing or default VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'The app will run with mock data until these are provided.'
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'placeholder-key'
);

