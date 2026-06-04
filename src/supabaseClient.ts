import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const expoExtra = (Constants.expoConfig?.extra || (Constants.manifest as any)?.extra || {}) as Record<string, string>;
const SUPABASE_URL = process.env.SUPABASE_URL || expoExtra.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || expoExtra.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY. Añade estas claves en app.json dentro de expo.extra o configura tu entorno de Expo.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SupabaseAuthSession = {
  access_token: string;
  refresh_token: string;
};

export async function setSupabaseAuthSession(session: SupabaseAuthSession | null) {
  if (session?.access_token && session?.refresh_token) {
    await supabase.auth.setSession(session);
  } else {
    await supabase.auth.signOut();
  }
}
