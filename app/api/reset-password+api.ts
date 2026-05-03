import bcrypt from 'bcryptjs';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo, code, newPassword } = await request.json();

    if (!correo || !code || !newPassword) {
      return Response.json({ error: 'Todos los campos son requeridos.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_code, reset_code_expiry')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return Response.json({ error: 'Correo no encontrado.' }, { status: 404 });
    }

    if (!user.reset_code || user.reset_code !== code) {
      return Response.json({ error: 'Código de verificación incorrecto.' }, { status: 400 });
    }

    if (!user.reset_code_expiry || new Date() > new Date(user.reset_code_expiry)) {
      return Response.json({ error: 'El código ha expirado. Solicita uno nuevo.' }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return Response.json({
        error: 'La contraseña debe tener mínimo 8 caracteres con letras, números y caracteres especiales.',
      }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    const { error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash: hash,
        reset_code: null,
        reset_code_expiry: null,
      })
      .eq('correo', correoNorm);

    if (updateErr) throw updateErr;

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
