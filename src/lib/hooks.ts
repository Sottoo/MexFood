// Hooks listos para copiar-pegar en pantallas.
//
// Todos son "nunca lanzan": si algo falla (LLM, red, Supabase), devuelven
// plantillas o arrays vacíos. El front solo tiene que leer los estados.
//
// Uso típico desde una pantalla:
//
//   const { perfil, guardar } = usePerfil();
//   const { catalogo } = useCatalogo();
//   const { recomendados, evitar } = useRecomendaciones(perfil, catalogo);
//
// Para el detalle:
//
//   const { explicacion } = useExplicacion(perfil, recomendacion, platillo, variante);
//   const { frases } = useFrases(perfil, platillo);
//
// Para el scanner:
//
//   const { analizar, cargando } = useAnalizarMenu();
//   const analisis = await analizar(base64, "image/jpeg", perfil, catalogo);

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  analizarMenu as analizarMenuCore,
  generarExplicacion,
  generarFrasesParaPedir,
  plantillaAnalisisMenu,
  plantillaExplicacion,
  plantillaFrases,
} from "@core/llm";
import { recomendarPlatillos } from "@core/recomendador";
import type {
  AnalisisMenu,
  Catalogo,
  Explicacion,
  Frase,
  Platillo,
  Recomendacion,
  ResultadoRecomendacion,
  Variante,
} from "@core/types";
import {
  hashBase64,
  obtenerClientes,
  perfilPorDefecto,
  storageCatalogo,
  type Perfil,
} from "./core";

