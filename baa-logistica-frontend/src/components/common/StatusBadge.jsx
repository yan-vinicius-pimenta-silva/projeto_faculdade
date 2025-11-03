// ============================================
// src/components/common/StatusBadge.jsx
// ============================================
const STATUS_STYLES = {
  Ativo: 'status-badge--success',
  Inativo: 'status-badge--danger',
  Disponível: 'status-badge--success',
  'Em Viagem': 'status-badge--info',
  Manutenção: 'status-badge--warning',
  Aguardando: 'status-badge--neutral',
  'Em Transporte': 'status-badge--info',
  Entregue: 'status-badge--success',
  Cancelada: 'status-badge--danger',
  Planejada: 'status-badge--warning',
  'Em Andamento': 'status-badge--info',
  Concluída: 'status-badge--success',
};

const StatusBadge = ({ status = '' }) => {
  const variant = STATUS_STYLES[status] || 'status-badge--neutral';
  const classes = ['status-badge', variant].join(' ');

  return <span className={classes}>{status || '—'}</span>;
};

export default StatusBadge;
