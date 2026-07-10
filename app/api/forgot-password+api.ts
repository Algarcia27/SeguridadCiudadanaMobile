import { Resend } from 'resend';
import { getSupabase } from '@/src/utils/supabase';

export async function POST(request: Request) {
  try {
    const { correo } = await request.json();

    if (!correo) {
      return Response.json({ error: 'El correo es requerido.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const correoNorm = correo.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nombre')
      .eq('correo', correoNorm)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return Response.json({ error: 'No existe una cuenta con ese correo.' }, { status: 404 });
    }

    const { nombre } = user;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabase
      .from('users')
      .update({ reset_code: code, reset_code_expiry: expiry })
      .eq('correo', correoNorm);

    if (updateErr) throw updateErr;

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'No-reply@seguridadciudadanatachira.info';

    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: `Seguridad Ciudadana Táchira <${fromEmail}>`,
        to: correo.trim(),
        subject: '🔐 Código de verificación — Seguridad Ciudadana Táchira',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin:0;padding:0;background-color:#0A0A0F;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width:520px;background-color:#12121C;border-radius:24px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
                    
                    <tr>
                      <td style="background-color:#DC2626;padding:32px;text-align:center;">
                        <p style="margin:0 0 6px;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Comisión de Seguridad Ciudadana</p>
                        <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">TÁCHIRA</h1>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:36px 40px 12px;">
                        <p style="margin:0 0 6px;color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Hola,</p>
                        <h2 style="margin:0 0 16px;color:#F0F0FF;font-size:20px;font-weight:600;">${nombre}</h2>
                        <p style="margin:0;color:#9898C0;font-size:14px;line-height:22px;">
                          Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:24px 40px;">
                        <div style="background-color:#1A1A28;border:1px solid rgba(220,38,38,0.3);border-radius:16px;padding:28px;text-align:center;">
                          <p style="margin:0 0 8px;color:#9898C0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Código de verificación</p>
                          <p style="margin:0;color:#EF4444;font-size:42px;font-weight:700;letter-spacing:10px;font-family:monospace;">${code}</p>
                          <p style="margin:12px 0 0;color:#9898C0;font-size:12px;">Válido por <strong style="color:#F0F0FF;">15 minutos</strong></p>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 40px 32px;">
                        <p style="margin:0 0 16px;color:#9898C0;font-size:13px;line-height:20px;">
                          Si no solicitaste este código, puedes ignorar este correo. Tu contraseña no será cambiada.
                        </p>
                        <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:20px;margin-top:8px;">
                          <p style="margin:0;color:#9898C0;font-size:11px;text-align:center;">
                            © ${new Date().getFullYear()} Comisión de Seguridad Ciudadana del Estado Táchira
                          </p>
                        </div>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    }

    return Response.json({
      success: true,
      nombre,
      emailSent: !!apiKey,
      ...(apiKey ? {} : { code }),
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
