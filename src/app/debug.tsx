// Pantalla de prueba end-to-end. Accede vía /debug.
//
// Carga el catálogo desde Supabase, corre recomendarPlatillos contra
// un perfil en memoria, y muestra los resultados con su color. Sirve
// para validar que la plomería backend → front funciona.
//
// NO es parte del producto — bórralo o muévelo cuando las pantallas
// reales (home, detalle) estén en su lugar.

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCatalogo, useRecomendaciones } from "@/src/lib/hooks";
import {
  perfilPorDefecto,
  type Catalogo,
  type ColorSemaforo,
  type Perfil,
  type Recomendacion,
} from "@/src/lib/core";

const COLOR_BAR: Record<ColorSemaforo, string> = {
  verde: "#22c55e",
  amarillo: "#eab308",
  naranja: "#f97316",
  rojo: "#ef4444",
};

type PerfilPreset = { nombre: string; perfil: Perfil };

const PRESETS: PerfilPreset[] = [
  {
    nombre: "Vegetariano · CDMX · picante bajo",
    perfil: {
      ...perfilPorDefecto(),
      dieta: { vegetariano: true, vegano: false, pescetariano: false, keto: false },
      evitaCerdo: true,
      toleranciaPicante: "bajo",
      alergias: ["cacahuate"],
      estadoActual: "Ciudad de México",
    },
  },
  {
    nombre: "Vegano · Oaxaca · picante medio",
    perfil: {
      ...perfilPorDefecto(),
      dieta: { vegetariano: true, vegano: true, pescetariano: false, keto: false },
      evitaCerdo: true,
      evitaMariscos: true,
      toleranciaPicante: "medio",
      estadoActual: "Oaxaca",
    },
  },
  {
    nombre: "Sin gluten · alergia mariscos",
    perfil: {
      ...perfilPorDefecto(),
      restricciones: { sinGluten: true, sinLacteos: false },
      alergias: ["mariscos"],
      evitaMariscos: true,
      toleranciaPicante: "medio",
      estadoActual: "Yucatán",
    },
  },
];

function nombresDe(catalogo: Catalogo | null, r: Recomendacion) {
  if (!catalogo) return { platillo: r.platilloId, variante: r.varianteId };
  const platillo = catalogo.platillos.find((p) => p.id === r.platilloId);
  const variante = catalogo.variantes.find((v) => v.id === r.varianteId);
  return {
    platillo: platillo?.nombre ?? r.platilloId,
    variante: variante?.nombre ?? r.varianteId,
    regional: platillo?.estadoTipico ?? platillo?.regionTipica,
  };
}

// Panel reusable: mismo contenido que la pantalla /debug pero sin
// ScrollView, para poderlo embeber dentro de otras pantallas.
export function DebugPanel() {
  const [presetIdx, setPresetIdx] = useState(0);
  const preset = PRESETS[presetIdx]!;
  const { catalogo, cargando } = useCatalogo();
  const res = useRecomendaciones(preset.perfil, catalogo, {
    topN: 10,
    maxEvitar: 5,
  });

  const stats = useMemo(() => {
    if (!catalogo) return null;
    return `${catalogo.platillos.length} platillos · ${catalogo.variantes.length} variantes`;
  }, [catalogo]);

  return (
    <View style={styles.panel}>
      <Text style={styles.h1}>Debug · Recomendaciones end-to-end</Text>
      <Text style={styles.meta}>
        Catálogo: {cargando ? "cargando…" : (stats ?? "sin datos")}
      </Text>
      <Text style={styles.meta}>
        Total evaluados: {res.totalEvaluados} · Recomendados: {res.recomendados.length} ·
        Evitar: {res.evitar.length}
      </Text>

      <Text style={styles.h2}>Perfil de prueba</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((p, i) => (
          <Pressable
            key={p.nombre}
            onPress={() => setPresetIdx(i)}
            style={[styles.presetBtn, i === presetIdx && styles.presetBtnActivo]}
          >
            <Text style={i === presetIdx ? styles.presetTextActivo : styles.presetText}>
              {p.nombre}
            </Text>
          </Pressable>
        ))}
      </View>

      {cargando && (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={styles.meta}>Cargando catálogo de Supabase…</Text>
        </View>
      )}

      {!cargando && catalogo && (
        <>
          <Text style={styles.h2}>✓ Recomendados ({res.recomendados.length})</Text>
          {res.recomendados.length === 0 && (
            <Text style={styles.meta}>
              Sin coincidencias aptas para este perfil.
            </Text>
          )}
          {res.recomendados.map((r) => {
            const n = nombresDe(catalogo, r);
            return (
              <View
                key={r.varianteId}
                style={[styles.card, { borderLeftColor: COLOR_BAR[r.color] }]}
              >
                <Text style={styles.cardTitulo}>{n.variante}</Text>
                <Text style={styles.cardMeta}>
                  {n.platillo} · score {r.score} · {r.etiqueta}
                  {n.regional ? ` · ${n.regional}` : ""}
                </Text>
                {r.razonesPositivas.slice(0, 2).map((x, i) => (
                  <Text key={`p${i}`} style={styles.cardPos}>
                    + {x}
                  </Text>
                ))}
                {r.razonesNegativas.slice(0, 1).map((x, i) => (
                  <Text key={`n${i}`} style={styles.cardNeg}>
                    − {x}
                  </Text>
                ))}
              </View>
            );
          })}

          <Text style={styles.h2}>✗ Evitar ({res.evitar.length})</Text>
          {res.evitar.map((r) => {
            const n = nombresDe(catalogo, r);
            return (
              <View
                key={r.varianteId}
                style={[styles.card, { borderLeftColor: COLOR_BAR.rojo }]}
              >
                <Text style={styles.cardTitulo}>{n.variante}</Text>
                <Text style={styles.cardMeta}>
                  {n.platillo} · {r.etiqueta}
                </Text>
                <Text style={styles.cardNeg}>
                  {r.razonBloqueo ?? "No compatible con tu perfil."}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </View>
  );
}

// Export por defecto = ruta /debug. Envuelve el panel en ScrollView.
export default function DebugScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <DebugPanel />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f14" },
  panel: { backgroundColor: "#0b0f14", padding: 16 },
  h1: { fontSize: 22, fontWeight: "700", color: "#f5f5f4", marginBottom: 6 },
  h2: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d6d3d1",
    marginTop: 20,
    marginBottom: 8,
  },
  meta: { fontSize: 13, color: "#a8a29e", marginBottom: 2 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1c1917",
    borderWidth: 1,
    borderColor: "#292524",
  },
  presetBtnActivo: { backgroundColor: "#10b981", borderColor: "#10b981" },
  presetText: { color: "#d6d3d1", fontSize: 13 },
  presetTextActivo: { color: "#0b0f14", fontSize: 13, fontWeight: "600" },
  loading: { marginTop: 20, alignItems: "center" },
  card: {
    backgroundColor: "#1c1917",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  cardTitulo: { color: "#f5f5f4", fontSize: 15, fontWeight: "600" },
  cardMeta: { color: "#a8a29e", fontSize: 12, marginTop: 2 },
  cardPos: { color: "#86efac", fontSize: 12, marginTop: 4 },
  cardNeg: { color: "#fca5a5", fontSize: 12, marginTop: 4 },
});
