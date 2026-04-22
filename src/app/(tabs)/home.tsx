import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { Colors, MayanColors } from '@/src/constants/theme';
import { Card } from '@/src/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/src/components/Header';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
    >
      <Header />

      <View style={styles.bodyContent}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={20} color={MayanColors.jadeDark} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            SERVICIOS OFICIALES
          </Text>
        </View>

      <View style={styles.gridContainer}>
        <View style={styles.cardWrapper}>
          <Card 
            title="Traductor Cancha" 
            description="Muestra tus alergias al mesero" 
            icon="g-translate" 
            color="#FF9800"
          />
        </View>
        <View style={styles.cardWrapper}>
          <Card 
            title="Mapa de Sedes" 
            description="Zonas fan y restaurantes" 
            icon="map" 
            color="#42A5F5"
          />
        </View>
        <View style={styles.cardWrapper}>
          <Card 
            title="Tu Alineación" 
            description="Platillos guardados listos" 
            icon="security" 
            color={MayanColors.jade}
          />
        </View>
        <View style={styles.cardWrapper}>
          <Card 
            title="Perfil de Fan" 
            description="Configurar intolerancias y dieta" 
            icon="settings" 
            color="#9E9E9E"
          />
        </View>
        </View>
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
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%', // Slightly wider
    marginBottom: 16,
  },
});
