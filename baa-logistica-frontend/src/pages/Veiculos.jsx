// ============================================
// src/pages/Veiculos.jsx
// ============================================
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { veiculosService } from '../services/veiculosService';
import { format } from 'date-fns';

const Veiculos = () => {
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    placa: '',
    modelo: '',
    marca: '',
    anoFabricacao: '',
    tipoVeiculo: '',
    capacidadeCarga: '',
    capacidadeVolume: '',
    renavam: '',
    chassi: '',
    kmAtual: 0,
    status: 'Disponível',
    dataAquisicao: '',
    observacoes: '',
  });

  useEffect(() => {
    loadVeiculos();
  }, [statusFilter]);

  const loadVeiculos = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await veiculosService.getAll(params);
      setVeiculos(data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      alert('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (veiculo = null) => {
    if (veiculo) {
      setEditingVeiculo(veiculo);
      setFormData({
        placa: veiculo.placa || '',
        modelo: veiculo.modelo || '',
        marca: veiculo.marca || '',
        anoFabricacao: veiculo.anoFabricacao || new Date().getFullYear(),
        tipoVeiculo: veiculo.tipoVeiculo || '',
        capacidadeCarga: veiculo.capacidadeCarga || '',
        capacidadeVolume: veiculo.capacidadeVolume || '',
        renavam: veiculo.renavam || '',
        chassi: veiculo.chassi || '',
        kmAtual: veiculo.kmAtual || 0,
        status: veiculo.status || 'Disponível',
        dataAquisicao: veiculo.dataAquisicao ? format(new Date(veiculo.dataAquisicao), 'yyyy-MM-dd') : '',
        observacoes: veiculo.observacoes || '',
      });
    } else {
      setEditingVeiculo(null);
      setFormData({
        placa: '',
        modelo: '',
        marca: '',
        anoFabricacao: new Date().getFullYear(),
        tipoVeiculo: '',
        capacidadeCarga: '',
        capacidadeVolume: '',
        renavam: '',
        chassi: '',
        kmAtual: 0,
        status: 'Disponível',
        dataAquisicao: '',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVeiculo(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data - convert to proper types and handle nulls
      const submitData = {
        placa: formData.placa,
        modelo: formData.modelo,
        marca: formData.marca,
        anoFabricacao: parseInt(formData.anoFabricacao),
        tipoVeiculo: formData.tipoVeiculo,
        capacidadeCarga: parseFloat(formData.capacidadeCarga),
        capacidadeVolume: formData.capacidadeVolume ? parseFloat(formData.capacidadeVolume) : null,
        renavam: formData.renavam || null,
        chassi: formData.chassi || null,
        kmAtual: parseInt(formData.kmAtual) || 0,
        status: formData.status,
        dataAquisicao: formData.dataAquisicao || null,
        observacoes: formData.observacoes || null,
      };

      console.log('Dados sendo enviados:', submitData);

      if (editingVeiculo) {
        await veiculosService.update(editingVeiculo.id, {
          id: editingVeiculo.id,
          ...submitData
        });
        alert('Veículo atualizado com sucesso!');
      } else {
        await veiculosService.create(submitData);
        alert('Veículo cadastrado com sucesso!');
      }
      handleCloseModal();
      loadVeiculos();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      console.error('Resposta do erro:', error.response?.data);

      // Show specific error message
      let errorMessage = 'Erro ao salvar veículo';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(key =>
          `${key}: ${errors[key].join(', ')}`
        ).join('\n');
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      }

      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await veiculosService.delete(id);
        alert('Veículo excluído com sucesso!');
        loadVeiculos();
      } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        alert(error.response?.data?.message || 'Erro ao excluir veículo');
      }
    }
  };

  const filteredVeiculos = veiculos.filter(v =>
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Placa', accessor: 'placa' },
    { header: 'Modelo', accessor: 'modelo' },
    { header: 'Marca', accessor: 'marca' },
    { header: 'Tipo', accessor: 'tipoVeiculo' },
    {
      header: 'Capacidade',
      render: (row) => `${row.capacidadeCarga} t`
    },
    {
      header: 'KM Atual',
      render: (row) => row.kmAtual.toLocaleString('pt-BR')
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Ações',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Veículos</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="inline mr-2" />
          Novo Veículo
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por placa, modelo ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Select
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os Status' },
              { value: 'Disponível', label: 'Disponível' },
              { value: 'Em Viagem', label: 'Em Viagem' },
              { value: 'Manutenção', label: 'Manutenção' },
              { value: 'Inativo', label: 'Inativo' },
            ]}
            placeholder="Filtrar por status"
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        {loading ? (
          <p className="text-center text-gray-500 py-4">Carregando...</p>
        ) : (
          <Table columns={columns} data={filteredVeiculos} />
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Placa"
              name="placa"
              value={formData.placa}
              onChange={handleInputChange}
              placeholder="ABC-1234"
              required
            />
            <Input
              label="Modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Marca"
              name="marca"
              value={formData.marca}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Ano de Fabricação"
              name="anoFabricacao"
              type="number"
              value={formData.anoFabricacao}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Tipo de Veículo"
              name="tipoVeiculo"
              value={formData.tipoVeiculo}
              onChange={handleInputChange}
              options={[
                { value: 'Caminhão', label: 'Caminhão' },
                { value: 'Carreta', label: 'Carreta' },
                { value: 'Van', label: 'Van' },
                { value: 'Utilitário', label: 'Utilitário' },
              ]}
              required
            />
            <Input
              label="Capacidade de Carga (toneladas)"
              name="capacidadeCarga"
              type="number"
              step="0.01"
              value={formData.capacidadeCarga}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Capacidade de Volume (m³)"
              name="capacidadeVolume"
              type="number"
              step="0.01"
              value={formData.capacidadeVolume}
              onChange={handleInputChange}
            />
            <Input
              label="RENAVAM"
              name="renavam"
              value={formData.renavam}
              onChange={handleInputChange}
            />
            <Input
              label="Chassi"
              name="chassi"
              value={formData.chassi}
              onChange={handleInputChange}
            />
            <Input
              label="KM Atual"
              name="kmAtual"
              type="number"
              value={formData.kmAtual}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Data de Aquisição"
              name="dataAquisicao"
              type="date"
              value={formData.dataAquisicao}
              onChange={handleInputChange}
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Disponível', label: 'Disponível' },
                { value: 'Em Viagem', label: 'Em Viagem' },
                { value: 'Manutenção', label: 'Manutenção' },
                { value: 'Inativo', label: 'Inativo' },
              ]}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingVeiculo ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Veiculos;