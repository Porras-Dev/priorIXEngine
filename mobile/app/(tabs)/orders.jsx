import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import client from '../../api/client';

const QUADRANT_STYLES = {
  Q1: { bg: '#fee2e2', text: '#dc2626', label: 'Q1 Urgente' },
  Q2: { bg: '#dbeafe', text: '#2563eb', label: 'Q2 Importante' },
  Q3: { bg: '#fef9c3', text: '#d97706', label: 'Q3 Urgente' },
  Q4: { bg: '#f1f5f9', text: '#64748b', label: 'Q4 Rutina' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/orders');
      setOrders(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function renderOrder({ item }) {
    const q = QUADRANT_STYLES[item.eisenhowerQuadrant] || QUADRANT_STYLES.Q4;
    const deadline = item.deadline ? new Date(item.deadline).toLocaleDateString('es-ES') : null;
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.ref}>#{item.reference || item.id}</Text>
          <View style={[styles.qBadge, { backgroundColor: q.bg }]}>
            <Text style={[styles.qText, { color: q.text }]}>{q.label}</Text>
          </View>
        </View>
        {item.clientName && <Text style={styles.client}>{item.clientName}</Text>}
        <View style={styles.footer}>
          {deadline && <Text style={styles.meta}>📅 {deadline}</Text>}
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b5bdb" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#3b5bdb']} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin pedidos</Text>}
      />
    </View>
  );
}

function statusColor(status) {
  const map = { pending: '#f59e0b', in_progress: '#3b5bdb', completed: '#10b981', cancelled: '#ef4444' };
  return map[status] || '#94a3b8';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ref: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  qBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  qText: { fontSize: 12, fontWeight: '700' },
  client: { fontSize: 15, color: '#475569', marginBottom: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  meta: { fontSize: 13, color: '#64748b' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 16 },
});
