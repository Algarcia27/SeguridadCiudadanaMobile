# Seguridad Ciudadana Táchira — App Móvil

Aplicación móvil oficial diseñada para la **Comisión de Seguridad Ciudadana del Estado Táchira**. Desarrollada con **React Native** y **Expo Router**, esta plataforma combina la visualización de mapas tácticos con una arquitectura en la nube robusta basada en **Supabase** para la gestión de autenticación, almacenamiento multimedia y persistencia de reportes en tiempo real[cite: 1].

---

## 🚀 Resumen Tecnológico

* **Frontend & UI:** React Native con Expo Router (Enrutamiento basado en archivos)[cite: 1].
* **Mapas Tácticos:** Renderizado de polígonos de cuadrantes de paz mediante archivos GeoJSON sobre mapas de OpenStreetMap[cite: 1].
* **Backend & Persistencia:** Supabase (PostgreSQL, Auth y Storage) con políticas de seguridad a nivel de fila (**RLS**) totalmente activas[cite: 1].
* **Canales Ciudadanos:** Módulos optimizados para el envío de reportes de emergencia (atención inmediata), incidencias comunitarias con adjuntos multimedia y sugerencias de participación directa[cite: 1].

---

## 📂 Estructura Clave del Proyecto

* `app/` — Rutas y pantallas de la aplicación[cite: 1].
    * `app/report-emergency.tsx` — Formulario táctico y envío de emergencias de atención inmediata[cite: 1].
    * `app/(tabs)/map.tsx` — Módulo del mapa interactivo con la carga de cuadrantes[cite: 1].
* `src/` — Lógica de negocio, contextos y servicios[cite: 1]:
    * `src/supabaseClient.ts` — Inicialización oficial del cliente de Supabase para el Frontend[cite: 1].
    * `src/supabaseServices.ts` — Servicios CRUD estrictamente tipados (`enviarEmergencia`, `enviarIncidencia`, `enviarSugerencia`, `subirFotoSupabase`)[cite: 1].
    * `src/context/` — Gestión de estados globales (`AuthContext.tsx` y `ThemeContext.tsx`)[cite: 1].
* `Mapa_Final_Tachira.json` — Archivo GeoJSON maestro con las coordenadas geográficas de los cuadrantes del estado Táchira[cite: 1].

---

## 🛠️ Arquitectura de Base de Datos e Integración

### 1. Autenticación e Integridad Referencial
El sistema utiliza **Supabase Auth** para el control de sesiones de los ciudadanos[cite: 1]. Cada reporte insertado en las tablas relacionales (`reportes_emergencia`, `reportes_incidencia`, `sugerencias`) incluye una **Clave Foránea (Foreign Key)** directa hacia la tabla interna de usuarios de la plataforma (`auth.users`), garantizando la trazabilidad y la integridad de cada alerta recibida[cite: 1].

### 2. Flujo de Almacenamiento Multimedia (Storage)
La subida de evidencias fotográficas se realiza de forma directa y eficiente desde el cliente móvil[cite: 1]:
1. El dispositivo captura o selecciona la imagen del reporte.
2. `expo-file-system/legacy` codifica el archivo local en formato Base64 de forma asíncrona.
3. Los bytes se decodifican mediante un ArrayBuffer y se cargan directamente al bucket público `evidencias_reportes` usando el SDK de Supabase.
4. La base de datos almacena la URL pública generada de forma sincronizada con el texto del formulario en su respectiva columna (`url_evidencia`).

### 3. Seguridad Perimetral (RLS)
La base de datos y el almacenamiento de objetos se encuentran blindados mediante políticas de **Row-Level Security (RLS)** en Postgres[cite: 1]. Esto permite operaciones de inserción (`INSERT`) y lectura (`SELECT`) de datos únicamente a los dispositivos que cuenten con una sesión JWT de usuario autenticado (`authenticated`) válida en la aplicación, protegiendo el sistema contra accesos no autorizados[cite: 1].

---

## 🗺️ Integración Cartográfica (GeoJSON + OSM)

El módulo del mapa táctico (`app/(tabs)/map.tsx`) implementa un diseño de alta interacción con el ciudadano centrado en la usabilidad:

* **Marcador de Ubicación Dinámico:** En lugar del punto azul genérico de GPS, la app renderiza un marcador circular perfecto con la foto de perfil real del usuario conectado (obtenida desde `user_metadata.avatar_url` de Supabase). Cuenta con un borde blanco grueso y anclaje centrado (`anchor={{ x: 0.5, y: 0.5 }}`) para eliminar errores de renderizado nativo en Android.
* **Menú Desplegable Flotante:** Un botón principal de acción rápida **"REPORTAR"** se ubica con posicionamiento absoluto en la base del mapa. Al ser presionado, despliega verticalmente un submenú con transiciones limpias para elegir entre:
  * **🚨 Reportar Emergencia:** Redirige al formulario de atención inmediata.
  * **⚠️ Reportar Incidente:** Redirige al formulario de incidencias comunitarias.
* **Capa de Cierre Inmediato (Overlay):** Un componente invisible se activa detrás del menú abierto para que, si el usuario toca cualquier parte externa del mapa, las opciones se oculten automáticamente de forma segura.
* **Simplificación del Menú de Tres Puntos (Header):** Las opciones operativas de emergencia e incidencia se removieron por completo de la barra superior. El menú de tres puntos queda reservado exclusivamente para la gestión institucional de **Sugerencias**.

---

## ⚙️ Configuración y Despliegue Local

### Variables de Entorno Requeridas
Para conectar la aplicación localmente con el backend, configure un archivo `.env` en la raíz del proyecto con las siguientes claves[cite: 1]:

```env
SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
SUPABASE_ANON_KEY=tu-clave-anonima-publica

 