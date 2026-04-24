import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/Button';
import { Colors, MayanColors } from '@/src/constants/theme';
import { usePerfil } from '@/src/lib/hooks';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Chip Component with Emoji support for fun and fast interaction
const Chip = ({ label, icon, selected, onPress, theme, isDark, large = false }: any) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        large && styles.chipLarge,
        {
          borderColor: selected ? MayanColors.jade : (isDark ? '#444' : '#e0e0e0'),
          backgroundColor: selected ? MayanColors.jade : (isDark ? '#2a2a2a' : '#ffffff'),
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Text style={[styles.chipIcon, large && styles.chipIconLarge]}>
          {icon}
        </Text>
      )}
      <Text style={[
        styles.chipText,
        large && styles.chipTextLarge,
        { color: selected ? '#ffffff' : theme.text }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Dynamic Tag Input
const TagInput = ({ tags, setTags, placeholder, addLabel, hint, theme, isDark, commonTags = [] }: any) => {
  const [text, setText] = useState('');

  const addTag = (newTag: string) => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setText('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t: string) => t !== tag));
  }

  return (
    <View style={styles.tagInputContainer}>
      <Text style={[styles.description, { color: theme.icon }]}>
        {hint}
      </Text>
      
      <View style={styles.selectedTagsContainer}>
        {tags.map((tag: string) => (
          <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={[styles.tag, { backgroundColor: MayanColors.jade }]}>
            <Text style={styles.tagText}>{tag}</Text>
            <Ionicons name="close-circle" size={16} color="#fff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput 
          style={[styles.input, { flex: 1, borderColor: isDark ? '#444' : '#e0e0e0', color: theme.text, backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => addTag(text)}
          placeholder={placeholder}
          placeholderTextColor={theme.icon}
        />
        <TouchableOpacity onPress={() => addTag(text)} style={[styles.addButton, { backgroundColor: isDark ? '#444' : '#e0e0e0' }]}>
          <Ionicons name="add" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {commonTags.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsList}>
            {commonTags.map((tag: string) => {
              if (tags.includes(tag)) return null;
              return (
                <TouchableOpacity key={tag} onPress={() => addTag(tag)} style={[styles.suggestionTag, { borderColor: theme.icon }]}>
                  <Text style={[styles.suggestionText, { color: theme.text }]}>+ {tag}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}
    </View>
  )
}

// Spice Level Selector based on mockup
const SpiceSelector = ({ value, onChange, theme, isDark, t }: any) => {
  const labels = [
    t('questionnaire.spicy_level_1', 'Nada de picante'),
    t('questionnaire.spicy_level_2', 'Un toque'),
    t('questionnaire.spicy_level_3', 'Pique Auténtico'),
    t('questionnaire.spicy_level_4', 'Muy Picante'),
    t('questionnaire.spicy_level_5', 'Fuego Extremo')
  ];

  return (
    <View style={styles.spiceContainer}>
      <View style={styles.flameRow}>
        {[1,2,3,4,5].map(level => {
          const isActive = level <= value;
          return (
            <TouchableOpacity 
              key={level} 
              onPress={() => onChange(level)}
              style={[
                styles.flameBox,
                isActive ? styles.flameBoxActive : styles.flameBoxInactive
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isActive ? "flame" : "flame-outline"} 
                size={32} 
                color={isActive ? "#fff" : "#9e9e9e"} 
              />
            </TouchableOpacity>
          )
        })}
      </View>
      <Text style={[styles.spiceLabel, { color: theme.text }]}>
        {labels[value - 1]}
      </Text>
    </View>
  )
}


export default function QuestionnaireScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { actualizar } = usePerfil();

  // Questionnaire States
  const [step, setStep] = useState(0);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [diet, setDiet] = useState('none');
  const [consumes, setConsumes] = useState<string[]>(['dairy', 'meat', 'gluten', 'seafood']);
  const [spicyLevel, setSpicyLevel] = useState(3);
  const [cultural, setCultural] = useState<string[]>([]);
  const [avoid, setAvoid] = useState<string[]>([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 6;

  // Options Definitions
  const dietOptions = [
    { id: 'none', label: t('questionnaire.diet_options.none', 'Ninguna'), icon: '🍽️' },
    { id: 'vegan', label: t('questionnaire.diet_options.vegan', 'Vegana'), icon: '🥗' },
    { id: 'vegetarian', label: t('questionnaire.diet_options.vegetarian', 'Vegetariana'), icon: '🥦' },
    { id: 'keto', label: t('questionnaire.diet_options.keto', 'Keto'), icon: '🥑' },
  ];

  const ingredientOptions = [
    { id: 'dairy', label: t('questionnaire.ingredients_options.dairy', 'Lácteos'), icon: '🥛' },
    { id: 'meat', label: t('questionnaire.ingredients_options.meat', 'Carne'), icon: '🥩' },
    { id: 'gluten', label: t('questionnaire.ingredients_options.gluten', 'Gluten'), icon: '🥖' },
    { id: 'seafood', label: t('questionnaire.ingredients_options.seafood', 'Mariscos'), icon: '🦐' },
  ];

  const commonAllergies = [
    t('questionnaire.allergies_common_peanuts', 'Cacahuate'),
    t('questionnaire.allergies_common_soy', 'Soya'),
    t('questionnaire.allergies_common_egg', 'Huevo'),
    t('questionnaire.allergies_common_sesame', 'Ajonjolí')
  ];

  const animateTransition = (nextStep: number, direction: 'forward' | 'backward') => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'forward' ? -30 : 30,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction === 'forward' ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      animateTransition(step + 1, 'forward');
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1, 'backward');
    } else {
      router.replace('/');
    }
  };

  const toggleConsume = (item: string) => {
    if (consumes.includes(item)) {
      setConsumes(consumes.filter(i => i !== item));
    } else {
      setConsumes([...consumes, item]);
    }
  };

  const handleFinish = async () => {
    const isVegetarian = diet === 'vegetarian';
    const isVegan = diet === 'vegan';
    
    const sinLacteos = !consumes.includes('dairy');
    const sinGluten = !consumes.includes('gluten');
    const evitaMariscos = !consumes.includes('seafood');
    const evitaCarne = !consumes.includes('meat');

    // Map 1-5 to bajo, medio, alto
    let toleranciaPicante = 'medio';
    if (spicyLevel <= 2) toleranciaPicante = 'bajo';
    else if (spicyLevel >= 4) toleranciaPicante = 'alto';

    await actualizar({
      alergias: allergies,
      dieta: {
        vegetariano: isVegetarian,
        vegano: isVegan,
        pescetariano: false
      },
      restricciones: {
        sinGluten,
        sinLacteos
      },
      evitaCerdo: evitaCarne,
      evitaMariscos,
      toleranciaPicante: toleranciaPicante as "bajo" | "medio" | "alto",
      ingredientesEvitar: [...avoid, ...cultural],
    });

    router.replace('/(tabs)/home');
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text }]}>
              {t('questionnaire.allergies', '¿Tienes alguna alergia alimentaria?')}
            </Text>
            <TagInput
              tags={allergies}
              setTags={setAllergies}
              placeholder={t('questionnaire.allergies_placeholder', 'Ej: Nuez, Fresa...')}
              hint={t('questionnaire.allergies_hint', 'Escribe y presiona + o Enter para agregar')}
              addLabel={t('questionnaire.allergies_add_button', 'Agregar')}
              theme={theme}
              isDark={isDark}
              commonTags={commonAllergies}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text }]}>
              {t('questionnaire.diet', '¿Sigues alguna dieta en especial?')}
            </Text>
            <Text style={[styles.description, { color: theme.icon }]}>
              Selecciona la que mejor describa tu alimentación diaria.
            </Text>
            <View style={styles.chipGrid}>
              {dietOptions.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={diet === opt.id}
                  onPress={() => setDiet(opt.id)}
                  theme={theme}
                  isDark={isDark}
                  large
                />
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text }]}>
              {t('questionnaire.ingredients', '¿Sueles consumir estos ingredientes?')}
            </Text>
            <Text style={[styles.description, { color: theme.icon }]}>
              Desmarca lo que prefieras evitar para afinar tus recomendaciones.
            </Text>
            <View style={styles.chipGrid}>
              {ingredientOptions.map((opt) => (
                <Chip
                  key={opt.id}
                  label={opt.label}
                  icon={opt.icon}
                  selected={consumes.includes(opt.id)}
                  onPress={() => toggleConsume(opt.id)}
                  theme={theme}
                  isDark={isDark}
                  large
                />
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text, textAlign: 'center' }]}>
              {t('questionnaire.spicy', '¿Cuál es tu nivel de tolerancia al picante?')}
            </Text>
            <Text style={[styles.description, { color: theme.icon, textAlign: 'center', marginBottom: 10 }]}>
              {t('questionnaire.spicy_hint', 'Se honesto. El picante mexicano es otra cosa.')}
            </Text>
            <SpiceSelector 
              value={spicyLevel} 
              onChange={setSpicyLevel} 
              theme={theme} 
              isDark={isDark} 
              t={t}
            />
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text }]}>
              {t('questionnaire.cultural', '¿Tienes restricciones culturales o religiosas?')}
            </Text>
            <TagInput
              tags={cultural}
              setTags={setCultural}
              placeholder={t('questionnaire.cultural_placeholder', 'Ej: Halal, Kosher...')}
              hint={t('questionnaire.allergies_hint', 'Escribe y presiona + o Enter para agregar')}
              addLabel={t('questionnaire.allergies_add_button', 'Agregar')}
              theme={theme}
              isDark={isDark}
            />
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.question, { color: theme.text }]}>
              {t('questionnaire.avoid', 'Casi listos. ¿Algún alimento a evitar?')}
            </Text>
            <TagInput
              tags={avoid}
              setTags={setAvoid}
              placeholder={t('questionnaire.avoid_placeholder', 'Ej: Cebolla, Cilantro...')}
              hint={t('questionnaire.avoid_hint', 'Escribe ingredientes que no soportes y presiona agregar')}
              addLabel={t('questionnaire.allergies_add_button', 'Agregar')}
              theme={theme}
              isDark={isDark}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
        </View>

        <View style={styles.content}>
          <Animated.View style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {renderStepContent()}
          </Animated.View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.backButton, { opacity: step === 0 ? 0.5 : 1 }]} 
            onPress={handleBack}
            disabled={false}
          >
            <Text style={[styles.backText, { color: theme.icon }]}>
              Atrás
            </Text>
          </TouchableOpacity>
          
          <Button
            title={step === totalSteps - 1 ? t('questionnaire.submit', 'Finalizar') : 'Siguiente'}
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: MayanColors.jade,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  animatedContainer: {
    width: '100%',
  },
  stepContainer: {
    width: '100%',
  },
  question: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between', 
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipLarge: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '47%',
    paddingVertical: 20,
    borderRadius: 20,
  },
  chipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  chipIconLarge: {
    fontSize: 36,
    marginRight: 0,
    marginBottom: 12,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chipTextLarge: {
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 24,
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  tagInputContainer: {
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 18,
  },
  addButton: {
    marginLeft: 10,
    padding: 14,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  suggestionTag: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  spiceContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  flameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  flameBox: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameBoxActive: {
    backgroundColor: '#ff6b00',
    borderRadius: 14,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  flameBoxInactive: {
    backgroundColor: 'transparent',
  },
  spiceLabel: {
    fontSize: 22,
    fontWeight: 'bold',
  }
});
