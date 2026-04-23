import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export function MapDisplay() {
  return (
    <View style={styles.mapContainer}>
      <Text style={styles.text}>Mapa interactivo disponible en la aplicación móvil (iOS / Android).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  text: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  }
});
