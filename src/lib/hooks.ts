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
import { useTranslation } from "react-i18next";
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
  idiomaDelSistema,
  normalizarIdioma,
  obtenerClientes,
  perfilPorDefecto,
  storageCatalogo,
  type Perfil,
} from "./core";

// Lee el idioma activo de i18n y lo normaliza al subset de IdiomaISO.
// Preferimos `resolvedLanguage` (lo que i18n efectivamente está usando
// tras el fallback) sobre `language` (lo solicitado, que puede traer
// región como "en-US"). Si nada está disponible, cae al sistema.
function useIdiomaActivo(): Perfil["idioma"] {
  const { i18n } = useTranslation();
  return normalizarIdioma(
    i18n.resolvedLanguage ?? i18n.language,
    idiomaDelSistema(),
  );
}

// Normaliza para comparar estados sin importar acentos / mayúsculas.
function normalizarEstado(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

const CLAVE_PERFIL = "mexfood:perfil:v1";

let globalPerfil: Perfil | null = null;
const perfilListeners = new Set<(p: Perfil | null) => void>();

// Perfil persistido en AsyncStorage. `perfil === null` significa "todavía
// no existe" — rutear a onboarding. Una vez completado, `guardar(p)` lo
// persiste y actualiza el estado.
export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(globalPerfil);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    
    if (globalPerfil === null && cargando) {
      AsyncStorage.getItem(CLAVE_PERFIL)
        .then((raw) => {
          if (!cancelado && raw) {
            try {
              const parsed = JSON.parse(raw) as Perfil;
              globalPerfil = parsed;
              setPerfil(parsed);
              perfilListeners.forEach(l => l(parsed));
            } catch {
              setPerfil(null);
            }
          }
          if (!cancelado) setCargando(false);
        })
        .catch(() => {
          if (!cancelado) setCargando(false);
        });
    } else {
      setPerfil(globalPerfil);
      setCargando(false);
    }

    const listener = (newPerfil: Perfil | null) => {
      setPerfil(newPerfil);
    };
    perfilListeners.add(listener);

    return () => {
      cancelado = true;
      perfilListeners.delete(listener);
    };
  }, []);

  const guardar = useCallback(async (nuevo: Perfil) => {
    globalPerfil = nuevo;
    setPerfil(nuevo);
    perfilListeners.forEach(l => l(nuevo));
    try {
      await AsyncStorage.setItem(CLAVE_PERFIL, JSON.stringify(nuevo));
    } catch {
      // ignoramos fallos de storage; el perfil vive en memoria esta sesión
    }
  }, []);

  const actualizar = useCallback(
    async (parcial: Partial<Perfil>) => {
      // Use the latest globalPerfil to ensure no stale data
      const base = globalPerfil ?? perfilPorDefecto();
      await guardar({ ...base, ...parcial });
    },
    [guardar],
  );

  const borrar = useCallback(async () => {
    globalPerfil = null;
    setPerfil(null);
    perfilListeners.forEach(l => l(null));
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

// Snapshot compartido entre todas las instancias de `useUbicacion`.
// Antes cada componente disparaba su propio request de permiso + GPS +
// reverse-geocode; con Home + Header montados a la vez eso eran dos
// llamadas paralelas al mismo dato. Ahora la primera instancia lanza
// la detección, las siguientes leen del snapshot y `refrescar` se
// deduplica vía `detectandoPromise` (si ya hay una en vuelo, joinea).
type SnapshotUbicacion = Omit<EstadoUbicacion, "refrescar">;

let globalUbicacion: SnapshotUbicacion = {
  ubicacion: null,
  ciudad: null,
  cargando: true,
  error: null,
};
let detectandoPromise: Promise<void> | null = null;
let yaDetectado = false;
const ubicacionListeners = new Set<(s: SnapshotUbicacion) => void>();

function emitirUbicacion(parcial: Partial<SnapshotUbicacion>) {
  globalUbicacion = { ...globalUbicacion, ...parcial };
  ubicacionListeners.forEach((l) => l(globalUbicacion));
}

function detectarUbicacionShared(): Promise<void> {
  if (detectandoPromise) return detectandoPromise;

  detectandoPromise = (async () => {
    emitirUbicacion({ cargando: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        emitirUbicacion({
          ubicacion: null,
          ciudad: null,
          error: "Permiso de ubicación denegado",
          cargando: false,
        });
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

      emitirUbicacion({
        ubicacion: region && region !== "" ? region : null,
        ciudad: city && city !== "" ? city : null,
        error: null,
        cargando: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      emitirUbicacion({
        ubicacion: null,
        ciudad: null,
        error: msg,
        cargando: false,
      });
    } finally {
      yaDetectado = true;
      detectandoPromise = null;
    }
  })();

  return detectandoPromise;
}

export function useUbicacion(): EstadoUbicacion {
  const [snap, setSnap] = useState<SnapshotUbicacion>(globalUbicacion);

  useEffect(() => {
    // Re-sync por si el snapshot cambió entre el render inicial y el efecto.
    setSnap(globalUbicacion);

    const listener = (s: SnapshotUbicacion) => setSnap(s);
    ubicacionListeners.add(listener);

    if (!yaDetectado && !detectandoPromise) {
      void detectarUbicacionShared();
    }

    return () => {
      ubicacionListeners.delete(listener);
    };
  }, []);

  const refrescar = useCallback(() => detectarUbicacionShared(), []);

  return {
    ubicacion: snap.ubicacion,
    ciudad: snap.ciudad,
    cargando: snap.cargando,
    error: snap.error,
    refrescar,
  };
}

// Tope de espera antes de fijar plantilla como fallback. El LLM client
// tiene timeout de 20s pero en la UX del detalle 8s es lo máximo que
// queremos hacer esperar al usuario frente a un spinner.
const MAX_ESPERA_LLM_MS = 8000;

// Explicación del LLM para un match puntual. Cae a plantilla si el LLM
// falla o tarda más de MAX_ESPERA_LLM_MS. `null` en variante/platillo/
// recomendacion evita la llamada (útil mientras el detalle está cargando).
//
// Una vez fijada (LLM o plantilla), no vuelve a actualizarse para no
// reemplazar el texto mientras el usuario lee, EXCEPTO si cambia la
// variante o el idioma activo — en esos casos sí pedimos uno nuevo.
//
// El idioma que se manda al LLM viene de i18n (lo que el usuario VE en
// pantalla), no de `perfil.idioma` persistido. Esto evita drift cuando
// el usuario cambió el idioma del sistema o el toggle de Pase después
// del onboarding.
export function useExplicacion(
  perfil: Perfil | null,
  recomendacion: Recomendacion | null,
  platillo: Platillo | null,
  variante: Variante | null,
) {
  const idiomaActivo = useIdiomaActivo();
  const [explicacion, setExplicacion] = useState<Explicacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const ultimaClaveRef = useRef<string | null>(null);

  useEffect(() => {
    if (!perfil || !recomendacion || !platillo || !variante) {
      setExplicacion(null);
      setCargando(false);
      return;
    }
    // Re-pedimos cuando cambia variante O idioma; ignoramos cambios de
    // referencia que no afecten ninguno de los dos.
    const clave = `${variante.id}:${idiomaActivo}`;
    if (ultimaClaveRef.current === clave) return;
    ultimaClaveRef.current = clave;

    let resuelto = false;
    setCargando(true);
    setExplicacion(null);

    const perfilLlm: Perfil = { ...perfil, idioma: idiomaActivo };

    const fijar = (e: Explicacion) => {
      if (resuelto) return;
      resuelto = true;
      setExplicacion(e);
      setCargando(false);
    };

    const timer = setTimeout(() => {
      fijar(plantillaExplicacion(recomendacion, platillo, variante));
    }, MAX_ESPERA_LLM_MS);

    const { llm } = obtenerClientes();
    generarExplicacion(llm, perfilLlm, recomendacion, platillo, variante)
      .then((e) => fijar(e))
      .catch(() =>
        fijar(plantillaExplicacion(recomendacion, platillo, variante)),
      );

    return () => {
      resuelto = true;
      clearTimeout(timer);
    };
  }, [perfil, recomendacion, platillo, variante, idiomaActivo]);

  return { explicacion, cargando };
}

// Frases para pedir (ES + traducción + pronunciación fonética).
// El idioma de la traducción sale del idioma activo de i18n (no de
// perfil.idioma) para que siempre coincida con lo que el usuario lee.
//
// Mismas garantías que useExplicacion: una sola actualización, fallback
// a plantilla si el LLM tarda más de MAX_ESPERA_LLM_MS, y re-fetch si
// cambia el platillo o el idioma.
export function useFrases(perfil: Perfil | null, platillo: Platillo | null) {
  const idiomaActivo = useIdiomaActivo();
  const [frases, setFrases] = useState<Frase[]>([]);
  const [cargando, setCargando] = useState(false);
  const ultimaClaveRef = useRef<string | null>(null);

  useEffect(() => {
    if (!perfil || !platillo) {
      setFrases([]);
      setCargando(false);
      return;
    }
    const clave = `${platillo.id}:${idiomaActivo}`;
    if (ultimaClaveRef.current === clave) return;
    ultimaClaveRef.current = clave;

    let resuelto = false;
    setCargando(true);
    setFrases([]);

    const perfilLlm: Perfil = { ...perfil, idioma: idiomaActivo };

    const fijar = (f: Frase[]) => {
      if (resuelto) return;
      resuelto = true;
      setFrases(f);
      setCargando(false);
    };

    const timer = setTimeout(() => {
      fijar(plantillaFrases(platillo, perfilLlm));
    }, MAX_ESPERA_LLM_MS);

    const { llm } = obtenerClientes();
    generarFrasesParaPedir(llm, platillo, perfilLlm)
      .then((f) => fijar(f))
      .catch(() => fijar(plantillaFrases(platillo, perfilLlm)));

    return () => {
      resuelto = true;
      clearTimeout(timer);
    };
  }, [perfil, platillo, idiomaActivo]);

  return { frases, cargando };
}

// Scanner de menú: wrapper sobre analizarMenu con cache y hash SHA-256.
// Uso:
//   const { analizar, cargando, analisis } = useAnalizarMenu();
//   await analizar(base64Imagen, "image/jpeg", perfil, catalogo);
//
// Devuelve AnalisisMenu con itemsDetectados (texto + color + score + motivo).
export function useAnalizarMenu() {
  const idiomaActivo = useIdiomaActivo();
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
        const perfilLlm: Perfil = { ...perfil, idioma: idiomaActivo };
        const res = await analizarMenuCore(llm, imagenBase64, perfilLlm, catalogo, {
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
    [idiomaActivo],
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


