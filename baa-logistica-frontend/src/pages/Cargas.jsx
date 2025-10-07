// ============================================
// src/pages/Cargas.jsx
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
import { cargasService } from '../services/cargasService';
import { clientesService } from '../services/clientesService';
import { format } from 'date-fns';

const Cargas = () => {
  const [cargas, setCargas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarga, setEditingCarga] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    numeroProtocolo: '',
    clienteId: '',
    tipoCarga: '',
    descricaoCarga: '',
    pesoCarga: '',
    volumeCarga: '',
    valorCarga: '',
    enderecoColeta: '',
    cidadeColeta: '',
    estadoColeta: '',
    enderecoEntrega: '',
    cidadeEntrega: '',
    estadoEntrega: '',
    dataPrevistaColeta: '',
    dataPrevistaEntrega: '',
    status: 'Aguardando',
    observacoes: '',
  });

  useEffect(() => {
    loadCargas();
    loadClientes();
  }, [statusFilter]);

  const loadCargas = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const data = await cargasService.getAll(params);
      setCargas(data);
    } catch (error) {
      console.error('Erro ao carregar cargas:', error);
      alert('Erro ao carregar cargas');
    } finally {
      setLoading(false);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await clientesService.getAll({ status: 'Ativo' });
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const generateProtocol = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CRG${year}${month}${day}${random}`;
  };

  const handleOpenModal = (carga = null) => {
    if (carga) {
      setEditingCarga(carga);
      setFormData({
        ...carga,
        dataPrevistaColeta: carga.dataPrevistaColeta ? format(new Date(carga.dataPrevistaColeta), 'yyyy-MM-dd') : '',
        dataPrevistaEntrega: carga.dataPrevistaEntrega ? format(new Date(carga.dataPrevistaEntrega), 'yyyy-MM-dd') : '',
      });
    } else {
      setEditingCarga(null);
      setFormData({
        numeroProtocolo: generateProtocol(),
        clienteId: '',
        tipoCarga: '',
        descricaoCarga: '',
        pesoCarga: '',
        volumeCarga: '',
        valorCarga: '',
        enderecoColeta: '',
        cidadeColeta: '',
        estadoColeta: '',
        enderecoEntrega: '',
        cidadeEntrega: '',
        estadoEntrega: '',
        dataPrevistaColeta: '',
        dataPrevistaEntrega: '',
        status: 'Aguardando',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCarga(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        numeroProtocolo: formData.numeroProtocolo,
        clienteId: parseInt(formData.clienteId),
        tipoCarga: formData.tipoCarga,
        descricaoCarga: formData.descricaoCarga,
        pesoCarga: parseFloat(formData.pesoCarga),
        volumeCarga: formData.volumeCarga ? parseFloat(formData.volumeCarga) : null,
        valorCarga: formData.valorCarga ? parseFloat(formData.valorCarga) : null,
        enderecoColeta: formData.enderecoColeta,
        cidadeColeta: formData.cidadeColeta,
        estadoColeta: formData.estadoColeta,
        enderecoEntrega: formData.enderecoEntrega,
        cidadeEntrega: formData.cidadeEntrega,
        estadoEntrega: formData.estadoEntrega,
        dataPrevistaColeta: formData.dataPrevistaColeta || null,
        dataPrevistaEntrega: formData.dataPrevistaEntrega || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      };

      console.log('Dados sendo enviados:', submitData);

      if (editingCarga) {
        await cargasService.update(editingCarga.id, { id: editingCarga.id, ...submitData });
        alert('Carga atualizada com sucesso!');
      } else {
        await cargasService.create(submitData);
        alert('Carga cadastrada com sucesso!');
      }
      handleCloseModal();
      loadCargas();
    } catch (error) {
      console.error('Erro ao salvar carga:', error);
      console.error('Resposta do erro:', error.response?.data);

      let errorMessage = 'Erro ao salvar carga';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.keys(errors).map(key => `${key}: ${errors[key].join(', ')}`).join('\n');
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta carga?')) {
      try {
        await cargasService.delete(id);
        alert('Carga excluída com sucesso!');
        loadCargas();
      } catch (error) {
        console.error('Erro ao excluir carga:', error);
        alert(error.response?.data?.message || 'Erro ao excluir carga');
      }
    }
  };

  const filteredCargas = cargas.filter(c =>
    c.numeroProtocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.descricaoCarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cliente?.razaoSocial || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Protocolo', accessor: 'numeroProtocolo' },
    {
      header: 'Cliente',
      render: (row) => row.cliente?.razaoSocial || '-'
    },
    { header: 'Descrição', accessor: 'descricaoCarga' },
    {
      header: 'Peso',
      render: (row) => `${row.pesoCarga.toFixed(2)} kg`
    },
    { header: 'Origem', accessor: 'cidadeColeta' },
    { header: 'Destino', accessor: 'cidadeEntrega' },
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
        <h1 className="text-3xl font-bold text-gray-800">Cargas</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={20} className="inline mr-2" />
          Nova Carga
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por protocolo, descrição ou cliente..."
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
              { value: 'Aguardando', label: 'Aguardando' },
              { value: 'Em Transporte', label: 'Em Transporte' },
              { value: 'Entregue', label: 'Entregue' },
              { value: 'Cancelada', label: 'Cancelada' },
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
          <Table columns={columns} data={filteredCargas} />
        )}
      </Card>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCarga ? 'Editar Carga' : 'Nova Carga'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número do Protocolo"
              name="numeroProtocolo"
              value={formData.numeroProtocolo}
              onChange={handleInputChange}
              required
              disabled={editingCarga !== null}
            />
            <Select
              label="Cliente"
              name="clienteId"
              value={formData.clienteId}
              onChange={handleInputChange}
              options={clientes.map(c => ({ value: c.id, label: c.razaoSocial }))}
              required
            />
            <Select
              label="Tipo de Carga"
              name="tipoCarga"
              value={formData.tipoCarga}
              onChange={handleInputChange}
              options={[
                { value: 'Geral', label: 'Geral' },
                { value: 'Refrigerada', label: 'Refrigerada' },
                { value: 'Perecível', label: 'Perecível' },
                { value: 'Química', label: 'Química' },
                { value: 'Frágil', label: 'Frágil' },
              ]}
              required
            />
            <Input
              label="Peso (kg)"
              name="pesoCarga"
              type="number"
              step="0.01"
              value={formData.pesoCarga}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Volume (m³)"
              name="volumeCarga"
              type="number"
              step="0.01"
              value={formData.volumeCarga}
              onChange={handleInputChange}
            />
            <Input
              label="Valor da Carga (R$)"
              name="valorCarga"
              type="number"
              step="0.01"
              value={formData.valorCarga}
              onChange={handleInputChange}
            />
          </div>

          <div className="mt-4">
            <Input
              label="Descrição da Carga"
              name="descricaoCarga"
              value={formData.descricaoCarga}
              onChange={handleInputChange}
              required
            />
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Coleta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Endereço de Coleta"
              name="enderecoColeta"
              value={formData.enderecoColeta}
              onChange={handleInputChange}
              required
              className="md:col-span-3"
            />
            <Input
              label="Cidade"
              name="cidadeColeta"
              value={formData.cidadeColeta}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Estado"
              name="estadoColeta"
              value={formData.estadoColeta}
              onChange={handleInputChange}
              placeholder="SP"
              maxLength="2"
              required
            />
            <Input
              label="Data Prevista"
              name="dataPrevistaColeta"
              type="date"
              value={formData.dataPrevistaColeta}
              onChange={handleInputChange}
            />
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3">Entrega</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Endereço de Entrega"
              name="enderecoEntrega"
              value={formData.enderecoEntrega}
              onChange={handleInputChange}
              required
              className="md:col-span-3"
            />
            <Input
              label="Cidade"
              name="cidadeEntrega"
              value={formData.cidadeEntrega}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Estado"
              name="estadoEntrega"
              value={formData.estadoEntrega}
              onChange={handleInputChange}
              placeholder="SP"
              maxLength="2"
              required
            />
            <Input
              label="Data Prevista"
              name="dataPrevistaEntrega"
              type="date"
              value={formData.dataPrevistaEntrega}
              onChange={handleInputChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              options={[
                { value: 'Aguardando', label: 'Aguardando' },
                { value: 'Em Transporte', label: 'Em Transporte' },
                { value: 'Entregue', label: 'Entregue' },
                { value: 'Cancelada', label: 'Cancelada' },
              ]}
              required
            />
          </div>

          <div className="mb-4 mt-4">
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
              {editingCarga ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cargas;