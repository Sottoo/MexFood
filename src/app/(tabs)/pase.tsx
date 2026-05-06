import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Alert,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, MayanColors } from '@/src/constants/theme';
import { usePerfil } from '@/src/lib/hooks';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TICKET_WIDTH = SCREEN_WIDTH - 32;
const TICKET_HEIGHT = 260;

function Ticket3D({ perfil, theme, isDark, t }: any) {

  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 20 });

  const animatedTicketStyle = useAnimatedStyle(() => {


    const pitch = rotation.sensor.value.pitch;
    const roll = rotation.sensor.value.roll;

    const rotateX = interpolate(pitch, [-Math.PI / 2, Math.PI / 2], [30, -30], Extrapolation.CLAMP);
    const rotateY = interpolate(roll, [-Math.PI, Math.PI], [-40, 40], Extrapolation.CLAMP);

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: withSpring(`${rotateX}deg`, { damping: 20, stiffness: 90 }) },
        { rotateY: withSpring(`${rotateY}deg`, { damping: 20, stiffness: 90 }) },
      ],
    };
  });

  const animatedSheenStyle = useAnimatedStyle(() => {
    const roll = rotation.sensor.value.roll;

    const translateX = interpolate(roll, [-Math.PI / 4, Math.PI / 4], [-TICKET_WIDTH, TICKET_WIDTH], Extrapolation.CLAMP);

    return {
      transform: [
        { translateX: withSpring(translateX, { damping: 30, stiffness: 120 }) },
        { skewX: '-20deg' }
      ],
    };
  });

  let dietLabel = t('pass.diet_labels.standard', 'ESTÁNDAR');
  if (perfil?.dieta?.vegano) dietLabel = t('pass.diet_labels.vegan', 'VEGANO');
  else if (perfil?.dieta?.vegetariano) dietLabel = t('pass.diet_labels.vegetarian', 'VEGETARIANO');
  else if (perfil?.dieta?.keto) dietLabel = t('pass.diet_labels.keto', 'KETO');

  const spiceKey = perfil?.toleranciaPicante || 'medio';
  const spiceLabelMap: Record<string, string> = { bajo: 'BAJO', medio: 'MEDIO', alto: 'ALTO' };
  const spiceLevel = spiceLabelMap[spiceKey] || spiceKey.toUpperCase();
  const isSpiceHot = spiceKey === 'alto';

  const pais = perfil?.paisOrigen?.toLowerCase() || 'mx';
  const flagUrl = pais !== 'other' ? `https://flagcdn.com/w80/${pais}.png` : null;

  const restrictions: string[] = [];
  if (perfil?.restricciones?.sinGluten) restrictions.push(t('pass.restrictions_labels.no_gluten', 'SIN GLUTEN'));
  if (perfil?.restricciones?.sinLacteos) restrictions.push(t('pass.restrictions_labels.no_dairy', 'SIN LÁCTEOS'));
  if (perfil?.evitaCerdo) restrictions.push(t('pass.restrictions_labels.no_pork', 'SIN CERDO'));
  if (perfil?.evitaMariscos) restrictions.push(t('pass.restrictions_labels.no_seafood', 'SIN MARISCOS'));
  if (perfil?.evitaAlcohol) restrictions.push(t('pass.restrictions_labels.no_alcohol', 'SIN ALCOHOL'));
  if (perfil?.estomagoSensible) restrictions.push(t('pass.restrictions_labels.sensitive', 'SENSITIVO'));

  const avoidItems = [
    ...(perfil?.alergias || []),
    ...(perfil?.ingredientesEvitar || []),
  ];

  return (
    <View style={styles.ticketWrapper}>
      <Animated.View style={[styles.ticketContainer, animatedTicketStyle]}>

        <View style={[styles.ticketBackground, { backgroundColor: isDark ? '#1C221F' : '#FAFAFA' }]}>
          <LinearGradient
            colors={isDark ? ['#1A2420', '#151A18'] : ['#FFFFFF', '#F0F5F2']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.ticketMain}>

            <View style={styles.ticketHeader}>
              <View style={styles.logoBox}>
                <Ionicons name="fast-food" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titleTop, { color: isDark ? '#8C968F' : '#9E9E9E' }]} numberOfLines={1} adjustsFontSizeToFit>MEXFOOD · FIFA 2026</Text>
                <Text style={[styles.titleMain, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]} numberOfLines={1} adjustsFontSizeToFit>{t('pass.ticket.title_main', 'PASE DE AFICIONADO')}</Text>
              </View>
              {flagUrl ? (
                <Image source={{ uri: flagUrl }} style={styles.ticketFlag} />
              ) : (
                <Text style={{ fontSize: 22 }}>🌍</Text>
              )}
            </View>

            <View style={styles.ticketDataGrid}>
              <View style={[styles.dataCol, { flex: 5 }]}>
                <Text style={styles.dataLabel} numberOfLines={1}>{t('pass.ticket.diet', 'DIETA')}</Text>
                <Text style={[styles.dataValue, { color: MayanColors.jade }]} numberOfLines={1} adjustsFontSizeToFit>{dietLabel}</Text>
              </View>
              <View style={[styles.dataCol, { flex: 4 }]}>
                <Text style={styles.dataLabel} numberOfLines={1}>{t('pass.ticket.spice', 'PICANTE')}</Text>
                <View style={styles.spiceRow}>
                  <Text style={[styles.dataValue, { color: isSpiceHot ? MayanColors.terracotta : MayanColors.mayanBlue }]} numberOfLines={1} adjustsFontSizeToFit>
                    {spiceLevel}
                  </Text>
                  <Ionicons name="flame" size={14} color={isSpiceHot ? MayanColors.terracotta : MayanColors.mayanBlue} />
                </View>
              </View>
              <View style={[styles.dataCol, { flex: 3 }]}>
                <Text style={styles.dataLabel} numberOfLines={1}>{t('pass.ticket.language', 'IDIOMA')}</Text>
                <Text style={[styles.dataValue, { color: MayanColors.gold }]} numberOfLines={1} adjustsFontSizeToFit>
                  {perfil?.idioma === 'en' ? 'ENG' : 'ESP'}
                </Text>
              </View>
            </View>

            <View style={styles.tagsArea}>
              <Text style={styles.dataLabel}>{t('pass.ticket.restrictions', 'RESTRICCIONES')}</Text>
              <View style={styles.tagsRow}>
                {restrictions.length > 0 ? (
                  restrictions.map((r, i) => (
                    <View key={i} style={[styles.microTag, { backgroundColor: isDark ? '#2D3631' : '#E8F0EC' }]}>
                      <Text style={[styles.microTagText, { color: isDark ? '#B4C2BB' : '#5C6E64' }]} numberOfLines={1}>{r}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.dataValueSmall, { color: isDark ? '#666' : '#999' }]}>{t('pass.restrictions.none', 'NINGUNA')}</Text>
                )}
              </View>
            </View>

            <View style={styles.allergiesArea}>
              <Text style={styles.dataLabel}>{t('pass.ticket.allergies', 'ALERGIAS / EVITAR')}</Text>
              <Text
                style={[styles.allergiesText, { color: avoidItems.length > 0 ? MayanColors.terracotta : (isDark ? '#666' : '#999') }]}
                numberOfLines={1}
              >
                {avoidItems.length > 0 ? avoidItems.join(' · ').toUpperCase() : 'NINGUNA'}
              </Text>
            </View>
          </View>

          <View style={styles.perforationLine}>
            <View style={[styles.notchTop, { backgroundColor: theme.background }]} />
            <View style={styles.dashedLine}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={[styles.dash, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
              ))}
            </View>
            <View style={[styles.notchBottom, { backgroundColor: theme.background }]} />
          </View>

          <View style={styles.ticketStub}>
            <View style={styles.stubContent}>

              <View style={styles.stubItem}>
                <Text style={styles.dataLabel} numberOfLines={1}>ORIGEN</Text>
                <View style={styles.stubOriginRow}>
                  {flagUrl ? (
                    <Image source={{ uri: flagUrl }} style={styles.stubFlagMini} />
                  ) : (
                    <Text style={{ fontSize: 14 }}>🌍</Text>
                  )}
                  <Text style={[styles.stubValue, { color: isDark ? '#FFF' : '#1A1A1A' }]} numberOfLines={1}>
                    {pais.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.stubItem}>
                <Text style={styles.dataLabel} numberOfLines={1}>{t('pass.ticket.venue', 'SEDE')}</Text>
                <View style={styles.stubVenueRow}>
                  <Ionicons name="location" size={14} color={MayanColors.jade} style={{ marginRight: 4 }} />
                  <Text style={[styles.stubValue, { color: isDark ? '#FFF' : '#1A1A1A', flex: 1 }]} numberOfLines={2} adjustsFontSizeToFit>
                    {perfil?.estadoActual ? perfil.estadoActual.toUpperCase() : 'MX-26'}
                  </Text>
                </View>
              </View>

              <View style={[styles.qrCodeBox, { borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                <Ionicons name="qr-code" size={34} color={isDark ? '#4A5C52' : '#B8C9BF'} />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.sheen, animatedSheenStyle]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

        </View>
      </Animated.View>
    </View>
  );
}

