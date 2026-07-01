const STATUS_MAP = {
  PENDING:     { label: 'Pendiente',   bg: 'bg-gray-100',   text: 'text-gray-600' },
  IN_PROGRESS: { label: 'En curso',    bg: 'bg-blue-100',   text: 'text-blue-700' },
  COMPLETED:   { label: 'Completado',  bg: 'bg-green-100',  text: 'text-green-700' },
  CANCELLED:   { label: 'Cancelado',   bg: 'bg-red-100',    text: 'text-red-600' },
  ON_HOLD:     { label: 'En espera',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  TODO:        { label: 'Por hacer',   bg: 'bg-gray-100',   text: 'text-gray-600' },
  DONE:        { label: 'Hecho',       bg: 'bg-green-100',  text: 'text-green-700' },
  REVIEW:      { label: 'Revisión',    bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
