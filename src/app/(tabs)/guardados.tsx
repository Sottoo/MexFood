import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, FlatList } from 'react-native';
import { Colors, MayanColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { usePerfil, useCatalogo, useGuardados } from '@/src/lib/hooks';
import { RecommendationCard } from '@/src/components/RecommendationCard';
import { Header } from '@/src/screens/home/components/Header';
import { calcularMatchScore } from '@core/recomendador';
import { Ionicons } from '@expo/vector-icons';

export default function GuardadosScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { catalogo, cargando: cargandoCatalogo } = useCatalogo();
  const { guardados, cargando: cargandoGuardados } = useGuardados();

  if (cargandoPerfil || cargandoCatalogo || cargandoGuardados) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={MayanColors.jade} />
      </View>
    );
  }

  const savedData = guardados.map(id => {
    const variante = catalogo?.variantes.find(v => v.id === id);
    const platillo = variante ? catalogo?.platillos.find(p => p.id === variante.idPlatillo) : null;
    if (!variante || !platillo || !perfil) return null;
    
    const recomendacion = calcularMatchScore(perfil, variante, platillo);
    return { variante, platillo, recomendacion };
  }).filter(Boolean);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-dislike-outline" size={64} color={theme.icon} />
      <Text style={[styles.emptyText, { color: theme.text }]}>
        {t('saved.empty_title')}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.icon }]}>
        {t('saved.empty_subtitle')}
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      <Header />
      
      <View style={styles.bodyContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart" size={20} color={MayanColors.terracotta} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('tabs.saved')}
          </Text>
        </View>

        {savedData.length === 0 ? (
          renderEmpty()
        ) : (
          <View style={styles.cardsContainer}>
            {savedData.map((item) => (
              <View key={item!.variante.id} style={styles.cardWrapper}>
                <RecommendationCard 
                  recomendacion={item!.recomendacion}
                  platillo={item!.platillo}
                  variante={item!.variante}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyContent: {
    padding: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cardWrapper: {
    marginBottom: 20,
    // No width here, RecommendationCard has fixed width of 240
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
