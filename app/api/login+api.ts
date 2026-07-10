import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, password } = await request.json();

    if (!correo || !password) {
      return Response.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: correoNorm,
      password,
    });

    if (authError || !authData.session?.user) {
      return Response.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const userUuid = authData.session.user.id;

    const { data, error: dbError } = await supabase
      .from('users')
      .select(`
        *,
        municipios (
          nombre
        ),
        parroquias (
          nombre
        )
      `)
      .eq('id', userUuid)
      .maybeSingle();

    console.log('Login user data from Supabase:', data);

    if (dbError) {
      console.error('Error al consultar base de datos pública:', dbError);
      return Response.json({ error: 'Error interno al obtener el perfil.' }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        {
          error: 'Autenticación exitosa, pero no se encontró un perfil en la tabla de usuarios para este ID.',
        },
        { status: 404 }
      );
    }

    const resolvedMunicipios = Array.isArray((data as any).municipios)
      ? (data as any).municipios[0] ?? null
      : (data as any).municipios ?? null;
    const resolvedParroquias = Array.isArray((data as any).parroquias)
      ? (data as any).parroquias[0] ?? null
      : (data as any).parroquias ?? null;

    const municipioNombre = resolvedMunicipios?.nombre;
    const parroquiaNombre = resolvedParroquias?.nombre;

    const userFormatted = {
      id: data.id,
      nombres: data.nombres,
      apellidos: data.apellidos ?? '',
      correo: data.correo,
      telefono: data.telefono,
      cedula: data.cedula,
      avatar_url: data.avatar_url,
      municipio_id: data.municipio_id,
      parroquia_id: data.parroquia_id,
      municipio: municipioNombre || 'No asignado',
      parroquia: parroquiaNombre || 'No asignado',
      municipios: resolvedMunicipios,
      parroquias: resolvedParroquias,
    };

    return Response.json(
      {
        user: userFormatted,
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Login error general:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

