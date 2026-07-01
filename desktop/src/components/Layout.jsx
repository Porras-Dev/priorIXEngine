import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Layout() {
  const { token, user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token || !user?.id) return;
    const fetchUnread = async () => {
      try {
        const { data } = await client.get(`/notifications/${user.id}`);
        setUnreadCount(Array.isArray(data) ? data.filter(n => !n.read).length : 0);
      } catch {
        // silent
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [token, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar unreadCount={unreadCount} />
      <div className="pl-60">
        <Topbar />
        <main className="pt-14 p-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
