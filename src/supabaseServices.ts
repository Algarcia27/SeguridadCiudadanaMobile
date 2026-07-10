import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { MUNICIPALITIES } from '@/src/constants/municipalities';
import { supabase } from './supabaseClient';



export interface DataIncidencia {
  tipoIncidencia: string;
  tipoIncidenciaId?: number | string | null;
  descripcion: string;
  municipio: string;
  municipioId?: number | null;
  parroquia?: string;
  parroquiaId?: number | null;
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

function obtenerMunicipioId(nombre: string, fallback?: number | null): number | null {
  if (typeof fallback === 'number') return fallback;

  const nombreNormalizado = nombre.trim().toLowerCase();
  const index = MUNICIPALITIES.findIndex((item) => item.trim().toLowerCase() === nombreNormalizado);

  return index >= 0 ? index + 1 : null;
}

const MAPEO_TIPOS: Record<string, number> = {
  vandalismo: 10,
  inseguridad: 20,
  'persona sospechosa': 30,
  'vehículo abandonado': 40,
  'falla de alumbrado público': 50,
  'fuga de agua': 60,
  'falla de internet': 70,
  'mascota perdida': 80,
  'agresion fisica': 85,
  'falla de energía eléctrica': 90,
  otros: 99,
};

function convertirTipoIncidenciaId(tipoIncidencia: string, fallback?: number | string | null): number {
  if (fallback !== undefined && fallback !== null) {
    const fallbackNumber = typeof fallback === 'number' ? fallback : Number(fallback);
    if (!Number.isNaN(fallbackNumber)) return fallbackNumber;
  }

  const tipoNormalizado = tipoIncidencia.trim().toLowerCase();
  const tipoId = MAPEO_TIPOS[tipoNormalizado];

  if (tipoId === undefined) {
    throw new Error(`No existe un ID configurado para el tipo de incidencia: ${tipoIncidencia}`);
  }

  return tipoId;
}

export async function enviarIncidencia(data: DataIncidencia) {
  try {
    const usuarioId = await obtenerUsuarioId();
    const municipioId = obtenerMunicipioId(data.municipio, data.municipioId);
    const tipoIncidenciaId = convertirTipoIncidenciaId(data.tipoIncidencia, data.tipoIncidenciaId);

    const { error } = await supabase.from('reportes_incidencia').insert([
      {
        tipo_incidencia_id: tipoIncidenciaId,
        descripcion: data.descripcion,
        municipio_id: municipioId,
        parroquias_id: data.parroquiaId ?? null,
        url_evidencia: data.urlEvidencia,
        usuario_id: usuarioId,
      },
    ]);

    if (error) {
      console.error('--- ERROR DETALLADO DE SUPABASE ---');
     console.error('Código:', error.code);
     console.error('Mensaje:', error.message);
     console.error('Detalles:', error.details);
      throw error;
    }
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