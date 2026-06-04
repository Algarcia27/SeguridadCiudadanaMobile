import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSupabaseAuthSession } from '@/src/supabaseClient';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  cedula: string;
  municipio: string;
  avatar_url: string | null;
  token?: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('auth-user');
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        await setSupabaseAuthSession(
          parsed.token && parsed.refreshToken
            ? { access_token: parsed.token, refresh_token: parsed.refreshToken }
            : null
        );
        setUserState(parsed);
      }
    })();
  }, []);

  const setUser = async (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      await AsyncStorage.setItem('auth-user', JSON.stringify(u));
      await setSupabaseAuthSession(
        u.token && u.refreshToken ? { access_token: u.token, refresh_token: u.refreshToken } : null
      );
    } else {
      await AsyncStorage.removeItem('auth-user');
      await setSupabaseAuthSession(null);
    }
  };

  const logout = async () => {
    await setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
