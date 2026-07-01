import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_STYLES = {
  ADMIN:   { label: 'Admin',   className: 'bg-red-100 text-red-700' },
  MANAGER: { label: 'Manager', className: 'bg-orange-100 text-orange-700' },
  OFFICE:  { label: 'Oficina', className: 'bg-blue-100 text-blue-700' },
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleStyle = ROLE_STYLES[user?.role] || { label: user?.role, className: 'bg-gray-100 text-gray-600' };

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="fixed top-0 left-60 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-700 font-medium">{user?.name || user?.email}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleStyle.className}`}>
          {roleStyle.label}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1.5 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Salir
        </button>
      </div>
    </header>
  );
}
