import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/theme';
import { useColorScheme } from 'react-native';

export default function MapaScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Mapa de Sedes (En construcción)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
