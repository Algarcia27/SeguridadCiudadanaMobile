import { getSupabase } from '@/src/utils/supabase';

const TABLES = ['reportes_emergencia', 'reportes_incidencia', 'sugerencias'];

export async function GET() {
  try {
    const supabase = getSupabase();
    const results: Record<string, any[]> = {};

    for (const table of TABLES) {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', table)
        .eq('table_schema', 'public');

      if (error) {
        return Response.json({ error: `Error reading schema for ${table}: ${error.message}` }, { status: 500 });
      }
      results[table] = data || [];
    }

    return Response.json({ data: results });
  } catch (err: any) {
    console.error('schema-reportes API error:', err);
    return Response.json({ error: err.message || 'Error interno al consultar el esquema.' }, { status: 500 });
  }
}
