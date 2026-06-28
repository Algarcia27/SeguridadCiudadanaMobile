import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { impactLight, impactHeavy, notifySuccess } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useTheme } from '@/src/context/ThemeContext';
import { useLanguage } from '@/src/context/LanguageContext';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSavePassword = () => {
    if (!currentPw || !newPw) return;
    notifySuccess();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowPasswordForm(false);
      setCurrentPw('');
      setNewPw('');
    }, 2000);
  };

  const handleToggleTheme = () => {
    impactLight();
    toggleTheme();
  };

  const generalItems = [
    { icon: 'notifications-outline', label: t('notifications'), sub: 'Alertas y avisos', colorKey: 'police', lightKey: 'policeLight' },
    { icon: 'shield-outline', label: 'Privacidad', sub: t('privacyData'), colorKey: 'success', lightKey: 'trafficLight' },
    { icon: 'information-circle-outline', label: t('about'), sub: t('version'), colorKey: 'mutedForeground', lightKey: 'surfaceContainerHigh' },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('appearance')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={18} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {theme === 'dark' ? t('darkMode') : t('lightMode')}
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{t('appearance')}</Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleTheme}
              style={[styles.toggle, { backgroundColor: theme === 'dark' ? colors.primary : colors.surfaceContainerHigh }]}
            >
              <View style={[styles.toggleThumb, { transform: [{ translateX: theme === 'dark' ? 22 : 2 }] }]} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.langSection}>
            <View style={[styles.rowIcon, { backgroundColor: colors.policeLight }]}>
              <Ionicons name="language-outline" size={18} color={colors.police} />
            </View>
            <View style={styles.langContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t('language')}</Text>
              <View style={styles.langBtns}>
                <TouchableOpacity
                  style={[styles.langBtn, { backgroundColor: language === 'es' ? colors.primary : colors.surfaceContainerHigh, borderColor: language === 'es' ? colors.primary : 'transparent' }]}
                  onPress={() => { setLanguage('es'); impactLight(); }}
                >
                  <Text style={[styles.langBtnText, { color: language === 'es' ? '#fff' : colors.mutedForeground }]}>{t('spanish')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langBtn, { backgroundColor: language === 'en' ? colors.primary : colors.surfaceContainerHigh, borderColor: language === 'en' ? colors.primary : 'transparent' }]}
                  onPress={() => { setLanguage('en'); impactLight(); }}
                >
                  <Text style={[styles.langBtnText, { color: language === 'en' ? '#fff' : colors.mutedForeground }]}>{t('english')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('security')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={() => setShowPasswordForm(!showPasswordForm)}>
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
              <View style={[styles.pwField, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
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
              <View style={[styles.pwField, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
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
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saved ? colors.success : colors.primary, opacity: (currentPw && newPw) ? 1 : 0.5 }]}
                onPress={handleSavePassword}
              >
                <Ionicons name={saved ? 'checkmark-circle-outline' : 'save-outline'} size={18} color="#fff" />
                <Text style={styles.saveBtnText}>{saved ? 'Actualizado' : t('save')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{t('general')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          {generalItems.map((item, i) => (
            <View key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <TouchableOpacity style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: (colors as any)[item.lightKey] }]}>
                  <Ionicons name={item.icon as any} size={18} color={(colors as any)[item.colorKey]} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '10' }]}
          onPress={() => { impactHeavy(); router.replace('/index1'); }}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: -0.5 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  rowIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  rowSub: { fontSize: 11, fontFamily: 'Inter_400Regular', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  toggle: { width: 48, height: 26, borderRadius: 13, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  divider: { height: 1, marginHorizontal: 18 },
  langSection: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', padding: 18 },
  langContent: { flex: 1, gap: 12 },
  langBtns: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
  langBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pwForm: { borderTopWidth: 1, padding: 18, gap: 12 },
  pwField: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  pwInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, borderWidth: 1, marginTop: 8 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
});