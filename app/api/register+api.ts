import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { nombre, correo, telefono, cedula, municipio, password } = await request.json();

    if (!nombre || !correo || !password || !municipio) {
      return Response.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: existing, error: existingErr } = await supabase
      .from('users')
      .select('id')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return Response.json({ error: 'El correo ya está registrado.' }, { status: 409 });
    }

    const isMissingMunicipio = (error: any) =>
      error?.code === '42703' ||
      error?.code === 'PGRST204' ||
      error?.message?.includes("Could not find the 'municipio' column") ||
      error?.message?.includes('municipio');

    const payload: Record<string, any> = {
      nombre: nombre.trim(),
      correo: correoNorm,
      telefono: telefono || '',
      cedula: cedula || '',
      municipio: municipio.trim(),
    };

    const { data: { user: authUser } = {}, error: authError } = await supabase.auth.admin.createUser({
      password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre.trim(),
        telefono: telefono || '',
        cedula: cedula || '',
        municipio: municipio.trim(),
      },
    });

    if (authError) {
      if (authError.status === 409) {
        return Response.json({ error: 'El correo ya está registrado.' }, { status: 409 });
      }
      throw authError;
    }

    if (!authUser) {
      throw new Error('No se pudo crear el usuario de autenticación.');
    }

    let inserted: any;
    let insertErr: any;

    const firstAttempt = await supabase
      .from('users')
      .insert(payload)
      .select('id, nombre, correo, telefono, cedula, municipio, avatar_url')
      .single();

    inserted = firstAttempt.data;
    insertErr = firstAttempt.error;

    if (isMissingMunicipio(insertErr)) {
      delete payload.municipio;
      const retry = await supabase
        .from('users')
        .insert(payload)
        .select('id, nombre, correo, telefono, cedula, avatar_url')
        .single();

      inserted = retry.data ? { ...retry.data, municipio: '' } : null;
      insertErr = retry.error;
    }

    if (insertErr || !inserted) {
      await supabase.auth.admin.deleteUser(authUser.id);
      throw insertErr || new Error('No se pudo crear el usuario.');
    }

    const { data: authSession, error: authSessionErr } = await supabase.auth.signInWithPassword({
      email: correoNorm,
      password,
    });

    if (authSessionErr || !authSession.session?.access_token) {
      throw authSessionErr || new Error('No se pudo generar sesión después del registro.');
    }

    return Response.json({ success: true, user: inserted, token: authSession.session.access_token }, { status: 201 });
  } catch (err: any) {
    console.error('Register error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
