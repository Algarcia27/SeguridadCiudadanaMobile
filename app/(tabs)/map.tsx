import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
  Image,
} 

from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { useColors } from '@/src/hooks/useColors';
import { useLocationContext } from '@/src/context/LocationContext';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import mapaData from '../../Mapa_Final_Tachira.json';

const { width, height } = Dimensions.get('window');

interface Cuadrante {
  cuadrante: string;
  organismo: string;
  telefono: string;
  sectores: string;
}

interface SupabaseCuadrante {
  MUNICIPIO: string;
  CUADRANTE: string;
  ORGANISMORESPONSABLE: string;
  TELEFONOCUADRANTE: string;
  SECTORES: string;
}

interface Feature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    'Ciudad / Localidad'?: string;
    Municipio?: string;
    Estado?: string;
    País?: string;
    categoria?: string;
    datos_cuadrantes?: Cuadrante[];
    telefono_principal?: string;
  };
  bbox?: number[];
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useTheme();
  const router = useRouter();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [cuadrantesByMunicipio, setCuadrantesByMunicipio] = useState<Record<string, SupabaseCuadrante[]>>({});
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(true);
  const [cuadrantesError, setCuadrantesError] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: 7.7667, longitude: -72.2333 });
  const { user } = useAuth();

  const { currentLocation, locationLabel } = useLocationContext();
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setUserLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation]);

  const avatarUrl =
    user?.avatar_url ||
    (user as any)?.user_metadata?.avatar_url ||
    'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  const normalizarTexto = (texto: string) =>
    String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .toUpperCase();

  useEffect(() => {
    const loadCuadrantes = async () => {
      try {
        setLoadingCuadrantes(true);
        setCuadrantesError(null);
        const response = await fetch('/api/cuadrantes');
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.error || 'No se pudo cargar la información de cuadrantes.');
        }

        const rows: SupabaseCuadrante[] = json.data || [];
        const grouped = rows.reduce<Record<string, SupabaseCuadrante[]>>((acc, item) => {
          const key = normalizarTexto(item.MUNICIPIO || '');
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(item);
          return acc;
        }, {});

        setCuadrantesByMunicipio(grouped);
      } catch (error: any) {
        setCuadrantesError(error?.message || 'Error al cargar los cuadrantes.');
      } finally {
        setLoadingCuadrantes(false);
      }
    };

    loadCuadrantes();
  }, []);

  const initialRegion = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
  };

  const centerOnUser = () => {
    if (!mapRef.current) return;

    const region = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    mapRef.current.animateToRegion(region, 700);
  };

  const handleReportEmergency = () => {
    setMenuAbierto(false);
    router.push('/report-emergency');
  };

  const handleReportIncident = () => {
    setMenuAbierto(false);
    router.push('/report-incident');
  };

  const renderMarker = (feature: Feature, index: number) => {
    const longitude = feature.geometry.coordinates[0];
    const latitude = feature.geometry.coordinates[1];
    const isSeguridad = feature.properties.categoria === 'seguridad';

    return (
      <Marker
        key={index}
        coordinate={{ latitude, longitude }}
        onPress={() => setSelectedFeature(feature)}
      >
        <View style={[styles.markerContainer, { backgroundColor: isSeguridad ? '#3B82F6' : '#EF4444' }]}> 
          <Ionicons name={isSeguridad ? 'shield' : 'alert'} size={16} color="#fff" />
        </View>
      </Marker>
    );
  };

  const renderUserLocationMarker = () => (
    <Marker
      key={`user-marker-${avatarUrl}`}
      coordinate={userLocation}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={true}
    >
      <View style={styles.userMarkerWrapper}>
        <View
          style={[
            styles.marcadorUsuarioContainer,
            { backgroundColor: colors.surface, borderColor: theme === 'light' ? '#FFFFFF' : colors.background },
          ]}
        >
          <Image source={{ uri: `${avatarUrl}?v=${new Date().getTime()}` }} style={styles.fotoPerfilMarcador} resizeMode="cover" />
        </View>
        <View style={[styles.marcadorPinTriangle, { borderTopColor: colors.surface, marginTop: -2 }]} />
      </View>
    </Marker>
  );

  const renderCuadrante = ({ item }: { item: SupabaseCuadrante }) => (
    <View style={[styles.cuadranteItem, { backgroundColor: colors.surface }]}> 
      <View style={styles.cuadranteInfo}>
        <Text style={[styles.cuadranteTitle, { color: colors.foreground }]}>
          {item.ORGANISMORESPONSABLE} · Cuadrante {item.CUADRANTE}
        </Text>
        <View style={styles.sectoresContainer}>
          <Text style={[styles.sectoresText, { color: colors.mutedForeground }]}>
            Sectores: <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>{item.SECTORES}</Text>
          </Text>
        </View>
        <View style={styles.telefonoContainer}>
          <Text style={[styles.telefonoLabel, { color: colors.mutedForeground }]}>TELÉFONO</Text>
          <Text style={[styles.telefonoText, { color: colors.foreground }]}>{item.TELEFONOCUADRANTE}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.callBtn, { backgroundColor: '#D32F2F' }]}
        onPress={() => Linking.openURL(`tel:${item.TELEFONOCUADRANTE}`)}
        activeOpacity={0.85}
      >
        <Ionicons name="call" size={18} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const rawMunicipio = selectedFeature?.properties?.Municipio ?? '';
  const correctedMunicipio = rawMunicipio.trim() === 'Antonio Rómulo Acosta' ? 'Antonio Rómulo Costa' : rawMunicipio;
  const selectedMunicipioKey = selectedFeature ? normalizarTexto(correctedMunicipio) : '';
  const selectedCuadrantes = selectedMunicipioKey ? cuadrantesByMunicipio[selectedMunicipioKey] || [] : [];

  const displayMunicipio = String(
    selectedFeature?.properties?.Municipio ?? selectedCuadrantes[0]?.MUNICIPIO ?? 'Desconocido'
  )
    .replace(/\r?\n/g, '')
    .trim();

  if (loadingCuadrantes) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Cargando información de cuadrantes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        followsUserLocation={false}
        loadingEnabled
        loadingBackgroundColor={colors.surface}
      >
        <UrlTile
          urlTemplate="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          maximumZ={19}
          tileSize={256}
          zIndex={0}
        />
        {mapaData.features.map(renderMarker)}
        {renderUserLocationMarker()}
      </MapView>

      <View style={[styles.topBar, { top: topPad + 12 }]}> 
        <View style={[styles.topCard, { backgroundColor: colors.surface + 'E8', borderColor: colors.border }]}> 
          <View style={[styles.topCardIcon, { backgroundColor: colors.primaryLight }]}> 
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.topCardLabel, { color: colors.mutedForeground }]}>UBICACIÓN ACTUAL:</Text>
            <Text style={[styles.topCardValue, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
              {locationLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={[styles.floatBtn, { backgroundColor: colors.surface + 'E8', borderColor: colors.primary }]}
          onPress={toggleMapType}
        >
          <Ionicons name="layers" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatBtn, { backgroundColor: colors.surface + 'E8', borderColor: colors.primary }]}
          onPress={centerOnUser}
        >
          <Ionicons name="navigate" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {menuAbierto && (
        <Pressable style={styles.menuOverlay} onPress={() => setMenuAbierto(false)} />
      )}

      <View style={[styles.bottomMenuWrapper, { bottom: bottomPad + 16 }]}> 
        {menuAbierto && (
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#D32F2F' }]} onPress={handleReportEmergency}>
              <MaterialIcons name="warning" size={18} color="#fff" />
              <Text style={styles.secondaryButtonText}>Reportar Emergencia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#F57C00' }]} onPress={handleReportIncident}>
              <MaterialIcons name="error" size={18} color="#fff" />
              <Text style={styles.secondaryButtonText}>Reportar Incidente</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: menuAbierto ? '#666' : '#D32F2F' }]}
          onPress={() => setMenuAbierto((prev) => !prev)}
          activeOpacity={0.9}
        >
          <MaterialIcons name={menuAbierto ? 'close' : 'report'} size={26} color="#fff" />
          <Text style={styles.mainActionText}>{menuAbierto ? 'CANCELAR' : 'REPORTAR'}</Text>
        </TouchableOpacity>
      </View>

      {selectedFeature && (
        <View style={[styles.bottomPanel, { bottom: bottomPad, backgroundColor: colors.surface + 'F0', borderColor: colors.border }]}> 
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelectedFeature(null)}
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.municipioTitle, { color: colors.foreground }]}> 
            Municipio: {displayMunicipio}
          </Text>
          {cuadrantesError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>No se pudo cargar la lista de cuadrantes.</Text>
          ) : selectedCuadrantes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No se encontraron cuadrantes para este municipio.</Text>
          ) : (
            <FlatList
              data={selectedCuadrantes}
              renderItem={renderCuadrante}
              keyExtractor={(item, index) => `${item.CUADRANTE}-${index}`}
              style={styles.cuadrantesList}
              contentContainerStyle={{ paddingBottom: 16, paddingTop: 4 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userMarkerWrapper: {
    width: 52,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    position: 'relative',
  },
  userMarkerShadow: {
    position: 'absolute',
    top: 0,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(0,0,0,0.16)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  marcadorUsuarioContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  fotoPerfilMarcador: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  marcadorPinTriangle: {
    position: 'absolute',
    top: 48,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    alignSelf: 'center',
  },
  topBar: { position: 'absolute', left: 16, right: 16 },
  topCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
  topCardIcon: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topCardLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  topCardValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  floatingControls: { position: 'absolute', right: 16, bottom: 200, gap: 10, zIndex: 5, elevation: 5 },
  floatBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.43,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 50,
    elevation: 20,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 6 },
  municipioTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12, paddingHorizontal: 4 },
  cuadrantesList: { flex: 1 },
  errorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 12 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  
  
  cuadranteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 4, 
    borderRadius: 14,
    
    
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.05)',
      }
    }),
    gap: 12,
  },
  cuadranteInfo: { 
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  cuadranteTitle: { 
    fontSize: 14, 
    fontFamily: 'Inter_700Bold',
    lineHeight: 18,
  },
  sectoresContainer: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectoresText: { 
    fontSize: 12, 
    fontFamily: 'Inter_600SemiBold', 
    lineHeight: 18,
    textTransform: 'uppercase', 
  },
  telefonoContainer: {
    flexDirection: 'column',
    marginTop: 2,
  },
  telefonoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  telefonoText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 1,
  },
  callBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  bottomMenuWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 15,
    alignItems: 'center',
  },
  secondaryActions: {
    width: '100%',
    marginBottom: 12,
    gap: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  mainActionButton: {
    width: width - 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 24,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  mainActionText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});