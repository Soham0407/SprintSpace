import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseReady()) {
      const loadMockSession = () => {
        const stored = localStorage.getItem('mock_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setSession(parsed);
            setUser(parsed.user);
          } catch (e) {
            setSession(null);
            setUser(null);
          }
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      };

      loadMockSession();

      const handleMockAuthChange = (e: Event) => {
        const customEvent = e as CustomEvent;
        const session = customEvent.detail;
        setSession(session);
        setUser(session?.user ?? null);
      };

      window.addEventListener('mock-auth-change', handleMockAuthChange);
      return () => {
        window.removeEventListener('mock-auth-change', handleMockAuthChange);
      };
    } else {
      // Load the initial session synchronously from storage
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      });

      // Subscribe to auth state changes (login, logout, token refresh)
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
