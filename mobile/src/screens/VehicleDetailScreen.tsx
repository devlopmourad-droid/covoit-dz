import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { getVehicle } from '../api/vehicles';
import { createBooking } from '../api/bookings';
import { Vehicle } from '../types';
import { ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function VehicleDetailScreen({ route, navigation }: any) {
  const { vehicleId } = route.params;
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  // Champs de date au format ISO simple (YYYY-MM-DD) — un vrai sélecteur de
  // date (ex. @react-native-community/datetimepicker) serait la prochaine
  // amélioration UX, volontairement pas ajouté ici pour ne pas alourdir les
  // dépendances de ce scaffold.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getVehicle(vehicleId)
      .then(setVehicle)
      .catch(() => Alert.alert('Erreur', 'Impossible de charger ce véhicule.'))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  const onBook = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour réserver ce véhicule.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Dates requises', 'Merci de renseigner une date de départ et de retour (AAAA-MM-JJ).');
      return;
    }
    setBooking(true);
    try {
      const result = await createBooking({
        vehicleId,
        startAt: new Date(`${startDate}T09:00:00Z`).toISOString(),
        endAt: new Date(`${endDate}T09:00:00Z`).toISOString(),
      });
      Alert.alert(
        result.status === 'confirmed' ? 'Réservation confirmée !' : 'Demande envoyée',
        result.status === 'confirmed'
          ? `Total : ${result.totalAmount} DZD + ${result.depositAmount} DZD de caution.`
          : 'Le propriétaire doit confirmer votre demande.',
      );
      navigation.navigate('MyBookings');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Réservation impossible.';
      Alert.alert('Erreur', message);
    } finally {
      setBooking(false);
    }
  };

  if (loading || !vehicle) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B6E4F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoPlaceholderText}>📷 Photos à venir</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{vehicle.brand} {vehicle.model} ({vehicle.year})</Text>
        <Text style={styles.owner}>Proposé par {vehicle.owner.firstName}</Text>

        <View style={styles.specsRow}>
          <Text style={styles.spec}>{vehicle.seats} places</Text>
          <Text style={styles.spec}>{vehicle.fuelType}</Text>
          <Text style={styles.spec}>{vehicle.transmission}</Text>
        </View>

        {vehicle.description ? <Text style={styles.description}>{vehicle.description}</Text> : null}

        {vehicle.features.length > 0 && (
          <View style={styles.featuresRow}>
            {vehicle.features.map((f) => (
              <Text key={f} style={styles.feature}>{f}</Text>
            ))}
          </View>
        )}

        <View style={styles.priceBox}>
          <Text style={styles.price}>{vehicle.pricePerDay} DZD<Text style={styles.perDay}>/jour</Text></Text>
          <Text style={styles.deposit}>Caution : {vehicle.depositAmount} DZD</Text>
        </View>

        <Text style={styles.sectionTitle}>Réserver</Text>
        <TextInput style={styles.input} placeholder="Départ (AAAA-MM-JJ)" value={startDate} onChangeText={setStartDate} />
        <TextInput style={styles.input} placeholder="Retour (AAAA-MM-JJ)" value={endDate} onChangeText={setEndDate} />

        <TouchableOpacity style={styles.button} onPress={onBook} disabled={booking}>
          {booking ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.buttonText}>
              {vehicle.instantBooking ? 'Réserver instantanément' : 'Demander la réservation'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholder: { height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { color: '#999' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700' },
  owner: { color: '#666', marginTop: 4, marginBottom: 12 },
  specsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  spec: { color: '#444', backgroundColor: '#f2f2f2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  description: { color: '#333', marginBottom: 12, lineHeight: 20 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  feature: { fontSize: 12, color: '#0B6E4F', backgroundColor: '#E6F4EE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priceBox: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 16, marginBottom: 20 },
  price: { fontSize: 20, fontWeight: '700' },
  perDay: { fontSize: 13, fontWeight: '400', color: '#888' },
  deposit: { color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 10, fontSize: 16 },
  button: { backgroundColor: '#0B6E4F', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
