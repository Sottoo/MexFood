// Updated RecommendationCard - Fixed Imports
import React from 'react';
import { View, Text, StyleSheet, Image, useColorScheme, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, MayanColors } from '@/src/constants/theme';
import type { Recomendacion, Platillo, Variante } from '@core/types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useGuardados } from '@/src/lib/hooks';

interface Props {
  recomendacion: Recomendacion;
  platillo: Platillo;
  variante: Variante;
}

export function RecommendationCard({ recomendacion, platillo, variante }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const { t } = useTranslation();
  const { esGuardado, conmutarGuardado } = useGuardados();
  const isSaved = esGuardado(variante.id);

  const getBadgeColor = () => {
    switch (recomendacion.color) {
      case 'verde': return MayanColors.jade;
      case 'amarillo': return MayanColors.gold;
      case 'naranja': return MayanColors.terracotta;
      case 'rojo': return '#D32F2F';
      default: return theme.text;
    }
  };

  const getBadgeText = () => {
    switch (recomendacion.color) {
      case 'verde': return t('card_badges.for_you');
      case 'amarillo': return t('card_badges.good_choice');
      case 'naranja': return t('card_badges.caution');
      case 'rojo': return t('card_badges.avoid');
      default: return '';
    }
  };

  const badgeColor = getBadgeColor();
  const badgeText = getBadgeText();

  const renderSpiceLevel = () => {
    const level = variante.nivelPicante;
    const maxFlames = 5;
    let activeFlames = 0;

    switch (level) {
      case 'bajo': activeFlames = 1; break;
      case 'medio': activeFlames = 3; break;
      case 'alto': activeFlames = 5; break;
    }

    const flames = [];
    for (let i = 0; i < maxFlames; i++) {
      flames.push(
        <Ionicons
          key={i}
          name="flame"
          size={14}
          color={i < activeFlames ? MayanColors.gold : '#E0E0E0'}
          style={{ marginRight: 2 }}
        />
      );
    }

    let levelText = 'Ninguno';
    if (level === 'bajo') levelText = 'Bajo';
    if (level === 'medio') levelText = 'Medio';
    if (level === 'alto') levelText = 'Alto';

    return (
      <View style={styles.spiceContainer}>
        {flames}
        <Text style={[styles.spiceText, { color: theme.icon }]}>{levelText}</Text>
      </View>
    );
  };

  const handlePress = () => {
    // Cast as any para evitar el error de tipado estricto de Expo Router con rutas dinámicas
    router.push(`/platillo/${variante.id}` as any);
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.card, { backgroundColor: theme.background, shadowColor: theme.text }]}>
        <View style={styles.imageContainer}>
          {/* Placeholder image since we don't have real images in the backend data yet */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=400' }}
            style={styles.image}
          />

          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Ionicons
                name={recomendacion.color === 'verde' ? 'checkmark-circle-outline' : 'information-circle-outline'}
                size={14}
                color={badgeColor}
              />
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
            </View>
          </View>

          <Pressable
            style={styles.heartButton}
            onPress={(e) => {
              e.stopPropagation();
              conmutarGuardado(variante.id);
            }}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={22}
              color={isSaved ? MayanColors.terracotta : "#fff"}
            />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{platillo.categoria.toUpperCase()}</Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {platillo.nombre}
          </Text>

          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={theme.icon} />
            <Text style={[styles.locationText, { color: theme.icon }]}>
              {platillo.estadoTipico || 'México'}
            </Text>
          </View>

          {renderSpiceLevel()}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    borderRadius: 16,
    marginRight: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    fontWeight: 'bold',
    color: MayanColors.jade,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  spiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spiceText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
