# Seguridad Ciudadana Táchira — App Móvil

Aplicación móvil oficial de la Comisión de Seguridad Ciudadana del Estado Táchira (Venezuela). Construida con **React Native** y **Expo Router**.

---

## Estructura del proyecto

```
/
├── app/                        # Pantallas (Expo Router – file-based routing)
│   ├── _layout.tsx             # Layout raíz: providers, fuentes, StatusBar
│   ├── index.tsx               # Pantalla de bienvenida / login
│   ├── chat.tsx                # Chat con operador de emergencias
│   ├── notifications.tsx       # Centro de notificaciones
│   ├── settings.tsx            # Ajustes (ruta de stack con botón atrás)
│   └── (tabs)/                 # Navegación por pestañas
│       ├── _layout.tsx         # TabNavigator con FloatingTabBar personalizada
│       ├── index.tsx           # Dashboard (botón 911, servicios, ubicación)
│       ├── map.tsx             # Mapa táctico de incidentes
│       ├── news.tsx            # Feed de noticias / Instagram
│       ├── profile.tsx         # Perfil del ciudadano
│       ├── info.tsx            # Información institucional y directorio
│       └── settings.tsx        # Ajustes completos (pestaña)
│
├── assets/images/              # Recursos estáticos (icono, logo, splash)
│
├── src/                        # Lógica y componentes reutilizables
│   ├── components/
│   │   ├── FloatingTabBar.tsx  # Barra de navegación flotante animada
│   │   └── ErrorBoundary.tsx   # Captura de errores en tiempo de ejecución
│   ├── constants/
│   │   └── colors.ts           # Paleta de colores: modo claro y oscuro
│   ├── context/
│   │   ├── ThemeContext.tsx     # Proveedor de tema (claro / oscuro)
│   │   └── LanguageContext.tsx  # Proveedor de idioma (es / en) + traducciones
│   ├── hooks/
│   │   └── useColors.ts        # Hook que retorna la paleta activa según tema
│   └── utils/
│       ├── haptics.ts          # Wrappers de Expo Haptics para vibración táctil
│       └── supabase.ts         # Cliente Supabase (server-side, service role)
│
├── app.json                    # Configuración de Expo (bundle ID, splash, etc.)
├── babel.config.js             # Babel con preset Expo y plugin Reanimated
├── metro.config.js             # Metro bundler (configuración por defecto Expo)
├── tsconfig.json               # TypeScript (alias @/* → ./*)
├── package.json                # Dependencias
└── README.md                   # Este archivo
```

---

## Alias de importación

El alias `@/` mapea a la raíz del proyecto:

```ts
// tsconfig.json
"paths": { "@/*": ["./*"] }
```

Ejemplos con la nueva estructura `src/`:
```ts
import { useColors } from '@/src/hooks/useColors';
import { ThemeProvider } from '@/src/context/ThemeContext';
import FloatingTabBar from '@/src/components/FloatingTabBar';
import { Colors } from '@/src/constants/colors';
import { impactLight } from '@/src/utils/haptics';
```

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| React Native 0.81 | Framework UI nativo |
| Expo 54 | Toolchain, plugins, módulos nativos |
| Expo Router 6 | Navegación file-based |
| React Native Reanimated 4 | Animaciones fluidas |
| React Native Gesture Handler | Gestos táctiles |
| React Native Safe Area Context | Insets de dispositivo |
| @tanstack/react-query | Gestión de estado asíncrono |
| @expo-google-fonts/inter | Tipografía Inter |
| AsyncStorage | Persistencia local (tema, idioma, perfil) |
| Expo Haptics | Retroalimentación táctil |
| Supabase (`@supabase/supabase-js`) | Base de datos en la nube (Postgres + REST) usada por las rutas `/api` |

---

## Tema y colores

El sistema de temas está definido en `src/constants/colors.ts` con dos paletas (`light` / `dark`).  
`useColors()` retorna la paleta activa. Los colores se aplican inline en todos los componentes.

---

## Flujos de navegación

```
index (Login)
    └── (tabs)/ ─┬─ index     (Dashboard)
                  ├─ map       (Mapa)
                  ├─ news      (Noticias)
                  ├─ info      (Institución)
                  ├─ profile   (Perfil)
                  └─ settings  (Ajustes tab)

Stack screens (modal/card):
  - /chat           → ChatScreen
  - /notifications  → NotificationsScreen
  - /settings       → SettingsScreen (con back)
```

---

## Scripts

```bash
npx expo start --web --port 5000   # Previsualización web (Replit)
npx expo start --tunnel            # QR para Expo Go en dispositivo físico
npx expo start --android           # Emulador Android
npx expo start --ios               # Simulador iOS
```

---

## Base de datos (Supabase)

La app usa **Supabase** (Postgres en la nube) para los datos de usuario. Las rutas
`/api` (`login`, `register`, `forgot-password`, `reset-password`, `update-avatar`)
acceden a Supabase desde el servidor con la **Service Role Key** a través del
helper `src/utils/supabase.ts`.

Variables de entorno requeridas (configuradas como Secrets en Replit):

| Variable | Uso |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase (`https://xxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo server-side) |

El esquema de la tabla `users` está en `supabase-schema.sql`. Ejecútalo una vez
en el **SQL Editor** de Supabase para crear la tabla.