// Normaliza para comparar estados sin importar acentos / mayúsculas.
function normalizarEstado(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const CLAVE_PERFIL = "mexfood:perfil:v1";

// Perfil persistido en AsyncStorage. `perfil === null` significa "todavía
// no existe" — rutear a onboarding. Una vez completado, `guardar(p)` lo
// persiste y actualiza el estado.
export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    AsyncStorage.getItem(CLAVE_PERFIL)
      .then((raw) => {
        if (cancelado) return;
        if (raw) {
          try {
            setPerfil(JSON.parse(raw) as Perfil);
          } catch {
            setPerfil(null);
          }
        }
        setCargando(false);
      })
      .catch(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const guardar = useCallback(async (nuevo: Perfil) => {
    setPerfil(nuevo);
    try {
      await AsyncStorage.setItem(CLAVE_PERFIL, JSON.stringify(nuevo));
    } catch {
      // ignoramos fallos de storage; el perfil vive en memoria esta sesión
    }
  }, []);

  const actualizar = useCallback(
    async (parcial: Partial<Perfil>) => {
      const base = perfil ?? perfilPorDefecto();
      await guardar({ ...base, ...parcial });
    },
    [perfil, guardar],
  );

  const borrar = useCallback(async () => {
    setPerfil(null);
    try {
      await AsyncStorage.removeItem(CLAVE_PERFIL);
    } catch {
      // idem
    }
  }, []);

  return { perfil, cargando, guardar, actualizar, borrar };
}

// Carga el catálogo con cache local (TTL 7d). Re-render cuando termina.
export function useCatalogo() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    const { data } = obtenerClientes();
    data
      .fetchCatalogoConCache(storageCatalogo)
      .then((cat) => {
        if (!cancelado) {
          setCatalogo(cat);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { catalogo, cargando };
}

// Recomendaciones ordenadas para el perfil actual. Memoizado — solo recalcula
// cuando cambian perfil, catálogo, o las opciones relevantes.
//
// Geolocalización (opcional):
// - `ubicacion`: si se pasa un nombre de estado (ej. "Yucatán", típicamente
//   detectado por GPS vía `useUbicacion()`), sobreescribe `perfil.estadoActual`
//   para que el bonus regional (+10) se aplique al estado real, no al que
//   el usuario haya seleccionado en el onboarding. Pasar `null` o `undefined`
//   conserva el comportamiento original (usa `perfil.estadoActual`).
// - `soloRegional`: si es `true` Y hay `ubicacion`, filtra los resultados a
//   ÚNICAMENTE platillos donde `platillo.estadoTipico` matchea la ubicación.
//   Ojo: en estados con poca cobertura del catálogo la lista puede quedar
//   muy corta o vacía. La UI debería tener un fallback ("no hay platillos
//   típicos cargados de tu estado, mostrando alternativas").
export interface OpcionesUseRecomendaciones {
  topN?: number;
  maxEvitar?: number;
  ubicacion?: string | null;
  soloRegional?: boolean;
}

export function useRecomendaciones(
  perfil: Perfil | null,
  catalogo: Catalogo | null,
  opciones: OpcionesUseRecomendaciones = {},
): ResultadoRecomendacion {
  const { topN, maxEvitar, ubicacion, soloRegional } = opciones;

  return useMemo(() => {
    if (!perfil || !catalogo) {
      return { recomendados: [], evitar: [], totalEvaluados: 0 };
    }

    const perfilEfectivo: Perfil = ubicacion
      ? { ...perfil, estadoActual: ubicacion }
      : perfil;

    const res = recomendarPlatillos(perfilEfectivo, catalogo, {
      topN,
      maxEvitar,
    });

    if (!soloRegional || !ubicacion) return res;

    const objetivo = normalizarEstado(ubicacion);
    const platillosPorId = new Map(catalogo.platillos.map((p) => [p.id, p]));
    const enEstado = (rec: Recomendacion) => {
      const p = platillosPorId.get(rec.platilloId);
      if (!p?.estadoTipico) return false;
      const e = normalizarEstado(p.estadoTipico);
      return e === objetivo || e.includes(objetivo) || objetivo.includes(e);
    };

    return {
      recomendados: res.recomendados.filter(enEstado),
      evitar: res.evitar.filter(enEstado),
      totalEvaluados: res.totalEvaluados,
    };
  }, [perfil, catalogo, topN, maxEvitar, ubicacion, soloRegional]);
}

// Detecta la ubicación del usuario vía GPS y reverse-geocoding y devuelve
// el nombre del estado mexicano (ej. "Yucatán"). Pásalo a `useRecomendaciones`
// como `ubicacion` para overridear `perfil.estadoActual`.
//
// Flujo:
//   1. Pide permiso de ubicación (foreground) la primera vez.
//   2. Lee coordenadas con baja precisión (no necesitamos exactitud, solo el estado).
//   3. Reverse-geocode → toma el campo `region` (que en MX es el estado).
//   4. Si el usuario niega permiso o algo falla, devuelve `ubicacion: null`
//      sin lanzar — el caller cae al `perfil.estadoActual` del onboarding.
//
// Uso:
//   const { ubicacion, cargando, error, refrescar } = useUbicacion();
//   const { recomendados } = useRecomendaciones(perfil, catalogo, {
//     ubicacion,           // null si no hay GPS, string si sí
//     soloRegional: false, // true para filtrar duro al estado
//   });
export interface EstadoUbicacion {
  ubicacion: string | null; // Estado
  ciudad: string | null;    // Ciudad/Municipio
  cargando: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
}

export function useUbicacion(): EstadoUbicacion {
  const [ubicacion, setUbicacion] = useState<string | null>(null);
  const [ciudad, setCiudad] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setUbicacion(null);
        setCiudad(null);
        setError("Permiso de ubicación denegado");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });

      const resultados = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      const res = resultados[0];
      const region = res?.region?.trim() ?? null;
      const city = res?.city?.trim() || res?.subregion?.trim() || null;
      
      setUbicacion(region && region !== "" ? region : null);
      setCiudad(city && city !== "" ? city : null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setUbicacion(null);
      setCiudad(null);
      setError(msg);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void detectar();
  }, [detectar]);

  return { ubicacion, ciudad, cargando, error, refrescar: detectar };
}

