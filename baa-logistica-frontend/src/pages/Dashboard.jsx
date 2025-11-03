// ============================================
// src/pages/Dashboard.jsx
// ============================================
import { useState, useEffect } from 'react';
import { Users, Truck, Package, MapPin } from 'lucide-react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import { dashboardService } from '../services/dashboardService';

const Dashboard = () => {
  const [estatisticas, setEstatisticas] = useState(null);
  const [viagensAtivas, setViagensAtivas] = useState([]);
  const [ultimasCargas, setUltimasCargas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, viagens, cargas] = await Promise.all([
        dashboardService.getEstatisticas(),
        dashboardService.getViagensAtivas(),
        dashboardService.getUltimasCargas(5),
      ]);

      setEstatisticas(stats);
      setViagensAtivas(viagens);
      setUltimasCargas(cargas);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const viagensColumns = [
    { header: 'Nº Viagem', accessor: 'numeroViagem' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    { header: 'Motorista', accessor: 'motorista.nome' },
    { header: 'Veículo', accessor: 'veiculo.placa' },
    { header: 'Origem', accessor: 'carga.cidadeColeta' },
    { header: 'Destino', accessor: 'carga.cidadeEntrega' },
  ];

  const cargasColumns = [
    { header: 'Protocolo', accessor: 'numeroProtocolo' },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    { header: 'Descrição', accessor: 'descricaoCarga' },
    { header: 'Cliente', accessor: 'cliente' },
    {
      header: 'Peso',
      render: (row) => (row.pesoCarga ? `${row.pesoCarga.toFixed(2)} kg` : '—'),
      align: 'right'
    },
  ];

  if (loading) {
    return <div className="loading-state">Carregando...</div>;
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="page-header__title-group">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral das operações logísticas</p>
        </div>
      </div>

      <div className="stat-grid">
        <Card className="stat-card stat-card--drivers">
          <div className="stat-card__content">
            <span className="stat-card__label">Motoristas ativos</span>
            <span className="stat-card__value">{estatisticas?.motoristas.ativos || 0}</span>
            <span className="stat-card__meta">
              de {estatisticas?.motoristas.total || 0} cadastrados
            </span>
          </div>
          <div className="stat-card__icon">
            <Users size={26} />
          </div>
        </Card>

        <Card className="stat-card stat-card--vehicles">
          <div className="stat-card__content">
            <span className="stat-card__label">Veículos disponíveis</span>
            <span className="stat-card__value">{estatisticas?.veiculos.disponiveis || 0}</span>
            <span className="stat-card__meta">
              {estatisticas?.veiculos.emViagem || 0} em viagem
            </span>
          </div>
          <div className="stat-card__icon">
            <Truck size={26} />
          </div>
        </Card>

        <Card className="stat-card stat-card--cargo">
          <div className="stat-card__content">
            <span className="stat-card__label">Cargas em transporte</span>
            <span className="stat-card__value">{estatisticas?.cargas.emTransporte || 0}</span>
            <span className="stat-card__meta">
              {estatisticas?.cargas.aguardando || 0} aguardando expedição
            </span>
          </div>
          <div className="stat-card__icon">
            <Package size={26} />
          </div>
        </Card>

        <Card className="stat-card stat-card--trips">
          <div className="stat-card__content">
            <span className="stat-card__label">Viagens em andamento</span>
            <span className="stat-card__value">{estatisticas?.viagens.emAndamento || 0}</span>
            <span className="stat-card__meta">
              {estatisticas?.viagens.planejadas || 0} planejadas
            </span>
          </div>
          <div className="stat-card__icon">
            <MapPin size={26} />
          </div>
        </Card>
      </div>

      <Card title="Viagens ativas" subtitle="Acompanhe as operações em tempo real">
        {viagensAtivas.length > 0 ? (
          <Table columns={viagensColumns} data={viagensAtivas} />
        ) : (
          <div className="empty-state">Nenhuma viagem ativa no momento</div>
        )}
      </Card>

      <Card title="Últimas cargas cadastradas" subtitle="Registro das operações recentes">
        {ultimasCargas.length > 0 ? (
          <Table columns={cargasColumns} data={ultimasCargas} />
        ) : (
          <div className="empty-state">Nenhuma carga cadastrada</div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
