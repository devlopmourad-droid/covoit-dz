import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
      </View>
      <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.roles}>{user?.roles?.join(' · ')}</Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert('Se déconnecter', 'Confirmer la déconnexion ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: logout },
          ])
        }
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60, backgroundColor: '#fff' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0B6E4F', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  email: { color: '#666', marginTop: 4 },
  roles: { color: '#0B6E4F', marginTop: 8, textTransform: 'capitalize' },
  logoutButton: { marginTop: 40, borderWidth: 1, borderColor: '#B00020', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  logoutText: { color: '#B00020', fontWeight: '600' },
});
