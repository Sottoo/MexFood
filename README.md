# 🌮 MexFood (FIFA 2026)

**MexFood** es un prototipo avanzado de un **Motor de Recomendación de Comida Mexicana** diseñado específicamente para turistas que visitarán México durante el mundial FIFA 2026. Desarrollado con **React Native (Expo)**, ofrece una interfaz intuitiva y dinámica para explorar la riqueza culinaria de México.

---

## ✨ Características Principales

Este prototipo demuestra capacidades clave de una aplicación moderna:

-   🔍 **Búsqueda y Filtros Inteligentes**: Componentes `TextInput` interactivos y `Switch` para filtrado dinámico (ej. Apto para Vegetarianos, Nivel de Picante).
-   📋 **Listado Optimizado**: Implementación de `FlatList` de alto rendimiento para desplegar tarjetas de recomendaciones con carga de imágenes optimizada.
-   🎭 **Detalle Dinámico con Modales**: Modales interactivos que presentan información detallada cruzando atributos como "Nivel de Picante" y "Riesgo Digestivo".
-   🗂️ **Menú Estructurado**: Organización visual clara mediante `SectionList` para agrupar platillos en Entradas, Platos Fuertes y Postres.
-   💬 **Módulo de Feedback**: Sistema integrado para recolectar opiniones de usuarios (Útil / No Útil) para retroalimentar el algoritmo de recomendación.

---

## 🚀 Tecnologías Utilizadas

-   **Framework**: [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
-   **Navegación**: [Expo Router](https://docs.expo.dev/router/introduction/) (Enrutamiento basado en archivos)
-   **UI/UX**: Componentes personalizados y optimizados para dispositivos móviles.
-   **Lenguaje**: TypeScript para una base de código robusta.

---

## 🛠️ Comenzando

### 1. Instalación
Asegúrate de tener [Node.js](https://nodejs.org/) instalado. Clona el repositorio y ejecuta:

```bash
npm install
```

### 2. Ejecución
Inicia el servidor de desarrollo:

```bash
npm start
```

---

## ⌨️ Comandos Disponibles

| Comando | Acción |
| :--- | :--- |
| `npm start` | Inicia el servidor Expo Go / Metro Bundler. |
| `npm run android` | Ejecuta la aplicación en un emulador de Android. |
| `npm run ios` | Ejecuta la aplicación en un simulador de iOS. |
| `npm run web` | Inicia la versión web del proyecto. |
| `npm run lint` | Analiza el código en busca de errores y estilo. |
| `npm run reset-project` | **Cuidado**: Mueve el código a `app-example` para iniciar desde cero. |

---

## 📂 Estructura del Proyecto

```text
├── app/              # Directorio principal (Expo Router)
├── assets/           # Imágenes, fuentes y recursos estáticos
├── components/       # Componentes reutilizables de UI
├── constants/        # Configuración de temas y variables globales
├── hooks/            # Hooks personalizados
└── scripts/          # Scripts de utilidad (ej. reset-project)
```

---

## 📚 Recursos Adicionales

-   [Documentación oficial de Expo](https://docs.expo.dev/)
-   [Aprender React Native](https://reactnative.dev/docs/getting-started)
-   [FIFA 2026 World Cup](https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026)

---

Desarrollado con ❤️ para los amantes de la comida mexicana. 🇲🇽

