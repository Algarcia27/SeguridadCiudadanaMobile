import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} 
from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const { setUser } = useAuth();
  const scale = useRef(new Animated.Value(1)).current;

  const [showLogin, setShowLogin] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    if (!correo.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setShowLogin(false);
        router.replace('/(tabs)');
      } else {
        setError(data.error || 'Error al iniciar sesión.');
      }
    } catch {
      setError('No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={styles.hero}>
        <View style={[styles.logoRing, { borderColor: colors.border, backgroundColor: colors.surfaceContainer }]}>
          <View style={[styles.logoInner, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={[styles.titleTop, { color: colors.mutedForeground }]}>
          Seguridad Ciudadana
        </Text>
        <Text style={[styles.titleMain, { color: colors.primary }]}>
          TÁCHIRA
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Comisión de Seguridad Ciudadana{'\n'}del Estado Táchira
        </Text>
      </View>

      <View style={[styles.actions, { paddingBottom: bottomInset + 32 }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowLogin(true)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={styles.primaryBtnText}>{t('signIn')}</Text>
            <Ionicons name="log-in-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
            ¿No tienes cuenta?{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Regístrate aquí</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.badges}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{t('safeAccess')}</Text>
          </View>
          <View style={[styles.badgeDot, { backgroundColor: colors.border }]} />
          <View style={styles.badge}>
            <Ionicons name="alert-circle" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{t('tachiraProtected')}</Text>
          </View>
        </View>
      </View>

      <Modal
        visible={showLogin}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLogin(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowLogin(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconWrap, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Iniciar Sesión</Text>
                <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>Comisión de Seguridad Ciudadana</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLogin(false)} style={[styles.closeBtn, { backgroundColor: colors.surfaceContainer }]}>
                <Ionicons name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFields}>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Correo electrónico</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
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
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Contraseña</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setError(''); }}
                    placeholder="Tu contraseña"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: loading ? colors.primary + 'AA' : colors.primary }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.loginBtnText}>Ingresar</Text>
                      <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setShowLogin(false); router.push('/forgot-password'); }}
                style={styles.forgotLink}
              >
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setShowLogin(false); router.push('/register'); }} style={styles.registerLinkModal}>
                <Text style={[styles.registerText, { color: colors.mutedForeground }]}>
                  ¿No tienes cuenta?{' '}
                  <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow1: {
    position: 'absolute', top: -100, left: -100,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: 'rgba(220,38,38,0.08)',
  },
  glow2: {
    position: 'absolute', bottom: -100, right: -100,
    width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(220,38,38,0.04)',
  },
  hero: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  logoRing: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  logoInner: {
    width: 124, height: 124, borderRadius: 62, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  logo: { width: 96, height: 96 },
  titleTop: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 4,
  },
  titleMain: { fontSize: 40, fontFamily: 'Inter_700Bold', letterSpacing: 8 },
  divider: { width: 40, height: 3, borderRadius: 2, marginVertical: 16, opacity: 0.5 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  actions: { paddingHorizontal: 28, gap: 16 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 18,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  badges: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeDot: { width: 4, height: 4, borderRadius: 2 },
  registerLink: { alignItems: 'center', paddingVertical: 2 },
  registerLinkModal: { alignItems: 'center', paddingVertical: 4 },
  forgotLink: { alignItems: 'center', paddingVertical: 2 },
  forgotText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  registerText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  modalIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  modalSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalFields: { gap: 16 },
  fieldWrap: { gap: 6 },
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
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});
