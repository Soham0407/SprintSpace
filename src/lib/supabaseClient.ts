import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Helper: Returns true only when Supabase is fully configured
const isSupabaseReady = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('placeholder')
);

if (!isSupabaseReady) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'The app will run with mock data until these are provided.'
  );
}

const realSupabase = createClient(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'placeholder-key'
);

class MockAuthClient {
  private listeners = new Set<(event: string, session: any) => void>();
  private mockSessionKey = 'sprintspace_mock_session';

  private getStoredSession() {
    try {
      const stored = localStorage.getItem(this.mockSessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setStoredSession(session: any) {
    if (session) {
      localStorage.setItem(this.mockSessionKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(this.mockSessionKey);
    }
  }

  async signUp({ email, password, options }: any) {
    if (!email || !password) {
      return { data: { user: null, session: null }, error: { message: 'Email and password are required.' } };
    }
    if (password.length < 6) {
      return { data: { user: null, session: null }, error: { message: 'Password should be at least 6 characters.' } };
    }

    const user = {
      id: 'mock-user-id-' + Math.random().toString(36).substr(2, 9),
      email,
      user_metadata: {
        name: options?.data?.name ?? 'Mock User',
      },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
    };

    return { data: { user, session: null }, error: null };
  }

  async signInWithPassword({ email, password }: any) {
    if (!email || !password) {
      return { data: { user: null, session: null }, error: { message: 'Email and password are required.' } };
    }

    const user = {
      id: 'mock-user-id-active',
      email,
      user_metadata: {
        name: email.split('@')[0] || 'Developer',
      },
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const session = {
      access_token: 'mock-access-token-' + Math.random().toString(36).substr(2, 9),
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user,
    };

    this.setStoredSession(session);
    this.notify('SIGNED_IN', session);

    return { data: { user, session }, error: null };
  }

  async signOut() {
    this.setStoredSession(null);
    this.notify('SIGNED_OUT', null);
    return { error: null };
  }

  async getSession() {
    const session = this.getStoredSession();
    return { data: { session }, error: null };
  }

  async getUser() {
    const session = this.getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  }

  async resetPasswordForEmail(email: string, options: any) {
    console.log('[Mock Auth] Password reset email sent to:', email, 'redirecting to:', options?.redirectTo);
    return { error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.add(callback);
    const session = this.getStoredSession();
    callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          },
        },
      },
    };
  }

  private notify(event: string, session: any) {
    this.listeners.forEach((cb) => {
      try {
        cb(event, session);
      } catch (e) {
        console.error('[Mock Auth] Error in listener:', e);
      }
    });
  }
}

export const supabase = isSupabaseReady
  ? realSupabase
  : (new Proxy(realSupabase, {
      get(target, prop) {
        if (prop === 'auth') {
          if (!(target as any)._mockAuth) {
            (target as any)._mockAuth = new MockAuthClient();
          }
          return (target as any)._mockAuth;
        }
        return (target as any)[prop];
      },
    }) as typeof realSupabase);

