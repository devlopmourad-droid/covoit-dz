import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../api/client';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (password.length < 8) {
      Alert.alert('Mot de passe trop court', 'Au moins 8 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, firstName, lastName, roles: [role] });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Inscription impossible.';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Créer un compte</Text>

      <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Mot de passe (8 caractères min.)" secureTextEntry value={password} onChangeText={setPassword} />

      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'renter' && styles.roleButtonActive]}
          onPress={() => setRole('renter')}
        >
          <Text style={role === 'renter' ? styles.roleTextActive : styles.roleText}>Je veux louer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'owner' && styles.roleButtonActive]}
          onPress={() => setRole('owner')}
        >
          <Text style={role === 'owner' ? styles.roleTextActive : styles.roleText}>Je propose mon véhicule</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Créer mon compte</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Déjà inscrit ? Se connecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: '#0B6E4F' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleButton: { flex: 1, borderWidth: 1, borderColor: '#0B6E4F', borderRadius: 10, padding: 12, alignItems: 'center' },
  roleButtonActive: { backgroundColor: '#0B6E4F' },
  roleText: { color: '#0B6E4F', fontWeight: '600' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#0B6E4F', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 20, color: '#0B6E4F' },
});
