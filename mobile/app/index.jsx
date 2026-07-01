import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    async function redirect() {
      const serverUrl = await SecureStore.getItemAsync('serverUrl');
      if (!serverUrl) {
        router.replace('/setup');
      } else if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
    redirect();
  }, [loading, token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3b5bdb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
