import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabaseClient';

// Interfaces que describen los datos que envían los formularios.
export interface DataEmergencia {
  tipoEmergencia: string;
  municipio: string;
  ubicacionGps: string;
  cuadranteAsignado: string;
  descripcion?: string;
  urlEvidencia?: string | null;
}

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

/**
 * Busca el usuario actual conectado en Supabase y devuelve su ID.
 * Si el usuario no está conectado, lanza un error claro.
 */
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

/**
 * Sube una foto local a Supabase Storage y devuelve su URL pública.
 */
export async function subirFotoSupabase(fileUri: string): Promise<string> {
  try {
    // Generar un nombre único para el archivo basado en el tiempo
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const rutaArchivo = `incidencias/${nombreArchivo}`;

    // Leer la imagen local usando el FileSystem en Base64 (Pasamos el string directo 'base64')
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64', // 🚀 Solución al error de EncodingType
    });

    // Subir los bytes decodificados al bucket de Supabase
    const { data, error: uploadError } = await supabase.storage
      .from('evidencias_reportes')
      .upload(rutaArchivo, Buffer.from(base64, 'base64'), {
        contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    // Obtener y retornar la URL pública del archivo de forma limpia
    const { data: publicUrlData } = supabase.storage
      .from('evidencias_reportes')
      .getPublicUrl(rutaArchivo); // 🚀 Solución al error de supabaseUrl

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('subirFotoSupabase error:', error);
    throw new Error(`No se pudo subir la foto a Supabase: ${error.message}`);
  }
}

/**
 * Guarda un reporte de emergencia en la tabla reportes_emergencia.
 * Mapea directamente el frontend con las columnas exactas de la Base de Datos.
 */
export async function enviarEmergencia(data: DataEmergencia) {
  try {
    const usuarioId = await obtenerUsuarioId();

    // Inserción directa y limpia apuntando a los nombres reales en SQL
    const { error } = await supabase
      .from('reportes_emergencia')
      .insert([
        {
          usuario_id: usuarioId,
          municipio: data.municipio,
          ubicacion_gps: data.ubicacionGps,
          cuadrante_asignado: data.cuadranteAsignado, // 🚀 Mapeo directo y correcto
          tipo_emergencia: data.tipoEmergencia,       // Alineado con la opción recomendada
          descripcion: data.descripcion || null,
          url_evidencia: data.urlEvidencia || null,
        },
      ]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('enviarEmergencia error:', error);
    const message = error?.message
      ? `No se pudo guardar el reporte de emergencia: ${error.message}`
      : 'No se pudo guardar el reporte de emergencia. Revise la consola.';
    throw new Error(message);
  }
}

/**
 * Guarda un reporte de incidencia en la tabla reportes_incidencia.
 */
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

/**
 * Guarda una sugerencia en la tabla sugerencias.
 */
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