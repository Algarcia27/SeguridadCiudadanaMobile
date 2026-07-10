import { getAuthenticatedSupabaseUser, getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedSupabaseUser(request);
    if (!authUser?.email) {
      return Response.json({ error: 'Token inválido o usuario no autenticado.' }, { status: 401 });
    }

    const {
      nombre,
      nombres,
      apellidos,
      correo,
      telefono,
      cedula,
      municipio,
      municipio_id,
      parroquia,
      parroquia_id,
    } = await request.json();
    const updates: Record<string, any> = {};
    const userEmail = authUser.email.toLowerCase();

    if (correo !== undefined && correo.toLowerCase().trim() !== userEmail) {
      return Response.json({ error: 'No está permitido cambiar el correo desde este endpoint.' }, { status: 403 });
    }

    if (nombres !== undefined) {
      updates.nombres = nombres.trim();
    } else if (nombre !== undefined) {
      updates.nombres = nombre.trim();
    }

    if (apellidos !== undefined) updates.apellidos = apellidos.trim();
    if (telefono !== undefined) updates.telefono = telefono;
    if (cedula !== undefined) updates.cedula = cedula;
    updates.municipio_id = municipio_id !== undefined ? municipio_id : undefined;
    updates.parroquia_id = parroquia_id !== undefined ? parroquia_id : undefined;
if (updates.municipio_id === undefined && municipio !== undefined) {
    updates.municipio = municipio;
}
if (updates.parroquia_id === undefined && parroquia !== undefined) {
    updates.parroquia = parroquia;
}

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
        .select(`
          id,
          nombres,
          apellidos,
          correo,
          telefono,
          cedula,
          municipio_id,
          parroquia_id,
          avatar_url,
          municipios (nombre),
          parroquias (nombre)
        `)
        .maybeSingle();

      if (error) throw error;

      const municipioRelation = (data as any)?.municipios;
      const parroquiaRelation = (data as any)?.parroquias;
      const municipioNombre = Array.isArray(municipioRelation)
        ? municipioRelation[0]?.nombre ?? 'No asignado'
        : municipioRelation?.nombre ?? 'No asignado';
      const parroquiaNombre = Array.isArray(parroquiaRelation)
        ? parroquiaRelation[0]?.nombre ?? 'No asignado'
        : parroquiaRelation?.nombre ?? 'No asignado';

      user = data
        ? {
            ...data,
            municipio: typeof municipioNombre === 'string' && municipioNombre.trim() ? municipioNombre : 'No asignado',
            parroquia: typeof parroquiaNombre === 'string' && parroquiaNombre.trim() ? parroquiaNombre : 'No asignado',
          }
        : null;
    } catch (err: any) {
      if (isMissingMunicipio(err) && updates.municipio !== undefined) {
        delete updates.municipio;
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('correo', userEmail)
          .select('id, nombres, correo, telefono, cedula, avatar_url')
          .maybeSingle();

        if (error) throw error;
        user = data ? { ...data, municipio: 'No asignado' } : null;
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
