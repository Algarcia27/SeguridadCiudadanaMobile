import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  cedula: string;
  municipio: string;
  avatar_url: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('auth-user').then((raw) => {
      if (raw) setUserState(JSON.parse(raw));
    });
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      AsyncStorage.setItem('auth-user', JSON.stringify(u));
    } else {
      AsyncStorage.removeItem('auth-user');
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
