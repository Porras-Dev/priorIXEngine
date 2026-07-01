import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Introduce email y contraseña');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Credenciales incorrectas');
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
        <Text style={styles.subtitle}>Gestión industrial de tareas</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Credenciales demo</Text>
          <Text style={styles.demoText}>admin@priorix.com / admin123</Text>
          <Text style={styles.demoText}>worker1@priorix.com / worker123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#64748b', marginBottom: 40 },
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
  demoBox: {
    marginTop: 40, padding: 16, backgroundColor: '#f1f5f9',
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  demoTitle: { fontWeight: '600', color: '#475569', marginBottom: 6, fontSize: 14 },
  demoText: { color: '#64748b', fontSize: 14, marginBottom: 2 },
});
