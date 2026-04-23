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
