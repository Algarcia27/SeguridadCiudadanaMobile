import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifySuccess } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';

interface UserData {
  displayName: string;
  email: string;
  phone: string;
  cedula: string;
  municipio: string;
}

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useLanguage();
  const { user, setUser } = useAuth();

  const [userData, setUserData] = useState<UserData>({
    displayName: user?.nombre || 'Usuario Ciudadano',
    email: user?.correo || '',
    phone: user?.telefono || '',
    cedula: user?.cedula || '',
    municipio: user?.municipio || '',
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  useEffect(() => {
    if (user) {
      setUserData({
        displayName: user.nombre,
        email: user.correo,
        phone: user.telefono || '',
        cedula: user.cedula || '',
        municipio: user.municipio || '',
      });
      setAvatarUri(user.avatar_url || null);
    } else {
      AsyncStorage.getItem('user-profile').then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          setUserData(parsed);
          if (parsed.avatarUri) setAvatarUri(parsed.avatarUri);
        }
      });
    }
  }, [user]);

  const saveField = async (field: keyof UserData) => {
    const updated = { ...userData, [field]: tempValue };
    setUserData(updated);
    AsyncStorage.setItem('user-profile', JSON.stringify({ ...updated, avatarUri }));
    setEditing(null);

    if (user?.id) {
      const profileFieldMap: Record<keyof UserData, string> = {
        displayName: 'nombre',
        email: 'correo',
        phone: 'telefono',
        cedula: 'cedula',
        municipio: 'municipio',
      };

      try {
        const body = { [profileFieldMap[field]]: tempValue };
        const res = await fetch('/api/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser({ ...user, ...data.user });
          }
        }
      } catch (err) {
        console.warn('Could not sync profile update:', err);
      }
    }

    notifySuccess();
  };

  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a tu galería para cambiar la foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        AsyncStorage.setItem('user-profile', JSON.stringify({ ...userData, avatarUri: uri }));

        if (user?.token) {
          try {
            const res = await fetch('/api/update-avatar', {
              method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({ avatarUrl: uri }),
            });
            if (res.ok) {
              const data = await res.json();
              setUser({ ...user, avatar_url: uri });
            }
          } catch (e) {
            console.warn('Could not sync avatar to server');
          }
        }
        notifySuccess();
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const fields: { key: keyof UserData; labelKey: string; icon: string; type: string }[] = [
    { key: 'email', labelKey: 'email', icon: 'mail-outline', type: 'email-address' },
    { key: 'phone', labelKey: 'phone', icon: 'call-outline', type: 'phone-pad' },
    { key: 'cedula', labelKey: 'id', icon: 'card-outline', type: 'numeric' },
    { key: 'municipio', labelKey: 'municipio', icon: 'location-outline', type: 'picker' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.surfaceContainerHigh }]}> 
        <View style={styles.headerTop}> 
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t('profile')}</Text> 
        </View>
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuter}>
            <View style={[styles.avatarRing, { borderColor: colors.border }]}> 
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}> 
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={44} color={colors.mutedForeground} />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.avatarPlusBtn}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{userData.displayName}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.foreground} />
            <Text style={[styles.verifiedText, { color: colors.foreground }]}>{t('verifiedCitizen')}</Text>
          </View>
        </View>
        <View style={[styles.headerGlow]} pointerEvents="none" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.nameCard}>
          {editing === 'displayName' ? (
            <View style={[styles.editRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
              <TextInput
                style={[styles.editInput, { color: colors.foreground }]}
                value={tempValue}
                onChangeText={setTempValue}
                autoFocus
                placeholderTextColor={colors.mutedForeground}
              />
              <TouchableOpacity onPress={() => saveField('displayName')}>
                <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Ionicons name="close-circle" size={28} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.nameRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}
              onPress={() => { setTempValue(userData.displayName); setEditing('displayName'); }}
            >
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.nameValue, { color: colors.foreground }]}>{userData.displayName}</Text>
              <Ionicons name="pencil-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          {fields.map((field, i) => (
            <View key={field.key}>
              {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
              {editing === field.key ? (
                field.type === 'picker' ? (
                  <View style={[styles.editFieldPicker, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}> 
                    <View style={[styles.fieldIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={field.icon as any} size={18} color={colors.primary} />
                  </View>
                    <ScrollView style={styles.municipioScroll} nestedScrollEnabled>
                      {MUNICIPALITIES.map((municipio) => (
                        <TouchableOpacity
                          key={municipio}
                          style={[styles.municipioOption, { backgroundColor: municipio === tempValue ? colors.primaryLight : colors.surface }]}
                          onPress={() => setTempValue(municipio)}
                        >
                          <Text style={[styles.municipioOptionText, { color: colors.foreground }]}>{municipio}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.pickerActions}>
                      <TouchableOpacity onPress={() => saveField(field.key)} style={styles.pickerActionButton}>
                        <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditing(null)} style={styles.pickerActionButton}>
                        <Ionicons name="close-circle" size={26} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.editFieldRow}>
                    <View style={[styles.fieldIcon, { backgroundColor: colors.primaryLight }]}> 
                      <Ionicons name={field.icon as any} size={18} color={colors.primary} />
                    </View>
                    <TextInput
                      style={[styles.editInput, { color: colors.foreground, flex: 1 }]}
                      value={tempValue}
                      onChangeText={setTempValue}
                      autoFocus
                      keyboardType={field.type as any}
                      placeholderTextColor={colors.mutedForeground}
                    />
                    <TouchableOpacity onPress={() => saveField(field.key)}>
                      <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditing(null)}>
                      <Ionicons name="close-circle" size={26} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                <TouchableOpacity
                  style={styles.fieldRow}
                  onPress={() => { setTempValue(userData[field.key]); setEditing(field.key); }}
                >
                  <View style={[styles.fieldIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={field.icon as any} size={18} color={colors.primary} />
                  </View>
                  <View style={styles.fieldText}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t(field.labelKey)}</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                      {userData[field.key] || t('notRegistered')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.securityBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
          <View style={[styles.secBtnIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.secBtnText, { color: colors.foreground }]}>{t('securityPrivacy')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 36, position: 'relative', overflow: 'hidden' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  avatarSection: { alignItems: 'center' },
  avatarOuter: { position: 'relative', marginBottom: 14 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, padding: 4 },
  avatar: { flex: 1, borderRadius: 46, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 46 },
  avatarPlusBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  displayName: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  verifiedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 14 },
  nameCard: {},
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1 },
  nameValue: { flex: 1, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, borderWidth: 1 },
  editFieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  editFieldPicker: { padding: 14, gap: 12, borderRadius: 18 },
  municipioScroll: { maxHeight: 220 },
  municipioOption: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8 },
  municipioOptionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  pickerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  pickerActionButton: { padding: 4 },
  editInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', padding: 0 },
  infoCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  sep: { height: 1, marginHorizontal: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  fieldIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldText: { flex: 1 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  fieldValue: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 2 },
  securityBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  secBtnIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  secBtnText: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
