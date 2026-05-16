import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { useColors } from '@/src/hooks/useColors';
import { useLocationContext } from '@/src/context/LocationContext';
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
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [cuadrantesByMunicipio, setCuadrantesByMunicipio] = useState<Record<string, SupabaseCuadrante[]>>({});
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(true);
  const [cuadrantesError, setCuadrantesError] = useState<string | null>(null);
  const { currentLocation, locationLabel } = useLocationContext();
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<MapView | null>(null);

  const normalizarTexto = (texto: string) =>
    String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita acentos
      .replace(/[^a-zA-Z0-9]/g, ' ') // Cambia caracteres no alfanuméricos por espacio
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
    latitude: 7.7667,
    longitude: -72.2333,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  const toggleMapType = () => {
    setMapType((prev) => (prev === 'standard' ? 'satellite' : 'standard'));
  };

  const centerOnUser = () => {
    if (!currentLocation || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      700
    );
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

const renderCuadrante = ({ item }: { item: SupabaseCuadrante }) => (
    <View style={[styles.cuadranteItem, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.cuadranteInfo}>
        <Text style={[styles.cuadranteTitle, { color: colors.foreground }]}>
          {item.ORGANISMORESPONSABLE} · Cuadrante {item.CUADRANTE}
        </Text>
        <Text style={[styles.sectoresText, { color: colors.mutedForeground }]} numberOfLines={3} ellipsizeMode="tail">
          Sectores: {item.SECTORES}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.callBtn, { backgroundColor: colors.primary }]}
        onPress={() => Linking.openURL(`tel:${item.TELEFONOCUADRANTE}`)}
      >
        <Text style={[styles.callBtnText, { color: colors.background }]}>LLAMAR</Text>
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
        showsUserLocation
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
  floatingControls: { position: 'absolute', right: 16, bottom: 200, gap: 10 },
  floatBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.4,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 10 },
  municipioTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  cuadrantesList: { flex: 1 },
  sectoresText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 6, lineHeight: 18 },
  errorText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginTop: 12 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 12 },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  cuadranteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  cuadranteInfo: { flex: 1 },
  cuadranteTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cuadranteOrg: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  callBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  callBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});
