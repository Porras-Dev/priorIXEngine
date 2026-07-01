import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await client.get(`/notifications/${user.id}`);
      setNotifications(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function markRead(notification) {
    if (notification.read) return;
    try {
      await client.put(`/notifications/${notification.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    } catch {
      Alert.alert('Error', 'No se pudo marcar como leída');
    }
  }

  function renderNotification({ item }) {
    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={() => markRead(item)}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          <Text style={styles.dot}>{item.read ? '○' : '●'}</Text>
          <View style={styles.content}>
            <Text style={[styles.message, !item.read && styles.messageUnread]}>
              {item.message}
            </Text>
            <Text style={styles.time}>
              {new Date(item.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b5bdb" /></View>;
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {unread > 0 && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{unread} alerta{unread > 1 ? 's' : ''} sin leer</Text>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#3b5bdb']} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin alertas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: { backgroundColor: '#3b5bdb', padding: 12, alignItems: 'center' },
  bannerText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  cardUnread: { borderLeftWidth: 4, borderLeftColor: '#3b5bdb', backgroundColor: '#eff6ff' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { fontSize: 18, color: '#3b5bdb', marginTop: 1 },
  content: { flex: 1 },
  message: { fontSize: 15, color: '#475569', lineHeight: 22 },
  messageUnread: { color: '#1e293b', fontWeight: '600' },
  time: { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 16 },
});
