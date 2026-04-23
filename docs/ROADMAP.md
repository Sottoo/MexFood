# Roadmap: qué le falta a la app final

Estado hoy: la plomería backend → front está instalada y probada con
un panel de debug embebido en home. Ninguna pantalla de *producto*
consume aún los hooks. Esto es la lista ordenada de lo que hay que
construir del lado del front para tener un producto demostrable.

Todo lo que sigue usa los hooks/clientes ya documentados en
[BACKEND.md](./BACKEND.md). No hay que escribir llamadas a Supabase
ni a Gemini directamente — todo pasa por `@/src/lib/hooks` y
`@/src/lib/core`.

---

## Prioridad 1 — Sin esto no hay demo

### 1.1 Onboarding / formulario de perfil

**Qué es:** una secuencia de pantallas (o una sola con secciones
colapsables) donde el usuario configura su `Perfil`.

**Campos mínimos:**
- Dieta (radio: ninguna / vegetariano / vegano / pescetariano)
- Alergias (multi-select: cacahuate, mariscos, lácteos, gluten, huevo, soya, frutos secos)
- Evita cerdo (toggle)
- Evita alcohol (toggle)
- Evita mariscos (toggle)
- Tolerancia a picante (radio: bajo / medio / alto)
- Estómago sensible (toggle — bonus para platillos digestivos)
- Estado actual (dropdown de estados mexicanos — activa bonus regional)
- Idioma (radio: español / English — sincronizar con i18n)

**Campos opcionales (avanzado):**
- Ingredientes a evitar (text input multi)
- Ingredientes favoritos (text input multi)
- Restricciones: sin gluten, sin lácteos (toggles separados por si no es alergia)

**Persistencia:** el hook `usePerfil()` ya maneja guardado en
AsyncStorage. Solo llamas `guardar(perfil)` al terminar.

**Routing:** el root `_layout.tsx` debe chequear si hay perfil:
```tsx
const { perfil, cargando } = usePerfil();
if (cargando) return <Splash />;
if (!perfil) return <Redirect href="/onboarding" />;
```

**Esfuerzo:** alto (4-6h). Es la pantalla más grande de la app.

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

1. **Sincronización idioma** (2.1) — 20 min, habilita que las frases
   del LLM respeten i18n desde el día 1.
2. **Onboarding / perfil** (1.1) — todo lo demás depende de tener
   `Perfil` en AsyncStorage.
3. **Home con recomendaciones** (1.2) — valida toda la cadena
   perfil → catálogo → recomendaciones → render.
4. **Detalle de platillo** (1.3) — activa la capa LLM (explicación
   + frases) y feedback.
5. **Scanner** (1.4) — la estrella, pero depende de que el detalle
   esté listo para navegación desde item matcheado.
6. **Offline + splash** (2.3, 2.4) — polish.
7. **Guardados** (2.2) — bonus.

Dos personas en paralelo: uno onboarding+home, otro detalle+scanner.
Se juntan en prioridad 2.
