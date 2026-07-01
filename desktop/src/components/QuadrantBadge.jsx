const QUADRANTS = {
  Q1: { label: 'Q1 · Urgente', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  Q2: { label: 'Q2 · Planificar', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  Q3: { label: 'Q3 · Delegar', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  Q4: { label: 'Q4 · Eliminar', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
};

export default function QuadrantBadge({ quadrant }) {
  const q = QUADRANTS[quadrant] || QUADRANTS.Q4;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${q.bg} ${q.text} ${q.border}`}>
      {q.label}
    </span>
  );
}
