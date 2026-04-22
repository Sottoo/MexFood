import React from 'react';
import { View, Text, StyleSheet, Image, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Colors, MayanColors } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const handleStart = () => {
    // Navigate to home screen and prevent going back
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/LogoApp.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Text Section */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('welcome.title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Action Section */}
        <View style={styles.actionContainer}>
          <Button
            title={t('welcome.start_button')}
            onPress={handleStart}
            style={styles.button}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  logoContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 45,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  actionContainer: {
    flex: 0.5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    width: '100%',
  },
});
