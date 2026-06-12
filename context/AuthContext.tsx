'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, clearToken, getToken, setToken, TOKEN_KEY } from '@/lib/api-client';
import type { LoginResponse, VendorProfileResponse, VendorUser } from '@/lib/types';

interface AuthContextType {
  vendor: VendorUser | null;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

async function fetchVendorProfile(accessToken: string): Promise<VendorUser> {
  const res = await fetch(`${BASE_URL}/api/vendor/profile`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let message = 'Impossible de charger le profil vendeur';
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = (await res.json()) as VendorProfileResponse;
  return json.data;
}

function mapLoginError(err: unknown): never {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid email') || msg.includes('invalid credentials')) {
      throw new Error('Email ou mot de passe incorrect');
    }
    throw err;
  }
  throw new Error('Une erreur est survenue. Veuillez réessayer.');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setVendor(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<LoginResponse>(
        '/api/store/auth/login',
        { email, password },
        { skipUnauthorizedRedirect: true },
      );

      if (data.user.role !== 'VENDOR') {
        throw new Error('Accès réservé aux vendeurs.');
      }

      const vendorProfile = await fetchVendorProfile(data.accessToken);

      setToken(data.accessToken);
      setTokenState(data.accessToken);
      setVendor(vendorProfile);
    } catch (err) {
      mapLoginError(err);
    }
  }, []);

  useEffect(() => {
    const stored = getToken();
    if (!stored) {
      setIsLoading(false);
      return;
    }

    setTokenState(stored);

    api
      .get<VendorProfileResponse>('/api/vendor/profile')
      .then(({ data }) => {
        setVendor(data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [logout]);

  return (
    <AuthContext.Provider value={{ vendor, isLoading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { TOKEN_KEY };
