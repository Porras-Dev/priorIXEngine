import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import QuadrantBadge from '../components/QuadrantBadge';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const QUADRANT_ORDER = { Q1: 0, Q2: 1, Q3: 2, Q4: 3 };

const INITIAL_FORM = {
  reference: '', clientName: '', description: '', quantity: 1,
  unit: 'piezas', complexity: 'MEDIUM', clientPriority: 'STANDARD',
  deadline: '', plantId: '',
};

export default function OrdersPage() {
  const { data: orders, loading, refetch } = useApi(() => client.get('/orders'));
  const { data: plants } = useApi(() => client.get('/plants'));
  const [search, setSearch] = useState('');
  const [filterQ, setFilterQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(o => {
        const s = search.toLowerCase();
        if (s && !o.reference?.toLowerCase().includes(s) && !o.clientName?.toLowerCase().includes(s)) return false;
        if (filterQ && o.classification?.quadrant !== filterQ) return false;
        if (filterStatus && o.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) =>
        (QUADRANT_ORDER[a.classification?.quadrant] ?? 9) - (QUADRANT_ORDER[b.classification?.quadrant] ?? 9) ||
        (b.classification?.score || 0) - (a.classification?.score || 0)
      );
  }, [orders, search, filterQ, filterStatus]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/orders', { ...form, quantity: Number(form.quantity) });
      setShowModal(false);
      setForm(INITIAL_FORM);
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al crear pedido');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pedidos</h2>
          <p className="text-sm text-slate-500">{filtered.length} pedidos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por referencia o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select value={filterQ} onChange={e => setFilterQ(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Todos los cuadrantes</option>
          {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Todos los estados</option>
          {['PENDING','IN_PROGRESS','DONE','CANCELLED','ON_HOLD'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Referencia','Cliente','Descripción','Cant.','Deadline','Cuadrante','Estado',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">Sin pedidos</td></tr>
              )}
              {filtered.map(order => {
                const dl = order.deadline ? new Date(order.deadline) : null;
                return (
                  <tr key={order.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">{order.reference}</td>
                    <td className="px-4 py-3 text-slate-700">{order.clientName}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{order.description}</td>
                    <td className="px-4 py-3 text-slate-600">{order.quantity} {order.unit}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {dl ? format(dl, 'dd MMM', { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-3"><QuadrantBadge quadrant={order.classification?.quadrant} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}`); }} className="text-xs text-brand-500 hover:underline font-medium">Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">Nuevo pedido</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Referencia" value={form.reference} onChange={v => setForm(f => ({ ...f, reference: v }))} required />
              <Field label="Cliente" value={form.clientName} onChange={v => setForm(f => ({ ...f, clientName: v }))} required />
              <Field label="Descripción" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cantidad" value={form.quantity} onChange={v => setForm(f => ({ ...f, quantity: v }))} type="number" required />
                <Field label="Unidad" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} required />
              </div>
              <Field label="Deadline" value={form.deadline} onChange={v => setForm(f => ({ ...f, deadline: v }))} type="datetime-local" required />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Complejidad</label>
                  <select value={form.complexity} onChange={e => setForm(f => ({ ...f, complexity: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {['LOW','MEDIUM','HIGH','CRITICAL'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad cliente</label>
                  <select value={form.clientPriority} onChange={e => setForm(f => ({ ...f, clientPriority: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    {['STANDARD','HIGH','PREMIUM','STRATEGIC'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Planta</label>
                <select value={form.plantId} onChange={e => setForm(f => ({ ...f, plantId: e.target.value }))} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seleccionar planta…</option>
                  {(plants || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-60">
                  {saving ? 'Guardando…' : 'Crear pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
