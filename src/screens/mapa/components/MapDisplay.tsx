import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export function MapDisplay() {
  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 23.6345,
          longitude: -102.5528,
          latitudeDelta: 15.0,
          longitudeDelta: 15.0,
        }}
      >
        <Marker coordinate={{ latitude: 19.4326, longitude: -99.1332 }} title="Mexico City" pinColor="red" />
        <Marker coordinate={{ latitude: 20.6597, longitude: -103.3500 }} title="Guadalajara" pinColor="red" />
        <Marker coordinate={{ latitude: 25.6866, longitude: -100.3161 }} title="Monterrey" pinColor="red" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e1e4e8',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
