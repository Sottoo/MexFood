import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { MayanColors } from '@/src/constants/theme';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

// Componente para el ícono de la pestaña con la barrita roja
function TabBarIcon({ name, color, focused }: any) {
  return (
    <View style={styles.iconContainer}>
      {focused && <View style={styles.activeIndicator} />}
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: MayanColors.jade,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1c1a' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2a2c2a' : '#f0f0f0',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: (props) => <TabBarIcon name={props.focused ? "trophy" : "trophy-outline"} {...props} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: t('tabs.map'),
          tabBarIcon: (props) => <TabBarIcon name={props.focused ? "map" : "map-outline"} {...props} />,
        }}
      />
      <Tabs.Screen
        name="guardados"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: (props) => <TabBarIcon name={props.focused ? "shield" : "shield-outline"} {...props} />,
        }}
      />
      <Tabs.Screen
        name="pase"
        options={{
          title: t('tabs.pass'),
          tabBarIcon: (props) => <TabBarIcon name={props.focused ? "ticket" : "ticket-outline"} {...props} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: -5,
    width: 32,
    height: 4,
    backgroundColor: '#E32A2A',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});
