import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  es: {
    settings: 'Ajustes',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    passwordManagement: 'Gestión de Contraseña',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    about: 'Acerca de',
    logout: 'Cerrar Sesión',
    home: 'Inicio',
    map: 'Mapa',
    news: 'Noticias',
    institutional: 'Institución',
    save: 'Guardar',
    cancel: 'Cancelar',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    currentPassword: 'Contraseña Actual',
    emergency: 'EMERGENCIA',
    requestHelp: 'Solicitar Auxilio',
    supportServices: 'Servicios de Apoyo',
    police: 'Policial',
    policeDesc: 'Seguridad y orden público.',
    health: 'Protección Civil ',
    healthDesc: 'Paramédicos y ambulancias.',
    fire: 'Bomberos',
    fireDesc: 'Incendios y rescate civil.',
    counseling: 'Asesoría integral y Psicológica',
    counselingDesc: 'Apoyo emocional y orientación profesional.',
    traffic: 'Vialidad',
    trafficDesc: 'Auxilio mecánico y grúas.',
    currentLocation: 'Ubicación Actual',
    gpsActive: 'GPS Activo',
    silentAlert: 'Alerta Silenciosa:',
    silentAlertDesc: 'Agite su dispositivo dos veces para enviar su ubicación en situaciones de riesgo.',
    immediateAttention: 'Atención Inmediata',
    dispatchCenter: 'Central de Despacho 911',
    mission: 'Misión',
    missionText: 'Garantizar la paz ciudadana y el orden público mediante la implementación de políticas integrales de seguridad, prevención y atención inmediata de emergencias en el estado Táchira.',
    vision: 'Visión',
    visionText: 'Ser el modelo de gestión de seguridad ciudadana más eficiente del país, apoyado en tecnología de vanguardia y un cuerpo profesional altamente capacitado.',
    emergencyDirectory: 'Directorio de Emergencia',
    mainOffice: 'Sede Principal',
    socialNetworks: 'Nuestras Redes',
    noNotifications: 'No hay notificaciones',
    noNotificationsDesc: 'Te avisaremos cuando ocurra algo importante en el estado.',
    markAllRead: 'Marcar todo',
    markAsRead: 'Marcar como leído',
    newsFeed: 'Feed de Noticias',
    officialInfo: 'Información oficial en tiempo real',
    syncInstagram: 'Sincronizando con Instagram...',
    seeOnInstagram: 'Ver en Instagram',
    liveLabel: 'En Vivo',
    likes: 'Me gusta',
    appearance: 'Apariencia',
    localization: 'Localización',
    security: 'Seguridad',
    passwordProtection: 'Protección de cuenta',
    general: 'General',
    privacyData: 'Datos y permisos',
    version: 'Versión 2.1.0',
    signIn: 'Iniciar Sesión',
    continueGoogle: 'Continuar con Google',
    safeAccess: 'Acceso Seguro',
    tachiraProtected: 'Táchira Protegida',
    needHelp: '¿Necesitas ayuda?',
    verifiedCitizen: 'Ciudadano Verificado',
    email: 'Correo Electrónico',
    phone: 'Teléfono de Contacto',
    id: 'Cédula de Identidad',
    notRegistered: 'No registrado',
    securityPrivacy: 'Seguridad y Privacidad',
  },
  en: {
    settings: 'Settings',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    passwordManagement: 'Password Management',
    notifications: 'Notifications',
    profile: 'Profile',
    about: 'About',
    logout: 'Logout',
    home: 'Home',
    map: 'Map',
    news: 'News',
    institutional: 'Institution',
    save: 'Save',
    cancel: 'Cancel',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    currentPassword: 'Current Password',
    emergency: 'EMERGENCY',
    requestHelp: 'Request Help',
    supportServices: 'Support Services',
    police: 'Police',
    policeDesc: 'Security and public order.',
    health: 'Health',
    healthDesc: 'Paramedics and ambulances.',
    fire: 'Fire Dept.',
    fireDesc: 'Fires and civil rescue.',
    counseling: 'Comprehensive counseling & psychology',
    counselingDesc: 'Emotional support and professional guidance.',
    traffic: 'Traffic',
    trafficDesc: 'Mechanical assistance and tow trucks.',
    currentLocation: 'Current Location',
    gpsActive: 'GPS Active',
    silentAlert: 'Silent Alert:',
    silentAlertDesc: 'Shake your device twice to send your location in risky situations.',
    immediateAttention: 'Immediate Attention',
    dispatchCenter: '911 Dispatch Center',
    mission: 'Mission',
    missionText: 'Guarantee citizen peace and public order through comprehensive security policies, prevention, and immediate emergency response in Táchira state.',
    vision: 'Vision',
    visionText: 'To be the most efficient model of citizen security management in the country, supported by cutting-edge technology and a highly trained professional corps.',
    emergencyDirectory: 'Emergency Directory',
    mainOffice: 'Main Office',
    socialNetworks: 'Our Networks',
    noNotifications: 'No notifications',
    noNotificationsDesc: 'We will notify you when something important happens.',
    markAllRead: 'Mark all',
    markAsRead: 'Mark as read',
    newsFeed: 'News Feed',
    officialInfo: 'Official real-time information',
    syncInstagram: 'Syncing with Instagram...',
    seeOnInstagram: 'See on Instagram',
    liveLabel: 'Live',
    likes: 'Likes',
    appearance: 'Appearance',
    localization: 'Localization',
    security: 'Security',
    passwordProtection: 'Account protection',
    general: 'General',
    privacyData: 'Data & permissions',
    version: 'Version 2.1.0',
    signIn: 'Sign In',
    continueGoogle: 'Continue with Google',
    safeAccess: 'Secure Access',
    tachiraProtected: 'Táchira Protected',
    needHelp: 'Need help?',
    verifiedCitizen: 'Verified Citizen',
    email: 'Email Address',
    phone: 'Contact Phone',
    id: 'National ID',
    notRegistered: 'Not registered',
    securityPrivacy: 'Security & Privacy',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageSate] = useState<Language>('es');

  useEffect(() => {
    AsyncStorage.getItem('app-language').then((saved) => {
      if (saved === 'es' || saved === 'en') setLanguageSate(saved);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageSate(lang);
    AsyncStorage.setItem('app-language', lang);
  };

  const t = (key: string) => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
