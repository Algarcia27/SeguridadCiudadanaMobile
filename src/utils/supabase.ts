import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const rawUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!rawUrl || !serviceKey) {
      throw new Error(
        'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.'
      );
    }

    let url = rawUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    if (!/\./.test(new URL(url).hostname)) {
      url = `https://${new URL(url).hostname}.supabase.co`;
    }

    client = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
