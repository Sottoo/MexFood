import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, MayanColors } from '@/src/constants/theme';
import { Perfil } from '@core/types';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

interface Props {
  visible: boolean;
  onClose: () => void;
  perfil: Perfil | null;
}

export function TranslatorModal({ visible, onClose, perfil }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  if (!perfil) return null;

  const hasAllergies = perfil.alergias.length > 0;
  const hasAvoid = perfil.ingredientesEvitar.length > 0;
  const hasRestrictions =
    perfil.restricciones.sinGluten ||
    perfil.restricciones.sinLacteos ||
    perfil.evitaCerdo ||
    perfil.evitaMariscos ||
    perfil.evitaAlcohol;

  // Forzamos el idioma a español para que el mesero mexicano lo entienda
  const tES = (key: string, def: string) => t(key, def, { lng: 'es' });

  const renderSection = (title: string, items: string[], icon: any, color: string) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name={icon} size={24} color={color} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.itemsContainer}>
          {items.map((item, idx) => (
            <View key={idx} style={[styles.itemBadge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.itemText, { color: color }]}>{item.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getRestrictionsList = () => {
    const list = [];
    if (perfil.restricciones.sinGluten) list.push(tES('pass.restrictions_labels.no_gluten', 'NO GLUTEN'));
    if (perfil.restricciones.sinLacteos) list.push(tES('pass.restrictions_labels.no_dairy', 'NO LÁCTEOS'));
    if (perfil.evitaCerdo) list.push(tES('pass.restrictions_labels.no_pork', 'NO CERDO'));
    if (perfil.evitaMariscos) list.push(tES('pass.restrictions_labels.no_mariscos', 'NO MARISCOS'));
    if (perfil.evitaAlcohol) list.push(tES('pass.restrictions_labels.no_alcohol', 'NO ALCOHOL'));
    return list;
  };

  const getDietLabel = () => {
    if (perfil.dieta.vegano) return tES('pass.diet_labels.vegan', 'VEGANO');
    if (perfil.dieta.vegetariano) return tES('pass.diet_labels.vegetarian', 'VEGETARIANO');
    if (perfil.dieta.keto) return tES('pass.diet_labels.keto', 'KETO');
    return null;
  };

  const dietLabel = getDietLabel();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={Platform.OS === 'ios' ? 20 : 100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerIndicator} />
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.topInfo}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="google-translate" size={40} color="#fff" />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {tES('home.cards.translator.title', 'Traductor Cancha')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.icon }]}>
                  {tES('home.cards.translator.description', 'Muestra tus alergias al mesero')}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardInstruction}>
                  {tES('translator.instruction', 'Muestra esta pantalla al mesero para comunicar tus necesidades alimentarias.')}
                </Text>

                {dietLabel && (
                  <View style={styles.dietRow}>
                    <Ionicons name="restaurant" size={20} color={MayanColors.jade} />
                    <Text style={[styles.dietText, { color: MayanColors.jade }]}>{dietLabel}</Text>
                  </View>
                )}

                <View style={styles.divider} />

                {renderSection(
                  tES('pass.ticket.allergies', 'ALERGIAS'),
                  perfil.alergias,
                  'alert-octagon',
                  MayanColors.terracotta
                )}

                {renderSection(
                  tES('pass.ticket.restrictions', 'RESTRICCIONES'),
                  getRestrictionsList(),
                  'shield-alert',
                  '#FF9800'
                )}

                {renderSection(
                  tES('pass.ticket.avoid', 'EVITAR'),
                  perfil.ingredientesEvitar,
                  'close-circle',
                  '#9E9E9E'
                )}

                {!hasAllergies && !hasRestrictions && !hasAvoid && !dietLabel && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={48} color={MayanColors.jade} />
                    <Text style={[styles.emptyText, { color: theme.text }]}>
                      {tES('translator.no_restrictions', 'No tienes restricciones registradas.')}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={[styles.finishButton, { backgroundColor: MayanColors.jade }]} onPress={onClose}>
                <Text style={styles.finishButtonText}>{t('pass.cancel', 'Cerrar')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    width: '100%',
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  dietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dietText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  finishButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
