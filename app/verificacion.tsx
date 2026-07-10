import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
} 

from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { supabase } from '@/src/supabaseClient';

export default function VerificacionScreen() {
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleVerify = async () => {
    setError('');
    setMessage('');

    if (!correo) {
      setError('No se encontró el correo para verificar.');
      return;
    }

    if (!/^[0-9]{6}$/.test(codigo)) {
      setError('Ingresa un código de 6 dígitos.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: correo,
        token: codigo,
        type: 'signup',
      });

      if (verifyError) {
        setError(verifyError.message || 'No se pudo verificar el código.');
      } else if (data) {
        router.replace('/(tabs)');
      } else {
        setError('No se recibió una respuesta válida del servidor.');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      setError('Ocurrió un error al verificar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');

    if (!correo) {
      setError('No se encontró el correo para reenviar el código.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: correo,
      });

      if (resendError) {
        setError(resendError.message || 'No se pudo reenviar el código.');
      } else {
        setMessage('Código reenviado. Revisa tu correo.');
      }
    } catch (err) {
      console.error('OTP resend error:', err);
      setError('Ocurrió un error al reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.cardHeader}>
            <Ionicons name="mail-open-outline" size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Verificación de correo</Text>
          </View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>Ingresa el código de 6 dígitos que te enviamos al correo {correo || 'registrado'}.</Text>

          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceContainer }]}> 
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              value={codigo}
              onChangeText={(value) => setCodigo(value.replace(/[^0-9]/g, ''))}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground + '80'}
              keyboardType="numeric"
              maxLength={6}
              returnKeyType="done"
            />
          </View>

          {error ? <Text style={[styles.feedbackText, { color: colors.danger }]}>{error}</Text> : null}
          {message ? <Text style={[styles.feedbackText, { color: colors.success }]}>{message}</Text> : null}

          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verificar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={loading} activeOpacity={0.8}>
            <Text style={[styles.resendText, { color: colors.primary }]}>Reenviar código</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/index1')} style={styles.linkButton} activeOpacity={0.8}>
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>Volver a inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, justifyContent: 'center', flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: 22, padding: 24, gap: 18, minHeight: 320, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  inputRow: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, justifyContent: 'center' },
  input: { fontSize: 18, fontFamily: 'Inter_500Medium', letterSpacing: 8 },
  verifyButton: { marginTop: 12, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  verifyText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  resendButton: { marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  resendText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  linkButton: { marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  feedbackText: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 8 },
});
