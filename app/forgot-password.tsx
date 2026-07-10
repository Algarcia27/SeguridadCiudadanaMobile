import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
} 
from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [userName, setUserName] = useState('');

  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleSend = async () => {
    if (!correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDevCode(data.emailSent ? '' : data.code || '');
        setUserName(data.nombre);
        setSent(true);
      } else {
        setError(data.error || 'Error al procesar la solicitud.');
      }
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Recuperar contraseña</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Comisión de Seguridad Ciudadana</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.warning + '20' }]}>
          <Ionicons name="key-outline" size={22} color={colors.warning} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!sent ? (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="mail-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                ¿Olvidaste tu contraseña?
              </Text>
              <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
                Ingresa el correo con el que te registraste y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
              </Text>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Correo electrónico</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: error ? colors.danger : colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={correo}
                  onChangeText={(v) => { setCorreo(v); setError(''); }}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}
            </View>

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: loading ? colors.primary + 'AA' : colors.primary }]}
                onPress={handleSend}
                disabled={loading}
                onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.btnText}>Enviar código</Text>
                      <Ionicons name="send-outline" size={18} color="#fff" />
                    </>
                }
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Volver a{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Iniciar Sesión</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.successCard, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
              <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              </View>
              <Text style={[styles.successTitle, { color: colors.success }]}>¡Código enviado!</Text>
              <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
                Hola <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{userName}</Text>,{' '}
                {devCode
                  ? <>se generó un código de verificación válido por <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>15 minutos</Text>.</>
                  : <>te enviamos un código de verificación a <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{correo}</Text>. Revisa tu bandeja de entrada.</>
                }
              </Text>
            </View>

            {devCode ? (
              <View style={[styles.codeCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <View style={styles.codeCardHeader}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
                  <Text style={[styles.codeCardTitle, { color: colors.warning }]}>Código de verificación</Text>
                </View>
                <Text style={[styles.codeValue, { color: colors.foreground, letterSpacing: 10 }]}>{devCode}</Text>
                <Text style={[styles.codeNote, { color: colors.mutedForeground }]}>
                  Servicio de email no configurado. Configura RESEND_API_KEY para enviar el código por correo.
                </Text>
              </View>
            ) : (
              <View style={[styles.emailSentCard, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
                <Ionicons name="mail" size={28} color={colors.primary} />
                <Text style={[styles.emailSentText, { color: colors.foreground }]}>
                  Revisa tu bandeja de entrada y también la carpeta de spam si no lo encuentras.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={() => router.push({ pathname: '/reset-password', params: { correo } })}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Restablecer contraseña</Text>
              <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setSent(false); setDevCode(''); setCorreo(''); }} style={styles.cancelLink}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                Usar otro{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>correo</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow1: {
    position: 'absolute', top: -80, left: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(220,38,38,0.06)',
  },
  glow2: {
    position: 'absolute', bottom: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(220,38,38,0.04)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, gap: 14,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 18 },
  infoCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 24, alignItems: 'center', gap: 12,
  },
  infoIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  infoDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 18,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  cancelLink: { alignItems: 'center', paddingVertical: 4 },
  cancelText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  successCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 24, alignItems: 'center', gap: 10,
  },
  successIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  successDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  codeCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 20, alignItems: 'center', gap: 10,
  },
  codeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  codeCardTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  codeValue: { fontSize: 34, fontFamily: 'Inter_700Bold' },
  codeNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  emailSentCard: {
    borderRadius: 18, borderWidth: 1,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  emailSentText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});
