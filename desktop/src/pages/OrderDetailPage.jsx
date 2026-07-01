import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import QuadrantBadge from '../components/QuadrantBadge';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const QUADRANTS = ['Q1','Q2','Q3','Q4'];
const STATUSES = ['PENDING','IN_PROGRESS','DONE','CANCELLED','ON_HOLD'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: order, loading, refetch } = useApi(() => client.get(`/orders/${id}`), [id]);
  const [showReclassify, setShowReclassify] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [reclassForm, setReclassForm] = useState({ urgency: true, importance: true, quadrant: '', score: 50 });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', estimatedMinutes: '', assignedToId: '' });
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  async function handleReclassify(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put(`/orders/${id}/classify`, {
        urgency: !!reclassForm.urgency,
        importance: !!reclassForm.importance,
        quadrant: reclassForm.quadrant,
        score: Number(reclassForm.score),
      });
      setShowReclassify(false);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al reclasificar');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await client.put(`/orders/${id}`, { status: newStatus });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/tasks', {
        orderId: id,
        title: taskForm.title,
        description: taskForm.description || undefined,
        assignedToId: taskForm.assignedToId || undefined,
        estimatedMinutes: taskForm.estimatedMinutes ? Number(taskForm.estimatedMinutes) : undefined,
      });
      setShowTask(false);
      setTaskForm({ title: '', description: '', estimatedMinutes: '', assignedToId: '' });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear tarea');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" /></div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-slate-500">Pedido no encontrado</div>;
  }

  const cls = order.classification;
  const tasks = order.tasks || [];
  const dl = order.deadline ? new Date(order.deadline) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900 font-mono">{order.reference}</h2>
              {cls && <QuadrantBadge quadrant={cls.quadrant} />}
              <StatusBadge status={order.status} />
              {cls?.isManualOverride && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">Override manual</span>
              )}
            </div>
            <p className="text-lg text-slate-600">{order.clientName}</p>
          </div>
          {canEdit && (
            <button
              onClick={() => { setReclassForm({ urgency: cls?.urgency ?? true, importance: cls?.importance ?? true, quadrant: cls?.quadrant || 'Q2', score: cls?.score ?? 50 }); setShowReclassify(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={14} /> Reclasificar
            </button>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Detail label="Descripción" value={order.description} />
          <Detail label="Cantidad" value={`${order.quantity} ${order.unit}`} />
          <Detail label="Complejidad" value={order.complexity} />
          <Detail label="Prioridad cliente" value={order.clientPriority} />
          <Detail label="Deadline" value={dl ? format(dl, 'dd MMM yyyy HH:mm', { locale: es }) : '—'} />
          <Detail label="Planta" value={order.plant?.name} />
          {cls && <>
            <Detail label="Cuadrante" value={cls.quadrant} />
            <Detail label="Score" value={cls.score?.toFixed(2)} />
            <Detail label="Urgencia" value={cls.urgency ? 'Sí' : 'No'} />
            <Detail label="Importancia" value={cls.importance ? 'Sí' : 'No'} />
          </>}
        </dl>

        {canEdit && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cambiar estado</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={order.status === s}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                    order.status === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Tareas ({tasks.length})</h3>
          <button onClick={() => setShowTask(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600">
            <Plus size={14} /> Nueva tarea
          </button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-center py-10 text-slate-400 text-sm">Sin tareas</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Título','Estado','Asignado','Min. est.'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className="px-5 py-3 text-slate-800 font-medium">{t.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3 text-slate-600">{t.assignedTo?.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{t.estimatedMinutes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showReclassify && (
        <Modal title="Reclasificar pedido" onClose={() => setShowReclassify(false)}>
          <form onSubmit={handleReclassify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cuadrante</label>
              <select value={reclassForm.quadrant} onChange={e => setReclassForm(f => ({ ...f, quadrant: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar…</option>
                {QUADRANTS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            {[
              { label: 'Urgente', key: 'urgency' },
              { label: 'Importante', key: 'importance' },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={key}
                  checked={!!reclassForm[key]}
                  onChange={e => setReclassForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500"
                />
                <label htmlFor={key} className="text-sm font-medium text-slate-700">{label}</label>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Score (0-100)</label>
              <input type="number" min="0" max="100" step="1" value={reclassForm.score} onChange={e => setReclassForm(f => ({ ...f, score: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <ModalFooter onCancel={() => setShowReclassify(false)} saving={saving} label="Reclasificar" />
          </form>
        </Modal>
      )}

      {showTask && (
        <Modal title="Nueva tarea" onClose={() => setShowTask(false)}>
          <form onSubmit={handleCreateTask} className="space-y-4">
            {[
              { label: 'Título', key: 'title', required: true },
              { label: 'Descripción', key: 'description' },
              { label: 'Minutos estimados', key: 'estimatedMinutes', type: 'number' },
              { label: 'ID de asignado', key: 'assignedToId' },
            ].map(({ label, key, required, type = 'text' }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input type={type} value={taskForm[key]} onChange={e => setTaskForm(f => ({ ...f, [key]: e.target.value }))} required={required} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
            <ModalFooter onCancel={() => setShowTask(false)} saving={saving} label="Crear tarea" />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value ?? '—'}</dd>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">{title && <h3 className="text-lg font-semibold text-slate-900 mb-5">{title}</h3>}{children}</div>
    </div>
  );
}

function ModalFooter({ onCancel, saving, label }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
      <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-60">{saving ? 'Guardando…' : label}</button>
    </div>
  );
}
