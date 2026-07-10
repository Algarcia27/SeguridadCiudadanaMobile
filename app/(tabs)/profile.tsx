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
  Dimensions,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notifySuccess } from '@/src/utils/haptics';
import { useColors } from '@/src/hooks/useColors';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';
import { actualizarFotoPerfilUsuario } from '@/src/supabaseServices';

const { width } = Dimensions.get('window');

interface UserData {
  displayName: string;
  email: string;
  phone: string;
  cedula: string;
  municipio: string;
  parroquia: string;
}

type ParroquiaOption = {
  id: number;
  nombre: string;
};

function getDisplayName(userLike?: { nombres?: string | null; apellidos?: string | null } | null) {
  const nombres = userLike?.nombres?.trim() || '';
  const apellidos = userLike?.apellidos?.trim() || '';
  return [nombres, apellidos].filter(Boolean).join(' ').trim() || 'Usuario Ciudadano';
}

function getMunicipioId(municipio: string): number | null {
  const index = MUNICIPALITIES.findIndex(
    (item) => item.toLowerCase() === municipio.trim().toLowerCase()
  );
  return index >= 0 ? index + 1 : null;
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
    displayName: getDisplayName(user),
    email: user?.correo || '',
    phone: user?.telefono || '',
    cedula: user?.cedula || '',
    municipio: user?.municipio || '',
    parroquia: user?.parroquia || user?.parroquias?.nombre || 'No asignado',
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url || null);
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [parroquias, setParroquias] = useState<ParroquiaOption[]>([]);
  const [selectedMunicipioId, setSelectedMunicipioId] = useState<number | null>(
    user?.municipio_id ?? null
  );
  const [selectedParroquiaId, setSelectedParroquiaId] = useState<number | null>(
    user?.parroquia_id ?? null
  );
  const [showParroquias, setShowParroquias] = useState(false);

  const fetchParroquias = async (municipioId: number) => {
    try {
      const response = await fetch(`/api/parroquias?municipio_id=${municipioId}`);
      const body = await response.json();
      setParroquias(Array.isArray(body.data) ? body.data : []);
    } catch (error) {
      console.warn('No se pudieron cargar las parroquias:', error);
      setParroquias([]);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const visibleDisplayName = userData.displayName?.trim() || (user ? getDisplayName(user) : 'Usuario Ciudadano');
  const fullNameForEdit = [user?.nombres?.trim(), user?.apellidos?.trim()].filter(Boolean).join(' ');

  useEffect(() => {
    const loadSavedProfile = async () => {
      const raw = await AsyncStorage.getItem('user-profile');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setUserData(parsed);
      if (parsed.avatarUri && !parsed.avatarUri.startsWith('file://')) {
        setAvatarUri(parsed.avatarUri);
      }
    };

    if (user) {
      const municipioId = user.municipio_id ?? getMunicipioId(user.municipio || '');
      const parroquiaId = user.parroquia_id ?? null;
      setSelectedMunicipioId(municipioId);
      setSelectedParroquiaId(parroquiaId);

      setUserData({
        displayName: getDisplayName(user),
        email: user.correo,
        phone: user.telefono || '',
        cedula: user.cedula || '',
        municipio: user.municipio || '',
        parroquia: user.parroquia || user.parroquias?.nombre || 'No asignado',
      });

      if (municipioId) {
        setParroquias([]);
      } else {
        setParroquias([]);
      }

      if (user.avatar_url && !user.avatar_url.startsWith('file://')) {
        setAvatarUri(user.avatar_url);
      } else {
        loadSavedProfile();
      }
    } else {
      loadSavedProfile();
      setParroquias([]);
      setSelectedMunicipioId(null);
      setSelectedParroquiaId(null);
    }
  }, [user]);

 const saveField = async (field: keyof UserData) => {
    let updated = { ...userData, [field]: tempValue };
    
    
    if (field === 'municipio') {
      updated = { ...updated, parroquia: 'No asignado' };
      setSelectedParroquiaId(null);
      setParroquias([]);
    }

    setUserData(updated);
    AsyncStorage.setItem('user-profile', JSON.stringify({ ...updated, avatarUri }));
    setEditing(null);

    if (!user?.id) {
      notifySuccess();
      return;
    }

    try {
      let body: Record<string, any> = {};
      
      
      if (field === 'displayName') {
        const parts = tempValue.trim().split(/\s+/).filter(Boolean);
        body.nombres = parts[0] || '';
        body.apellidos = parts.slice(1).join(' ');
      } else if (field === 'municipio') {
        const municipioId = getMunicipioId(tempValue);
        body.municipio_id = municipioId;
        body.municipio = tempValue;
        body.parroquia_id = null; 
        body.parroquia = 'No asignado';
      } else if (field === 'parroquia') {
        body.parroquia_id = selectedParroquiaId; 
        body.parroquia = tempValue;
      } else if (field === 'email') {
        body.correo = tempValue;
      } else if (field === 'phone') {
        body.telefono = tempValue;
      } else if (field === 'cedula') {
        body.cedula = tempValue;
      }

      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('No se pudo actualizar el perfil');
      }

      const data = await res.json();
      if (data?.user) {
        await setUser((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            ...data.user,
            municipio: data.user.municipio || updated.municipio,
            parroquia: data.user.parroquia || updated.parroquia,
            municipio_id: data.user.municipio_id ?? prev.municipio_id,
            parroquia_id: data.user.parroquia_id ?? prev.parroquia_id,
          };
        });
      }
    } catch (err) {
      console.warn('Could not sync profile update:', err);
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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        const urlPublica = await actualizarFotoPerfilUsuario(uri);

        if (!urlPublica || !urlPublica.startsWith('http')) {
          throw new Error('No se obtuvo una URL pública válida para la foto de perfil.');
        }

        setAvatarUri(urlPublica);
        await AsyncStorage.setItem('user-profile', JSON.stringify({ ...userData, avatarUri: urlPublica }));

        if (user?.token) {
          const response = await fetch('/api/update-avatar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.token}`,
            },
            body: JSON.stringify({ avatarUrl: urlPublica }),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody?.error || 'No se pudo actualizar el avatar en el servidor.');
          }

          const data = await response.json();
          if (data?.success && data?.user) {
            const updatedUser = {
              ...user,
              ...data.user,
              avatar_url: urlPublica,
              user_metadata: {
                ...((user as any)?.user_metadata),
                avatar_url: urlPublica,
              },
            };
            await setUser(updatedUser);
          } else {
            const updatedUser = {
              ...user,
              avatar_url: urlPublica,
              user_metadata: {
                ...((user as any)?.user_metadata),
                avatar_url: urlPublica,
              },
            };
            await setUser(updatedUser);
          }
        } else if (user) {
          const updatedUser = {
            ...user,
            avatar_url: urlPublica,
            user_metadata: {
              ...((user as any)?.user_metadata),
              avatar_url: urlPublica,
            },
          };
          await setUser(updatedUser);
        }

        notifySuccess();
      }
    } catch (error: any) {
      console.error('handlePickAvatar error:', error);
      Alert.alert('Error', error?.message || 'No se pudo actualizar la foto de perfil.');
    }
  };

  const fields: { key: keyof UserData; labelKey: string; icon: string; type: string }[] = [
    { key: 'email', labelKey: 'email', icon: 'mail-outline', type: 'email-address' },
    { key: 'phone', labelKey: 'phone', icon: 'call-outline', type: 'phone-pad' },
    { key: 'cedula', labelKey: 'id', icon: 'card-outline', type: 'numeric' },
    { key: 'municipio', labelKey: 'municipio', icon: 'location-sharp', type: 'picker' },
    { key: 'parroquia', labelKey: 'parroquia', icon: 'map-outline', type: 'picker' },
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
                  <Image source={{ uri: `${avatarUri}?v=${new Date().getTime()}` }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={44} color={colors.mutedForeground} />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.avatarPlusBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>{visibleDisplayName}</Text>
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
                value={tempValue || fullNameForEdit}
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
              onPress={() => { setTempValue(fullNameForEdit || visibleDisplayName); setEditing('displayName'); }}
            >
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.nameValue, { color: colors.foreground }]}>{visibleDisplayName}</Text>
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
                    {field.key === 'municipio' ? (
                      <ScrollView style={styles.municipioScroll} nestedScrollEnabled>
                        {MUNICIPALITIES.map((municipio) => (
                          <TouchableOpacity
                            key={municipio}
                            style={[styles.municipioOption, { backgroundColor: municipio === tempValue ? colors.primaryLight : colors.surface }]}
                            onPress={() => {
                              setTempValue(municipio);
                              const municipioId = getMunicipioId(municipio);
                              setSelectedMunicipioId(municipioId);
                              setParroquias([]);
                              setSelectedParroquiaId(null);
                            }}
                          >
                            <Text style={[styles.municipioOptionText, { color: colors.foreground }]}>{municipio}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : (
                      <View>
                        {selectedMunicipioId ? (
                          parroquias.length > 0 ? (
                            <ScrollView style={styles.municipioScroll} nestedScrollEnabled>
                              {parroquias.map((item) => (
                                <TouchableOpacity
                                  key={item.id}
                                  style={[styles.municipioOption, { backgroundColor: item.nombre === tempValue ? colors.primaryLight : colors.surface }]}
                                  onPress={() => {
                                    setTempValue(item.nombre);
                                    setSelectedParroquiaId(item.id);
                                    
                                  }}
                                >
                                  <Text style={[styles.municipioOptionText, { color: colors.foreground }]}>{item.nombre}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          ) : (
                            <Text style={[styles.municipioOptionText, { color: colors.mutedForeground, padding: 16 }]}>Selecciona primero un municipio.</Text>
                          )
                        ) : (
                          <Text style={[styles.municipioOptionText, { color: colors.mutedForeground, padding: 16 }]}>Selecciona primero un municipio.</Text>
                        )}
                      </View>
                    )}
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
                  onPress={async () => {
                    setTempValue(userData[field.key]);
                    if (field.key === 'parroquia' && selectedMunicipioId && parroquias.length === 0) {
                      await fetchParroquias(selectedMunicipioId);
                    }
                    setEditing(field.key);
                  }}
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
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, padding: 4, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlusBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
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
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  locationSection: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 16, marginTop: 16 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  locationTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  editAction: { padding: 12 },
});
