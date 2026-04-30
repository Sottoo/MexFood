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
const TICKET_HEIGHT = 220; // Horizontal Ticket

// ─────────── 3D Reanimated Ticket Component ───────────
function Ticket3D({ perfil, theme, isDark, t }: any) {
  // Ultra-smooth gyroscope reading
  const rotation = useAnimatedSensor(SensorType.ROTATION, { interval: 20 });

  const animatedTicketStyle = useAnimatedStyle(() => {
    // rotation.sensor.value is a quaternion or euler angles depending on the platform/type
    // For SensorType.ROTATION, pitch is usually [1] and roll is [2]
    const pitch = rotation.sensor.value.pitch;
    const roll = rotation.sensor.value.roll;

    // Limit rotation so it doesn't flip completely
    const rotateX = interpolate(pitch, [-Math.PI/2, Math.PI/2], [30, -30], Extrapolation.CLAMP);
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
    // Move the shiny reflection based on tilt
    const translateX = interpolate(roll, [-Math.PI/4, Math.PI/4], [-TICKET_WIDTH, TICKET_WIDTH], Extrapolation.CLAMP);
    
    return {
      transform: [
        { translateX: withSpring(translateX, { damping: 30, stiffness: 120 }) },
        { skewX: '-20deg' }
      ],
    };
  });

  // Extract Profile Data
  let dietLabel = 'ESTÁNDAR';
  if (perfil?.dieta?.vegano) dietLabel = 'VEGANO';
  else if (perfil?.dieta?.vegetariano) dietLabel = 'VEGETARIANO';
  else if (perfil?.dieta?.keto) dietLabel = 'KETO';

  const spiceLevel = perfil?.toleranciaPicante?.toUpperCase() || 'MEDIO';
  
  const avoidItems = [
    ...(perfil?.alergias || []),
    ...(perfil?.ingredientesEvitar || []),
  ];

  const restrictions: string[] = [];
  if (perfil?.restricciones?.sinGluten) restrictions.push('NO GLUTEN');
  if (perfil?.restricciones?.sinLacteos) restrictions.push('NO LÁCTEOS');
  if (perfil?.evitaCerdo) restrictions.push('NO CERDO');
  if (perfil?.evitaMariscos) restrictions.push('NO MARISCOS');
  if (perfil?.evitaAlcohol) restrictions.push('NO ALCOHOL');
  if (perfil?.estomagoSensible) restrictions.push('SENSITIVO');

  return (
    <View style={styles.ticketWrapper}>
      {/* The Actual Ticket with native shadow */}
      <Animated.View style={[styles.ticketContainer, animatedTicketStyle]}>
        
        {/* Ticket Base Background */}
        <View style={[styles.ticketBackground, { backgroundColor: isDark ? '#1C221F' : '#FAFAFA' }]}>
          <LinearGradient
            colors={isDark ? ['#1A2420', '#151A18'] : ['#FFFFFF', '#F0F5F2']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Left Side: Main Info */}
          <View style={styles.ticketMain}>
            
            {/* Header: Logo and Title */}
            <View style={styles.ticketHeader}>
              <View style={styles.logoBox}>
                <Ionicons name="fast-food" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titleTop, { color: isDark ? '#8C968F' : '#9E9E9E' }]} numberOfLines={1} adjustsFontSizeToFit>MEXFOOD 2026</Text>
                <Text style={[styles.titleMain, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]} numberOfLines={1} adjustsFontSizeToFit>PASE DE AFICIONADO</Text>
              </View>
            </View>

            {/* Content Grid */}
            <View style={styles.ticketDataGrid}>
              
              <View style={styles.dataCol}>
                <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit>DIETA</Text>
                <Text style={[styles.dataValue, { color: MayanColors.jade }]} numberOfLines={1} adjustsFontSizeToFit>{dietLabel}</Text>
              </View>

              <View style={styles.dataCol}>
                <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit>PICANTE</Text>
                <View style={styles.spiceRow}>
                  <Text style={[styles.dataValue, { color: spiceLevel === 'ALTO' ? MayanColors.terracotta : MayanColors.mayanBlue }]} numberOfLines={1} adjustsFontSizeToFit>
                    {spiceLevel}
                  </Text>
                  <Ionicons name="flame" size={14} color={spiceLevel === 'ALTO' ? MayanColors.terracotta : MayanColors.mayanBlue} />
                </View>
              </View>

            </View>

            {/* Restrictions Tags */}
            <View style={styles.tagsArea}>
              <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit>RESTRICCIONES PRINCIPALES</Text>
              <View style={styles.tagsRow}>
                {restrictions.length > 0 ? (
                  restrictions.slice(0, 4).map((r, i) => (
                    <View key={i} style={[styles.microTag, { backgroundColor: isDark ? '#2D3631' : '#E8F0EC' }]}>
                      <Text style={[styles.microTagText, { color: isDark ? '#B4C2BB' : '#5C6E64' }]} numberOfLines={1} adjustsFontSizeToFit>{r}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.dataValueSmall, { color: isDark ? '#666' : '#999' }]} numberOfLines={1} adjustsFontSizeToFit>Ninguna reportada</Text>
                )}
              </View>
            </View>

            {/* Allergies */}
            <View style={styles.allergiesArea}>
              <Text style={styles.dataLabel}>ALERGIAS / EVITAR</Text>
              <Text 
                style={[styles.allergiesText, { color: avoidItems.length > 0 ? MayanColors.terracotta : (isDark ? '#666' : '#999') }]}
                numberOfLines={1}
              >
                {avoidItems.length > 0 ? avoidItems.join(' • ').toUpperCase() : 'NINGUNA'}
              </Text>
            </View>

          </View>

          {/* Perforation Line (Dashed) */}
          <View style={styles.perforationLine}>
            <View style={[styles.notchTop, { backgroundColor: theme.background }]} />
            <View style={styles.dashedLine}>
              {Array.from({ length: 14 }).map((_, i) => (
                <View key={i} style={[styles.dash, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
              ))}
            </View>
            <View style={[styles.notchBottom, { backgroundColor: theme.background }]} />
          </View>

            {/* Right Side: Stub */}
          <View style={styles.ticketStub}>
            <View style={styles.stubContent}>
              
              <View style={styles.stubItem}>
                <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit>SEDE</Text>
                <Text style={[styles.stubValue, { color: isDark ? '#FFF' : '#1A1A1A' }]} numberOfLines={2} adjustsFontSizeToFit>
                  {perfil?.estadoActual ? perfil.estadoActual.toUpperCase() : 'MX-26'}
                </Text>
              </View>
              
              <View style={styles.stubItem}>
                <Text style={styles.dataLabel} numberOfLines={1} adjustsFontSizeToFit>IDIOMA</Text>
                <Text style={[styles.stubValue, { color: isDark ? '#FFF' : '#1A1A1A' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {perfil?.idioma === 'en' ? 'ENG' : 'ESP'}
                </Text>
              </View>

              <View style={styles.qrCodePlaceholder}>
                <Ionicons name="qr-code" size={32} color={isDark ? '#4A5C52' : '#B8C9BF'} />
              </View>
            </View>
          </View>

          {/* Holographic Sheen overlay */}
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

// ─────────── Settings Section Item ───────────
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

// ─────────── Main Screen ───────────
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
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t('pass.title', 'Mi Pase')}
        </Text>
        <TouchableOpacity style={styles.headerEditBtn} onPress={handleEditProfile}>
          <Text style={[styles.headerEditBtnText, { color: MayanColors.jade }]}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 3D Ticket */}
        <View style={styles.gyroContainer}>
          <Ticket3D perfil={perfil} theme={theme} isDark={isDark} t={t} />
        </View>

        {/* Settings */}
        <View style={styles.settingsContainer}>
          <Text style={[styles.settingsSectionTitle, { color: theme.icon }]}>CONFIGURACIÓN</Text>
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
              icon="information-circle-outline"
              label={t('pass.version', 'Versión')}
              subtitle="1.0.0 — MexFood"
              theme={theme}
              isDark={isDark}
            />
            <SettingsItem
              icon="shield-checkmark-outline"
              label={t('pass.privacy', 'Privacidad')}
              onPress={() => Alert.alert('Privacidad', 'Tus datos son locales y seguros.')}
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

// ─────────── Styles ───────────
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

  // Header
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

  // 3D Ticket Container
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

  // Ticket Physics
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

  // Ticket UI
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

  // Ticket Sections
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

  // Perforation Details
  notchTop: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -1, // cover border
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

  // Ticket Content Main
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

  // Data Grid
  ticketDataGrid: {
    flexDirection: 'row',
    gap: 20,
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

  // Tags
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

  // Allergies
  allergiesArea: {
  },
  allergiesText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Ticket Stub
  stubContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  stubItem: {},
  stubValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  qrCodePlaceholder: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    marginBottom: 4,
  },

  // Settings
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

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
