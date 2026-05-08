import bcrypt from 'bcryptjs';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, nombre, correo, telefono, cedula, municipio, avatar_url, password_hash')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (userErr) throw userErr;
    if (!user) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    let token: string | null = null;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: correoNorm,
      password,
    });

    if (authError || !authData.session?.access_token) {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: correoNorm,
        password,
        email_confirm: true,
        user_metadata: {
          nombre: user.nombre,
          telefono: user.telefono || '',
          cedula: user.cedula || '',
          municipio: user.municipio || '',
        },
      });

      if (createError) {
        throw createError;
      }

      const { data: nextAuthData, error: nextAuthError } = await supabase.auth.signInWithPassword({
        email: correoNorm,
        password,
      });

      if (nextAuthError || !nextAuthData.session?.access_token) {
        throw nextAuthError || new Error('No se pudo generar una sesión de usuario.');
      }
      token = nextAuthData.session.access_token;
    } else {
      token = authData.session.access_token;
    }

    const { password_hash, ...safeUser } = user;
    return Response.json({ success: true, user: safeUser, token });
  } catch (err: any) {
    console.error('Login error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
