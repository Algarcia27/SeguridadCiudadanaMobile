import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Animated,
  Image,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { impactLight, notifyWarning } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';

const services = [
  { id: 'counseling', iconName: 'chatbubbles', colorKey: 'traffic', lightKey: 'trafficLight', labelKey: 'counseling', descKey: 'counselingDesc' },
  { id: 'fire', iconName: 'flame', colorKey: 'fire', lightKey: 'fireLight', labelKey: 'fire', descKey: 'fireDesc' },
  { id: 'police', iconName: 'shield', colorKey: 'police', lightKey: 'policeLight', labelKey: 'police', descKey: 'policeDesc' },
  { id: 'health', iconName: 'heart', colorKey: 'health', lightKey: 'healthLight', labelKey: 'health', descKey: 'healthDesc' },
] as const;

function ServiceCard({ service, colors, t }: { service: typeof services[number]; colors: any; t: (k: string) => string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.serviceCard, { transform: [{ scale }], backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
      <TouchableOpacity
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => impactLight()}
        activeOpacity={1}
        style={styles.serviceInner}
      >
        <View style={[styles.serviceIcon, { backgroundColor: (colors as any)[service.lightKey] }]}>
          <Ionicons name={service.iconName as any} size={24} color={(colors as any)[service.colorKey]} />
        </View>
        <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{t(service.labelKey)}</Text>
        <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{t(service.descKey)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const emergencyScale = useRef(new Animated.Value(1)).current;

  const [menuOpen, setMenuOpen] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleEmergency = () => {
    notifyWarning();
    Animated.sequence([
      Animated.spring(emergencyScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(emergencyScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    Linking.openURL('tel:911');
  };

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const handleMenuSelect = (option: string) => {
    setMenuOpen(false);
    impactLight();
    console.log('Selected menu option:', option);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoWrap, { backgroundColor: '#fff', borderColor: colors.border }]}>
            <Image source={require('@/assets/images/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Comisión de Seguridad Ciudadana</Text>
            <Text style={[styles.headerSub, { color: colors.primary }]}>ESTADO TÁCHIRA</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={handleMenuToggle}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {menuOpen && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuSelect('emergencyReport')}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>Reporte de emergencia</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuSelect('incidentReport')}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>Reporte de incidente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleMenuSelect('suggestions')}
              >
                <Text style={[styles.dropdownText, { color: colors.foreground }]}>Sugerencias</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Animated.View style={{ transform: [{ scale: emergencyScale }] }}>
          <TouchableOpacity
            style={[styles.emergencyCard]}
            onPress={handleEmergency}
            activeOpacity={0.92}
          >
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyBadgeText}>Atención Inmediata</Text>
            </View>
            <Text style={styles.emergencySubtitle}>{t('dispatchCenter')}</Text>
            <Text style={styles.emergencyTitle}>{t('emergency')}</Text>
            <View style={styles.emergencyBtn}>
              <Ionicons name="call" size={20} color="#DC2626" />
              <Text style={styles.emergencyBtnText}>{t('requestHelp')}</Text>
            </View>
            <View style={styles.emergencyGlow} />
          </TouchableOpacity>
        </Animated.View>

        <View style={[styles.locationCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={[styles.locationIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.locationText}>
            <Text style={[styles.locationLabel, { color: colors.mutedForeground }]}>{t('currentLocation')}</Text>
            <Text style={[styles.locationValue, { color: colors.foreground }]}>San Cristóbal, Táchira</Text>
          </View>
          <View style={styles.gpsBadge}>
            <View style={[styles.gpsDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.gpsText, { color: colors.success }]}>{t('gpsActive')}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('supportServices')}</Text>
        </View>

        <View style={styles.servicesGrid}>
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} colors={colors} t={t} />
          ))}
        </View>

        <View style={[styles.alertCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={[styles.alertIcon, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={24} color={colors.mutedForeground} />
          </View>
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{t('silentAlert')}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{t('silentAlertDesc')}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  header: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, overflow: 'visible' },
  logoWrap: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerLogo: { width: 30, height: 30 },
  headerText: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' },
  headerSub: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emergencyCard: {
    backgroundColor: '#DC2626',
    borderRadius: 28,
    padding: 26,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  emergencyBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 2, textTransform: 'uppercase' },
  emergencySubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  emergencyTitle: { color: '#fff', fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: -1, fontStyle: 'italic', marginBottom: 20 },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
  },
  emergencyBtnText: { color: '#DC2626', fontSize: 14, fontFamily: 'Inter_700Bold', letterSpacing: 1, textTransform: 'uppercase' },
  emergencyGlow: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  locationIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  locationText: { flex: 1 },
  locationLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, textTransform: 'uppercase' },
  locationValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  gpsDot: { width: 7, height: 7, borderRadius: 3.5 },
  gpsText: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  serviceCard: { width: '47%', borderRadius: 24, borderWidth: 1 },
  serviceInner: { padding: 20 },
  serviceIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  serviceLabel: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  serviceDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  dropdownMenu: {
    position: 'absolute',
    top: 54,
    right: 0,
    zIndex: 999,
    width: 220,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 16 },
  dropdownText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  alertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 20, borderWidth: 1, padding: 16 },
  alertIcon: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  alertDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
