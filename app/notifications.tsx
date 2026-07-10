import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} 
from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { impactLight, impactMedium, notifySuccess } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'earthquake' | 'system';
  time: string;
  read: boolean;
}

const INITIAL: Notification[] = [
  { id: '1', title: 'Alerta de Sismo', message: 'Se ha detectado un sismo de magnitud 4.2 a 15km de San Cristóbal. Mantenga la calma.', type: 'earthquake', time: 'Hace 5 min', read: false },
  { id: '2', title: 'Mantenimiento del Sistema', message: 'El sistema entrará en mantenimiento programado hoy a las 11:00 PM.', type: 'system', time: 'Hace 1 hora', read: false },
  { id: '3', title: 'Nueva Noticia', message: 'Se han habilitado nuevos puntos de atención ciudadana en el municipio Cárdenas.', type: 'info', time: 'Hace 3 horas', read: true },
  { id: '4', title: 'Alerta Meteorológica', message: 'Fuertes lluvias previstas para las próximas 24 horas en la zona norte del estado.', type: 'alert', time: 'Hace 5 horas', read: false },
];

const TYPE_CONFIG = {
  earthquake: { icon: 'pulse', colorKey: 'danger' },
  alert: { icon: 'warning', colorKey: 'warning' },
  system: { icon: 'notifications', colorKey: 'police' },
  info: { icon: 'information-circle', colorKey: 'primary' },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    impactLight();
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notifySuccess();
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    impactMedium();
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const config = TYPE_CONFIG[item.type];
    const accentColor = (colors as any)[config.colorKey];

    return (
      <View style={[
        styles.notifCard,
        { backgroundColor: item.read ? colors.surfaceContainer : colors.surface, borderColor: item.read ? colors.border : accentColor + '30' },
        !item.read && { shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
      ]}>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: accentColor }]} />}
        <View style={styles.notifContent}>
          <View style={[styles.notifIcon, { backgroundColor: accentColor + '18' }]}>
            <Ionicons name={config.icon as any} size={22} color={accentColor} />
          </View>
          <View style={styles.notifText}>
            <View style={styles.notifTitleRow}>
              <Text style={[styles.notifTitle, { color: !item.read ? accentColor : colors.foreground }]}>{item.title}</Text>
              <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>{item.time}</Text>
            </View>
            <Text style={[styles.notifMessage, { color: colors.mutedForeground }]}>{item.message}</Text>
            <View style={styles.notifActions}>
              {!item.read && (
                <TouchableOpacity
                  style={[styles.readBtn, { backgroundColor: accentColor + '18' }]}
                  onPress={() => markAsRead(item.id)}
                >
                  <Text style={[styles.readBtnText, { color: accentColor }]}>{t('markAsRead')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteNotification(item.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceContainer }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>{t('markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEnabled={notifications.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainer }]}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('noNotifications')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>{t('noNotificationsDesc')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  notifCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  unreadDot: { position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: 4 },
  notifContent: { flexDirection: 'row', gap: 14, padding: 18 },
  notifIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifText: { flex: 1, gap: 4 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  notifTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', flex: 1 },
  notifTime: { fontSize: 10, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.3 },
  notifMessage: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  notifActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  readBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  readBtnText: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 14 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyDesc: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
