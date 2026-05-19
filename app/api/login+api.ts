import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: correoNorm,
      password,
    });

    if (authError || !authData.session?.access_token) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, nombre, correo, telefono, cedula, municipio, avatar_url')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (userErr) throw userErr;

    return Response.json({
      success: true,
      user: user ?? null,
      token: authData.session.access_token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
