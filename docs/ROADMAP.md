# Roadmap: qué le falta a la app final

Estado hoy: plomería instalada + questionnaire/onboarding funcional +
gate de perfil (si ya hay perfil guardado, la welcome se salta y
entra directo a tabs). Todavía falta el consumo de los hooks en home,
detalle y scanner. Esto es la lista ordenada de lo que hay que
construir del lado del front para tener un producto demostrable.

Todo lo que sigue usa los hooks/clientes ya documentados en
[BACKEND.md](./BACKEND.md). No hay que escribir llamadas a Supabase
ni a Gemini directamente — todo pasa por `@/src/lib/hooks` y
`@/src/lib/core`.

---

## Prioridad 1 — Sin esto no hay demo

### 1.1 Onboarding / formulario de perfil — ✅ HECHO

Questionnaire de 8 pasos en [src/app/questionnaire.tsx](../src/app/questionnaire.tsx):

| Paso | Campo del Perfil |
|---|---|
| 0 · Alergias | `alergias[]` (tag input con sugerencias) |
| 1 · Dieta | `dieta.vegano`, `dieta.vegetariano` (vegano implica vegetariano), `dieta.keto` |
| 2 · Ingredientes que consumes | `restricciones.sinLacteos`, `evitaCerdo`, `restricciones.sinGluten`, `evitaMariscos`, `evitaAlcohol` |
| 3 · Tolerancia a picante | `toleranciaPicante` (mapeo 1-5 → bajo/medio/alto) |
| 4 · Restricciones culturales | agrega a `ingredientesEvitar[]` |
| 5 · Alimentos a evitar | agrega a `ingredientesEvitar[]` |
| 6 · Estado actual | `estadoActual` (text input + sugerencias de 15 estados) |
| 7 · Estómago sensible | `estomagoSensible` (sí/no) |

Al finalizar también sincroniza `idioma` con `i18n.language`.

**Gating:** [src/app/index.tsx](../src/app/index.tsx) checa si hay perfil en
AsyncStorage con `usePerfil()`. Si hay → `router.replace('/(tabs)/home')`.
Si no → muestra welcome y el usuario pasa al questionnaire.

**Lo que sigue pendiente del onboarding:**
- `dieta.pescetariano` no se expone en el form (low priority — nadie lo pidió).
- `ingredientesFavoritos` no se captura — podría agregarse como paso 8 con
  tag input similar a "avoid". Actualmente los usuarios no pueden favoritear
  queso/aguacate/etc. para boost de score. **Sugerencia:** agregar un paso
  opcional "¿Tus ingredientes favoritos?" usando el componente `TagInput`
  existente.
- Editar perfil existente: hoy no hay un botón para volver al questionnaire
  desde la app. **Sugerencia:** desde la tab "Ajustes" o desde "Mi Pase",
  agregar botón "Editar preferencias" que haga `router.push('/questionnaire')`
  (push, no replace, para que conserve el back).

---

### 1.2 Home real: carta de recomendaciones

**Qué es:** reemplazar la home actual (grid de servicios) por una
lista de platillos recomendados para el perfil del usuario, con
semáforo visible. Puede seguir conviviendo con el grid de
"servicios oficiales" si el PM lo quiere — abajo de él.

**Uso:**
```tsx
const { perfil } = usePerfil();
const { catalogo } = useCatalogo();
const { recomendados, evitar } = useRecomendaciones(perfil, catalogo, {
  topN: 20,
});

<FlatList
  data={recomendados}
  renderItem={({ item }) => <PlatilloCard recomendacion={item} />}
  ListFooterComponent={<SeccionEvitar items={evitar} />}
/>
```

**Por platillo mostrar:**
- Nombre de la variante
- Nombre del platillo (más chico, subtítulo)
- Bullet de color (verde / amarillo / naranja / rojo)
- Estado o región típica si existe ("Típico de Oaxaca")
- 1 razón positiva (primera de `razonesPositivas`)
- Tap → navega a `/platillo/[varianteId]` con el detalle

**Filtros/tabs útiles pero no obligatorios:**
- Por categoría (antojito, sopa, principal, postre, bebida)
- Por región (costa, centro, sur, norte)

**Esfuerzo:** medio (3-4h).

---

### 1.3 Detalle de platillo

**Qué es:** la pantalla que se abre al tocar un platillo de la home.
Expone toda la inteligencia del backend: explicación personalizada +
frases para pedir + feedback.

**Ruta:** `/platillo/[varianteId].tsx` (Expo Router dinámico)

