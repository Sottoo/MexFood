// Pegamento entre la app Expo y los paquetes @core/* del monorepo.
//
// Aquí se construyen los clientes de Supabase y del LLM, se provee el
// adapter de storage (AsyncStorage) y el helper de hash (expo-crypto).
// Las pantallas deberían importar desde aquí, no directamente de @core/*.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Localization from "expo-localization";
import { crearDataClient, type DataClient } from "@core/data";
import { crearLlmClient, type LlmClient, type MenuCache } from "@core/llm";
import type {
  AnalisisMenu,
  Catalogo,
  ColorSemaforo,
  EntradaMenuCache,
  Explicacion,
  Frase,
  IdiomaISO,
  ItemMenuDetectado,
  Perfil as PerfilCore,
  Platillo,
  Recomendacion,
  ResultadoRecomendacion,
  Variante,
} from "@core/types";

export const IDIOMAS_SOPORTADOS: ReadonlyArray<IdiomaISO> = [
  "es",
  "en",
  "fr",
  "de",
  "pt",
  "it",
  "ja",
  "ar",
  "zh",
];

// Normaliza un código de idioma (de i18n o del sistema) al subset que el
// tipo `IdiomaISO` acepta. Quita variantes regionales ("en-US" → "en") y
// cae al fallback si el idioma no es soportado.
export function normalizarIdioma(
  candidato: string | undefined | null,
  fallback: IdiomaISO = "es",
): IdiomaISO {
  if (!candidato) return fallback;
  const base = candidato.split("-")[0]?.toLowerCase() ?? "";
  return (IDIOMAS_SOPORTADOS as readonly string[]).includes(base)
    ? (base as IdiomaISO)
    : fallback;
}

// Lee el idioma del sistema (vía expo-localization). Usado para sembrar
// perfilPorDefecto y como último recurso si i18n aún no está listo.
export function idiomaDelSistema(): IdiomaISO {
  return normalizarIdioma(Localization.getLocales()[0]?.languageCode);
}

export interface Perfil extends PerfilCore {
  paisOrigen?: string;
}

export interface Clientes {
  data: DataClient;
  llm: LlmClient;
  menuCache: MenuCache;
}

let clientes: Clientes | null = null;

export function obtenerClientes(): Clientes {
  if (clientes) return clientes;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en .env",
    );
  }

  const data = crearDataClient({ url, anonKey });
  const llm = crearLlmClient({
    url: `${url}/functions/v1/llm`,
    anonKey,
    timeoutMs: 20000,
  });

  const menuCache: MenuCache = {
    get: (hashImagen) => data.fetchMenuCache(hashImagen),
    set: (hashImagen, entrada) => data.guardarMenuCache(hashImagen, entrada),
  };

  clientes = { data, llm, menuCache };
  return clientes;
}

// AsyncStorage cumple el shape de StorageAdapter tal cual; re-exportamos
// para que las pantallas no dependan directamente del módulo RN.
export const storageCatalogo = AsyncStorage;

export async function hashBase64(base64: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64);
}

// Perfil mínimo para que la app arranque sin onboarding completo.
// Las pantallas deberían reemplazarlo con datos reales al completar
// el form de perfil. `idioma` se siembra desde el sistema para que las
// llamadas al LLM hechas antes del onboarding ya respondan en el idioma
// correcto.
export function perfilPorDefecto(): Perfil {
  return {
    alergias: [],
    dieta: { vegetariano: false, vegano: false, pescetariano: false, keto: false },
    restricciones: { sinGluten: false, sinLacteos: false },
    evitaCerdo: false,
    evitaAlcohol: false,
    evitaMariscos: false,
    toleranciaPicante: "medio",
    estomagoSensible: false,
    ingredientesEvitar: [],
    ingredientesFavoritos: [],
    estadoActual: "",
    idioma: idiomaDelSistema(),
    paisOrigen: "mx",
  };
}

// Hash corto del perfil para anonimizar feedback (opcional).
// Estable mientras el perfil no cambie; cambia cuando cambia.
export async function hashPerfil(perfil: Perfil): Promise<string> {
  const json = JSON.stringify(perfil);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    json,
  );
  return hash.slice(0, 16);
}

export type {
  AnalisisMenu,
  Catalogo,
  ColorSemaforo,
  EntradaMenuCache,
  Explicacion,
  Frase,
  IdiomaISO,
  ItemMenuDetectado,
  Platillo,
  Recomendacion,
  ResultadoRecomendacion,
  Variante,
};
