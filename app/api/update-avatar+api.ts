import { getAuthenticatedSupabaseUser, getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedSupabaseUser(request);
    if (!authUser?.email) {
      return Response.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { avatarUrl } = await request.json();
    if (!avatarUrl) {
      return Response.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const isMissingMunicipio = (error: any) =>
      error?.code === '42703' ||
      error?.code === 'PGRST204' ||
      error?.message?.includes("Could not find the 'municipio' column") ||
      error?.message?.includes('municipio');
    let user: any;
    const userEmail = authUser.email.toLowerCase();

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('correo', userEmail)
        .select('id, nombre, correo, telefono, cedula, municipio, avatar_url')
        .maybeSingle();

      if (error) throw error;
      user = data;
    } catch (err: any) {
      if (isMissingMunicipio(err)) {
        const { data, error } = await supabase
          .from('users')
          .update({ avatar_url: avatarUrl })
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
    console.error('Update avatar error:', err);
    return Response.json({ error: err.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