**Uso:**
```tsx
import { useLocalSearchParams } from "expo-router";
import { useExplicacion, useFrases, usePerfil, useCatalogo } from "@/src/lib/hooks";
import { obtenerClientes } from "@/src/lib/core";
import { calcularMatchScore } from "@core/recomendador";

export default function Detalle() {
  const { varianteId } = useLocalSearchParams<{ varianteId: string }>();
  const { perfil } = usePerfil();
  const { catalogo } = useCatalogo();

  const variante = catalogo?.variantes.find((v) => v.id === varianteId);
  const platillo = variante
    ? catalogo?.platillos.find((p) => p.id === variante.idPlatillo)
    : undefined;
  const recomendacion =
    perfil && variante && platillo
      ? calcularMatchScore(perfil, variante, platillo)
      : null;

  const { explicacion, cargando: cargandoExp } = useExplicacion(
    perfil,
    recomendacion,
    platillo ?? null,
    variante ?? null,
  );
  const { frases, cargando: cargandoFra } = useFrases(perfil, platillo ?? null);

  // ... render
}
```

**Secciones a mostrar:**
1. Header con foto (si hay) + semáforo grande + etiqueta
2. Descripción del platillo (del campo `platillo.descripcion`)
3. **Explicación personalizada** — el párrafo del LLM. Skeleton
   mientras `cargandoExp`. Si `explicacion.fuente === "plantilla"`,
   puedes mostrar un badge "modo offline" discreto.
4. **Ingredientes** — lista de `variante.ingredientes`, destacando
   los que matchean `perfil.alergias` o `perfil.ingredientesEvitar` en rojo.
5. **Alérgenos** — chips con `variante.alergenos`.
6. **Tip cultural** — `explicacion.tipCultural` si existe.
7. **Frases para pedir** — las 3 frases con traducción + fonética.
   Cada una con botón "copiar".
8. Botones feedback al fondo: 👍 útil / 👎 no útil.

**Esfuerzo:** medio (4-5h).

---

### 1.4 Scanner de menú

**Qué es:** la funcionalidad estrella. Usuario toma foto del menú,
Gemini extrae los platillos, matcheamos a nuestro catálogo, mostramos
semáforo por item.

**Uso:**
```tsx
import * as ImagePicker from "expo-image-picker";
import { useAnalizarMenu } from "@/src/lib/hooks";

// ver BACKEND.md §7 para ejemplo completo
```

**UX:**
- Botón grande "Escanear menú" en home o tab propio
- Foto → muestra preview + "Analizando…"
- Resultados: lista con color por item + tap → detalle del platillo matcheado
- Items no matcheados se muestran al final con "no encontrado en catálogo"
- Indicador de confianza OCR ("14/20 platillos reconocidos")

**Gotcha:** la primera llamada con una foto nueva paga ~2-5s a Gemini.
El cache hace que fotos repetidas sean instantáneas. Si quieres
demos reproducibles, foto-tea una vez antes y la segunda vez es <1s.

**Esfuerzo:** medio (3-5h). El cache y el matching ya están hechos, el
trabajo es la UX de cámara y lista de resultados.

---

## Prioridad 2 — Completan la experiencia

### 2.1 Sincronizar idioma i18n ↔ perfil.idioma

Cuando el usuario cambia idioma desde el toggle de react-i18next, el
campo `perfil.idioma` debe actualizarse también — es lo que decide el
idioma de la traducción de las frases del LLM.

```tsx
const { i18n } = useTranslation();
const { perfil, actualizar } = usePerfil();

useEffect(() => {
  if (perfil && perfil.idioma !== i18n.language) {
    actualizar({ idioma: i18n.language as "es" | "en" });
  }
}, [i18n.language, perfil?.idioma]);
```

**Esfuerzo:** 20 min.

### 2.2 Bookmarks / Guardados

La tab "Guardados" ya existe en el layout. Hacerla funcional:
- Botón de corazón en detalle → guarda `varianteId` en AsyncStorage
  (clave propia, ej. `mexfood:guardados:v1`)
- La tab lee la lista, mapea a platillos del catálogo, usa
  `calcularMatchScore` para re-pintar con el perfil actual

No requiere backend nuevo. Todo local.

**Esfuerzo:** 2-3h.

### 2.3 Splash / loading inicial

Al abrir la app, mientras `useCatalogo` y `usePerfil` terminan,
mostrar un splash que encaje con la estética Maya. Evita parpadeo de
pantallas vacías.

**Esfuerzo:** 1h.

### 2.4 Estado "offline" visible

Si `useCatalogo` no pudo traer el catálogo y no hay cache, mostrar un
banner "Sin conexión. Reintenta cuando tengas internet." Nuestras
funciones nunca lanzan, así que es solo chequear
`catalogo === null && !cargando`.

De forma similar, si `explicacion.fuente === "plantilla"`, badge
discreto "modo offline" para que el usuario sepa por qué el texto se
ve más genérico.

**Esfuerzo:** 1h.

---

## Prioridad 3 — Polish / post-demo

### 3.1 Buscador libre

Input de texto que usa `encontrarMejorMatch` (ver BACKEND.md §9)
para buscar platillos por nombre fuzzy. Útil si el usuario conoce el
platillo y no quiere browsear.

