import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory } from 'lucide-react';

export default function SetupPage() {
  const navigate = useNavigate();
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);

  function saveConfig(url) {
    setSaving(true);
    localStorage.setItem('priorix_config', JSON.stringify({ serverUrl: url, companyName }));
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <Factory className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configurar PriorIX</h1>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              URL del servidor
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Si usas PriorIX en tu empresa, introduce aquí la URL del servidor
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre de la empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.L."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => saveConfig(serverUrl)}
              disabled={saving}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              Guardar y continuar
            </button>
            <button
              onClick={() => saveConfig('http://localhost:3001')}
              disabled={saving}
              className="w-full py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              Usar configuración local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