// Explicación del LLM para un match puntual. Cae a plantilla si el LLM
// falla. `null` en variante/platillo/recomendacion evita la llamada
// (útil mientras el detalle está cargando).
export function useExplicacion(
  perfil: Perfil | null,
  recomendacion: Recomendacion | null,
  platillo: Platillo | null,
  variante: Variante | null,
) {
  const [explicacion, setExplicacion] = useState<Explicacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const ultimaVarianteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!perfil || !recomendacion || !platillo || !variante) {
      setExplicacion(null);
      return;
    }
    // Evitar re-pedir cuando cambia referencia pero id es el mismo
    if (ultimaVarianteRef.current === variante.id) return;
    ultimaVarianteRef.current = variante.id;

    let cancelado = false;
    setCargando(true);
    // Mostramos plantilla al instante para que la UI no quede vacía
    setExplicacion(plantillaExplicacion(recomendacion, platillo, variante));

    const { llm } = obtenerClientes();
    generarExplicacion(llm, perfil, recomendacion, platillo, variante)
      .then((e) => {
        if (!cancelado) {
          setExplicacion(e);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [perfil, recomendacion, platillo, variante]);

  return { explicacion, cargando };
}

// Frases para pedir (ES + traducción + pronunciación fonética).
// El idioma de la traducción sale de perfil.idioma.
export function useFrases(perfil: Perfil | null, platillo: Platillo | null) {
  const [frases, setFrases] = useState<Frase[]>([]);
  const [cargando, setCargando] = useState(false);
  const ultimoPlatilloRef = useRef<string | null>(null);

  useEffect(() => {
    if (!perfil || !platillo) {
      setFrases([]);
      return;
    }
    if (ultimoPlatilloRef.current === platillo.id) return;
    ultimoPlatilloRef.current = platillo.id;

    let cancelado = false;
    setCargando(true);
    setFrases(plantillaFrases(platillo, perfil));

    const { llm } = obtenerClientes();
    generarFrasesParaPedir(llm, platillo, perfil)
      .then((f) => {
        if (!cancelado) {
          setFrases(f);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [perfil, platillo]);

  return { frases, cargando };
}

// Scanner de menú: wrapper sobre analizarMenu con cache y hash SHA-256.
// Uso:
//   const { analizar, cargando, analisis } = useAnalizarMenu();
//   await analizar(base64Imagen, "image/jpeg", perfil, catalogo);
//
// Devuelve AnalisisMenu con itemsDetectados (texto + color + score + motivo).
export function useAnalizarMenu() {
  const [analisis, setAnalisis] = useState<AnalisisMenu>(plantillaAnalisisMenu());
  const [cargando, setCargando] = useState(false);

  const analizar = useCallback(
    async (
      imagenBase64: string,
      mimeType: string,
      perfil: Perfil,
      catalogo: Catalogo,
    ): Promise<AnalisisMenu> => {
      setCargando(true);
      try {
        const { llm, menuCache } = obtenerClientes();
        const hashImagen = await hashBase64(imagenBase64);
        const res = await analizarMenuCore(llm, imagenBase64, perfil, catalogo, {
          mimeType,
          cache: menuCache,
          hashImagen,
        });
        setAnalisis(res);
        return res;
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  return { analizar, analisis, cargando };
}

const CLAVE_GUARDADOS = "mexfood:guardados:v1";

// Singleton state for guardados to sync across multiple hook instances
let globalGuardados: string[] = [];
const listeners = new Set<(ids: string[]) => void>();

export function useGuardados() {
  const [ids, setIds] = useState<string[]>(globalGuardados);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    
    // Si ya tenemos datos globales, no necesitamos cargar de disk de nuevo obligatoriamente
    // pero lo hacemos la primera vez que se monta cualquier instancia.
    if (globalGuardados.length === 0 && cargando) {
      AsyncStorage.getItem(CLAVE_GUARDADOS)
        .then((raw) => {
          if (!cancelado && raw) {
            try {
              const parsed = JSON.parse(raw);
              globalGuardados = parsed;
              setIds(parsed);
              listeners.forEach(l => l(parsed));
            } catch {
              setIds([]);
            }
          }
          if (!cancelado) setCargando(false);
        })
        .catch(() => {
          if (!cancelado) setCargando(false);
        });
    } else {
      setIds(globalGuardados);
      setCargando(false);
    }

    const listener = (newIds: string[]) => {
      setIds(newIds);
    };
    listeners.add(listener);

    return () => { 
      cancelado = true; 
      listeners.delete(listener);
    };
  }, []);

  const conmutarGuardado = useCallback(async (id: string) => {
    const prev = globalGuardados;
    const nuevo = prev.includes(id) 
      ? prev.filter((i) => i !== id) 
      : [...prev, id];
    
    globalGuardados = nuevo;
    listeners.forEach(l => l(nuevo));
    
    try {
      await AsyncStorage.setItem(CLAVE_GUARDADOS, JSON.stringify(nuevo));
    } catch {
      // ignore
    }
  }, []);

  const esGuardado = useCallback((id: string) => ids.includes(id), [ids]);

  return { guardados: ids, conmutarGuardado, esGuardado, cargando };
}


