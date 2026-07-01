import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications, loading, refetch } = useApi(
    () => client.get(`/notifications/${user.id}`),
    [user?.id]
  );

  async function markRead(id) {
    try {
      await client.put(`/notifications/${id}/read`);
      refetch();
    } catch {
      // silent
    }
  }

  const unread = (notifications || []).filter(n => !n.read).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notificaciones</h2>
        <p className="text-sm text-slate-500">{unread} sin leer</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-6 h-6 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {(!notifications || notifications.length === 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Bell size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400">Sin notificaciones</p>
            </div>
          )}
          {(notifications || []).map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                n.read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-full ${n.read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                <Bell size={14} className={n.read ? 'text-slate-400' : 'text-blue-600'} />
              </div>
              <div className="flex-1 min-w-0">
                {n.title && <p className="text-sm font-semibold text-slate-800 mb-0.5">{n.title}</p>}
                <p className="text-sm text-slate-600">{n.message || n.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy HH:mm', { locale: es }) : ''}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-100"
                >
                  <Check size={12} /> Leída
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
