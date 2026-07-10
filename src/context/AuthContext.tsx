import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSupabaseAuthSession } from '@/src/supabaseClient';

export interface AuthUser {
  id: number;
  nombres: string;
  apellidos?: string;
  correo: string;
  telefono: string;
  cedula: string;
  municipio: string;
  parroquia?: string;
  municipio_id?: number | null;
  parroquia_id?: number | null;
  municipios?: {
    nombre?: string | null;
  } | null;
  parroquias?: {
    nombre?: string | null;
  } | null;
  avatar_url: string | null;
  token?: string;
  refreshToken?: string;
}

type SetUserValue = AuthUser | null | ((prev: AuthUser | null) => AuthUser | null);

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: SetUserValue) => Promise<void>;
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

  const setUser = async (u: SetUserValue) => {
    const resolvedUser = typeof u === 'function' ? u(user) : u;
    setUserState(resolvedUser);
    if (resolvedUser) {
      await AsyncStorage.setItem('auth-user', JSON.stringify(resolvedUser));
      await setSupabaseAuthSession(
        resolvedUser.token && resolvedUser.refreshToken
          ? { access_token: resolvedUser.token, refresh_token: resolvedUser.refreshToken }
          : null
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
