import { NavLink } from 'react-router-dom';
import {
  Factory, LayoutDashboard, ClipboardList, CheckSquare,
  Users, Shield, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ unreadCount = 0 }) {
  const { user } = useAuth();
  const role = user?.role;

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-500 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 flex flex-col z-20">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Factory size={18} className="text-white" />
        </div>
        <span className="font-bold text-slate-900 text-lg tracking-tight">PriorIX</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>
        <NavLink to="/orders" className={navClass}>
          <ClipboardList size={18} />
          Pedidos
        </NavLink>
        <NavLink to="/tasks" className={navClass}>
          <CheckSquare size={18} />
          Tareas
        </NavLink>
        {(role === 'ADMIN' || role === 'MANAGER') && (
          <NavLink to="/users" className={navClass}>
            <Users size={18} />
            Usuarios
          </NavLink>
        )}
        {role === 'ADMIN' && (
          <NavLink to="/audit" className={navClass}>
            <Shield size={18} />
            Auditoría
          </NavLink>
        )}
        <NavLink to="/notifications" className={navClass}>
          <div className="relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          Notificaciones
        </NavLink>
      </nav>

      <div className="px-4 py-3 border-t border-slate-100">
        <span className="text-xs text-slate-400">v0.1.0</span>
      </div>
    </aside>
  );
}
