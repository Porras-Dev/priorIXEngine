import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ROLES = ['ADMIN','MANAGER','OFFICE','WORKER'];
const ROLE_STYLES = {
  ADMIN:   'bg-red-100 text-red-700',
  MANAGER: 'bg-orange-100 text-orange-700',
  OFFICE:  'bg-blue-100 text-blue-700',
  WORKER:  'bg-green-100 text-green-700',
};

const EMPTY = { name: '', email: '', password: '', role: 'OFFICE', plantId: '' };

export default function UsersPage() {
  const { data: users, loading, refetch } = useApi(() => client.get('/users'));
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  function openCreate() { setForm(EMPTY); setEditUser(null); setShowModal(true); }
  function openEdit(u) { setForm({ name: u.name, email: u.email, password: '', role: u.role, plantId: u.plantId || '' }); setEditUser(u); setShowModal(true); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        const payload = { name: form.name, email: form.email, role: form.role, plantId: form.plantId || undefined };
        if (form.password) payload.password = form.password;
        await client.put(`/users/${editUser.id}`, payload);
      } else {
        await client.post('/users', form);
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await client.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Usuarios</h2>
          <p className="text-sm text-slate-500">{users?.length ?? 0} usuarios registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
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
                {['Nombre','Email','Rol','Planta','Creado','Acciones'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!users || users.length === 0) && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Sin usuarios</td></tr>
              )}
              {(users || []).map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.plant?.name || '—'}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {u.createdAt ? format(new Date(u.createdAt), 'dd MMM yyyy', { locale: es }) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              {editUser ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Nombre', key: 'name', required: true },
                { label: 'Email', key: 'email', type: 'email', required: !editUser },
                { label: editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña', key: 'password', type: 'password', required: !editUser },
                { label: 'Planta (ID)', key: 'plantId' },
              ].map(({ label, key, type = 'text', required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required={required}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-60">
                  {saving ? 'Guardando…' : editUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar usuario"
        message={`¿Eliminar a ${deleteTarget?.name}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
