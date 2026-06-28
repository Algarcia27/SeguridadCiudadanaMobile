import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Animated,
  ActivityIndicator,

} 

from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { supabase } from '@/src/supabaseClient';

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

const MUNICIPALITIES = [
  'Andrés Bello',
  'Antonio Rómulo Costa',
  'Ayacucho',
  'Bolívar',
  'Cárdenas',
  'Córdoba',
  'Fernández Feo',
  'Francisco de Miranda',
  'García de Hevia',
  'Guásimos',
  'Independencia',
  'Jáuregui',
  'José María Vargas',
  'Junín',
  'Libertad',
  'Libertador',
  'Lobatera',
  'Michelena',
  'Panamericano',
  'Pedro María Ureña',
  'Rafael Urdaneta',
  'Samuel Dario Maldonado',
  'San Cristóbal',
  'San Judas Tadeo',
  'Seboruco',
  'Simón Rodríguez',
  'Sucre',
  'Torbes',
  'Uribante',
];

function getPasswordStrength(pwd: string): { label: string; color: string; percent: number } {
  if (pwd.length === 0) return { label: '', color: 'transparent', percent: 0 };
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const longEnough = pwd.length >= 8;
  const score = [hasLetter, hasNumber, hasSpecial, longEnough].filter(Boolean).length;
  if (score <= 1) return { label: 'Muy débil', color: '#EF4444', percent: 0.25 };
  if (score === 2) return { label: 'Débil', color: '#F97316', percent: 0.5 };
  if (score === 3) return { label: 'Buena', color: '#F59E0B', percent: 0.75 };
  return { label: 'Fuerte', color: '#10B981', percent: 1 };
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  isPassword?: boolean;
  colors: ReturnType<typeof useColors>;
}

