import bcrypt from 'bcryptjs';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nombre, correo, telefono, cedula, avatar_url, password_hash')
      .eq('correo', correo.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;

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
