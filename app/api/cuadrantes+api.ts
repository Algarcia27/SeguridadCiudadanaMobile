import { getSupabase } from '@/src/utils/supabase';

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('cuadrantes')
      .select(`
    id,
    estado_id,
    municipio_id,
    parroquias_id,
    codigo,
    organismo,
    telefono,
    sectores,
    municipios (
      nombre
    )
  `);

    if (error) {
      throw error;
    }

    return Response.json({ data: data ?? [] });
  } catch (err: any) {
    console.error('Error fetching cuadrantes:', err);
    return Response.json(
      { error: 'No se pudo obtener la información de cuadrantes.' },
      { status: 500 }
    );
  }
}
