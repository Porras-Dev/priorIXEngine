import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['all', 'pending', 'in_progress', 'completed'];
const FILTER_LABELS = { all: 'Todas', pending: 'Pendiente', in_progress: 'En curso', completed: 'Completada' };

const STATUS_COLORS = {
  pending: '#f59e0b',
  in_progress: '#3b5bdb',
  completed: '#10b981',
};

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (user?.id) params.workerId = user.id;
      if (filter !== 'all') params.status = filter;
      const { data } = await client.get('/tasks', { params });
      setTasks(data);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function updateStatus(task, newStatus) {
    try {
      await client.put(`/tasks/${task.id}`, { status: newStatus });
      load();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  }

  function renderTask({ item }) {
    const color = STATUS_COLORS[item.status] || '#64748b';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.taskTitle} numberOfLines={2}>{item.description}</Text>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{FILTER_LABELS[item.status] || item.status}</Text>
          </View>
        </View>
        {item.orderId && (
          <Text style={styles.meta}>Pedido #{item.orderId}</Text>
        )}
        {item.estimatedMinutes && (
          <Text style={styles.meta}>⏱ {item.estimatedMinutes} min estimados</Text>
        )}
        <View style={styles.actions}>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3b5bdb' }]}
              onPress={() => updateStatus(item, 'in_progress')}
            >
              <Text style={styles.actionText}>▶ Iniciar</Text>
            </TouchableOpacity>
          )}
          {item.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
              onPress={() => updateStatus(item, 'completed')}
            >
              <Text style={styles.actionText}>✓ Completar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b5bdb" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.pills}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, filter === f && styles.pillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#3b5bdb']} />}
        ListEmptyComponent={<Text style={styles.empty}>Sin tareas</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pills: { flexDirection: 'row', padding: 12, gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#e2e8f0' },
  pillActive: { backgroundColor: '#3b5bdb' },
  pillText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  pillTextActive: { color: '#fff' },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: 14, gap: 10 },
  actionBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 16 },
});
