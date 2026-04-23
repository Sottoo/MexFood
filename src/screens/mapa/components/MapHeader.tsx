import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MayanColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function MapHeader() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
      <Text style={styles.title}>{t('map_screen.title', 'MexFood FIFA 2026')}</Text>
      <Text style={styles.subtitle}>{t('map_screen.subtitle', 'Recomendacion para turistas')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0e6947', /* MayanColors.jadeDark roughly based on image matching */
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#e0f2f1',
    fontSize: 14,
    marginTop: 4,
  },
});