function SettingsItem({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  theme,
  isDark,
  danger = false,
}: any) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: isDark ? '#2A2D2C' : '#f0f0f0' }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !rightElement}
    >
      <View
        style={[
          styles.settingsIconBox,
          {
            backgroundColor: danger
              ? isDark ? '#3A1E1E' : '#FFE5E5'
              : isDark
                ? '#2A2D2C'
                : '#F5F5F5',
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? MayanColors.terracotta : MayanColors.jade}
        />
      </View>
      <View style={styles.settingsTextBox}>
        <Text
          style={[
            styles.settingsLabel,
            { color: danger ? MayanColors.terracotta : theme.text },
          ]}
        >
          {label}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsSubtitle, { color: theme.icon }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement ?? (
        onPress ? (
          <Ionicons name="chevron-forward" size={18} color={theme.icon} />
        ) : null
      )}
    </TouchableOpacity>
  );
}

export default function PaseScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { perfil, actualizar, borrar } = usePerfil();

  const [notificaciones, setNotificaciones] = useState(true);
  const [modoOscuroManual, setModoOscuroManual] = useState(false);

  const handleLanguageToggle = useCallback(() => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    if (perfil) {
      actualizar({ idioma: newLang as 'es' | 'en' });
    }
  }, [i18n, perfil, actualizar]);

  const handleSpiceChange = useCallback(() => {
    if (!perfil) return;
    const levels: ('bajo' | 'medio' | 'alto')[] = ['bajo', 'medio', 'alto'];
    const currentIdx = levels.indexOf(perfil.toleranciaPicante);
    const nextIdx = (currentIdx + 1) % levels.length;
    actualizar({ toleranciaPicante: levels[nextIdx] });
  }, [perfil, actualizar]);

  const handleDietChange = useCallback(() => {
    if (!perfil) return;

    const options = [
      { id: 'standard', label: t('pass.diet_labels.standard', 'ESTÁNDAR') },
      { id: 'vegan', label: t('pass.diet_labels.vegan', 'VEGANO') },
      { id: 'vegetarian', label: t('pass.diet_labels.vegetarian', 'VEGETARIANO') },
      { id: 'keto', label: t('pass.diet_labels.keto', 'KETO') },
    ];

    Alert.alert(
      t('pass.change_diet_title', 'Cambiar Dieta'),
      t('pass.change_diet_msg', 'Selecciona tu preferencia:'),
      options.map(opt => ({
        text: opt.label,
        onPress: () => {
          actualizar({
            dieta: {
              vegano: opt.id === 'vegan',
              vegetariano: opt.id === 'vegetarian' || opt.id === 'vegan',
              pescetariano: false,
              keto: opt.id === 'keto',
            }
          });
        }
      })).concat([{ text: t('pass.cancel', 'Cancelar'), style: 'cancel' }] as any)
    );
  }, [perfil, actualizar, t]);

  const handleCountryChange = useCallback(() => {
    if (!perfil) return;

    const countries = [
      { id: 'mx', label: 'México', icon: '🇲🇽' },
      { id: 'us', label: 'USA', icon: '🇺🇸' },
      { id: 'ca', label: 'Canada', icon: '🇨🇦' },
      { id: 'br', label: 'Brasil', icon: '🇧🇷' },
      { id: 'fr', label: 'France', icon: '🇫🇷' },
      { id: 'de', label: 'Germany', icon: '🇩🇪' },
      { id: 'ar', label: 'Argentina', icon: '🇦🇷' },
      { id: 'jp', label: 'Japan', icon: '🇯🇵' },
    ];

    Alert.alert(
      t('pass.change_country_title', 'Cambiar Origen'),
      t('pass.change_country_msg', 'Selecciona tu país:'),
      countries.map(c => ({
        text: `${c.icon} ${c.label}`,
        onPress: () => actualizar({ paisOrigen: c.id })
      })).concat([{ text: t('pass.cancel', 'Cancelar'), style: 'cancel' }] as any)
    );
  }, [perfil, actualizar, t]);

  const handleEditProfile = useCallback(() => {
    router.push('/questionnaire');
  }, [router]);

  const handleDeleteProfile = useCallback(() => {
    Alert.alert(
      t('pass.delete_title', '¿Borrar perfil?'),
      t('pass.delete_message', 'Se eliminarán todas tus preferencias y deberás llenar el cuestionario de nuevo.'),
      [
        { text: t('pass.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('pass.delete_confirm', 'Borrar'),
          style: 'destructive',
          onPress: async () => {
            await borrar();
            router.replace('/');
          },
        },
      ]
    );
  }, [borrar, router, t]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('pass.title', 'Mi Pase')}
        </Text>
        <TouchableOpacity style={styles.headerEditBtn} onPress={handleEditProfile}>
          <Text style={[styles.headerEditBtnText, { color: MayanColors.jade }]}>{t('pass.edit_button', 'Editar')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.gyroContainer}>
          <Ticket3D perfil={perfil} theme={theme} isDark={isDark} t={t} />
        </View>

        <View style={styles.settingsContainer}>
          <Text style={[styles.settingsSectionTitle, { color: theme.icon }]}>{t('pass.section_preferences', 'MIS PREFERENCIAS')}</Text>
          <View style={[styles.settingsSectionCard, { backgroundColor: isDark ? '#222524' : '#fff', borderColor: isDark ? '#2A2D2C' : '#f0f0f0', marginBottom: 24 }]}>
            <SettingsItem
              icon="restaurant-outline"
              label={t('pass.diet', 'Dieta')}
              subtitle={
                perfil?.dieta?.vegano ? t('pass.diet_labels.vegan', 'VEGANO') :
                  perfil?.dieta?.vegetariano ? t('pass.diet_labels.vegetarian', 'VEGETARIANO') :
                    perfil?.dieta?.keto ? t('pass.diet_labels.keto', 'KETO') :
                      t('pass.diet_labels.standard', 'ESTÁNDAR')
              }
              onPress={handleDietChange}
              theme={theme}
              isDark={isDark}
            />
            <SettingsItem
              icon="flame-outline"
              label={t('pass.spice', 'Tolerancia al Picante')}
              subtitle={t(`pass.spice_labels.${perfil?.toleranciaPicante || 'medio'}`, (perfil?.toleranciaPicante || 'MEDIO').toUpperCase())}
              onPress={handleSpiceChange}
              theme={theme}
              isDark={isDark}
            />
            <SettingsItem
              icon="flag-outline"
              label={t('pass.origin', 'País de Origen')}
              subtitle={perfil?.paisOrigen?.toUpperCase() || 'MX'}
              onPress={handleCountryChange}
              theme={theme}
              isDark={isDark}
            />
          </View>

          <Text style={[styles.settingsSectionTitle, { color: theme.icon }]}>{t('pass.section_config', 'CONFIGURACIÓN')}</Text>
          <View style={[styles.settingsSectionCard, { backgroundColor: isDark ? '#222524' : '#fff', borderColor: isDark ? '#2A2D2C' : '#f0f0f0' }]}>

            <SettingsItem
              icon="language-outline"
              label={t('pass.language', 'Idioma')}
              subtitle={i18n.language === 'es' ? 'Español' : 'English'}
              onPress={handleLanguageToggle}
              theme={theme}
              isDark={isDark}
            />

            <SettingsItem
              icon="notifications-outline"
              label={t('pass.notifications', 'Notificaciones')}
              theme={theme}
              isDark={isDark}
              rightElement={
                <Switch
                  value={notificaciones}
                  onValueChange={setNotificaciones}
                  trackColor={{ false: '#ccc', true: MayanColors.jade + '66' }}
                  thumbColor={notificaciones ? MayanColors.jade : '#f4f3f4'}
                />
              }
            />
          </View>

          <Text style={[styles.settingsSectionTitle, { color: theme.icon, marginTop: 24 }]}>ACERCA DE</Text>
          <View style={[styles.settingsSectionCard, { backgroundColor: isDark ? '#222524' : '#fff', borderColor: isDark ? '#2A2D2C' : '#f0f0f0' }]}>
            <SettingsItem
              icon="shield-checkmark-outline"
              label={t('pass.privacy', 'Privacidad')}
              onPress={() => Alert.alert(t('pass.privacy_alert_title', 'Privacidad'), t('pass.privacy_alert_body', 'Tus datos son locales y seguros.'))}
              theme={theme}
              isDark={isDark}
            />
            <SettingsItem
              icon="trash-outline"
              label={t('pass.delete_profile', 'Borrar mi perfil')}
              onPress={handleDeleteProfile}
              theme={theme}
              isDark={isDark}
              danger
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.icon }]}>MexFood © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: MayanColors.jade + '1A',
    borderRadius: 20,
  },
  headerEditBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },

  gyroContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    zIndex: 10,
  },
  gyroHint: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  ticketWrapper: {
    width: TICKET_WIDTH,
    height: TICKET_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketContainer: {
    width: TICKET_WIDTH,
    height: TICKET_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
  },

  ticketBackground: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TICKET_WIDTH * 1.5,
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  },

  ticketMain: {
    flex: 3,
    padding: 18,
    justifyContent: 'space-between',
  },
  perforationLine: {
    width: 20,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  ticketStub: {
    flex: 1.2,
    padding: 16,
    paddingLeft: 0,
    borderLeftWidth: 0,
  },

  notchTop: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  notchBottom: {
    width: 24,
    height: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: -1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  dashedLine: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: 1,
  },
  dash: {
    width: 2,
    height: 6,
    borderRadius: 1,
  },

  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: MayanColors.jade,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketFlag: {
    width: 30,
    height: 22,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  titleTop: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  titleMain: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  ticketDataGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  dataCol: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#888',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dataValueSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  spiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  tagsArea: {
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  microTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  microTagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  allergiesArea: {
  },
  allergiesText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  stubContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 10,
  },
  stubItem: {
    marginBottom: 6,
  },
  stubOriginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  stubFlagMini: {
    width: 20,
    height: 14,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  stubVenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  stubValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qrCodeBox: {
    alignSelf: 'center',
    marginTop: 'auto',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  settingsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsSectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  settingsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTextBox: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
