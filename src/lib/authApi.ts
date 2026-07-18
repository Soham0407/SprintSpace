import { supabase, isSupabaseReady } from './supabaseClient';
import type { LoginValues, SignupValues } from './authSchemas';

// ─── Helper: extract a readable message from any thrown value ─────────────────
function extractMessage(e: unknown, fallback: string): string {
  if (!e) return fallback;
  if (typeof e === 'string') return e || fallback;
  if (typeof e === 'object') {
    const obj = e as Record<string, unknown>;
    // Supabase AuthError shape
    const msg = obj['message'] ?? obj['error_description'] ?? obj['error'];
    if (typeof msg === 'string' && msg && msg !== '{}') return msg;
    // Try status code hints
    if (obj['status'] === 429) return 'Too many requests — please wait a moment and try again.';
    if (obj['status'] === 422) return 'Invalid email or password format.';
    if (obj['status'] === 400) return 'Signup failed — email may already be in use or invalid.';
  }
  return fallback;
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp({ name, email, password }: SignupValues) {
  if (!isSupabaseReady()) {
    const mockUser = {
      id: 'mock-user-id-' + Math.random().toString(36).substring(2, 9),
      email,
      user_metadata: { name: name || 'Mock User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const mockSession = {
      access_token: 'mock-access-token-' + Math.random().toString(36).substring(2, 9),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-' + Math.random().toString(36).substring(2, 9),
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    localStorage.setItem('mock_session', JSON.stringify(mockSession));
    window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: mockSession }));
    return { user: mockUser, session: mockSession };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }, // saved into raw_user_meta_data — DB trigger picks it up into profiles
    },
  });
  if (error) {
    console.error('[signUp] Supabase error:', error);
    throw new Error(extractMessage(error, 'Signup failed. Please try again.'));
  }
  return data;
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn({ email, password }: LoginValues) {
  if (!isSupabaseReady()) {
    const mockUser = {
      id: 'mock-user-id-demo',
      email,
      user_metadata: { name: 'Demo User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    const mockSession = {
      access_token: 'mock-access-token-demo',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-demo',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    localStorage.setItem('mock_session', JSON.stringify(mockSession));
    window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: mockSession }));
    return { user: mockUser, session: mockSession };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    console.error('[signIn] Supabase error:', error);
    throw new Error(extractMessage(error, 'Login failed. Check your email and password.'));
  }
  return data;
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  if (!isSupabaseReady()) {
    localStorage.removeItem('mock_session');
    window.dispatchEvent(new CustomEvent('mock-auth-change', { detail: null }));
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Get current session ─────────────────────────────────────────────────────
export async function getSession() {
  if (!isSupabaseReady()) {
    const stored = localStorage.getItem('mock_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Get current user ────────────────────────────────────────────────────────
export async function getUser() {
  if (!isSupabaseReady()) {
    const stored = localStorage.getItem('mock_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored).user;
    } catch {
      return null;
    }
  }
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ─── Password reset ──────────────────────────────────────────────────────────
export async function sendPasswordReset(email: string) {
  if (!isSupabaseReady()) {
    console.log('[sendPasswordReset] Mock reset email sent to:', email);
    return;
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

