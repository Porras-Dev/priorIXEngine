import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import client from '../api/client';
import QuadrantBadge from '../components/QuadrantBadge';
import { format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

const Q_COLORS = { Q1: '#ef4444', Q2: '#3b82f6', Q3: '#f59e0b', Q4: '#6b7280' };

function MetricCard({ icon: Icon, label, value, bgColor, textColor }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${textColor}`}>{value ?? '—'}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon size={20} className={textColor} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    try {
      const { data: d } = await client.get('/dashboard');
      setData(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const byQ = data?.ordersByQuadrant || {};
  const atRisk = data?.ordersAtRisk || [];
  const workload = data?.workerLoad || [];

  const pieData = Object.entries(byQ)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">Visión general de producción</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={Package} label="Pedidos activos" value={data?.totalActive} bgColor="bg-blue-50" textColor="text-blue-600" />
        <MetricCard icon={AlertTriangle} label="Q1 Urgentes" value={byQ.Q1} bgColor="bg-red-50" textColor="text-red-600" />
        <MetricCard icon={Clock} label="En riesgo &lt;48h" value={atRisk.length} bgColor="bg-orange-50" textColor="text-orange-500" />
        <MetricCard icon={CheckCircle} label="Completados esta semana" value={data?.completedThisWeek} bgColor="bg-green-50" textColor="text-green-600" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Pedidos en riesgo (deadline &lt;48h)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Referencia','Cliente','Deadline','Cuadrante'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atRisk.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Sin pedidos en riesgo</td></tr>
                )}
                {atRisk.map(order => {
                  const dl = order.deadline ? new Date(order.deadline) : null;
                  const critical = dl && differenceInHours(dl, new Date()) < 24;
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      <td className="px-5 py-3 font-mono font-medium text-slate-800">{order.reference}</td>
                      <td className="px-5 py-3 text-slate-600">{order.clientName}</td>
                      <td className={`px-5 py-3 font-medium ${critical ? 'text-red-600' : 'text-slate-600'}`}>
                        {dl ? format(dl, 'dd MMM HH:mm', { locale: es }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <QuadrantBadge quadrant={order.classification?.quadrant} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Distribución Q1–Q4</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map(entry => (
                      <Cell key={entry.name} fill={Q_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} pedidos`, n]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {Object.entries(byQ).map(([q, count]) => (
                <span key={q} className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: Q_COLORS[q] }} />
                  {q}: {count}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Carga por trabajador</h3>
            <div className="space-y-3">
              {workload.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
              {workload.map(w => (
                <div key={w.workerId}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{w.name}</span>
                    <span>{w.activeTasks} tareas</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, (w.activeTasks / (workload[0]?.activeTasks || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
