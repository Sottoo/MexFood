# MexFood - App Oficial '26

MexFood es la aplicación oficial para descubrir y disfrutar la gastronomía en sedes y zonas fan durante los eventos de 2026. Está diseñada con una estética inmersiva inspirada en la cultura Maya (tonos jade, detalles dorados y patrones prehispánicos), ofreciendo una experiencia premium y nativa.

---

## Stack Tecnológico

- **Framework:** [React Native](https://reactnative.dev/)
- **Plataforma:** [Expo](https://expo.dev/)
- **Enrutamiento:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Lenguaje:** TypeScript
- **Iconografía:** `@expo/vector-icons` (principalmente `Ionicons`)

---

## Arquitectura del Proyecto

El proyecto sigue una arquitectura modular y separada por responsabilidades para mantener la escalabilidad. Toda la lógica de la aplicación vive dentro de la carpeta `src/`.

```text
MexFood/
├── assets/                  # Imágenes, fuentes estáticas (LogoApp.png, patron.png)
└── src/
    ├── app/                 # EXCLUSIVO PARA RUTAS (Expo Router)
    │   ├── _layout.tsx      # Layout principal (Stack)
    │   ├── index.tsx        # Pantalla de bienvenida (Welcome Screen)
    │   └── (tabs)/          # Grupo de pestañas inferiores (Bottom Tabs)
    │       ├── _layout.tsx  # Configuración del menú inferior
    │       ├── home.tsx     # Pantalla "Explorar"
    │       ├── mapa.tsx     # Pantalla "Mapa"
    │       ├── guardados.tsx# Pantalla "Guardados"
    │       └── pase.tsx     # Pantalla "Mi Pase"
    │
    ├── components/          # COMPONENTES GLOBALES (Reutilizables)
    │   ├── Button.tsx       # Botón principal estilizado
    │   ├── Card.tsx         # Tarjeta interactiva para el grid
    │   └── Header.tsx       # Cabecera principal con patrón inmersivo
    │
    ├── constants/           # CONSTANTES Y TEMAS
    │   └── theme.ts         # Paleta de colores (Modo Claro/Oscuro y MayanColors)
    │
    ├── hooks/               # CUSTOM HOOKS GLOBALES
    │   └── useThemeColor.ts # (U otros hooks compartidos)
    │
    ├── i18n/                # CONFIGURACIÓN DE IDIOMAS (react-i18next)
    │   ├── index.ts         # Inicializador y configuración principal
    │   ├── es.json          # Diccionario Español
    │   └── en.json          # Diccionario Inglés
    │
    └── screens/             # COMPONENTES ESPECÍFICOS POR PANTALLA
        ├── home/
        │   └── components/  # Componentes exclusivos de la pantalla "Explorar"
        │       └── BannerTraductor.tsx
        └── mapa/
            └── components/  # Componentes exclusivos de la pantalla "Mapa"
```

---

## Guía de Desarrollo

Para mantener la consistencia y escalabilidad de la aplicación, sigue estas reglas al programar:

### 1. Manejo de Rutas (`src/app`)
- **Regla de Oro:** NUNCA coloques componentes visuales sueltos ni lógica compleja directamente en la carpeta `src/app`.
- Esta carpeta es exclusiva para que Expo Router genere la navegación.
- Si necesitas crear una nueva pantalla accesible por URL, crea un archivo aquí (ej. `src/app/perfil.tsx`).
- Si la pantalla pertenece al menú inferior, créala dentro de `src/app/(tabs)/`.

### 2. Creación de Componentes
- **Globales (`src/components`):** Si un componente se usa en más de una pantalla (como botones, tarjetas, modales genéricos), debe ir aquí.
- **Específicos de una pantalla:** Si un componente es gigante y **solo** se usa en una pantalla (ej. `BannerPromocionalHome.tsx`), NO lo pongas en componentes globales. Crea una carpeta `src/screens/[nombre-pantalla]/components/` o `src/features/[feature]/components/` para mantener el orden.

### 3. Estilos y Diseño Visual
- **Tematización Dinámica:** La aplicación soporta Modo Claro y Modo Oscuro. Siempre usa el hook `useColorScheme` y el archivo `theme.ts`. No uses colores "hardcodeados" (fijos) como `#FFF` o `#000` para fondos o textos principales.
  ```tsx
  import { useColorScheme } from 'react-native';
  import { Colors } from '@/src/constants/theme';
  
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  // Uso: <View style={{ backgroundColor: theme.background }} />
  ```
- **Identidad Maya:** Para elementos de marca (botones, íconos de sección, detalles), utiliza la paleta `MayanColors` definida en `theme.ts` (ej. `MayanColors.jade`, `MayanColors.gold`).
- **Interactividad (Pressable vs TouchableOpacity):** Para elementos clickeables complejos como tarjetas, usa `Pressable` y gestiona el estado visual de presionado mediante el evento estético (ej. superponer una capa semitransparente) para evitar que las sombras nativas de Android se rompan o se transparenten erróneamente ("shadow bleeding").

### 4. Internacionalización (i18n)
- **Cero Textos Quemados:** La aplicación está configurada para ser multilingüe (`es`, `en`) mediante `react-i18next` y `expo-localization`. Los diccionarios viven en `src/i18n/`.
- **Cómo implementarlo:** Siempre importa el hook `useTranslation` y utiliza la función `t()` llamando a la clave correspondiente en los archivos JSON.
  ```tsx
  import { useTranslation } from 'react-i18next';
  
  export default function MiPantalla() {
    const { t } = useTranslation();
    return <Text>{t('mi_clave_json')}</Text>;
  }
  ```

---

## Cómo ejecutar el proyecto

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor de desarrollo:**
   ```bash
   npm start
   # o para limpiar la caché (recomendado al mover archivos):
   npm run android -c
   ```

3. **Ver la app:**
   - Presiona `a` para abrir en el emulador de Android.
   - Presiona `i` para abrir en el simulador de iOS.
   - Escanea el código QR con la app **Expo Go** en tu dispositivo físico.
