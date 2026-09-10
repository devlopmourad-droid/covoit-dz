import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { myBookings } from '../api/bookings';
import { Booking } from '../types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: '#B8860B' },
  confirmed: { label: 'Confirmée', color: '#0B6E4F' },
  ongoing: { label: 'En cours', color: '#1565C0' },
  completed: { label: 'Terminée', color: '#666' },
  cancelled_by_renter: { label: 'Annulée', color: '#B00020' },
  cancelled_by_owner: { label: 'Annulée par le propriétaire', color: '#B00020' },
  rejected: { label: 'Refusée', color: '#B00020' },
  disputed: { label: 'Litige en cours', color: '#B00020' },
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBookings(await myBookings('renter'));
    } catch {
      // silencieux : on affiche juste la liste vide, pas idéal pour une
      // vraie prod (il faudrait un état d'erreur dédié) mais suffisant ici
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B6E4F" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={bookings}
      keyExtractor={(b) => b.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucune réservation pour l'instant.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const status = STATUS_LABELS[item.status] || { label: item.status, color: '#666' };
        return (
          <View style={styles.card}>
            <Text style={styles.title}>{item.vehicle.brand} {item.vehicle.model}</Text>
            <Text style={styles.dates}>
              {new Date(item.startAt).toLocaleDateString('fr-DZ')} → {new Date(item.endAt).toLocaleDateString('fr-DZ')}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.total}>{item.totalAmount} DZD</Text>
              <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#888' },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 12, elevation: 1 },
  title: { fontSize: 16, fontWeight: '600' },
  dates: { color: '#666', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  total: { fontWeight: '700' },
  status: { fontWeight: '600' },
});
