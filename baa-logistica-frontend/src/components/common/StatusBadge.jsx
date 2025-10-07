// ============================================
// src/components/common/StatusBadge.jsx
// ============================================
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Ativo: 'bg-green-100 text-green-800',
    Inativo: 'bg-red-100 text-red-800',
    Disponível: 'bg-green-100 text-green-800',
    'Em Viagem': 'bg-blue-100 text-blue-800',
    Manutenção: 'bg-yellow-100 text-yellow-800',
    Aguardando: 'bg-gray-100 text-gray-800',
    'Em Transporte': 'bg-blue-100 text-blue-800',
    Entregue: 'bg-green-100 text-green-800',
    Cancelada: 'bg-red-100 text-red-800',
    Planejada: 'bg-yellow-100 text-yellow-800',
    'Em Andamento': 'bg-blue-100 text-blue-800',
    Concluída: 'bg-green-100 text-green-800',
  };

  const className = statusConfig[status] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${className}`}>
      {status}
    </span>
  );
};

export default StatusBadge;