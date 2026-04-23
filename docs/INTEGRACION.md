# Cómo se conectó el backend con el frontend

Este documento explica la arquitectura de integración entre el
backend (`mexfood-core`) y el frontend (`MexFood`). Sirve para que
cualquiera pueda reproducir el setup, debuggearlo o extenderlo.

---

## Contexto: dos repos, un monorepo local

- **Backend:** [iamHN3Y/mexfood-core](https://github.com/iamHN3Y/mexfood-core)
  — paquetes `@core/types`, `@core/parser`, `@core/data`,
  `@core/recomendador`, `@core/llm`. Lógica + persistencia.
- **Frontend:** [Sottoo/MexFood](https://github.com/Sottoo/MexFood)
  — Expo Router + React Native + TypeScript. UI.

Cada repo mantiene su propio historial y su equipo pushea a su remote
independientemente. El código combinado vive solo en el filesystem
local para desarrollo.

```
mexfood-core/                      ← outer repo (backend)
├── packages/
│   ├── types/                     ← @core/types
│   ├── parser/                    ← @core/parser
│   ├── data/                      ← @core/data
│   ├── recomendador/              ← @core/recomendador
│   └── llm/                       ← @core/llm
├── supabase/
│   ├── functions/llm/             ← edge function (proxy Gemini)
│   └── migrations/                ← schema
├── scripts/
│   └── seed-supabase.ts           ← sembrar catálogo
└── apps/                          ← gitignored (no forma parte de este repo)
    └── mexfood/                   ← clon del repo del front
        ├── src/
        ├── metro.config.js        ← config monorepo
        └── package.json           ← deps + file: refs a ../../packages/
```

`apps/` está en `.gitignore` del outer para que el backend no
"absorba" el repo del front. El front sigue siendo un repo
independiente con su `.git` propio.

---

## Cómo se instaló el front dentro del monorepo

```bash
# desde la raíz del repo backend
mkdir -p apps
git clone https://github.com/Sottoo/MexFood.git apps/mexfood
echo "apps/" >> .gitignore    # ya agregado
cd apps/mexfood
# edit package.json — ver abajo
npm install
```

Después del `npm install`, los paquetes `@core/*` quedan como
symlinks dentro de `apps/mexfood/node_modules/@core/*` apuntando a
`../../packages/<nombre>`.

---

## package.json del front: qué cambió

Se agregaron 4 `file:` refs a los paquetes del backend y 5 libs
runtime necesarias.

```json
"dependencies": {
  "@core/data": "file:../../packages/data",
  "@core/llm": "file:../../packages/llm",
  "@core/recomendador": "file:../../packages/recomendador",
  "@core/types": "file:../../packages/types",

  "@supabase/supabase-js": "^2.103.3",
  "@react-native-async-storage/async-storage": "2.2.0",
  "expo-crypto": "~15.0.7",
  "expo-image-picker": "~17.0.8",
  "react-native-url-polyfill": "^2.0.0",

  // ...todo lo demás que ya tenían
}
```

**Por qué cada nueva dep:**

| Paquete | Para qué |
|---|---|
| `@supabase/supabase-js` | Cliente de Supabase que usa `@core/data` |
| `@react-native-async-storage/async-storage` | Implementación del `StorageAdapter` que `@core/data` espera para el cache del catálogo. Cumple la interfaz tal cual, sin wrapper. |
| `expo-crypto` | SHA-256 del base64 de la imagen para la key del cache de menús (el `@core/data` necesita recibirla ya calculada; no usa `node:crypto`) |
| `expo-image-picker` | Cámara / galería para el scanner de menú. Devuelve base64 directo |
| `react-native-url-polyfill` | Requerido por `@supabase/supabase-js` en RN (no tiene `URL` nativo en versiones viejas; importarlo en `_layout.tsx` para que cargue antes que Supabase) |

---

## metro.config.js: la parte no-trivial

Metro (el bundler de RN) por defecto solo observa archivos dentro del
proyecto. Para que resuelva `@core/*` desde
`../../packages/<name>/src/index.ts` hay que decírselo explícitamente.

Además, nuestros fuentes TS usan imports con sufijo `.js`
(`import { x } from "./foo.js"`) porque el backend compila en modo
ESM NodeNext. Metro no sabe hacer esa sustitución `.js → .ts`
por defecto, así que hay un resolver custom.

```js
// apps/mexfood/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) Observar el monorepo entero → cambios en packages/ → hot reload
config.watchFolders = [monorepoRoot];

// 2) Buscar node_modules primero en el front, luego en la raíz del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3) npm link crea symlinks; Metro necesita seguirlos
config.resolver.unstable_enableSymlinks = true;

// 4) Reescribir ".js" → ".ts" dentro de packages/
const packagesDirSegment = `${path.sep}packages${path.sep}`;
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".js")) {
    const origin = context.originModulePath || "";
    if (origin.includes(packagesDirSegment)) {
      try {
        return context.resolveRequest(context, moduleName.slice(0, -3), platform);
      } catch {
        // cae al resolver por defecto
      }
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

**Qué pasa sin esto:** Metro fallaría con `Unable to resolve module
./catalogo.js from ../packages/data/src/cliente.ts` porque el archivo
se llama `catalogo.ts`, no `.js`.

---

## Variables de entorno

Expo carga automáticamente cualquier var prefijada con `EXPO_PUBLIC_`
desde `.env` y la expone en runtime como `process.env.EXPO_PUBLIC_*`.

**Archivo:** `apps/mexfood/.env` (ignorado por git, no se commitea)

```ini
EXPO_PUBLIC_SUPABASE_URL=https://pnrqjefkhcgwreqqqfiu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

La anon key viaja embebida en el bundle — eso es correcto por diseño
de Supabase, porque la seguridad real vive en las **policies RLS**
que están en `supabase/migrations/`. Un atacante con la anon key solo
puede hacer lo que las policies permiten (leer catálogo público,
insertar feedback, read+write al cache de menús).

La key secreta (`service_role` o `GEMINI_API_KEY`) **nunca** llega al
front. Vive solo como secret de la edge function de Supabase.

---

## Capa de adaptación: src/lib/

Todo el código del front pasa por dos archivos antes de tocar los
paquetes `@core/*`. Esto mantiene al front acoplado a un API
estable local y al backend desacoplado de React.

### `src/lib/core.ts` — factories y primitivas

Responsabilidades:

- `obtenerClientes()` → singleton `{ data, llm, menuCache }`
- `storageCatalogo` → `AsyncStorage` re-exportado (cumple
  `StorageAdapter` tal cual)
- `hashBase64(base64)` → SHA-256 vía `expo-crypto`
- `hashPerfil(perfil)` → hash corto para anonimizar feedback
- `perfilPorDefecto()` → seed de perfil nuevo
- Re-export de tipos (`Perfil`, `Catalogo`, `Platillo`, ...) para que
  las pantallas no importen desde `@core/types` directamente.

### `src/lib/hooks.ts` — React hooks

Convierten las funciones async del backend en estados reactivos. Ver
[BACKEND.md §10](./BACKEND.md#10-hooks-disponibles) para el listado
completo.

Principio de diseño de los hooks:
1. **Nunca bloquean el render.** Si los inputs no están listos
   (`perfil === null`), devuelven un estado neutro (array vacío,
   `null`, etc).
2. **Mostrar plantilla + actualizar.** Para `useExplicacion` y
   `useFrases` se pinta la plantilla determinista al instante, y
   cuando el LLM responde se sobreescribe. Así la UI nunca tiene un
   skeleton prolongado.
3. **Memoización basada en id, no en referencia.** Se evita re-pedir
   al LLM solo porque React re-mountó el componente.

---

## Cómo se propagan los datos

Diagrama mental del flujo desde que el usuario abre la app:

```
1. App arranca
   └→ <_layout.tsx> importa react-native-url-polyfill/auto
   └→ usePerfil() lee AsyncStorage "mexfood:perfil:v1"
       └→ si no hay perfil → rutea a /onboarding (por construir)
   └→ useCatalogo() lee AsyncStorage "mexfood:catalogo:v1" o Supabase
       └→ 220 platillos + 190 variantes en memoria

2. Usuario en home
   └→ useRecomendaciones(perfil, catalogo) → memoiza localmente
       └→ recomendarPlatillos(perfil, catalogo) (puro, sin red)
           └→ calcularMatchScore por cada variante (hard filters + scoring)
   └→ Lista de cards con color semáforo

3. Usuario toca un platillo
   └→ /platillo/[varianteId] (por construir)
   └→ useExplicacion() pinta plantilla → edge function → LLM → sobreescribe
   └→ useFrases() pinta plantilla → edge function → LLM → sobreescribe
   └→ Botón 👍 → data.registrarFeedback (fire-and-forget)

4. Usuario abre scanner
   └→ ImagePicker.launchCameraAsync → base64
   └→ useAnalizarMenu().analizar(base64, ...)
       └→ hashBase64(base64) → SHA-256
       └→ menuCache.get(hash) → si HIT, salta LLM
       └→ si MISS → edge function → Gemini visión → items[]
                 → matching local contra catálogo
                 → menuCache.set(hash, items) fire-and-forget
   └→ Lista de items con color por perfil
```

Notable: **el catálogo nunca viaja a Gemini**. El LLM solo ve la foto.
El matching foto→catálogo pasa en el dispositivo, lo cual (a) ahorra
tokens de Gemini, (b) permite reusar cache local del catálogo.

---

## Edge function: el proxy al LLM

Vive en `supabase/functions/llm/index.ts` (en el repo del backend).
No hay que tocarla desde el front — solo llamarla vía `crearLlmClient`.

**Qué hace:**
1. Recibe `{ accion, datos }` del cliente (el front).
2. Ya dentro de Supabase, lee `GEMINI_API_KEY` de los secrets.
3. Arma el prompt según `accion` (`explicar` / `frases` / `analizar-menu`).
4. Llama a Gemini 2.5 Flash Lite con `responseMimeType: application/json`.
5. Parsea defensivamente y devuelve `{ok: true, datos}` o `{ok: false, error}`.

**Por qué edge function en vez de llamar a Gemini directo:**
- La `GEMINI_API_KEY` no puede estar en el bundle del front (quedaría
  expuesta).
- Permite rate-limiting, caching, y cambiar de proveedor (Gemini →
  OpenAI) sin tocar la app.
- Logs centralizados para debuggear.

---

## Checklist si algo falla

| Síntoma | Causa probable |
|---|---|
| `Unable to resolve @core/data` | `npm install` no creó los symlinks. Bórralo todo y re-instala. Verifica `apps/mexfood/node_modules/@core/` tiene 4 carpetas. |
| `Unable to resolve ./cliente.js from .../catalogo.ts` | `metro.config.js` no se está aplicando. Reiniciar Metro con `--reset-cache`. |
| Catálogo no carga en el dispositivo | `.env` no está siendo leído. Verifica que `EXPO_PUBLIC_SUPABASE_URL` aparece en la consola al hacer bundle. Reiniciar Metro después de cambiar `.env`. |
| "Network request failed" | Emulador Android: usar `10.0.2.2` no funciona con Supabase (es HTTPS público). Verificar conexión a internet del dispositivo. |
| Frases en español cuando user tiene `idioma: "en"` | `perfil.idioma` no se está actualizando cuando cambia i18n. Ver ROADMAP §2.1. |
| Explicación se ve genérica / plantilla siempre | Edge function caída o timeout. Verifica consola de Supabase en el dashboard. Fallback transparente → `explicacion.fuente === "plantilla"`. |
| Scanner timeout | Imagen muy grande (>2MB base64). Bajar `quality` del ImagePicker a 0.5. |

---

## Cómo mantener ambos repos en sync

**Backend (iamHN3Y/mexfood-core):**
- Commit & push a `main` desde la raíz del monorepo.
- Los cambios en `packages/*` se reflejan inmediatamente en el front
  gracias a los symlinks y `watchFolders`.

**Frontend (Sottoo/MexFood):**
- `cd apps/mexfood` y commit/push al repo suyo normalmente.
- Los `file:` refs en `package.json` son específicos del monorepo
  local, **pero se commitearán**. Si otro dev del front clona el repo
  suelto sin tener `mexfood-core` de hermano, `npm install` fallará.
  Soluciones:
  1. Ignorar `package.json` al commitear (parche local no-commiteado)
  2. Documentar que el repo se trabaja clonado dentro de
     `mexfood-core/apps/`
  3. Opción 2 es lo que estamos haciendo de facto — el front asume el
     setup del monorepo.

Si el equipo del front quiere poder clonar su repo solo, habría que
publicar los `@core/*` en un registry privado o usar un bundle
precompilado. Para el hackathon no hace falta.
