# Documentación técnica — MexFood

Docs para el equipo del front sobre cómo consumir el backend
`mexfood-core` y qué queda por construir.

| Documento | Qué contiene |
|---|---|
| [BACKEND.md](./BACKEND.md) | **Referencia:** todas las funcionalidades listas + ejemplos de uso por pantalla. Empezar por aquí. |
| [ROADMAP.md](./ROADMAP.md) | **Qué falta:** lista ordenada de pantallas/features por construir en la app final. |
| [INTEGRACION.md](./INTEGRACION.md) | **Arquitectura:** cómo se conectaron los dos repos, el monorepo local, Metro, env vars, troubleshooting. |

## Quick start

```bash
# Asumiendo que ya clonaste el backend con el front dentro de apps/:
cd apps/mexfood
cp .env.example .env       # llena SUPABASE_URL y ANON_KEY
npm install
npm start                  # abre Expo Dev Tools
```

Luego escanea el QR con Expo Go, o presiona `w` para abrir en web.
Verás el panel de debug embebido en home con recomendaciones en vivo.

## Resumen de capacidades disponibles

Hooks expuestos en `src/lib/hooks.ts` (todos nunca lanzan):

| Hook | Para qué |
|---|---|
| `usePerfil()` | Perfil persistido en AsyncStorage (`mexfood:perfil:v1`). Onboarding lo crea, gate en `index.tsx` lo verifica al arrancar. |
| `useCatalogo()` | 220 platillos + 190 variantes desde Supabase con cache local 7d. |
| `useRecomendaciones(perfil, catalogo, opts)` | Lista ordenada con semáforo. Acepta `ubicacion` y `soloRegional` para filtrar por estado. |
| `useUbicacion()` | Detecta el estado del usuario por GPS (`expo-location` + reverse geocoding). |
| `useExplicacion(...)` | Texto del LLM "por qué este platillo es bueno/malo para ti". Cae a plantilla si el LLM falla. |
| `useFrases(...)` | 3 frases en español + traducción + pronunciación fonética. |
| `useAnalizarMenu()` | Scanner de menús con foto: Gemini visión + matching local + cache remoto por hash de imagen. |

Helpers en `src/lib/core.ts`: `obtenerClientes`, `storageCatalogo`,
`hashBase64`, `hashPerfil`, `perfilPorDefecto`. Ver
[BACKEND.md](./BACKEND.md) para ejemplos completos de cada uno.
