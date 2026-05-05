import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { userId, nombre, correo, telefono, cedula, municipio } = await request.json();

    if (!userId) {
      return Response.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const updates: Record<string, string> = {};
    if (nombre !== undefined) updates.nombre = nombre.trim();
    if (correo !== undefined) updates.correo = correo.toLowerCase().trim();
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
        .eq('id', userId)
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
          .eq('id', userId)
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
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
