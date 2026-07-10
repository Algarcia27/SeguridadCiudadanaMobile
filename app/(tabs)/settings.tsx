import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Switch,
  Alert,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { impactLight, impactHeavy, notifySuccess } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { supabase } from '@/src/supabaseClient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

type SectionItem = {
  icon: string;
  label: string;
  sub: string;
  iconBg: string;
  iconColor: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
};

function SectionCard({ items, colors }: { items: SectionItem[]; colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
      {items.map((item, i) => (
        <View key={i}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <TouchableOpacity
            style={styles.row}
            onPress={item.onPress}
            activeOpacity={item.onPress ? 0.7 : 1}
          >
            <View style={[styles.rowIcon, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
            </View>
            {item.rightElement ?? (
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

export default function SettingsTabScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [notifAlerts, setNotifAlerts] = useState(true);
  const [notifNews, setNotifNews] = useState(true);
  const [notifSilent, setNotifSilent] = useState(false);
  const [gpsAlways, setGpsAlways] = useState(true);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSavePassword = async () => {
    console.log("=== INICIANDO PROCESO DE CAMBIO DE CONTRASEÑA ===");
    console.log("Nueva clave a procesar:", newPw);

    // 1. Validaciones de seguridad previas
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Por favor, rellena todos los campos.');
      return;
    }

    if (newPw !== confirmPw) {
      Alert.alert('Error', 'La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPw.trim().length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      // 2. Ejecutar la actualización directa en el servidor de Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: newPw.trim()
      });

      console.log("RESPUESTA DEL SERVIDOR SUPABASE:", { data, error });

      if (error) {
        Alert.alert('Aviso de Supabase', error.message);
        return;
      }

      // 3. Flujo visual de éxito
      notifySuccess();
      setPwSaved(true);

      // 4. Forzar el cierre de sesión para limpiar los tokens locales del teléfono
      setTimeout(async () => {
        setPwSaved(false);
        setShowPasswordForm(false);
        setCurrentPw(''); 
        setNewPw(''); 
        setConfirmPw('');

        Alert.alert(
          'Contraseña Actualizada',
          'Tu contraseña ha sido cambiada con éxito en la nube. La sesión se cerrará para sincronizar tu dispositivo.',
          [
            {
              text: 'Entendido',
              onPress: async () => {
                try {
                  await supabase.auth.signOut();
                  console.log("Sesión destruida localmente.");
                  router.replace('/index1');
                } catch (signOutError) {
                  router.replace('/index1');
                }
              }
            }
          ]
        );
      }, 1500);

    } catch (errCritico) {
      console.error('FALLO CRÍTICO EN EL PROCESO:', errCritico);
      Alert.alert('Error', 'Ocurrió un error inesperado en el componente.');
    }
  };

  const handleToggleTheme = () => {
    impactLight();
    toggleTheme();
  };

  const isDark = theme === 'dark';
  const pwMatch = newPw && confirmPw && newPw === confirmPw;
  const pwError = confirmPw && !pwMatch;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('settings')}</Text>
        <View style={[styles.versionBadge, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>v1.0.0</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── APARIENCIA ───────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('appearance')}</Text>

        {/* Theme toggle */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {isDark ? t('darkMode') : t('lightMode')}
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {isDark ? 'Interfaz oscura activa' : 'Interfaz clara activa'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleTheme}
              style={[styles.toggle, { backgroundColor: isDark ? colors.primary : colors.surfaceContainerHigh }]}
              activeOpacity={0.8}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: isDark ? 22 : 2 }] }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={[styles.row, { paddingBottom: 10 }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.policeLight }]}>
              <Ionicons name="language-outline" size={18} color={colors.police} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('language')}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t('localization')}</Text>
            </View>
          </View>
          <View style={styles.langGrid}>
            {(['es', 'en'] as const).map((lang) => {
              const active = language === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langOption,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceContainerHigh,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setLanguage(lang); impactLight(); }}
                >
                  <Text style={styles.langFlag}>{lang === 'es' ? '🇻🇪' : '🇺🇸'}</Text>
                  <Text style={[styles.langName, { color: active ? '#fff' : colors.foreground }]}>
                    {lang === 'es' ? t('spanish') : t('english')}
                  </Text>
                  {active && <Ionicons name="checkmark-circle" size={16} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 14 }} />
        </View>

        {/* ── SEGURIDAD ─────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('security')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => { setShowPasswordForm(!showPasswordForm); impactLight(); }}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.healthLight }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.health} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('passwordManagement')}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t('passwordProtection')}</Text>
            </View>
            <Ionicons
              name={showPasswordForm ? 'chevron-up' : 'chevron-forward'}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>

          {showPasswordForm && (
            <View style={[styles.pwForm, { borderTopColor: colors.border }]}>
              {/* Current password */}
              <View style={[styles.pwField, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.pwInput, { color: colors.foreground }]}
                  placeholder={t('currentPassword')}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showCurrent}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* New password */}
              <View style={[styles.pwField, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
                <Ionicons name="key-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.pwInput, { color: colors.foreground }]}
                  placeholder={t('newPassword')}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showNew}
                  value={newPw}
                  onChangeText={setNewPw}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Confirm password */}
              <View style={[
                styles.pwField,
                { backgroundColor: colors.surfaceContainerHigh, borderColor: pwError ? colors.danger : colors.border },
              ]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={pwError ? colors.danger : colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.pwInput, { color: colors.foreground }]}
                  placeholder={t('confirmPassword')}
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showConfirm}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {pwError && (
                <Text style={[styles.pwError, { color: colors.danger }]}>Las contraseñas no coinciden</Text>
              )}

             <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: pwSaved ? colors.success : colors.primary,
                    opacity: (currentPw && pwMatch) ? 1 : 0.4,
                  },
                ]}
                onPress={handleSavePassword} // 
                disabled={!(currentPw && pwMatch)}
              >
                <Ionicons name={pwSaved ? 'checkmark-circle-outline' : 'save-outline'} size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{pwSaved ? '¡Guardado!' : t('save')}</Text>
              </TouchableOpacity>
            </View>
          )}

          

        </View>

        {/* ── NOTIFICACIONES ────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('notifications')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          {[
            {
              icon: 'alert-circle-outline', label: 'Alertas de emergencia', sub: 'Sismos, incendios, etc.',
              iconBg: colors.primaryLight, iconColor: colors.primary,
              value: notifAlerts, onChange: setNotifAlerts,
            },
            {
              icon: 'newspaper-outline', label: 'Noticias oficiales', sub: 'Comunicados del estado',
              iconBg: colors.policeLight, iconColor: colors.police,
              value: notifNews, onChange: setNotifNews,
            },
            {
              icon: 'volume-mute-outline', label: 'Modo silencioso', sub: 'Solo alertas críticas',
              iconBg: colors.healthLight, iconColor: colors.health,
              value: notifSilent, onChange: setNotifSilent,
            },
          ].map((item, i, arr) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.iconColor} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                <Switch
                 value={item.value}
                onValueChange={async (v) => {
                   item.onChange(v);
                   impactLight();
                   if (v) {
                  await Notifications.requestPermissionsAsync();
             }
           }}
                 trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          ))}
        </View>

        {/* ── UBICACIÓN ─────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Ubicación</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.trafficLight }]}>
              <Ionicons name="location-outline" size={18} color={colors.traffic} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>GPS siempre activo</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Permitir ubicación en segundo plano</Text>
            </View>
            <Switch
              value={gpsAlways}
             onValueChange={async (v) => {
             impactLight();
             if (v) {
             const { status } = await Location.requestForegroundPermissionsAsync();
             if (status === 'granted') {
             setGpsAlways(true);
           } else {
           Alert.alert("Permiso denegado", "Para tu seguridad, necesitamos acceso a la ubicación.");
         }
       } else {
           setGpsAlways(false);
     }
   }}
  trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
  thumbColor="#fff"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}
          onPress={() => router.push('/alerta-silenciosa')}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Alerta Silenciosa</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Configurar gesto de emergencia</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── GENERAL ───────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('general')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>

          <TouchableOpacity 
            style={styles.row} 
            onPress={() => router.push('/emergency-contacts')} 
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.healthLight }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.health} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Contactos de emergencia</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Familiares a notificar</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.policeLight }]}>
              <Ionicons name="information-circle-outline" size={18} color={colors.police} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('about')}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t('version')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.trafficLight }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.traffic} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Términos y Condiciones</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>Política de uso</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── LOGOUT ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '10' }]}
          onPress={() => {
            impactHeavy();
            router.replace('/index1');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>{t('logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  versionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  versionText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  rowSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  toggle: { width: 48, height: 26, borderRadius: 13, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  divider: { height: 1, marginHorizontal: 16 },
  langGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  langOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  langFlag: { fontSize: 18 },
  langName: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pwForm: { borderTopWidth: 1, padding: 16, gap: 10 },
  pwField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pwInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', padding: 0 },
  pwError: { fontSize: 12, fontFamily: 'Inter_500Medium', paddingHorizontal: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
});
