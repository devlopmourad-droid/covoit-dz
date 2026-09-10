import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import { searchVehicles } from '../api/vehicles';
import { VehicleSearchResult } from '../types';

const FUEL_LABELS: Record<string, string> = {
  essence: 'Essence',
  diesel: 'Diesel',
  hybride: 'Hybride',
  electrique: 'Électrique',
  gpl: 'GPL',
};

export default function SearchScreen({ navigation }: any) {
  const [results, setResults] = useState<VehicleSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      // Repli sur Alger si la géolocalisation est refusée : mieux vaut une
      // recherche par défaut utile qu'un écran bloqué.
      let coords = { latitude: 36.7538259, longitude: 3.057841 };
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        coords = pos.coords;
      }
      const data = await searchVehicles({ lat: coords.latitude, lng: coords.longitude, radiusKm: 30 });
      setResults(data);
    } catch (err) {
      setErrorMsg("Impossible de charger les véhicules disponibles. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B6E4F" />
        <Text style={styles.loadingText}>Recherche des véhicules à proximité…</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={results}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={runSearch} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>{errorMsg || 'Aucun véhicule disponible dans cette zone pour le moment.'}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.brand} {item.model} <Text style={styles.year}>({item.year})</Text></Text>
            <Text style={styles.distance}>{item.distanceKm} km</Text>
          </View>
          <Text style={styles.meta}>
            {FUEL_LABELS[item.fuelType] || item.fuelType} · {item.transmission} · {item.seats} places
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>{item.pricePerDay} DZD<Text style={styles.perDay}>/jour</Text></Text>
            {item.instantBooking && <Text style={styles.badge}>Réservation instantanée</Text>}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#666' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 12, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  year: { fontWeight: '400', color: '#888' },
  distance: { color: '#0B6E4F', fontWeight: '600' },
  meta: { color: '#666', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { fontSize: 16, fontWeight: '700' },
  perDay: { fontSize: 12, fontWeight: '400', color: '#888' },
  badge: { fontSize: 11, color: '#0B6E4F', backgroundColor: '#E6F4EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});
