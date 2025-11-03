import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  aiCredits: number;
  profile?: { avatar?: string };
}

type AuthContextType = {
  user: UserData | null;
  token: string | null;
  isLoadingUser: boolean;
  setToken: (t: string | null) => void;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('apexoai_token'));
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(!!token);

  const setToken = (t: string | null) => {
    if (t) {
      localStorage.setItem('apexoai_token', t);
      setTokenState(t);
    } else {
      localStorage.removeItem('apexoai_token');
      setTokenState(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const fetchProfile = async (currentToken: string) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // token invalid or expired
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Profile fetch error', err);
      toast.error('Failed to fetch user profile.');
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile(token);
    else setIsLoadingUser(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // wrapper to include Authorization header automatically
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const currentToken = token || localStorage.getItem('apexoai_token');
    if (!currentToken) {
      return Promise.reject(new Error('No auth token'));
    }

    const headers = new Headers(init?.headers || {});
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${currentToken}`);
    if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');

    return fetch(input, { ...init, headers });
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoadingUser, setToken, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
