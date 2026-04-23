import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch } from 'react-native';
import { Colors, MayanColors } from '@/src/constants/theme';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapHeader } from '@/src/screens/mapa/components/MapHeader';
import { SectionCard } from '@/src/screens/mapa/components/SectionCard';
import { MapDisplay } from '@/src/screens/mapa/components/MapDisplay';
import { Button } from '@/src/components/Button';

export default function MapaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { t, i18n } = useTranslation();

  const [spicyTolerance, setSpicyTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [sensitiveStomach, setSensitiveStomach] = useState(false);
  const [favorites, setFavorites] = useState('');
  const [avoid, setAvoid] = useState('');

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#e5e2db' : '#2b2626';
  const inputBgColor = isDark ? '#3a3c3a' : '#ffffff';

  const CustomTextInput = ({ placeholder, value, onChangeText }: any) => (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: inputBgColor,
          color: textColor,
          borderColor: isDark ? '#444' : '#e0e0e0'
        }
      ]}
      placeholder={placeholder}
      placeholderTextColor={isDark ? '#8c968f' : '#999'}
      value={value}
      onChangeText={onChangeText}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MapHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Idioma Card */}
        <SectionCard title={t('map_screen.language.title', 'Idioma')}>
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: i18n.language?.startsWith('es') ? MayanColors.obsidian : (isDark ? '#3a3c3a' : '#e0e0e0') }]}
              onPress={() => i18n.changeLanguage('es')}
            >
              <Text style={[styles.langText, { color: i18n.language?.startsWith('es') ? '#fff' : (isDark ? '#aaa' : '#555') }]}>
                {t('map_screen.language.es', 'ES')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: i18n.language?.startsWith('en') ? MayanColors.obsidian : (isDark ? '#3a3c3a' : '#e0e0e0') }]}
              onPress={() => i18n.changeLanguage('en')}
            >
              <Text style={[styles.langText, { color: i18n.language?.startsWith('en') ? '#fff' : (isDark ? '#aaa' : '#555') }]}>
                {t('map_screen.language.en', 'EN')}
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* Mapa Card */}
        <SectionCard title={t('map_screen.map.title', 'Mapa y geolocalizacion')}>
          <Button
            title={t('map_screen.map.use_location', 'Usar mi ubicacion')}
            onPress={() => { }}
            style={styles.mapButton}
            textStyle={{ fontSize: 16 }}
          />
          <MapDisplay />
        </SectionCard>

        {/* Perfil Card */}
        <SectionCard title={t('map_screen.profile.title', 'Perfil para recomendacion')}>
          <CustomTextInput
            placeholder={t('map_screen.profile.favorites', 'Favoritos (coma separada)')}
            value={favorites}
            onChangeText={setFavorites}
          />
          <CustomTextInput
            placeholder={t('map_screen.profile.avoid', 'Ingredientes a evitar (coma separada)')}
            value={avoid}
            onChangeText={setAvoid}
          />

          <Text style={[styles.spicyTitle, { color: textColor }]}>{t('map_screen.profile.spicy', 'Tolerancia al picante')}</Text>
          <View style={styles.spicyRow}>
            {(['low', 'medium', 'high'] as const).map((level) => {
              const isSelected = spicyTolerance === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.spicyBtn,
                    {
                      backgroundColor: isSelected ? MayanColors.jadeDark : 'transparent',
                      borderColor: isSelected ? MayanColors.jadeDark : (isDark ? '#555' : '#ccc')
                    }
                  ]}
                  onPress={() => setSpicyTolerance(level)}
                >
                  <Text style={[
                    styles.spicyText,
                    { color: isSelected ? '#fff' : (isDark ? '#ccc' : '#555') }
                  ]}>
                    {t(`map_screen.profile.spicy_${level}`, level)}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: textColor }]}>{t('map_screen.profile.sensitive', 'Estomago sensible...')}</Text>
            <Switch
              trackColor={{ false: isDark ? '#555' : '#ccc', true: MayanColors.jadeLight }}
              thumbColor={sensitiveStomach ? MayanColors.jade : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={setSensitiveStomach}
              value={sensitiveStomach}
            />
          </View>
        </SectionCard>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  langText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mapButton: {
    marginBottom: 16,
    borderRadius: 8,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  spicyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  spicyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  spicyBtn: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  spicyText: {
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
});
