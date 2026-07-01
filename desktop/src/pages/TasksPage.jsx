import { useState, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import StatusBadge from '../components/StatusBadge';

const COLUMNS = [
  { id: 'TODO',        label: 'Por hacer',  bg: 'bg-slate-100' },
  { id: 'IN_PROGRESS', label: 'En curso',   bg: 'bg-blue-50' },
  { id: 'DONE',        label: 'Completado', bg: 'bg-green-50' },
];

export default function TasksPage() {
  const { data: tasks, loading, refetch } = useApi(() => client.get('/tasks'));
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const workers = useMemo(() => {
    if (!tasks) return [];
    const names = [...new Set(tasks.map(t => t.assignedTo?.name).filter(Boolean))];
    return names;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterWorker && t.assignedTo?.name !== filterWorker) return false;
      return true;
    });
  }, [tasks, filterStatus, filterWorker]);

  async function moveTask(task, newStatus) {
    try {
      await client.put(`/tasks/${task.id}`, { status: newStatus });
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al mover tarea');
    }
  }

  async function saveTask(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put(`/tasks/${selected.id}`, {
        title: selected.title,
        description: selected.description,
        status: selected.status,
        estimatedMinutes: selected.estimatedMinutes ? Number(selected.estimatedMinutes) : undefined,
      });
      setSelected(null);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tareas</h2>
          <p className="text-sm text-slate-500">Vista Kanban</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los estados</option>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select
            value={filterWorker}
            onChange={e => setFilterWorker(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todos los trabajadores</option>
            {workers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={`rounded-xl border border-slate-200 overflow-hidden`}>
              <div className={`${col.bg} px-4 py-3 border-b border-slate-200`}>
                <h3 className="font-semibold text-sm text-slate-700">
                  {col.label} <span className="ml-1 text-slate-400">({colTasks.length})</span>
                </h3>
              </div>
              <div className="p-3 space-y-2 min-h-32 bg-white">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-brand-300 transition-all"
                    onClick={() => setSelected({ ...task })}
                  >
                    <p className="text-sm font-semibold text-slate-800 mb-1">{task.title}</p>
                    {task.order && (
                      <p className="text-xs text-slate-500 mb-1.5 font-mono">{task.order.reference}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{task.assignedTo?.name || 'Sin asignar'}</span>
                      {task.estimatedMinutes && <span>{task.estimatedMinutes}min</span>}
                    </div>
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter(c => c.id !== col.id).map(c => (
                        <button
                          key={c.id}
                          onClick={e => { e.stopPropagation(); moveTask(task, c.id); }}
                          className="text-[11px] px-2 py-0.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-100"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-6">Sin tareas</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">Editar tarea</h3>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  value={selected.title}
                  onChange={e => setSelected(s => ({ ...s, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={selected.description || ''}
                  onChange={e => setSelected(s => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <select
                  value={selected.status}
                  onChange={e => setSelected(s => ({ ...s, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Minutos estimados</label>
                <input
                  type="number"
                  value={selected.estimatedMinutes || ''}
                  onChange={e => setSelected(s => ({ ...s, estimatedMinutes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-60">
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
