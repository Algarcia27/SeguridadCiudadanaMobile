import { getAuthenticatedSupabaseUser, getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedSupabaseUser(request);
    const body = await request.json();
    const avatarBase64 = body?.avatarBase64;
    const contentType = body?.contentType || 'image/jpeg';

    if (!avatarBase64) {
      return Response.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    const usuarioId = authUser.id;
    const nombreArchivo = `${usuarioId}_avatar.jpg`;
    const rutaArchivo = `avatars/${nombreArchivo}`;
    const buffer = Buffer.from(avatarBase64, 'base64');

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from('evidencias_reportes')
      .upload(rutaArchivo, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData, error: publicUrlError } = await supabase.storage
      .from('evidencias_reportes')
      .getPublicUrl(rutaArchivo);

    if (publicUrlError) {
      throw publicUrlError;
    }

    const urlPublica = publicUrlData?.publicUrl;
    if (!urlPublica) {
      throw new Error('No se pudo obtener la URL pública del avatar.');
    }

    return Response.json({ success: true, url: urlPublica });
  } catch (error: any) {
    console.error('Upload avatar API error:', error);
    return Response.json({ error: error.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
