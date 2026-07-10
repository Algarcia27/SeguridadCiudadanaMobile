import { getSupabase } from '@/src/utils/supabase';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const municipioId = Number(url.searchParams.get('municipio_id'));

    if (!municipioId) {
      return Response.json({ data: [] });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('parroquias')
      .select('id, nombre')
      .eq('municipio_id', municipioId)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error fetching parroquias:', error);
      return Response.json({ error: 'No se pudieron cargar las parroquias.' }, { status: 500 });
    }

    return Response.json({ data: data ?? [] });
  } catch (err: any) {
    console.error('Parroquias API error:', err);
    return Response.json({ error: 'Error interno al consultar parroquias.' }, { status: 500 });
  }
}