function Field({
  label, value, onChangeText, placeholder, error, keyboardType = 'default', isPassword = false, colors,
}: FieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = isPassword ? getPasswordStrength(value) : null;

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        fieldStyles.inputRow,
        { backgroundColor: colors.surfaceContainer, borderColor: error ? colors.danger : colors.border },
      ]}>
        <TextInput
          style={[fieldStyles.input, { color: colors.foreground, fontFamily: 'Inter_400Regular' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground + '80'}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : isPassword ? 'none' : 'words'}
          autoCorrect={false}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setVisible(v => !v)} style={fieldStyles.eyeBtn}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {isPassword && value.length > 0 && strength && (
        <View style={fieldStyles.strengthRow}>
          <View style={[fieldStyles.strengthBar, { backgroundColor: colors.border }]}>
            <View style={[fieldStyles.strengthFill, { width: `${strength.percent * 100}%` as any, backgroundColor: strength.color }]} />
          </View>
          <Text style={[fieldStyles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}
      {error ? <Text style={[fieldStyles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, minHeight: 52,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  error: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    cedula: '',
    municipio: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showMunicipios, setShowMunicipios] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const set = (key: keyof typeof form) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
    setServerError('');
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido.';
    if (!form.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Ingresa un correo válido.';
    if (!form.telefono.trim() || !/^\+?[0-9]{7,15}$/.test(form.telefono.replace(/\s/g, ''))) e.telefono = 'Ingresa un teléfono válido.';
    if (!form.cedula.trim() || !/^[0-9]{6,10}$/.test(form.cedula)) e.cedula = 'Número de cédula inválido (6-10 dígitos).';
    if (!form.municipio.trim()) e.municipio = 'Selecciona un municipio.';
    if (!PASSWORD_REGEX.test(form.password)) e.password = 'Mínimo 8 caracteres con letras, números y caracteres especiales.';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    
    try {
      // Registrar en la autenticación enviando los metadatos
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.correo.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.nombre.trim(),
            telefono: form.telefono.trim(),
            cedula: form.cedula.trim(),
            municipio: form.municipio.trim(),
          }
        }
      });

      console.log("=== REGISTRO SUPABASE ===");
      console.log("Datos devueltos:", authData);
      console.log("Error devuelto:", authError);

      if (authError) {
        setServerError(authError.message);
        setLoading(false);
        return;
      }

      

      setSuccess(true);
      setTimeout(() => router.replace('/index1'), 2000);

    } catch (err) {
      console.error("Error en el catch del registro:", err);
      setServerError('No se pudo conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
    
  };

  const topInset = Platform.OS === 'web' ? 20 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Crear cuenta</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Comisión de Seguridad Ciudadana</Text>
        </View>
        <View style={[styles.shield, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {success ? (
          <View style={[styles.successCard, { backgroundColor: colors.success + '18', borderColor: colors.success + '40' }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.success }]}>¡Registro exitoso!</Text>
            <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Redirigiendo al inicio de sesión…</Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Datos personales</Text>
              </View>
              <View style={styles.fields}>
                <Field label="Nombre completo" value={form.nombre} onChangeText={set('nombre')} placeholder="Ej. Juan Pérez" error={errors.nombre} colors={colors} />
                <Field label="Correo electrónico" value={form.correo} onChangeText={set('correo')} placeholder="ejemplo@correo.com" keyboardType="email-address" error={errors.correo} colors={colors} />
                <Field label="Teléfono" value={form.telefono} onChangeText={set('telefono')} placeholder="+58 412 0000000" keyboardType="phone-pad" error={errors.telefono} colors={colors} />
                <Field label="Número de cédula" value={form.cedula} onChangeText={set('cedula')} placeholder="Ej. 12345678" keyboardType="numeric" error={errors.cedula} colors={colors} />
                <View style={fieldStyles.wrapper}>
                  <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>Municipio</Text>
                  <View style={[fieldStyles.inputRow, { borderColor: errors.municipio ? colors.danger : colors.border, backgroundColor: colors.surfaceContainer }]}> 
                    <TouchableOpacity style={styles.selectButton} onPress={() => setShowMunicipios((v) => !v)}>
                      <Text style={[styles.selectValue, { color: form.municipio ? colors.foreground : colors.mutedForeground }]}> 
                        {form.municipio || 'Selecciona un municipio'}
                      </Text>
                      <Ionicons name={showMunicipios ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  {showMunicipios && (
                    <View style={[styles.optionsWrapper, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}> 
                      <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
                        {MUNICIPALITIES.map((municipio) => (
                          <TouchableOpacity
                            key={municipio}
                            style={[styles.optionItem, { borderBottomColor: colors.border }]}
                            onPress={() => { set('municipio')(municipio); setShowMunicipios(false); }}
                          >
                            <Text style={[styles.optionText, { color: colors.foreground }]}>{municipio}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  {errors.municipio ? <Text style={[fieldStyles.error, { color: colors.danger }]}>{errors.municipio}</Text> : null}
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Seguridad</Text>
              </View>
              <View style={styles.fields}>
                <Field label="Contraseña" value={form.password} onChangeText={set('password')} placeholder="Mín. 8 caracteres" isPassword error={errors.password} colors={colors} />
                <Field label="Verificar contraseña" value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder="Repite la contraseña" isPassword error={errors.confirmPassword} colors={colors} />
              </View>

              <View style={[styles.requirements, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
                <Text style={[styles.reqTitle, { color: colors.mutedForeground }]}>La contraseña debe contener:</Text>
                {[
                  { rule: /[a-zA-Z]/, text: 'Al menos una letra' },
                  { rule: /[0-9]/, text: 'Al menos un número' },
                  { rule: /[^a-zA-Z0-9]/, text: 'Al menos un carácter especial (!@#$…)' },
                  { rule: /.{8,}/, text: 'Mínimo 8 caracteres' },
                ].map(({ rule, text }) => {
                  const ok = rule.test(form.password);
                  return (
                    <View key={text} style={styles.reqRow}>
                      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? colors.success : colors.mutedForeground} />
                      <Text style={[styles.reqText, { color: ok ? colors.success : colors.mutedForeground }]}>{text}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {serverError ? (
              <View style={[styles.serverError, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                <Text style={[styles.serverErrorText, { color: colors.danger }]}>{serverError}</Text>
              </View>
            ) : null}

            <Animated.View style={{ transform: [{ scale }] }}>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: loading ? colors.primary + 'AA' : colors.primary }]}
                onPress={handleSubmit}
                disabled={loading}
                onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
                activeOpacity={1}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                      <Text style={styles.submitText}>Crear cuenta</Text>
                      <Ionicons name="arrow-forward-outline" size={20} color="#fff" />
                    </>
                }
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
              <Text style={[styles.loginLinkText, { color: colors.mutedForeground }]}>
                ¿Ya tienes cuenta?{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Inicia sesión aquí</Text>
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
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(220,38,38,0.07)',
  },
  glow2: {
    position: 'absolute', bottom: -60, right: -60,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(220,38,38,0.04)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, gap: 14,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  shield: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fields: { gap: 14 },
  requirements: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  reqTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reqText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  serverError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  serverErrorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 18,
    shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  successCard: {
    alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1,
    padding: 40, marginTop: 40,
  },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  selectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    flex: 1, minHeight: 52, paddingHorizontal: 16,
  },
  selectValue: { fontSize: 15, fontFamily: 'Inter_400Regular' },
  optionsWrapper: {
    marginTop: 8, borderWidth: 1, borderRadius: 14, overflow: 'hidden', maxHeight: 180,
  },
  optionsScroll: { maxHeight: 180 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 16 },
  optionText: { fontSize: 15, fontFamily: 'Inter_400Regular' },
});
