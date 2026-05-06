import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, MayanColors } from '@/src/constants/theme';
import { Card } from '@/src/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/src/screens/home/components/Header';
import { useTranslation } from 'react-i18next';
import { usePerfil, useCatalogo, useRecomendaciones, useUbicacion } from '../../lib/hooks';
import { RecommendationCard } from '@/src/components/RecommendationCard';
import { TranslatorModal } from '@/src/components/TranslatorModal';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { perfil, cargando: cargandoPerfil } = usePerfil();
  const { catalogo, cargando: cargandoCatalogo } = useCatalogo();
  const { ubicacion } = useUbicacion();
  
  const [translatorVisible, setTranslatorVisible] = React.useState(false);

  // Obtenemos las recomendaciones basadas en perfil y ubicación
  const { recomendados } = useRecomendaciones(
    perfil,
    catalogo,
    { topN: 10, ubicacion }
  );

  const listaRecomendados = recomendados;

  const renderContent = () => {
    if (cargandoPerfil || cargandoCatalogo) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MayanColors.jade} />
          <Text style={{ color: theme.text, marginTop: 10 }}>{t('recommendations.loading')}</Text>
        </View>
      );
    }

    if (!perfil || !catalogo) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.text }}>{t('recommendations.error_loading')}</Text>
        </View>
      );
    }

    return (
      <View style={styles.bodyContent}>
        {/* Recomendaciones Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={20} color={MayanColors.gold} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('recommendations.title')}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          style={styles.horizontalScroll}
        >
          {listaRecomendados.map((rec) => {
            const platillo = catalogo.platillos.find(p => p.id === rec.platilloId);
            const variante = catalogo.variantes.find(v => v.id === rec.varianteId);
            if (!platillo || !variante) return null;
            return (
              <RecommendationCard
                key={rec.varianteId}
                recomendacion={rec}
                platillo={platillo}
                variante={variante}
              />
            );
          })}
        </ScrollView>

        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Ionicons name="trophy" size={20} color={MayanColors.jadeDark} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t('home.sections.official_services')}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.translator.title')}
              description={t('home.cards.translator.description')}
              icon="translate"
              color="#FF9800"
              onPress={() => setTranslatorVisible(true)}
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.map.title')}
              description={t('home.cards.map.description')}
              icon="map"
              color="#42A5F5"
              onPress={() => router.push('/(tabs)/mapa')}
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.lineup.title')}
              description={t('home.cards.lineup.description')}
              icon="security"
              color={MayanColors.jade}
              onPress={() => router.push('/(tabs)/guardados')}
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.profile.title')}
              description={t('home.cards.profile.description')}
              icon="settings"
              color="#9E9E9E"
              onPress={() => router.push('/(tabs)/pase')}
            />
          </View>
        </View>

        <TranslatorModal 
          visible={translatorVisible} 
          onClose={() => setTranslatorVisible(false)} 
          perfil={perfil} 
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      <Header />
      {renderContent()}
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContent: {
    padding: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    marginHorizontal: -16, // Bleed out of the padding
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16, // For shadow
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%',
    marginBottom: 16,
  },
});
