import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

// Gestión de GPS
export const toggleGPS = async (enabled: boolean) => {
  if (enabled) {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }
  return false;
};

// Gestión de Notificaciones
export const toggleNotifications = async (enabled: boolean) => {
  if (enabled) {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
  return false;
};