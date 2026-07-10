import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useAuth } from '@/src/context/AuthContext';
import { enviarSugerencia } from '@/src/supabaseServices';
import { getSupabase } from '@/src/utils/supabase';

export default function SuggestionsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    const loadProfileName = async () => {
      const hasNameFromContext = [user?.nombres?.trim(), user?.apellidos?.trim()].filter(Boolean).join(' ');
      if (hasNameFromContext) {
        setProfileName(hasNameFromContext);
        return;
      }

      try {
        const supabase = getSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        const userId = authData?.user?.id || user?.id;

        if (authError || !userId) {
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('nombres, apellidos')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const fullName = [data.nombres?.trim(), data.apellidos?.trim()].filter(Boolean).join(' ');
          if (fullName) {
            setProfileName(fullName);
          }
        }
      } catch (err) {
        console.warn('No se pudo cargar el nombre del usuario en sugerencias:', err);
      }
    };

    loadProfileName();
  }, [user?.id, user?.nombres, user?.apellidos]);

  const handleSubmit = async () => {
    if (!asunto.trim() || !mensaje.trim()) {
      setError('Escribe un asunto y el contenido de la sugerencia.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await enviarSugerencia({ asunto, contenido: mensaje });
      setSuccess(true);
      Alert.alert('Sugerencia enviada', 'Gracias por compartir tu sugerencia.');
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('handleSubmit sugerencia error:', err);
      setError('Ocurrió un error al enviar la sugerencia. Intenta nuevamente.');
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
            <Text style={[styles.title, { color: colors.foreground }]}>Buzón de sugerencias</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cuéntanos cómo mejorar la aplicación o el servicio.</Text>
          </View>
        </View>

        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tus datos</Text>
          {user ? (
            <View style={styles.userInfo}> 
              <Text style={[styles.userText, { color: colors.foreground }]}>{profileName || [user?.nombres?.trim(), user?.apellidos?.trim()].filter(Boolean).join(' ') || 'Usuario'}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.correo}</Text>
              <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>{user.telefono}</Text>
            </View>
          ) : (
            <Text style={[styles.userMissing, { color: colors.mutedForeground }]}>Puedes enviar sugerencias sin iniciar sesión, pero se usan mejor con tu cuenta.</Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Asunto</Text>
          <TextInput
            style={[styles.inputField, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]}
            value={asunto}
            onChangeText={setAsunto}
            placeholder="Breve asunto de la sugerencia"
            placeholderTextColor={colors.mutedForeground + '88'}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Escribe tu sugerencia</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surfaceContainer, color: colors.foreground, borderColor: colors.border }]}
            value={mensaje}
            onChangeText={setMensaje}
            placeholder="Tu sugerencia aquí..."
            placeholderTextColor={colors.mutedForeground + '88'}
            multiline
            textAlignVertical="top"
          />
        </View>

        {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

        {success ? (
          <View style={[styles.successCard, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}> 
            <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            <Text style={[styles.successText, { color: colors.success }]}>Sugerencia enviada correctamente.</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitText}>{loading ? 'Enviando...' : 'Enviar sugerencia'}</Text>
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
  inputField: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15, fontFamily: 'Inter_400Regular' },
  textArea: { minHeight: 180, borderWidth: 1, borderRadius: 18, padding: 16, fontSize: 15, fontFamily: 'Inter_400Regular' },
  errorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  successCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12 },
  successText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  submitButton: { borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
