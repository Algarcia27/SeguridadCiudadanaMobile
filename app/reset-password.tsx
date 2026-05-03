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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { correo } = useLocalSearchParams<{ correo: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const getStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: 'transparent', pct: 0 };
    const s = [/[a-zA-Z]/, /[0-9]/, /[^a-zA-Z0-9]/, /.{8,}/].filter(r => r.test(pwd)).length;
    if (s <= 1) return { label: 'Muy débil', color: '#EF4444', pct: 0.25 };
    if (s === 2) return { label: 'Débil', color: '#F97316', pct: 0.5 };
    if (s === 3) return { label: 'Buena', color: '#F59E0B', pct: 0.75 };
    return { label: 'Fuerte', color: '#10B981', pct: 1 };
  };

  const strength = getStrength(newPassword);

  const handleReset = async () => {
    if (code.length !== 6) { setError('El código debe tener 6 dígitos.'); return; }
    if (!PASSWORD_REGEX.test(newPassword)) { setError('La contraseña debe tener letras, números y caracteres especiales (mín. 8).'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, code, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.replace('/index1'), 2500);
      } else {
        setError(data.error || 'Error al restablecer la contraseña.');
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nueva contraseña</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {correo || 'Verificación de seguridad'}
          </Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {success ? (
          <View style={[styles.successCard, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="shield-checkmark" size={44} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.success }]}>¡Contraseña actualizada!</Text>
            <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
              Tu contraseña fue restablecida correctamente. Redirigiendo al inicio de sesión…
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="keypad-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Código de verificación</Text>
              </View>
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Código de 6 dígitos</Text>
                <View style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceContainer, borderColor: colors.border },
                ]}>
                  <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, styles.codeInput, { color: colors.foreground, letterSpacing: 8 }]}
                    value={code}
                    onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    placeholder="● ● ● ● ● ●"
                    placeholderTextColor={colors.mutedForeground + '60'}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Nueva contraseña</Text>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Contraseña</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <Ionicons name="lock-open-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={newPassword}
                    onChangeText={(v) => { setNewPassword(v); setError(''); }}
                    placeholder="Mín. 8 caracteres"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    secureTextEntry={!showNew}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)}>
                    <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={[styles.strengthBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.strengthFill, { width: `${strength.pct * 100}%` as any, backgroundColor: strength.color }]} />
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                  </View>
                )}
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Verificar contraseña</Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); setError(''); }}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={colors.mutedForeground + '80'}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && (
                  <View style={styles.matchRow}>
                    <Ionicons
                      name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={newPassword === confirmPassword ? colors.success : colors.danger}
                    />
                    <Text style={[styles.matchText, { color: newPassword === confirmPassword ? colors.success : colors.danger }]}>
                      {newPassword === confirmPassword ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.requirements, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                {[
                  { rule: /[a-zA-Z]/, text: 'Al menos una letra' },
                  { rule: /[0-9]/, text: 'Al menos un número' },
                  { rule: /[^a-zA-Z0-9]/, text: 'Carácter especial (!@#$…)' },
                  { rule: /.{8,}/, text: 'Mínimo 8 caracteres' },
                ].map(({ rule, text }) => {
                  const ok = rule.test(newPassword);
                  return (
                    <View key={text} style={styles.reqRow}>
                      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={ok ? colors.success : colors.mutedForeground} />
                      <Text style={[styles.reqText, { color: ok ? colors.success : colors.mutedForeground }]}>{text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              </View>
            ) : null}

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: loading ? colors.primary + 'AA' : colors.primary }]}
                onPress={handleReset}
                disabled={loading}
                onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.btnText}>Restablecer contraseña</Text>
                      <Ionicons name="checkmark-outline" size={20} color="#fff" />
                    </>
                }
              </TouchableOpacity>
            </Animated.View>
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
  scroll: { paddingHorizontal: 20, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 14 },
  codeInput: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  matchText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  requirements: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 7 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reqText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 18,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  successCard: {
    borderRadius: 20, borderWidth: 1,
    padding: 32, alignItems: 'center', gap: 12, marginTop: 20,
  },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
