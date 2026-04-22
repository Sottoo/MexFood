import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MayanColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export function Header() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <ImageBackground
      source={require('@/assets/images/patron.png')}
      style={[styles.headerBackground, { paddingTop: insets.top + 20 }]}
      resizeMode="cover"
    >
      {/* Añadimos una capa oscura semitransparente para que el contenido resalte sobre el patrón llamativo */}
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Ionicons name="trophy" size={14} color={MayanColors.gold} />
            <Text style={styles.badgeText}>{t('home.header.badge')}</Text>
          </View>
          <View style={styles.flagContainer}>
            <Text style={styles.flagEmoji}>🇲🇽</Text>
          </View>
        </View>

        <View style={styles.logoRow}>
          <Text style={styles.logoTextSabor}>
            Mex<Text style={styles.logoTextMX}>FOOD</Text>
          </Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('home.header.search_placeholder')}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    width: '100%',
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: MayanColors.jadeDark, // Color de respaldo
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(21, 152, 104, 0.75)', // Capa jade oscura para oscurecer el patrón y mejorar legibilidad de textos blancos
  },
  content: {
    paddingHorizontal: 20,
    zIndex: 1, // Asegura que el contenido esté por encima del overlay
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MayanColors.jade,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  flagEmoji: {
    fontSize: 20,
  },
  logoRow: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  logoTextSabor: {
    fontSize: 42,
    fontWeight: '900', // Extra bold para que se parezca al logo
    color: '#fff',
    letterSpacing: -1,
  },
  logoTextMX: {
    color: MayanColors.gold, // Amarillo/Dorado como en el diseño
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFB300', // Dorado vibrante
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
