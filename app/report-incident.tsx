import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useAuth } from '@/src/context/AuthContext';
import { MUNICIPALITIES } from '@/src/constants/municipalities';
import { enviarIncidencia, subirFotoSupabase } from '@/src/supabaseServices';

const INCIDENT_TYPES = [
  'Vandalismo',
  'Inseguridad',
  'Bloqueo',
  'Vehículo abandonado',
  'Mascota perdida',
  'Agresion Fisica',
  'Violencia de genero',
  'Otros',
];

export default function ReportIncidentScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [tipoIncidente, setTipoIncidente] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showMunicipios, setShowMunicipios] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setAttachments((current) => [...current, ...uris]);
    }
  };

  const handleRemoveAttachment = (uri: string) => {
    setAttachments((current) => current.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (!tipoIncidente || !municipio || !descripcion.trim()) {
      setError('Por favor completa todos los campos del reporte.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const urlEvidencia = attachments.length > 0 ? await subirFotoSupabase(attachments[0]) : null;

      await enviarIncidencia({
        tipoIncidencia: tipoIncidente,
        descripcion,
        municipio,
        urlEvidencia,
      });

      setSuccess(true);
      Alert.alert('Reporte enviado', 'Tu reporte de incidente ha sido registrado.');
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('handleSubmit incidente error:', err);
      setError('Ocurrió un error al enviar el reporte. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.surfaceContainer }]}> 
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface }]}> 
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}> 
            <Text style={[styles.title, { color: colors.foreground }]}>Reporte de incidente</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Describe el incidente y adjunta evidencia visual si es posible.</Text>
          </View>
        </View>

        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Datos del usuario</Text>
          {user ? (
            <View style={styles.userInfo}> 
              <Text style={[styles.userText, { color: colors.foreground }]}>{user.nombre}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.correo}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.telefono}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.municipio}</Text>
            </View>
          ) : (
            <Text style={[styles.userMissing, { color: colors.mutedForeground }]}>Inicia sesión para que el reporte use tus datos automáticamente.</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tipo de incidente</Text>
          <View style={styles.selectionGrid}>
            {INCIDENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: tipoIncidente === type ? colors.police : colors.surfaceContainer,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTipoIncidente(type)}
              >
                <Text style={[styles.typeButtonText, { color: tipoIncidente === type ? '#fff' : colors.foreground }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Municipio</Text>
          <TouchableOpacity
            style={[styles.selectInput, { borderColor: error && !municipio ? colors.danger : colors.border, backgroundColor: colors.surfaceContainer }]}
            onPress={() => setShowMunicipios((prev) => !prev)}
          >
            <Text style={[styles.selectValue, { color: municipio ? colors.foreground : colors.mutedForeground }]}> 
              {municipio || 'Selecciona un municipio'}
            </Text>
            <Ionicons name={showMunicipios ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showMunicipios && (
            <View style={[styles.optionsList, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}> 
              <ScrollView nestedScrollEnabled style={styles.optionsScroll}>
                {MUNICIPALITIES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.optionRow}
                    onPress={() => { setMunicipio(item); setShowMunicipios(false); }}
                  >
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dirección</Text>
          <TextInput
            style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Dirección desde donde reportas el incidente"
            placeholderTextColor={colors.mutedForeground + '88'}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Descripción</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe lo que está ocurriendo..."
            placeholderTextColor={colors.mutedForeground + '88'}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fotos y videos</Text>
          <TouchableOpacity style={[styles.uploadButton, { backgroundColor: colors.primary }]} onPress={handlePickMedia}>
            <Ionicons name="images-outline" size={18} color="#fff" />
            <Text style={styles.uploadText}>Agregar fotos/videos</Text>
          </TouchableOpacity>
          {attachments.length > 0 ? (
            <View style={styles.attachmentsGrid}>
              {attachments.map((uri) => (
                <View key={uri} style={[styles.attachmentCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}> 
                  <Image source={{ uri }} style={styles.attachmentImage} />
                  <TouchableOpacity style={styles.removeAttachment} onPress={() => handleRemoveAttachment(uri)}>
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>Puedes adjuntar fotos o videos para documentar el incidente.</Text>
          )}
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        {success ? (
          <View style={[styles.successCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}> 
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>Reporte enviado correctamente.</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Enviando...' : 'Enviar reporte'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 24, marginBottom: 8 },
  backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  userCard: { borderWidth: 1, borderRadius: 24, padding: 18 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  userInfo: { gap: 4 },
  userText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  userMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  userMissing: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  card: { borderWidth: 1, borderRadius: 24, padding: 18 },
  selectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, minWidth: '30%' },
  typeButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52 },
  selectValue: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  optionsList: { marginTop: 10, borderWidth: 1, borderRadius: 18, maxHeight: 220 },
  optionsScroll: { paddingVertical: 8 },
  optionRow: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  optionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  textArea: { minHeight: 140, borderWidth: 1, borderRadius: 18, padding: 16, fontSize: 15, fontFamily: 'Inter_400Regular' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 14 },
  uploadText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  attachmentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  attachmentCard: { width: 100, height: 100, borderRadius: 18, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  attachmentImage: { width: '100%', height: '100%' },
  removeAttachment: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 2 },
  hintText: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8 },
  errorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  successText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  submitButton: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  inputField: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, minHeight: 52, fontSize: 15, fontFamily: 'Inter_400Regular' },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
