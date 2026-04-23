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
  Perfil,
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
} from "./core";

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
// cuando cambian perfil o catálogo.
export function useRecomendaciones(
  perfil: Perfil | null,
  catalogo: Catalogo | null,
  opciones: { topN?: number; maxEvitar?: number } = {},
): ResultadoRecomendacion {
  return useMemo(() => {
    if (!perfil || !catalogo) {
      return { recomendados: [], evitar: [], totalEvaluados: 0 };
    }
    return recomendarPlatillos(perfil, catalogo, opciones);
  }, [perfil, catalogo, opciones.topN, opciones.maxEvitar]);
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
