import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  currentLocation: Coordinates | null;
  locationLabel: string;
  gpsActive: boolean;
}

const LocationContext = createContext<LocationContextType>({
  currentLocation: null,
  locationLabel: 'Ubicación actual',
  gpsActive: false,
});


const formatLocationLabel = (address: Location.LocationGeocodedAddress): string => {
  const sector = address.district || address.street || 'Sector Desconocido';
  const municipio = address.subregion || address.city || 'San Cristóbal';

  if (sector === municipio) {
    return municipio;
  }
  return `${sector}, ${municipio}`;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState('Buscando ubicación GPS...');
  const [gpsActive, setGpsActive] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const updateLabel = async (coords: Coordinates) => {
      try {
        const addresses = await Location.reverseGeocodeAsync(coords);
        if (addresses.length > 0) {
          // Filtrará la dirección usando la nueva regla limpia
          setLocationLabel(formatLocationLabel(addresses[0]));
        } else {
          setLocationLabel('Ubicación actual');
        }
      } catch {
        setLocationLabel('Ubicación actual');
      }
    };

    async function initLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLabel('Permiso de ubicación denegado');
        setGpsActive(false);
        return;
      }

      setGpsActive(true);

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCurrentLocation(coords);
      await updateLabel(coords);

      // Esto actualiza dinámicamente cada vez que el usuario se mueve 20 metros
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 20, // metros
          timeInterval: 10000,  // milisegundos
        },
        async (updated) => {
          const coordsUpdate = { latitude: updated.coords.latitude, longitude: updated.coords.longitude };
          setCurrentLocation(coordsUpdate);
          await updateLabel(coordsUpdate);
        }
      );
    }

    initLocation();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <LocationContext.Provider value={{ currentLocation, locationLabel, gpsActive }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);