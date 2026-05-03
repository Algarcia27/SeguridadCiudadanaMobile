import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';

const directory = [
  { label: 'Central de Emergencias', sub: '911', colorKey: 'danger', lightKey: 'primaryLight', phone: '911' },
  { label: 'Bomberos Táchira', sub: '(0276) 347.12.34', colorKey: 'police', lightKey: 'policeLight', phone: '02763471234' },
  { label: 'Protección Civil', sub: '(0276) 353.12.12', colorKey: 'success', lightKey: 'trafficLight', phone: '02763531212' },
  { label: 'Policía del Táchira', sub: '(0276) 341.22.11', colorKey: 'health', lightKey: 'healthLight', phone: '02763412211' },
];

const socials = [
  { name: 'Instagram', icon: 'logo-instagram', url: 'https://www.instagram.com/seguridadciudadanatachira/' },
  { name: 'TikTok', icon: 'logo-tiktok', url: 'https://www.tiktok.com/@c.seguridadtachira?_r=1&_t=ZS-960wcZE34wH' },
];

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.logoBg, { backgroundColor: '#fff', borderColor: colors.border }]}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Información{'\n'}Institucional</Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Comprometidos con la protección y el bienestar de cada ciudadano tachirense.
          </Text>
        </View>

        <View style={styles.missionGrid}>
          <View style={[styles.missionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={[styles.missionIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="flag-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>{t('mission')}</Text>
            <Text style={[styles.missionText, { color: colors.mutedForeground }]}>{t('missionText')}</Text>
          </View>
          <View style={[styles.missionCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <View style={[styles.missionIcon, { backgroundColor: colors.policeLight }]}>
              <Ionicons name="eye-outline" size={20} color={colors.police} />
            </View>
            <Text style={[styles.missionTitle, { color: colors.foreground }]}>{t('vision')}</Text>
            <Text style={[styles.missionText, { color: colors.mutedForeground }]}>{t('visionText')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('emergencyDirectory')}</Text>
        <View style={[styles.directoryCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          {directory.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dirItem, i < directory.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <View style={[styles.dirIcon, { backgroundColor: (colors as any)[item.lightKey] }]}>
                <Ionicons name="call" size={18} color={(colors as any)[item.colorKey]} />
              </View>
              <View style={styles.dirText}>
                <Text style={[styles.dirLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.dirPhone, { color: (colors as any)[item.colorKey] }]}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('mainOffice')}</Text>
        <TouchableOpacity
          style={[styles.officeCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
          onPress={() => Linking.openURL('https://maps.app.goo.gl/b7WCsFDp95cLaSMX9')}
        >
          <View style={styles.officeContent}>
            <Ionicons name="location" size={18} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.officeAddress, { color: colors.mutedForeground }]}>
              Comisión de Seguridad Ciudadana del Estado Táchira, San Cristóbal.
            </Text>
          </View>
          <View style={[styles.mapsBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
            <View style={[styles.mapsBtnDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.mapsBtnText, { color: colors.foreground }]}>Ver en Google Maps</Text>
            <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('socialNetworks')}</Text>
        <View style={styles.socialsRow}>
          {socials.map((s) => (
            <TouchableOpacity
              key={s.name}
              style={[styles.socialBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={() => Linking.openURL(s.url)}
            >
              <Ionicons name={s.icon as any} size={26} color={colors.foreground} />
              <Text style={[styles.socialName, { color: colors.mutedForeground }]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  heroSection: { alignItems: 'center', marginBottom: 28 },
  logoBg: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logo: { width: 72, height: 72 },
  heroTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 34, marginBottom: 10 },
  heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  missionGrid: { gap: 12, marginBottom: 28 },
  missionCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  missionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  missionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  missionText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  directoryCard: { borderRadius: 20, borderWidth: 1, marginBottom: 28, overflow: 'hidden' },
  dirItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  dirIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dirText: { flex: 1 },
  dirLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dirPhone: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  officeCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 28 },
  officeContent: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  officeAddress: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  mapsBtnDot: { width: 8, height: 8, borderRadius: 4 },
  mapsBtnText: { flex: 1, fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  socialsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  socialBtn: {
    flex: 1, borderRadius: 18, borderWidth: 1,
    paddingVertical: 18, alignItems: 'center', gap: 8,
  },
  socialName: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
});
