import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function SetupPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Introduce la URL del servidor');
      return;
    }
    if (!trimmed.startsWith('http')) {
      Alert.alert('Error', 'La URL debe empezar por http:// o https://');
      return;
    }
    setLoading(true);
    try {
      await SecureStore.setItemAsync('serverUrl', trimmed);
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🏭</Text>
        <Text style={styles.title}>PriorIX</Text>
        <Text style={styles.heading}>Configurar PriorIX</Text>
        <Text style={styles.subtitle}>
          Introduce la dirección del servidor (configura tu administrador)
        </Text>

        <TextInput
          style={styles.input}
          placeholder="http://192.168.1.X:3001"
          placeholderTextColor="#9ca3af"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Guardar y continuar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#1e293b', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#64748b', marginBottom: 36, lineHeight: 22 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 16, fontSize: 17, color: '#1e293b',
    marginBottom: 16, backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#3b5bdb', borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
