// Pegamento entre la app Expo y los paquetes @core/* del monorepo.
//
// Aquí se construyen los clientes de Supabase y del LLM, se provee el
// adapter de storage (AsyncStorage) y el helper de hash (expo-crypto).
// Las pantallas deberían importar desde aquí, no directamente de @core/*.

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
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
  Perfil,
  Platillo,
  Recomendacion,
  ResultadoRecomendacion,
  Variante,
} from "@core/types";

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
// el form de perfil.
export function perfilPorDefecto(): Perfil {
  return {
    alergias: [],
    dieta: { vegetariano: false, vegano: false, pescetariano: false },
    restricciones: { sinGluten: false, sinLacteos: false },
    evitaCerdo: false,
    evitaAlcohol: false,
    evitaMariscos: false,
    toleranciaPicante: "medio",
    estomagoSensible: false,
    ingredientesEvitar: [],
    ingredientesFavoritos: [],
    estadoActual: "",
    idioma: "es",
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
  Perfil,
  Platillo,
  Recomendacion,
  ResultadoRecomendacion,
  Variante,
};
