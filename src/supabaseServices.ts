import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';



export interface DataIncidencia {
  tipoIncidencia: string;
  descripcion: string;
  municipio: string;
  urlEvidencia: string | null;
}

export interface DataSugerencia {
  asunto: string;
  contenido: string;
}


async function obtenerUsuarioId(): Promise<string> {
  try {
    const userRes = await supabase.auth.getUser();
    
    if (userRes.error) {
      throw new Error('No se pudo obtener el usuario conectado: ' + userRes.error.message);
    }

    if (!userRes.data?.user?.id) {
      throw new Error('No hay usuario conectado. Inicia sesión para enviar datos.');
    }

    return userRes.data.user.id;
  } catch (err) {
    console.error('obtenerUsuarioId diagnostic error:', err);
    throw err;
  }
}

export async function subirFotoSupabase(fileUri: string): Promise<string> {
  try {
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const rutaArchivo = `incidencias/${nombreArchivo}`;

    
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64, 
    });

    
    const binaryStr: any = decode(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    
    const { data, error: uploadError } = await supabase.storage
      .from('evidencias_reportes')
      .upload(rutaArchivo, bytes.buffer, { 
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 4. Obtenemos la URL pública
    const { data: publicUrlData } = supabase.storage
      .from('evidencias_reportes')
      .getPublicUrl(rutaArchivo); 

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('subirFotoSupabase error:', error);
    throw new Error(`No se pudo subir la foto a Supabase: ${error.message}`);
  }
}

export async function enviarIncidencia(data: DataIncidencia) {
  try {
    const usuarioId = await obtenerUsuarioId();

    const { error } = await supabase.from('reportes_incidencia').insert([
      {
        tipo_incidencia: data.tipoIncidencia,
        descripcion: data.descripcion,
        municipio: data.municipio,
        url_evidencia: data.urlEvidencia,
        usuario_id: usuarioId,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('enviarIncidencia error:', error);
    throw new Error('No se pudo guardar el reporte de incidencia.');
  }
}


export async function enviarSugerencia(data: DataSugerencia) {
  try {
    const usuarioId = await obtenerUsuarioId();

    const { error } = await supabase.from('sugerencias').insert([
      {
        asunto: data.asunto,
        contenido: data.contenido,
        usuario_id: usuarioId,
      },
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('enviarSugerencia error:', error);
    throw new Error('No se pudo guardar la sugerencia.');
  }
}


export async function actualizarFotoPerfilUsuario(fileUri: string): Promise<string> {
  try {
    const usuarioId = await obtenerUsuarioId();
    const nombreArchivo = `${usuarioId}_avatar.jpg`;
    const rutaArchivo = `avatars/${nombreArchivo}`;

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    const bytes = decode(base64);

    const { error: uploadError } = await supabase.storage
      .from('evidencias_reportes')
      .upload(rutaArchivo, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
        cacheControl: '0',
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('evidencias_reportes')
      .getPublicUrl(rutaArchivo);

    const urlPermanente = publicUrlData.publicUrl;
    if (!urlPermanente) {
      throw new Error('No se pudo obtener la URL pública del avatar.');
    }

    return urlPermanente;

  } catch (error: any) {
    console.error('actualizarFotoPerfilUsuario error:', error);
    throw new Error(`No se pudo guardar la foto de perfil: ${error.message}`);
  }
}