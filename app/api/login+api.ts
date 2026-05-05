import bcrypt from 'bcryptjs';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const isMissingMunicipio = (error: any) =>
      error?.code === '42703' ||
      error?.code === 'PGRST204' ||
      error?.message?.includes("Could not find the 'municipio' column") ||
      error?.message?.includes('municipio');
    let user: any;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nombre, correo, telefono, cedula, municipio, avatar_url, password_hash')
        .eq('correo', correo.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;
      user = data;
    } catch (err: any) {
      if (isMissingMunicipio(err)) {
        const { data, error } = await supabase
          .from('users')
          .select('id, nombre, correo, telefono, cedula, avatar_url, password_hash')
          .eq('correo', correo.toLowerCase().trim())
          .maybeSingle();

        if (error) throw error;
        user = data ? { ...data, municipio: '' } : null;
      } else {
        throw err;
      }
    }

    if (!user) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const { password_hash, ...safeUser } = user;
    return Response.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
