import { getAuthenticatedSupabaseUser, getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedSupabaseUser(request);
    if (!authUser?.email) {
      return Response.json({ error: 'Token inválido o usuario no autenticado.' }, { status: 401 });
    }

    const { nombre, correo, telefono, cedula, municipio } = await request.json();
    const updates: Record<string, string> = {};
    const userEmail = authUser.email.toLowerCase();

    if (correo !== undefined && correo.toLowerCase().trim() !== userEmail) {
      return Response.json({ error: 'No está permitido cambiar el correo desde este endpoint.' }, { status: 403 });
    }

    if (nombre !== undefined) updates.nombre = nombre.trim();
    if (telefono !== undefined) updates.telefono = telefono;
    if (cedula !== undefined) updates.cedula = cedula;
    if (municipio !== undefined) updates.municipio = municipio;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Nada que actualizar.' }, { status: 400 });
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
        .update(updates)
        .eq('correo', userEmail)
        .select('id, nombre, correo, telefono, cedula, municipio, avatar_url')
        .maybeSingle();

      if (error) throw error;
      user = data;
    } catch (err: any) {
      if (isMissingMunicipio(err) && updates.municipio !== undefined) {
        delete updates.municipio;
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('correo', userEmail)
          .select('id, nombre, correo, telefono, cedula, avatar_url')
          .maybeSingle();

        if (error) throw error;
        user = data ? { ...data, municipio: '' } : null;
      } else {
        throw err;
      }
    }

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    return Response.json({ success: true, user });
  } catch (err: any) {
    console.error('Update profile error:', err);
    const status = err.message?.includes('Token inválido') || err.message?.includes('no autenticado') ? 401 : 500;
    return Response.json({ error: err.message || 'Error interno del servidor.' }, { status });
  }
}
