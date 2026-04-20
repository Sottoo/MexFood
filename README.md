# MexFood (FIFA 2026) - ReacNative

El repositorio del **Motor de Recomendación de Comida Mexicana para Turistas**. 
Esta prototipo contiene la UI interactiva desarrollado en **React Native (Expo)** 

## ¿Qué demuestra este prototipo?
- **Búsqueda y Filtros**: Componentes TextInput interactivos y Switch para filtrado (ej. Apto Vegetariano).
- **Listado de Recomendaciones**: Uso de FlatList optimizado para desplegar tarjetas de resultados con imágenes.
- **Detalle Dinámico**: Modal interactivo que cruza atributos como "Nivel de Picante" y "Riesgo Digestivo".
- **Menú Estructurado**: Visualización en listas de secciones (SectionList) para agrupar Entradas, Platos Fuertes y Postres.
- **Módulo de Feedback**: Recolección directa de opiniones (Útil / No Útil) para en un futuro alimentar el algoritmo.

## Cómo ejecutar el proyecto localmente

1. **Instalar dependencias**:
   Asegúrate de tener Node.js instalado y ejecuta en esta carpeta:
   `
   npm install
   `

2. **Iniciar el servidor de desarrollo**:
   `
   npx expo start
   `

3. **Ver la aplicación en el móvil**:
   - Descarga la aplicación **Expo Go** en tu celular (disponible en iOS y Android).
   - Escanea el código QR que aparece en la terminal al iniciar el servidor (o presiona 'a' para el emulador de Android si lo tienes configurado).

## Archivo principal
- App.tsx: Contiene actualmente toda la lógica de presentación con un set de datos local (PLATILLOS) para pruebas.
