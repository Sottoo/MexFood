import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { Colors, MayanColors } from '@/src/constants/theme';
import { Card } from '@/src/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/src/screens/home/components/Header';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t } = useTranslation();
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
            {t('home.sections.official_services')}
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.translator.title')}
              description={t('home.cards.translator.description')}
              icon="g-translate"
              color="#FF9800"
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.map.title')}
              description={t('home.cards.map.description')}
              icon="map"
              color="#42A5F5"
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.lineup.title')}
              description={t('home.cards.lineup.description')}
              icon="security"
              color={MayanColors.jade}
            />
          </View>
          <View style={styles.cardWrapper}>
            <Card
              title={t('home.cards.profile.title')}
              description={t('home.cards.profile.description')}
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
    width: '48.5%',
    marginBottom: 16,
  },
});
