import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import client from '../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PAGE_SIZE = 50;

export default function AuditPage() {
  const { data: logs, loading } = useApi(() => client.get('/audit-log'));
  const [filterEntity, setFilterEntity] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [page, setPage] = useState(0);

  const entities = [...new Set((logs || []).map(l => l.entityType).filter(Boolean))];
  const userNames = [...new Set((logs || []).map(l => l.user?.name || l.userId).filter(Boolean))];

  const filtered = (logs || []).filter(l => {
    if (filterEntity && l.entityType !== filterEntity) return false;
    if (filterUser && (l.user?.name || l.userId) !== filterUser) return false;
    return true;
  });

  const total = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Auditoría</h2>
        <p className="text-sm text-slate-500">{total} registros</p>
      </div>

      <div className="flex gap-3">
        <select
          value={filterEntity}
          onChange={e => { setFilterEntity(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todas las entidades</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select
          value={filterUser}
          onChange={e => { setFilterUser(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Todos los usuarios</option>
          {userNames.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Fecha / hora','Usuario','Acción','Entidad','ID','Antes','Después'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400">Sin registros</td></tr>
                )}
                {paginated.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">
                      {log.createdAt ? format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{log.user?.name || log.userId || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{log.entityType}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{log.entityId?.slice(0, 8)}…</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[120px] truncate">
                      {log.oldValue ? String(log.oldValue).slice(0, 40) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[120px] truncate">
                      {log.newValue ? String(log.newValue).slice(0, 40) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
                <span className="text-xs text-slate-500">
                  Página {page + 1} de {totalPages} ({total} registros)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-100"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
