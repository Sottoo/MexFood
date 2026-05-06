import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useColorScheme, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useExplicacion, useFrases, usePerfil, useCatalogo, useGuardados } from '@/src/lib/hooks';
import { obtenerClientes, hashPerfil } from '@/src/lib/core';
import { calcularMatchScore } from '@core/recomendador';
import { Colors, MayanColors } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function DetallePlatillo() {
  const { t } = useTranslation();
  const { varianteId } = useLocalSearchParams<{ varianteId: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { esGuardado, conmutarGuardado } = useGuardados();
  const isSaved = esGuardado(varianteId ?? '');

  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { catalogo, cargando: cargandoCatalogo } = useCatalogo();

  const variante = catalogo?.variantes.find((v) => v.id === varianteId);
  const platillo = variante
    ? catalogo?.platillos.find((p) => p.id === variante.idPlatillo)
    : undefined;

  const recomendacion =
    perfil && variante && platillo
      ? calcularMatchScore(perfil, variante, platillo)
      : null;

  const { explicacion, cargando: cargandoExp } = useExplicacion(
    perfil,
    recomendacion,
    platillo ?? null,
    variante ?? null,
  );

  const { frases, cargando: cargandoFra } = useFrases(perfil, platillo ?? null);

  const onUtil = async (util: boolean) => {
    if (!varianteId) return;
    const { data } = obtenerClientes();
    const ph = perfil ? await hashPerfil(perfil) : undefined;
    data.registrarFeedback(varianteId, util, ph);
    Alert.alert(t('dish_detail.thanks'), t('dish_detail.feedback_success'));
  };

  if (cargandoPerfil || cargandoCatalogo || !perfil || !catalogo) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={MayanColors.jade} />
      </View>
    );
  }

  if (!variante || !platillo || !recomendacion) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>{t('dish_detail.not_found')}</Text>
      </View>
    );
  }

  const getBadgeColor = () => {
    switch (recomendacion.color) {
      case 'verde': return MayanColors.jade;
      case 'amarillo': return MayanColors.gold;
      case 'naranja': return MayanColors.terracotta;
      case 'rojo': return '#D32F2F';
      default: return theme.text;
    }
  };

  const badgeColor = getBadgeColor();

  return (
    <>
      <Stack.Screen options={{ title: platillo.nombre, headerBackTitle: 'Atrás' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* Header con Imagen */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=600' }} 
            style={styles.image}
          />
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons 
                name={recomendacion.color === 'verde' ? 'checkmark-circle-outline' : 'information-circle-outline'} 
                size={16} 
                color={badgeColor} 
              />
              <Text style={[styles.badgeText, { color: badgeColor }]}>{recomendacion.etiqueta}</Text>
            </View>
          </View>

          <Pressable 
            style={styles.heartButtonDetail} 
            onPress={() => conmutarGuardado(varianteId ?? '')}
          >
            <Ionicons 
              name={isSaved ? "heart" : "heart-outline"} 
              size={28} 
              color={isSaved ? MayanColors.terracotta : "#fff"} 
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Título y Descripción */}
          <View style={styles.headerSection}>
            <Text style={styles.category}>{platillo.categoria.toUpperCase()}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{platillo.nombre}</Text>
            {platillo.estadoTipico && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color={theme.icon} />
                <Text style={[styles.locationText, { color: theme.icon }]}>{t('dish_detail.typical_of')} {platillo.estadoTipico}</Text>
              </View>
            )}
            <Text style={[styles.description, { color: theme.text }]}>{platillo.descripcion}</Text>
          </View>

          {/* Explicación Personalizada */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dish_detail.why_for_me')}</Text>
            <View style={[styles.explicacionBox, { backgroundColor: theme.background === '#1a1c1a' ? '#2a2c2a' : '#fff' }]}>
              {cargandoExp && !explicacion ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={MayanColors.jade} />
                  <Text style={[styles.loadingText, { color: theme.icon }]}>
                    {t('dish_detail.loading_explanation')}
                  </Text>
                </View>
              ) : explicacion ? (
                <>
                  <Text style={[styles.explicacionTexto, { color: theme.text }]}>{explicacion.texto}</Text>
                  
                  {explicacion.advertencia && (
                    <View style={styles.advertenciaBox}>
                      <Ionicons name="warning-outline" size={16} color="#D32F2F" />
                      <Text style={styles.advertenciaTexto}>{explicacion.advertencia}</Text>
                    </View>
                  )}

                  {explicacion.tipCultural && (
                    <Text style={[styles.tipCultural, { color: theme.icon }]}>
                      💡 {explicacion.tipCultural}
                    </Text>
                  )}
                  
                  {explicacion.fuente === "plantilla" && (
                    <Text style={[styles.offlineText, { color: theme.icon }]}>{t('dish_detail.offline_mode')}</Text>
                  )}
                </>
              ) : (
                <Text style={{ color: theme.text }}>{t('dish_detail.explanation_error')}</Text>
              )}
            </View>
          </View>

          {/* Ingredientes y Alérgenos */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dish_detail.ingredients')}</Text>
            <View style={styles.tagsContainer}>
              {variante.ingredientes.map((ing, idx) => {
                // Destacar si está en alérgenos o en ingredientes a evitar del perfil
                const evitar = perfil.alergias.includes(ing) || perfil.ingredientesEvitar.includes(ing);
                return (
                  <View key={idx} style={[styles.tag, evitar ? styles.tagAvoid : { backgroundColor: MayanColors.limestone }]}>
                    <Text style={[styles.tagText, evitar ? styles.tagTextAvoid : { color: '#2b2626' }]}>{ing}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {variante.alergenos.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dish_detail.allergens')}</Text>
              <View style={styles.tagsContainer}>
                {variante.alergenos.map((alergeno, idx) => (
                  <View key={idx} style={[styles.tag, styles.tagAvoid]}>
                    <Text style={[styles.tagText, styles.tagTextAvoid]}>{alergeno}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Frases Útiles */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dish_detail.phrases')}</Text>
            {cargandoFra && frases.length === 0 ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={MayanColors.jade} />
                <Text style={[styles.loadingText, { color: theme.icon }]}>
                  {t('dish_detail.loading_phrases')}
                </Text>
              </View>
            ) : (
              frases.map((f, i) => (
                <View key={i} style={[styles.fraseBox, { borderColor: theme.icon }]}>
                  <Text style={[styles.fraseEs, { color: theme.text }]}>{f.fraseEs}</Text>
                  <Text style={[styles.fraseTrans, { color: theme.icon }]}>{f.traduccion}</Text>
                  <Text style={[styles.fraseFonetica, { color: theme.icon }]}>🗣 {f.pronunciacionFonetica}</Text>
                </View>
              ))
            )}
          </View>

          {/* Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackTitle, { color: theme.text }]}>{t('dish_detail.feedback_title')}</Text>
            <View style={styles.feedbackButtons}>
              <Pressable 
                style={({pressed}) => [styles.feedbackBtn, pressed && styles.feedbackBtnPressed]}
                onPress={() => onUtil(true)}
              >
                <Ionicons name="thumbs-up-outline" size={24} color={theme.text} />
              </Pressable>
              <Pressable 
                style={({pressed}) => [styles.feedbackBtn, pressed && styles.feedbackBtnPressed]}
                onPress={() => onUtil(false)}
              >
                <Ionicons name="thumbs-down-outline" size={24} color={theme.text} />
              </Pressable>
            </View>
          </View>

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: -15,
    alignSelf: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  heartButtonDetail: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 25,
    padding: 8,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  headerSection: {
    marginBottom: 24,
  },
  category: {
    fontSize: 14,
    fontWeight: 'bold',
    color: MayanColors.jade,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 6,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  explicacionBox: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  explicacionTexto: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  advertenciaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  advertenciaTexto: {
    color: '#D32F2F',
    marginLeft: 8,
    fontWeight: 'bold',
    flex: 1,
  },
  tipCultural: {
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  offlineText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagAvoid: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  tagTextAvoid: {
    color: '#D32F2F',
  },
  fraseBox: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 16,
  },
  fraseEs: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fraseTrans: {
    fontSize: 16,
    marginBottom: 4,
  },
  fraseFonetica: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  feedbackSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  feedbackTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 32,
  },
  feedbackBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBtnPressed: {
    opacity: 0.5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
