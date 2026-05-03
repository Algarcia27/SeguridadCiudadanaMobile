import bcrypt from 'bcryptjs';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { nombre, correo, telefono, cedula, password } = await request.json();

    if (!nombre || !correo || !password) {
      return Response.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: existing, error: existingErr } = await supabase
      .from('users')
      .select('id')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (existingErr) throw existingErr;
    if (existing) {
      return Response.json({ error: 'El correo ya está registrado.' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const { data: inserted, error: insertErr } = await supabase
      .from('users')
      .insert({
        nombre: nombre.trim(),
        correo: correoNorm,
        telefono: telefono || '',
        cedula: cedula || '',
        password_hash: hash,
      })
      .select('id, nombre, correo, telefono, cedula, avatar_url')
      .single();

    if (insertErr) throw insertErr;

    return Response.json({ success: true, user: inserted }, { status: 201 });
  } catch (err: any) {
    console.error('Register error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
