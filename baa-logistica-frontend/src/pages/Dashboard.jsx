// ============================================
// src/pages/Dashboard.jsx
// ============================================
import { useState, useEffect } from 'react';
import { Users, Truck, Package, MapPin } from 'lucide-react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import { dashboardService } from '../services/dashboardService';
import { format } from 'date-fns';

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
      render: (row) => `${row.pesoCarga.toFixed(2)} kg`
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Motoristas Ativos</p>
              <p className="text-2xl font-bold text-gray-800">
                {estatisticas?.motoristas.ativos || 0}
              </p>
              <p className="text-xs text-gray-500">
                de {estatisticas?.motoristas.total || 0} total
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Veículos Disponíveis</p>
              <p className="text-2xl font-bold text-gray-800">
                {estatisticas?.veiculos.disponiveis || 0}
              </p>
              <p className="text-xs text-gray-500">
                {estatisticas?.veiculos.emViagem || 0} em viagem
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Truck className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cargas em Transporte</p>
              <p className="text-2xl font-bold text-gray-800">
                {estatisticas?.cargas.emTransporte || 0}
              </p>
              <p className="text-xs text-gray-500">
                {estatisticas?.cargas.aguardando || 0} aguardando
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Package className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Viagens em Andamento</p>
              <p className="text-2xl font-bold text-gray-800">
                {estatisticas?.viagens.emAndamento || 0}
              </p>
              <p className="text-xs text-gray-500">
                {estatisticas?.viagens.planejadas || 0} planejadas
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Viagens Ativas */}
      <Card title="Viagens Ativas">
        {viagensAtivas.length > 0 ? (
          <Table columns={viagensColumns} data={viagensAtivas} />
        ) : (
          <p className="text-center text-gray-500 py-4">Nenhuma viagem ativa no momento</p>
        )}
      </Card>

      {/* Últimas Cargas */}
      <Card title="Últimas Cargas Cadastradas">
        {ultimasCargas.length > 0 ? (
          <Table columns={cargasColumns} data={ultimasCargas} />
        ) : (
          <p className="text-center text-gray-500 py-4">Nenhuma carga cadastrada</p>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;