import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { userId, avatarUrl } = await request.json();

    if (!userId || !avatarUrl) {
      return Response.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select('id, nombre, correo, telefono, cedula, avatar_url')
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    return Response.json({ success: true, user });
  } catch (err: any) {
    console.error('Update avatar error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