### 3.2 Filtros avanzados

Sobre la home de recomendaciones: toggles adicionales para filtrar
por categoría, región, "solo verdes", etc. El backend ya devuelve los
campos necesarios — es UI pura.

### 3.3 Historial de scans

Mostrar los últimos N menús escaneados. Como el backend ya cachea por
hash, basta guardar los hashes localmente y re-hacer
`menuCache.get(hash)` — sin pagar Gemini.

### 3.4 Modo oscuro

La app ya tiene `useColorScheme`. Asegurarse de que las pantallas
nuevas respeten el tema (usar `Colors[colorScheme]` de
`constants/theme.ts`).

---

## Lo que NO hay que construir

- **Autenticación / login** — no está en scope. Perfil es local y
  anónimo. Si quieren tracking de feedback hashean el perfil (ya
  provisto vía `hashPerfil()`).
- **Subida de fotos a nuestro servidor** — las fotos del scanner van
  directo a Gemini vía edge function, nunca se almacenan en nuestro
  Supabase.
- **Manejo de errores con try/catch** — ninguna función del backend
  lanza. Siempre devuelve plantilla o array vacío.
- **Refresh de catálogo** — el cache TTL 7d es suficiente. Si se
  agregan platillos nuevos, el front los toma cuando le toque
  refrescar.

---

## Orden sugerido de construcción

Si fuera un único dev, este es el orden que minimiza bloqueos:

1. ~~**Sincronización idioma** (2.1) — 20 min.~~ ✅ Incluido en questionnaire.
2. ~~**Onboarding / perfil** (1.1).~~ ✅ Hecho.
3. **Home con recomendaciones** (1.2) — **siguiente paso lógico.**
   Borrar `DebugPanel` de home.tsx y reemplazar con la lista real.
4. **Detalle de platillo** (1.3) — activa la capa LLM.
5. **Scanner** (1.4) — la estrella.
6. **Offline + splash** (2.3, 2.4) — polish.
7. **Guardados** (2.2) — bonus.

Dos personas en paralelo: uno home+detalle, otro scanner. Se juntan en prioridad 2.

---

## Sugerencias sobre el questionnaire actual

Cosas que se pulieron durante la integración (2026-04-23) y notas para quien
lo mantenga:

### Cambios que ya están aplicados
- **Mapeo de diets:** vegano ahora implica vegetariano (antes solo seteaba
  `vegano: true` y la precedencia del backend quedaba confusa).
- **Keto:** antes se descartaba silenciosamente, ahora se mapea a
  `dieta.keto: true` y el backend aplica penalizaciones de score a carbos.
- **"Carne" → "Cerdo":** el checkbox renombrado porque el backend tiene
  `evitaCerdo` específicamente para cerdo; "carne en general" ya lo cubre
  la dieta vegetariana del paso anterior.
- **Alcohol:** nuevo checkbox, mapea a `evitaAlcohol`.
- **Estado actual y estómago sensible:** nuevos pasos al final.
- **Idioma:** se lee de `i18n.language` al finalizar y se guarda en
  `perfil.idioma`, que es lo que decide el idioma de las frases del LLM.

### Sugerencias para mejorar UX
1. **"Editar preferencias"** desde algún lugar de la app — hoy el perfil
   es inmutable después del onboarding (el gate redirige si ya existe).
2. **Progress indicator** más descriptivo que solo la barra: "Paso 3 de 8"
   o iconos por categoría.
3. **Skip** para los pasos opcionales (estado actual, cultural, avoid)
   por si el usuario quiere ir rápido.
4. **Validación ligera** en el paso de estado actual: autocompletado
   cuando escriba "Ciudad" debería sugerir "Ciudad de México".
5. **Tema oscuro** — el form ya respeta `useColorScheme`, pero el tema
   oscuro del chip activo podría tener más contraste (ahora es
   `MayanColors.jade` sobre fondo oscuro, puede saturar).
6. **Pescetariano como opción** — agregar `{id: 'pescetarian', ...}` a
   `dietOptions`. Mapeo: `dieta.pescetariano = diet === 'pescetarian'`.
7. **Ingredientes favoritos** — paso 8 opcional con TagInput, mapea a
   `ingredientesFavoritos[]` (bonus de score +5 por coincidencia, tope +15).

### Limitaciones conocidas
- Si el usuario elige "keto" + "vegana" no se puede simultáneamente (son
  radio, no checkboxes). El backend sí soporta combinarlas. Si quieren
  habilitarlo, el paso 1 debería permitir multi-select para keto por
  separado, con vegan/vegetarian/none como radio aparte.
- El estado actual es un text input libre — el backend compara con
  `includes` normalizado, así que "CDMX" no matchearía "Ciudad de México"
  (se pierde el bonus regional). **Sugerencia:** o restringir a las
  sugerencias, o agregar alias en el catálogo.
