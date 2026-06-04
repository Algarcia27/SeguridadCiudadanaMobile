import { getAuthenticatedSupabaseUser, getSupabase } from '@/src/utils/supabase';

const BUCKET = 'evidencias_reportes';
const EVIDENCIAS_FOLDER = 'incidencias';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedSupabaseUser(request);
    if (!authUser?.id) {
      return Response.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { fileBase64, fileExtension } = await request.json();
    if (!fileBase64 || !fileExtension) {
      return Response.json({ error: 'Datos de archivo incompletos.' }, { status: 400 });
    }

    const fileName = `${EVIDENCIAS_FOLDER}/${Date.now()}.${fileExtension}`;
    const fileBytes = Buffer.from(fileBase64, 'base64');
    const contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

    const supabase = getSupabase();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, fileBytes, {
        contentType,
      });

    if (uploadError) {
      console.error('upload-evidencia API upload error:', uploadError);
      return Response.json({ error: uploadError.message || 'Error al subir el archivo.' }, { status: 500 });
    }

   const { data: publicUrlData } = supabase.storage
  .from(BUCKET)
  .getPublicUrl(fileName);


  if (!publicUrlData?.publicUrl) {
  console.error('upload-evidencia API publicUrl error: Propiedad publicUrl no encontrada');
  return Response.json({ error: 'No se pudo obtener la URL pública del archivo.' }, { status: 500 });
}
    return Response.json({ publicUrl: publicUrlData.publicUrl });
  } catch (err: any) {
    console.error('upload-evidencia API error:', err);
    return Response.json({ error: err?.message || 'Error interno del servidor.' }, { status: 500 });
  }
}
