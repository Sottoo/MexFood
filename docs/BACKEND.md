# Backend de MexFood — referencia para el front

Este documento describe qué hace cada pieza del backend (paquetes
`@core/*` + edge function Supabase) y cómo consumirla desde las
pantallas. Todo está ya listo, testeado (236 tests), y desplegado.

> **Principio:** todas las funciones `async` del backend **nunca
> lanzan**. Si falla la red, el LLM, o Supabase, devuelven una
> plantilla determinista o un array vacío. No necesitas `try/catch`
> defensivos en el front.

---

## Índice

1. [Setup: obtener los clientes](#1-setup-obtener-los-clientes)
2. [Perfil del usuario](#2-perfil-del-usuario)
3. [Catálogo de platillos](#3-catálogo-de-platillos)
4. [Recomendaciones con semáforo](#4-recomendaciones-con-semáforo)
5. [Explicación personalizada (LLM)](#5-explicación-personalizada-llm)
6. [Frases para pedir en español (LLM)](#6-frases-para-pedir-en-español-llm)
7. [Scanner de menú con foto (LLM visión)](#7-scanner-de-menú-con-foto-llm-visión)
8. [Feedback](#8-feedback)
9. [Matching fuzzy raw (opcional)](#9-matching-fuzzy-raw-opcional)
10. [Hooks disponibles](#10-hooks-disponibles)

---

## 1. Setup: obtener los clientes

Todos los clientes están pre-configurados en `src/lib/core.ts`. La
primera vez que llamas `obtenerClientes()` crea los clientes Supabase
y LLM usando las env vars `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY`. Siguientes llamadas devuelven los
mismos (singleton).

```ts
import { obtenerClientes } from "@/src/lib/core";

const { data, llm, menuCache } = obtenerClientes();
```

**Qué contiene cada cliente:**

| Cliente | Para qué |
|---|---|
| `data`   | Supabase: catálogo, cache de menús, feedback |
| `llm`    | Edge function Supabase que proxea a Gemini 2.5 Flash Lite |
| `menuCache` | `MenuCache` estructural que envuelve `data.fetchMenuCache`/`guardarMenuCache` |

---

## 2. Perfil del usuario

El tipo `Perfil` (importable desde `@/src/lib/core`) representa las
restricciones, gustos y contexto del usuario:

```ts
interface Perfil {
  alergias: string[];                         // ["cacahuate", "mariscos", ...]
  dieta: {
    vegetariano: boolean;
    vegano: boolean;
    pescetariano: boolean;
  };
  restricciones: {
    sinGluten: boolean;
    sinLacteos: boolean;
  };
  evitaCerdo: boolean;
  evitaAlcohol: boolean;
  evitaMariscos: boolean;
  toleranciaPicante: "bajo" | "medio" | "alto";
  estomagoSensible: boolean;
  ingredientesEvitar: string[];               // libres, tipo "cilantro"
  ingredientesFavoritos: string[];            // libres, tipo "queso"
  estadoActual: string;                       // ej. "Ciudad de México" (para bonus regional)
  idioma: "es" | "en";                        // decide idioma de las frases del LLM
}
```

**Precedencia de dieta:** vegano > pescetariano > vegetariano.
Activar `vegano: true` implica vegetariano automáticamente a efectos
de filtrado.

**Persistencia:** el front lo guarda en AsyncStorage con clave
`mexfood:perfil:v1`. El hook `usePerfil()` ya lo maneja.

```ts
import { usePerfil } from "@/src/lib/hooks";
import { perfilPorDefecto } from "@/src/lib/core";

function FormPerfil() {
  const { perfil, cargando, guardar } = usePerfil();

  // primera vez que entra: perfil === null → mostrar onboarding
  if (cargando) return <ActivityIndicator />;
  if (!perfil) return <Onboarding onListo={guardar} />;

  // actualizar un campo
  const marcarVegetariano = () =>
    guardar({ ...perfil, dieta: { ...perfil.dieta, vegetariano: true } });
}
```

---

## 3. Catálogo de platillos

220 platillos + 190 variantes sembrados en Supabase. Cada platillo
tiene nombre, descripción, categoría, región y estado típicos, etc.
Cada variante pertenece a un platillo y tiene ingredientes, alérgenos,
flags dietéticos, nivel de picante.

### Desde el hook

```ts
import { useCatalogo } from "@/src/lib/hooks";

const { catalogo, cargando } = useCatalogo();
// catalogo.platillos: Platillo[]
// catalogo.variantes: Variante[]
```

El hook usa `fetchCatalogoConCache` internamente — la primera vez
va a Supabase, las siguientes 7 días sirve desde AsyncStorage (clave
`mexfood:catalogo:v1`). El front no hace nada más.

### Sin hook (por si se necesita fuera de React)

```ts
import { obtenerClientes, storageCatalogo } from "@/src/lib/core";

const { data } = obtenerClientes();
const catalogo = await data.fetchCatalogoConCache(storageCatalogo);
```

---

## 4. Recomendaciones con semáforo

Dado un `Perfil` y un `Catalogo`, devuelve dos listas ordenadas: las
mejores coincidencias y las que debe evitar. Cada recomendación tiene
un color verde/amarillo/naranja/rojo y razones + / −.

```ts
import { useRecomendaciones } from "@/src/lib/hooks";

function PantallaHome({ perfil, catalogo }) {
  const { recomendados, evitar, totalEvaluados } = useRecomendaciones(
    perfil,
    catalogo,
    { topN: 20, maxEvitar: 5 },
  );

  return (
    <FlatList
      data={recomendados}
      renderItem={({ item }) => (
        <PlatilloCard
          recomendacion={item}
          platillo={catalogo.platillos.find((p) => p.id === item.platilloId)!}
          variante={catalogo.variantes.find((v) => v.id === item.varianteId)!}
        />
      )}
    />
  );
}
```

**Shape de una `Recomendacion`:**

```ts
{
  varianteId: string;
  platilloId: string;
  score: number;                         // 0-100
  apto: boolean;                         // pasó hard filters
  etiqueta: "Muy recomendable" | "Compatible con precauciones" | "Con reservas" | "No recomendable";
  color: "verde" | "amarillo" | "naranja" | "rojo";
  razonesPositivas: string[];            // ej. ["Regional de tu zona", "Alto en queso (favorito)"]
  razonesNegativas: string[];            // ej. ["Contiene gluten"]
  advertencias: string[];
  razonBloqueo?: string;                 // solo si apto=false, ej. "Contiene cerdo — lo evitas"
}
```

**Qué muestra cada color:**
- **Verde** (score ≥ 70): perfecto para el perfil.
- **Amarillo** (50-69): compatible con pequeñas reservas (picante, etc.).
- **Naranja** (30-49): varios puntos en contra pero no bloqueado.
- **Rojo:** bloqueado por hard filter (alergia, dieta, etc.).

---

## 5. Explicación personalizada (LLM)

Texto en español natural explicando por qué este platillo es o no es
buena opción para este perfil concreto. Incluye opcional `tipCultural`
y `advertencia`.

```ts
import { useExplicacion } from "@/src/lib/hooks";

function DetallePlatillo({ perfil, recomendacion, platillo, variante }) {
  const { explicacion, cargando } = useExplicacion(
    perfil,
    recomendacion,
    platillo,
    variante,
  );
  // explicacion siempre es no-null mientras haya inputs — muestra la
  // plantilla al instante y actualiza cuando el LLM responde (1-3s).

  return (
    <View>
      <Text>{explicacion?.texto}</Text>
      {explicacion?.tipCultural && <Text italic>{explicacion.tipCultural}</Text>}
      {explicacion?.advertencia && <Text warning>⚠ {explicacion.advertencia}</Text>}
      {explicacion?.fuente === "plantilla" && <Text small>(modo offline)</Text>}
    </View>
  );
}
```

**Shape de `Explicacion`:**
```ts
{
  texto: string;                         // el "por qué" principal
  tipCultural?: string;                  // dato cultural opcional
  advertencia?: string;                  // ⚠ si es relevante
  fuente: "llm" | "plantilla";          // para mostrar badge "offline" si quieres
}
```

---

## 6. Frases para pedir en español (LLM)

Devuelve 3 frases útiles para ordenar el platillo en un restaurante,
con traducción al idioma del perfil y pronunciación fonética para que
un turista pueda leerlas.

```ts
import { useFrases } from "@/src/lib/hooks";

function FrasesUtiles({ perfil, platillo }) {
  const { frases, cargando } = useFrases(perfil, platillo);

  return frases.map((f, i) => (
    <View key={i}>
      <Text size="large">{f.fraseEs}</Text>         {/* "¿Lleva cerdo?" */}
      <Text>{f.traduccion}</Text>                    {/* "Does it have pork?" */}
      <Text italic small>{f.pronunciacionFonetica}</Text>  {/* "JE-va SER-do" */}
    </View>
  ));
}
```

**Idioma:** se saca de `perfil.idioma`. Si el usuario cambia idioma en
el toggle i18n, actualiza `perfil.idioma` también (usando
`actualizar({ idioma: "en" })` del hook `usePerfil`).

---

## 7. Scanner de menú con foto (LLM visión)

Usuario fotografía un menú → Gemini extrae los platillos listados →
matcheamos local contra nuestro catálogo → devolvemos cada item con su
color de recomendación para *ese* usuario.

```ts
import * as ImagePicker from "expo-image-picker";
import { useAnalizarMenu } from "@/src/lib/hooks";

function Scanner({ perfil, catalogo }) {
  const { analizar, analisis, cargando } = useAnalizarMenu();

  const tomarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,                      // recomprimir para no gastar tokens
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    await analizar(
      asset.base64,
      asset.mimeType ?? "image/jpeg",
      perfil,
      catalogo,
    );
  };

  return (
    <>
      <Button onPress={tomarFoto}>Escanear menú</Button>
      {cargando && <ActivityIndicator />}
      <FlatList
        data={analisis.itemsDetectados}
        renderItem={({ item }) => (
          <View>
            <Text>{item.textoOriginal}</Text>
            {item.matchPlatillo && (
              <Text color={item.color}>
                {item.matchPlatillo.nombre} · {item.motivo}
              </Text>
            )}
            {!item.matchPlatillo && (
              <Text muted>No encontrado en catálogo</Text>
            )}
          </View>
        )}
      />
      <Text small>Confianza OCR: {analisis.confianzaOCR}</Text>
    </>
  );
}
```

**Cache automático:** la primera vez que una foto concreta se analiza
paga una llamada a Gemini (~2-5s). Las siguientes veces que se envíe
exactamente la misma imagen (SHA-256 del base64) se sirve desde
Supabase en <200ms sin gastar otro token.

**Tamaño de la imagen:** si pasa de ~2MB base64, Gemini puede
timeout-ear. Ya la estás pasando con `quality: 0.7` en el picker, eso
suele alcanzar. Si tienes timeouts, baja a `0.5`.

**Shape de `AnalisisMenu`:**
```ts
{
  itemsDetectados: ItemMenuDetectado[];
  confianzaOCR: "alta" | "media" | "baja";  // derivada del ratio de match
}

interface ItemMenuDetectado {
  textoOriginal: string;                 // lo que el LLM extrajo del menú
  matchPlatillo?: Platillo;              // match al catálogo (si hubo)
  score?: number;                        // 0-100 (solo si hay variante)
  color?: "verde" | "amarillo" | "naranja" | "rojo";
  motivo: string;                        // texto explicativo
}
```

---

## 8. Feedback

Botón 👍/👎 para que el usuario califique si la explicación le sirvió.
Fire-and-forget — no bloquea ni lanza.

```ts
import { obtenerClientes, hashPerfil } from "@/src/lib/core";

async function onUtil(varianteId: string, util: boolean) {
  const { data } = obtenerClientes();
  // opcional: hash del perfil para analytics anónimos
  const ph = perfil ? await hashPerfil(perfil) : undefined;
  data.registrarFeedback(varianteId, util, ph);
  // no await necesario, nunca lanza
}
```

---

## 9. Matching fuzzy raw (opcional)

Si necesitas matchear texto libre contra el catálogo sin pasar por el
scanner (ej. usuario escribe "tacos al pastor" en un buscador):

```ts
import { encontrarMejorMatch, similitud } from "@core/llm";

const match = encontrarMejorMatch("tacos al pastor", catalogo);
// { platillo, variante?, score: 0-1, textoLimpio } o null si score < 0.6
```

`similitud(a, b)` también expuesto si quieres comparar dos strings
con nuestra normalización (NFD, stopwords, plurales).

---

## 10. Hooks disponibles

Todos en `src/lib/hooks.ts`:

| Hook | Qué devuelve | Cuándo usarlo |
|---|---|---|
| `usePerfil()` | `{ perfil, cargando, guardar, actualizar, borrar }` | App entera — cargar en root layout |
| `useCatalogo()` | `{ catalogo, cargando }` | Root layout o pantallas que listan platillos |
| `useRecomendaciones(perfil, catalogo, opts?)` | `{ recomendados, evitar, totalEvaluados }` | Home, listados filtrados por perfil |
| `useExplicacion(perfil, rec, platillo, variante)` | `{ explicacion, cargando }` | Pantalla de detalle |
| `useFrases(perfil, platillo)` | `{ frases, cargando }` | Pantalla de detalle |
| `useAnalizarMenu()` | `{ analizar, analisis, cargando }` | Pantalla del scanner |

Para cosas como feedback y hash de perfil, usa los helpers de
`src/lib/core.ts` directamente.

---

## Referencias cruzadas

- **Implementación de los hooks:** [src/lib/hooks.ts](../src/lib/hooks.ts)
- **Factories y tipos:** [src/lib/core.ts](../src/lib/core.ts)
- **Pantalla de prueba end-to-end:** [src/app/debug.tsx](../src/app/debug.tsx)
- **Paquetes fuente:** `../../packages/{types,data,llm,recomendador}`
- **Cómo se conectó todo:** [INTEGRACION.md](./INTEGRACION.md)
- **Qué pantallas faltan construir:** [ROADMAP.md](./ROADMAP.md)
